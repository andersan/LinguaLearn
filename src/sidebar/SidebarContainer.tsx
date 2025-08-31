import React, { useState } from 'react'
import { createUseStyles } from 'react-jss'
import { ChatPanel } from '../common/components/ChatPanel'
import { useTheme } from '../common/hooks/useTheme'

interface SidebarContainerProps {
    onClose?: () => void
}

const useStyles = createUseStyles({
    root: {
        position: 'fixed',
        top: 0,
        right: 0,
        width: 360,
        height: '100vh',
        zIndex: 2147483647,
        backgroundColor: '#fff',
        borderLeft: '1px solid #e0e0e0',
        boxShadow: '0 0 15px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-around',
        padding: '10px 0',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#f5f5f5',
    },
    tab: {
        cursor: 'pointer',
        padding: '5px 15px',
        fontWeight: 'bold',
        color: '#333',
        borderBottom: '2px solid transparent',
    },
    activeTab: {
        color: '#007bff',
        borderBottom: '2px solid #007bff',
    },
    content: {
        flex: 1,
        overflowY: 'auto',
    },
    closeButton: {
        'position': 'absolute',
        'top': 10,
        'right': 10,
        'background': 'transparent',
        'border': 'none',
        'fontSize': '18px',
        'cursor': 'pointer',
        'color': '#666',
        '&:hover': {
            color: '#000',
        },
    },
})

const TranslatorPlaceholder = () => (
    <div style={{ padding: 20 }}>
        <h2>Translator</h2>
        <p>Translation functionality will be here.</p>
    </div>
)

export const SidebarContainer: React.FC<SidebarContainerProps> = ({ onClose }) => {
    const [activeView, setActiveView] = useState('chat')
    const { theme } = useTheme()
    const styles = useStyles({ theme })

    return (
        <div className={styles.root}>
            {onClose && (
                <button className={styles.closeButton} onClick={onClose} title='Close sidebar'>
                    ×
                </button>
            )}
            <div className={styles.header}>
                <div
                    className={`${styles.tab} ${activeView === 'chat' ? styles.activeTab : ''}`}
                    onClick={() => setActiveView('chat')}
                >
                    Chat
                </div>
                <div
                    className={`${styles.tab} ${activeView === 'translate' ? styles.activeTab : ''}`}
                    onClick={() => setActiveView('translate')}
                >
                    Translate
                </div>
            </div>
            <div className={styles.content}>
                {activeView === 'chat' && <ChatPanel />}
                {activeView === 'translate' && <TranslatorPlaceholder />}
            </div>
        </div>
    )
}
