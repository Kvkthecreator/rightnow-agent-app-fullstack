'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getRecentBaskets } from '@/lib/baskets/getRecentBaskets'
import { createBasketNew } from '@/lib/baskets/createBasketNew'

export default function DashboardRedirect() {
  const router = useRouter()
  useEffect(() => {
    const go = async () => {
      try {
        const recent = await getRecentBaskets(1)
        if (recent && recent.length > 0) {
          router.replace(`/baskets/${recent[0].id}/work`)
        } else {
          const { id } = await createBasketNew({ text_dump: null })
          router.replace(`/baskets/${id}/work`)
        }
      } catch (err) {
        console.error('dashboard redirect failed', err)
      }
    }
    go()
  }, [router])

  return <div className="p-8 text-muted-foreground">Loading…</div>
}
