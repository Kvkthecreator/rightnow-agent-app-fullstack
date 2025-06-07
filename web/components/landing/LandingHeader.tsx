import Link from 'next/link';
import React from 'react';

export default function LandingHeader() {
  return (
    <header className="w-full py-4 px-5 flex justify-between items-center bg-white">
      <div className="text-xl">
        <Link href="/" className="text-black hover:text-black/80 transition-colors font-pacifico">
          yarnnn
        </Link>
      </div>
      <nav className="flex items-center gap-8">
        <Link href="/about" className="text-black hover:text-black/80 transition-colors">
          About
        </Link>
        <Link href="/login" className="text-black hover:text-black/80 transition-colors">
          Sign-Up/Login
        </Link>
      </nav>
    </header>
  );
}