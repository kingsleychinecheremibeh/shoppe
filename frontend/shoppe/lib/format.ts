const formatterOptions = {
  style: "currency",
  currency: "NGN",
  currencyDisplay: "narrowSymbol",
} as const;

const wholeNaira = new Intl.NumberFormat("en-NG", { ...formatterOptions, maximumFractionDigits: 0 });
const nairaWithKobo = new Intl.NumberFormat("en-NG", { ...formatterOptions, minimumFractionDigits: 2 });

/** Formats an amount as Naira: 12500 -> "₦12,500", 12500.5 -> "₦12,500.50". */
export const formatPrice = (amount: number | string | null | undefined) => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return wholeNaira.format(0);
  return Number.isInteger(value) ? wholeNaira.format(value) : nairaWithKobo.format(value);
};
