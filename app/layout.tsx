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
  title: 'Salon Jobs India - Find Your Perfect Salon Career',
  description: 'India\'s premier salon job marketplace connecting job seekers with salon owners. Powered by FItonze Private Limited.',
  keywords: ['salon jobs', 'salon recruitment', 'job search', 'salon careers', 'India', 'salon professionals', 'beauty industry jobs'],
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
  },
  alternates: {
    canonical: 'https://saloonjobsindia.com',
  },
  openGraph: {
    title: 'Salon Jobs India - Find Your Perfect Salon Career',
    description: 'India\'s premier salon job marketplace connecting job seekers with salon owners',
    type: 'website',
    locale: 'en_IN',
    url: 'https://saloonjobsindia.com',
    siteName: 'Salon Jobs India',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Salon Jobs India',
    description: 'Find your perfect salon career',
    creator: '@saloonjobsindia',
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
