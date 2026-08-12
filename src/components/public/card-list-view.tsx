"use client";

import { Grid2X2, List } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type ViewMode = "card" | "list";

function readStored<T extends string>(key: string, valid: readonly T[], fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key) as T | null;
    return stored && valid.includes(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
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
  const [view, setView] = useState<ViewMode>("card");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setView(readStored(storageKey, ["card", "list"] as const, "card"));
    setMounted(true);
  }, [storageKey]);

  function updateView(next: ViewMode) {
    setView(next);
    window.localStorage.setItem(storageKey, next);
  }

  if (!mounted) {
    return (
      <>
        <div className="library-toolbar">
          <div className="container toolbar-inner">
            <div className="view-toggle" aria-label="รูปแบบการแสดงผล">
              <button className="active" aria-label="มุมมองการ์ด"><Grid2X2 size={16} /></button>
              <button aria-label="มุมมองรายการ"><List size={17} /></button>
            </div>
          </div>
        </div>
        <div className="category-grid">
          {items.map((item) => (
            <a href={item.href} className={item.className ?? "category-card"} style={item.style} key={item.key}>
              <span className="category-icon">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.subtitle}</p>
            </a>
          ))}
        </div>
      </>
    );
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