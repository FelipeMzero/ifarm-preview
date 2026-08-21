"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

export type SelectFieldItem = { value: string; label: string };

type SelectFieldProps = {
  value: string;
  onValueChange: (value: string) => void;
  items: SelectFieldItem[];
  placeholder?: string;
  id?: string;
  className?: string;
  "aria-invalid"?: boolean;
};

export function SelectField({
  value,
  onValueChange,
  items,
  placeholder,
  id,
  className,
  ...props
}: SelectFieldProps) {
  return (
    <Combobox
      items={items}
      value={value}
      onValueChange={(val) => onValueChange((val as string) ?? "")}
      itemToStringLabel={(val: string) =>
        items.find((item) => item.value === val)?.label ?? val
      }
      filter={null}
    >
      <ComboboxTrigger
        id={id}
        className={cn(
          "flex h-10 min-w-44 items-center justify-between rounded-lg border border-input bg-input/30 px-2.5 py-1 text-base transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "aria-invalid:border-destructive aria-invalid:focus:ring-3 aria-invalid:ring-destructive/20",
          "md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          className,
        )}
        {...props}
      >
        <ComboboxValue placeholder={placeholder} />
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxEmpty>Não há itens</ComboboxEmpty>
        <ComboboxList>
          {(item: SelectFieldItem) => (
            <ComboboxItem key={item.value} value={item.value}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
