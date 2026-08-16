import { Link } from "@tanstack/react-router";
import { Factory } from "lucide-react";
import type { GameCatalogItem } from "@/lib/games-catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function GameCard({
  game,
  bestScore,
}: {
  game: GameCatalogItem;
  bestScore?: number;
}) {
  const soon = game.status === "soon";

  return (
    <Card className="flex h-full flex-col overflow-hidden border-border bg-card shadow-sm ring-1 ring-secondary/5">
      <div className="relative flex h-40 items-center justify-center bg-muted/60">
        {game.previewSrc ? (
          <img
            src={game.previewSrc}
            alt={game.previewAlt ?? ""}
            className="h-full w-full object-contain p-3"
          />
        ) : (
          <Factory className="h-12 w-12 text-primary" aria-hidden />
        )}
        <Badge
          className="absolute right-3 top-3"
          variant={soon ? "secondary" : "default"}
        >
          {soon ? "Скоро" : "Доступно"}
        </Badge>
      </div>
      <CardHeader className="space-y-2 pb-2">
        <CardTitle className="text-lg text-secondary">{game.title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">{game.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-0">
        {typeof bestScore === "number" ? (
          <p className="text-sm text-muted-foreground">
            Лучший результат: <span className="font-medium text-foreground">{bestScore}</span>
          </p>
        ) : (
          <span />
        )}
        {soon || !game.href ? (
          <Button type="button" disabled variant="outline">
            Скоро
          </Button>
        ) : (
          <Button asChild>
            <Link to={game.href}>Играть</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
