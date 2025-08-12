import { ReactNode } from 'react';

export default function BasketWorkLayout({
  left, center, right,
}: { left?: ReactNode; center: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <nav aria-label="Basket navigation" className="flex-shrink-0">
        {left}
      </nav>
      <main className="flex-1 bg-white overflow-hidden">
        {center}
      </main>
      <aside aria-label="Contextual intelligence" className="hidden lg:block flex-shrink-0">
        {right}
      </aside>
    </div>
  );
}
