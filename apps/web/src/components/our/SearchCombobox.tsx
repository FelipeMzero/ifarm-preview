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
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export type SearchComboboxItem = { value: string; label: string }

type SearchComboboxProps<T extends FieldValues, TName extends FieldPath<T>> = {
  field: ControllerRenderProps<T, TName>
  fieldState: ControllerFieldState
  items: readonly SearchComboboxItem[]
  onInputValueChange?: (val: string) => void
  placeholder?: string
  emptyMessage?: string
  id?: string
  /** Se o campo ficar vazio ao perder o foco, volta a selecionar items[0]. Use em campos sem opção "vazio" válida (ex: enums). */
  keepSelection?: boolean
  /** Permite a exibição do botão para criação de um novo registro (padrão: false) */
  allowCreate?: boolean
  /** Callback disparado ao clicar no botão "Novo" */
  onCreateClick?: () => void
}

export function SearchCombobox<T extends FieldValues, TName extends FieldPath<T>>({
  field,
  fieldState,
  items,
  onInputValueChange,
  placeholder,
  emptyMessage = "Não há itens",
  id,
  keepSelection = false,
  allowCreate = false,
  onCreateClick,
}: SearchComboboxProps<T, TName>) {
  return (
    <Combobox
    items={items}
    filter={onInputValueChange ? null : undefined}
    value={field.value || null}
    onValueChange={(val) => field.onChange(val ?? "")}
    onInputValueChange={onInputValueChange}
    itemToStringLabel={(val: string) => items.find((item) => item.value === val)?.label ?? val}
    >
    <ComboboxInput
    id={id}
    placeholder={placeholder}
    aria-invalid={fieldState.invalid || undefined}
    showClear={!!field.value}
    onBlur={() => {
      field.onBlur()
      if (keepSelection && !field.value && items[0]) field.onChange(items[0].value)
    }}
    />
    <ComboboxContent>
    <ComboboxEmpty>
    <div className="flex flex-col items-center justify-center gap-2 p-2 text-sm">
    <span>{emptyMessage}</span>
    {allowCreate && onCreateClick && (
      <Button
      type="button"
      variant="outline"
      size="sm"
      className="mt-1 w-full flex items-center justify-center gap-1 text-xs"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onCreateClick()
      }}
      >
      <Plus className="h-3 w-3" />
      Novo
      </Button>
    )}
    </div>
    </ComboboxEmpty>
    <ComboboxList>
    {(item) => (
      <ComboboxItem key={item.value} value={item.value}>
      {item.label}
      </ComboboxItem>
    )}
    </ComboboxList>
    </ComboboxContent>
    </Combobox>
  )
}
