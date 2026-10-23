"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Ban,
  ChevronRight,
  CircleCheckBig,
  Info,
  Loader2,
  Undo2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { FIELD_LIMITS } from "@ifarm/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { FieldSet } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { ErrorPage } from "@/components/our/ErrorPage";
import { FormActionBar } from "@/components/our/FormActionBar";
import { FormField } from "@/components/our/FormField";
import FormSkeleton from "@/components/our/FormSkeleton";
import FieldRow from "@/components/our/FieldRow";
import {
  SearchCombobox,
  type SearchComboboxItem,
} from "@/components/our/SearchCombobox";
import { breedClient } from "@/lib/clients";
import { personClient } from "@/lib/clients";
import { SessionStatusBadge } from "@/features/management-session/display";
import { useCurrentProperty } from "@/features/shell/CurrentPropertyProvider";
import { Badge } from "@/components/ui/badge";
import { CategoriesEditor } from "./CategoriesEditor";
import { PaymentDialog } from "./PaymentDialog";
import {
  PurchaseStatusBadge,
  ReceivedCount,
  formatBRL,
  formatDay,
} from "./display";
import {
  purchaseSchema,
  today,
  type PurchasePayload as PurchaseFormData,
} from "@ifarm/shared";
import { purchaseClient } from "@/lib/clients";
import { ApiError, isSessionOpen, type PurchaseDetail } from "@ifarm/shared";

const str = (v: number | null | undefined) => (v == null ? "" : String(v));

function toFormValues(detail: PurchaseDetail): PurchaseFormData {
  return {
    title: detail.title,
    sellerId: detail.seller.id,
    purchaseDate: detail.purchaseDate,
    notes: detail.notes ?? "",
    categories: detail.categories.map((c) => ({
      id: c.id,
      sex: c.sex,
      minAgeMonths: str(c.minAgeMonths),
      maxAgeMonths: str(c.maxAgeMonths),
      breedId: c.breed?.id ?? "",
      expectedQuantity: String(c.expectedQuantity),
      pricingType: c.pricingType,
      unitPrice: str(c.unitPrice),
      totalPrice: str(c.totalPrice),
      invoicedWeight: str(c.invoicedWeight),
      shrinkPercent: str(c.shrinkPercent),
      costSplit: c.costSplit,
      notes: c.notes ?? "",
    })),
  };
}

type Action = "pay" | "undoPay" | "consolidate" | "cancel";

