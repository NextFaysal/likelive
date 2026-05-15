const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1"
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!

interface OpenRouterResponse {
  choices?: Array<{ message: { content: string } }>
  error?: { message: string; code: string }
}

function validateResponse(data: OpenRouterResponse): string {
  if (data.error) {
    throw new Error(`OpenRouter API error: ${data.error.message}`)
  }
  if (!data.choices || data.choices.length === 0) {
    throw new Error("No response choices returned from OpenRouter")
  }
  if (!data.choices[0].message?.content) {
    throw new Error("Empty content in OpenRouter response")
  }
  return data.choices[0].message.content
}

/**
 * Transcribe audio using OpenRouter.
 * Note: OpenRouter's chat/completions endpoint does NOT support direct audio
 * transcription like OpenAI's /audio/transcriptions endpoint. For real audio
 * transcription, you should use OpenAI's API directly or a dedicated
 * transcription service. This function uses a multimodal LLM approach as a
 * workaround — it sends the audio URL as context and asks the model to
 * transcribe, which works only if the model supports audio URL processing.
 */
export async function transcribeAudio(audioUrl: string): Promise<string> {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    },
    body: JSON.stringify({
      // Use a model that supports multimodal input (audio URLs)
      model: "google/gemini-2.5-flash-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please transcribe the following audio file accurately. Output only the transcription text, no additional commentary.",
            },
            {
              type: "audio_url",
              audio_url: { url: audioUrl },
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter transcription request failed: ${response.status} - ${errorText}`)
  }

  const data: OpenRouterResponse = await response.json()
  return validateResponse(data)
}

export async function summarizeTranscript(transcript: string): Promise<string> {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    },
    body: JSON.stringify({
      model: "anthropic/claude-3-haiku",
      messages: [
        {
          role: "system",
          content:
            "You are a meeting summarizer. Provide key points in bullet format.",
        },
        {
          role: "user",
          content: `Summarize this meeting transcript:\n\n${transcript}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter summarization request failed: ${response.status} - ${errorText}`)
  }

  const data: OpenRouterResponse = await response.json()
  return validateResponse(data)
}
