'use client'

import { ArrowLeft, Phone, MessageCircle, Award, Users, MapPin, Clock, CheckCircle, Quote, Target, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/lib/app-context'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
}

// Counter animation hook
function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [hasStarted])

  useEffect(() => {
    if (!hasStarted) return

    let startTime: number
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }, [hasStarted, end, duration])

  return { count, ref }
}

// Stat Card Component
function StatCard({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const { count, ref } = useCountUp(value)
  
  return (
    <motion.div
      ref={ref}
      variants={scaleIn}
      className="relative group"
    >
      <div className="bg-black border border-[#D4AF37]/30 rounded-2xl p-6 text-center transition-all duration-300 hover:border-[#D4AF37] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(212,175,55,0.15)]">
        <p className="text-3xl md:text-4xl font-bold text-[#D4AF37] mb-2">
          {count}{suffix}
        </p>
        <p className="text-white/70 text-sm">{label}</p>
      </div>
    </motion.div>
  )
}

// Founder Card Component
function FounderCard({ 
  name, 
  role, 
  description, 
  expertise, 
  quote 
}: { 
  name: string
  role: string
  description: string
  expertise: string[]
  quote: string
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="bg-black border border-[#D4AF37]/20 rounded-2xl p-6 hover:border-[#D4AF37]/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(212,175,55,0.1)]"
    >
      {/* Founder Info */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 flex items-center justify-center border border-[#D4AF37]/30">
          <span className="text-[#D4AF37] text-2xl font-bold">
            {name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">{name}</h3>
          <p className="text-[#D4AF37] text-sm">{role}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-white/70 text-sm leading-relaxed mb-4">
        {description}
      </p>

      {/* Expertise Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {expertise.map((tag, index) => (
          <span
            key={index}
            className="px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full text-xs text-[#D4AF37]"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Quote */}
      <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-xl p-4 relative">
        <Quote className="w-5 h-5 text-[#D4AF37]/50 absolute top-3 left-3" />
        <p className="text-white/80 text-sm italic pl-6">
          {quote}
        </p>
      </div>
    </motion.div>
  )
}

// Badge Component
function AwardBadge({ label }: { label: string }) {
  return (
    <motion.div
      variants={scaleIn}
      className="relative group"
    >
      <div className="bg-black border border-[#C0C0C0]/30 rounded-xl px-4 py-3 text-center transition-all duration-300 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5">
        <div className="flex items-center justify-center gap-2">
          <Award className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-white/90 text-xs font-medium">{label}</span>
        </div>
      </div>
    </motion.div>
  )
}

export function AboutUsScreen() {
  const { goToStep, user } = useApp()
  const isOwner = user?.role === 'salon_owner' || user?.role === 'employer'

  const stats = [
    { value: 20, label: 'Years Excellence', suffix: '+' },
    { value: 160, label: 'Expert Team', suffix: '+' },
    { value: 10, label: 'PAN India', suffix: '+' },
    { value: 50, label: 'Happy Clients', suffix: 'k+' }
  ]

  const founders = [
    {
      name: 'Sikinametla Sivaprasadd',
      role: 'Founder & CEO',
      description: 'With over 25 years of experience in the beauty industry, Sivaprasadd transformed Fitonze from a single salon into India\'s trusted salon brand through leadership, business strategy, and innovation.',
      expertise: ['Business Strategy', 'Salon Operations', 'Industry Innovation'],
      quote: 'Our vision is to make premium beauty services accessible while creating employment opportunities through quality education.'
    },
    {
      name: 'Swathi Rajoju',
      role: 'Co-Founder & Creative Director',
      description: 'Swathi brings 20+ years of creative direction and makeup artistry experience with strong expertise in education, beauty transformation, and academy development.',
      expertise: ['Makeup Artistry', 'Creative Direction', 'Academy Curriculum'],
      quote: 'Beauty is an art form. We combine creativity with technical expertise to create unforgettable experiences.'
    }
  ]

  const missionPoints = [
    'Premium beauty and wellness services',
    'Client confidence and wellbeing',
    'High hygiene and safety protocols',
    'Creativity and innovation',
    'Employment opportunities through quality education'
  ]

  const visionPoints = [
    'Become India\'s most trusted beauty brand',
    'Service excellence',
    'Professional education',
    'Expansion goals',
    'Professional training goals',
    'International standards'
  ]

  const awards = [
    'Best Salon Chain - India',
    'Government Approved Academy',
    'ISO 9001:2015 Certified',
    'Best Bridal Makeup Studio',
    'Excellence in Training',
    'Fastest Growing Salon Chain',
    'NSDC Partner',
    'IAF Member'
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-[#D4AF37]/20 p-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goToStep(isOwner ? 'owner-panel' : 'discovery')}
          className="text-white/70 hover:text-white hover:bg-[#D4AF37]/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="relative w-10 h-10">
          <Image
            src="/images/logo.png"
            alt="Salon Jobs India"
            fill
            className="object-contain"
          />
        </div>
        <h1 className="font-bold text-lg text-white">About Us</h1>
      </header>

      {/* Hero Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="px-4 py-16 text-center"
      >
        <motion.div variants={fadeUp} className="mb-6">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <Image
              src="/images/logo.png"
              alt="Salon Jobs India"
              fill
              className="object-contain"
            />
          </div>
        </motion.div>
        
        <motion.h1
          variants={fadeUp}
          className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] bg-clip-text text-transparent"
        >
          Crafting Beauty Since 2003
        </motion.h1>
        
        <motion.p
          variants={fadeUp}
          className="text-lg md:text-xl text-white/80 mb-4"
        >
          From a single salon to India&apos;s trusted unisex salon chain.
        </motion.p>
        
        <motion.p
          variants={fadeUp}
          className="text-white/60 max-w-2xl mx-auto leading-relaxed"
        >
          Built with passion, innovation, and dedication to beauty excellence, Salon Jobs India and Fitonze continue creating opportunities, transforming careers, and delivering premium experiences across India.
        </motion.p>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="px-4 py-12"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      </motion.section>

      {/* Founders Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="px-4 py-12"
      >
        <motion.div variants={fadeUp} className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Meet Our Founders
          </h2>
          <p className="text-[#D4AF37]">Visionaries Behind Fitonze</p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {founders.map((founder, index) => (
            <FounderCard key={index} {...founder} />
          ))}
        </div>
      </motion.section>

      {/* Mission & Vision Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="px-4 py-12"
      >
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Mission */}
          <motion.div
            variants={fadeUp}
            className="bg-black border border-[#D4AF37]/20 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-xl font-bold text-white">Mission</h3>
            </div>
            <ul className="space-y-3">
              {missionPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span className="text-white/70 text-sm">{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Vision */}
          <motion.div
            variants={fadeUp}
            className="bg-black border border-[#D4AF37]/20 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                <Eye className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-xl font-bold text-white">Vision</h3>
            </div>
            <ul className="space-y-3">
              {visionPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span className="text-white/70 text-sm">{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </motion.section>

      {/* Awards Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="px-4 py-12"
      >
        <motion.div variants={fadeUp} className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Recognition & Trust
          </h2>
        </motion.div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {awards.map((award, index) => (
            <AwardBadge key={index} label={award} />
          ))}
        </div>
      </motion.section>

      {/* Contact Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="px-4 py-12"
      >
        <motion.div variants={fadeUp} className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Need Help?
          </h2>
        </motion.div>
        
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <a
            href="tel:9100609609"
            className="flex-1 bg-[#D4AF37] text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-[#C4A030] transition-colors"
          >
            <Phone className="w-5 h-5" />
            Call Support
          </a>
          <a
            href="https://wa.me/919100609609"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-black border border-[#D4AF37] text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-[#D4AF37]/10 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp Support
          </a>
        </motion.div>
        
        <motion.p variants={fadeUp} className="text-center text-white/50 text-sm mt-4">
          9100609609
        </motion.p>
      </motion.section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-[#D4AF37]/10 text-center">
        <div className="mb-4">
          <h3 className="text-white font-bold text-lg">Salon Jobs India</h3>
          <p className="text-[#D4AF37] text-sm">Powered by Fitonze Private Limited</p>
        </div>
        <p className="text-white/40 text-xs">
          © 2026 Fitonze Private Limited. All Rights Reserved.
        </p>
      </footer>
    </div>
  )
}
