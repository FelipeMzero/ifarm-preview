import type { FocusEvent } from "react";
import type {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import { IMaskInput } from "react-imask";
import { cn } from "@/lib/utils";

// Mesmo visual do Input (components/ui/input.tsx).
const MASKED_INPUT_CLASSNAME =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-input/40 px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

type MaskedInputProps<T extends FieldValues, TName extends FieldPath<T>> = {
  /** O `field` do FormField (react-hook-form): valor, mudança, foco e ref. */
  field: ControllerRenderProps<T, TName>;
  /**
   * Máscara do react-imask (ex.: "00000-000"), ou uma lista delas, escolhida pelo que foi
   * digitado (ex.: telefone fixo ou celular).
   */
  mask: string | { mask: string }[];
  /** Guarda o valor sem a máscara (só os dígitos/letras). */
  unmask?: boolean;
  /** Caracteres próprios da máscara de texto (ex.: { H: /[0-9A-Fa-f]/ }). */
  definitions?: Record<string, RegExp>;
  /** Transforma cada caractere digitado, na máscara de texto (ex.: maiúsculas). */
  prepareChar?: (char: string) => string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Chamado ao sair do campo, depois do onBlur do formulário. */
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
};

/** Campo de texto com máscara, ligado ao react-hook-form. */
export function MaskedInput<T extends FieldValues, TName extends FieldPath<T>>({
  field,
  mask,
  definitions,
  prepareChar,
  className,
  onBlur,
  ...props
}: MaskedInputProps<T, TName>) {
  const common = {
    ...props,
    "data-slot": "input",
    name: field.name,
    value: field.value ?? "",
    onAccept: (value: string) => field.onChange(value),
    onBlur: (event: FocusEvent<HTMLInputElement>) => {
      field.onBlur();
      onBlur?.(event);
    },
    inputRef: field.ref,
    className: cn(MASKED_INPUT_CLASSNAME, className),
  };

  // O react-imask tipa cada forma de máscara à parte: padrão (texto) ou lista dinâmica.
  return typeof mask === "string" ? (
    <IMaskInput
      {...common}
      mask={mask}
      definitions={definitions}
      prepareChar={prepareChar}
    />
  ) : (
    <IMaskInput {...common} mask={mask} />
  );
}
