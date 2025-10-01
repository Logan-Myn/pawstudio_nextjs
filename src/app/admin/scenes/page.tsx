'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, RefreshCw, AlertTriangle } from 'lucide-react'
import { SceneList } from '@/components/admin/scene-list'
import { SceneForm } from '@/components/admin/scene-form'
import { useAuthStore } from '@/lib/store/auth'

interface Scene {
  id: string
  name: string
  description: string
  creditCost: number
  isActive: boolean
  promptTemplate: string
  imageReference?: string | null
  createdAt: string
}

export default function ScenesPage() {
  const { user } = useAuthStore()
  const [scenes, setScenes] = useState<Scene[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState<{
    isOpen: boolean
    editScene: Scene | null
  }>({ isOpen: false, editScene: null })

  useEffect(() => {
    fetchScenes()
  }, [])

  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json'
    }
  }

  const fetchScenes = async () => {
    try {
      setLoading(true)
      setError(null)

      const headers = getAuthHeaders()
      const response = await fetch('/api/admin/scenes', { headers })

      if (!response.ok) {
        throw new Error('Failed to fetch scenes')
      }

      const data = await response.json()
      setScenes(data.scenes || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scenes')
      console.error('Error fetching scenes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateScene = () => {
    setFormState({ isOpen: true, editScene: null })
  }

  const handleEditScene = (scene: Scene) => {
    setFormState({ isOpen: true, editScene: scene })
  }

  const handleFormClose = () => {
    setFormState({ isOpen: false, editScene: null })
  }

  const handleSaveScene = async (sceneData: Omit<Scene, 'id' | 'createdAt'>) => {
    try {
      const url = formState.editScene
        ? `/api/admin/scenes/${formState.editScene.id}`
        : '/api/admin/scenes'

      const method = formState.editScene ? 'PUT' : 'POST'

      const headers = await getAuthHeaders()
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(sceneData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save scene')
      }

      const result = await response.json()
      
      if (formState.editScene) {
        // Update existing scene
        setScenes(prev => prev.map(s => 
          s.id === formState.editScene!.id ? result.scene : s
        ))
      } else {
        // Add new scene
        setScenes(prev => [result.scene, ...prev])
      }

      setFormState({ isOpen: false, editScene: null })
    } catch (err) {
      console.error('Error saving scene:', err)
      throw err
    }
  }

  const handleDeleteScene = async (sceneId: string) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/admin/scenes/${sceneId}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete scene')
      }

      const result = await response.json()
      
      // If scene was deactivated instead of deleted, update the list
      if (result.message?.includes('deactivated')) {
        const updatedScene = scenes.find(s => s.id === sceneId)
        if (updatedScene) {
          setScenes(prev => prev.map(s => 
            s.id === sceneId ? { ...s, isActive: false } : s
          ))
        }
      } else {
        // Scene was actually deleted
        setScenes(prev => prev.filter(s => s.id !== sceneId))
      }
    } catch (err) {
      console.error('Error deleting scene:', err)
      throw err
    }
  }

  const handleToggleActive = async (sceneId: string, isActive: boolean) => {
    try {
      const scene = scenes.find(s => s.id === sceneId)
      if (!scene) return

      const headers = await getAuthHeaders()
      const response = await fetch(`/api/admin/scenes/${sceneId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          ...scene,
          isActive
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update scene')
      }

      const result = await response.json()
      setScenes(prev => prev.map(s => 
        s.id === sceneId ? result.scene : s
      ))
    } catch (err) {
      console.error('Error updating scene status:', err)
      throw err
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scene Management</h1>
          <p className="mt-2 text-gray-600">
            Manage AI filter scenes available to users for image processing
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={fetchScenes}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreateScene}>
            <Plus className="h-4 w-4 mr-2" />
            Add Scene
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center space-x-2 py-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchScenes}
              className="ml-auto"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Scenes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scenes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Active Scenes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {scenes.filter(s => s.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Inactive Scenes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {scenes.filter(s => !s.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scenes Table */}
      <div>
        <SceneList
          scenes={scenes}
          onEdit={handleEditScene}
          onDelete={handleDeleteScene}
          onToggleActive={handleToggleActive}
        />
      </div>

      {/* Scene Form Modal */}
      <SceneForm
        scene={formState.editScene}
        isOpen={formState.isOpen}
        onClose={handleFormClose}
        onSave={handleSaveScene}
      />
    </div>
  )
}