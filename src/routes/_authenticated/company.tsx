import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { departmentsQuery, historyQuery, siteContentQuery } from "@/lib/lms-queries";
import { EmptyState, InlineLoading } from "@/components/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/company")({
  head: () => ({
    meta: [
      { title: "О компании — Академия «Людиновокабель»" },
      { name: "description", content: "История завода, структура и ценности «Людиновокабель»." },
      { property: "og:title", content: "О компании — Людиновокабель" },
      { property: "og:description", content: "История и структура кабельного завода." },
    ],
  }),
  component: CompanyPage,
});

function CompanyPage() {
  const history = useQuery(historyQuery);
  const departments = useQuery(departmentsQuery);
  const content = useQuery(siteContentQuery);

  const about = content.data?.find((c) => c.key === "about");
  const values = content.data?.find((c) => c.key === "values");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-secondary sm:text-3xl">О компании</h1>

      <Tabs defaultValue="about">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="about">Общее</TabsTrigger>
          <TabsTrigger value="history">История</TabsTrigger>
          <TabsTrigger value="structure">Структура</TabsTrigger>
          <TabsTrigger value="values">Ценности</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="pt-6">
          {content.isLoading ? (
            <InlineLoading />
          ) : about ? (
            <Card>
              <CardHeader>
                <CardTitle>{about.title ?? "О заводе"}</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-line text-muted-foreground">
                {about.body}
              </CardContent>
            </Card>
          ) : (
            <EmptyState title="Раздел ещё не заполнен" description="Администратор добавит описание компании в админ-панели." />
          )}
        </TabsContent>

        <TabsContent value="history" className="pt-6">
          {history.isLoading ? (
            <InlineLoading />
          ) : (history.data ?? []).length === 0 ? (
            <EmptyState title="История пока не добавлена" />
          ) : (
            <ol className="relative space-y-6 border-l-2 border-primary/40 pl-6">
              {(history.data ?? []).map((h) => (
                <li key={h.id}>
                  <span className="absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full bg-primary" />
                  <p className="text-sm font-bold uppercase tracking-wide text-primary">{h.year}</p>
                  <h3 className="text-lg font-semibold text-foreground">{h.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{h.description}</p>
                </li>
              ))}
            </ol>
          )}
        </TabsContent>

        <TabsContent value="management" className="pt-6">
          {management.isLoading ? (
            <InlineLoading />
          ) : (management.data ?? []).length === 0 ? (
            <EmptyState title="Руководство пока не добавлено" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(management.data ?? []).map((m) => (
                <ManagementCard key={m.id} member={m} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="structure" className="pt-6">
          {departments.isLoading ? (
            <InlineLoading />
          ) : (departments.data ?? []).length === 0 ? (
            <EmptyState title="Структура пока не добавлена" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(departments.data ?? []).map((d) => (
                <Card key={d.id}>
                  <CardContent className="pt-6">
                    <p className="font-semibold text-foreground">{d.name}</p>
                    {d.head_name ? (
                      <p className="text-sm text-muted-foreground">Руководитель: {d.head_name}</p>
                    ) : null}
                    {d.description ? (
                      <p className="mt-2 text-sm text-muted-foreground">{d.description}</p>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="values" className="pt-6">
          {values ? (
            <Card>
              <CardHeader>
                <CardTitle>{values.title ?? "Ценности и культура производства"}</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-line text-muted-foreground">
                {values.body}
              </CardContent>
            </Card>
          ) : (
            <EmptyState title="Раздел ещё не заполнен" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ManagementCard({ member }: { member: { id: string; full_name: string; position: string; bio?: string | null; photo_url?: string | null } }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!member.photo_url) {
      setPhotoUrl(null);
      return;
    }
    signedUrl(member.photo_url, "management").then((url) => {
      if (mounted) setPhotoUrl(url);
    });
    return () => {
      mounted = false;
    };
  }, [member.photo_url]);

  return (
    <Card>
      <CardContent className="pt-6">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`Фото ${member.full_name}`}
            className="mb-4 aspect-square w-full max-w-[160px] rounded-md object-cover"
            loading="lazy"
          />
        ) : null}
        <p className="text-lg font-semibold text-foreground">{member.full_name}</p>
        <p className="text-sm font-medium text-primary">{member.position}</p>
        {member.bio ? <p className="mt-2 text-sm text-muted-foreground">{member.bio}</p> : null}
      </CardContent>
    </Card>
  );
}
