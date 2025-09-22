# LinguaLearn - Claude Code Instructions

## Project Overview
LinguaLearn is a browser extension that uses Gen AI APIs for translation and other language learning tasks. It provides a draggable popup interface that can be toggled into sidebar mode for a more comfortable user experience.

## Development Commands

### Linting and Formatting
```bash
pnpm run lint
pnpm run lint:fix
pnpm run format
```

### Testing
```bash
pnpm test
pnpm run test:e2e
```

### Building
```bash
pnpm run build-browser-extension
pnpm run build-userscript
pnpm run build-tauri
```

### Development
```bash
pnpm run dev-chromium
pnpm run dev-firefox
pnpm run dev-tauri
```

### Other Commands
```bash
pnpm run clean
pnpm prepare
```

## Key Architecture

### Browser Extension Structure
- **Content Script**: `/src/browser-extension/content_script/` - Handles page interaction and UI injection
- **Background Script**: `/src/browser-extension/background/` - Manages browser API interactions
- **Popup**: `/src/browser-extension/popup/` - Extension popup interface
- **Options**: `/src/browser-extension/options/` - Extension settings page

### Core Components
- **Translator**: Main translation interface component
- **ChatPanel**: AI chat functionality for language learning
- **InnerContainer**: Draggable/resizable container with sidebar mode support
- **TitleBar**: Container header with controls (pin, sidebar toggle, close)

### Engine System
Located in `/src/common/engines/`, this system provides a unified interface for different AI providers:
- **Supported Providers**: OpenAI, ChatGPT, Azure, Claude, Gemini, Ollama, Groq, and others
- **Mock Engine**: Available for development to avoid consuming real API tokens
- **Interface**: All engines implement `IEngine` with methods for authentication, model listing, and message sending

### Sidebar Implementation
The sidebar mode repositions the existing draggable window to the right side of the browser:
- Toggle via TitleBar button (VscLayoutSidebarLeft/VscSplitHorizontal icons)
- Resizes to 400px width and full viewport height
- Disables dragging when in sidebar mode
- Maintains all existing functionality

## Development Notes

### Mock Engine for Development
Use the "Mock" provider in settings to avoid consuming real LLM tokens during development. It generates random responses that simulate real AI behavior with streaming.

### Code Style
- Use TypeScript throughout
- Follow existing ESLint configuration
- Use `createUseStyles` from react-jss for styling
- Prefer existing utility functions over creating new ones

### Testing Approach
Check the codebase for existing test patterns before writing new tests. The project may use specific testing frameworks or utilities.

### Browser Compatibility
The extension supports both Chromium and Firefox browsers with different manifest configurations handled in `/src/browser-extension/manifest.ts`.

## Common Tasks

### Adding a New AI Provider
1. Create new engine class in `/src/common/engines/`
2. Implement the `IEngine` interface
3. Add provider to the `Provider` type and mappings in `/src/common/engines/index.ts`
4. Add appropriate icon to `engineIcons` mapping

### Modifying UI Components
- Most UI uses react-jss for styling
- Components are located in `/src/common/components/`
- Follow existing patterns for theme integration

### Browser Extension Development
- Content scripts are injected into web pages
- Use shadow DOM for style isolation
- Background scripts handle browser API calls
- Message passing used for communication between scripts

## Debugging
- Console logs are available in browser dev tools
- Extension popup has its own dev tools context
- Content script logs appear in the page's console
- Background script logs appear in extension's background page console