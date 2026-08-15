import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { publicLegalDocumentsQuery, siteContactsQuery } from "@/lib/public-queries";

export const Route = createFileRoute("/_public")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(siteContactsQuery);
    void context.queryClient.prefetchQuery(publicLegalDocumentsQuery);
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
