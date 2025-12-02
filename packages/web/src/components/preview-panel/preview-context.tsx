import * as React from "react"

interface PreviewPanelContextValue {
  // Panel state
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void

  // Refresh system - increment refreshKey to trigger re-fetch
  refreshKey: number
  refresh: () => void
}

const PreviewPanelContext = React.createContext<PreviewPanelContextValue | null>(null)

export function usePreviewPanel() {
  const context = React.useContext(PreviewPanelContext)
  if (!context) {
    throw new Error("usePreviewPanel must be used within a PreviewPanelProvider")
  }
  return context
}

interface PreviewPanelProviderProps {
  children: React.ReactNode
  defaultOpen?: boolean
}

export function PreviewPanelProvider({
  children,
  defaultOpen = false
}: PreviewPanelProviderProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const [refreshKey, setRefreshKey] = React.useState(0)

  const open = React.useCallback(() => setIsOpen(true), [])
  const close = React.useCallback(() => setIsOpen(false), [])
  const toggle = React.useCallback(() => setIsOpen(prev => !prev), [])
  const refresh = React.useCallback(() => setRefreshKey(prev => prev + 1), [])

  const value = React.useMemo<PreviewPanelContextValue>(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      refreshKey,
      refresh,
    }),
    [isOpen, open, close, toggle, refreshKey, refresh]
  )

  return (
    <PreviewPanelContext.Provider value={value}>
      {children}
    </PreviewPanelContext.Provider>
  )
}
