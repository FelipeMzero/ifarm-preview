import { useEffect, useRef, useState, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  Popup,
  useMap,
  Polygon,
} from "react-leaflet";
import { polygon as turfPolygon } from "@turf/helpers";
import turfArea from "@turf/area";
import { toast } from "sonner";
import {
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Info,
  AlertTriangle,
  Landmark,
  Globe,
  Map as MapIcon,
  LocateFixed,
  Boxes,
  Clock,
  Hourglass,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { cn } from "@/lib/utils";

import "@geoman-io/leaflet-geoman-free";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentProperty } from "@/features/shell/useCurrentProperty";
import { geocodeQuery } from "@/features/address/queries";
import { batchKeys } from "@/features/batch/queries";
import { propertyDetailQuery } from "@/features/property/queries";
import { ErrorPage } from "@/components/our/ErrorPage";
import { applyServerErrors } from "@/lib/form-errors";
import { areaSchema, type AreaPayload } from "@ifarm/shared";
import { areaClient } from "@/lib/clients";
import {
  AreaOccupiedError,
  type AreaRow,
  type AreaStatus,
} from "@ifarm/shared";
import { areaKeys, areaListQuery, browserLocationQuery } from "./queries";
import { AreaForm } from "./AreaForm";
import { AreaDetails } from "./AreaDetails";
import {
  AREA_STATUS_FILL_OPACITY,
  AREA_STATUS_LABELS,
  AREA_STATUS_PATH_CLASS,
  AREA_STATUS_SWATCH,
  OccupancySummary,
  restStateLabel,
  rotationDaysLabel,
} from "./occupancy";

const markerIconDefault = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = markerIconDefault;

if (typeof window !== "undefined" && L && L.Layer) {
  type LayerMethod = (
    this: Record<string, unknown>,
    ...args: unknown[]
  ) => unknown;
  const layerProto = L.Layer.prototype as unknown as Record<
    string,
    LayerMethod
  >;
  const patchLayerMethod = (methodName: string, checkProp: string) => {
    const orig = layerProto[methodName];
    if (orig) {
      layerProto[methodName] = function (
        this: Record<string, unknown>,
        ...args: unknown[]
      ) {
        if (
          !this[checkProp] &&
          !(args[0] instanceof L.Tooltip) &&
          !(args[0] instanceof L.Popup)
        ) {
          return this;
        }
        try {
          return orig.apply(this, args);
        } catch {
          return this;
        }
      };
    }
  };

  patchLayerMethod("openTooltip", "_tooltip");
  patchLayerMethod("closeTooltip", "_tooltip");
  patchLayerMethod("toggleTooltip", "_tooltip");
  patchLayerMethod("unbindTooltip", "_tooltip");

  patchLayerMethod("openPopup", "_popup");
  patchLayerMethod("closePopup", "_popup");
  patchLayerMethod("togglePopup", "_popup");
  patchLayerMethod("unbindPopup", "_popup");
}

const invisibleIcon = L.divIcon({
  className: "bg-transparent border-none",
  html: "",
  iconSize: [0, 0],
});

function calculateAreaHectares(points: { lat: number; lng: number }[]): number {
  if (points.length < 3) return 0;
  try {
    const coords = points.map((p) => [p.lng, p.lat]);

    if (
      coords[0][0] !== coords[coords.length - 1][0] ||
      coords[0][1] !== coords[coords.length - 1][1]
    ) {
      coords.push([coords[0][0], coords[0][1]]);
    }
    const poly = turfPolygon([coords]);
    const areaSqMeters = turfArea(poly);
    return areaSqMeters / 10000;
  } catch (error) {
    console.error("Erro ao calcular área:", error);
    return 0;
  }
}

function getCentroid(points: { lat: number; lng: number }[]): [number, number] {
  if (points.length === 0) return [0, 0];
  let sumLat = 0;
  let sumLng = 0;
  points.forEach((p) => {
    sumLat += p.lat;
    sumLng += p.lng;
  });
  return [sumLat / points.length, sumLng / points.length];
}

