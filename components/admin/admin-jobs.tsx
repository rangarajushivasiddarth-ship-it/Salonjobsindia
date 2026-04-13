'use client'

import { useState } from 'react'
import { Search, Edit2, Trash2, MapPin, DollarSign, Clock, Building2, Eye, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdmin } from '@/lib/admin-context'
import { AdminSidebar } from './admin-sidebar'

export function AdminJobs() {
  const { jobs, deleteJob } = useAdmin()
  const [searchQuery, setSearchQuery] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const filteredJobs = jobs.filter(job =>
    job.salonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location.area.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDelete = (jobId: string) => {
    deleteJob(jobId)
    setShowDeleteConfirm(null)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Job Management</h1>
          <p className="text-muted-foreground">View and manage all job postings</p>
        </div>
        
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search jobs, salons, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-12 bg-secondary/50 border-border/50"
            />
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 glass-card rounded-xl">
            <p className="text-2xl font-bold">{jobs.length}</p>
            <p className="text-sm text-muted-foreground">Total Jobs</p>
          </div>
          <div className="p-4 glass-card rounded-xl">
            <p className="text-2xl font-bold text-green-400">{jobs.filter(j => j.isActive).length}</p>
            <p className="text-sm text-muted-foreground">Active Jobs</p>
          </div>
          <div className="p-4 glass-card rounded-xl">
            <p className="text-2xl font-bold text-muted-foreground">{jobs.filter(j => !j.isActive).length}</p>
            <p className="text-sm text-muted-foreground">Inactive Jobs</p>
          </div>
        </div>
        
        {/* Jobs List */}
        <div className="space-y-4">
          {filteredJobs.map((job, index) => (
            <div
              key={job.id}
              className="p-6 glass-card rounded-2xl animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Job Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                      <Building2 className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-lg">{job.role}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          job.isActive ? 'bg-green-500/20 text-green-400' : 'bg-secondary text-muted-foreground'
                        }`}>
                          {job.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{job.salonName}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <span className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-primary/10 text-primary">
                      <DollarSign className="w-4 h-4" />
                      {job.salary}
                    </span>
                    <span className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-secondary text-foreground">
                      <Clock className="w-4 h-4" />
                      {job.experience}
                    </span>
                    <span className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-secondary text-foreground">
                      <MapPin className="w-4 h-4" />
                      {job.location.area}
                    </span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(job.id)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredJobs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center glass-card rounded-2xl">
              <Search className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No jobs found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your search</p>
            </div>
          )}
        </div>
      </main>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 glass-card rounded-2xl animate-scale-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-xl font-bold mb-2">Delete Job?</h3>
              <p className="text-muted-foreground mb-6">
                This action cannot be undone. The job posting will be permanently removed.
              </p>
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 h-12"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 h-12 bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
