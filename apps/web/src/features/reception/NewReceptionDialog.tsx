import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { FIELD_LIMITS } from "@ifarm/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldRow } from "@/components/our/FieldRow";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/our/FormField";
import { SearchCombobox } from "@/components/our/SearchCombobox";
import { StepsEditor } from "@/features/management-session/StepsEditor";
import {
  planStepFormSchema,
  toStepPayload,
  type PlanFormData,
} from "@/features/management-session/schema";
import { managementOptionsQuery } from "@/features/management-session/queries";
import {
  receptionDocumentsSchema,
  type ManagementOptions,
} from "@ifarm/shared";
import { useCurrentProperty } from "@/features/shell/useCurrentProperty";
import { receptionClient } from "@/lib/clients";
import { applyServerErrors } from "@/lib/form-errors";
import { useReloadReception } from "./queries";

// Documentos da carga com as regras da API (podem ser informados depois, na tela da
// recepção), o lote de entrada e os manejos de chegada (opcionais: receber os animais já
// é o trabalho da recepção).
const receptionFormSchema = receptionDocumentsSchema.extend({
  entryBatchId: z.string().min(1, "Selecione o lote de entrada"),
  steps: z.array(planStepFormSchema),
});

type ReceptionFormData = z.input<typeof receptionFormSchema>;

// Manejos de chegada mais comuns: identificar e pesar cada animal.
const DEFAULT_STEPS: ReceptionFormData["steps"] = [
  { type: "tag" },
  { type: "rfid" },
  { type: "weighing" },
];

const EMPTY_OPTIONS: ManagementOptions = {
  healthTypes: [],
  neuteringTechniques: [],
  people: [],
  batches: [],
};

export function NewReceptionDialog({
  purchaseId,
  open,
  onOpenChange,
  onCreated,
}: {
  purchaseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (sessionId: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova recepção</DialogTitle>
          <DialogDescription>
            Os animais são cadastrados um a um, conforme descem do caminhão, e
            entram no lote de entrada. Os manejos abaixo (opcionais) são feitos
            em cada animal recebido.
          </DialogDescription>
        </DialogHeader>
        {/* Montado só com o diálogo aberto: cada abertura começa do padrão. */}
        {open && (
          <ReceptionForm
            purchaseId={purchaseId}
            onCancel={() => onOpenChange(false)}
            onCreated={onCreated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReceptionForm({
  purchaseId,
  onCancel,
  onCreated,
}: {
  purchaseId: string;
  onCancel: () => void;
  onCreated: (sessionId: string) => void;
}) {
  const { property: currentProperty, isLoading: isPropertyLoading } =
    useCurrentProperty();
  const reloadReception = useReloadReception();

  // Lotes de entrada e opções dos manejos. Sem a propriedade atual, viriam os de todas.
  const { data, isError } = useQuery({
    ...managementOptionsQuery(currentProperty?.id),
    enabled: !isPropertyLoading,
  });
  const options = data ?? EMPTY_OPTIONS;

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<ReceptionFormData>({
    resolver: zodResolver(receptionFormSchema, undefined, { raw: true }),
    defaultValues: {
      entryBatchId: "",
      gtaNumber: "",
      invoiceNumber: "",
      steps: DEFAULT_STEPS,
    },
  });

  const create = useMutation({
    mutationFn: (form: ReceptionFormData) =>
      receptionClient.createReception(purchaseId, {
        entryBatchId: form.entryBatchId,
        gtaNumber: form.gtaNumber || null,
        invoiceNumber: form.invoiceNumber || null,
        steps: form.steps.map(toStepPayload),
      }),
    onSuccess: reloadReception,
  });

  async function onSubmit(form: ReceptionFormData) {
    try {
      const result = await create.mutateAsync(form);
      toast.success("Recepção aberta.");
      onCreated(result.data.sessionId);
    } catch (e) {
      applyServerErrors(setError, e);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        name="entryBatchId"
        control={control}
        label="Lote de entrada"
        required
        helperText="Lote em que os animais recebidos entram. A apartação (opcional) pode mandá-los para outros lotes na conclusão."
        render={({ field, fieldState, id }) => (
          <SearchCombobox
            id={id}
            field={field}
            fieldState={fieldState}
            items={options.batches.map((b) => ({
              value: b.id,
              label: b.name,
            }))}
            placeholder="Buscar lote..."
            emptyMessage={
              isError
                ? "Não foi possível carregar os lotes."
                : "Nenhum lote ativo"
            }
          />
        )}
      />

      <FieldRow cols={2}>
        <FormField
          name="gtaNumber"
          control={control}
          label="GTA da carga"
          render={({ field, id }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              id={id}
              maxLength={FIELD_LIMITS.purchase.gtaNumber}
            />
          )}
        />
        <FormField
          name="invoiceNumber"
          control={control}
          label="Nota fiscal da carga"
          render={({ field, id }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              id={id}
              maxLength={FIELD_LIMITS.purchase.invoiceNumber}
            />
          )}
        />
      </FieldRow>

      <div className="space-y-2">
        <h3 className="text-sm font-medium uppercase text-muted-foreground">
          Manejos em cada animal
        </h3>
        {/* O editor de manejos só lê e escreve "steps", que tem o mesmo formato aqui
            e no planejamento de uma sessão de manejo. */}
        <StepsEditor
          control={control as unknown as Control<PlanFormData>}
          options={options}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Iniciar recepção
        </Button>
      </DialogFooter>
    </form>
  );
}
