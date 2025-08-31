import '../enable-dev-hmr'
import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import { SidebarContainer } from '../../sidebar/SidebarContainer'
import browser from 'webextension-polyfill'
import * as utils from '@/common/utils'

class SidebarManager {
    private container: HTMLDivElement | null = null
    private shadowRoot: ShadowRoot | null = null
    private root: Root | null = null
    private isVisible = false

    async init() {
        // Listen for messages from background script
        browser.runtime.onMessage.addListener((message) => {
            if (message.type === 'toggle-sidebar') {
                this.toggle()
            } else if (message.type === 'show-sidebar') {
                this.show(message.sessionId)
            } else if (message.type === 'hide-sidebar') {
                this.hide()
            }
        })

        // Check if sidebar should be visible on page load
        const result = await browser.storage.session.get(['sidebarVisible', 'sidebarSessionId'])
        if (result.sidebarVisible) {
            this.show(result.sidebarSessionId)
        }
    }

    async show(sessionId?: string) {
        if (this.isVisible) return

        await this.createSidebar()
        this.isVisible = true

        // Save state
        await browser.storage.session.set({
            sidebarVisible: true,
            sidebarSessionId: sessionId || null,
        })
    }

    async hide() {
        if (!this.isVisible) return

        if (this.container) {
            this.container.remove()
            this.container = null
            this.shadowRoot = null
            this.root = null
        }
        this.isVisible = false

        // Save state
        await browser.storage.session.set({
            sidebarVisible: false,
            sidebarSessionId: null,
        })
    }

    async toggle() {
        if (this.isVisible) {
            await this.hide()
        } else {
            await this.show()
        }
    }

    private async createSidebar() {
        if (this.container) return

        // Create container
        this.container = document.createElement('div')
        this.container.id = 'lingualearn-sidebar-container'
        this.container.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            right: 0 !important;
            width: 360px !important;
            height: 100vh !important;
            z-index: 2147483647 !important;
            pointer-events: auto !important;
        `

        // Attach shadow DOM
        this.shadowRoot = this.container.attachShadow({ mode: 'open' })

        // Add styles to shadow DOM
        if (import.meta.hot) {
            const { addViteStyleTarget } = await import('@samrum/vite-plugin-web-extension/client')
            await addViteStyleTarget(this.shadowRoot)
        } else {
            const browserAPI = await utils.getBrowser()
            import.meta.PLUGIN_WEB_EXT_CHUNK_CSS_PATHS?.forEach((cssPath) => {
                const styleEl = document.createElement('link')
                styleEl.setAttribute('rel', 'stylesheet')
                styleEl.setAttribute('href', browserAPI.runtime.getURL(cssPath))
                this.shadowRoot!.appendChild(styleEl)
            })
        }

        // Create React app container
        const app = document.createElement('div')
        this.shadowRoot.appendChild(app)

        // Mount React component
        this.root = createRoot(app)
        this.root.render(<SidebarContainer onClose={() => this.hide()} />)

        // Add to page
        document.body.appendChild(this.container)
    }
}

// Initialize sidebar manager
const sidebarManager = new SidebarManager()
sidebarManager.init()
