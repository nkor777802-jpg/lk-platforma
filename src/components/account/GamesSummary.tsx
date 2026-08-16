import { Link } from "@tanstack/react-router";
import { availableGames } from "@/lib/games-catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GamesSummary() {
  const games = availableGames();

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-secondary">Игры и тренажёры</CardTitle>
        <Button asChild size="sm" variant="outline">
          <Link to="/gamification">Все игры и тренажёры</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {games.map((game) => (
          <div
            key={game.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="font-medium text-foreground">{game.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge>Доступно</Badge>
              {game.href ? (
                <Button asChild size="sm">
                  <Link to={game.href}>Играть</Link>
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
