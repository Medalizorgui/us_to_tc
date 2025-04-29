import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { use } from "react"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const client = await pool.connect()
    try {
      const result = await client.query(
        `SELECT tcr.*, tc.name, tc.description, tc.steps, tc.expected_results
         FROM test_case_runs tcr
         JOIN test_cases tc ON tcr.test_case_id = tc.id
         WHERE tcr.test_suite_run_id = $1
         ORDER BY tcr.started_at ASC`,
        [id]
      )

      return NextResponse.json(result.rows)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error fetching test case runs:', error)
    return NextResponse.json(
      { error: "Failed to fetch test case runs" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { 
      test_case_id,
      status,
      result,
      error_message,
      duration
    } = body

    const client = await pool.connect()
    try {
      // Start a transaction
      await client.query('BEGIN')

      // Update the test case run
      const updateResult = await client.query(
        `UPDATE test_case_runs
         SET status = $1,
             result = $2,
             error_message = $3,
             duration = $4,
             completed_at = CASE WHEN $1 IN ('passed', 'failed', 'error') THEN NOW() ELSE completed_at END
         WHERE test_suite_run_id = $5 AND test_case_id = $6
         RETURNING *`,
        [
          status,
          result,
          error_message,
          duration,
          id,
          test_case_id
        ]
      )

      if (updateResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Test case run not found" },
          { status: 404 }
        )
      }

      // Check if all test cases are completed
      const completedResult = await client.query(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN status IN ('passed', 'failed', 'error') THEN 1 ELSE 0 END) as completed
         FROM test_case_runs
         WHERE test_suite_run_id = $1`,
        [id]
      )

      const { total, completed } = completedResult.rows[0]

      // If all test cases are completed, update the test suite run status
      if (total === completed) {
        const suiteStatus = await client.query(
          `SELECT 
             COUNT(*) FILTER (WHERE status = 'failed') as failed,
             COUNT(*) FILTER (WHERE status = 'error') as error
           FROM test_case_runs
           WHERE test_suite_run_id = $1`,
          [id]
        )

        const { failed, error } = suiteStatus.rows[0]
        const finalStatus = error > 0 ? 'error' : failed > 0 ? 'failed' : 'passed'

        await client.query(
          `UPDATE test_suite_runs
           SET status = $1,
               completed_at = NOW()
           WHERE id = $2`,
          [finalStatus, id]
        )
      }

      // Commit the transaction
      await client.query('COMMIT')

      return NextResponse.json(updateResult.rows[0])
    } catch (error) {
      // Rollback the transaction on error
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error updating test case run:', error)
    return NextResponse.json(
      { error: "Failed to update test case run" },
      { status: 500 }
    )
  }
} 