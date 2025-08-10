import { getLocalDB, ChatSession, ChatMessage } from './db'
import { nanoid } from 'nanoid'

export interface CreateSessionOptions {
    title?: string
    seedMessages?: Omit<ChatMessage, 'id' | 'sessionId' | 'createdAt' | 'orderIndex'>[]
}

export const chatService = {
    async createSession(opts: CreateSessionOptions = {}): Promise<string> {
        const db = getLocalDB()
        const id = nanoid()
        const now = Date.now()
        const session: ChatSession = {
            id,
            title: opts.title || 'Session',
            createdAt: now,
            updatedAt: now,
        }
        await db.chatSession.add(session)
        if (opts.seedMessages?.length) {
            let idx = 0
            await db.chatMessage.bulkAdd(
                opts.seedMessages.map((m) => ({
                    id: nanoid(),
                    sessionId: id,
                    role: m.role,
                    content: m.content,
                    createdAt: now + idx,
                    orderIndex: idx++,
                    meta: m.meta,
                }))
            )
        }
        return id
    },
    async listSessions(): Promise<ChatSession[]> {
        return getLocalDB().chatSession.orderBy('updatedAt').reverse().toArray()
    },
    async getSession(sessionId: string): Promise<ChatSession | undefined> {
        return getLocalDB().chatSession.get(sessionId)
    },
    async addMessage(
        sessionId: string,
        role: ChatMessage['role'],
        content: string,
        meta?: ChatMessage['meta']
    ): Promise<string> {
        const db = getLocalDB()
        const now = Date.now()
        const orderIndex = await db.chatMessage.where({ sessionId }).count()
        const id = nanoid()
        await db.transaction('rw', db.chatSession, db.chatMessage, async () => {
            await db.chatMessage.add({ id, sessionId, role, content, createdAt: now, orderIndex, meta })
            await db.chatSession.update(sessionId, { updatedAt: now })
        })
        return id
    },
    async updateMessageContent(id: string, content: string) {
        await getLocalDB().chatMessage.update(id, { content })
    },
    async listMessages(sessionId: string): Promise<ChatMessage[]> {
        return getLocalDB().chatMessage.where({ sessionId }).sortBy('orderIndex')
    },
    async deleteSession(sessionId: string) {
        const db = getLocalDB()
        await db.transaction('rw', db.chatSession, db.chatMessage, async () => {
            await db.chatMessage.where({ sessionId }).delete()
            await db.chatSession.delete(sessionId)
        })
    },
}
