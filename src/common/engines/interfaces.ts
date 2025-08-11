export interface IModel {
    id: string
    name: string
    description?: string
}

export interface IMessage {
    role: string
    content: string
}

export interface IMessageRequest {
    rolePrompt: string
    commandPrompt: string
    // Optional multi-turn chat support. If provided, engine implementations can ignore rolePrompt/commandPrompt
    // and instead send the full messages array (with an optional system message at index 0).
    messages?: IMessage[]
    onMessage: (message: { content: string; role: string; isFullText?: boolean }) => Promise<void>
    onError: (error: string) => void
    onFinished: (reason: string) => void
    onStatusCode?: (statusCode: number) => void
    signal: AbortSignal
}

export interface IEngine {
    checkLogin: () => Promise<boolean>
    isLocal(): boolean
    supportCustomModel(): boolean
    getModel(): Promise<string>
    listModels(apiKey: string | undefined): Promise<IModel[]>
    sendMessage(req: IMessageRequest): Promise<void>
}
