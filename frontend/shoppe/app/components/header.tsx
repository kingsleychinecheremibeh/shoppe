"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  Cancel01Icon,
  DashboardSquare02Icon,
  GridViewIcon,
  Login03Icon,
  Logout03Icon,
  Menu01Icon,
  Notification03Icon,
  Search01Icon,
  ShoppingCart01Icon,
  SourceCodeIcon,
  Store01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { SyntheticEvent, useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { getCategoryTheme } from "@/lib/category-colors";
import { storeConfig } from "@/lib/store-config";
import { Logo } from "@/app/components/logo";
import { CART_UPDATED_EVENT, openCart } from "@/lib/cart-events";

const stripItems = [
  `Delivery across Nigeria in ${storeConfig.deliveryTime}`,
  "Pay with card, bank transfer or USSD",
  `Returns within ${storeConfig.returnWindowDays} days`,
];

const iconButton =
  "relative flex h-11 w-11 items-center justify-center rounded-lg border-[1.5px] border-ink bg-white text-ink transition hover:bg-sun";
const menuPanel =
  "absolute right-0 mt-3 overflow-hidden rounded-lg border-[1.5px] border-ink bg-white shadow-sticker";

type UserData = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "MANAGER" | "ADMIN";
  managerPermissions?: string[];
};

type Cart = {
  items?: Array<{
    id: string;
    quantity: number;
  }>;
};

type MeResponse = {
  user: UserData;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  metadata?: {
    orderId?: string;
    productId?: string;
    slug?: string;
  } | null;
  readAt?: string | null;
  createdAt: string;
};

