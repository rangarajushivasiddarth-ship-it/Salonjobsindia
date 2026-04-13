'use client'

import { Users, CreditCard, Briefcase, Clock, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useAdmin } from '@/lib/admin-context'
import { AdminSidebar } from './admin-sidebar'

export function AdminDashboard() {
  const { stats, pendingPayments, users, jobs } = useAdmin()

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      change: '+12%',
      isPositive: true,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      title: 'Active Subscriptions',
      value: stats.activeSubscriptions.toLocaleString(),
      change: '+8%',
      isPositive: true,
      icon: CreditCard,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      title: 'Total Jobs',
      value: stats.totalJobs.toLocaleString(),
      change: '+15%',
      isPositive: true,
      icon: Briefcase,
      color: 'text-primary',
      bgColor: 'bg-primary/20',
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals.toString(),
      change: '-3',
      isPositive: false,
      icon: Clock,
      color: 'text-accent',
      bgColor: 'bg-accent/20',
    },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Dashboard Overview</h1>
          <p className="text-muted-foreground">Welcome back, Admin</p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div
              key={stat.title}
              className="p-6 glass-card rounded-2xl animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${stat.isPositive ? 'text-green-400' : 'text-accent'}`}>
                  {stat.isPositive ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </div>
          ))}
        </div>
        
        {/* Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Payments */}
          <div className="p-6 glass-card rounded-2xl animate-slide-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Payments</h2>
              <span className="px-2 py-1 text-xs rounded-full bg-accent/20 text-accent">
                {pendingPayments.length} pending
              </span>
            </div>
            
            <div className="space-y-3">
              {pendingPayments.slice(0, 3).map((payment) => {
                const user = users.find(u => u.id === payment.userId)
                const timeAgo = Math.floor((Date.now() - new Date(payment.createdAt).getTime()) / (1000 * 60 * 60))
                
                return (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{user?.email || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{timeAgo}h ago</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400 capitalize">
                      {payment.status}
                    </span>
                  </div>
                )
              })}
              
              {pendingPayments.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No pending payments</p>
              )}
            </div>
          </div>
          
          {/* Recent Jobs */}
          <div className="p-6 glass-card rounded-2xl animate-slide-up" style={{ animationDelay: '500ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Jobs</h2>
              <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">
                {jobs.filter(j => j.isActive).length} active
              </span>
            </div>
            
            <div className="space-y-3">
              {jobs.slice(0, 3).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{job.role}</p>
                      <p className="text-xs text-muted-foreground">{job.salonName}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    job.isActive ? 'bg-green-500/20 text-green-400' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {job.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* User Distribution */}
        <div className="mt-6 p-6 glass-card rounded-2xl animate-slide-up" style={{ animationDelay: '600ms' }}>
          <h2 className="text-lg font-semibold mb-4">User Distribution</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Job Seekers</span>
                  <span className="font-semibold">{users.filter(u => u.role === 'job_seeker').length}</span>
                </div>
                <div className="h-3 bg-secondary/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(users.filter(u => u.role === 'job_seeker').length / users.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Salon Owners</span>
                  <span className="font-semibold">{users.filter(u => u.role === 'salon_owner').length}</span>
                </div>
                <div className="h-3 bg-secondary/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${(users.filter(u => u.role === 'salon_owner').length / users.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
