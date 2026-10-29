import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Loader2, Plus, TriangleAlert, Truck } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { SEX_ITEMS } from "@ifarm/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/our/SelectField";
import { managementSessionClient } from "@/lib/clients";
import {
  ApiError,
  type ReceiveAnimalPayload,
  type ReceptionCategory,
  type ReceptionInfo,
} from "@ifarm/shared";
import { useReloadReception } from "./queries";

// Categoria em recebimento: lembrada por sessão neste navegador (conveniência de quem
// está no tronco; a informação que vale fica no animal recebido).
const storageKey = (sessionId: string) => `reception-category:${sessionId}`;

function readStoredCategory(sessionId: string) {
  try {
    const v = sessionStorage.getItem(storageKey(sessionId));
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

function storeCategory(sessionId: string, id: number) {
  try {
    sessionStorage.setItem(storageKey(sessionId), String(id));
  } catch {
    // Sem armazenamento: a escolha só não sobrevive a recarregar a página.
  }
}

function initialCategory(sessionId: string, categories: ReceptionCategory[]) {
  const stored = readStoredCategory(sessionId);
  if (stored && categories.some((c) => c.id === stored)) return stored;
  // Primeira categoria que ainda não atingiu o esperado.
  return (
    categories.find((c) => c.receivedTotal < c.expectedQuantity)?.id ??
    categories[0]?.id ??
    null
  );
}

function outOfAgeRange(c: ReceptionCategory, age: number) {
  return (
    (c.minAgeMonths != null && age < c.minAgeMonths) ||
    (c.maxAgeMonths != null && age > c.maxAgeMonths)
  );
}

export function ReceptionPanel({
  sessionId,
  reception,
  canReceive,
  hasSteps,
  onReceived,
}: {
  sessionId: string;
  reception: ReceptionInfo;
  /** Só com o registro iniciado e a sessão em aberto. */
  canReceive: boolean;
  /** A recepção tem manejos a fazer em cada animal. */
  hasSteps: boolean;
  onReceived: (animalId: string, openSteps: boolean) => void;
}) {
  const { categories } = reception;
  const [categoryId, setCategoryId] = useState<number | null>(() =>
    initialCategory(sessionId, categories),
  );
  const category = categories.find((c) => c.id === categoryId) ?? null;
  const [sex, setSex] = useState<string>(category?.sex ?? "MALE");
  const [age, setAge] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // O animal recebido entra na lista da recepção (cache recarregado) e nas contagens da compra.
  const reloadReception = useReloadReception();
  const receiveAnimal = useMutation({
    mutationFn: (data: ReceiveAnimalPayload) =>
      managementSessionClient.receiveAnimal(sessionId, data),
    onSuccess: reloadReception,
  });
  const saving = receiveAnimal.isPending;

  function chooseCategory(c: ReceptionCategory) {
    setCategoryId(c.id);
    setSex(c.sex);
    setError(null);
    storeCategory(sessionId, c.id);
  }

  async function receive(openSteps: boolean) {
    if (!category) {
      setError("Escolha a categoria do animal.");
      return;
    }
    setError(null);
    try {
      const result = await receiveAnimal.mutateAsync({
        categoryId: category.id,
        sex: sex as "MALE" | "FEMALE",
        ageMonths: age ? Number(age) : null,
        name: name || undefined,
      });
      toast.success(`Animal recebido (${category.label}).`);
      setAge("");
      setName("");
      onReceived(result.data.animalId, openSteps);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else toast.error("A requisição falhou! Tente novamente.");
    }
  }

  const ageNumber = age ? Number(age) : null;
  const warnings = category
    ? ([
        sex !== category.sex &&
          `Sexo diferente do da categoria (${category.sex === "MALE" ? "machos" : "fêmeas"}).`,
        ageNumber != null &&
          outOfAgeRange(category, ageNumber) &&
          "Idade fora da faixa negociada para a categoria.",
        category.receivedTotal >= category.expectedQuantity &&
          `A categoria já recebeu ${category.receivedTotal} de ${category.expectedQuantity} animais negociados.`,
      ].filter(Boolean) as string[])
    : [];

  return (
    <section className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="flex items-center gap-2 font-medium">
          <Truck className="size-4 text-muted-foreground" />
          {reception.purchaseTitle}
          <span className="font-normal text-muted-foreground">
            ({reception.sellerName})
          </span>
        </span>
        <span className="text-muted-foreground">
          Lote de entrada:{" "}
          <span className="text-foreground">{reception.entryBatch.name}</span>
        </span>
      </div>

      {/* Categoria em recebimento: escolhida poucas vezes por recepção (um caminhão
          ou compartimento costuma trazer uma categoria só). */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const selected = c.id === categoryId;
          const complete = c.receivedTotal >= c.expectedQuantity;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={selected}
              disabled={!canReceive}
              onClick={() => chooseCategory(c)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-default",
                selected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:bg-muted",
              )}
            >
              <span className="block font-medium">{c.label}</span>
              <span className="block text-xs text-muted-foreground tabular-nums">
                {c.receivedHere} nesta recepção ·{" "}
                <span
                  className={cn(
                    c.receivedTotal > c.expectedQuantity && "text-warning",
                    complete &&
                      c.receivedTotal === c.expectedQuantity &&
                      "text-primary",
                  )}
                >
                  {c.receivedTotal}/{c.expectedQuantity} na compra
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {canReceive && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            receive(hasSteps);
          }}
          className="grid items-end gap-2 sm:grid-cols-[9rem_10rem_1fr_auto_auto]"
        >
          <SelectField
            value={sex}
            onValueChange={(v) => setSex(v || "MALE")}
            items={SEX_ITEMS}
            className="w-full min-w-0"
          />
          <Input
            aria-label="Idade estimada (meses)"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="Idade (meses)"
            title="Idade estimada, por exemplo pela arcada dentária"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
          <Input
            aria-label="Apelido"
            placeholder="Apelido (opcional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            type="button"
            disabled={saving || !category}
            title="Receber e continuar recebendo (sem abrir os manejos)"
            onClick={() => receive(false)}
          >
            <Plus className="size-4" /> Receber
          </Button>
          {hasSteps && (
            <Button
              type="submit"
              className="w-auto"
              disabled={saving || !category}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowRight className="size-4" />
              )}
              Receber e manejar
            </Button>
          )}
        </form>
      )}

      {(warnings.length > 0 || error) && (
        <div className="space-y-1 text-xs">
          {warnings.map((w) => (
            <p key={w} className="flex items-center gap-1.5 text-warning">
              <TriangleAlert className="size-3.5 shrink-0" /> {w}
            </p>
          ))}
          {error && <p className="text-destructive">{error}</p>}
        </div>
      )}
    </section>
  );
}
