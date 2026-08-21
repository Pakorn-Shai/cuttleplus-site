import "server-only";

import { prisma } from "@/lib/prisma";
import { parseStoredDocument } from "@/core/content/document";
import { semanticSearch } from "@/core/search/embeddings";
import { checkBudget } from "./budget";
import { estimateCost } from "./cost";
import { getProvider } from "./provider";

export interface AssistantAnswer {
  answer: string;
  sources: { title: string; slug: string; excerpt: string; relevance: string }[];
  model: string;
}

/**
 * Natural-language knowledge assistant.
 * Uses semantic search to find relevant content, then asks the AI to
 * synthesize an answer with citations from the knowledge base.
 */
export async function askAssistant(question: string): Promise<AssistantAnswer> {
  await checkBudget();

  // Step 1: Find relevant content via semantic search
  const relevant = await semanticSearch(question, 5);

  if (relevant.length === 0) {
    return {
      answer: "ไม่พบเนื้อหาที่เกี่ยวข้องในคลังความรู้ ลองถามด้วยคำอื่นหรือเพิ่มเนื้อหาในหัวข้อนี้ก่อน",
      sources: [],
      model: "none",
    };
  }

  // Step 2: Load the full content
  const contents = await prisma.content.findMany({
    where: { id: { in: relevant.map((r) => r.contentId) } },
    include: { category: { select: { name: true } } },
  });

  const contextParts = contents.map((c) => {
    const stored = parseStoredDocument(c.contentJson);
    return `## ${c.title}\nCategory: ${c.category?.name ?? "Uncategorized"}\n\n${c.plainText.slice(0, 2000)}`;
  });

  const context = contextParts.join("\n\n---\n\n");

  // Step 3: Ask AI to answer based on the context
  try {
    const provider = getProvider("typhoon");
    const model = process.env.TYPHOON_MODEL || "typhoon-v2.5-30b-a3b-instruct";

    const systemPrompt = [
      "You are a helpful knowledge assistant. Answer the user's question based ONLY on the provided context from their personal knowledge base.",
      "If the context doesn't contain enough information, say so honestly.",
      "Always cite which articles you used to form your answer.",
      "Keep answers concise and in the same language as the question.",
      "Format: Provide a clear answer, then list sources at the end.",
    ].join(" ");

    const userMessage = `Context from knowledge base:\n\n${context}\n\nQuestion: ${question}\n\nPlease answer based on the context above. Include source citations.`;

    const typhoonConfig = {
      apiKey: process.env.TYPHOON_API_KEY,
      baseUrl: (process.env.TYPHOON_BASE_URL || "https://api.opentyphoon.ai/v1").replace(/\/$/, ""),
    };

    const response = await fetch(`${typhoonConfig.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${typhoonConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      return fallbackAnswer(question, contents);
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
      model?: string;
    };

    const answer = payload.choices?.[0]?.message?.content || fallbackAnswer(question, contents).answer;

    return {
      answer,
      sources: contents.map((c) => ({
        title: c.title,
        slug: c.slug,
        excerpt: c.excerpt ?? "",
        relevance: relevant.find((r) => r.contentId === c.id)?.score.toFixed(2) ?? "0",
      })),
      model: payload.model ?? model,
    };
  } catch {
    return fallbackAnswer(question, contents);
  }
}

function fallbackAnswer(question: string, contents: { title: string; slug: string; excerpt: string | null }[]): AssistantAnswer {
  const titles = contents.map((c) => `- [${c.title}](/knowledge/${c.slug})`).join("\n");
  return {
    answer: `จากคลังความรู้ของคุณ มีบทความที่อาจเกี่ยวข้องกับคำถาม "${question}":\n\n${titles}\n\nลองเปิดอ่านบทความเหล่านี้เพื่อหาคำตอบ`,
    sources: contents.map((c) => ({
      title: c.title,
      slug: c.slug,
      excerpt: c.excerpt ?? "",
      relevance: "N/A",
    })),
    model: "fallback",
  };
}