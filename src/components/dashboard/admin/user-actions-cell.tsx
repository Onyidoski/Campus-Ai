'use client'

import { useState } from 'react'
import { updateUserRole, deleteUserProfile } from '@/app/dashboard/admin/actions'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { toast } from 'sonner'
import { MoreHorizontal, Shield, GraduationCap, UserCheck, UserX, Trash2 } from 'lucide-react'

interface UserActionsCellProps {
  userId: string
  currentRole: string
  userName: string
}

export function UserActionsCell({ userId, currentRole, userName }: UserActionsCellProps) {
  const [loading, setLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleRoleChange = async (newRole: string) => {
    if (newRole === currentRole) return
    setLoading(true)

    const result = await updateUserRole(userId, newRole)

    setLoading(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(result.success)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    const result = await deleteUserProfile(userId)
    setLoading(false)
    setShowDeleteDialog(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(result.success)
    }
  }

  const roleOptions = [
    { value: 'student', label: 'Student', icon: GraduationCap, color: 'text-blue-600' },
    { value: 'lecturer', label: 'Lecturer', icon: UserCheck, color: 'text-violet-600' },
    { value: 'admin', label: 'Admin', icon: Shield, color: 'text-red-600' },
    { value: 'parent', label: 'Parent', icon: UserX, color: 'text-amber-600' },
  ]

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg transition-all"
            disabled={loading}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-xs text-gray-500">Change Role</DropdownMenuLabel>
          {roleOptions.map((role) => (
            <DropdownMenuItem
              key={role.value}
              onClick={() => handleRoleChange(role.value)}
              disabled={role.value === currentRole}
              className={`${role.value === currentRole ? 'bg-gray-50 font-medium' : ''}`}
            >
              <role.icon className={`mr-2 h-3.5 w-3.5 ${role.color}`} />
              {role.label}
              {role.value === currentRole && (
                <span className="ml-auto text-[10px] text-gray-400">Current</span>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Remove User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{userName}</strong> from the platform?
              This will delete their profile and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Removing...' : 'Remove User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
