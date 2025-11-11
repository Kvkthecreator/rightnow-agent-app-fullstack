'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Layers, Briefcase, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectNavigationProps {
  projectId: string;
}

const tabs = [
  {
    name: 'Overview',
    href: '/overview',
    icon: LayoutDashboard,
  },
  {
    name: 'Context',
    href: '/context',
    icon: Layers,
  },
  {
    name: 'Work Sessions',
    href: '/work-sessions',
    icon: Briefcase,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function ProjectNavigation({ projectId }: ProjectNavigationProps) {
  const pathname = usePathname();

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <nav className="flex space-x-8" aria-label="Project navigation">
          {tabs.map((tab) => {
            const href = `/projects/${projectId}${tab.href}`;
            const isActive = pathname === href || pathname.startsWith(href + '/');
            const Icon = tab.icon;

            return (
              <Link
                key={tab.name}
                href={href}
                className={cn(
                  'inline-flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
