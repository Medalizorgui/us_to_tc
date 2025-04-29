import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const client = await pool.connect()
    try {
      const result = await client.query(
        `SELECT * FROM test_suites 
         WHERE id = $1`,
        [id]
      )

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Test suite not found" },
          { status: 404 }
        )
      }

      return NextResponse.json(result.rows[0])
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error fetching test suite:', error)
    return NextResponse.json(
      { error: "Failed to fetch test suite" },
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
    const { name, parent_suite_id, details } = body

    const client = await pool.connect()
    try {
      const result = await client.query(
        `UPDATE test_suites 
         SET name = $1,
             parent_suite_id = $2,
             details = $3
         WHERE id = $4
         RETURNING *`,
        [name, parent_suite_id || null, details || null, id]
      )

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Test suite not found" },
          { status: 404 }
        )
      }

      return NextResponse.json(result.rows[0])
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error updating test suite:', error)
    return NextResponse.json(
      { error: "Failed to update test suite" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const client = await pool.connect()
    try {
      const result = await client.query(
        `DELETE FROM test_suites 
         WHERE id = $1
         RETURNING *`,
        [id]
      )

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Test suite not found" },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error deleting test suite:', error)
    return NextResponse.json(
      { error: "Failed to delete test suite" },
      { status: 500 }
    )
  }
} 