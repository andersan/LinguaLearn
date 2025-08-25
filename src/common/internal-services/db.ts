import Dexie, { Table } from 'dexie'
import { TranslateMode } from '../translate'

export interface VocabularyItem {
    word: string
    reviewCount: number
    description: string
    updatedAt: string
    createdAt: string
    [prop: string]: string | number
}

export type ActionOutputRenderingFormat = 'text' | 'markdown' | 'latex'

export interface Action {
    id?: number
    idx: number
    mode?: TranslateMode
    name: string
    icon?: string
    rolePrompt?: string
    commandPrompt?: string
    outputRenderingFormat?: ActionOutputRenderingFormat
    updatedAt: string
    createdAt: string
}

export class LocalDB extends Dexie {
    vocabulary!: Table<VocabularyItem>
    action!: Table<Action>
    chatSession!: Table<ChatSession>
    chatMessage!: Table<ChatMessage>

    constructor() {
        super('lingualearn')
        this.version(4).stores({
            vocabulary: 'word, reviewCount, description, updatedAt, createdAt',
            action: '++id, idx, mode, name, icon, rolePrompt, commandPrompt, outputRenderingFormat, updatedAt, createdAt',
        })
        // v5: add chat tables
        this.version(5).stores({
            chatSession: 'id, updatedAt, createdAt',
            chatMessage: 'id, sessionId, role, createdAt, orderIndex',
        })
    }
}

let localDB: LocalDB

export const getLocalDB = () => {
    if (!localDB) {
        localDB = new LocalDB()
    }
    return localDB
}

// Chat related interfaces (kept here for centralized typing; could be split later)
export interface ChatSession {
    id: string
    title: string
    createdAt: number
    updatedAt: number
}

export interface ChatMessageMeta {
    mode?: TranslateMode
    sourceLang?: string
    targetLang?: string
}

export interface ChatMessage {
    id: string
    sessionId: string
    role: 'system' | 'user' | 'assistant'
    content: string
    createdAt: number
    orderIndex: number
    meta?: ChatMessageMeta
    // transient flags are not persisted
    streaming?: boolean
}
