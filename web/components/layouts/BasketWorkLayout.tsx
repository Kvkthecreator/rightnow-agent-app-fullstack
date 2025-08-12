import { ReactNode } from 'react';

export default function BasketWorkLayout({
  left, center, right,
}: { left?: ReactNode; center: ReactNode; right?: ReactNode }) {
  return (
    <div className="grid min-h-[calc(100vh-56px)] grid-cols-[260px_1fr_320px] gap-4 p-4">
      <aside>{left}</aside>
      <main>{center}</main>
      <aside className="hidden lg:block">{right}</aside>
    </div>
  );
}
