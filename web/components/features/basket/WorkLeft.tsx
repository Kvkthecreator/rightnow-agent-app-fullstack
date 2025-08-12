'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useBasket } from '@/hooks/useBasket';
import { useFocus } from './FocusContext';
import { useEffect } from 'react';

const navigation = [
  { label: 'Dashboard', href: '', key: 'd' },
  { label: 'Blocks', href: '/blocks', key: 'b' },
  { label: 'Context', href: '/context', key: 'c' },
  { label: 'Documents', href: '/documents', key: 'o' },
  { label: 'Insights', href: '/insights', key: 'i' },
  { label: 'History', href: '/history', key: 'h' },
];

export default function WorkLeft({ basketId }: { basketId: string }) {
  const { data } = useBasket(basketId);
  const router = useRouter();
  const pathname = usePathname();
  const { setFocus } = useFocus();
  const base = `/baskets/${basketId}/work`;
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Check for 'g' prefix + nav key
      if (e.key === 'g') {
        e.preventDefault();
        let waitingForSecondKey = true;
        
        const handleSecondKey = (e2: KeyboardEvent) => {
          if (!waitingForSecondKey) return;
          waitingForSecondKey = false;
          
          const item = navigation.find(nav => nav.key === e2.key);
          if (item) {
            e2.preventDefault();
            router.push(`${base}${item.href}`);
            setFocus({ kind: 'dashboard' });
          }
          
          document.removeEventListener('keydown', handleSecondKey);
        };
        
        document.addEventListener('keydown', handleSecondKey);
        
        // Cleanup if no second key pressed within 2 seconds
        setTimeout(() => {
          waitingForSecondKey = false;
          document.removeEventListener('keydown', handleSecondKey);
        }, 2000);
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [router, base, setFocus]);

  return (
    <nav className="w-64 border-r border-gray-200 bg-gray-50 h-full flex flex-col">
      <div className="p-4">
        {/* Basket header */}
        <div className="mb-6">
          <div className="text-xs font-medium text-gray-500 mb-1">BASKET</div>
          <div className="font-medium text-gray-900 truncate">{data?.title ?? 'Untitled'}</div>
          <div className="text-xs text-gray-500 mt-1">{data?.status ?? 'INIT'}</div>
        </div>
        
        {/* Navigation */}
        <div>
          <h2 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">Navigation</h2>
          <ul className="space-y-1">
            {navigation.map(item => {
              const fullPath = `${base}${item.href}`;
              const isActive = pathname === fullPath || (item.href === '' && pathname === base);
              
              return (
                <li key={item.label}>
                  <Link
                    href={fullPath}
                    onClick={() => setFocus({ kind: 'dashboard' })}
                    className={`
                      flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors
                      ${isActive 
                        ? 'bg-white shadow-sm font-medium text-gray-900 border border-gray-200' 
                        : 'text-gray-600 hover:bg-white hover:text-gray-900'
                      }
                    `}
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-gray-400 font-mono">g {item.key}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      
      {/* Create actions */}
      <div className="mt-auto p-4 border-t border-gray-200">
        <button className="w-full py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
          Add Memory
        </button>
      </div>
    </nav>
  );
}
