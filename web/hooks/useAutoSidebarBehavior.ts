import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSidebarStore } from '@/lib/stores/sidebarStore'

export function useAutoSidebarBehavior() {
  const pathname = usePathname()
  const setCollapsible = useSidebarStore((s) => s.setCollapsible)
  const openSidebar = useSidebarStore((s) => s.openSidebar)
  const closeSidebar = useSidebarStore((s) => s.closeSidebar)

  useEffect(() => {
    const hideSidebar =
      /^\/baskets\/[^/]+\/work/.test(pathname)

    setCollapsible(hideSidebar)

    if (hideSidebar) {
      closeSidebar()
    } else {
      openSidebar()
    }
  }, [pathname])
}
