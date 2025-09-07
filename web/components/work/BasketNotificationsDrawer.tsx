"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useBasketNotifications } from '@/lib/hooks/useBasketNotifications';
import { useRouter } from 'next/navigation';

interface Props {
  basketId?: string;
  open: boolean;
  onClose: () => void;
}

export function BasketNotificationsDrawer({ basketId, open, onClose }: Props) {
  const router = useRouter();
  const { loading, error, activeWork, proposals, events, unseenCount, markSeen, refresh } = useBasketNotifications(basketId);

  React.useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  React.useEffect(() => {
    if (!open) return;
    // Mark seen on close
    return () => markSeen();
  }, [open, markSeen]);

  if (!open) return null;

  const toBasket = (path: string) => {
    if (basketId) router.push(`/baskets/${basketId}/${path}`); else router.push('/baskets');
    onClose();
  };

  return (
    <div className="absolute top-full right-0 mt-2 z-50" role="dialog" aria-label="Notifications">
      <Card className="w-96 shadow-lg border">
        <CardHeader className="pb-3 flex items-center justify-between">
          <CardTitle className="text-sm">Notifications {unseenCount > 0 && (<Badge className="ml-2" variant="secondary">{unseenCount}</Badge>)}</CardTitle>
          <div className="text-xs text-muted-foreground">
            {loading ? 'Updating…' : error ? 'Error' : 'Up to date'}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Active Work */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active</h4>
              <Button size="xs" variant="outline" onClick={() => toBasket('timeline')}>Timeline</Button>
            </div>
            {activeWork.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-4">No active work</div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {activeWork.slice(0, 5).map((w) => (
                  <div key={w.work_id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className={cn('w-2 h-2 rounded-full', 'bg-blue-500')} />
                      <span className="truncate font-medium">{w.work_type.replace('_',' ')}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{w.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Action Required */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Action Required</h4>
              <Button size="xs" variant="outline" onClick={() => toBasket('governance')}>Review</Button>
            </div>
            {proposals.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-4">No pending changes</div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {proposals.slice(0, 5).map((p) => (
                  <div key={p.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-yellow-500" />
                      <span className="truncate font-medium">{p.proposal_kind}</span>
                      <Badge className="text-[10px]" variant="secondary">{p.status}</Badge>
                    </div>
                    {p.impact_summary && (
                      <div className="text-[11px] text-muted-foreground ml-4 truncate">{p.impact_summary}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Events */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recent</h4>
              <Button size="xs" variant="outline" onClick={() => toBasket('timeline')}>Open</Button>
            </div>
            {events.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-4">No recent updates</div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {events.slice(0, 8).map((e) => (
                  <div key={e.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
                      <span className="truncate font-medium">{e.event_type.replace(/[._]/g, ' ')}</span>
                    </div>
                    {e.preview && (
                      <div className="text-[11px] text-muted-foreground ml-4 truncate">{e.preview}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

