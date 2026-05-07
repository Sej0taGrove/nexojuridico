"use client";

import { forwardRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { cleanRut, formatRut } from "@/lib/validators/rut";

type RutInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type"
> & {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
};

// Formatea a "12.345.678-9" cuando el campo pierde foco; mientras se escribe
// solo limpia caracteres no permitidos para no estorbar.
export const RutInput = forwardRef<HTMLInputElement, RutInputProps>(
  function RutInput({ value, onChange, onBlur, ...rest }, ref) {
    const [focused, setFocused] = useState(false);

    const display = focused ? value : value ? formatRut(value) : "";

    return (
      <Input
        {...rest}
        ref={ref}
        type="text"
        inputMode="text"
        autoComplete="off"
        value={display}
        onFocus={() => setFocused(true)}
        onChange={(e) => onChange(cleanRut(e.target.value))}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
      />
    );
  },
);
