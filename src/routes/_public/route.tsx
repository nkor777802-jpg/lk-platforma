import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { siteContactsQuery } from "@/lib/public-queries";

export const Route = createFileRoute("/_public")({
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(siteContactsQuery);
  },
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
