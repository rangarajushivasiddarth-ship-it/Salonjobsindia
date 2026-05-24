'use client'

import { GraduationCap, Clock, Star, Award, PlayCircle, BookOpen, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/lib/app-context'
import Image from 'next/image'

const UPCOMING_COURSES = [
  {
    id: '1',
    title: 'Advanced Hair Styling',
    description: 'Master cutting, coloring & styling techniques',
    duration: '8 weeks',
    level: 'Intermediate',
    icon: '💇',
  },
  {
    id: '2',
    title: 'Bridal Makeup Masterclass',
    description: 'Complete bridal makeup from basics to advanced',
    duration: '6 weeks',
    level: 'All Levels',
    icon: '💄',
  },
  {
    id: '3',
    title: 'Nail Art Professional',
    description: 'Gel, acrylic & nail art design techniques',
    duration: '4 weeks',
    level: 'Beginner',
    icon: '💅',
  },
  {
    id: '4',
    title: 'Spa & Wellness Therapy',
    description: 'Body massage, facials & spa treatments',
    duration: '10 weeks',
    level: 'Intermediate',
    icon: '🧖',
  },
  {
    id: '5',
    title: 'Salon Business Management',
    description: 'Run your own salon successfully',
    duration: '5 weeks',
    level: 'Advanced',
    icon: '📊',
  },
]

export function TrainingScreen() {
  const { user } = useApp()

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden pb-20">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-background via-background to-background/95 -z-10" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-40 left-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl" />

      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-border/30">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Training</h1>
              <p className="text-xs text-muted-foreground">Upgrade your skills</p>
            </div>
          </div>
          
          {/* Salon Jobs India Logo */}
          <div className="relative w-16 h-16">
            <Image
              src="/images/logo.png"
              alt="Salon Jobs India"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 space-y-6">
        
        {/* Coming Soon Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 border border-primary/20 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Coming Soon</span>
            </div>
            
            <h2 className="text-2xl font-bold mb-2">All Packages Updating Soon</h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              We&apos;re preparing premium training courses to help you become a certified beauty professional.
            </p>
            
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">15+</div>
                <div className="text-xs text-muted-foreground">Courses</div>
              </div>
              <div className="w-px h-8 bg-border/50" />
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">50+</div>
                <div className="text-xs text-muted-foreground">Hours</div>
              </div>
              <div className="w-px h-8 bg-border/50" />
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">100%</div>
                <div className="text-xs text-muted-foreground">Certified</div>
              </div>
            </div>
          </div>
        </div>

        {/* Notify Me Section */}
        <div className="p-4 glass-card rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold">Get Notified</h3>
              <p className="text-xs text-muted-foreground">Be the first to know when courses launch</p>
            </div>
          </div>
          <Button className="w-full h-12 bg-primary hover:bg-primary/90">
            Notify Me When Available
          </Button>
        </div>

        {/* Preview of Upcoming Courses */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Upcoming Courses</h3>
            <span className="text-xs text-muted-foreground">Preview</span>
          </div>
          
          <div className="space-y-3">
            {UPCOMING_COURSES.map((course) => (
              <div
                key={course.id}
                className="p-4 glass-card rounded-xl border border-border/30 opacity-80"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center text-2xl">
                    {course.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm truncate">{course.title}</h4>
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary whitespace-nowrap">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {course.level}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Why Train With FITONE?</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 glass-card rounded-xl text-center">
              <Award className="w-8 h-8 text-primary mx-auto mb-2" />
              <h4 className="font-medium text-sm">Certified Courses</h4>
              <p className="text-xs text-muted-foreground">Industry recognized certificates</p>
            </div>
            <div className="p-4 glass-card rounded-xl text-center">
              <PlayCircle className="w-8 h-8 text-accent mx-auto mb-2" />
              <h4 className="font-medium text-sm">Learn Anytime</h4>
              <p className="text-xs text-muted-foreground">Video lessons on demand</p>
            </div>
            <div className="p-4 glass-card rounded-xl text-center">
              <BookOpen className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h4 className="font-medium text-sm">Expert Trainers</h4>
              <p className="text-xs text-muted-foreground">Learn from the best</p>
            </div>
            <div className="p-4 glass-card rounded-xl text-center">
              <Star className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <h4 className="font-medium text-sm">Job Placement</h4>
              <p className="text-xs text-muted-foreground">Get hired after training</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
