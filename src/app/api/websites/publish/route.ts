import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { nanoid } from 'nanoid';

// Publish a website to make it live
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    const body = await request.json();
    const { websiteId, subdomain } = body;

    if (!websiteId) {
      return NextResponse.json({ error: 'Website ID is required' }, { status: 400 });
    }

    // Get website data
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('*')
      .eq('id', websiteId)
      .eq('user_id', user.id)
      .single();

    if (websiteError || !website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Generate subdomain if not provided
    let finalSubdomain = subdomain;
    if (!finalSubdomain) {
      // Use website name or generate random
      finalSubdomain = website.name
        ? website.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)
        : nanoid(8);
    }

    // Check if subdomain is available
    const { data: existingSubdomain } = await supabase
      .from('published_sites')
      .select('id')
      .eq('subdomain', finalSubdomain)
      .neq('website_id', websiteId)
      .single();

    if (existingSubdomain) {
      return NextResponse.json({
        error: 'Subdomain already taken',
        suggestion: `${finalSubdomain}-${nanoid(4)}`
      }, { status: 409 });
    }

    // Get website HTML content
    const htmlContent = website.html_content || website.content;
    const cssContent = website.css_content || '';

    if (!htmlContent) {
      return NextResponse.json({ error: 'Website has no content' }, { status: 400 });
    }

    // Combine HTML and CSS into a complete page
    const fullHtml = generateFullHtml(htmlContent, cssContent, website.name);

    // Upload to Supabase Storage
    const storagePath = `sites/${user.id}/${websiteId}/index.html`;

    const { error: uploadError } = await supabase.storage
      .from('websites')
      .upload(storagePath, fullHtml, {
        contentType: 'text/html',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload website' }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from('websites')
      .getPublicUrl(storagePath);

    // Save or update published site record
    const { data: publishedSite, error: publishError } = await supabase
      .from('published_sites')
      .upsert({
        website_id: websiteId,
        user_id: user.id,
        subdomain: finalSubdomain,
        storage_path: storagePath,
        public_url: publicUrl.publicUrl,
        is_published: true,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'website_id',
      })
      .select()
      .single();

    if (publishError) {
      console.error('Publish error:', publishError);
      return NextResponse.json({ error: 'Failed to save publish record' }, { status: 500 });
    }

    // Update website record
    await supabase
      .from('websites')
      .update({
        is_published: true,
        subdomain: finalSubdomain,
        published_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/s/${finalSubdomain}`,
        published_at: new Date().toISOString(),
      })
      .eq('id', websiteId);

    // Trigger email notification (fire and forget)
    // Notify user that their website is now live
    import("@/utils/sendEmail").then(({ sendNotificationEmail }) => {
      sendNotificationEmail("new_website", user.id, {
        websiteName: website.name,
        websiteUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://nocodepage.vercel.app'}/s/${finalSubdomain}`,
        thumbnailUrl: "https://placehold.co/600x400/e2e8f0/475569?text=Website+Preview", // Placeholder
      }).catch(err => console.error("Failed to send email:", err));
    });


    return NextResponse.json({
      success: true,
      subdomain: finalSubdomain,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/s/${finalSubdomain}`,
      storageUrl: publicUrl.publicUrl,
      publishedAt: publishedSite.published_at,
    });


  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Unpublish a website
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get('websiteId');

    if (!websiteId) {
      return NextResponse.json({ error: 'Website ID is required' }, { status: 400 });
    }

    // Update published site record
    await supabase
      .from('published_sites')
      .update({ is_published: false })
      .eq('website_id', websiteId)
      .eq('user_id', user.id);

    // Update website record
    await supabase
      .from('websites')
      .update({ is_published: false })
      .eq('id', websiteId)
      .eq('user_id', user.id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Unpublish error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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
