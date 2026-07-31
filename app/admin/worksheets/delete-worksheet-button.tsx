"use client";

type DeleteWorksheetButtonProps = {
  className?: string;
};

export function DeleteWorksheetButton({ className }: DeleteWorksheetButtonProps) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!confirm("Delete this worksheet?")) {
          event.preventDefault();
        }
      }}
    >
      Delete
    </button>
  );
}
