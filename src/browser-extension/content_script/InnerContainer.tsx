import { computePosition, shift, flip, offset, type ReferenceElement, size } from '@floating-ui/dom'
import { PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react'
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable'
import {
    documentPadding,
    dragRegionSelector,
    popupCardInnerContainerId,
    popupCardMaxWidth,
    popupCardMinHeight,
    popupCardMinHeightAfterTranslation,
    popupCardMinWidth,
    popupCardOffset,
    zIndex,
} from './consts'
import { createUseStyles } from 'react-jss'
import { useTranslatorStore } from '@/common/store'

type Props = {
    reference: ReferenceElement
    disablePositioning?: boolean
} & PropsWithChildren

const useStyles = createUseStyles({
    container: {
        position: 'fixed',
        zIndex,
        borderRadius: '4px',
        boxShadow: '0 0 8px rgba(0,0,0,.3)',
        minWidth: `${popupCardMinWidth}px`,
        maxWidth: `${popupCardMaxWidth}px`,
        lineHeight: '1.6',
        fontSize: '13px',
        color: '#333',
        font: '14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji',
        minHeight: `${popupCardMinHeight}px`,
        width: 'max-content',
    },
    sidebarContainer: {
        'position': 'fixed !important',
        'top': '0 !important',
        'right': '0 !important',
        'width': '400px !important',
        'height': '100vh !important',
        'maxWidth': 'none !important',
        'minWidth': '400px !important',
        'borderRadius': '0 !important',
        'boxShadow': '-4px 0 20px rgba(0,0,0,0.15) !important',
        'display': 'flex !important',
        'flexDirection': 'column !important',
        'overflow': 'hidden !important',
        'transform': 'none !important',
        'left': 'auto !important',
        '& .translator-container': {
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        },
    },
})

export default function InnerContainer({ children, reference, disablePositioning = false }: Props) {
    const styles = useStyles()
    const isSidebarMode = useTranslatorStore((state) => state.isSidebarMode)

    const draggedRef = useRef(false)
    const draggableRef = useRef<HTMLDivElement | null>(null)
    const [position, setPosition] = useState({ x: 0, y: 0 })

    const updatePosition = useCallback(async () => {
        if (!draggableRef.current || disablePositioning) {
            return
        }

        if (isSidebarMode) {
            // Force sidebar position and height constraints
            Object.assign(draggableRef.current.style, {
                left: 'auto',
                right: '0px',
                top: '0px',
                transform: 'none',
                maxHeight: '100vh',
                height: '100vh',
                overflow: 'hidden',
            })
            return
        }

        const { x, y } = await computePosition(reference, draggableRef.current, {
            placement: 'bottom',
            middleware: [
                shift({ padding: documentPadding }),
                offset(popupCardOffset),
                flip(),
                size({
                    apply({ availableHeight, elements }) {
                        if (!isSidebarMode) {
                            Object.assign(elements.floating.style, {
                                maxHeight: `${Math.max(popupCardMinHeightAfterTranslation, availableHeight)}px`,
                                // Allow internal scrolling when content exceeds maxHeight
                                overflow: 'auto',
                            })
                        } else {
                            // TODO: this doesn't get called when changing to sidebar mode, so maxHeight isn't applied
                            Object.assign(elements.floating.style, {
                                maxHeight: `100vh`,
                                height: `100vh`,
                                overflow: 'hidden',
                            })
                        }
                    },
                }),
            ],
            strategy: 'fixed',
        })

        Object.assign(draggableRef.current.style, {
            left: `${Math.max(documentPadding, x)}px`,
            top: `${Math.max(documentPadding, y)}px`,
        })
    }, [reference, disablePositioning, isSidebarMode])

    function handleOnDrag(event: DraggableEvent, data: DraggableData) {
        draggedRef.current = true
        setPosition({ x: data.x, y: data.y })
    }

    useEffect(() => {
        if (!draggableRef.current) {
            return
        }
        const resizeObserver = new ResizeObserver(() => {
            if (draggedRef.current && !isSidebarMode) {
                // do nothing if has been dragged, unless we're switching to sidebar mode
            } else {
                updatePosition()
            }
        })
        resizeObserver.observe(draggableRef.current)
        return () => {
            resizeObserver.disconnect()
        }
    }, [reference, updatePosition, isSidebarMode])

    // Trigger position update when sidebar mode changes
    useEffect(() => {
        updatePosition()
    }, [isSidebarMode, updatePosition])

    return (
        <Draggable
            nodeRef={draggableRef}
            handle={disablePositioning || isSidebarMode ? undefined : dragRegionSelector}
            bounds='html'
            position={position}
            onDrag={handleOnDrag}
            disabled={disablePositioning || isSidebarMode}
        >
            <div
                ref={draggableRef}
                className={`${styles.container} ${isSidebarMode ? styles.sidebarContainer : ''}`}
                id={popupCardInnerContainerId}
            >
                {children}
            </div>
        </Draggable>
    )
}