const primaryNavLinks = [
  { href: "/products", label: "Shop" },
  { href: "/products?sort=newest", label: "New in" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

const adminNavLinks = [
  { href: "/admin", label: "Dashboard", permission: "ANALYTICS" },
  { href: "/admin/products", label: "Products", permission: "PRODUCT_MANAGEMENT" },
  { href: "/admin/orders", label: "Orders", permission: "ORDER_MANAGEMENT" },
  { href: "/admin/categories", label: "Categories", permission: "PRODUCT_MANAGEMENT" },
  { href: "/admin/shipping", label: "Shipping", permission: "SHIPPING_MANAGEMENT" },
  { href: "/admin/managers", label: "Managers", permission: "ADMIN_ONLY" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<UserData | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const isStaff = user?.role === "ADMIN" || user?.role === "MANAGER";
  const isAdminRoute = pathname.startsWith("/admin");
  const canAccess = useCallback((permission: string) => {
    if (permission === "ADMIN_ONLY") return user?.role === "ADMIN";
    return user?.role === "ADMIN" || user?.managerPermissions?.includes(permission);
  }, [user]);
  const navLinks = isAdminRoute
    ? adminNavLinks.filter((link) => canAccess(link.permission))
    : primaryNavLinks;
  const showStorefrontTools = !isAdminRoute;
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;
  const staffLandingPath = useMemo(() => {
    if (user?.role === "ADMIN") return "/admin";

    const permissions = user?.managerPermissions || [];
    if (permissions.includes("ANALYTICS")) return "/admin";
    if (permissions.includes("ORDER_MANAGEMENT")) return "/admin/orders";
    if (permissions.includes("PRODUCT_MANAGEMENT")) return "/admin/products";
    if (permissions.includes("SHIPPING_MANAGEMENT")) return "/admin/shipping";
    return "/account";
  }, [user]);

  const cartCount = useMemo(() => {
    return cart?.items?.reduce((total, item) => total + item.quantity, 0) ?? 0;
  }, [cart]);

  const fetchCart = useCallback(async () => {
    if (!showStorefrontTools) return;
    try {
      const data = await api.getCart();
      setCart(data as Cart);
    } catch {
      setCart(null);
    }
  }, [showStorefrontTools]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let ignore = false;

    const loadAccountState = async () => {
      if (showStorefrontTools) {
        api.getCategories()
          .then((categoriesData) => {
            if (!ignore) {
              setCategories((categoriesData as Category[]) || []);
            }
          })
          .catch(() => {
            if (!ignore) setCategories([]);
          });
      }

      try {
        const data = await api.getMe();

        if (ignore) return;

        setUser((data as MeResponse).user);
        const notificationData = await api.getNotifications({ limit: 8 }).catch(() => []);
        if (!ignore) {
          setNotifications(Array.isArray(notificationData) ? (notificationData as Notification[]) : []);
        }
        if (!showStorefrontTools) return;

        const cartData = await api.getCart();

        if (!ignore) {
          setCart(cartData as Cart);
        }
      } catch {
        if (!ignore) {
          setUser(null);
          setCart(null);
        }
      }
    };

    const scheduleIdleWork =
      window.requestIdleCallback ||
      ((callback: IdleRequestCallback) =>
        window.setTimeout(() => {
          callback({
            didTimeout: false,
            timeRemaining: () => 0,
          });
        }, 1200));

    const cancelIdleWork =
      window.cancelIdleCallback ||
      ((id: number) => {
        window.clearTimeout(id);
      });

    const idleId = scheduleIdleWork(loadAccountState, { timeout: 3000 });

    return () => {
      ignore = true;
      cancelIdleWork(idleId);
    };
  }, [showStorefrontTools]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener(CART_UPDATED_EVENT, fetchCart);
      return () => {
        window.removeEventListener(CART_UPDATED_EVENT, fetchCart);
      };
    }
  }, [fetchCart]);

  const closeMenus = () => {
    setAccountOpen(false);
    setNotificationsOpen(false);
    setMobileOpen(false);
    setCategoriesOpen(false);
  };

  const handleSearch = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = searchQuery.trim();
    if (!query) return;

    closeMenus();
    setSearchQuery("");
    router.push(`/products?search=${encodeURIComponent(query)}`);
  };

  const handleLogout = async () => {
    await api.logout().catch(() => undefined);
    setUser(null);
    setCart(null);
    setNotifications([]);
    closeMenus();
    router.push("/");
  };

  const handleMarkAllNotificationsRead = async () => {
    await api.markAllNotificationsRead().catch(() => undefined);
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        readAt: notification.readAt || new Date().toISOString(),
      }))
    );
  };

  const getNotificationHref = (notification: Notification) => {
    if (notification.metadata?.orderId) {
      return isStaff
        ? `/admin/orders?orderId=${notification.metadata.orderId}`
        : `/account/orders`;
    }

    if (notification.metadata?.slug) {
      return `/products/${notification.metadata.slug}`;
    }

    if (notification.metadata?.productId) {
      return `/products/${notification.metadata.productId}`;
    }

    return null;
  };

  const handleNotificationClick = async (notification: Notification) => {
    setNotificationsOpen(false);
    if (!notification.readAt) {
      await api.markNotificationRead(notification.id).catch(() => undefined);
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item
        )
      );
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-paper">
      {showStorefrontTools && (
        <div className="overflow-hidden border-b-[1.5px] border-ink bg-sun" aria-label="Store information">
          <div className="marquee gap-10 py-2 font-mono text-xs font-semibold tracking-wide uppercase">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 gap-10 pr-10" aria-hidden={copy === 1}>
                {[...stripItems, ...stripItems].map((item, index) => (
                  <span key={`${copy}-${index}`} className="flex items-center gap-10 whitespace-nowrap">
                    {item}
                    <span aria-hidden="true">·</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-b-[1.5px] border-ink">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[76px] items-center justify-between gap-4 lg:gap-8">
            <Link
              href={isAdminRoute ? staffLandingPath : "/"}
              className="flex shrink-0 items-center transition hover:opacity-90"
              aria-label={`${storeConfig.storeName} home`}
              onClick={closeMenus}
            >
              <Logo size={46} wordmarkClassName="hidden min-[420px]:inline" />
            </Link>

            <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
              {showStorefrontTools && categories.length > 0 && (
                <div
                  className="relative"
                  onMouseEnter={() => setCategoriesOpen(true)}
                  onMouseLeave={() => setCategoriesOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setCategoriesOpen((o) => !o)}
                    aria-expanded={categoriesOpen}
                    className={`flex items-center gap-1 py-2 text-[15px] font-medium transition ${
                      categoriesOpen || pathname.startsWith("/category") ? "text-ink underline decoration-2 underline-offset-8" : "text-gray-700 hover:text-ink"
                    }`}
                  >
                    Categories
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      size={18}
                      strokeWidth={1.8}
                      className={`transition-transform duration-200 ${categoriesOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {categoriesOpen && (
                    <div className="absolute left-0 top-full z-50 pt-3">
                      <div className="w-72 overflow-hidden rounded-lg border-[1.5px] border-ink bg-white shadow-sticker">
                        <div className="max-h-96 overflow-y-auto overscroll-contain p-2">
                          {categories.map((cat) => {
                            const theme = getCategoryTheme(cat);
                            return (
                              <Link
                                key={cat.id}
                                href={`/category/${cat.slug}`}
                                className="flex items-center gap-3 rounded-md px-2 py-2 text-[15px] font-medium text-ink transition hover:bg-gray-100"
                                onClick={closeMenus}
                              >
                                <span
                                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-[1.5px] border-ink"
                                  style={{ background: theme.solid, color: theme.onSolid }}
                                >
                                  <HugeiconsIcon icon={theme.icon} size={24} strokeWidth={1.5} />
                                </span>
                                <span className="truncate">{cat.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                        <Link
                          href="/categories"
                          className="flex items-center justify-center gap-2 border-t-[1.5px] border-ink px-4 py-3 text-sm font-semibold text-ink transition hover:bg-sun"
                          onClick={closeMenus}
                        >
                          <HugeiconsIcon icon={GridViewIcon} size={20} strokeWidth={1.6} />
                          All categories
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {navLinks.map((link) => {
                const active =
                  pathname === link.href ||
                  (link.href !== "/admin" && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`py-2 text-[15px] font-medium transition ${
                      active ? "text-ink underline decoration-2 underline-offset-8" : "text-gray-700 hover:text-ink"
                    }`}
                    onClick={closeMenus}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {showStorefrontTools ? (
              <form onSubmit={handleSearch} className="hidden min-w-0 max-w-sm flex-1 md:block" role="search">
                <label htmlFor="desktopProductSearch" className="flex h-12 items-center gap-2.5 rounded-lg border-[1.5px] border-ink bg-white px-3.5 focus-within:shadow-sticker-sm">
                  <span className="sr-only">Search products</span>
                  <HugeiconsIcon icon={Search01Icon} size={24} strokeWidth={1.6} className="shrink-0 text-ink" />
                  <input
                    id="desktopProductSearch"
                    name="productSearch"
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search sneakers, perfume, headphones…"
                    className="w-full min-w-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-gray-500"
                  />
                </label>
              </form>
            ) : (
              <div className="hidden min-w-0 max-w-sm flex-1 md:block" />
            )}

            <div className="flex shrink-0 items-center gap-2">
              {isStaff && !isAdminRoute && (
                <Link
                  href={staffLandingPath}
                  className="hidden h-11 items-center gap-2 rounded-lg border-[1.5px] border-ink bg-white px-3.5 text-sm font-semibold text-ink transition hover:bg-sun xl:inline-flex"
                  onClick={closeMenus}
                >
                  <HugeiconsIcon icon={DashboardSquare02Icon} size={22} strokeWidth={1.6} />
                  Dashboard
                </Link>
              )}

              {isAdminRoute && (
                <Link
                  href="/"
                  className="hidden h-11 items-center gap-2 rounded-lg border-[1.5px] border-ink bg-white px-3.5 text-sm font-semibold text-ink transition hover:bg-sun sm:inline-flex"
                  onClick={closeMenus}
                >
                  <HugeiconsIcon icon={Store01Icon} size={22} strokeWidth={1.6} />
                  View store
                </Link>
              )}

              {user && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen((open) => !open);
                      setAccountOpen(false);
                      setMobileOpen(false);
                    }}
                    className={`${iconButton} ${notificationsOpen ? "bg-sun" : ""}`}
                    aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
                    aria-expanded={notificationsOpen}
                  >
                    <HugeiconsIcon icon={Notification03Icon} size={24} strokeWidth={1.6} />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-md border-[1.5px] border-ink bg-pink px-1 font-mono text-[11px] font-semibold text-ink">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className={`${menuPanel} w-80`}>
                      <div className="flex items-center justify-between border-b-[1.5px] border-ink px-4 py-3">
                        <p className="font-display text-lg font-bold">Notifications</p>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllNotificationsRead}
                            className="text-sm font-medium text-gray-600 underline-offset-4 hover:text-ink hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length ? (
                          notifications.map((notification) => {
                            const href = getNotificationHref(notification);
                            const className = `block border-b border-gray-200 px-4 py-3 text-left last:border-b-0 ${
                              notification.readAt ? "bg-white" : "bg-sun-soft"
                            } ${href ? "transition hover:bg-gray-100" : ""}`;

                            const content = (
                              <>
                                <p className="text-sm font-semibold text-ink">{notification.title}</p>
                                <p className="mt-1 text-sm leading-relaxed text-gray-600">{notification.message}</p>
                              </>
                            );

                            return href ? (
                              <Link
                                key={notification.id}
                                href={href}
                                className={className}
                                onClick={() => void handleNotificationClick(notification)}
                              >
                                {content}
                              </Link>
                            ) : (
                              <button
                                key={notification.id}
                                type="button"
                                className={`w-full ${className}`}
                                onClick={() => void handleNotificationClick(notification)}
                              >
                                {content}
                              </button>
                            );
                          })
                        ) : (
                          <p className="px-4 py-8 text-center text-sm text-gray-600">No notifications yet.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setAccountOpen((open) => !open);
                    setMobileOpen(false);
                    setNotificationsOpen(false);
                  }}
                  className={`${iconButton} ${accountOpen ? "bg-sun" : ""}`}
                  aria-label="Account menu"
                  aria-expanded={accountOpen}
                >
                  <HugeiconsIcon icon={UserIcon} size={24} strokeWidth={1.6} />
                </button>

                {accountOpen && (
                  <div className={`${menuPanel} w-64 py-1.5`}>
                    {user ? (
                      <>
                        <div className="border-b-[1.5px] border-ink px-4 py-3">
                          <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                          <p className="mt-0.5 truncate text-sm text-gray-600">{user.email}</p>
                        </div>
                        <Link href="/account" className="block px-4 py-2.5 text-[15px] text-ink transition hover:bg-gray-100" onClick={closeMenus}>
                          My account
                        </Link>
                        <Link href="/account/orders" className="block px-4 py-2.5 text-[15px] text-ink transition hover:bg-gray-100" onClick={closeMenus}>
                          My orders
                        </Link>
                        <div className="my-1 border-t border-gray-200" />
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[15px] text-danger transition hover:bg-red-50"
                        >
                          <HugeiconsIcon icon={Logout03Icon} size={22} strokeWidth={1.6} />
                          Log out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href="/login" className="flex items-center gap-2.5 px-4 py-2.5 text-[15px] text-ink transition hover:bg-gray-100" onClick={closeMenus}>
                          <HugeiconsIcon icon={Login03Icon} size={22} strokeWidth={1.6} />
                          Log in
                        </Link>
                        <Link href="/register" className="block px-4 py-2.5 text-[15px] text-ink transition hover:bg-gray-100" onClick={closeMenus}>
                          Create account
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {showStorefrontTools && (
                <Link
                  href="/cart"
                  className="relative flex h-11 items-center gap-2 rounded-lg border-[1.5px] border-ink bg-ink pl-2.5 pr-3 text-paper transition hover:shadow-sticker-sm hover:-translate-x-px hover:-translate-y-px"
                  aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
                  onClick={(event) => {
                    closeMenus();
                    // Plain click opens the slide-out cart; modified clicks still open /cart normally.
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                    event.preventDefault();
                    openCart();
                  }}
                >
                  <HugeiconsIcon icon={ShoppingCart01Icon} size={24} strokeWidth={1.6} />
                  <span className="hidden text-sm font-semibold sm:inline">Cart</span>
                  <span
                    key={cartCount}
                    className="animate-bump flex h-6 min-w-6 items-center justify-center rounded-md bg-sun px-1 font-mono text-xs font-semibold text-ink"
                  >
                    {cartCount}
                  </span>
                </Link>
              )}

              <button
                type="button"
                onClick={() => {
                  setMobileOpen((open) => !open);
                  setAccountOpen(false);
                  setNotificationsOpen(false);
                }}
                className={`${iconButton} lg:hidden ${mobileOpen ? "bg-sun" : ""}`}
                aria-label="Menu"
                aria-expanded={mobileOpen}
              >
                <HugeiconsIcon icon={mobileOpen ? Cancel01Icon : Menu01Icon} size={24} strokeWidth={1.7} />
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div className="border-t-[1.5px] border-ink py-5 lg:hidden">
              {showStorefrontTools && (
                <form onSubmit={handleSearch} className="mb-5" role="search">
                  <label htmlFor="mobileProductSearch" className="flex h-12 items-center gap-2.5 rounded-lg border-[1.5px] border-ink bg-white px-3.5">
                    <span className="sr-only">Search products</span>
                    <HugeiconsIcon icon={Search01Icon} size={24} strokeWidth={1.6} className="shrink-0" />
                    <input
                      id="mobileProductSearch"
                      name="productSearch"
                      type="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search Shoppe"
                      className="w-full min-w-0 bg-transparent text-base text-ink outline-none placeholder:text-gray-500"
                    />
                  </label>
                </form>
              )}

              {showStorefrontTools && categories.length > 0 && (
                <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {categories.slice(0, 6).map((cat) => {
                    const theme = getCategoryTheme(cat);
                    return (
                      <Link
                        key={cat.id}
                        href={`/category/${cat.slug}`}
                        onClick={closeMenus}
                        className="flex flex-col items-center gap-1.5 rounded-lg border-[1.5px] border-ink p-3 text-center text-xs font-semibold"
                        style={{ background: theme.solid, color: theme.onSolid }}
                      >
                        <HugeiconsIcon icon={theme.icon} size={34} strokeWidth={1.4} />
                        <span className="w-full truncate">{cat.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}

              <nav className="grid gap-1" aria-label="Mobile">
                {showStorefrontTools && categories.length > 0 && (
                  <Link href="/categories" className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-ink hover:bg-gray-100" onClick={closeMenus}>
                    <HugeiconsIcon icon={GridViewIcon} size={24} strokeWidth={1.6} />
                    All categories
                  </Link>
                )}
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="rounded-lg px-3 py-3 text-base font-medium text-ink hover:bg-gray-100" onClick={closeMenus}>
                    {link.label}
                  </Link>
                ))}
                {isStaff && !isAdminRoute && (
                  <Link href={staffLandingPath} className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-ink hover:bg-gray-100" onClick={closeMenus}>
                    <HugeiconsIcon icon={DashboardSquare02Icon} size={24} strokeWidth={1.6} />
                    Dashboard
                  </Link>
                )}
                {isAdminRoute && (
                  <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-ink hover:bg-gray-100" onClick={closeMenus}>
                    <HugeiconsIcon icon={Store01Icon} size={24} strokeWidth={1.6} />
                    View store
                  </Link>
                )}
              </nav>

              <div className="mt-5 border-t border-gray-200 pt-5">
                <a
                  href="mailto:codewithneche@gmail.com?subject=I%20want%20a%20website%20like%20this"
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-ink"
                  onClick={closeMenus}
                >
                  <HugeiconsIcon icon={SourceCodeIcon} size={22} strokeWidth={1.6} />
                  Hire the developer
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
