'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Edit2, Trash2, Eye, EyeOff, Image } from 'lucide-react'

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

interface SceneListProps {
  scenes: Scene[]
  onEdit: (scene: Scene) => void
  onDelete: (sceneId: string) => Promise<void>
  onToggleActive: (sceneId: string, isActive: boolean) => Promise<void>
}

export function SceneList({ scenes, onEdit, onDelete, onToggleActive }: SceneListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    scene: Scene | null
  }>({ isOpen: false, scene: null })
  const [loading, setLoading] = useState<string | null>(null)

  const handleDelete = async (scene: Scene) => {
    setDeleteConfirm({ isOpen: true, scene })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.scene) return

    setLoading(`delete-${deleteConfirm.scene.id}`)
    try {
      await onDelete(deleteConfirm.scene.id)
    } catch (error) {
      console.error('Failed to delete scene:', error)
    } finally {
      setLoading(null)
      setDeleteConfirm({ isOpen: false, scene: null })
    }
  }

  const handleToggleActive = async (scene: Scene) => {
    setLoading(`toggle-${scene.id}`)
    try {
      await onToggleActive(scene.id, !scene.isActive)
    } catch (error) {
      console.error('Failed to toggle scene status:', error)
    } finally {
      setLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scene</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Cost</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-gray-500"
                    >
                      No scenes found. Create your first scene to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  scenes.map((scene) => (
                    <TableRow key={scene.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {scene.imageReference ? (
                              <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                                <Image className="h-4 w-4 text-gray-500" />
                              </div>
                            ) : (
                              <div className="h-8 w-8 rounded bg-gray-200"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {scene.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {scene.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-900 line-clamp-2">
                            {scene.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {scene.creditCost} {scene.creditCost === 1 ? 'credit' : 'credits'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={scene.isActive ? 'default' : 'secondary'}
                          className={
                            scene.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {scene.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-500">
                        {formatDate(scene.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(scene)}
                            disabled={loading === `toggle-${scene.id}`}
                            title={scene.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {scene.isActive ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(scene)}
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(scene)}
                            disabled={loading === `delete-${scene.id}`}
                            title="Delete"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) => !open && setDeleteConfirm({ isOpen: false, scene: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scene</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm.scene?.name}"? 
              {deleteConfirm.scene?.isActive && (
                <span className="block mt-2 text-amber-600">
                  ⚠️ This scene is currently active and visible to users.
                </span>
              )}
              <span className="block mt-2">
                If this scene has been used to process images, it will be deactivated instead of deleted to preserve data integrity.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}