"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { FIELD_LIMITS } from "@/lib/field-limits";
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
import { paymentFormSchema, type PaymentFormData } from "./schema";
import { payPurchase } from "./services";

const todayIso = () => new Date().toLocaleDateString("en-CA");

export function PaymentDialog({
  purchaseId,
  value,
  open,
  onOpenChange,
  onPaid,
}: {
  purchaseId: string;
  /** Valor da compra (estimado enquanto por cabeça depende dos recebidos). */
  value: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaid: () => void;
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
            onCancel={() => onOpenChange(false)}
            onPaid={() => {
              onOpenChange(false);
              onPaid();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PaymentForm({
  purchaseId,
  onCancel,
  onPaid,
}: {
  purchaseId: string;
  onCancel: () => void;
  onPaid: () => void;
}) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { paidAt: todayIso(), paymentReference: "" },
  });

  async function onSubmit(data: PaymentFormData) {
    try {
      await payPurchase(purchaseId, {
        paidAt: data.paidAt,
        paymentReference: data.paymentReference || undefined,
      });
      toast.success("Pagamento registrado.");
      onPaid();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        name="paidAt"
        control={control}
        label="Data do pagamento"
        required
        render={({ field, id }) => (
          <Input {...field} id={id} type="date" max={todayIso()} />
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
            id={id}
            maxLength={FIELD_LIMITS.purchase.paymentReference}
          />
        )}
      />
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel}>
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
