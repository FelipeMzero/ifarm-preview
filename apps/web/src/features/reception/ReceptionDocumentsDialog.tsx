import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { FIELD_LIMITS } from "@ifarm/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { receptionClient } from "@/lib/clients";
import { useReloadReception } from "./queries";

type Documents = { gtaNumber: string | null; invoiceNumber: string | null };

// GTA e nota fiscal da carga: chegam com o caminhão e podem ser informados ou corrigidos
// enquanto a recepção está aberta.
export function ReceptionDocumentsDialog({
  sessionId,
  initial,
  open,
  onOpenChange,
}: {
  sessionId: string;
  initial: Documents;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Documentos da carga</DialogTitle>
          <DialogDescription>
            GTA e nota fiscal que acompanham os animais desta recepção.
          </DialogDescription>
        </DialogHeader>
        {/* Montado só com o diálogo aberto: cada abertura começa dos valores atuais. */}
        {open && (
          <DocumentsForm
            sessionId={sessionId}
            initial={initial}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DocumentsForm({
  sessionId,
  initial,
  onClose,
}: {
  sessionId: string;
  initial: Documents;
  onClose: () => void;
}) {
  const reloadReception = useReloadReception();
  const [gta, setGta] = useState(initial.gtaNumber ?? "");
  const [invoice, setInvoice] = useState(initial.invoiceNumber ?? "");

  // A recepção na tela (e as listas, que buscam pela GTA) é recarregada (cache).
  const save = useMutation({
    mutationFn: (documents: Documents) =>
      receptionClient.updateReceptionDocuments(sessionId, documents),
    onSuccess: () => {
      toast.success("Documentos da carga salvos.");
      onClose();
      return reloadReception();
    },
    onError: (error) => toast.error(error.message),
  });
  const saving = save.isPending;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    save.mutate({ gtaNumber: gta || null, invoiceNumber: invoice || null });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reception-gta">GTA</Label>
        <Input
          id="reception-gta"
          value={gta}
          maxLength={FIELD_LIMITS.purchase.gtaNumber}
          onChange={(e) => setGta(e.target.value)}
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reception-invoice">Nota fiscal</Label>
        <Input
          id="reception-invoice"
          value={invoice}
          maxLength={FIELD_LIMITS.purchase.invoiceNumber}
          onChange={(e) => setInvoice(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          Salvar
        </Button>
      </DialogFooter>
    </form>
  );
}
