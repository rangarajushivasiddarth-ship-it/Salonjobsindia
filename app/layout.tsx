import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import ServiceWorkerRegister from '@/components/service-worker-register'
import RootLayoutClient from '@/components/root-layout-client'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter'
})

export const metadata: Metadata = {
  metadataBase: new URL('https://saloonjobsindia.com'),
  title: 'Salon Jobs India - India\'s #1 Salon Job Marketplace for Beauty Professionals',
  description: 'Salon Jobs India is India\'s leading salon and beauty job marketplace. Job seekers: Browse thousands of salon positions, beauty roles, and haircare jobs. Salon owners: Post jobs and hire qualified staff. Connect with beauty professionals and salons nationwide. Free job search platform by FItonze Private Limited.',
  keywords: ['salon jobs India', 'beauty jobs', 'salon recruitment', 'haircare jobs', 'beauty professionals', 'salon careers', 'job search India', 'salon staff', 'beauty industry jobs', 'salon employment'],
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
    title: 'Salon Jobs India',
    description: 'Find salon jobs and hire beauty professionals across India.',
    type: 'website',
    locale: 'en_IN',
    url: 'https://saloonjobsindia.com',
    siteName: 'Salon Jobs India',
    images: [
      {
        url: '/salon-jobs-icons/512.png',
        width: 512,
        height: 512,
        alt: 'Salon Jobs India Logo',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Salon Jobs India',
    description: 'Find salon jobs and hire beauty professionals across India.',
    images: ['/salon-jobs-icons/512.png'],
  },
  icons: {
    icon: [
      { url: '/salon-jobs-icons/192.png', sizes: '192x192', type: 'image/png' },
      { url: '/salon-jobs-icons/72.png', sizes: '72x72', type: 'image/png' }
    ],
    apple: [
      { url: '/salon-jobs-icons/512.png', sizes: '512x512', type: 'image/png' }
    ]
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
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <head>
        {/* Explicit branding tags to override any cached content */}
        <meta name="title" content="Salon Jobs India - India's #1 Salon Job Marketplace" />
        <meta name="description" content="Salon Jobs India: Search salon jobs, beauty careers, and hire salon staff in India. Free job marketplace by FItonze Private Limited." />
        <meta name="application-name" content="Salon Jobs India" />
        <meta name="apple-mobile-web-app-title" content="Salon Jobs India" />
        <meta property="og:site_name" content="Salon Jobs India" />
        <meta property="og:title" content="Salon Jobs India - Salon Recruitment Platform" />
        <meta property="og:description" content="India's leading salon and beauty job marketplace connecting job seekers with salon owners." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://saloonjobsindia.com" />
        
        {/* Cache busting - force Google to re-crawl */}
        <meta httpEquiv="cache-control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="pragma" content="no-cache" />
        <meta httpEquiv="expires" content="0" />
        
        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased min-h-screen`}>
        <RootLayoutClient>
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
          <ServiceWorkerRegister />
        </RootLayoutClient>
      </body>
    </html>
  )
}
