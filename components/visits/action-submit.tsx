"use client";

import { useFormStatus } from "react-dom";

type ActionSubmitProps = {
  children: string;
  pendingLabel?: string;
  className: string;
  confirmMessage?: string;
};

export function ActionSubmit({ children, pendingLabel = "Procesando...", className, confirmMessage }: ActionSubmitProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
