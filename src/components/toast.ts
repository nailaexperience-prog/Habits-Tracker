import { createContext, useContext } from 'react'

export const ToastContext = createContext<(t: string) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}
