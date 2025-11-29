'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface PageProps {
    params: Promise<{ subdomain: string }>;
}

export default function PublishedSitePage({ params }: PageProps) {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [subdomain, setSubdomain] = useState<string>('');

    useEffect(() => {
        async function loadSite() {
            try {
                const resolvedParams = await params;
                setSubdomain(resolvedParams.subdomain);

                const supabase = createClient();

                // Get published site info by subdomain
                const { data: publishedSite, error: siteError } = await supabase
                    .from('published_sites')
                    .select(`
            id,
            website_id,
            storage_path,
            public_url,
            is_published,
            website:websites (
              id,
              name,
              html_content,
              css_content
            )
          `)
                    .eq('subdomain', resolvedParams.subdomain)
                    .eq('is_published', true)
                    .single();

                if (siteError || !publishedSite) {
                    setError('Site not found or not published');
                    setLoading(false);
                    return;
                }

                // Try to get content from storage first, fallback to database
                let htmlContent = '';

                if (publishedSite.storage_path) {
                    // Try to download from Supabase Storage
                    const { data: storageData, error: storageError } = await supabase.storage
                        .from('websites')
                        .download(publishedSite.storage_path);

                    if (!storageError && storageData) {
                        htmlContent = await storageData.text();
                    }
                }

                // Fallback to database content
                if (!htmlContent && publishedSite.website) {
                    const website = Array.isArray(publishedSite.website)
                        ? publishedSite.website[0]
                        : publishedSite.website;

                    if (website.html_content || website.css_content) {
                        htmlContent = generateFullHtml(
                            website.html_content || '',
                            website.css_content || '',
                            website.name || 'My Website'
                        );
                    }
                }

                if (!htmlContent) {
                    setError('Site content not found');
                    setLoading(false);
                    return;
                }

                setContent(htmlContent);
            } catch (err) {
                console.error('Error loading site:', err);
                setError('Failed to load site');
            } finally {
                setLoading(false);
            }
        }

        loadSite();
    }, [params]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
                    <p className="mt-4 text-gray-600">Loading site...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="text-6xl mb-4">🔍</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Site Not Found</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <p className="text-sm text-gray-500">
                        Subdomain: <code className="bg-gray-100 px-2 py-1 rounded">{subdomain}</code>
                    </p>
                    <a
                        href="/"
                        className="inline-block mt-6 px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                    >
                        Go Home
                    </a>
                </div>
            </div>
        );
    }

    // Render the HTML content in an iframe for isolation and security
    return (
        <iframe
            srcDoc={content}
            className="w-full h-screen border-0"
            title={`Published site: ${subdomain}`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
    );
}

// Helper function to generate complete HTML
function generateFullHtml(htmlContent: string, cssContent: string, title: string): string {
    // Check if htmlContent is already a complete HTML document
    if (htmlContent.includes('<!DOCTYPE') || htmlContent.includes('<html')) {
        // Inject CSS if provided
        if (cssContent) {
            return htmlContent.replace('</head>', `<style>${cssContent}</style></head>`);
        }
        return htmlContent;
    }

    // Create a complete HTML document
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="NoCodePage.ai">
  <title>${title || 'My Website'}</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    ${cssContent}
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
}
