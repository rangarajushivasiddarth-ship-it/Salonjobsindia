import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import ServiceWorkerRegister from '@/components/service-worker-register'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter'
})

export const metadata: Metadata = {
  metadataBase: new URL('https://saloonjobsindia.com'),
  title: 'Salon Jobs India - Find Your Perfect Salon Career | Premium Salon Recruitment Platform',
  description: 'Salon Jobs India is India\'s premier salon job marketplace connecting talented beauty professionals with top salons. Browse thousands of salon positions, build your profile, and launch your dream career in the beauty industry. Salon owners can post jobs and find qualified staff. FItonze Private Limited - Beauty Industry Employment Solutions.',
  keywords: ['salon jobs', 'salon recruitment', 'beauty salon jobs', 'salon careers', 'beauty jobs India', 'salon staff hiring', 'salon employment', 'job search', 'salon professionals', 'beauty industry jobs', 'job opportunities'],
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    }
  },
  alternates: {
    canonical: 'https://saloonjobsindia.com',
  },
  openGraph: {
    title: 'Salon Jobs India - Premium Salon Recruitment Platform',
    description: 'Connect with thousands of salon jobs and beauty career opportunities in India. Salon Jobs India - Where Beauty Professionals Meet Dream Salons.',
    type: 'website',
    locale: 'en_IN',
    url: 'https://saloonjobsindia.com',
    siteName: 'Salon Jobs India',
    images: [
      {
        url: '/images/logo.png',
        width: 1200,
        height: 630,
        alt: 'Salon Jobs India - Beauty Job Marketplace',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Salon Jobs India - Salon Recruitment Platform',
    description: 'Find salon jobs or post salon positions on Salon Jobs India',
    creator: '@saloonjobsindia',
    site: '@saloonjobsindia',
    images: ['/images/logo.png'],
  },
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        type: 'image/x-icon',
      },
      {
        url: '/images/logo.png',
        type: 'image/png',
      },
      {
        url: '/images/fitonze-logo.jpeg',
        type: 'image/jpeg',
      },
    ],
    apple: '/images/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Salon Jobs India',
  },
  formatDetection: {
    telephone: false,
  },
  authors: [{ name: 'FItonze Private Limited', url: 'https://saloonjobsindia.com' }],
}

export const viewport: Viewport = {
  themeColor: '#D4AF37',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'Salon Jobs India',
    'description': 'India\'s premier salon job marketplace connecting job seekers with salon owners',
    'url': 'https://saloonjobsindia.com',
    'applicationCategory': 'BusinessApplication',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'INR'
    },
    'creator': {
      '@type': 'Organization',
      'name': 'FItonze Private Limited',
      'url': 'https://saloonjobsindia.com',
      'email': 'Saloonjobsindia@gmail.com'
    }
  }

  return (
    <html lang="en" className="dark bg-background">
      <head>
        <meta name="title" content="Salon Jobs India - Find Your Perfect Salon Career" />
        <meta name="application-name" content="Salon Jobs India" />
        <meta name="apple-mobile-web-app-title" content="Salon Jobs India" />
        <meta property="og:site_name" content="Salon Jobs India" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased min-h-screen`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
