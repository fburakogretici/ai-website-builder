import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔵 AI Edit API called');
    const { 
      websiteId, 
      currentHtml, 
      userPrompt, 
      conversationHistory = [],
      locale = 'en' 
    } = await request.json();

    console.log('📋 Request data:', { websiteId, userPromptLength: userPrompt?.length, locale });

    if (!websiteId || !currentHtml || !userPrompt) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: locale === 'tr' ? 'Gerekli alanlar eksik' : 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build conversation context for Claude
    const systemPrompt = locale === 'tr' 
      ? `Sen bir HTML editörüsün. Kullanıcının HTML kodunda değişiklik yapıyorsun.

MUTLAKA UYULMASI GEREKEN KURALLAR:
1. Yanıtın SADECE iki bölüm içermeli: [EXPLANATION] ve [HTML]
2. [HTML] bölümünde MUTLAKA tam, çalışır bir HTML belgesi olmalı
3. HTML belgesi <!DOCTYPE html> ile başlamalı ve </html> ile bitmeli
4. HİÇBİR açıklama metni, kod yorumu veya "değişikliklerin kısımlarını paylaşacağım" gibi ifadeler KULLANMA
5. Markdown kod blokları (başlangıçta \`\`\`html veya sonda \`\`\`) KULLANMA

ZORUNLU FORMAT:
[EXPLANATION]
Kısa açıklama (1-2 cümle)
[HTML]
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    ...TÜM HEAD İÇERİĞİ...
</head>
<body>
    ...TÜM BODY İÇERİĞİ...
</body>
</html>

ÖNEMLİ: [HTML] etiketinden sonra direkt olarak <!DOCTYPE html> ile başla. Başka hiçbir şey yazma!`
      : `You are an HTML editor. You modify the user's HTML code.

MANDATORY RULES:
1. Your response MUST contain ONLY two sections: [EXPLANATION] and [HTML]
2. The [HTML] section MUST contain a complete, working HTML document
3. The HTML document MUST start with <!DOCTYPE html> and end with </html>
4. DO NOT use any explanatory text, code comments, or phrases like "I'll share the important parts"
5. DO NOT use markdown code blocks (no \`\`\`html at start or \`\`\` at end)

REQUIRED FORMAT:
[EXPLANATION]
Brief description (1-2 sentences)
[HTML]
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    ...ENTIRE HEAD CONTENT...
</head>
<body>
    ...ENTIRE BODY CONTENT...
</body>
</html>

IMPORTANT: After the [HTML] tag, start directly with <!DOCTYPE html>. Write nothing else!`;

    // Format conversation history for Claude - ONLY include user prompts, not HTML
    const formattedHistory = conversationHistory
      .filter((msg: Message) => msg.role === 'user')
      .map((msg: Message, index: number) => ({
        role: 'user' as const,
        content: locale === 'tr' 
          ? `Önceki değişiklik talebi ${index + 1}: ${msg.content}`
          : `Previous change request ${index + 1}: ${msg.content}`
      }));

    // Add current context
    const messages = [
      ...formattedHistory,
      {
        role: 'user' as const,
        content: locale === 'tr'
          ? `Şu anki güncel HTML kodum (önceki tüm değişiklikleri içeriyor):

${currentHtml}

Şimdi yapılacak yeni değişiklik: ${userPrompt}

ÖNEMLİ: Bu HTML ÖNCEKİ DEĞİŞİKLİKLERİ ZATEN İÇERİYOR. Sadece yukarıdaki yeni değişikliği uygula ve tam HTML belgesini döndür.

HATIRLATMA: Yanıtında SADECE [EXPLANATION] ve [HTML] bölümleri olsun. [HTML] bölümünde tam HTML belgesi ver. Hiçbir açıklama metni ekleme, direkt HTML kodunu yaz!`
          : `Current up-to-date HTML code (includes all previous changes):

${currentHtml}

New change to make now: ${userPrompt}

IMPORTANT: This HTML ALREADY INCLUDES PREVIOUS CHANGES. Only apply the new change above and return the complete HTML document.

REMINDER: Your response should contain ONLY [EXPLANATION] and [HTML] sections. In the [HTML] section, provide the complete HTML document. Don't add any explanatory text, write the HTML code directly!`
      }
    ];

    // Call Claude API
    console.log('🤖 Calling Claude API...');
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 8000,
      system: systemPrompt,
      messages: messages
    });

    console.log('✅ Claude API response received');

    const fullResponse = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    console.log('📝 Response length:', fullResponse.length);

    // Parse response
    const explanationMatch = fullResponse.match(/\[EXPLANATION\]([\s\S]*?)\[HTML\]/);
    const htmlMatch = fullResponse.match(/\[HTML\]([\s\S]*)/);

    let explanation = explanationMatch 
      ? explanationMatch[1].trim() 
      : (locale === 'tr' ? 'Değişiklikler yapıldı.' : 'Changes applied.');
    
    let html = htmlMatch 
      ? htmlMatch[1].trim() 
      : currentHtml;

    console.log('🔍 Parsed explanation:', explanation.substring(0, 100));
    console.log('🔍 Parsed HTML length:', html.length);

    // Clean up HTML (remove markdown code blocks if present)
    html = html.replace(/```html\n?/g, '').replace(/```\n?$/g, '').trim();

    // Validate HTML (basic check)
    if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
      console.error('❌ Invalid HTML returned by AI');
      console.log('First 200 chars:', html.substring(0, 200));
      return NextResponse.json(
        { 
          error: locale === 'tr' 
            ? 'AI geçersiz HTML döndürdü. Lütfen tekrar deneyin.' 
            : 'AI returned invalid HTML. Please try again.',
          html: currentHtml,
          explanation: locale === 'tr'
            ? 'Bir hata oluştu, değişiklikler uygulanamadı.'
            : 'An error occurred, changes could not be applied.'
        },
        { status: 500 }
      );
    }

    console.log('✅ HTML validated successfully');

    // Update database with new HTML
    const { error: updateError } = await supabase
      .from("websites")
      .update({ 
        html_content: html,
        updated_at: new Date().toISOString()
      })
      .eq("id", websiteId);

    if (updateError) {
      console.error('⚠️ Database update error:', updateError);
      // Continue anyway, client will still get the updated HTML
    } else {
      console.log('✅ Database updated successfully');
    }

    console.log('🎉 Returning success response');
    return NextResponse.json({
      html,
      explanation
    });

  } catch (error: unknown) {
    console.error("❌ AI Edit Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: "AI processing failed: " + errorMessage,
        html: '',
        explanation: 'An error occurred during AI processing.'
      },
      { status: 500 }
    );
  }
}
