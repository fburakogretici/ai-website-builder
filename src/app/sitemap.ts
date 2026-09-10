import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://nocodepage.tech'

    // Static pages
    const staticPages = [
        '',
        '/en',
        '/tr',
        '/en/login',
        '/tr/login',
        '/en/pricing',
        '/tr/pricing',
        '/en/ai-builder',
        '/tr/ai-builder',
    ]

    const staticRoutes = staticPages.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' || route === '/en' || route === '/tr' ? 1 : 0.8,
    }))

    return staticRoutes
}
