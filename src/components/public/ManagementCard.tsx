import { Card } from "@/components/ui/card";
import type { PublicManagementMember } from "@/lib/public.functions";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

export function ManagementCard({ member }: { member: PublicManagementMember }) {
  return (
    <Card
      tabIndex={0}
      className="group flex h-full flex-col overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 hover:border-secondary hover:shadow-[0_12px_30px_-12px_color-mix(in_oklab,var(--secondary)_55%,transparent)] focus-visible:-translate-y-1 focus-visible:border-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-secondary/10">
        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={`Фото: ${member.full_name}, ${member.position}`}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105 group-focus-visible:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center text-3xl font-bold text-secondary"
          >
            {initials(member.full_name)}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3 sm:p-4">
        <p className="text-sm font-semibold leading-snug text-secondary sm:text-base">
          {member.full_name}
        </p>
        <p className="text-xs font-medium text-primary sm:text-sm">{member.position}</p>
        {member.bio ? (
          <p className="mt-1 line-clamp-3 text-xs text-muted-foreground sm:text-sm">{member.bio}</p>
        ) : null}
      </div>
    </Card>
  );
}
