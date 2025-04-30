"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CreateTestSuiteDialog } from "./create-test-suite-dialog"
import Link from "next/link"

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
  const [childSuites, setChildSuites] = useState<TestSuite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedSuite, setEditedSuite] = useState<Partial<TestSuite> | null>(null)
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const testSuiteId = params.testSuiteId as string

  useEffect(() => {
    const fetchTestSuite = async () => {
      try {
        const [suiteResponse, childrenResponse] = await Promise.all([
          fetch(`/api/test-suites/${testSuiteId}`),
          fetch(`/api/test-suites/${testSuiteId}/children`)
        ])

        if (!suiteResponse.ok) {
          throw new Error('Failed to fetch test suite')
        }
        if (!childrenResponse.ok) {
          throw new Error('Failed to fetch child test suites')
        }

        const suiteData = await suiteResponse.json()
        const childrenData = await childrenResponse.json()

        setTestSuite(suiteData)
        setEditedSuite(suiteData)
        setChildSuites(childrenData)
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
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          className="w-fit"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
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

      {childSuites.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Child Test Suites</h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {childSuites.map((suite) => (
              <Link key={suite.id} href={`/projects/${projectId}/test-suites/${suite.id}`} className="group">
                <Card className="h-full transition-all hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="group-hover:text-primary">{suite.name}</CardTitle>
                    <CardDescription>{suite.details}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      Created on {new Date(suite.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
