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
        `SELECT * FROM test_suite_runs
         WHERE test_suite_id = $1
         ORDER BY started_at DESC`,
        [id]
      )

      return NextResponse.json(result.rows)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error fetching test suite runs:', error)
    return NextResponse.json(
      { error: "Failed to fetch test suite runs" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { 
      environment,
      trigger_type,
      trigger_details,
      test_cases
    } = body

    const client = await pool.connect()
    try {
      // Start a transaction
      await client.query('BEGIN')

      // Create the test suite run
      const runResult = await client.query(
        `INSERT INTO test_suite_runs (
          test_suite_id,
          environment,
          trigger_type,
          trigger_details,
          status,
          started_at
         ) VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [
          id,
          environment,
          trigger_type,
          trigger_details || {},
          'running'
        ]
      )

      const runId = runResult.rows[0].id

      // Create test case runs for each test case
      if (test_cases && test_cases.length > 0) {
        const testCaseValues = test_cases.map((testCaseId: string) => 
          `(${runId}, ${testCaseId}, 'pending', NOW())`
        ).join(',')

        await client.query(
          `INSERT INTO test_case_runs (
            test_suite_run_id,
            test_case_id,
            status,
            started_at
           ) VALUES ${testCaseValues}`
        )
      }

      // Commit the transaction
      await client.query('COMMIT')

      return NextResponse.json(runResult.rows[0])
    } catch (error) {
      // Rollback the transaction on error
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error creating test suite run:', error)
    return NextResponse.json(
      { error: "Failed to create test suite run" },
      { status: 500 }
    )
  }
} 