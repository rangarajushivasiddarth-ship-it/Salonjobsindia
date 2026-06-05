import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // Use fixed date to prevent hydration mismatch (this is a build-time artifact)
  const fixedDate = new Date('2024-01-01')
  
  return [
    {
      url: 'https://www.salonjobsindia.com',
      lastModified: fixedDate,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://www.salonjobsindia.com/contact-us',
      lastModified: fixedDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://www.salonjobsindia.com/privacy',
      lastModified: fixedDate,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: 'https://www.salonjobsindia.com/terms',
      lastModified: fixedDate,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ]
}
