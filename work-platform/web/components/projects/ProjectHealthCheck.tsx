'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ProjectHealthCheckProps {
  projectId: string;
  basketId: string | null;
}

interface HealthStatus {
  healthy: boolean;
  issues: string[];
  warnings: string[];
}

export function ProjectHealthCheck({ projectId, basketId }: ProjectHealthCheckProps) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      const issues: string[] = [];
      const warnings: string[] = [];

      // Check 1: Basket exists
      if (!basketId) {
        issues.push('Project has no associated basket - cannot store context');
      }

      // Check 2: Basket is accessible (if basketId exists)
      if (basketId) {
        try {
          const response = await fetch(`/api/projects/${projectId}/context`);
          if (!response.ok) {
            if (response.status === 404) {
              issues.push('Basket not found in database - data may have been deleted');
            } else if (response.status === 500) {
              warnings.push('Unable to verify basket health - substrate connection issues');
            }
          }
        } catch (error) {
          warnings.push('Network error checking basket health');
        }
      }

      setHealth({
        healthy: issues.length === 0,
        issues,
        warnings,
      });
      setChecking(false);
    };

    checkHealth();
  }, [projectId, basketId]);

  if (checking) {
    return null; // Don't show anything while checking
  }

  if (!health || health.healthy) {
    return null; // Don't show if healthy
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-900">
            Project Health Issues
          </h3>
          <div className="mt-2 space-y-1">
            {health.issues.map((issue, i) => (
              <p key={i} className="text-sm text-red-700">
                • {issue}
              </p>
            ))}
            {health.warnings.map((warning, i) => (
              <p key={i} className="text-sm text-amber-700">
                ⚠ {warning}
              </p>
            ))}
          </div>
          <p className="mt-3 text-xs text-red-600">
            This project may have been created during a service outage. Contact support or create a new project.
          </p>
        </div>
      </div>
    </div>
  );
}
