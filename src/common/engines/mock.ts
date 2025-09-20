import { AbstractEngine } from './abstract-engine'
import { IMessageRequest, IModel } from './interfaces'

export class Mock extends AbstractEngine {
    isLocal(): boolean {
        return true
    }

    async getModel(): Promise<string> {
        return 'mock-model-dev'
    }

    async listModels(): Promise<IModel[]> {
        return [{ id: 'mock-model-dev', name: 'Mock Development Model' }]
    }

    async sendMessage(req: IMessageRequest): Promise<void> {
        // Generate random text to simulate LLM response
        // replace your `responses` array with this:
        const responses = [
            '✅ All set. I understood your request and drafted a clear next step below.',
            'TL;DR: Implement the change, add a unit test, and ship behind a feature flag.',
            'Heads-up: this is a mock response to keep development fast and token-free.',
            "Here's a concise plan:\n- Add input validation\n- Handle edge cases (null/empty)\n- Log requestId + duration",
            "Try this and see if it unblocks you. If not, I'll suggest a fallback approach.",
            'Note: Your config looks valid. Consider caching for 5–10 minutes to cut latency.',
            'Possible cause: a missing env var. Double-check `.env` and your deployment secrets.',
            "I'd return a 422 here with a helpful message so the client can correct input.",
            'Performance tip: batch DB writes or use a small queue to avoid spikes.',
            'Security tip: never echo raw errors to clients—log them, return a generic message.',
            "Here's a tiny example:\n```ts\nif (!email) throw new Error('email required')\n```",
            'Sample JSON response:\n{\n  "status": "ok",\n  "items": 3,\n  "nextPage": null\n}',
            'Edge case checklist:\n- Empty payload\n- Duplicate IDs\n- Network timeout/retry',
            'Test idea: stub the clock and assert we backoff at ~200/400/800ms.',
            "FYI: I'm streaming this incrementally so you can render tokens as they arrive.",
            'Suggestion: keep the function pure and inject IO via a small adapter.',
            "Looks good! Add a docstring with an example usage and we're golden. ✨",
            "If this were prod, I'd wrap in a circuit breaker to avoid cascading failures.",
            'Quick win: add telemetry for `success|error` and median latency.',
            'Bilingual note: “Implementación sencilla; podemos iterar rápido.” 🇪🇸',
            "Mock response: I'd pick Option A (simpler today), then refactor behind a flag.",
            'Done. If you want a shorter response next time, say: short',
            '✅ Valid input, proceeding with the happy path; errors get retried up to 3×.',
            'Remember to paginate: limit=50 by default, expose `nextCursor` in responses.',
            'Nice catch—coalesce nulls to avoid `undefined` leaks in JSON.',
        ]

        const randomResponse = 'Mock response: ' + responses[Math.floor(Math.random() * responses.length)]
        const words = randomResponse.split(' ')

        // TODO: Simulate streaming response by sending words gradually
        for (let i = 0; i < words.length; i++) {
            if (req.signal.aborted) {
                req.onFinished('cancelled')
                return
            }

            await req.onMessage({
                content: words[i] + (i < words.length - 1 ? ' ' : ''),
                role: 'assistant',
            })

            // Add small delay to simulate realistic streaming
            await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100))
        }

        req.onFinished('stop')
    }
}
