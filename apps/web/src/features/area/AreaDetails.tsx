"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AreaRow } from "./services";

interface AreaDetailsProps {
  area: AreaRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
}

export function AreaDetails({
  area,
  open,
  onOpenChange,
  onDelete,
}: AreaDetailsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes da Área de Pastagem</DialogTitle>
        </DialogHeader>

        {area && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4 border-b pb-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">NOME</span>
                <span className="font-semibold">{area.name}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">STATUS</span>
                <span className="font-semibold">
                  {area.deactivatedAt ? "Inativa" : "Ativa"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b pb-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">ÁREA</span>
                <span>{area.hectares} ha</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">TAXA DE LOTAÇÃO</span>
                <span>{area.stockingRate} UA/ha</span>
              </div>
            </div>

            <div className="text-sm">
              <span className="text-xs text-muted-foreground block">OBSERVAÇÃO</span>
              <p className="mt-1 text-muted-foreground italic">
                {area.notes || "Nenhuma observação cadastrada."}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex sm:justify-between items-center border-t pt-4">
          {area && (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 justify-start"
              onClick={() => onDelete(area.id)}
            >
              <Trash2 className="size-4 mr-2" /> Excluir Área
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
