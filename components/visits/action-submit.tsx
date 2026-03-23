"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

type ActionSubmitProps = {
  children: string;
  pendingLabel?: string;
  className: string;
  confirmMessage?: string;
};

export function ActionSubmit({ children, pendingLabel = "Procesando...", className, confirmMessage }: ActionSubmitProps) {
  const { pending } = useFormStatus();
  const [locked, setLocked] = useState(false);
  const disabled = pending || locked;

  return (
    <button
      type="submit"
      className={className}
      disabled={disabled}
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
          return;
        }
        setLocked(true);
      }}
    >
      {disabled ? pendingLabel : children}
    </button>
  );
}
