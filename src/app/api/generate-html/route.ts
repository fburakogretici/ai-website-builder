import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Message } from "@/utils/conversation-storage";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, currentHtml = null, conversationHistory = [], locale = "tr", websiteId = null } = body;

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
A direct, concise, and natural message describing what you created.Just say what you did.
[HTML]
The complete working HTML code.`;

    let userPrompt = "";

    // Format conversation history
    let historyContext = "";
    if (conversationHistory && conversationHistory.length > 0) {
      historyContext = conversationHistory
        .filter((msg: any) => msg.role === 'user')
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
Yaptığın değişiklikleri anlatan doğal ve direkt bir mesaj. Direkt ne yaptığını anlat.
[HTML]
<!DOCTYPE html>
...TÜM HTML KODU...
</html>

ÖNEMLİ: KESİNLİKLE SADECE DEĞİŞEN KISMI DEĞİL, TÜM HTML KODUNU BAŞTAN SONA DÖNDÜR. EKSİK KOD DÖNDÜRME.
"<!-- geri kalan kod -->" veya "<!-- ... -->" GİBİ YER TUTUCULAR KULLANMA. HTML'İN HER SATIRINI TEK TEK YAZMALISIN. YER TUTUCU KULLANIRSAN SİTE BOZULUR.`
        : `Current Website:
\`\`\`html
${currentHtml}
\`\`\`

${historyContext ? `CONVERSATION HISTORY (For context):\n${historyContext}\n\n` : ''}

User Request (ACTION TO TAKE NOW): "${prompt}"

TASK: Modify the above HTML according to user request.
RESPONSE FORMAT:
[EXPLANATION]
A direct and natural message describing your changes. Do not start with "Hello" every time.
[HTML]
<!DOCTYPE html>
...ENTIRE HTML CODE...
</html>

IMPORTANT: RETURN THE COMPLETE HTML CODE FROM START TO FINISH. DO NOT RETURN ONLY THE CHANGED PARTS.
DO NOT USE PLACEHOLDERS LIKE "<!-- rest of code -->" OR "<!-- ... -->". YOU MUST WRITE EVERY SINGLE LINE OF HTML. IF YOU USE PLACEHOLDERS, THE SITE WILL BREAK.`;
    } else {
      // Generation from scratch mode
      userPrompt = locale === "tr"
        ? `Kullanıcı İsteği: "${prompt}"

GÖREV:
1. İsteği analiz et
2. Modern ve profesyonel bir site oluştur

YANIT FORMATI:
[EXPLANATION]
Oluşturduğun siteyi anlatan doğal ve direkt bir mesaj. Sitenin özelliklerinden bahset.
[HTML]
Tam HTML kodu.`
        : `User Request: "${prompt}"

TASK:
1. Analyze request
2. Create a modern, professional website

RESPONSE FORMAT:
[EXPLANATION]
A direct and natural message describing the site you created. Do not start with "Hello" every time. Mention key features.
[HTML]
Complete HTML code.`;
    }

    console.log("🤖 Calling Claude 3.5 Haiku (fast & cost-effective)...");

    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const fullResponse = message.content[0].type === "text" ? message.content[0].text : "";

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

    // Remove markdown blocks from HTML if present
    if (html.includes("```html")) {
      html = html.match(/```html\n([\s\S]*?)\n```/)?.[1] || html;
    } else if (html.includes("```")) {
      html = html.match(/```\n([\s\S]*?)\n```/)?.[1] || html;
    }

    // Clean up end of HTML if it contains closing markers or extra text
    if (html.includes("</html>")) {
      const htmlEndIndex = html.lastIndexOf("</html>") + 7;
      html = html.substring(0, htmlEndIndex);
    }

    // Case-insensitive check for HTML validity
    const lowerHtml = html.toLowerCase();
    if (!lowerHtml.includes("<!doctype") && !lowerHtml.includes("<html")) {
      console.error("❌ Invalid HTML generated. Full response:", fullResponse.substring(0, 500) + "...");
      console.error("❌ Extracted HTML:", html.substring(0, 200) + "...");
      throw new Error("Invalid HTML generated: Missing DOCTYPE or html tag");
    }

    console.log(`✅ HTML generated! Tokens: ${message.usage.output_tokens}`);

    // Extract business name from generated HTML for response
    const businessNameMatch = html.match(/<title>(.*?)<\/title>/);
    const businessName = businessNameMatch ? businessNameMatch[1] : "My Website";

    // Save conversation history if websiteId is present
    if (websiteId) {
      try {
        // Fetch user_id from websites table
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
        // Don't block response
      }
    }

    return NextResponse.json({
      success: true,
      html: html.trim(),
      businessName: businessName,
      explanation: explanation,
      model: "claude-3-5-haiku-20241022",
      tokenUsage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
        totalTokens: message.usage.input_tokens + message.usage.output_tokens
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
