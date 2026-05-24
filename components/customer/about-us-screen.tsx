'use client'

import { ArrowLeft, Building2, Users, MapPin, Phone, Mail, Globe, Award, Shield, Heart, Star, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/lib/app-context'
import Image from 'next/image'

export function AboutUsScreen() {
  const { goToStep, user } = useApp()
  const isOwner = user?.role === 'salon_owner' || user?.role === 'employer'

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden pb-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      {/* Header */}
      <header className="relative z-10 p-4 glass flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goToStep(isOwner ? 'owner-panel' : 'discovery')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        {/* Logo */}
        <div className="relative w-12 h-12">
          <Image
            src="/images/logo.png"
            alt="Salon Jobs India"
            fill
            className="object-contain"
          />
        </div>
        <h1 className="font-bold text-lg">About Us</h1>
      </header>
      
      {/* Content */}
      <div className="relative z-10 flex-1 px-4 py-6 overflow-y-auto">
        {/* Hero Section */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <Image
              src="/images/logo.png"
              alt="Salon Jobs India"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold mb-2">Salon Jobs India</h1>
          <p className="text-primary font-medium mb-2">A Division of Fitonze Private Limited</p>
          <p className="text-muted-foreground text-sm">
            India&apos;s Premier Salon Job Marketplace
          </p>
        </div>
        
        {/* About Card */}
        <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Who We Are
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Salon Jobs India is India&apos;s leading platform connecting talented beauty professionals 
            with top salons across the country. We bridge the gap between skilled job seekers and 
            salon owners looking for the perfect team members.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Founded with a vision to revolutionize the beauty industry recruitment, we provide a 
            seamless, transparent, and efficient hiring experience for both employers and job seekers.
          </p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">500+</p>
            <p className="text-xs text-muted-foreground">Salons</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">1000+</p>
            <p className="text-xs text-muted-foreground">Job Seekers</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">50+</p>
            <p className="text-xs text-muted-foreground">Cities</p>
          </div>
        </div>
        
        {/* Why Choose Us */}
        <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Why Choose Us
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Verified Listings</h3>
                <p className="text-xs text-muted-foreground">All salon listings are verified for authenticity</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Location Based</h3>
                <p className="text-xs text-muted-foreground">Find jobs near your location with distance filters</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Quick Connect</h3>
                <p className="text-xs text-muted-foreground">Instant WhatsApp and call connection with salon owners</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Dedicated Support</h3>
                <p className="text-xs text-muted-foreground">Our team is always here to help you succeed</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Services */}
        <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: '250ms' }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Our Services
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Job Listings for Beauty Professionals</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Salon Recruitment Solutions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Resume Building for Job Seekers</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Direct Communication Channel</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Pan-India Coverage</span>
            </div>
          </div>
        </div>
        
        {/* Contact Information */}
        <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Contact Us
          </h2>
          <div className="space-y-4">
            <a 
              href="tel:+919100609609" 
              className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-sm">Phone</p>
                <p className="text-xs text-muted-foreground">+91 9100609609</p>
              </div>
            </a>
            <a 
              href="mailto:support@salonjobsindia.com"
              className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-sm">Email</p>
                <p className="text-xs text-muted-foreground">support@salonjobsindia.com</p>
              </div>
            </a>
            <a 
              href="https://salonjobsindia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="font-semibold text-sm">Website</p>
                <p className="text-xs text-muted-foreground">www.salonjobsindia.com</p>
              </div>
            </a>
          </div>
        </div>
        
        {/* Company Info */}
        <div className="text-center text-xs text-muted-foreground animate-slide-up" style={{ animationDelay: '350ms' }}>
          <p className="mb-2">Fitonze Private Limited</p>
          <p>CIN: U74999TG2024PTC185XXX</p>
          <p className="mt-4">Version 1.0.0</p>
        </div>
      </div>
    </div>
  )
}
