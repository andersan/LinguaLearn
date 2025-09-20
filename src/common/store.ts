import { create } from 'zustand'

interface ITranslatorState {
    externalOriginalText?: string
    isSidebarMode: boolean
}

export const useTranslatorStore = create<ITranslatorState>()(() => ({
    externalOriginalText: undefined,
    isSidebarMode: false,
}))

export const setExternalOriginalText = (text: string) => useTranslatorStore.setState({ externalOriginalText: text })
export const setSidebarMode = (isSidebarMode: boolean) => useTranslatorStore.setState({ isSidebarMode })
export const toggleSidebarMode = () => useTranslatorStore.setState((state) => ({ isSidebarMode: !state.isSidebarMode }))
