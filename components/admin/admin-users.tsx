'use client'

import { useState } from 'react'
import { Search, Filter, User, Shield, ShieldOff, MoreVertical, Mail, Phone, Briefcase, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdmin } from '@/lib/admin-context'
import { AdminSidebar } from './admin-sidebar'

type FilterType = 'all' | 'job_seeker' | 'salon_owner'

export function AdminUsers() {
  const { users, toggleUserBlock } = useAdmin()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.phone.includes(searchQuery)
    const matchesFilter = filter === 'all' || user.role === filter
    return matchesSearch && matchesFilter
  })

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">View and manage all users</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-12 bg-secondary/50 border-border/50"
            />
          </div>
          
          {/* Filter Buttons */}
          <div className="flex gap-2">
            {(['all', 'job_seeker', 'salon_owner'] as FilterType[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                onClick={() => setFilter(f)}
                className={filter === f ? 'bg-primary' : ''}
              >
                {f === 'all' ? 'All' : f === 'job_seeker' ? 'Job Seekers' : 'Salon Owners'}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 glass-card rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </div>
          <div className="p-4 glass-card rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'job_seeker').length}</p>
                <p className="text-xs text-muted-foreground">Job Seekers</p>
              </div>
            </div>
          </div>
          <div className="p-4 glass-card rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'salon_owner').length}</p>
                <p className="text-xs text-muted-foreground">Salon Owners</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Users Table/List */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Desktop Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-secondary/30 text-sm font-medium text-muted-foreground">
            <div className="col-span-4">User</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Joined</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          
          {/* Users List */}
          <div className="divide-y divide-border/30">
            {filteredUsers.map((user, index) => (
              <div
                key={user.id}
                className="p-4 hover:bg-secondary/20 transition-colors animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* User Info */}
                  <div className="md:col-span-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      user.role === 'job_seeker' ? 'bg-blue-500/20' : 'bg-accent/20'
                    }`}>
                      {user.role === 'job_seeker' ? (
                        <Briefcase className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Building2 className="w-5 h-5 text-accent" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {user.phone}
                      </p>
                    </div>
                  </div>
                  
                  {/* Role */}
                  <div className="md:col-span-2">
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                      user.role === 'job_seeker' 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-accent/20 text-accent'
                    }`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>
                  
                  {/* Status */}
                  <div className="md:col-span-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.isSubscribed 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-secondary text-muted-foreground'
                    }`}>
                      {user.isSubscribed ? 'Subscribed' : 'Free'}
                    </span>
                  </div>
                  
                  {/* Joined Date */}
                  <div className="md:col-span-2 text-sm text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </div>
                  
                  {/* Actions */}
                  <div className="md:col-span-2 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleUserBlock(user.id)}
                      className={`flex items-center gap-2 ${
                        (user as any).isBlocked ? 'text-green-400' : 'text-destructive'
                      }`}
                    >
                      {(user as any).isBlocked ? (
                        <>
                          <Shield className="w-4 h-4" />
                          Unblock
                        </>
                      ) : (
                        <>
                          <ShieldOff className="w-4 h-4" />
                          Block
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <User className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No users found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