export function PurchaseForm({ id }: { id?: string }) {
  const router = useRouter();
  const { property: currentProperty } = useCurrentProperty();

  const [detail, setDetail] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [loadFailed, setLoadFailed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [breeds, setBreeds] = useState<{ id: string; name: string }[]>([]);
  const [sellerItems, setSellerItems] = useState<SearchComboboxItem[]>([]);
  const [action, setAction] = useState<Action | null>(null);
  const sellerDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { isSubmitting, isDirty },
  } = useForm<PurchaseFormData>({
    // raw: valida com o schema da API e envia os valores do formulário; a API converte
    // e descarta os campos que não são da forma de preço escolhida.
    resolver: zodResolver(purchaseSchema, undefined, { raw: true }),
    defaultValues: {
      title: "",
      sellerId: "",
      purchaseDate: today(),
      notes: "",
      categories: [
        {
          sex: "MALE",
          minAgeMonths: "",
          maxAgeMonths: "",
          breedId: "",
          expectedQuantity: "",
          pricingType: "PER_HEAD",
          unitPrice: "",
          totalPrice: "",
          invoicedWeight: "",
          shrinkPercent: "",
          costSplit: "EQUAL",
          notes: "",
        },
      ],
    },
  });

  const loadSellers = useCallback(async (q: string) => {
    try {
      const result = await personClient.getPeople({
        search: q,
        pageSize: q ? 20 : 5,
        status: "active",
      });
      setSellerItems(result.data.map((p) => ({ value: p.id, label: p.name })));
    } catch {
      setSellerItems([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    personClient
      .getPeople({ pageSize: 5, status: "active" })
      .then((result) => {
        if (!cancelled)
          setSellerItems(
            result.data.map((p) => ({ value: p.id, label: p.name })),
          );
      })
      .catch(() => {});
    breedClient
      .getBreeds()
      .then((list) => {
        if (!cancelled) setBreeds(list.filter((b) => !b.deactivatedAt));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    purchaseClient
      .getPurchase(id)
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        reset(toFormValues(data));
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, reset, refreshKey]);

  const editable = !detail || detail.status === "open";
  // Paga: o que define o valor fica bloqueado até desfazer o pagamento.
  const locked = !!detail?.paymentDate;

  // Garante o rótulo do vendedor gravado, mesmo fora da busca atual.
  const sellerOptions =
    detail && !sellerItems.some((i) => i.value === detail.seller.id)
      ? [{ value: detail.seller.id, label: detail.seller.name }, ...sellerItems]
      : sellerItems;

  async function onSubmit(data: PurchaseFormData) {
    const payload = { ...data, propertyId: currentProperty?.id };
    try {
      if (id) {
        await purchaseClient.updatePurchase(id, payload);
        toast.success("Compra atualizada!");
        setRefreshKey((k) => k + 1);
      } else {
        const result = await purchaseClient.createPurchase(payload);
        toast.success("Compra registrada!");
        router.replace(`/compras/${result.data.id}`);
      }
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        Object.entries(error.errors).forEach(([field, message]) =>
          setError(field as keyof PurchaseFormData, {
            type: "server",
            message,
          }),
        );
        toast.error(error.message);
      } else if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("A requisição falhou! Tente novamente.");
      }
    }
  }

  async function runAction() {
    if (!id || !action) return;
    const current = action;
    setAction(null);
    try {
      if (current === "consolidate") {
        await purchaseClient.consolidatePurchase(id);
        toast.success(
          "Compra consolidada. Os custos dos animais foram rateados.",
        );
      } else if (current === "undoPay") {
        await purchaseClient.undoPurchasePayment(id);
        toast.success("Pagamento desfeito. Os valores podem ser corrigidos.");
      } else {
        await purchaseClient.cancelPurchase(id);
        toast.success("Compra cancelada.");
      }
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (loadFailed) {
    return (
      <ErrorPage
        message="Não foi possível obter os dados do servidor."
        onRetry={() => window.location.reload()}
      />
    );
  }
  if (loading) return <FormSkeleton />;

  const expected =
    detail?.categories.reduce((s, c) => s + c.expectedQuantity, 0) ?? 0;
  const received =
    detail?.categories.reduce((s, c) => s + c.receivedQuantity, 0) ?? 0;
  const values = detail?.categories.map((c) => c.estimatedValue) ?? [];
  const totalValue =
    values.length && values.every((v) => v != null)
      ? values.reduce((s, v) => s + v!, 0)
      : null;
  const openReceptions =
    detail?.receptions.filter((r) => isSessionOpen(r.status)).length ?? 0;
  // Por que ainda não dá para consolidar (null = pode).
  const consolidateBlocker = !detail
    ? null
    : !detail.paymentDate
      ? "Registre o pagamento antes"
      : received === 0
        ? "Nenhum animal recebido"
        : openReceptions
          ? "Há recepções em aberto"
          : isDirty
            ? "Salve as alterações antes"
            : null;
  const consolidateDescription = [
    `${received} animal(is) recebido(s) de ${expected} negociado(s).`,
    received < expected
      ? `Faltam ${expected - received}: ao consolidar, declara-se que não virá mais nenhum.`
      : null,
    "O custo de cada animal é rateado agora e a compra não pode mais ser alterada nem receber animais.",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <form
        className="mx-auto flex w-full max-w-300 flex-col gap-6"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={() => router.push("/compras")}
        >
          <ArrowLeft className="size-4" /> Compras
        </Button>

        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold">
              {detail ? detail.title : "Nova Compra"}
            </h1>
            {detail && (
              <p className="text-sm text-muted-foreground">
                {detail.seller.name}
              </p>
            )}
          </div>
          {detail && <PurchaseStatusBadge status={detail.status} />}
          {detail?.paymentDate && (
            <Badge
              variant="outline"
              title={detail.paymentReference ?? undefined}
            >
              Paga em {formatDay(detail.paymentDate)}
            </Badge>
          )}
          {detail && detail.status === "open" && (
            <div className="ml-auto flex flex-wrap gap-2">
              {received === 0 && !detail.paymentDate && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-auto text-destructive hover:text-destructive"
                  onClick={() => setAction("cancel")}
                >
                  <Ban className="size-4" /> Cancelar compra
                </Button>
              )}
              {detail.paymentDate ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-auto"
                  onClick={() => setAction("undoPay")}
                >
                  <Undo2 className="size-4" /> Desfazer pagamento
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-auto"
                  disabled={isDirty}
                  title={isDirty ? "Salve as alterações antes" : undefined}
                  onClick={() => setAction("pay")}
                >
                  <Wallet className="size-4" /> Registrar pagamento
                </Button>
              )}
              <Button
                type="button"
                className="w-auto"
                disabled={consolidateBlocker != null}
                title={consolidateBlocker ?? undefined}
                onClick={() => setAction("consolidate")}
              >
                <CircleCheckBig className="size-4" /> Consolidar
              </Button>
            </div>
          )}
        </div>
        <Separator />

        <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          {!detail
            ? "A compra registra o que foi negociado, por categoria, com os preços. Os animais são cadastrados nas recepções, quando chegam."
            : detail.status === "cancelled"
              ? `Compra cancelada em ${new Date(detail.cancelledAt!).toLocaleString("pt-BR")}: desconsiderada.`
              : detail.status === "confirmed"
                ? `Compra consolidada em ${new Date(detail.confirmedAt!).toLocaleString("pt-BR")}: custos rateados entre os animais recebidos. Não pode mais ser alterada.`
                : detail.paymentDate
                  ? `Paga em ${formatDay(detail.paymentDate)}${
                      detail.paymentReference
                        ? ` (${detail.paymentReference})`
                        : ""
                    }: vendedor, categorias e valores bloqueados. Depois de todas as recepções concluídas, consolide a compra para ratear os custos.`
                  : "Em andamento: tudo pode ser alterado. O pagamento exige os valores de todas as categorias (por arroba, o peso faturado); a consolidação exige o pagamento e as recepções concluídas."}
        </div>

        <FieldSet className="border-0 p-0" disabled={!editable}>
          <FormField
            name="title"
            control={control}
            label="Título"
            required
            helperText="Identifica a compra (ex.: Bezerros desmamados — Leilão set/26)."
            render={({ field, id: fieldId }) => (
              <Input
                {...field}
                id={fieldId}
                maxLength={FIELD_LIMITS.purchase.title}
              />
            )}
          />
          <FieldRow cols={2}>
            <FieldSet className="border-0 p-0" disabled={!editable || locked}>
              <FormField
                name="sellerId"
                control={control}
                label="Vendedor"
                required
                render={({ field, fieldState, id: fieldId }) => (
                  <SearchCombobox
                    id={fieldId}
                    field={field}
                    fieldState={fieldState}
                    items={sellerOptions}
                    placeholder="Buscar pessoa..."
                    onInputValueChange={(q) => {
                      if (sellerDebounce.current)
                        clearTimeout(sellerDebounce.current);
                      sellerDebounce.current = setTimeout(
                        () => loadSellers(q),
                        300,
                      );
                    }}
                  />
                )}
              />
            </FieldSet>
            <FormField
              name="purchaseDate"
              control={control}
              label="Data da compra"
              required
              render={({ field, id: fieldId }) => (
                <Input {...field} id={fieldId} type="date" />
              )}
            />
          </FieldRow>
          <FormField
            name="notes"
            control={control}
            label="Observação"
            render={({ field, id: fieldId }) => (
              <Textarea
                {...field}
                value={field.value ?? ""}
                id={fieldId}
                maxLength={FIELD_LIMITS.purchase.notes}
                className="resize-none"
                rows={2}
              />
            )}
          />
        </FieldSet>

        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-medium uppercase text-muted-foreground">
              Categorias negociadas
            </h3>
            {detail && (
              <span className="text-sm text-muted-foreground">
                Recebidos:{" "}
                <ReceivedCount received={received} expected={expected} />
                {totalValue != null && (
                  <>
                    {" · "}
                    {detail.status === "confirmed" ? "Valor" : "Valor estimado"}
                    :{" "}
                    <span className="font-medium text-foreground">
                      {formatBRL(totalValue)}
                    </span>
                  </>
                )}
              </span>
            )}
          </div>
          <FieldSet className="border-0 p-0" disabled={!editable}>
            <CategoriesEditor
              control={control}
              setValue={setValue}
              breeds={breeds}
              saved={detail?.categories ?? []}
              disabled={!editable}
              locked={locked}
            />
          </FieldSet>
        </section>

        {detail && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium uppercase text-muted-foreground">
                Recepções ({detail.receptions.length})
              </h3>
            </div>
            {detail.receptions.length === 0 ? (
              <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
                Nenhuma recepção. Os animais são recebidos na área de Recepções.
              </div>
            ) : (
              <ul className="space-y-2">
                {detail.receptions.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/recepcoes/${r.sessionId}`)}
                      className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-card p-3 text-left text-sm transition-colors hover:bg-accent/40"
                    >
                      <span className="font-medium">{r.title}</span>
                      <SessionStatusBadge status={r.status} />
                      <span className="text-muted-foreground">
                        {formatDay(r.performedAt ?? r.scheduledAt)}
                      </span>
                      <span className="text-muted-foreground">
                        Lote de entrada: {r.entryBatch.name}
                      </span>
                      {(r.gtaNumber || r.invoiceNumber) && (
                        <span className="text-muted-foreground">
                          {[
                            r.gtaNumber && `GTA ${r.gtaNumber}`,
                            r.invoiceNumber && `NF ${r.invoiceNumber}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                      <span className="ml-auto tabular-nums">
                        {r.animalCount} animal(is)
                      </span>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {editable && (
          <FormActionBar>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Salvar
            </Button>
          </FormActionBar>
        )}
      </form>

      {detail && (
        <PaymentDialog
          purchaseId={detail.id}
          value={totalValue}
          open={action === "pay"}
          onOpenChange={(open) => !open && setAction(null)}
          onPaid={() => setRefreshKey((k) => k + 1)}
        />
      )}
      <ConfirmDialog
        open={action === "undoPay"}
        onOpenChange={(open) => !open && setAction(null)}
        onConfirm={runAction}
        variant="default"
        title="Desfazer pagamento"
        description="O registro do pagamento é removido e os valores voltam a ser editáveis. Use para corrigir um pagamento registrado por engano."
        confirmLabel="Desfazer"
        cancelLabel="Voltar"
      />
      <ConfirmDialog
        open={action === "consolidate"}
        onOpenChange={(open) => !open && setAction(null)}
        onConfirm={runAction}
        variant="default"
        title="Consolidar compra"
        description={consolidateDescription}
        confirmLabel="Consolidar"
        cancelLabel="Voltar"
      />
      <ConfirmDialog
        open={action === "cancel"}
        onOpenChange={(open) => !open && setAction(null)}
        onConfirm={runAction}
        title="Cancelar compra"
        description="A compra será cancelada, junto com as recepções ainda vazias. O registro é mantido no filtro de canceladas."
        confirmLabel="Sim, cancelar"
        cancelLabel="Voltar"
      />
    </>
  );
}
