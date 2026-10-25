import { MapPin, MapPinOff } from "lucide-react";
import { lazyComponent } from "@/lib/lazy";
import { cn } from "@/lib/utils";

// O mapa (Leaflet) é pesado: só é baixado quando há coordenadas para mostrar.
const LocationPickerMap = lazyComponent(
  () => import("./LocationPickerMap").then((m) => m.LocationPickerMap),
  {
    loading: () => (
      <div className="flex size-full items-center justify-center text-muted-foreground">
        Carregando mapa...
      </div>
    ),
  },
);

function isValidCoordinate(latitude: string, longitude: string) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

/** Miniatura do mapa com o ponto das coordenadas (texto, como vêm do formulário). */
export function LocationPreview({
  latitude,
  longitude,
  className,
  onDoubleClick,
}: {
  latitude: string;
  longitude: string;
  className?: string;
  onDoubleClick?: () => void;
}) {
  const hasInput = !!latitude || !!longitude;
  const isValid =
    !!latitude && !!longitude && isValidCoordinate(latitude, longitude);

  return (
    <div className={cn("flex min-h-0 min-w-0 flex-col gap-2", className)}>
      <div
        className="relative min-h-0 w-full flex-1 cursor-pointer overflow-hidden rounded-lg border border-input bg-input/40"
        onDoubleClick={onDoubleClick}
        title="Clique duas vezes para escolher no mapa"
      >
        {isValid ? (
          <LocationPickerMap
            latitude={Number(latitude)}
            longitude={Number(longitude)}
            onPick={() => {}}
            readOnly
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground">
            {hasInput ? (
              <>
                <MapPinOff className="size-5" />
                <span className="text-xs">Sem localização</span>
              </>
            ) : (
              <>
                <MapPin className="size-5 opacity-50" />
                <span className="text-xs">Informe a latitude e longitude</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
