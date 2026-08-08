/**
 * Централизованная дизайн-система «Людиновокабель».
 * Источник истины: брендбук и файл логотипа PANTONE.
 * ВАЖНО: не придумывать новые фирменные цвета/логотипы.
 * В компонентах использовать семантические Tailwind-классы
 * (bg-primary, text-secondary, bg-brand-orange и т.д.), а не хардкод hex.
 */

import logoFullColor from "@/assets/logo-full-color.png.asset.json";
import logoFullWhite from "@/assets/logo-full-white.png.asset.json";
import logoMarkColor from "@/assets/logo-mark-color.png.asset.json";
import logoMarkWhite from "@/assets/logo-mark-white.png.asset.json";
import logoMarkBlue from "@/assets/logo-mark-blue.png.asset.json";

export const brandColors = {
  /** Основной фирменный цвет — Pantone 166C */
  orange: { hex: "#E3661D", pantone: "166C", cmyk: "0-70-100-7", token: "brand-orange" },
  /** Парный к основному — Pantone 1585C 90% */
  orangeLight: { hex: "#EF7F1A", pantone: "1585C", cmyk: "0-60-100-0", token: "brand-orange-light" },
  /** Дополнительный фирменный цвет — Pantone 654C */
  blue: { hex: "#112866", pantone: "654C", cmyk: "100-80-10-45", token: "brand-blue" },
  /** Парный к синему — Pantone 541C 95% */
  blueLight: { hex: "#0A4B81", pantone: "541C", cmyk: "100-65-10-25", token: "brand-blue-light" },
  /** Акцент — Pantone 3135C */
  teal: { hex: "#399EAD", pantone: "3135C", cmyk: "75-10-25-15", token: "brand-teal" },
  tealDark: { hex: "#1A7E8C", pantone: "3145C", cmyk: "82-17-30-30", token: "brand-teal-dark" },
  grayDark: { hex: "#323232", pantone: "Process Black C 90%", cmyk: "0-0-0-90", token: "brand-gray-dark" },
  gray: { hex: "#4D4D4D", pantone: "Process Black C 80%", cmyk: "0-0-0-80", token: "brand-gray" },
} as const;

/** Допустимые фоны */
export const brandSurfaces = {
  light: "#FFFFFF",
  muted: "#F2F4F7",
  orange: brandColors.orange.hex,
  blue: brandColors.blue.hex,
  pattern: "Фирменный паттерн (круги/волны) в одном из парных цветов",
} as const;

/** Цвета текста */
export const brandText = {
  heading: brandColors.blue.hex,
  body: brandColors.grayDark.hex,
  muted: brandColors.gray.hex,
  onDark: "#FFFFFF",
  link: brandColors.orange.hex,
} as const;

/** Типографика: гротеск бренда; веб-эквивалент с полной кириллицей */
export const brandTypography = {
  family: '"Golos Text", "PT Sans", system-ui, sans-serif',
  weights: { regular: 400, medium: 500, bold: 700 },
  rules: [
    "Заголовки — Bold, синий #112866 (или белый на тёмном/оранжевом фоне)",
    "Подзаголовки и лиды — Regular/Medium, серый #4D4D4D",
    "Основной текст — Regular, тёмно-серый #323232",
    "Без курсива в заголовках, без декоративных и засечных шрифтов",
  ],
} as const;

/** Варианты логотипа */
export const brandLogos = {
  /** Цветной горизонтальный логотип — для белого и светлого недетализированного фона */
  fullColor: logoFullColor.url,
  /** Белый логотип — для оранжевого, синего, тёмного фона и паттерна */
  fullWhite: logoFullWhite.url,
  /** Знак (фигура) — иконка, favicon, мелкие носители */
  markColor: logoMarkColor.url,
  markWhite: logoMarkWhite.url,
  /** Знак в дополнительном фирменном цвете (синий #112866) — для светлых фонов */
  markBlue: logoMarkBlue.url,
  alt: "Людиновокабель — кабельный завод",
} as const;

/** Правила использования логотипа */
export const logoRules = [
  "Логотип размещается только на фонах с максимальной контрастностью",
  "Белый фон / светлый недетализированный фон → цветной логотип",
  "Оранжевый, синий, тёмный фон или фирменный паттерн → белый логотип",
  "Запрещено: менять пропорции, цвета, шрифт, переставлять элементы, добавлять эффекты",
  "Охранное поле вокруг логотипа — не менее высоты знака-фигуры",
  "Минимальная ширина горизонтальной версии в вебе — 140px; ниже использовать знак",
] as const;

/** Допустимые графические элементы */
export const brandGraphics = [
  "Фирменные паттерны «Круги» и «Волны» (стилизованная продукция) — как фон",
  "Паттерн допускается в оранжевом, синем, сером и бирюзовом варианте",
  "Цветные плашки (оранжевая / синяя) как акцентные полосы и подложки",
  "Знак-фигура как самостоятельный графический акцент",
  "Запрещены посторонние иллюстрации, градиентные «неоновые» эффекты, скругления в стиле поп-графики",
] as const;

/** Общий визуальный характер бренда */
export const brandCharacter =
  "Промышленный, надёжный и технологичный: строгая сетка, много воздуха, " +
  "доминирующий глубокий синий как основа доверия, оранжевый — энергия и акцент, " +
  "бирюзовый — технологичность. Чёткая типографика, минимум декора, паттерн как фирменный ритм.";