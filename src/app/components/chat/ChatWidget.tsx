import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Bot, Send, Loader2, MessageSquare } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useAuth, isAdminOrHR } from '../../contexts/AuthContext'
import { sendChatMessage, type ChatMessage } from '../../../lib/services/chatService'

interface UiMessage extends ChatMessage {
  id: number
  error?: boolean
}

const GREETING_EMPLOYEE = [
  'Hi! I can help you with:',
  '• Your leave balance and recent leave requests',
  '• Your latest payslip',
  '• Your attendance this month',
  '• Your profile details',
].join('\n')

const GREETING_HR = [
  'Hi! I can help you with:',
  '• Pending leave approvals',
  '• Who is on leave today',
  '• Employee counts by department',
  '• Your own leave / attendance / payslip',
].join('\n')

export default function ChatWidget() {
  const { user, role, displayName } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const nextIdRef = useRef(1)

  // Seed greeting once the user is known
  useEffect(() => {
    if (!user) return
    if (messages.length > 0) return
    const greet = isAdminOrHR(role) ? GREETING_HR : GREETING_EMPLOYEE
    setMessages([
      {
        id: nextIdRef.current++,
        role: 'model',
        text: `Hello ${displayName.split(' ')[0] || ''}! ${greet}`,
      },
    ])
  }, [user, role, displayName, messages.length])

  // Autoscroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, sending])

  if (!user) return null

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return

    const userMsg: UiMessage = { id: nextIdRef.current++, role: 'user', text }
    const history: ChatMessage[] = [...messages, userMsg].map(({ role, text }) => ({ role, text }))

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSending(true)

    try {
      const reply = await sendChatMessage(history)
      setMessages((prev) => [
        ...prev,
        { id: nextIdRef.current++, role: 'model', text: reply },
      ])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: nextIdRef.current++,
          role: 'model',
          text: err?.message || 'Something went wrong. Please try again.',
          error: true,
        },
      ])
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open HR assistant"
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white">
          <SheetTitle className="flex items-center gap-2 text-white">
            <Bot className="h-5 w-5" />
            HR Assistant
          </SheetTitle>
          <SheetDescription className="text-blue-100">
            Ask about your leaves, payslip, attendance and more.
          </SheetDescription>
        </SheetHeader>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50"
        >
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {sending && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking…
            </div>
          )}
        </div>

        <div className="border-t bg-white p-3 flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask something…"
            disabled={sending}
            className="flex-1"
          />
          <Button
            type="button"
            size="icon"
            onClick={send}
            disabled={sending || !input.trim()}
            aria-label="Send message"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function MessageBubble({ message }: { message: UiMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm',
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : message.error
              ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-sm'
              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm',
        ].join(' ')}
      >
        {message.text}
      </div>
    </div>
  )
}
