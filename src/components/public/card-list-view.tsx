"use client";

import { Grid2X2, List } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

type ViewMode = "card" | "list";

const VIEW_MODES = ["card", "list"] as const;
const VIEW_SYNC_EVENT = "kh-view-sync";

function readStored<T extends string>(key: string, valid: readonly T[], fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key) as T | null;
    return stored && valid.includes(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

function subscribeViewStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(VIEW_SYNC_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(VIEW_SYNC_EVENT, callback);
  };
}

export interface CardListViewItem {
  key: string;
  href: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  style?: React.CSSProperties;
  className?: string;
}

export function CardListView({ items, storageKey = "kh-listing-view" }: { items: CardListViewItem[]; storageKey?: string }) {
  const getSnapshot = useCallback(() => readStored(storageKey, VIEW_MODES, "card"), [storageKey]);
  const getServerSnapshot = useCallback(() => "card" as const, []);
  const view = useSyncExternalStore(subscribeViewStorage, getSnapshot, getServerSnapshot);

  function updateView(next: ViewMode) {
    try {
      window.localStorage.setItem(storageKey, next);
    } catch {
      // ignore storage failures (private mode, quota)
    }
    window.dispatchEvent(new Event(VIEW_SYNC_EVENT));
  }

  return (
    <>
      <div className="library-toolbar">
        <div className="container toolbar-inner">
          <div className="view-toggle" aria-label="รูปแบบการแสดงผล">
            <button className={view === "card" ? "active" : ""} onClick={() => updateView("card")} aria-label="มุมมองการ์ด"><Grid2X2 size={16} /></button>
            <button className={view === "list" ? "active" : ""} onClick={() => updateView("list")} aria-label="มุมมองรายการ"><List size={17} /></button>
          </div>
        </div>
      </div>
      {view === "card" ? (
        <div className="category-grid">
          {items.map((item) => (
            <a href={item.href} className={item.className ?? "category-card"} style={item.style} key={item.key}>
              <span className="category-icon">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.subtitle}</p>
            </a>
          ))}
        </div>
      ) : (
        <div className="content-list">
          {items.map((item) => (
            <a href={item.href} className="knowledge-list-item" style={item.style} key={item.key}>
              <span className="list-icon">{item.icon}</span>
              <span className="list-copy"><h3>{item.title}</h3><p>{item.subtitle}</p></span>
            </a>
          ))}
        </div>
      )}
    </>
  );
}