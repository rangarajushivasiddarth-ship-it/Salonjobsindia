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
  keywords: ['salon jobs', 'salon recruitment', 'job search', 'salon careers', 'India'],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Salon Jobs India',
    description: 'Find your perfect salon career',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Salon Jobs India',
    description: 'Find your perfect salon career',
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
  return (
    <html lang="en" className="dark bg-background">
      <body className={`${inter.variable} font-sans antialiased min-h-screen`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
