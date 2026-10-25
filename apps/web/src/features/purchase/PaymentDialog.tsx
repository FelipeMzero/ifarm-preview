import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { FIELD_LIMITS } from "@ifarm/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/our/FormField";
import { formatBRL } from "./display";
import {
  purchasePaymentSchema,
  today,
  type PurchasePaymentPayload as PaymentFormData,
} from "@ifarm/shared";
import { purchaseClient } from "@/lib/clients";
import { applyServerErrors } from "@/lib/form-errors";
import { purchaseKeys } from "./queries";

export function PaymentDialog({
  purchaseId,
  value,
  open,
  onOpenChange,
}: {
  purchaseId: string;
  /** Valor da compra (estimado enquanto por cabeça depende dos recebidos). */
  value: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
          <DialogDescription>
            Depois do pagamento, o vendedor, as categorias e os valores ficam
            bloqueados (o pagamento pode ser desfeito para corrigir).
            {value != null && (
              <>
                {" "}
                Valor da compra:{" "}
                <span className="font-medium text-foreground">
                  {formatBRL(value)}
                </span>
                .
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        {/* Montado só com o diálogo aberto: cada abertura começa de hoje. */}
        {open && (
          <PaymentForm
            purchaseId={purchaseId}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PaymentForm({
  purchaseId,
  onClose,
}: {
  purchaseId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(purchasePaymentSchema, undefined, { raw: true }),
    defaultValues: { paymentDate: today(), paymentReference: "" },
  });

  // A compra na tela é recarregada (cache) e passa a mostrar o pagamento.
  const pay = useMutation({
    mutationFn: (data: PaymentFormData) =>
      purchaseClient.payPurchase(purchaseId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all }),
  });

  async function onSubmit(data: PaymentFormData) {
    try {
      await pay.mutateAsync(data);
      toast.success("Pagamento registrado.");
      onClose();
    } catch (e) {
      applyServerErrors(setError, e);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        name="paymentDate"
        control={control}
        label="Data do pagamento"
        required
        render={({ field, id }) => (
          <Input {...field} id={id} type="date" max={today()} />
        )}
      />
      <FormField
        name="paymentReference"
        control={control}
        label="Comprovante / referência"
        helperText="Opcional. Ex.: PIX de 27/09, identificador E1234…"
        render={({ field, id }) => (
          <Input
            {...field}
            value={field.value ?? ""}
            id={id}
            maxLength={FIELD_LIMITS.purchase.paymentReference}
          />
        )}
      />
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="w-auto" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Registrar
        </Button>
      </DialogFooter>
    </form>
  );
}
