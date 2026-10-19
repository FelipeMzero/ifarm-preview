"use client";

import { useState } from "react";
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

type Documents = { gtaNumber: string | null; invoiceNumber: string | null };

// GTA e nota fiscal da carga: chegam com o caminhão e podem ser informados ou corrigidos
// enquanto a recepção está aberta.
export function ReceptionDocumentsDialog({
  sessionId,
  initial,
  open,
  onOpenChange,
  onSaved,
}: {
  sessionId: string;
  initial: Documents;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
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
            onCancel={() => onOpenChange(false)}
            onSaved={() => {
              onOpenChange(false);
              onSaved();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DocumentsForm({
  sessionId,
  initial,
  onCancel,
  onSaved,
}: {
  sessionId: string;
  initial: Documents;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [gta, setGta] = useState(initial.gtaNumber ?? "");
  const [invoice, setInvoice] = useState(initial.invoiceNumber ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await receptionClient.updateReceptionDocuments(sessionId, {
        gtaNumber: gta || null,
        invoiceNumber: invoice || null,
      });
      toast.success("Documentos da carga salvos.");
      onSaved();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
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
        <Button type="button" variant="secondary" onClick={onCancel}>
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
