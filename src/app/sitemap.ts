import type { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: 'hourly', priority: 1 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/rules`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/leaderboard`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/launch`, changeFrequency: 'monthly', priority: 0.6 },
  ]

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: questions } = await supabase
      .from('questions')
      .select('slug, created_at')
      .neq('status', 'removed')
      .order('created_at', { ascending: false })
      .limit(1000)

    const questionRoutes: MetadataRoute.Sitemap = (questions ?? []).map(q => ({
      url: `${baseUrl}/q/${q.slug}`,
      lastModified: new Date(q.created_at),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))

    return [...staticRoutes, ...questionRoutes]
  } catch {
    return staticRoutes
  }
}
