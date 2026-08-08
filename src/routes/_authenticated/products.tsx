import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { productsQuery } from "@/lib/lms-queries";
import { EmptyState, LoadingState } from "@/components/states";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/products")({
  head: () => ({
    meta: [
      { title: "Продукция — Академия «Людиновокабель»" },
      { name: "description", content: "Виды кабельно-проводниковой продукции завода и их назначение." },
      { property: "og:title", content: "Продукция завода «Людиновокабель»" },
      { property: "og:description", content: "Виды продукции, назначение и области применения." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const products = useQuery(productsQuery);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-secondary sm:text-3xl">Продукция завода</h1>
        <p className="mt-2 text-muted-foreground">
          Виды кабельно-проводниковой продукции, назначение и области применения.
        </p>
      </div>

      {products.isLoading ? (
        <LoadingState />
      ) : (products.data ?? []).length === 0 ? (
        <EmptyState title="Продукция пока не добавлена" description="Администратор наполнит раздел в админ-панели." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(products.data ?? []).map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold text-foreground">{p.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{p.short_description}</p>
                {p.purpose ? (
                  <p className="mt-3 text-sm">
                    <span className="font-medium text-secondary">Назначение: </span>
                    <span className="text-muted-foreground">{p.purpose}</span>
                  </p>
                ) : null}
                {p.applications?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {p.applications.map((a: string) => (
                      <Badge key={a} variant="secondary">
                        {a}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}