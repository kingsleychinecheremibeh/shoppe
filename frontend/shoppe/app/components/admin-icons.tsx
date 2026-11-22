/**
 * Hugeicons versions of the icon names the admin pages were written with.
 * Each is a component that takes `className` (like the old icons), so existing
 * `<Plus className="…" />` and `icon: Users` usages keep working.
 */
import type { SVGProps } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Alert02Icon,
  ArrowRight02Icon,
  Camera01Icon,
  Cancel01Icon,
  ChartDecreaseIcon,
  ChartIncreaseIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Delete02Icon,
  DeliveryTruck01Icon,
  Dollar02Icon,
  Edit02Icon,
  Image01Icon,
  Invoice01Icon,
  MoneyBag02Icon,
  PackageDeliveredIcon,
  PackageIcon,
  PackageRemoveIcon,
  Search01Icon,
  Shield01Icon,
  ShoppingBag01Icon,
  StarIcon,
  UserGroupIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";

type IconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & { className?: string; strokeWidth?: number };

const make = (icon: typeof Add01Icon, name: string) => {
  const Icon = ({ className, strokeWidth = 1.6, ...rest }: IconProps) => (
    <HugeiconsIcon icon={icon} size={24} strokeWidth={strokeWidth} className={className} aria-hidden="true" {...rest} />
  );
  Icon.displayName = name;
  return Icon;
};

export const AlertTriangle = make(Alert02Icon, "AlertTriangle");
export const ArrowRight = make(ArrowRight02Icon, "ArrowRight");
export const BadgeDollarSign = make(MoneyBag02Icon, "BadgeDollarSign");
export const Boxes = make(PackageIcon, "Boxes");
export const Camera = make(Camera01Icon, "Camera");
export const CheckCircle2 = make(CheckmarkCircle02Icon, "CheckCircle2");
export const CircleDollarSign = make(Dollar02Icon, "CircleDollarSign");
export const Clock3 = make(Clock01Icon, "Clock3");
export const Edit = make(Edit02Icon, "Edit");
export const Eye = make(ViewIcon, "Eye");
export const ImageIcon = make(Image01Icon, "ImageIcon");
export const PackageCheck = make(PackageDeliveredIcon, "PackageCheck");
export const PackageX = make(PackageRemoveIcon, "PackageX");
export const Plus = make(Add01Icon, "Plus");
export const ReceiptText = make(Invoice01Icon, "ReceiptText");
export const Search = make(Search01Icon, "Search");
export const ShieldCheck = make(Shield01Icon, "ShieldCheck");
export const ShoppingBag = make(ShoppingBag01Icon, "ShoppingBag");
export const Star = make(StarIcon, "Star");
export const Trash2 = make(Delete02Icon, "Trash2");
export const TrendingDown = make(ChartDecreaseIcon, "TrendingDown");
export const TrendingUp = make(ChartIncreaseIcon, "TrendingUp");
export const Truck = make(DeliveryTruck01Icon, "Truck");
export const Users = make(UserGroupIcon, "Users");
export const X = make(Cancel01Icon, "X");
