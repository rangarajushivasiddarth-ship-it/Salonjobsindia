'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Building2, User, Phone, Briefcase, DollarSign, Clock, Heart, HeartOff, Filter, ChevronRight, Navigation, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApp } from '@/lib/app-context'
import { getAllJobs } from '@/lib/data-store'
import type { Job } from '@/lib/types'

export function JobResults() {
  const { user, savedJobs, appliedJobs, saveJob, unsaveJob, applyToJob, goToStep } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])

  // Load real jobs from data store
  useEffect(() => {
    const realJobs = getAllJobs().filter(job => job.isActive && job.status === 'live')
    setJobs(realJobs)
  }, [])

  const filteredJobs = jobs.filter(job =>
    job.salonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location.area.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isJobSaved = (jobId: string) => savedJobs.includes(jobId)
  const isJobApplied = (jobId: string) => appliedJobs.includes(jobId)

  const getDistance = () => {
    // In production, calculate actual distance from user location
    return `${(Math.random() * 15 + 2).toFixed(1)} km away`
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden pb-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      {/* Header */}
      <header className="relative z-10 p-4 glass">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">Job Results</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              Showing salons within 20 km
            </p>
          </div>
          <button 
            onClick={() => goToStep('profile')}
            className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"
          >
            <User className="w-5 h-5 text-primary" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search jobs, salons, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-12 pr-12 bg-secondary/50 border-border/50"
          />
          <button className="absolute right-4 top-1/2 -translate-y-1/2">
            <Filter className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>
      
      {/* Results Count */}
      <div className="relative z-10 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Found <span className="text-primary font-semibold">{filteredJobs.length}</span> jobs near you
        </p>
      </div>
      
      {/* Job List */}
      <div className="relative z-10 flex-1 px-4 pb-4 overflow-y-auto">
        <div className="space-y-4">
          {filteredJobs.map((job, index) => (
            <button
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className="w-full p-5 glass-card rounded-2xl text-left transition-all duration-300 hover:scale-[1.01] animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{job.salonName}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {getDistance()} · {job.location.area}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    isJobSaved(job.id) ? unsaveJob(job.id) : saveJob(job.id)
                  }}
                  className="p-2"
                >
                  {isJobSaved(job.id) ? (
                    <Heart className="w-5 h-5 text-accent fill-accent" />
                  ) : (
                    <Heart className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>
              
              <div className="mb-3">
                <h4 className="font-semibold text-lg text-primary">{job.role}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-full bg-primary/10 text-primary">
                  <DollarSign className="w-3 h-3" />
                  {job.salary}
                </span>
                <span className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-full bg-secondary/80 text-foreground">
                  <Clock className="w-3 h-3" />
                  {job.experience}
                </span>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-border/30">
                <a
                  href={`tel:${job.contact}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Phone className="w-4 h-4" />
                  {job.contact}
                </a>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
        
        {filteredJobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No jobs found</h3>
            <p className="text-sm text-muted-foreground">Try a different search term</p>
          </div>
        )}
      </div>
      
      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full md:max-w-lg md:rounded-2xl bg-card glass-card rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* Header Image */}
            <div className="relative h-32 bg-gradient-to-br from-primary/30 to-accent/30">
              <button
                onClick={() => setSelectedJob(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/80 flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5 rotate-90" />
              </button>
              <div className="absolute -bottom-8 left-6">
                <div className="w-16 h-16 rounded-xl bg-card glass flex items-center justify-center gold-glow">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 pt-12">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedJob.salonName}</h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {getDistance()} · {selectedJob.location.address}
                  </p>
                </div>
                <button
                  onClick={() => isJobSaved(selectedJob.id) ? unsaveJob(selectedJob.id) : saveJob(selectedJob.id)}
                >
                  {isJobSaved(selectedJob.id) ? (
                    <Heart className="w-6 h-6 text-accent fill-accent" />
                  ) : (
                    <Heart className="w-6 h-6 text-muted-foreground" />
                  )}
                </button>
              </div>
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-primary mb-2">{selectedJob.role}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-primary/10 text-primary">
                    <DollarSign className="w-4 h-4" />
                    {selectedJob.salary}
                  </span>
                  <span className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-secondary/80 text-foreground">
                    <Clock className="w-4 h-4" />
                    {selectedJob.experience}
                  </span>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold mb-2">Job Description</h4>
                <p className="text-muted-foreground">{selectedJob.description}</p>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold mb-2">Contact</h4>
                <a
                  href={`tel:${selectedJob.contact}`}
                  className="flex items-center gap-3 p-4 bg-secondary/30 rounded-xl"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedJob.contact}</p>
                    <p className="text-xs text-muted-foreground">Tap to call</p>
                  </div>
                </a>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedJob(null)}
                  className="flex-1 h-14"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    applyToJob(selectedJob.id)
                    setSelectedJob(null)
                  }}
                  disabled={isJobApplied(selectedJob.id)}
                  className="flex-1 h-14 bg-primary hover:bg-primary/90 gold-glow"
                >
                  {isJobApplied(selectedJob.id) ? 'Applied' : 'Apply Now'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
