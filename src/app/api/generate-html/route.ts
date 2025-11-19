import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, currentHtml = null, conversationHistory = [], locale = "tr" } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    console.log(`🎨 ${currentHtml ? 'Modifying existing website' : 'Generating HTML from scratch'}...`);

    const systemPrompt = currentHtml 
      ? `Expert Full-Stack Web Developer. Modify existing HTML+CSS website based on user requests.

RULES:
- Keep existing structure unless explicitly requested to change
- Modern CSS3 (flexbox, grid, variables)
- Responsive (mobile-first, breakpoints: 640px, 1024px)  
- Inline CSS (in <style> tag)
- Self-contained (NO external files, system fonts only)
- Realistic content (NO Lorem Ipsum)
- Smooth animations
- Accessibility (semantic HTML, ARIA)

OUTPUT: Return ONLY the complete modified HTML code. No explanations!`
      : `Expert Full-Stack Web Developer. Generate COMPLETELY FROM SCRATCH professional HTML+CSS website.

RULES:
- Modern CSS3 (flexbox, grid, variables)
- Responsive (mobile-first, breakpoints: 640px, 1024px)
- Inline CSS (in <style> tag)
- Self-contained (NO external files, system fonts only)
- Realistic content (NO Lorem Ipsum)
- Industry-specific colors and design
- Smooth animations
- Accessibility (semantic HTML, ARIA)

OUTPUT: Return ONLY working HTML code. No explanations!`;

    let userPrompt = "";
    
    if (currentHtml) {
      // Modification mode
      userPrompt = locale === "tr"
        ? `Mevcut Web Sitesi:
\`\`\`html
${currentHtml}
\`\`\`

Kullanıcı İsteği: "${prompt}"

GÖREV: Yukarıdaki HTML'i kullanıcı isteğine göre değiştir. SADECE TAM HTML KODUNU DÖNDÜR!`
        : `Current Website:
\`\`\`html
${currentHtml}
\`\`\`

User Request: "${prompt}"

TASK: Modify the above HTML according to user request. RETURN ONLY COMPLETE HTML CODE!`;
    } else {
      // Generation from scratch mode
      userPrompt = locale === "tr" 
        ? `Kullanıcı İsteği: "${prompt}"

GÖREV:
1. İsteği analiz et (işletme/proje adı, sektör, hizmetler, stil)
2. Sektöre uygun renk paleti seç (restaurant→warm, tech→blue, cafe→brown, saas→purple vb.)
3. Tam çalışan HTML+CSS web sitesi oluştur

SAYFA YAPISI (Tek sayfa):
- Header: Sticky navigasyon, logo, menü (Hakkında, Hizmetler, İletişim)
- Hero: Tam ekran, başlık, alt başlık, 2 CTA butonu
- Hakkında: 2-3 paragraf (~150 kelime), değerler
- Hizmetler: Grid layout, 3-4 kart (iconlar ile)
- Referanslar: 2-3 gerçekçi yorum, isim, yıldız
- İletişim: Form (İsim, Email, Mesaj) + bilgiler
- Footer: Logo, linkler, sosyal medya, telif

İçeriği ${prompt} için ÖZELLEŞTİR. Mobile-first tasarım. Sistem fontları kullan. ŞİMDİ OLUŞTUR!`
        : `User Request: "${prompt}"

TASK:
1. Analyze request (business/project name, sector, services, style)
2. Choose sector-appropriate color palette (restaurant→warm, tech→blue, cafe→brown, saas→purple etc.)
3. Create fully working HTML+CSS website

PAGE STRUCTURE (Single-page):
- Header: Sticky nav, logo, menu (About, Services, Contact)
- Hero: Full-screen, headline, subheadline, 2 CTA buttons
- About: 2-3 paragraphs (~150 words), values
- Services: Grid layout, 3-4 cards with icons
- Testimonials: 2-3 realistic reviews, names, stars
- Contact: Form (Name, Email, Message) + info
- Footer: Logo, links, social media, copyright

CUSTOMIZE content for ${prompt}. Mobile-first design. System fonts. CREATE NOW!`;
    }

    console.log("🤖 Calling Claude 3.5 Haiku (fast & cost-effective)...");

    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 4096,
      temperature: 0.8,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    let html = message.content[0].type === "text" ? message.content[0].text : "";

    // Remove markdown blocks
    if (html.includes("```html")) {
      html = html.match(/```html\n([\s\S]*?)\n```/)?.[1] || html;
    } else if (html.includes("```")) {
      html = html.match(/```\n([\s\S]*?)\n```/)?.[1] || html;
    }

    if (!html.includes("<!DOCTYPE") && !html.includes("<html")) {
      throw new Error("Invalid HTML generated");
    }

    console.log(`✅ HTML generated! Tokens: ${message.usage.output_tokens}`);

    // Extract business name from generated HTML for response
    const businessNameMatch = html.match(/<title>(.*?)<\/title>/);
    const businessName = businessNameMatch ? businessNameMatch[1] : "My Website";

    return NextResponse.json({
      success: true,
      html: html.trim(),
      businessName: businessName,
      explanation: currentHtml ? (locale === 'tr' ? '✅ Değişiklikler uygulandı!' : '✅ Changes applied!') : (locale === 'tr' ? '✅ Web siteniz oluşturuldu!' : '✅ Website created!'),
      model: "claude-3-5-haiku-20241022",
      tokensUsed: message.usage.output_tokens,
      method: currentHtml ? "modification" : "direct-generation",
    });

  } catch (error: any) {
    console.error("❌ Generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate HTML", details: error.message },
      { status: 500 }
    );
  }
}