function MapTileLoadingOverlay() {
  const map = useMap();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!map) return;

    let timer: NodeJS.Timeout;

    const stopLoading = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsLoading(false);
      }, 150);
    };

    const startLoading = () => {
      setIsLoading(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsLoading(false);
      }, 800);
    };

    map.on("dataloading tileloadstart", startLoading);
    map.on("dataload tileload tileerror dataerror unload", stopLoading);

    return () => {
      clearTimeout(timer);
      map.off("dataloading tileloadstart", startLoading);
      map.off("dataload tileload tileerror dataerror unload", stopLoading);
    };
  }, [map]);

  if (!isLoading) return null;

  return (
    <div>
      <div>
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-xs font-medium">Carregando mapa...</span>
      </div>
    </div>
  );
}

const DEFAULT_MAP_CENTER: [number, number] = [-14.235, -51.925];
const DEFAULT_MAP_ZOOM = 4;

function MapBoundsController({
  areas,
  fallbackCoords,
  locating,
}: {
  areas: AreaRow[];
  fallbackCoords: [number, number] | null;
  locating: boolean;
}) {
  const map = useMap();
  const fittedRef = useRef(false);

  useEffect(() => {
    if (!map) return;

    const allPoints: [number, number][] = [];
    areas.forEach((area) => {
      const rawPoints = area.polygon as { lat: number; lng: number }[];
      if (Array.isArray(rawPoints)) {
        rawPoints.forEach((pt) => {
          if (pt && typeof pt.lat === "number" && typeof pt.lng === "number") {
            allPoints.push([pt.lat, pt.lng]);
          }
        });
      }
    });

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 16,
          animate: true,
        });
        fittedRef.current = true;
        return;
      }
    }

    // Áreas reais (acima) sempre têm prioridade e nunca ficam travadas; os fallbacks abaixo
    // só centralizam uma vez por montagem, pra não "puxar" o mapa se o usuário já navegou.
    if (fittedRef.current) return;

    if (fallbackCoords) {
      map.setView(fallbackCoords, 16, { animate: true });
      fittedRef.current = true;
      return;
    }

    // Sem áreas nem localização (nem da propriedade, nem do navegador): só assume o centro
    // padrão depois que a busca de localização terminar, para não "piscar" antes de resolver.
    if (!locating) {
      map.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, { animate: true });
      fittedRef.current = true;
    }
  }, [map, areas, fallbackCoords, locating]);

  return null;
}

function MapZoomController({ mapMode }: { mapMode: "padrao" | "satelite" }) {
  const map = useMap();
  const maxZoom = mapMode === "padrao" ? 19 : 16;

  useEffect(() => {
    map.setMaxZoom(maxZoom);
    if (map.getZoom() > maxZoom) {
      map.setZoom(maxZoom);
    }
  }, [map, maxZoom]);

  return null;
}

function MapReferenceController({
  onMapReady,
}: {
  onMapReady: (map: L.Map) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (map) onMapReady(map);
  }, [map, onMapReady]);

  useEffect(() => {
    if (!map) return;

    const container = map.getContainer();
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [map]);

  return null;
}

type GeomanControllerProps = {
  isDrawing: boolean;
  isEditingSingle: boolean;
  onPolygonCreated: (layer: L.Polygon) => void;
  onPolygonChange: (points: { lat: number; lng: number }[]) => void;
  onCancelEditing: () => void;
};

