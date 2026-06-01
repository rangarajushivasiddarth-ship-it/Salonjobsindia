'use client'

interface AppFooterProps {
  variant?: 'default' | 'minimal' | 'dark'
  className?: string
}

export function AppFooter({ variant = 'default', className = '' }: AppFooterProps) {
  if (variant === 'minimal') {
    return (
      <footer className={`py-4 text-center ${className}`}>
        <p className="text-sm text-muted-foreground/60">
          © 2026 FItonze Private Limited. All Rights Reserved.
        </p>
      </footer>
    )
  }

  if (variant === 'dark') {
    return (
      <footer className={`px-4 py-6 border-t border-border/20 text-center bg-black/50 ${className}`}>
        <p className="text-xs text-muted-foreground mb-1">
          © 2026 FItonze Private Limited. All Rights Reserved.
        </p>
      </footer>
    )
  }

  return (
    <footer className={`px-4 py-6 border-t border-border/30 text-center ${className}`}>
      <p className="text-xs text-muted-foreground mb-1">
        © 2026 FItonze Private Limited. All Rights Reserved.
      </p>
    </footer>
  )
}
