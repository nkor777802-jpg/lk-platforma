export type GameStatus = "available" | "soon";

export type GameCatalogItem = {
  id: string;
  title: string;
  description: string;
  status: GameStatus;
  href?: "/gamification/cabletris" | "/gamification/simulator";
  previewSrc?: string;
  previewAlt?: string;
};

/** Витрина игр. Новые модули добавляются сюда, без переписывания страницы. */
export const GAMES_CATALOG: GameCatalogItem[] = [
  {
    id: "cabletris",
    title: "КабельТрис",
    description: "Собирай одинаковые марки кабеля, изучай продукцию и запоминай категории.",
    status: "available",
    href: "/gamification/cabletris",
    previewSrc: "/cabletris/products/02-003_PHOTO_01.png",
    previewAlt: "КабельТрис",
  },
  {
    id: "simulator",
    title: "Производственный тренажёр",
    description: "Собирай кабель по реальным маршрутам производственного паспорта.",
    status: "available",
    href: "/gamification/simulator",
  },
  {
    id: "quality",
    title: "Контроль качества",
    description: "Ищи дефекты по фото и производственным признакам на виртуальной линии.",
    status: "available",
    href: "/gamification/simulator",
  },
  {
    id: "defect-hunt",
    title: "Поймай брак",
    description: "Ищи дефекты на движущемся кабеле и определяй причины их возникновения.",
    status: "soon",
  },
  {
    id: "cable-builder",
    title: "Собери кабель",
    description: "Собирай конструкцию кабеля слой за слоем и изучай технологический маршрут.",
    status: "soon",
  },
];

export function availableGames() {
  return GAMES_CATALOG.filter((game) => game.status === "available");
}
