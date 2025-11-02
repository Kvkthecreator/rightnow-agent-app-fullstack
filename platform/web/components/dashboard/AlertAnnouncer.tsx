'use client';

import { useEffect, useRef } from 'react';

import { notificationAPI } from '@/lib/api/notifications';

export type DashboardAlert = {
  id: string;
  severity: 'warning' | 'error';
  title: string;
  message: string;
  action_href?: string;
  action_label?: string;
};

export default function AlertAnnouncer({ alerts }: { alerts: DashboardAlert[] }) {
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    alerts.forEach((alert) => {
      if (alert.severity !== 'error') return;
      const key = `${alert.id}:${alert.severity}`;
      if (seen.current.has(key)) return;

      notificationAPI
        .emitSystemAlert(`dashboard.${alert.id}`, `${alert.title}: ${alert.message}`, alert.severity)
        .catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[AlertAnnouncer] emitSystemAlert failed', error);
          }
        });

      seen.current.add(key);
    });
  }, [alerts]);

  return null;
}
