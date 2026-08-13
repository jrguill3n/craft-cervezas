import type { MetadataRoute } from 'next'
import { branches } from '@/lib/craft-content'
import { siteUrl } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/taplist`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...branches.map((branch) => ({
      url: `${siteUrl}/${branch.slug}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    {
      url: `${siteUrl}/taplist-insurgente-gdl`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ]
}

