import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { myNotificationsQuery } from "@/lib/account-queries";
import { markNotificationRead } from "@/lib/account.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

export function NotificationBell() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const notifications = useQuery(myNotificationsQuery(user?.id));
  const mark = useServerFn(markNotificationRead);

  const items = notifications.data ?? [];
  const unread = items.filter((n) => !n.is_read);

  const readAll = async () => {
    await mark({ data: { all: true } });
    void qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Уведомления" className="relative">
          <Bell className="h-5 w-5" />
          {unread.length > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unread.length}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Уведомления</p>
          {unread.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={readAll}>
              Прочитать все
            </Button>
          ) : null}
        </div>
        <ScrollArea className="max-h-80">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">Уведомлений нет.</p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => (
                <li key={n.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    {!n.is_read ? <Badge variant="secondary">новое</Badge> : null}
                  </div>
                  {n.body ? (
                    <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString("ru-RU")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        <div className="border-t border-border px-4 py-2">
          <Link to="/dashboard" className="text-sm text-primary">
            Перейти на главную
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}