import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="h-full">
      <CardContent className="pt-6">
        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={`Фото: ${member.full_name}, ${member.position}`}
            className="mb-4 aspect-square w-full max-w-[180px] rounded-md object-cover"
            loading="lazy"
          />
        ) : (
          <div
            aria-hidden="true"
            className="mb-4 flex aspect-square w-full max-w-[180px] items-center justify-center rounded-md bg-secondary/10 text-2xl font-bold text-secondary"
          >
            {initials(member.full_name)}
          </div>
        )}
        <p className="text-lg font-semibold text-foreground">{member.full_name}</p>
        <p className="text-sm font-medium text-primary">{member.position}</p>
        {member.bio ? (
          <p className="mt-2 text-sm text-muted-foreground">{member.bio}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
