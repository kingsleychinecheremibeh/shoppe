import {
  HeadphonesIcon,
  PerfumeIcon,
  RunningShoesIcon,
  ShoppingBag01Icon,
  Sofa01Icon,
  TShirtIcon,
  Watch01Icon,
} from "@hugeicons/core-free-icons";

/**
 * Every category owns one market colour. Known categories are matched by keyword;
 * new ones get a stable colour from their slug so they never change between renders.
 *
 * `onSolid` is the text colour that passes contrast on the solid colour.
 */
export type CategoryTheme = {
  solid: string;
  soft: string;
  onSolid: string;
  icon: typeof ShoppingBag01Icon;
};

const THEMES = {
  blue: { solid: "#2F5BFF", soft: "#E3E9FF", onSolid: "#FFFFFF" },
  pink: { solid: "#FF4FA3", soft: "#FFE0EF", onSolid: "#141414" },
  sun: { solid: "#FFC400", soft: "#FFF1C2", onSolid: "#141414" },
  leaf: { solid: "#1FAF6E", soft: "#D6F3E5", onSolid: "#141414" },
  coral: { solid: "#FF6B4A", soft: "#FFE1DA", onSolid: "#141414" },
  violet: { solid: "#7A5CFF", soft: "#E6E0FF", onSolid: "#FFFFFF" },
} as const;

type ThemeName = keyof typeof THEMES;

const RULES: Array<{ match: RegExp; theme: ThemeName; icon: CategoryTheme["icon"] }> = [
  { match: /electron|gadget|phone|tech|audio|computer|laptop/, theme: "blue", icon: HeadphonesIcon },
  { match: /fashion|cloth|apparel|wear|dress|shirt/, theme: "pink", icon: TShirtIcon },
  { match: /shoe|sneaker|footwear|boot/, theme: "sun", icon: RunningShoesIcon },
  { match: /accessor|watch|jewel|bag/, theme: "leaf", icon: Watch01Icon },
  { match: /beauty|skin|cosmetic|perfume|fragrance|hair/, theme: "coral", icon: PerfumeIcon },
  { match: /home|living|furniture|kitchen|decor/, theme: "violet", icon: Sofa01Icon },
];

const ORDER: ThemeName[] = ["blue", "pink", "sun", "leaf", "coral", "violet"];

const hash = (value: string) => {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
};

export function getCategoryTheme(category?: { slug?: string | null; name?: string | null } | null): CategoryTheme {
  const key = `${category?.slug || ""} ${category?.name || ""}`.toLowerCase();
  const rule = RULES.find((r) => r.match.test(key));
  if (rule) return { ...THEMES[rule.theme], icon: rule.icon };
  const fallback = ORDER[hash(key.trim() || "shoppe") % ORDER.length];
  return { ...THEMES[fallback], icon: ShoppingBag01Icon };
}
