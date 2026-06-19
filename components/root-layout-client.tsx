'use client'

import { ReactNode } from 'react'

interface RootLayoutClientProps {
  children: ReactNode
}

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
  return <>{children}</>
}
