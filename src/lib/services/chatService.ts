import { supabase } from '../supabase'

export interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

/**
 * Send the conversation so far to the `hr-chat` Supabase Edge Function and
 * return the assistant's reply. The function reads the user's identity & role
 * from the session JWT — no client-supplied user context is trusted.
 */
export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('You must be signed in to use the HR assistant.')
  }

  const { data, error } = await supabase.functions.invoke<{ reply?: string; error?: string }>(
    'hr-chat',
    { body: { messages } },
  )

  if (error) {
    // supabase-js wraps non-2xx into a FunctionsHttpError whose `.context` is
    // the underlying Response. Read its body to surface the real reason.
    const ctx = (error as { context?: Response }).context
    let detail = ''
    if (ctx && typeof ctx.text === 'function') {
      try {
        const raw = await ctx.text()
        try {
          detail = JSON.parse(raw)?.error || raw
        } catch {
          detail = raw
        }
      } catch {
        // ignore
      }
    }
    throw new Error(detail || error.message || 'Chat request failed.')
  }
  if (!data?.reply) {
    throw new Error(data?.error || 'No reply from assistant.')
  }
  return data.reply
}
