"use client"

import { ControllerFieldState, ControllerRenderProps, FieldPath, FieldValues } from "react-hook-form"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

export type SearchComboboxItem = { value: string; label: string }

type SearchComboboxProps<T extends FieldValues, TName extends FieldPath<T>> = {
  field: ControllerRenderProps<T, TName>
  fieldState: ControllerFieldState
  items: SearchComboboxItem[]
  onInputValueChange?: (val: string) => void
  placeholder?: string
  emptyMessage?: string
  id?: string
}

export function SearchCombobox<T extends FieldValues, TName extends FieldPath<T>>({
  field,
  fieldState,
  items,
  onInputValueChange,
  placeholder,
  emptyMessage = "Não há itens",
  id,
}: SearchComboboxProps<T, TName>) {
  return (
    <Combobox
      items={items}
      filter={onInputValueChange ? null : undefined}
      value={field.value || null}
      onValueChange={(val) => field.onChange(val ?? "")}
      onInputValueChange={onInputValueChange}
    >
      <ComboboxInput
        id={id}
        placeholder={placeholder}
        aria-invalid={fieldState.invalid || undefined}
        showClear={!!field.value}
      />
      <ComboboxContent>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.value} value={item.value}>{item.label}</ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
