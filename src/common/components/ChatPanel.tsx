import React, { useState, useCallback, useRef, useEffect } from 'react'
import { chatService } from '../internal-services/chat'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSettings } from '../hooks/useSettings'
import { getEngine } from '../engines'
import type { IMessage } from '../engines/interfaces'
import { Markdown } from './Markdown'
import { SpinnerIcon } from './SpinnerIcon'
import { Textarea } from 'baseui-sd/textarea'
import { useTheme } from '../hooks/useTheme'
import { createUseStyles } from 'react-jss'
import { Theme } from 'baseui-sd/theme'

interface ChatPanelProps {
    sessionId?: string
    onSessionCreate?: (id: string) => void
}

type BaseThemeType = 'light' | 'dark'
interface IChatPanelStyleProps {
    theme: Theme
    themeType: BaseThemeType
    settings?: { fontSize: number; enableBackgroundBlur: boolean; themeType?: string } | null
    isStreaming: boolean
}

const useStyles = createUseStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 8,
        boxSizing: 'border-box',
        width: '100%',
    },
    messagesWrapper: (p: IChatPanelStyleProps) => ({
        maxHeight: 260,
        overflowY: 'auto',
        border: `1px solid ${p.theme.colors.borderOpaque}`,
        padding: '8px 10px',
        borderRadius: 4,
        width: '100%',
        backgroundColor: p.settings?.enableBackgroundBlur
            ? p.theme.colors.backgroundTertiary + '80'
            : p.theme.colors.backgroundSecondary,
        fontSize: p.settings ? `${p.settings.fontSize - 1}px` : '13px',
        lineHeight: 1.5,
    }),
    messageItem: {
        'marginBottom': 10,
        'padding': '4px 6px',
        'borderRadius': 4,
        'position': 'relative',
        '&:last-child': {
            marginBottom: 0,
        },
    },
    userMessage: (p: IChatPanelStyleProps) => ({
        backgroundColor: p.theme.colors.backgroundPrimary,
        boxShadow: '0 0 0 1px ' + p.theme.colors.borderOpaque,
    }),
    assistantMessage: {},
    messageRole: {
        fontSize: '11px',
        textTransform: 'uppercase',
        fontWeight: 600,
        opacity: 0.6,
        marginBottom: 2,
        userSelect: 'none',
    },
    messageContent: {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    },
    streamingSpinner: {
        display: 'inline-flex',
        marginLeft: 6,
        verticalAlign: 'middle',
    },
    inputRow: {
        display: 'flex',
        flexDirection: 'row',
        gap: 6,
        alignItems: 'flex-end',
    },
    inputContainer: {
        flex: 1,
    },
    inputHintBar: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
        fontSize: '11px',
        justifyContent: 'space-between',
        opacity: 0.9,
    },
    inputHintText: {
        opacity: 0.7,
    },
    controls: {
        display: 'flex',
        gap: 8,
    },
    button: {
        'fontSize': '11px',
        'cursor': 'pointer',
        'background': 'transparent',
        'border': `1px solid transparent`,
        'padding': '4px 8px',
        'borderRadius': 4,
        '&:disabled': {
            opacity: 0.4,
            cursor: 'not-allowed',
        },
        '&:hover:not(:disabled)': {
            background: '#00000010',
        },
    },
})

export const ChatPanel: React.FC<ChatPanelProps> = ({ sessionId, onSessionCreate }) => {
    const messages = useLiveQuery(async () => (sessionId ? await chatService.listMessages(sessionId) : []), [sessionId])
    const [input, setInput] = useState('')
    const { settings } = useSettings()
    const [isStreaming, setIsStreaming] = useState(false)
    const abortRef = useRef<AbortController | null>(null)
    const { theme } = useTheme()

    // auto scroll to bottom when messages change
    const scrollRef = useRef<HTMLDivElement | null>(null)
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isStreaming])

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

    const styles = useStyles({
        theme,
        themeType: settings?.themeType === 'dark' ? 'dark' : 'light',
        settings,
        isStreaming,
    })

    return (
        <div className={styles.root}>
            <div ref={scrollRef} className={styles.messagesWrapper}>
                {(messages || []).map((m) => {
                    const isAssistant = m.role === 'assistant'
                    const isLast = messages?.[messages.length - 1]?.id === m.id
                    return (
                        <div
                            key={m.id}
                            className={[
                                styles.messageItem,
                                isAssistant ? styles.assistantMessage : styles.userMessage,
                            ].join(' ')}
                        >
                            <div className={styles.messageRole}>{m.role}</div>
                            {isAssistant ? (
                                <div style={{ overflowX: 'auto' }}>
                                    <Markdown>{m.content || (isStreaming && m.content === '' ? '...' : '')}</Markdown>
                                    {isStreaming && isLast && (
                                        <div className={styles.streamingSpinner}>
                                            <SpinnerIcon size={14} />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={styles.messageContent}>{m.content}</div>
                            )}
                        </div>
                    )
                })}
                {!messages?.length && <div style={{ color: '#888' }}>No messages yet</div>}
            </div>
            <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                    <Textarea
                        value={input}
                        onChange={(e) => setInput((e.target as HTMLTextAreaElement).value)}
                        size='mini'
                        resize='vertical'
                        rows={Math.min(Math.max(input.split('\n').length, 2), 6)}
                        placeholder='Type to chat...'
                        overrides={{
                            Root: {
                                style: {
                                    fontSize: settings ? `${settings.fontSize}px !important` : '13px',
                                    borderRadius: '4px',
                                    background: settings?.enableBackgroundBlur ? 'transparent !important' : undefined,
                                    borderWidth: settings?.enableBackgroundBlur ? '1px' : undefined,
                                },
                            },
                            Input: {
                                style: {
                                    fontSize: settings ? `${settings.fontSize}px !important` : '13px',
                                    paddingTop: '4px',
                                    paddingRight: '8px',
                                    paddingBottom: '4px',
                                    paddingLeft: '8px',
                                },
                            },
                        }}
                        onKeyDown={(e) => {
                            e.stopPropagation()
                        }}
                        onKeyPress={(e) => {
                            e.stopPropagation()
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                    />
                    <div className={styles.inputHintBar}>
                        <div className={styles.inputHintText}>Press Enter to send, Shift+Enter for newline.</div>
                        <div className={styles.controls}>
                            {isStreaming && (
                                <button
                                    onClick={() => {
                                        abortRef.current?.abort()
                                        setIsStreaming(false)
                                    }}
                                    className={styles.button}
                                >
                                    Stop
                                </button>
                            )}
                            <button
                                disabled={!input.trim() || isStreaming}
                                onClick={handleSend}
                                className={styles.button}
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
