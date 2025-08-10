import React, { useState, useCallback, useRef } from 'react'
import { chatService } from '../internal-services/chat'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSettings } from '../hooks/useSettings'
import { getEngine } from '../engines'
import type { IMessage } from '../engines/interfaces'

interface ChatPanelProps {
    sessionId?: string
    onSessionCreate?: (id: string) => void
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ sessionId, onSessionCreate }) => {
    const messages = useLiveQuery(async () => (sessionId ? await chatService.listMessages(sessionId) : []), [sessionId])
    const [input, setInput] = useState('')
    const { settings } = useSettings()
    const [isStreaming, setIsStreaming] = useState(false)
    const abortRef = useRef<AbortController | null>(null)

    const handleSend = useCallback(async () => {
        if (!input.trim() || !settings) return
        let sid = sessionId
        if (!sid) {
            sid = await chatService.createSession({})
            onSessionCreate?.(sid)
        }
        const userContent = input
        setInput('')
        const userId = await chatService.addMessage(sid!, 'user', userContent)
        void userId // reserved
        const assistantId = await chatService.addMessage(sid!, 'assistant', '')
        const engine = getEngine(settings.provider)
        const controller = new AbortController()
        abortRef.current = controller
        setIsStreaming(true)
        const history = (await chatService.listMessages(sid!)).map((m) => ({
            role: m.role,
            content: m.content,
        })) as IMessage[]
        try {
            await engine.sendMessage({
                rolePrompt: '',
                commandPrompt: '',
                messages: history,
                signal: controller.signal,
                onMessage: async (msg) => {
                    if (!msg.content) return
                    await chatService.updateMessageContent(
                        assistantId,
                        (messages?.find((m) => m.id === assistantId)?.content || '') + msg.content
                    )
                },
                onFinished: () => {
                    setIsStreaming(false)
                },
                onError: (err) => {
                    chatService.updateMessageContent(assistantId, `Error: ${err}`)
                    setIsStreaming(false)
                },
            })
        } catch (e) {
            chatService.updateMessageContent(assistantId, `Error: ${(e as Error).message}`)
            setIsStreaming(false)
        }
    }, [input, sessionId, onSessionCreate, settings, messages])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #ddd', padding: 8 }}>
                {(messages || []).map((m) => (
                    <div key={m.id} style={{ marginBottom: 6 }}>
                        <strong>{m.role}: </strong>
                        <span>{m.content}</span>
                    </div>
                ))}
                {!messages?.length && <div style={{ color: '#888' }}>No messages yet</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
                <textarea
                    style={{ flex: 1 }}
                    rows={2}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={false}
                    placeholder='Type to chat...'
                />
                <button disabled={!input.trim() || isStreaming} onClick={handleSend}>
                    Send
                </button>
                {isStreaming && (
                    <button
                        onClick={() => {
                            abortRef.current?.abort()
                            setIsStreaming(false)
                        }}
                    >
                        Stop
                    </button>
                )}
            </div>
        </div>
    )
}
