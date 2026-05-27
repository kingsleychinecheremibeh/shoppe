"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Code2,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { SyntheticEvent, useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type UserData = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
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

const primaryNavLinks = [
  { href: "/products", label: "Shop" },
  { href: "/products?sort=newest", label: "New Arrivals" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

const adminNavLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/shipping", label: "Shipping" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<UserData | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === "ADMIN";
  const isAdminRoute = pathname.startsWith("/admin");
  const navLinks = isAdminRoute ? adminNavLinks : primaryNavLinks;
  const showStorefrontTools = !isAdminRoute;

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
      try {
        const data = await api.getMe();

        if (ignore) return;

        setUser((data as MeResponse).user);
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
      window.addEventListener("cart-updated", fetchCart);
      return () => {
        window.removeEventListener("cart-updated", fetchCart);
      };
    }
  }, [fetchCart]);

  const closeMenus = () => {
    setAccountOpen(false);
    setMobileOpen(false);
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
    closeMenus();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          
          {/* Logo */}
          <Link
            href={isAdminRoute ? "/admin" : "/"}
            className="flex shrink-0 items-center gap-2.5 text-xl font-serif font-black tracking-widest text-gray-950 uppercase transition hover:opacity-80"
            onClick={closeMenus}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-950 text-white shadow-sm">
              <ShoppingBag className="h-4.5 w-4.5" />
            </span>
            SHOPPE
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-6 lg:flex">
            {navLinks.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/admin" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative py-1 text-[11px] font-bold uppercase tracking-widest transition duration-300 after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-gray-950 after:transition-all hover:after:w-full ${
                    active ? "text-gray-950 after:w-full" : "text-gray-400 hover:text-gray-950"
                  }`}
                  onClick={closeMenus}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Search form in Header */}
          {showStorefrontTools ? (
            <form onSubmit={handleSearch} className="hidden min-w-0 max-w-xs flex-1 md:block">
              <label htmlFor="desktopProductSearch" className="relative block">
                <span className="sr-only">Search products</span>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="desktopProductSearch"
                  name="productSearch"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search products..."
                  className="h-10 w-full rounded-full border border-gray-200 bg-gray-50/50 pl-10 pr-4 text-xs font-medium text-gray-950 outline-none transition duration-300 focus:border-gray-950 focus:bg-white focus:ring-2 focus:ring-gray-950/5"
                />
              </label>
            </form>
          ) : (
            <div className="hidden min-w-0 max-w-xs flex-1 md:block" />
          )}

          {/* Action Tools */}
          <div className="flex shrink-0 items-center gap-1.5">
            
            {isAdmin && !isAdminRoute && (
              <Link
                href="/admin"
                className="hidden h-9 items-center gap-1.5 rounded-lg bg-gray-950 px-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-gray-800 lg:inline-flex uppercase tracking-wider"
                onClick={closeMenus}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </Link>
            )}

            {isAdminRoute && (
              <Link
                href="/"
                className="hidden h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 text-xs font-bold text-gray-700 shadow-xs transition hover:bg-gray-50 hover:text-gray-950 sm:inline-flex uppercase tracking-wider"
                onClick={closeMenus}
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                View Store
              </Link>
            )}

            {showStorefrontTools && (
              <Link
                href="/cart"
                className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-50 hover:text-gray-950"
                aria-label="Cart"
                onClick={closeMenus}
              >
                <ShoppingCart className="h-4.5 w-4.5" />
                {cartCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-gray-950 px-1 text-[9px] font-black text-white shadow-xs border border-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setAccountOpen((open) => !open)
                  setMobileOpen(false);
                }}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-50 hover:text-gray-950 ${
                  accountOpen ? "bg-gray-50 text-gray-950" : ""
                }`}
                aria-label="Account menu"
                aria-expanded={accountOpen}
              >
                <User className="h-4.5 w-4.5" />
              </button>

              {accountOpen && (
                <div className="absolute right-0 mt-3.5 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl py-1.5 animate-in fade-in slide-in-from-top-3 duration-200">
                  {user ? (
                    <>
                      <div className="border-b border-gray-100 px-4 py-3">
                        <p className="truncate text-xs font-bold text-gray-950">
                          {user.name}
                        </p>
                        <p className="truncate text-[10px] text-gray-400 font-medium mt-0.5">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href="/account"
                        className="block px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50 hover:text-gray-950 transition"
                        onClick={closeMenus}
                      >
                        My Account
                      </Link>
                      <Link
                        href="/account/orders"
                        className="block px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50 hover:text-gray-950 transition"
                        onClick={closeMenus}
                      >
                        Orders List
                      </Link>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 transition"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 hover:text-gray-950 transition"
                        onClick={closeMenus}
                      >
                        <LogIn className="h-3.5 w-3.5" />
                        Login
                      </Link>
                      <Link
                        href="/register"
                        className="block px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 hover:text-gray-950 transition"
                        onClick={closeMenus}
                      >
                        Create Account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => {
                setMobileOpen((open) => !open)
                setAccountOpen(false);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-50 hover:text-gray-950 lg:hidden"
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

          </div>
        </div>

        {/* Mobile Slideout Navigation */}
        {mobileOpen && (
          <div className="border-t border-gray-100 py-6 lg:hidden animate-in slide-in-from-top duration-300">
            {showStorefrontTools && (
              <form onSubmit={handleSearch} className="mb-6">
                <label htmlFor="mobileProductSearch" className="relative block">
                  <span className="sr-only">Search products</span>
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="mobileProductSearch"
                    name="productSearch"
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search products..."
                    className="h-11 w-full rounded-full border border-gray-200 bg-gray-50/50 pl-10 pr-4 text-xs font-medium text-gray-950 outline-none focus:border-gray-950 focus:bg-white"
                  />
                </label>
              </form>
            )}

            <nav className="grid gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:text-gray-950 transition"
                  onClick={closeMenus}
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && !isAdminRoute && (
                <Link
                  href="/admin"
                  className="rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:text-gray-950 transition"
                  onClick={closeMenus}
                >
                  Dashboard
                </Link>
              )}
              {isAdminRoute && (
                <Link
                  href="/"
                  className="rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:text-gray-950 transition"
                  onClick={closeMenus}
                >
                  View Store
                </Link>
              )}
            </nav>

            {/* Developer Signature */}
            <div className="mt-6 border-t border-gray-100 pt-6">
              <a
                href="mailto:codewithneche@gmail.com?subject=I%20want%20a%20website%20like%20this"
                className="flex items-center gap-2.5 rounded-lg px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-400 hover:bg-gray-50 hover:text-gray-950 transition group"
                onClick={closeMenus}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-gray-500 group-hover:bg-gray-950 group-hover:text-white transition">
                  <Code2 className="h-3 w-3" />
                </span>
                Hire the Developer
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
