"use client";

import { useEffect, useRef, useState } from "react";
import {
  ControllerFieldState,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Plus } from "lucide-react";

export type SearchComboboxItem = { value: string; label: string };

// Valor sentinela da opção "Adicionar" na lista; nunca é gravado no campo.
const CREATE_VALUE = "__search-combobox-create__";

type SearchComboboxProps<T extends FieldValues, TName extends FieldPath<T>> = {
  field: ControllerRenderProps<T, TName>;
  fieldState: ControllerFieldState;
  items: readonly SearchComboboxItem[];
  onInputValueChange?: (val: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  id?: string;
  /** Se o campo ficar vazio ao perder o foco, volta a selecionar items[0]. Use em campos sem opção "vazio" válida (ex: enums). */
  keepSelection?: boolean;
  /** Se informado, a lista ganha a opção "Adicionar" quando o texto digitado não bate com nenhum item */
  onCreateClick?: () => void;
};

export function SearchCombobox<
  T extends FieldValues,
  TName extends FieldPath<T>,
>({
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
  const anchorRef = useComboboxAnchor();

  // items pode ser substituído a cada busca (ex: onInputValueChange refazendo a lista).
  // Guarda o label de todo item já visto para não perder o do item selecionado
  // quando ele sair da lista atual (ex: usuário digita algo sem resultado e aperta Esc).
  // Os itens atuais são procurados primeiro em listItems; o cache só precisa dos anteriores.
  const labelCacheRef = useRef(new Map<string, string>());
  useEffect(() => {
    for (const item of items) labelCacheRef.current.set(item.value, item.label);
  }, [items]);

  // Rastreia o texto digitado para saber se ele bate exatamente com algum item
  // existente (usado para decidir quando oferecer a criação de um novo registro).
  const [query, setQuery] = useState("");
  const hasExactMatch = items.some(
    (item) => item.label.trim().toLowerCase() === query.trim().toLowerCase(),
  );
  const canCreate = !!onCreateClick && query.trim() !== "" && !hasExactMatch;

  // A criação é uma opção da própria lista, alcançável pelo mouse e pelo teclado
  // (↓ + Enter). Um botão fora da lista não funcionaria pelo teclado: ao sair do
  // campo com Tab o combobox fecha e limpa o texto digitado.
  const listItems: readonly SearchComboboxItem[] = canCreate
    ? [...items, { value: CREATE_VALUE, label: `Adicionar "${query.trim()}"` }]
    : items;

  return (
    <Combobox
      items={listItems}
      filter={onInputValueChange ? null : undefined}
      value={field.value || null}
      onValueChange={(val) => {
        if (val === CREATE_VALUE) {
          onCreateClick?.();
          return;
        }
        field.onChange(val ?? "");
      }}
      onInputValueChange={(val) => {
        setQuery(val);
        onInputValueChange?.(val);
      }}
      itemToStringLabel={(val: string) =>
        listItems.find((item) => item.value === val)?.label ??
        labelCacheRef.current.get(val) ??
        val
      }
    >
      <div ref={anchorRef} className="w-full">
        <ComboboxInput
          id={id}
          placeholder={placeholder}
          aria-invalid={fieldState.invalid || undefined}
          showClear={!!field.value}
          onBlur={() => {
            field.onBlur();
            if (keepSelection && !field.value && items[0])
              field.onChange(items[0].value);
          }}
        />
      </div>
      <ComboboxContent anchor={anchorRef}>
        <ComboboxEmpty>
          <div className="p-2 text-center text-sm">{emptyMessage}</div>
        </ComboboxEmpty>
        <ComboboxList>
          {(item: SearchComboboxItem) =>
            item.value === CREATE_VALUE ? (
              <ComboboxItem
                key={item.value}
                value={item.value}
                className="text-primary"
              >
                <Plus />
                {item.label}
              </ComboboxItem>
            ) : (
              <ComboboxItem key={item.value} value={item.value}>
                {item.label}
              </ComboboxItem>
            )
          }
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
