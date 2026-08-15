"use client";

import { useEffect, useRef, useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ConfirmButtonProps = {
  message: string;
  confirmLabel?: string;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * A submit button that requires two clicks to confirm a destructive action.
 *
 * The first click "arms" the button (renders it as a plain button so it does
 * not submit the form) and shows a confirmation label. The second click turns
 * it back into a submit button so the surrounding `<form action={...}>` server
 * action runs normally.
 *
 * This avoids `event.preventDefault()` in a button `onClick`, which does not
 * reliably cancel React 19 server-action form submissions and triggers the
 * "A React form was unexpectedly submitted" error.
 */
export function ConfirmButton({ message, confirmLabel = "ยืนยัน?", children, ...props }: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <button
      {...props}
      type={armed ? "submit" : "button"}
      title={armed ? message : props.title}
      onClick={() => {
        if (!armed) {
          setArmed(true);
          timerRef.current = setTimeout(() => setArmed(false), 4000);
        }
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}