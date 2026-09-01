"use client";
import {
  createContext, useContext, useCallback, useMemo,
  useSyncExternalStore, useState, ReactNode,
} from "react";

interface NavbarContextValue {
  onSubmitClick: (() => void) | null;
  setOnSubmitClick: (fn: (() => void) | null) => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  /** Desktop sidebar collapsed state (persisted to localStorage) */
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const NavbarContext = createContext<NavbarContextValue>({
  onSubmitClick: null,
  setOnSubmitClick: () => {},
  isMobileMenuOpen: false,
  setMobileMenuOpen: () => {},
  isSidebarCollapsed: false,
  setSidebarCollapsed: () => {},
});

const SIDEBAR_COLLAPSED_KEY = "placeprep_sidebar_collapsed";
const COLLAPSE_EVENT = "placeprep:sidebar-collapse";

/**
 * Sidebar collapse preference lives OUTSIDE React (localStorage) and is read
 * via useSyncExternalStore — no hydration-mismatch effects, and all mounted
 * components stay in sync through a custom event.
 */
function subscribeCollapse(callback: () => void) {
  window.addEventListener(COLLAPSE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(COLLAPSE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

const getCollapsedSnapshot = () =>
  localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";

const getCollapsedServerSnapshot = () => false;

export function NavbarProvider({ children }: { children: ReactNode }) {
  const [onSubmitClick, setOnSubmitClickState] = useState<(() => void) | null>(null);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isSidebarCollapsed = useSyncExternalStore(
    subscribeCollapse,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot
  );

  const setOnSubmitClick = useCallback((fn: (() => void) | null) => {
    setOnSubmitClickState(() => fn);
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      /* private mode — ignore */
    }
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
  }, []);

  // Stable context value prevents every consumer from re-rendering on unrelated updates
  const value = useMemo(
    () => ({
      onSubmitClick,
      setOnSubmitClick,
      isMobileMenuOpen,
      setMobileMenuOpen,
      isSidebarCollapsed,
      setSidebarCollapsed,
    }),
    [onSubmitClick, setOnSubmitClick, isMobileMenuOpen, isSidebarCollapsed, setSidebarCollapsed]
  );

  return (
    <NavbarContext.Provider value={value}>
      {children}
    </NavbarContext.Provider>
  );
}

export function useNavbar() {
  return useContext(NavbarContext);
}
