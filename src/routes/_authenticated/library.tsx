import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { materialsQuery } from "@/lib/lms-queries";
import { MaterialList } from "@/components/MaterialList";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({
    meta: [
      { title: "Библиотека — Академия «Людиновокабель»" },
      { name: "description", content: "Учебные материалы, инструкции и документы кабельного производства." },
      { property: "og:title", content: "Библиотека учебных материалов" },
      { property: "og:description", content: "Документы, инструкции и регламенты для сотрудников." },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const materials = useQuery(materialsQuery);
  const [q, setQ] = useState("");
  const list = (materials.data ?? []).filter((m) =>
    `${m.title} ${m.description ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary sm:text-3xl">Библиотека материалов</h1>
        <p className="mt-2 text-muted-foreground">Документы, инструкции и регламенты завода.</p>
      </div>
      <Input
        value={q}
        maxLength={100}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Поиск по названию материала"
        className="max-w-md"
      />
      <MaterialList items={list} loading={materials.isLoading} />
    </div>
  );
}