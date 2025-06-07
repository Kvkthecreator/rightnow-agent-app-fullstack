import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const Sidebar = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden p-4">
        <button onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar Content */}
      <aside className={`fixed top-0 left-0 h-full bg-white shadow z-40 transform ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-200 w-64 md:relative md:block`}>
        <div className="p-4 space-y-4">
          <div className="text-xl font-semibold">yarnnn</div>
          <nav className="flex flex-col space-y-2">
            <Link href="/dashboard">🏠 Dashboard</Link>
            <Link href="/baskets">🧺 Baskets</Link>
            <Link href="/baskets/new">📄 New Basket</Link>
            <Link href="/blocks">📚 Blocks</Link>
            <Link href="/queue">🪄 Queue</Link>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
