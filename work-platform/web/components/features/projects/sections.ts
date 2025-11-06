/**
 * Project-level navigation sections
 * Defines the tabs/sections visible when viewing a project
 */

import {
  LayoutDashboard,
  Layers,
  GitPullRequest,
  FileText,
  type LucideIcon,
} from "lucide-react";

export type ProjectSection = {
  key: string;
  label: string;
  icon: LucideIcon;
  href: (projectId: string) => string;
  description?: string;
};

export const PROJECT_SECTIONS: ProjectSection[] = [
  {
    key: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    href: (id) => `/projects/${id}/overview`,
    description: "Project dashboard with key metrics and status",
  },
  {
    key: "context",
    label: "Context",
    icon: Layers,
    href: (id) => `/projects/${id}/context`,
    description: "Manage knowledge base and context items",
  },
  {
    key: "work-review",
    label: "Work Review",
    icon: GitPullRequest,
    href: (id) => `/projects/${id}/work-review`,
    description: "Review and manage work requests",
  },
  {
    key: "reports",
    label: "Reports",
    icon: FileText,
    href: (id) => `/projects/${id}/reports`,
    description: "View generated reports and artifacts",
  },
];

export const SECTION_ORDER: ProjectSection[] = PROJECT_SECTIONS;

/**
 * Get section by key
 */
export function getSection(key: string): ProjectSection | undefined {
  return PROJECT_SECTIONS.find((s) => s.key === key);
}

/**
 * Get section by path
 */
export function getSectionByPath(path: string): ProjectSection | undefined {
  return PROJECT_SECTIONS.find((s) => path.includes(`/${s.key}`));
}
