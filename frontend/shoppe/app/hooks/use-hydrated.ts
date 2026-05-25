"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useHydrated() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
