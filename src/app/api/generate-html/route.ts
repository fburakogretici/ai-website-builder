import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Message } from "@/utils/conversation-storage";
import { getUserApiKey } from "@/utils/api-keys";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      model = null,
      currentHtml = null,
      conversationHistory = [],
      locale = "tr",
      websiteId = null,
      userId = null
    } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // Get user's preferred AI provider
    let preferredProvider = 'anthropic'; // Default
    let usingUserKey = false;
    let apiKey = '';

    if (userId) {
      // Get user's preferred provider
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('preferred_ai_provider')
        .eq('user_id', userId)
        .single();

      if (prefs?.preferred_ai_provider) {
        preferredProvider = prefs.preferred_ai_provider;
      }

      // Try to get user's API key for their preferred provider
      const userKey = await getUserApiKey(userId, preferredProvider as any, supabase);
      if (userKey) {
        apiKey = userKey;
        usingUserKey = true;
        console.log(`🔑 Using user's ${preferredProvider} API key`);
      } else {
        console.log(`🔑 No user ${preferredProvider} API key, trying system key`);
      }
    }

    // Fallback to system keys if user key not found
    if (!apiKey) {
      if (preferredProvider === 'openai') {
        apiKey = process.env.OPENAI_API_KEY || '';
      } else if (preferredProvider === 'anthropic') {
        apiKey = process.env.ANTHROPIC_API_KEY || '';
      }
    }

    if (!apiKey) {
      return NextResponse.json({
        error: locale === 'tr'
          ? `API anahtarı bulunamadı. Lütfen ayarlardan ${preferredProvider.toUpperCase()} API anahtarınızı ekleyin.`
          : `API key not found. Please add your ${preferredProvider.toUpperCase()} API key in settings.`,
        needsApiKey: true,
        provider: preferredProvider
      }, { status: 400 });
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

OUTPUT FORMAT:
Your response MUST contain exactly two sections:
[EXPLANATION]
A friendly, conversational message to the user describing what you changed. Be enthusiastic!
[HTML]
The complete modified HTML code.`
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

OUTPUT FORMAT:
Your response MUST contain exactly two sections:
[EXPLANATION]
A direct, concise, and natural message describing what you created. Just say what you did.
[HTML]
The complete working HTML code.`;

    let userPrompt = "";

    // Format conversation history
    // Limit to last 3 messages to prevent timeout issues
    let historyContext = "";
    if (conversationHistory && conversationHistory.length > 0) {
      historyContext = conversationHistory
        .filter((msg: any) => msg.role === 'user')
        .slice(-3) // Only keep last 3 user messages
        .map((msg: any, index: number) => locale === 'tr'
          ? `Önceki Talep ${index + 1}: ${msg.content}`
          : `Previous Request ${index + 1}: ${msg.content}`
        ).join('\n');
    }

    if (currentHtml) {
      // Modification mode
      userPrompt = locale === "tr"
        ? `Mevcut Web Sitesi:
\`\`\`html
${currentHtml}
\`\`\`

${historyContext ? `GEÇMİŞ KONUŞMA (Bağlam için):\n${historyContext}\n\n` : ''}

Kullanıcı İsteği (ŞİMDİ YAPILACAK): "${prompt}"

GÖREV: Yukarıdaki HTML'i kullanıcı isteğine göre değiştir.
YANIT FORMATI:
[EXPLANATION]
Yaptığın değişiklikleri anlatan doğal ve direkt bir mesaj.
[HTML]
<!DOCTYPE html>
...TÜM HTML KODU...
</html>

ÖNEMLİ: KESİNLİKLE SADECE DEĞİŞEN KISMI DEĞİL, TÜM HTML KODUNU BAŞTAN SONA DÖNDÜR.`
        : `Current Website:
\`\`\`html
${currentHtml}
\`\`\`

${historyContext ? `CONVERSATION HISTORY (For context):\n${historyContext}\n\n` : ''}

User Request (ACTION TO TAKE NOW): "${prompt}"

TASK: Modify the above HTML according to user request.
RESPONSE FORMAT:
[EXPLANATION]
A direct and natural message describing your changes.
[HTML]
<!DOCTYPE html>
...ENTIRE HTML CODE...
</html>

IMPORTANT: RETURN THE COMPLETE HTML CODE FROM START TO FINISH.`;
    } else {
      // Generation from scratch mode
      userPrompt = locale === "tr"
        ? `Kullanıcı İsteği: "${prompt}"

GÖREV:
1. İsteği analiz et
2. Modern ve profesyonel bir site oluştur

YANIT FORMATI:
[EXPLANATION]
Oluşturduğun siteyi anlatan doğal ve direkt bir mesaj.
[HTML]
Tam HTML kodu.`
        : `User Request: "${prompt}"

TASK:
1. Analyze request
2. Create a modern, professional website

RESPONSE FORMAT:
[EXPLANATION]
A direct and natural message describing the site you created.
[HTML]
Complete HTML code.`;
    }

    // Determine model to use
    const selectedModel = model || (
      preferredProvider === 'openai'
        ? 'gpt-4o-mini'
        : 'claude-3-5-haiku-20241022'
    );

    console.log(`🤖 Calling ${preferredProvider.toUpperCase()} with model: ${selectedModel}...`);

    let fullResponse = "";
    let tokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

    if (preferredProvider === 'openai') {
      // OpenAI GPT API
      const openai = new OpenAI({ apiKey });

      const completion = await openai.chat.completions.create({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
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
      const anthropic = new Anthropic({ apiKey });

      const message = await anthropic.messages.create({
        model: selectedModel,
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      fullResponse = message.content[0].type === "text" ? message.content[0].text : "";
      tokenUsage = {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
        totalTokens: message.usage.input_tokens + message.usage.output_tokens
      };
    }

    // Parse response
    const explanationMatch = fullResponse.match(/\[EXPLANATION\]([\s\S]*?)\[HTML\]/);
    const htmlMatch = fullResponse.match(/\[HTML\]([\s\S]*)/);

    let explanation = explanationMatch
      ? explanationMatch[1].trim()
      : (currentHtml
        ? (locale === 'tr' ? '✅ Değişiklikler uygulandı!' : '✅ Changes applied!')
        : (locale === 'tr' ? '✅ Web siteniz oluşturuldu!' : '✅ Website created!')
      );

    let html = "";

    if (htmlMatch) {
      html = htmlMatch[1].trim();
    } else {
      // Fallback: Look for <!DOCTYPE html>
      const doctypeIndex = fullResponse.indexOf("<!DOCTYPE html>");
      if (doctypeIndex !== -1) {
        html = fullResponse.substring(doctypeIndex);
        if (!explanationMatch) {
          const potentialExplanation = fullResponse.substring(0, doctypeIndex).trim();
          if (potentialExplanation) {
            explanation = potentialExplanation;
          }
        }
      } else {
        html = fullResponse;
      }
    }

    // Remove markdown blocks from HTML if present - AGGRESSIVE CLEANING
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

    // Clean up end of HTML
    if (html.includes("</html>")) {
      const htmlEndIndex = html.lastIndexOf("</html>") + 7;
      html = html.substring(0, htmlEndIndex);
    }

    // Validate HTML
    const lowerHtml = html.toLowerCase();
    if (!lowerHtml.includes("<!doctype") && !lowerHtml.includes("<html")) {
      console.error("❌ Invalid HTML generated");
      throw new Error("Invalid HTML generated: Missing DOCTYPE or html tag");
    }

    console.log(`✅ HTML generated! Tokens: ${tokenUsage.outputTokens}`);

    // Extract business name
    const businessNameMatch = html.match(/<title>(.*?)<\/title>/);
    const businessName = businessNameMatch ? businessNameMatch[1] : "My Website";

    // Save conversation history if websiteId is present
    if (websiteId) {
      try {
        const { data: websiteData } = await supabase
          .from("websites")
          .select("user_id")
          .eq("id", websiteId)
          .single();

        if (websiteData?.user_id) {
          const { saveConversation } = await import("@/utils/conversation-storage");

          const newMessages: Message[] = [
            { role: 'user', content: prompt, timestamp: new Date() },
            { role: 'assistant', content: explanation, timestamp: new Date() }
          ];

          const updatedHistory: Message[] = [
            ...conversationHistory.map((msg: any) => ({
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp || Date.now())
            })),
            ...newMessages
          ];

          await saveConversation(websiteId, websiteData.user_id, updatedHistory, supabase);
        }
      } catch (saveError) {
        console.error("Failed to save conversation:", saveError);
      }
    }

    return NextResponse.json({
      success: true,
      html: html.trim(),
      businessName: businessName,
      explanation: explanation,
      model: selectedModel,
      usingUserKey: usingUserKey,
      provider: preferredProvider,
      tokenUsage: {
        inputTokens: tokenUsage.inputTokens,
        outputTokens: tokenUsage.outputTokens,
        totalTokens: tokenUsage.totalTokens
      },
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
