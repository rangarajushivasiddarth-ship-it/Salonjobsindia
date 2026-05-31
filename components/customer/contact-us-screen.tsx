'use client'

import { ArrowLeft, Phone, Mail, MapPin, MessageCircle, Facebook, Instagram } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/lib/app-context'
import { LanguageSelector } from '@/components/language-selector'
import Image from 'next/image'
import { motion } from 'framer-motion'

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
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

// Contact Method Card Component
function ContactCard({ 
  icon: Icon, 
  title, 
  items,
  actionType = 'link'
}: { 
  icon: typeof Phone
  title: string
  items: Array<{ label: string; value: string; href?: string }>
  actionType?: 'link' | 'phone' | 'email'
}) {
  return (
    <motion.div
      variants={scaleIn}
      className="relative group"
    >
      <div className="bg-black border border-[#D4AF37]/20 rounded-2xl p-6 transition-all duration-300 hover:border-[#D4AF37] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(212,175,55,0.15)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex flex-col">
              <p className="text-white/60 text-xs mb-1">{item.label}</p>
              {item.href ? (
                <a
                  href={item.href}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="text-[#D4AF37] text-sm font-medium hover:text-[#F4D03F] transition-colors break-all"
                >
                  {item.value}
                </a>
              ) : (
                <p className="text-white text-sm">{item.value}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// Social Media Link Component
function SocialLink({ 
  icon: Icon, 
  label, 
  href 
}: { 
  icon: typeof Facebook
  label: string
  href: string
}) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      variants={fadeUp}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="flex flex-col items-center gap-3 p-4 rounded-xl bg-black border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-all duration-300"
    >
      <Icon className="w-8 h-8 text-[#D4AF37]" />
      <span className="text-white text-xs font-medium">{label}</span>
    </motion.a>
  )
}

export function ContactUsScreen() {
  const { goToStep, user } = useApp()
  const isOwner = user?.role === 'salon_owner' || user?.role === 'employer'

  const phoneNumbers = [
    { label: 'Phone 1', value: '9100609609', href: 'tel:9100609609' },
    { label: 'Phone 2', value: '9115123345', href: 'tel:9115123345' }
  ]

  const emails = [
    { label: 'Email 1', value: 'Saloonjobsindia@gmail.com', href: 'mailto:Saloonjobsindia@gmail.com' },
    { label: 'Email 2', value: 'salonjobsindia.com@salonjobsindia.com', href: 'mailto:salonjobsindia.com@salonjobsindia.com' }
  ]

  const officeAddress = [
    { label: 'Office Address', value: 'Sai Aishwarya Colony Road No 10, Medipally, Hyderabad, Telangana - 500098' }
  ]

  const socialLinks = [
    {
      icon: Instagram,
      label: 'Instagram',
      href: 'https://www.instagram.com/saloonjobsindia?igsh=MWlwZmJiczMwMmV1dw=='
    },
    {
      icon: Facebook,
      label: 'Facebook',
      href: 'https://www.facebook.com/share/1H4imjLVYz/'
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-[#D4AF37]/20 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
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
          <h1 className="font-bold text-lg text-white">Contact Us</h1>
        </div>
        <LanguageSelector variant="button" showNativeName={false} />
      </header>

      {/* Hero Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="px-4 py-16 text-center"
      >
        <motion.h1
          variants={fadeUp}
          className="text-3xl md:text-4xl font-bold mb-4 text-white"
        >
          Get in Touch
        </motion.h1>
        
        <motion.p
          variants={fadeUp}
          className="text-lg text-white/70"
        >
          We&apos;re here to help! Reach out to us through any of the channels below.
        </motion.p>
      </motion.section>

      {/* Contact Methods Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="px-4 py-12 max-w-4xl mx-auto"
      >
        <div className="grid md:grid-cols-2 gap-6">
          {/* Phone Section */}
          <ContactCard
            icon={Phone}
            title="Phone"
            items={phoneNumbers}
          />

          {/* Email Section */}
          <ContactCard
            icon={Mail}
            title="Email"
            items={emails}
          />

          {/* Address Section */}
          <div className="md:col-span-2">
            <ContactCard
              icon={MapPin}
              title="Office Address"
              items={officeAddress}
            />
          </div>
        </div>
      </motion.section>

      {/* Quick Action Buttons */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="px-4 py-12 max-w-2xl mx-auto"
      >
        <motion.h2
          variants={fadeUp}
          className="text-2xl font-bold text-white mb-6 text-center"
        >
          Quick Contact
        </motion.h2>
        
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="tel:9100609609"
            className="flex-1 bg-[#D4AF37] text-black font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-[#F4D03F] transition-colors"
          >
            <Phone className="w-5 h-5" />
            Call Now
          </a>
          <a
            href="https://wa.me/919100609609"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-black border border-[#D4AF37] text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-[#D4AF37]/10 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </a>
        </motion.div>
      </motion.section>

      {/* Follow Us Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="px-4 py-12"
      >
        <motion.h2
          variants={fadeUp}
          className="text-2xl font-bold text-white mb-8 text-center"
        >
          Follow Us
        </motion.h2>
        
        <motion.div variants={staggerContainer} className="flex gap-4 justify-center flex-wrap max-w-2xl mx-auto">
          {socialLinks.map((link, index) => (
            <SocialLink
              key={index}
              icon={link.icon}
              label={link.label}
              href={link.href}
            />
          ))}
        </motion.div>
      </motion.section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-[#D4AF37]/10 text-center mt-12">
        <div className="mb-4">
          <h3 className="text-white font-bold text-lg">Salon Jobs India</h3>
          <p className="text-[#D4AF37] text-sm">Powered by FItonze Private Limited</p>
        </div>
        <p className="text-white/40 text-xs mb-2">
          © 2026 FItonze Private Limited. All Rights Reserved.
        </p>
        <p className="text-white/30 text-[10px]">
          Application developed by Rangaraju Shiva Siddarth
        </p>
      </footer>
    </div>
  )
}
