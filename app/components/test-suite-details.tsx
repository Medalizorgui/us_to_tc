"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CreateTestSuiteDialog } from "./create-test-suite-dialog"

interface TestSuite {
  id: string
  name: string
  project_id: string
  parent_suite_id: string | null
  details: string | null
  created_at: string
}

export function TestSuiteDetails() {
  const [testSuite, setTestSuite] = useState<TestSuite | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedSuite, setEditedSuite] = useState<Partial<TestSuite> | null>(null)
  const params = useParams()
  const projectId = params.id as string
  const testSuiteId = params.testSuiteId as string

  useEffect(() => {
    const fetchTestSuite = async () => {
      try {
        const response = await fetch(`/api/test-suites/${testSuiteId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch test suite')
        }
        const data = await response.json()
        setTestSuite(data)
        setEditedSuite(data)
      } catch (error) {
        console.error('Error fetching test suite:', error)
        setError("Failed to fetch test suite")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTestSuite()
  }, [testSuiteId])

  const handleSave = async () => {
    if (!editedSuite) return

    try {
      const response = await fetch(`/api/test-suites/${testSuiteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedSuite),
      })

      if (!response.ok) {
        throw new Error('Failed to update test suite')
      }

      const updatedSuite = await response.json()
      setTestSuite(updatedSuite)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating test suite:', error)
      setError("Failed to update test suite")
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this test suite?')) return

    try {
      const response = await fetch(`/api/test-suites/${testSuiteId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete test suite')
      }

      window.location.href = `/projects/${projectId}/test-suites`
    } catch (error) {
      console.error('Error deleting test suite:', error)
      setError("Failed to delete test suite")
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-muted-foreground">Loading test suite details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-destructive">{error}</div>
      </div>
    )
  }

  if (!testSuite) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-muted-foreground">Test suite not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{testSuite.name}</h2>
          <p className="text-muted-foreground">
            Created on {new Date(testSuite.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <CreateTestSuiteDialog parentSuiteId={testSuite.id} />
          <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
            <Edit className="mr-2 h-4 w-4" />
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Suite Details</CardTitle>
          <CardDescription>Manage your test suite information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={editedSuite?.name || ''}
                  onChange={(e) => setEditedSuite({ ...editedSuite, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Details</label>
                <Textarea
                  value={editedSuite?.details || ''}
                  onChange={(e) => setEditedSuite({ ...editedSuite, details: e.target.value })}
                />
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <div className="text-sm font-medium">Name</div>
                <div className="text-sm text-muted-foreground">{testSuite.name}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Details</div>
                <div className="text-sm text-muted-foreground">{testSuite.details || 'No details provided'}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Type</div>
                <div className="text-sm text-muted-foreground">
                  {testSuite.parent_suite_id ? 'Child suite' : 'Root suite'}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
