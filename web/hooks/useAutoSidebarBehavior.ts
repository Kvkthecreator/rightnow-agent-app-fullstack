import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSidebarStore } from '@/lib/stores/sidebarStore'

export function useAutoSidebarBehavior() {
  const pathname = usePathname()
  const setCollapsible = useSidebarStore((s) => s.setCollapsible)

  useEffect(() => {
    const shouldCollapse = pathname.startsWith('/baskets') || pathname.startsWith('/blocks')
    setCollapsible(shouldCollapse)
  }, [pathname])
}
