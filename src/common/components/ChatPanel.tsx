import React, { useState, useCallback } from 'react'
import { chatService } from '../internal-services/chat'
import { useLiveQuery } from 'dexie-react-hooks'

interface ChatPanelProps {
    sessionId?: string
    onSessionCreate?: (id: string) => void
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ sessionId, onSessionCreate }) => {
    const messages = useLiveQuery(async () => (sessionId ? await chatService.listMessages(sessionId) : []), [sessionId])
    const [input, setInput] = useState('')

    const handleSend = useCallback(async () => {
        if (!input.trim()) return
        let sid = sessionId
        if (!sid) {
            sid = await chatService.createSession({})
            onSessionCreate?.(sid)
        }
        await chatService.addMessage(sid!, 'user', input)
        // Placeholder assistant echo until engine integration
        await chatService.addMessage(sid!, 'assistant', '(model response placeholder)')
        setInput('')
    }, [input, sessionId, onSessionCreate])

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
                <button disabled={!input.trim()} onClick={handleSend}>
                    Send
                </button>
            </div>
        </div>
    )
}
