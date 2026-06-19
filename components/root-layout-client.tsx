'use client'

import { ReactNode } from 'react'
import { ErrorLoggerInit } from './error-logger-init'

interface RootLayoutClientProps {
  children: ReactNode
}

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
  return (
    <>
      <ErrorLoggerInit />
      {children}
    </>
  )
}
