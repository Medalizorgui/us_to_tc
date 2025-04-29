"use client"

import { useState, useEffect } from "react"
import { Plus, Check, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UserStoryForm } from "@/app/user-stories/user-story-form"
import { UserStoryCard } from "@/app/user-stories/user-story-card"
import type { UserStory } from "@/app/user-stories/types"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProjectUserStoriesPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [userStories, setUserStories] = useState<UserStory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStories, setSelectedStories] = useState<string[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentUserStory, setCurrentUserStory] = useState<UserStory | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<string>("updated_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [alert, setAlert] = useState<{ title: string; description: string; variant?: "default" | "destructive" } | null>(null)
  const [activeTab, setActiveTab] = useState<"on_hold" | "validated">("on_hold")

  useEffect(() => {
    const fetchUserStories = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/user-stories?project_id=${projectId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch user stories')
        }
        const data = await response.json()
        setUserStories(data)
      } catch (error) {
        console.error('Error fetching user stories:', error)
        setAlert({
          title: "Error",
          description: "Failed to fetch user stories. Please try again later.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserStories()
  }, [projectId])

  // Filter and sort user stories
  const filteredUserStories = userStories
    .filter(
      (story) =>
        story.project_id === projectId &&
        story.status === activeTab &&
        (searchQuery === "" ||
          story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          story.description.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    .sort((a, b) => {
      const fieldA = a[sortField as keyof UserStory]
      const fieldB = b[sortField as keyof UserStory]

      if (typeof fieldA === "string" && typeof fieldB === "string") {
        return sortDirection === "asc" ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA)
      }

      // For dates
      if (sortField === "created_at" || sortField === "updated_at") {
        const dateA = new Date(fieldA as string).getTime()
        const dateB = new Date(fieldB as string).getTime()
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA
      }

      return 0
    })

  const handleCreateUserStory = async (newUserStory: Omit<UserStory, "id" | "created_at" | "updated_at">) => {
    try {
      const response = await fetch('/api/user-stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUserStory),
      })

      if (!response.ok) {
        throw new Error('Failed to create user story')
      }

      const createdStory = await response.json()
      setUserStories([...userStories, createdStory])
      setIsCreateDialogOpen(false)
      setAlert({
        title: "User Story Created",
        description: "The user story has been successfully created.",
      })
    } catch (error) {
      console.error('Error creating user story:', error)
      setAlert({
        title: "Error",
        description: "Failed to create user story. Please try again later.",
        variant: "destructive"
      })
    }
  }

  const handleUpdateUserStory = async (updatedUserStory: UserStory | Omit<UserStory, "id" | "created_at" | "updated_at">) => {
    if (!('id' in updatedUserStory)) {
      return
    }

    try {
      const response = await fetch('/api/user-stories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUserStory),
      })

      if (!response.ok) {
        throw new Error('Failed to update user story')
      }

      const updatedStory = await response.json()
      setUserStories(
        userStories.map((story) =>
          story.id === updatedStory.id ? updatedStory : story,
        ),
      )
      setIsEditDialogOpen(false)
      setCurrentUserStory(null)
      setAlert({
        title: "User Story Updated",
        description: "The user story has been successfully updated.",
      })
    } catch (error) {
      console.error('Error updating user story:', error)
      setAlert({
        title: "Error",
        description: "Failed to update user story. Please try again later.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteUserStory = async (id: string) => {
    try {
      const response = await fetch(`/api/user-stories?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete user story')
      }

      setUserStories(userStories.filter((story) => story.id !== id))
      setSelectedStories(selectedStories.filter((storyId) => storyId !== id))
      setAlert({
        title: "User Story Deleted",
        description: "The user story has been successfully deleted.",
      })
    } catch (error) {
      console.error('Error deleting user story:', error)
      setAlert({
        title: "Error",
        description: "Failed to delete user story. Please try again later.",
        variant: "destructive"
      })
    }
  }

  const handleValidateUserStory = async (id: string) => {
    try {
      const story = userStories.find(s => s.id === id)
      if (!story) return

      const response = await fetch('/api/user-stories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...story,
          status: 'validated',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to validate user story')
      }

      const updatedStory = await response.json()
      setUserStories(
        userStories.map((story) =>
          story.id === updatedStory.id ? updatedStory : story,
        ),
      )
      setAlert({
        title: "User Story Validated",
        description: "The user story has been marked as validated.",
      })
    } catch (error) {
      console.error('Error validating user story:', error)
      setAlert({
        title: "Error",
        description: "Failed to validate user story. Please try again later.",
        variant: "destructive"
      })
    }
  }

  const handleValidateSelected = async () => {
    if (selectedStories.length === 0) {
      setAlert({
        title: "No Stories Selected",
        description: "Please select at least one user story to validate.",
        variant: "destructive",
      })
      return
    }

    try {
      const validationPromises = selectedStories.map(id => {
        const story = userStories.find(s => s.id === id)
        if (!story) return null

        return fetch('/api/user-stories', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...story,
            status: 'validated',
          }),
        })
      })

      const responses = await Promise.all(validationPromises.filter(Boolean))
      const allSuccessful = responses.every(response => response?.ok)

      if (!allSuccessful) {
        throw new Error('Failed to validate some user stories')
      }

      const updatedStories = await Promise.all(
        responses.map(response => response?.json())
      )

      setUserStories(
        userStories.map((story) => {
          const updatedStory = updatedStories.find(s => s.id === story.id)
          return updatedStory || story
        }),
      )
      setAlert({
        title: "User Stories Validated",
        description: `${selectedStories.length} user stories have been marked as validated.`,
      })
      setSelectedStories([])
    } catch (error) {
      console.error('Error validating user stories:', error)
      setAlert({
        title: "Error",
        description: "Failed to validate user stories. Please try again later.",
        variant: "destructive"
      })
    }
  }

  const handleSelectStory = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedStories([...selectedStories, id])
    } else {
      setSelectedStories(selectedStories.filter((storyId) => storyId !== id))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStories(filteredUserStories.map((story) => story.id))
    } else {
      setSelectedStories([])
    }
  }

  const handleEditClick = (story: UserStory) => {
    setCurrentUserStory(story)
    setIsEditDialogOpen(true)
  }

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  return (
    <div className="container mx-auto py-8">
      {alert && (
        <Alert className="mb-4" variant={alert.variant}>
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>{alert.description}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-4">
            <Link href={`/projects/${projectId}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to project
            </Link>
            <div>
              <h1 className="text-3xl font-bold">User Stories</h1>
              <p className="text-muted-foreground">Manage and track your project user stories</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleValidateSelected} disabled={selectedStories.length === 0}>
            <Check className="mr-2 h-4 w-4" />
            Validate Selected ({selectedStories.length})
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New User Story
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New User Story</DialogTitle>
                <DialogDescription>Fill in the details to create a new user story for your project.</DialogDescription>
              </DialogHeader>
              <UserStoryForm 
                onSubmit={handleCreateUserStory} 
                userStory={{ project_id: projectId, status: "on_hold" } as UserStory} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search user stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as "on_hold" | "validated")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="on_hold">On Hold</TabsTrigger>
          <TabsTrigger value="validated">Validated</TabsTrigger>
        </TabsList>
        <TabsContent value="on_hold" className="mt-4">
          <div className="grid gap-4">
            {isLoading ? (
              <div className="text-center py-8">Loading user stories...</div>
            ) : filteredUserStories.length === 0 ? (
              <div className="text-center py-8">No on hold user stories found.</div>
            ) : (
              filteredUserStories.map((story) => (
                <UserStoryCard
                  key={story.id}
                  story={story}
                  onEdit={() => handleEditClick(story)}
                  onDelete={() => handleDeleteUserStory(story.id)}
                  onValidate={() => handleValidateUserStory(story.id)}
                  onSelect={(checked) => handleSelectStory(story.id, checked)}
                  isSelected={selectedStories.includes(story.id)}
                />
              ))
            )}
          </div>
        </TabsContent>
        <TabsContent value="validated" className="mt-4">
          <div className="grid gap-4">
            {isLoading ? (
              <div className="text-center py-8">Loading user stories...</div>
            ) : filteredUserStories.length === 0 ? (
              <div className="text-center py-8">No validated user stories found.</div>
            ) : (
              filteredUserStories.map((story) => (
                <UserStoryCard
                  key={story.id}
                  story={story}
                  onEdit={() => handleEditClick(story)}
                  onDelete={() => handleDeleteUserStory(story.id)}
                  onValidate={() => handleValidateUserStory(story.id)}
                  onSelect={(checked) => handleSelectStory(story.id, checked)}
                  isSelected={selectedStories.includes(story.id)}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User Story</DialogTitle>
            <DialogDescription>Update the details of your user story.</DialogDescription>
          </DialogHeader>
          {currentUserStory && (
            <UserStoryForm
              onSubmit={handleUpdateUserStory}
              userStory={currentUserStory}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 