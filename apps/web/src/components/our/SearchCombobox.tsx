"use client"

import { useRef, useState } from "react"
import { ControllerFieldState, ControllerRenderProps, FieldPath, FieldValues } from "react-hook-form"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import { InputGroupButton } from "@/components/ui/input-group"
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
  /** Se informado, exibe um botão "Novo" para criar um registro quando o texto digitado não bate com nenhum item */
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
  onCreateClick,
}: SearchComboboxProps<T, TName>) {
  const anchorRef = useComboboxAnchor()

  // items pode ser substituído a cada busca (ex: onInputValueChange refazendo a lista).
  // Guarda o label de todo item já visto para não perder o do item selecionado
  // quando ele sair da lista atual (ex: usuário digita algo sem resultado e aperta Esc).
  const labelCacheRef = useRef(new Map<string, string>())
  for (const item of items) labelCacheRef.current.set(item.value, item.label)

  // Rastreia o texto digitado para saber se ele bate exatamente com algum item
  // existente (usado para decidir quando oferecer a criação de um novo registro).
  const [query, setQuery] = useState("")
  const hasExactMatch = items.some((item) => item.label.trim().toLowerCase() === query.trim().toLowerCase())

  return (
    <Combobox
    items={items}
    filter={onInputValueChange ? null : undefined}
    value={field.value || null}
    onValueChange={(val) => field.onChange(val ?? "")}
    onInputValueChange={(val) => {
      setQuery(val)
      onInputValueChange?.(val)
    }}
    itemToStringLabel={(val: string) => items.find((item) => item.value === val)?.label ?? labelCacheRef.current.get(val) ?? val}
    >
    <div ref={anchorRef} className="w-full">
    <ComboboxInput
    id={id}
    placeholder={placeholder}
    aria-invalid={fieldState.invalid || undefined}
    showClear={!!field.value}
    onBlur={() => {
      field.onBlur()
      if (keepSelection && !field.value && items[0]) field.onChange(items[0].value)
    }}
    >
    {onCreateClick && query.trim() !== "" && !hasExactMatch && (
      <InputGroupButton
      type="button"
      variant="ghost"
      size="icon-xs"
      title="Novo"
      aria-label="Novo"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onCreateClick()
      }}
      >
      <Plus />
      </InputGroupButton>
    )}
    </ComboboxInput>
    </div>
    <ComboboxContent anchor={anchorRef}>
    <ComboboxEmpty>
    <div className="p-2 text-center text-sm">{emptyMessage}</div>
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
