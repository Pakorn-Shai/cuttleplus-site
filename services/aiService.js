// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config({ quiet: true })

function extractAIContent(data) {
  const message = data?.choices?.[0]?.message
  const content = message?.content

  if (typeof content === "string") {
    return content.trim()
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part
        return part?.text ?? part?.content ?? ""
      })
      .join("")
      .trim()
  }

  if (typeof data?.choices?.[0]?.text === "string") {
    return data.choices[0].text.trim()
  }

  return ""
}

/**
 * @param {{
 *   model: string,
 *   prompt?: string,
 *   messages?: Array<{ role: string, content: string }>,
 *   temperature?: number,
 *   max_tokens?: number
 * }} options
 */
async function callAI({ model, prompt, messages, temperature, max_tokens }) {

  if (!model) {
    throw new Error("AI model is required before calling callAI()");
  }

  const finalMessages = messages ?? (prompt
    ? [
        {
          role: "user",
          content: prompt,
        },
      ]
    : undefined)

  if (!finalMessages) {
    throw new Error("AI prompt or messages are required before calling callAI()");
  }

  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY environment variable is required");
  }

  console.error("🚨 MODEL SENT TO API:", model);

  const envTemperature = Number(process.env.AI_TEMPERATURE)
  const envMaxTokens = Number(process.env.AI_MAX_TOKENS)
  const finalTemperature = temperature ?? (Number.isFinite(envTemperature) ? envTemperature : 0.7)
  const finalMaxTokens = max_tokens ?? (Number.isFinite(envMaxTokens) ? envMaxTokens : 1000)
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: finalMessages,
      temperature: finalTemperature,
      max_tokens: finalMaxTokens,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  const content = extractAIContent(data)

  if (!content) {
    const finishReason = data?.choices?.[0]?.finish_reason ?? "unknown"
    throw new Error(`AI response was empty for model ${model}; finish_reason=${finishReason}`)
  }

  return content
}

module.exports = { callAI }