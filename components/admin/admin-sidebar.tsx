'use client'

import { LayoutDashboard, CreditCard, Users, Briefcase, Settings, LogOut, Scissors, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAdmin } from '@/lib/admin-context'

export function AdminSidebar() {
  const { currentView, goToView, logout, stats } = useAdmin()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'payments', label: 'Payments', icon: CreditCard, badge: stats.pendingApprovals },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Scissors className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg">SalonJobs</h1>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </div>
      
      {/* Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => {
                  goToView(item.id as any)
                  setIsMobileOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                  currentView === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`ml-auto px-2 py-0.5 text-xs rounded-full ${
                    currentView === item.id 
                      ? 'bg-primary-foreground/20 text-primary-foreground' 
                      : 'bg-accent/20 text-accent'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Logout */}
      <div className="p-4 border-t border-border/50">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Log Out</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 p-4 glass">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Scissors className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold">SalonJobs Admin</span>
          </div>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 hover:bg-secondary/50 rounded-lg"
          >
            {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 glass flex flex-col transform transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 glass flex-col border-r border-border/50">
        <SidebarContent />
      </aside>
      
      {/* Mobile spacing */}
      <div className="lg:hidden h-20" />
    </>
  )
}
