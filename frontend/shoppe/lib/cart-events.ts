/** Browser events that connect "add to cart" buttons, the header and the slide-out cart. */

export const CART_UPDATED_EVENT = "cart-updated";
export const CART_OPEN_EVENT = "cart-open";

export type CartOpenDetail = {
  /** Name of the product just added, shown as a confirmation at the top of the drawer. */
  addedName?: string;
};

export function notifyCartUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function openCart(detail: CartOpenDetail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<CartOpenDetail>(CART_OPEN_EVENT, { detail }));
}

export const AUTH_CHANGED_EVENT = "auth-changed";

/** Tell the header to reload the signed-in user (e.g. right after registering). */
export function notifyAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
