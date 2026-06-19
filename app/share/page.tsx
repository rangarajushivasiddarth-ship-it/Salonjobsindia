'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

function ShareContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirectedRef = useRef(false)
  
  const title = searchParams.get('title')
  const text = searchParams.get('text')
  const url = searchParams.get('url')

  useEffect(() => {
    // Only redirect once if no params - use ref to prevent duplicate redirects
    if (!redirectedRef.current && !title && !text && !url) {
      redirectedRef.current = true
      // Schedule redirect for next tick to ensure router is ready
      const timeoutId = setTimeout(() => {
        router.push('/jobs')
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [title, text, url, router])

  return (
    <div className="min-h-screen bg-white dark:bg-background p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Shared Content</h1>
        
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-4">
          {title && (
            <div>
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Title</h2>
              <p className="text-lg text-gray-900 dark:text-white break-words">{title}</p>
            </div>
          )}
          
          {text && (
            <div>
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Message</h2>
              <p className="text-gray-800 dark:text-gray-200 break-words">{text}</p>
            </div>
          )}
          
          {url && (
            <div>
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">URL</h2>
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline break-words"
              >
                {url}
              </a>
            </div>
          )}

          {!title && !text && !url && (
            <p className="text-gray-600 dark:text-gray-400">
              No shared content. Redirecting to jobs...
            </p>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => router.push('/jobs')}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition"
          >
            Browse Jobs
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SharePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ShareContent />
    </Suspense>
  )
}
