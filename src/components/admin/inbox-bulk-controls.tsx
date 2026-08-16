"use client";

import { useEffect } from "react";

/**
 * Wires up the Inbox bulk-selection UI rendered by the server component.
 *
 * The previous implementation relied on an inline <script> tag plus string
 * event handlers, which React never executes on the client — the bulk bar
 * never appeared and the buttons did nothing. This component attaches real
 * event listeners (delegated, so server re-renders keep working) and keeps
 * the existing hidden-field form submission flow intact.
 */
export function InboxBulkControls() {
  useEffect(() => {
    function getChecked() {
      return Array.from(document.querySelectorAll<HTMLInputElement>(".inbox-checkbox:checked"));
    }

    function updateBar() {
      const bar = document.getElementById("inbox-bulk-bar");
      if (!bar) return;
      const countEl = bar.querySelector(".inbox-bulk-count");
      const checked = getChecked();
      if (checked.length > 0) {
        bar.style.display = "flex";
        if (countEl) countEl.textContent = `${checked.length} รายการที่เลือก`;
      } else {
        bar.style.display = "none";
      }
    }

    function submitBulk(action: "draft" | "archive") {
      const ids = getChecked().map((checkbox) => checkbox.value).join(",");
      if (!ids) return;
      const form = document.getElementById("bulk-inbox-form");
      if (!(form instanceof HTMLFormElement)) return;
      const idsInput = form.querySelector<HTMLInputElement>('input[name="ids"]');
      const actionInput = form.querySelector<HTMLInputElement>('input[name="action"]');
      if (!idsInput || !actionInput) return;
      idsInput.value = ids;
      actionInput.value = action;
      form.requestSubmit();
    }

    function onChange(event: Event) {
      const target = event.target as HTMLElement | null;
      if (target?.classList.contains("inbox-checkbox")) updateBar();
    }

    function onClick(event: Event) {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-bulk-action]");
      const action = target?.dataset.bulkAction;
      if (action === "draft" || action === "archive") submitBulk(action);
    }

    document.addEventListener("change", onChange);
    document.addEventListener("click", onClick);
    updateBar();
    return () => {
      document.removeEventListener("change", onChange);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}