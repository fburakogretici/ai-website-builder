import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, websiteName, html, analysis, prompt, status = "draft" } = body;

    if (!userId || !websiteName || !html) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Parse HTML to extract sections for future editing
    const sections = extractSections(html);

    // Generate slug from website name
    const slug = websiteName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + Date.now();

    // Save to Supabase
    const { data, error } = await supabase
      .from("websites")
      .insert({
        user_id: userId,
        name: websiteName,
        slug: slug,
        html_content: html,
        sections: sections,
        analysis: analysis,
        original_prompt: prompt,
        status: status, // 'draft' or 'active'
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save website", details: error.message },
        { status: 500 }
      );
    }

    console.log("✅ Website saved:", data.id);

    return NextResponse.json({
      success: true,
      websiteId: data.id,
      url: `/sites/${data.id}`,
    });

  } catch (error: any) {
    console.error("Save error:", error);
    return NextResponse.json(
      { error: "Failed to save website", details: error.message },
      { status: 500 }
    );
  }
}

// Extract sections from HTML for future editing
function extractSections(html: string): Record<string, any> {
  const sections: Record<string, any> = {};

  // Extract hero section
  const heroMatch = html.match(/<section[^>]*class="[^"]*hero[^"]*"[^>]*>([\s\S]*?)<\/section>/i);
  if (heroMatch) {
    sections.hero = {
      html: heroMatch[0],
      editable: true,
      type: "hero"
    };
  }

  // Extract about section
  const aboutMatch = html.match(/<section[^>]*id="about"[^>]*>([\s\S]*?)<\/section>/i);
  if (aboutMatch) {
    sections.about = {
      html: aboutMatch[0],
      editable: true,
      type: "about"
    };
  }

  // Extract services section
  const servicesMatch = html.match(/<section[^>]*id="services"[^>]*>([\s\S]*?)<\/section>/i);
  if (servicesMatch) {
    sections.services = {
      html: servicesMatch[0],
      editable: true,
      type: "services"
    };
  }

  // Extract testimonials section
  const testimonialsMatch = html.match(/<section[^>]*id="testimonials"[^>]*>([\s\S]*?)<\/section>/i);
  if (testimonialsMatch) {
    sections.testimonials = {
      html: testimonialsMatch[0],
      editable: true,
      type: "testimonials"
    };
  }

  // Extract contact section
  const contactMatch = html.match(/<section[^>]*id="contact"[^>]*>([\s\S]*?)<\/section>/i);
  if (contactMatch) {
    sections.contact = {
      html: contactMatch[0],
      editable: true,
      type: "contact"
    };
  }

  return sections;
}
