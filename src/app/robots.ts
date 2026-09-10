import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/auth/',
                    '/_next/',
                    '/settings/',
                    '/dashboard/',
                    '/editor/',
                ],
            },
        ],
        sitemap: 'https://nocodepage.tech/sitemap.xml',
    }
}
