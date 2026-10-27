import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
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

import { FIELD_LIMITS, formatDay, formatDateTime } from "@ifarm/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { FieldSet } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { ErrorPage } from "@/components/our/ErrorPage";
import { FormActionBar } from "@/components/our/FormActionBar";
import { FormField } from "@/components/our/FormField";
import { FieldRow } from "@/components/our/FieldRow";
import { SearchCombobox } from "@/components/our/SearchCombobox";
import { animalKeys } from "@/features/animal/queries";
import { breedListQuery } from "@/features/breed/queries";
import { usePersonOptions } from "@/features/person/usePersonOptions";
import { SessionStatusBadge } from "@/features/management-session/display";
import { useCurrentProperty } from "@/features/shell/useCurrentProperty";
import { Badge } from "@/components/ui/badge";
import { CategoriesEditor } from "./CategoriesEditor";
import { PaymentDialog } from "./PaymentDialog";
import { PurchaseStatusBadge, ReceivedCount, formatBRL } from "./display";
import {
  purchaseSchema,
  today,
  type PurchasePayload as PurchaseFormData,
} from "@ifarm/shared";
import { purchaseClient } from "@/lib/clients";
import { applyServerErrors } from "@/lib/form-errors";
import {
  isNotFoundError,
  isSessionOpen,
  type PurchaseDetail,
  type PurchasePayload,
} from "@ifarm/shared";
import { receptionKeys } from "@/features/reception/queries";
import { purchaseDetailQuery, purchaseKeys } from "./queries";
import { FormSkeleton } from "@/components/our/PageSkeletons";

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { property: currentProperty } = useCurrentProperty();
  const [action, setAction] = useState<Action | null>(null);

  // Compra em edição (só com id).
  const {
    data: detail,
    error,
    isPending,
    refetch,
  } = useQuery({ ...purchaseDetailQuery(id ?? ""), enabled: !!id });
  // Opções: raças ativas e vendedores (o gravado entra no topo, para o campo ter o nome).
  const { data: breedList } = useQuery(breedListQuery());
  const breeds = breedList?.filter((b) => !b.deactivatedAt) ?? [];
  const sellers = usePersonOptions({ selected: detail?.seller });

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
    // Dados da compra em edição. Se forem buscados de novo em segundo plano (ex.: depois de
    // pagar), só os campos que o usuário não alterou são atualizados (keepDirtyValues).
    values: detail && toFormValues(detail),
    resetOptions: { keepDirtyValues: true },
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

  const editable = !detail || detail.status === "open";
  // Paga: o que define o valor fica bloqueado até desfazer o pagamento.
  const locked = !!detail?.paymentDate;

  // A compra aparece também na recepção (categorias, recebidos e situação).
  const reloadPurchases = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all }),
      queryClient.invalidateQueries({ queryKey: receptionKeys.all }),
    ]);
  const create = useMutation({
    mutationFn: (payload: PurchasePayload) =>
      purchaseClient.createPurchase(payload),
    onSuccess: reloadPurchases,
  });
  const update = useMutation({
    mutationFn: (payload: PurchasePayload) =>
      purchaseClient.updatePurchase(id!, payload),
    onSuccess: reloadPurchases,
  });

  async function onSubmit(data: PurchaseFormData) {
    const payload = { ...data, propertyId: currentProperty?.id };
    try {
      if (id) {
        await update.mutateAsync(payload);
        // Volta o formulário ao estado "sem alterações", com os dados salvos (e o cache junto).
        const fresh = await queryClient.query(purchaseDetailQuery(id));
        reset(toFormValues(fresh));
        toast.success("Compra atualizada!");
      } else {
        const result = await create.mutateAsync(payload);
        toast.success("Compra registrada!");
        navigate(`/compras/${result.data.id}`, { replace: true });
      }
    } catch (error) {
      applyServerErrors(setError, error);
    }
  }

  // Ações da compra (o pagamento tem diálogo próprio). Consolidar rateia o custo nos animais
  // recebidos: recarrega também os animais.
  const runAction = useMutation({
    mutationFn: (current: Exclude<Action, "pay">) =>
      current === "consolidate"
        ? purchaseClient.consolidatePurchase(id!)
        : current === "undoPay"
          ? purchaseClient.undoPurchasePayment(id!)
          : purchaseClient.cancelPurchase(id!),
    onSuccess: (_, current) => {
      toast.success(
        current === "consolidate"
          ? "Compra consolidada. Os custos dos animais foram rateados."
          : current === "undoPay"
            ? "Pagamento desfeito. Os valores podem ser corrigidos."
            : "Compra cancelada.",
      );
      reloadPurchases();
      if (current === "consolidate") {
        queryClient.invalidateQueries({ queryKey: animalKeys.all });
      }
    },
    // O diálogo já fechou no clique (AlertDialogAction); o aviso explica a falha.
    onError: (e) => toast.error(e.message),
  });

  function confirmAction() {
    if (id && action && action !== "pay") runAction.mutate(action);
    setAction(null);
  }

  if (id && isPending) return <FormSkeleton />;

  if (id && !detail) {
    // Não existe mais (ex.: excluída por outra pessoa): tentar de novo não adianta.
    if (isNotFoundError(error)) {
      return (
        <ErrorPage
          title="Compra não encontrada"
          message="Ela pode ter sido excluída."
          onBack={() => navigate("/compras")}
          backLabel="Voltar"
        />
      );
    }
    return (
      <ErrorPage
        message="Não foi possível obter os dados do servidor."
        onRetry={() => refetch()}
      />
    );
  }

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
          onClick={() => navigate("/compras")}
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
              ? `Compra cancelada em ${formatDateTime(detail.cancelledAt)}: desconsiderada.`
              : detail.status === "confirmed"
                ? `Compra consolidada em ${formatDateTime(detail.confirmedAt)}: custos rateados entre os animais recebidos. Não pode mais ser alterada.`
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
                    items={sellers.items}
                    placeholder="Buscar pessoa..."
                    onInputValueChange={sellers.search}
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
                      onClick={() => navigate(`/recepcoes/${r.sessionId}`)}
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
          timeZone={detail.destinationProperty.timeZone}
          value={totalValue}
          open={action === "pay"}
          onOpenChange={(open) => !open && setAction(null)}
        />
      )}
      <ConfirmDialog
        open={action === "undoPay"}
        onOpenChange={(open) => !open && setAction(null)}
        onConfirm={confirmAction}
        variant="default"
        title="Desfazer pagamento"
        description="O registro do pagamento é removido e os valores voltam a ser editáveis. Use para corrigir um pagamento registrado por engano."
        confirmLabel="Desfazer"
        cancelLabel="Voltar"
      />
      <ConfirmDialog
        open={action === "consolidate"}
        onOpenChange={(open) => !open && setAction(null)}
        onConfirm={confirmAction}
        variant="default"
        title="Consolidar compra"
        description={consolidateDescription}
        confirmLabel="Consolidar"
        cancelLabel="Voltar"
      />
      <ConfirmDialog
        open={action === "cancel"}
        onOpenChange={(open) => !open && setAction(null)}
        onConfirm={confirmAction}
        title="Cancelar compra"
        description="A compra será cancelada, junto com as recepções ainda vazias. O registro é mantido no filtro de canceladas."
        confirmLabel="Sim, cancelar"
        cancelLabel="Voltar"
      />
    </>
  );
}
