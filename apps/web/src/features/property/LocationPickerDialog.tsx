import { useState } from "react";
import { lazyComponent } from "@/lib/lazy";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const LocationPickerMap = lazyComponent(() => import("./LocationPickerMap"), {
  loading: () => (
    <div className="flex size-full items-center justify-center text-muted-foreground">
      Carregando mapa...
    </div>
  ),
});

type LocationPickerBodyProps = {
  latitude: number | null;
  longitude: number | null;
  onConfirm: (lat: number, lon: number) => void;
  onCancel: () => void;
};

// Componente próprio só pra desmontar/remontar a cada abertura do dialog — assim o
// estado "picked" nasce sincronizado com lat/long atuais sem precisar de um efeito.
function LocationPickerBody({
  latitude,
  longitude,
  onConfirm,
  onCancel,
}: LocationPickerBodyProps) {
  const [picked, setPicked] = useState<{ lat: number; lon: number } | null>(
    latitude != null && longitude != null
      ? { lat: latitude, lon: longitude }
      : null,
  );

  return (
    <>
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border">
        <LocationPickerMap
          latitude={picked?.lat ?? null}
          longitude={picked?.lon ?? null}
          onPick={(lat: number, lon: number) => setPicked({ lat, lon })}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {picked
          ? `Latitude: ${picked.lat.toFixed(6)} — Longitude: ${picked.lon.toFixed(6)}`
          : "Clique no mapa para marcar a localização."}
      </p>

      <DialogFooter className="border-border">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={() => picked && onConfirm(picked.lat, picked.lon)}
          disabled={!picked}
        >
          <MapPin className="size-4" /> Confirmar
        </Button>
      </DialogFooter>
    </>
  );
}

type LocationPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  latitude: number | null;
  longitude: number | null;
  onConfirm: (lat: number, lon: number) => void;
};

export function LocationPickerDialog({
  open,
  onOpenChange,
  latitude,
  longitude,
  onConfirm,
}: LocationPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[80vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Selecionar localização</DialogTitle>
        </DialogHeader>

        {open && (
          <LocationPickerBody
            latitude={latitude}
            longitude={longitude}
            onCancel={() => onOpenChange(false)}
            onConfirm={(lat, lon) => {
              onConfirm(lat, lon);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
