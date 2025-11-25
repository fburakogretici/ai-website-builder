import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Get domain settings for a website
export async function GET(request: NextRequest) {
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

    // Get website with domain info
    const { data: website, error } = await supabase
      .from('websites')
      .select(`
        id,
        name,
        subdomain,
        custom_domain,
        is_published,
        published_url,
        published_at
      `)
      .eq('id', websiteId)
      .eq('user_id', user.id)
      .single();

    if (error || !website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Get domain verification status if custom domain exists
    let domainStatus = null;
    if (website.custom_domain) {
      const { data: domainInfo } = await supabase
        .from('custom_domains')
        .select('*')
        .eq('website_id', websiteId)
        .single();
      
      domainStatus = domainInfo;
    }

    return NextResponse.json({
      website,
      domainStatus,
      urls: {
        subdomain: website.subdomain ? `https://${website.subdomain}.nocodepage.app` : null,
        customDomain: website.custom_domain ? `https://${website.custom_domain}` : null,
      },
    });

  } catch (error) {
    console.error('Get domain error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add or update custom domain
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has Pro or higher plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    if (!profile || profile.subscription_tier === 'free') {
      return NextResponse.json({ 
        error: 'Custom domains require Pro or higher plan',
        upgrade: true 
      }, { status: 403 });
    }

    const body = await request.json();
    const { websiteId, domain } = body;

    if (!websiteId || !domain) {
      return NextResponse.json({ error: 'Website ID and domain are required' }, { status: 400 });
    }

    // Validate domain format
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
    }

    // Check if domain is already in use
    const { data: existingDomain } = await supabase
      .from('custom_domains')
      .select('id')
      .eq('domain', domain)
      .neq('website_id', websiteId)
      .single();

    if (existingDomain) {
      return NextResponse.json({ error: 'Domain already in use' }, { status: 409 });
    }

    // Generate verification token
    const verificationToken = `nocodepage-verify-${crypto.randomUUID().slice(0, 8)}`;

    // Create or update domain record
    const { data: domainRecord, error: domainError } = await supabase
      .from('custom_domains')
      .upsert({
        website_id: websiteId,
        user_id: user.id,
        domain,
        verification_token: verificationToken,
        verification_status: 'pending',
        ssl_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'website_id',
      })
      .select()
      .single();

    if (domainError) {
      console.error('Domain error:', domainError);
      return NextResponse.json({ error: 'Failed to save domain' }, { status: 500 });
    }

    // Update website record
    await supabase
      .from('websites')
      .update({ custom_domain: domain })
      .eq('id', websiteId);

    return NextResponse.json({
      success: true,
      domain: domainRecord,
      dnsInstructions: {
        type: 'CNAME',
        name: domain.startsWith('www.') ? 'www' : '@',
        value: 'sites.nocodepage.app',
        ttl: 3600,
        txtRecord: {
          name: '_nocodepage',
          value: verificationToken,
        },
      },
    });

  } catch (error) {
    console.error('Add domain error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Verify domain DNS
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { websiteId } = body;

    if (!websiteId) {
      return NextResponse.json({ error: 'Website ID is required' }, { status: 400 });
    }

    // Get domain record
    const { data: domainRecord, error: domainError } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('website_id', websiteId)
      .eq('user_id', user.id)
      .single();

    if (domainError || !domainRecord) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Verify DNS records
    const verificationResult = await verifyDns(domainRecord.domain, domainRecord.verification_token);

    // Update verification status
    await supabase
      .from('custom_domains')
      .update({
        verification_status: verificationResult.verified ? 'verified' : 'failed',
        dns_configured: verificationResult.cnameValid,
        last_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', domainRecord.id);

    return NextResponse.json({
      verified: verificationResult.verified,
      checks: verificationResult,
    });

  } catch (error) {
    console.error('Verify domain error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Remove custom domain
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

    // Delete domain record
    await supabase
      .from('custom_domains')
      .delete()
      .eq('website_id', websiteId)
      .eq('user_id', user.id);

    // Update website
    await supabase
      .from('websites')
      .update({ custom_domain: null })
      .eq('id', websiteId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete domain error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to verify DNS
async function verifyDns(domain: string, verificationToken: string): Promise<{
  verified: boolean;
  cnameValid: boolean;
  txtValid: boolean;
  error?: string;
}> {
  try {
    // In production, use a DNS lookup service
    // For now, we'll use a simple fetch-based check
    
    // Check CNAME by trying to resolve the domain
    let cnameValid = false;
    let txtValid = false;

    try {
      // Simple check - try to fetch the domain and see if it points to our servers
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=CNAME`);
      const data = await response.json();
      
      if (data.Answer) {
        cnameValid = data.Answer.some((record: { data: string }) => 
          record.data.includes('nocodepage.app')
        );
      }
    } catch {
      // CNAME check failed
    }

    try {
      // Check TXT record
      const txtResponse = await fetch(`https://dns.google/resolve?name=_nocodepage.${domain}&type=TXT`);
      const txtData = await txtResponse.json();
      
      if (txtData.Answer) {
        txtValid = txtData.Answer.some((record: { data: string }) => 
          record.data.includes(verificationToken)
        );
      }
    } catch {
      // TXT check failed
    }

    return {
      verified: cnameValid && txtValid,
      cnameValid,
      txtValid,
    };

  } catch {
    return {
      verified: false,
      cnameValid: false,
      txtValid: false,
      error: 'DNS verification failed',
    };
  }
}
