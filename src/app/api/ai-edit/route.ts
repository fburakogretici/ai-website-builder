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
      locale = 'en',
      model = null
    } = await request.json();

    console.log('📋 Request data:', { websiteId, userPromptLength: userPrompt?.length, locale, model });

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
Yaptığın değişiklikleri anlatan doğal ve direkt bir mesaj. Direkt ne yaptığını anlat.
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

ÖNEMLİ: [HTML] etiketinden sonra direkt olarak <!DOCTYPE html> ile başla. Başka hiçbir şey yazma! KESİNLİKLE SADECE DEĞİŞEN KISMI DEĞİL, TÜM HTML KODUNU BAŞTAN SONA DÖNDÜR.
"<!-- geri kalan kod -->" veya "<!-- ... -->" GİBİ YER TUTUCULAR KULLANMA. HTML'İN HER SATIRINI TEK TEK YAZMALISIN. YER TUTUCU KULLANIRSAN SİTE BOZULUR.`
      : `You are an HTML editor. You modify the user's HTML code.

MANDATORY RULES:
1. Your response MUST contain ONLY two sections: [EXPLANATION] and [HTML]
2. The [HTML] section MUST contain a complete, working HTML document
3. The HTML document MUST start with <!DOCTYPE html> and end with </html>
4. DO NOT use any explanatory text, code comments, or phrases like "I'll share the important parts"
5. DO NOT use markdown code blocks (no \`\`\`html at start or \`\`\` at end)

REQUIRED FORMAT:
[EXPLANATION]
A direct and natural message describing your changes.
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

IMPORTANT: After the [HTML] tag, start directly with <!DOCTYPE html>. Write nothing else! RETURN THE COMPLETE HTML CODE FROM START TO FINISH. DO NOT RETURN ONLY THE CHANGED PARTS.
DO NOT USE PLACEHOLDERS LIKE "<!-- rest of code -->" OR "<!-- ... -->". YOU MUST WRITE EVERY SINGLE LINE OF HTML. IF YOU USE PLACEHOLDERS, THE SITE WILL BREAK.`;

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

    // Determine provider and model
    const { getUserApiKey } = await import("@/utils/api-keys");

    // Get website to find user_id
    const { data: websiteData } = await supabase
      .from('websites')
      .select('user_id')
      .eq('id', websiteId)
      .single();

    const userId = websiteData?.user_id;

    let preferredProvider = 'anthropic';
    let apiKey = process.env.ANTHROPIC_API_KEY || '';
    let selectedModel = model;

    // Try to get user's API key if userId exists
    if (userId && model) {
      // Detect provider from model ID
      if (model.startsWith('gpt-') || model.startsWith('o1-')) {
        preferredProvider = 'openai';
        const userKey = await getUserApiKey(userId, 'openai', supabase);
        if (userKey) {
          apiKey = userKey;
        } else {
          apiKey = process.env.OPENAI_API_KEY || '';
        }
      } else if (model.startsWith('claude-')) {
        preferredProvider = 'anthropic';
        const userKey = await getUserApiKey(userId, 'anthropic', supabase);
        if (userKey) {
          apiKey = userKey;
        } else {
          apiKey = process.env.ANTHROPIC_API_KEY || '';
        }
      }
    }

    // Fallback to default model if not specified
    if (!selectedModel) {
      selectedModel = preferredProvider === 'openai'
        ? 'gpt-4o-mini'
        : 'claude-3-5-sonnet-20241022'; // Use Sonnet for better quality
    }

    console.log(`🤖 Calling ${preferredProvider.toUpperCase()} with model: ${selectedModel}...`);

    let fullResponse = "";
    let tokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

    if (preferredProvider === 'openai') {
      // OpenAI API
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey });

      const completion = await openai.chat.completions.create({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content }))
        ],
        max_tokens: 8192,
        temperature: 0.7,
      });

      fullResponse = completion.choices[0]?.message?.content || "";
      tokenUsage = {
        inputTokens: completion.usage?.prompt_tokens || 0,
        outputTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0
      };
    } else {
      // Anthropic Claude API (default)
      const response = await anthropic.messages.create({
        model: selectedModel,
        max_tokens: 8192,
        system: systemPrompt,
        messages: messages
      });

      fullResponse = response.content[0].type === 'text'
        ? response.content[0].text
        : '';
      tokenUsage = {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      };
    }

    console.log('✅ AI API response received');

    console.log('📝 Response length:', fullResponse.length);

    // Parse response
    const explanationMatch = fullResponse.match(/\[EXPLANATION\]([\s\S]*?)\[HTML\]/);
    const htmlMatch = fullResponse.match(/\[HTML\]([\s\S]*)/);

    let explanation = explanationMatch
      ? explanationMatch[1].trim()
      : (locale === 'tr' ? 'Değişiklikler yapıldı.' : 'Changes applied.');

    let html = "";

    if (htmlMatch) {
      html = htmlMatch[1].trim();
    } else {
      // Fallback: Look for <!DOCTYPE html>
      const doctypeIndex = fullResponse.indexOf("<!DOCTYPE html>");
      if (doctypeIndex !== -1) {
        html = fullResponse.substring(doctypeIndex);
        // If explanation wasn't found with tags, try to get everything before doctype
        if (!explanationMatch) {
          const potentialExplanation = fullResponse.substring(0, doctypeIndex).trim();
          if (potentialExplanation) {
            explanation = potentialExplanation;
          }
        }
      } else {
        html = fullResponse; // Last resort
      }
    }

    console.log('🔍 Parsed explanation:', explanation.substring(0, 100));
    console.log('🔍 Parsed HTML length:', html.length);

    // Clean up HTML - AGGRESSIVE CLEANING
    // Remove ```html blocks
    if (html.includes("```html")) {
      const match = html.match(/```html\s*\n?([\s\S]*?)\n?```/);
      if (match) {
        html = match[1];
      }
    }
    // Remove generic ``` blocks
    else if (html.includes("```")) {
      const match = html.match(/```\s*\n?([\s\S]*?)\n?```/);
      if (match) {
        html = match[1];
      }
    }

    // Remove any remaining backticks at start/end
    html = html.replace(/^`+|`+$/g, '').trim();

    // Remove "html" text if it appears at the very beginning
    if (html.toLowerCase().startsWith('html')) {
      html = html.substring(4).trim();
    }

    // Clean up end of HTML if it contains closing markers or extra text
    if (html.includes("</html>")) {
      const htmlEndIndex = html.lastIndexOf("</html>") + 7;
      html = html.substring(0, htmlEndIndex);
    }

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
    const { data: updatedWebsiteData, error: updateError } = await supabase
      .from("websites")
      .update({
        html_content: html,
        updated_at: new Date().toISOString()
      })
      .eq("id", websiteId)
      .select('user_id')
      .single();

    if (updateError) {
      console.error('⚠️ Database update error:', updateError);
      // Continue anyway, client will still get the updated HTML
    } else {
      console.log('✅ Database updated successfully');

      // Save conversation history
      if (updatedWebsiteData?.user_id) {
        const { saveConversation } = await import("@/utils/conversation-storage");

        // Construct the new messages to append
        const newMessages: Message[] = [
          { role: 'user', content: userPrompt, timestamp: new Date() },
          { role: 'assistant', content: explanation, timestamp: new Date() }
        ];

        // Combine with existing history for saving (optional, or just save new ones if upsert handles it? 
        // The utility replaces the whole array or appends? 
        // Looking at conversation-storage.ts: it uses UPSERT on the 'conversations' table which has a 'messages' jsonb column.
        // It seems to expect the FULL history to be passed if we want to store the full history.
        // But wait, the utility `saveConversation` takes `messages: Message[]`.
        // Let's check `conversation-storage.ts` again.
        // It maps `messages` to `messagesForDb` and upserts.
        // So we should pass the FULL updated history.

        const updatedHistory: Message[] = [
          ...conversationHistory.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp || Date.now())
          })),
          ...newMessages
        ];

        await saveConversation(websiteId, updatedWebsiteData.user_id, updatedHistory, supabase);
      }
    }

    console.log('🎉 Returning success response');
    return NextResponse.json({
      html,
      explanation,
      tokenUsage
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
