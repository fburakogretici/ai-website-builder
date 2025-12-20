export const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'NoCodePage',
    url: 'https://nocodepage.tech',
    logo: 'https://nocodepage.tech/logo.png',
    description: 'AI-powered website builder for creating professional websites without coding',
    sameAs: [
        'https://twitter.com/nocodepage',
        'https://linkedin.com/company/nocodepage',
    ],
}

export const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'NoCodePage',
    applicationCategory: 'WebApplication',
    operatingSystem: 'Web',
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
    },
    aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '150',
    },
    description: 'Create professional websites instantly with AI. No coding required.',
    featureList: [
        'AI-powered website generation',
        'No coding required',
        'Instant website creation',
        'Professional templates',
        'Multi-language support',
    ],
}

export const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'NoCodePage',
    url: 'https://nocodepage.tech',
    potentialAction: {
        '@type': 'SearchAction',
        target: 'https://nocodepage.tech/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
    },
}