function GeomanController({
  isDrawing,
  isEditingSingle,
  onPolygonCreated,
  onPolygonChange,
  onCancelEditing,
}: GeomanControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.pm.setLang("pt_br");
  }, [map]);

  const activeMode = isDrawing || isEditingSingle;

  useEffect(() => {
    if (!map || !activeMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (isDrawing) {
          map.pm.disableDraw();
        }
        onCancelEditing();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [map, activeMode, isDrawing, onCancelEditing]);

  useEffect(() => {
    if (!map || !isDrawing) return;

    map.pm.enableDraw("Polygon", {
      snappable: true,
      snapDistance: 20,
      allowSelfIntersection: false,
      templineStyle: { color: "hsl(0, 0%, 50%)" },
      hintlineStyle: { color: "hsl(0, 0%, 50%)", dashArray: [5, 5] },
    });

    const handleCreate: L.PM.CreateEventHandler = (e) => {
      const layer = e.layer as L.Polygon;
      onPolygonCreated(layer);

      const points = extractPointsFromLayer(layer);
      if (points.length > 0) {
        onPolygonChange(points);
      }

      if (layer.pm && typeof layer.pm.enable === "function") {
        layer.pm.enable({
          allowSelfIntersection: false,
          snappable: true,
        });
      }

      const handleEdit = () => {
        const editedPoints = extractPointsFromLayer(layer);
        if (editedPoints.length > 0) {
          onPolygonChange(editedPoints);
        }
      };

      layer.on(
        "pm:edit pm:markerdragend pm:vertexchange pm:dragend pm:remove",
        handleEdit,
      );
    };

    map.on("pm:create", handleCreate);

    return () => {
      map.pm.disableDraw();
      map.off("pm:create", handleCreate);
    };
  }, [map, isDrawing, onPolygonCreated, onPolygonChange]);

  return null;
}

function isLatLng(pt: unknown): pt is L.LatLngLiteral {
  return (
    typeof pt === "object" &&
    pt !== null &&
    typeof (pt as L.LatLngLiteral).lat === "number" &&
    typeof (pt as L.LatLngLiteral).lng === "number"
  );
}

function extractPointsFromLayer(
  layer: L.Polygon,
): { lat: number; lng: number }[] {
  try {
    let latlngs: unknown = layer.getLatLngs();
    while (
      Array.isArray(latlngs) &&
      latlngs.length > 0 &&
      Array.isArray(latlngs[0])
    ) {
      latlngs = latlngs[0];
    }
    if (!Array.isArray(latlngs)) return [];
    return latlngs.filter(isLatLng).map((pt) => ({ lat: pt.lat, lng: pt.lng }));
  } catch {
    return [];
  }
}

type EditablePolygonProps = {
  area: AreaRow;
  isEditing: boolean;
  editingPoints?: { lat: number; lng: number }[];
  onPolygonChange: (points: { lat: number; lng: number }[]) => void;
  children?: React.ReactNode;
};

function EditablePolygon({
  area,
  isEditing,
  editingPoints,
  onPolygonChange,
  children,
}: EditablePolygonProps) {
  const [leafletLayer, setLeafletLayer] = useState<L.Polygon | null>(null);

  const activeEditing = isEditing;

  const rawCoords =
    isEditing && editingPoints && editingPoints.length > 0
      ? editingPoints
      : (area.polygon as { lat: number; lng: number }[]);

  const positions: [number, number][] = rawCoords.map((p) => [p.lat, p.lng]);

  const refCallback = useCallback((el: L.Polygon | null) => {
    setLeafletLayer(el);
  }, []);

  useEffect(() => {
    if (!leafletLayer) return;

    let timer: NodeJS.Timeout;
    let cancelled = false;

    const setupGeoman = () => {
      if (cancelled) return;

      // _map (interno do Leaflet) só existe depois que a camada entra no mapa.
      if (!(leafletLayer as unknown as { _map?: L.Map })._map) {
        timer = setTimeout(setupGeoman, 50);
        return;
      }

      const pm = leafletLayer.pm;
      if (!pm) return;

      if (activeEditing) {
        if (typeof pm.enable === "function" && !pm.enabled()) {
          pm.enable({
            allowSelfIntersection: false,
            snappable: true,
          });
        }
      } else {
        if (typeof pm.disable === "function" && pm.enabled()) {
          pm.disable();
        }
      }
    };

    setupGeoman();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [leafletLayer, activeEditing]);

  useEffect(() => {
    if (!leafletLayer || !activeEditing) return;

    const handleEdit = () => {
      const points = extractPointsFromLayer(leafletLayer);
      if (points.length > 0) {
        onPolygonChange(points);
      }
    };

    leafletLayer.on("pm:markerdragend", handleEdit);
    leafletLayer.on("pm:vertexchange", handleEdit);
    leafletLayer.on("pm:edit", handleEdit);
    leafletLayer.on("pm:remove", handleEdit);

    return () => {
      leafletLayer.off("pm:markerdragend", handleEdit);
      leafletLayer.off("pm:vertexchange", handleEdit);
      leafletLayer.off("pm:edit", handleEdit);
      leafletLayer.off("pm:remove", handleEdit);
    };
  }, [leafletLayer, activeEditing, onPolygonChange, area.id]);

  // A cor indica a situação da área (ocupada, livre, lotação excedida). O Leaflet só
  // aplica className na criação, por isso o componente é remontado (key) quando a
  // situação ou o modo de edição mudam.
  const status = area.status;
  // Áreas sem lote (livres, descansadas, inativas) têm contorno tracejado.
  const isOpen = !area.occupancy;

  return (
    <Polygon
      ref={refCallback}
      positions={positions}
      pathOptions={
        activeEditing
          ? {
              color: "#f59e0b",
              fillColor: "#f59e0b",
              fillOpacity: 0.4,
              weight: 3,
              dashArray: "6, 6",
            }
          : {
              className: AREA_STATUS_PATH_CLASS[status],
              fillOpacity: AREA_STATUS_FILL_OPACITY[status],
              weight: 2,
              dashArray: isOpen ? "6, 6" : undefined,
            }
      }
    >
      {children}
    </Polygon>
  );
}

export function AreaMap() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { property: currentProperty, isLoading: isPropertyLoading } =
    useCurrentProperty();
  const currentPropertyId = currentProperty?.id;

  // Filtro de situação na URL (?situacao=inativas; sem ele, as ativas).
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter: "active" | "inactive" =
    searchParams.get("situacao") === "inativas" ? "inactive" : "active";
  function setStatusFilter(status: "active" | "inactive") {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (status === "inactive") next.set("situacao", "inativas");
        else next.delete("situacao");
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  }
  const [mapMode, setMapMode] = useState<"padrao" | "satelite">("padrao");

  // Áreas da propriedade atual. A chave inclui a propriedade: ao trocar, as da anterior não
  // aparecem enquanto as novas carregam.
  const {
    data: areasResult,
    isPending: isAreasPending,
    refetch: refetchAreas,
  } = useQuery({
    ...areaListQuery({ propertyId: currentPropertyId, status: statusFilter }),
    enabled: !!currentPropertyId,
  });
  const areas: AreaRow[] = areasResult?.data ?? [];

  // Onde centralizar o mapa quando não há áreas: as coordenadas da propriedade; sem elas, as
  // do endereço (geocodificação); sem endereço, a localização do navegador.
  const { data: propertyDetails, isPending: isDetailsPending } = useQuery({
    ...propertyDetailQuery(currentPropertyId ?? ""),
    enabled: !!currentPropertyId,
  });
  const ownCoords: [number, number] | null =
    propertyDetails?.latitude && propertyDetails.longitude
      ? [Number(propertyDetails.latitude), Number(propertyDetails.longitude)]
      : null;
  const needsGeocode = !!propertyDetails && !ownCoords;
  const { data: geocoded, isPending: isGeocodePending } = useQuery({
    ...geocodeQuery({
      zipCode: propertyDetails?.zipCode,
      city: propertyDetails?.city,
      state: propertyDetails?.state,
    }),
    enabled: needsGeocode,
  });
  const propertyCoords: [number, number] | null =
    ownCoords ?? (geocoded ? [geocoded.latitude, geocoded.longitude] : null);
  const addressSettled =
    !!currentPropertyId &&
    !isDetailsPending &&
    (!needsGeocode || !isGeocodePending);
  const needsBrowserLocation = addressSettled && !propertyCoords;
  const { data: browserCoords, isPending: isBrowserPending } = useQuery({
    ...browserLocationQuery,
    enabled: needsBrowserLocation,
  });
  const locatingProperty =
    !!currentPropertyId &&
    (!addressSettled || (needsBrowserLocation && isBrowserPending));

  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [mapAreaEl, setMapAreaEl] = useState<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnLayer, setDrawnLayer] = useState<L.Polygon | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<
    { lat: number; lng: number }[]
  >([]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaRow | null>(null);
  const [detailsArea, setDetailsArea] = useState<AreaRow | null>(null);
  const [deletingAreaId, setDeletingAreaId] = useState<string | null>(null);
  // Área que não pôde ser desativada por ter um lote.
  const [occupiedArea, setOccupiedArea] = useState<{
    name: string;
    batch: { id: string; name: string };
  } | null>(null);

  const form = useForm<AreaPayload>({
    resolver: zodResolver(areaSchema, undefined, { raw: true }),
    defaultValues: {
      name: "",
      polygon: null,
      hectares: "",
      stockingRate: "",
      defaultOccupationDays: "",
      defaultRestDays: "",
      notes: "",
      propertyId: "",
    },
  });

  useEffect(() => {
    if (currentProperty) {
      form.setValue("propertyId", currentProperty.id);
    }
  }, [currentProperty, form]);

  const handlePolygonCreated = useCallback((layer: L.Polygon) => {
    setDrawnLayer(layer);
    setIsDrawing(false);
  }, []);

  const handlePolygonChange = useCallback(
    (points: { lat: number; lng: number }[]) => {
      setPolygonPoints(points);
      form.setValue("polygon", points, { shouldValidate: true });

      const hasEnoughPoints = points.length >= 3;
      if (hasEnoughPoints) {
        const hectaresVal = calculateAreaHectares(points);
        form.setValue("hectares", hectaresVal.toFixed(2), {
          shouldValidate: true,
        });
      } else {
        form.setValue("hectares", "");
      }

      setSheetOpen(true);
    },
    [form],
  );

  const handleCleanup = useCallback(() => {
    setIsDrawing(false);
    setSheetOpen(false);
    if (drawnLayer) {
      drawnLayer.remove();
      setDrawnLayer(null);
    }
    setPolygonPoints([]);
    setEditingArea(null);
    form.reset({
      name: "",
      polygon: null,
      hectares: "",
      stockingRate: "",
      defaultOccupationDays: "",
      defaultRestDays: "",
      notes: "",
      propertyId: currentProperty?.id ?? "",
    });
  }, [drawnLayer, form, currentProperty?.id]);

  const startDrawing = () => {
    if (!currentProperty) {
      toast.warning("Selecione uma propriedade para adicionar áreas.");
      return;
    }
    handleCleanup();
    setIsDrawing(true);
  };

  const startEditing = (area: AreaRow) => {
    setIsDrawing(false);
    if (drawnLayer) {
      drawnLayer.remove();
      setDrawnLayer(null);
    }

    if (mapInstance) {
      mapInstance.closePopup();
    }

    const pts = area.polygon as { lat: number; lng: number }[];
    setEditingArea(area);
    setPolygonPoints(pts);

    if (mapInstance && Array.isArray(pts) && pts.length > 0) {
      const latLngs = pts.map((p) => [p.lat, p.lng] as [number, number]);
      const bounds = L.latLngBounds(latLngs);
      if (bounds.isValid()) {
        mapInstance.fitBounds(bounds, {
          padding: [80, 80],
          maxZoom: 16,
          animate: true,
        });
      }
    }

    form.reset({
      name: area.name,
      polygon: area.polygon,
      hectares: String(area.hectares),
      stockingRate: String(area.stockingRate),
      defaultOccupationDays: area.defaultOccupationDays?.toString() ?? "",
      defaultRestDays: area.defaultRestDays?.toString() ?? "",
      notes: area.notes ?? "",
      propertyId: area.propertyId,
    });

    setSheetOpen(true);
  };

  // Mudar uma área também muda as áreas livres oferecidas aos lotes.
  const reloadAreas = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: areaKeys.all }),
      queryClient.invalidateQueries({ queryKey: batchKeys.all }),
    ]);

  const save = useMutation({
    mutationFn: (data: AreaPayload) =>
      editingArea
        ? areaClient.updateArea(editingArea.id, data)
        : areaClient.createArea(data),
    onSuccess: reloadAreas,
  });

  const onSubmit = async (data: AreaPayload) => {
    try {
      await save.mutateAsync(data);
      toast.success(
        editingArea
          ? "Registro atualizado com sucesso!"
          : "Registro salvo com sucesso!",
      );
      setSheetOpen(false);
      handleCleanup();
    } catch (err) {
      applyServerErrors(form.setError, err);
    }
  };

  const handleDeleteArea = (id: string) => {
    setDetailsArea(null);
    setDeletingAreaId(id);
  };

  const deleteArea = useMutation({
    mutationFn: (id: string) => areaClient.deleteArea(id),
    onSuccess: () => {
      toast.success("Registro excluído com sucesso!");
      return reloadAreas();
    },
    onError: (err) => {
      toast.error(
        err.message ||
          "Este registro já possui vínculos e não pode ser excluído.",
      );
    },
  });

  const confirmDelete = () => {
    if (deletingAreaId) deleteArea.mutate(deletingAreaId);
    setDeletingAreaId(null);
    setDetailsArea(null);
  };

  const toggleStatus = useMutation({
    mutationFn: (area: AreaRow) => areaClient.toggleAreaStatus(area.id),
    onSuccess: () => {
      toast.success(
        statusFilter === "active"
          ? "Área desativada com sucesso!"
          : "Área ativada com sucesso!",
      );
      return reloadAreas();
    },
    // Ocupada desde a última leitura: explica, oferece mover o lote e atualiza o mapa.
    onError: (err, area) => {
      if (err instanceof AreaOccupiedError) {
        mapInstance?.closePopup();
        setOccupiedArea({ name: area.name, batch: err.batch });
        reloadAreas();
        return;
      }
      toast.error(err.message || "Erro ao alterar o status do registro.");
    },
  });

  const handleToggleStatus = (area: AreaRow) => {
    // Área ocupada não pode ser desativada: explica e oferece mover o lote.
    if (!area.closedAt && area.occupancy) {
      mapInstance?.closePopup();
      setOccupiedArea({ name: area.name, batch: area.occupancy.batch });
      return;
    }
    toggleStatus.mutate(area);
  };

  const calculatedHectares = calculateAreaHectares(polygonPoints);
  const hectaresInput = useWatch({ control: form.control, name: "hectares" });
  const parsedHectaresInput = parseFloat(String(hectaresInput));

  let hectaresWarning: string | null = null;
  if (!isNaN(parsedHectaresInput) && calculatedHectares > 0) {
    const diffPct =
      Math.abs(parsedHectaresInput - calculatedHectares) / calculatedHectares;
    if (diffPct > 0.25) {
      hectaresWarning =
        "O valor informado está bem diferente da área desenhada no mapa";
    }
  }

  // Calcula centro inicial baseado nas áreas cadastradas se houverem
  const allAreaPoints = areas.flatMap((a) =>
    Array.isArray(a.polygon)
      ? (a.polygon as { lat: number; lng: number }[])
      : [],
  );
  const areasCentroid =
    allAreaPoints.length > 0 ? getCentroid(allAreaPoints) : null;

  const fallbackCoords = propertyCoords ?? browserCoords ?? null;
  const center: [number, number] =
    areasCentroid ?? fallbackCoords ?? DEFAULT_MAP_CENTER;
  const zoom = areasCentroid || fallbackCoords ? 15 : DEFAULT_MAP_ZOOM;

  const handleRecenterMap = () => {
    if (!mapInstance) return;

    if (allAreaPoints.length > 0) {
      const bounds = L.latLngBounds(
        allAreaPoints.map((p) => [p.lat, p.lng] as [number, number]),
      );
      if (bounds.isValid()) {
        mapInstance.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 16,
          animate: true,
        });
        return;
      }
    }

    mapInstance.setView(
      fallbackCoords ?? DEFAULT_MAP_CENTER,
      fallbackCoords ? 16 : DEFAULT_MAP_ZOOM,
      {
        animate: true,
      },
    );
  };

  if (isPropertyLoading || (currentPropertyId && isAreasPending)) {
    return (
      <div className="flex h-full items-center justify-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">
          Carregando áreas de pastagem...
        </span>
      </div>
    );
  }

  if (currentPropertyId && !areasResult) {
    return (
      <ErrorPage
        message="Não foi possível carregar as áreas de pastagem."
        onRetry={() => refetchAreas()}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-4 border-b border-border bg-background/95 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Mapa de Áreas de Pastagem
          </h1>
          <p className="text-sm text-muted-foreground">
            {currentProperty
              ? `Propriedade: ${currentProperty.name}`
              : "Selecione uma propriedade na sidebar"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            title="Centralizar na localização da propriedade"
            disabled={!currentProperty || !mapInstance}
            onClick={handleRecenterMap}
          >
            <LocateFixed className="size-4" />
          </Button>

          <div className="w-40">
            <Select
              value={mapMode}
              onValueChange={(val) => setMapMode(val as "padrao" | "satelite")}
            >
              <SelectTrigger className="gap-2">
                {mapMode === "padrao" ? (
                  <MapIcon className="size-4 text-primary" />
                ) : (
                  <Globe className="size-4 text-primary" />
                )}
                <SelectValue placeholder="Tipo de Mapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="padrao">Padrão</SelectItem>
                <SelectItem value="satelite">Satélite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isDrawing && (
            <div className="w-45">
              <Select
                value={statusFilter}
                onValueChange={(val) =>
                  setStatusFilter(val as "active" | "inactive")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtro de Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Áreas Ativas</SelectItem>
                  <SelectItem value="inactive">Áreas Inativas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {statusFilter === "active" && !isDrawing && (
            <Button onClick={startDrawing} className="gap-2 w-40">
              <Plus className="size-4" /> Área
            </Button>
          )}

          {isDrawing && (
            <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning-foreground">
              <AlertTriangle className="size-4 text-warning shrink-0" />
              <span>Desenhe o contorno da área no mapa </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCleanup}
                className="h-7 text-xs px-2 hover:bg-warning/20"
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </div>

      <div
        ref={setMapAreaEl}
        className="relative min-h-0 flex-1 overflow-hidden will-change-transform"
      >
        {currentProperty ? (
          <>
            <MapContainer
              key={`${currentProperty.id}-${statusFilter}`}
              center={center}
              zoom={zoom}
              maxZoom={19}
              scrollWheelZoom
              className="h-full w-full z-0"
            >
              <MapTileLoadingOverlay />
              <MapReferenceController onMapReady={setMapInstance} />
              <MapBoundsController
                areas={areas}
                fallbackCoords={fallbackCoords}
                locating={locatingProperty}
              />
              <MapZoomController mapMode={mapMode} />

              <TileLayer
                key={mapMode}
                attribution={
                  mapMode === "padrao"
                    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    : 'Tiles &copy; <a href="https://www.esri.com/">Esri</a>'
                }
                url={
                  mapMode === "padrao"
                    ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                }
                maxNativeZoom={mapMode === "padrao" ? 19 : 16}
                maxZoom={19}
              />

              <GeomanController
                isDrawing={isDrawing}
                isEditingSingle={sheetOpen}
                onPolygonCreated={handlePolygonCreated}
                onPolygonChange={handlePolygonChange}
                onCancelEditing={handleCleanup}
              />

              {areas.map((area) => {
                const rawPoints = area.polygon as {
                  lat: number;
                  lng: number;
                }[];
                const centroid = getCentroid(rawPoints);
                const isSelectedForEdit = editingArea?.id === area.id;

                return (
                  <div key={area.id}>
                    <EditablePolygon
                      key={`${area.status}-${isSelectedForEdit}`}
                      area={area}
                      isEditing={isSelectedForEdit}
                      editingPoints={
                        isSelectedForEdit ? polygonPoints : undefined
                      }
                      onPolygonChange={handlePolygonChange}
                    >
                      {/* {!isSelectedForEdit && (
                      <Tooltip sticky>
                        <div className="p-1 text-xs space-y-0.5">
                          <p className="font-semibold text-sm border-b pb-0.5 mb-1">{area.name}</p>
                          <p><strong>Hectares:</strong> {area.hectares} ha</p>
                          <p><strong>Taxa de Lotação:</strong> {area.stockingRate} UA/ha</p>
                          <p><strong>Observação:</strong> {area.notes || "Nenhuma"}</p>
                        </div>
                      </Tooltip>
                    )} */}

                      {!isSelectedForEdit && (
                        <Popup>
                          <div className="min-w-40 p-1 text-foreground ">
                            <h4 className="font-semibold text-sm border-b border-border pb-1 mb-2">
                              {area.name}
                            </h4>
                            <OccupancySummary area={area} className="mb-2" />
                            <div className="flex flex-col gap-1.5">
                              {area.occupancy && (
                                <Button
                                  size="sm"
                                  className="h-8 justify-start text-xs font-normal"
                                  onClick={() =>
                                    navigate(
                                      `/lotes/${area.occupancy!.batch.id}/detalhes`,
                                    )
                                  }
                                >
                                  <Boxes className="size-3.5 mr-2 text-muted-foreground" />{" "}
                                  Ver lote
                                </Button>
                              )}
                              {statusFilter === "active" ? (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-8 justify-start text-xs font-normal"
                                    onClick={() => startEditing(area)}
                                  >
                                    <Pencil className="size-3.5 mr-2 text-muted-foreground" />{" "}
                                    Editar
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-8 justify-start text-xs font-normal"
                                    onClick={() => setDetailsArea(area)}
                                  >
                                    <Info className="size-3.5 mr-2 text-muted-foreground" />{" "}
                                    Detalhes
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-8 justify-start text-xs font-normal text-muted-foreground hover:bg-accent"
                                    onClick={() => handleToggleStatus(area)}
                                  >
                                    <EyeOff className="size-3.5 mr-2" />{" "}
                                    Desativar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-8 justify-start text-xs font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteArea(area.id)}
                                  >
                                    <Trash2 className="size-3.5 mr-2" /> Excluir
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 justify-start text-xs font-normal"
                                    onClick={() => handleToggleStatus(area)}
                                  >
                                    <Eye className="size-3.5 mr-2 text-muted-foreground" />{" "}
                                    Reativar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 justify-start text-xs font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteArea(area.id)}
                                  >
                                    <Trash2 className="size-3.5 mr-2" /> Excluir
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </Popup>
                      )}
                    </EditablePolygon>

                    {!isSelectedForEdit && rawPoints.length > 0 && (
                      <Marker position={centroid} icon={invisibleIcon}>
                        <Tooltip
                          permanent
                          direction="center"
                          className="bg-transparent border-none shadow-none font-bold text-foreground drop-shadow-[0_1.5px_1.5px_rgba(255,255,255,0.85)] dark:drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.855)] text-xs select-none"
                        >
                          <div className="text-center leading-tight">
                            <div>{area.name}</div>
                            {!area.closedAt &&
                              (() => {
                                const rotation = area.rotation;
                                const days = rotationDaysLabel(rotation);
                                const overdue =
                                  rotation?.kind === "occupation" &&
                                  rotation.overdue;
                                const DaysIcon = area.occupancy
                                  ? Clock
                                  : Hourglass;
                                return (
                                  <>
                                    <div className="max-w-20 truncate text-[10px] font-normal text-muted-foreground">
                                      {area.occupancy?.batch.name ??
                                        restStateLabel(rotation)}
                                    </div>
                                    {days && (
                                      <div
                                        className={cn(
                                          "flex items-center justify-center gap-0.5 text-[10px]",
                                          overdue
                                            ? "font-bold text-destructive"
                                            : "font-normal text-muted-foreground",
                                        )}
                                      >
                                        <DaysIcon className="size-2.5" />
                                        {days}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                          </div>
                        </Tooltip>
                      </Marker>
                    )}
                  </div>
                );
              })}
            </MapContainer>
            {statusFilter === "active" && areas.length > 0 && (
              <div className="pointer-events-none absolute bottom-6 left-3 z-1000 space-y-1 rounded-md border border-border bg-background/90 px-3 py-2 text-xs shadow-sm">
                {(
                  [
                    "occupied",
                    "near",
                    "exceeded",
                    "free",
                    "ready",
                  ] as AreaStatus[]
                ).map((status) => (
                  <div key={status} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "size-3 rounded-sm border-2",
                        AREA_STATUS_SWATCH[status],
                      )}
                    />
                    {AREA_STATUS_LABELS[status]}
                  </div>
                ))}
              </div>
            )}
            {locatingProperty && !areasCentroid && !fallbackCoords && (
              <div className="pointer-events-none absolute inset-0 z-1000 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-sm">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Localizando propriedade...
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-muted/30 p-8 text-center">
            <Landmark className="h-12 w-12 text-muted-foreground/60" />
            <h3 className="text-lg font-semibold">
              Nenhuma Propriedade Selecionada
            </h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Selecione uma propriedade no menu suspenso no topo da barra
              lateral para visualizar e gerenciar suas áreas de pastagem.
            </p>
          </div>
        )}
      </div>

      <AreaForm
        container={mapAreaEl}
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCleanup();
            setSheetOpen(false);
          }
        }}
        editingArea={editingArea}
        form={form}
        onSubmit={onSubmit}
        onCancel={() => {
          setSheetOpen(false);
          handleCleanup();
        }}
        hectaresWarning={hectaresWarning}
        polygonPointsCount={polygonPoints.length}
        calculatedHectares={calculatedHectares}
      />

      <AreaDetails
        area={detailsArea}
        open={!!detailsArea}
        onOpenChange={(open) => !open && setDetailsArea(null)}
        onDelete={handleDeleteArea}
      />

      <AlertDialog
        open={occupiedArea !== null}
        onOpenChange={(open) => !open && setOccupiedArea(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>A área está ocupada</AlertDialogTitle>
            <AlertDialogDescription>
              {occupiedArea
                ? `A área "${occupiedArea.name}" está ocupada pelo lote "${occupiedArea.batch.name}". Mova o lote para outra área e depois desative esta.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="border-border">
            <AlertDialogCancel variant="secondary">Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                occupiedArea && navigate(`/lotes/${occupiedArea.batch.id}`)
              }
            >
              Trocar área
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmDialog
        open={deletingAreaId !== null}
        onOpenChange={(open) => !open && setDeletingAreaId(null)}
        onConfirm={confirmDelete}
        title="Excluir Área de Pastagem"
        description="Tem certeza que deseja excluir esta área de pastagem? Esta ação não poderá ser desfeita."
      />
    </div>
  );
}
