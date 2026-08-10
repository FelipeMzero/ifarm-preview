"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Tooltip, Popup, useMap, Polygon } from "react-leaflet";
import { polygon as turfPolygon } from "@turf/helpers";
import turfArea from "@turf/area";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2, Eye, EyeOff, Info, AlertTriangle, Landmark, Globe, Map as MapIcon } from "lucide-react";

import "@geoman-io/leaflet-geoman-free";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentProperty } from "@/features/shell/CurrentPropertyProvider";
import { getProperty } from "@/features/property/services";
import { areaFormSchema, AreaFormData } from "./schema";
import { getAreas, createArea, updateArea, deleteArea, toggleAreaStatus, AreaRow, ApiError } from "./services";
import { AreaForm } from "./AreaForm";
import { AreaDetails } from "./AreaDetails";

const markerIconDefault = L.icon({
  iconUrl: markerIcon as unknown as string,
  iconRetinaUrl: markerIcon2x as unknown as string,
  shadowUrl: markerShadow as unknown as string,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = markerIconDefault;

if (typeof window !== "undefined" && L && L.Layer) {
  const patchLayerMethod = (methodName: string, checkProp: string) => {
    const orig = (L.Layer.prototype as any)[methodName];
    if (orig) {
      (L.Layer.prototype as any)[methodName] = function (this: any, ...args: any[]) {
        if (!this[checkProp] && !(args[0] instanceof L.Tooltip) && !(args[0] instanceof L.Popup)) {
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

function getDeterministicColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 75%, 45%)`;
}

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
    <div className="absolute inset-0 z-[500] flex items-center justify-center bg-background/30 backdrop-blur-[1px] pointer-events-none transition-all duration-200">
      <div className="flex items-center gap-2.5 rounded-lg border bg-card/95 px-3 py-2 shadow-md text-card-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-xs font-medium">Carregando mapa...</span>
      </div>
    </div>
  );
}


function MapBoundsController({
  areas,
  propertyCoords,
}: {
  areas: AreaRow[];
  propertyCoords: [number, number] | null;
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
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
        fittedRef.current = true;
        return;
      }
    }

    if (propertyCoords && !fittedRef.current) {
      map.setView(propertyCoords, 16, { animate: true });
      fittedRef.current = true;
    }
  }, [map, areas, propertyCoords]);

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

function MapReferenceController({ onMapReady }: { onMapReady: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    if (map) onMapReady(map);
  }, [map, onMapReady]);
  return null;
}

type GeomanControllerProps = {
  isDrawing: boolean;
  isGlobalEditing: boolean;
  isEditingSingle: boolean;
  onPolygonCreated: (layer: L.Polygon) => void;
  onPolygonChange: (points: { lat: number; lng: number }[]) => void;
  onCancelEditing: () => void;
};

function GeomanController({
  isDrawing,
  isGlobalEditing,
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

  const activeMode = isDrawing || isGlobalEditing || isEditingSingle;

  useEffect(() => {
    if (!map || !activeMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (isDrawing) {
          map.pm.disableDraw();
        }
        if (isGlobalEditing && map.pm && typeof map.pm.globalEditModeEnabled === "function" && map.pm.globalEditModeEnabled()) {
          map.pm.disableGlobalEditMode();
        }
        onCancelEditing();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [map, activeMode, isDrawing, isGlobalEditing, onCancelEditing]);

  useEffect(() => {
    if (!map || !isDrawing) return;

    map.pm.enableDraw("Polygon", {
      snappable: true,
      snapDistance: 20,
      allowSelfIntersection: false,
      templineStyle: { color: "hsl(0, 0%, 50%)" },
      hintlineStyle: { color: "hsl(0, 0%, 50%)", dashArray: [5, 5] },
    });

    const handleCreate = (e: any) => {
      const layer = e.layer as L.Polygon;
      onPolygonCreated(layer);

      const points = extractPointsFromLayer(layer);
      if (points.length > 0) {
        onPolygonChange(points);
      }

      if ((layer as any).pm && typeof (layer as any).pm.enable === "function") {
        (layer as any).pm.enable({ allowSelfIntersection: false, snappable: true });
      }

      const handleEdit = () => {
        const editedPoints = extractPointsFromLayer(layer);
        if (editedPoints.length > 0) {
          onPolygonChange(editedPoints);
        }
      };

      layer.on("pm:edit pm:markerdragend pm:vertexchange pm:dragend pm:remove", handleEdit);
    };

    map.on("pm:create", handleCreate);

    return () => {
      map.pm.disableDraw();
      map.off("pm:create", handleCreate);
    };
  }, [map, isDrawing, onPolygonCreated, onPolygonChange]);

  useEffect(() => {
    if (!map) return;

    if (isGlobalEditing) {
      map.pm.enableGlobalEditMode({
        allowSelfIntersection: false,
        snappable: true,
      });
    } else {
      if (map.pm && typeof map.pm.globalEditModeEnabled === "function" && map.pm.globalEditModeEnabled()) {
        map.pm.disableGlobalEditMode();
      }
    }

    return () => {
      if (map.pm && typeof map.pm.globalEditModeEnabled === "function" && map.pm.globalEditModeEnabled()) {
        map.pm.disableGlobalEditMode();
      }
    };
  }, [map, isGlobalEditing]);

  return null;
}

function extractPointsFromLayer(layer: L.Polygon): { lat: number; lng: number }[] {
  try {
    let latlngs: any = layer.getLatLngs();
    while (Array.isArray(latlngs) && latlngs.length > 0 && Array.isArray(latlngs[0])) {
      latlngs = latlngs[0];
    }
    if (!Array.isArray(latlngs)) return [];
    return latlngs
      .filter((pt: any) => pt && typeof pt.lat === "number" && typeof pt.lng === "number")
      .map((pt: any) => ({ lat: pt.lat, lng: pt.lng }));
  } catch {
    return [];
  }
}

type EditablePolygonProps = {
  area: AreaRow;
  isEditing: boolean;
  isGlobalEditing: boolean;
  editingPoints?: { lat: number; lng: number }[];
  onPolygonChange: (points: { lat: number; lng: number }[]) => void;
  onGlobalPolygonChange?: (areaId: string, points: { lat: number; lng: number }[]) => void;
  children?: React.ReactNode;
};

function EditablePolygon({
  area,
  isEditing,
  isGlobalEditing,
  editingPoints,
  onPolygonChange,
  onGlobalPolygonChange,
  children,
}: EditablePolygonProps) {
  const [leafletLayer, setLeafletLayer] = useState<L.Polygon | null>(null);

  const activeEditing = isEditing || isGlobalEditing;

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

      if (!(leafletLayer as any)._map) {
        timer = setTimeout(setupGeoman, 50);
        return;
      }

      const pm = (leafletLayer as any).pm;
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
        if (isEditing) {
          onPolygonChange(points);
        } else if (isGlobalEditing && onGlobalPolygonChange) {
          onGlobalPolygonChange(area.id, points);
        }
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
  }, [leafletLayer, activeEditing, isEditing, isGlobalEditing, onPolygonChange, onGlobalPolygonChange, area.id]);

  return (
    <Polygon
      ref={refCallback as any}
      positions={positions}
      pathOptions={{
        color: activeEditing ? "#f59e0b" : getDeterministicColor(area.id),
        fillColor: activeEditing ? "#f59e0b" : getDeterministicColor(area.id),
        fillOpacity: activeEditing ? 0.4 : 0.3,
        weight: activeEditing ? 3 : 2,
        dashArray: activeEditing ? "6, 6" : undefined,
      }}
    >
      {children}
    </Polygon>
  );
}

async function geocodeAddress(zipCode?: string, city?: string, state?: string): Promise<[number, number] | null> {
  const cleanZip = zipCode?.replace(/\D/g, "");

  if (cleanZip) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&postalcode=${cleanZip}&country=Brazil`,
        { headers: { "User-Agent": "iFarm-App/1.0" } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
    } catch (e) {
      console.warn("Geocodificação por CEP falhou:", e);
    }
  }

  if (city && state) {
    try {
      const encodedCity = encodeURIComponent(city);
      const encodedState = encodeURIComponent(state);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&city=${encodedCity}&state=${encodedState}&country=Brazil`,
        { headers: { "User-Agent": "iFarm-App/1.0" } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
    } catch (e) {
      console.warn("Geocodificação por Cidade/Estado falhou:", e);
    }
  }

  return null;
}

export default function AreaMap() {
  const { property: currentProperty } = useCurrentProperty();

  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive">("active");
  const [mapMode, setMapMode] = useState<"padrao" | "satelite">("padrao");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [propertyCoords, setPropertyCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!currentProperty?.id) {
      setPropertyCoords(null);
      return;
    }

    async function loadPropertyCoords() {
      try {
        const details = await getProperty(currentProperty!.id);
        if (details.latitude && details.longitude) {
          setPropertyCoords([Number(details.latitude), Number(details.longitude)]);
        } else {
          const coords = await geocodeAddress(details.zipCode, details.city, details.state);
          setPropertyCoords(coords);
        }
      } catch {
        setPropertyCoords(null);
      }
    }
    loadPropertyCoords();
  }, [currentProperty?.id]);

  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isGlobalEditing, setIsGlobalEditing] = useState(false);
  const [drawnLayer, setDrawnLayer] = useState<L.Polygon | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<{ lat: number; lng: number }[]>([]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaRow | null>(null);
  const [detailsArea, setDetailsArea] = useState<AreaRow | null>(null);
  const [deletingAreaId, setDeletingAreaId] = useState<string | null>(null);

  const form = useForm<AreaFormData>({
    resolver: zodResolver(areaFormSchema),
    defaultValues: {
      name: "",
      polygon: null,
      hectares: "",
      stockingRate: "",
      notes: "",
      propertyId: "",
    },
  });

  const handleGlobalPolygonChange = useCallback(
    async (areaId: string, points: { lat: number; lng: number }[]) => {
      setAreas((prev) =>
        prev.map((a) => {
          if (a.id === areaId) {
            const newHectares = calculateAreaHectares(points);
            return {
              ...a,
              polygon: points,
              hectares: Number(newHectares.toFixed(2)),
            };
          }
          return a;
        })
      );

      try {
        const areaToUpdate = areas.find((a) => a.id === areaId);
        if (!areaToUpdate) return;
        const newHectares = calculateAreaHectares(points);
        await updateArea(areaId, {
          name: areaToUpdate.name,
          propertyId: areaToUpdate.propertyId,
          polygon: points,
          hectares: newHectares.toFixed(2),
          stockingRate: String(areaToUpdate.stockingRate),
          notes: areaToUpdate.notes ?? "",
        });
        toast.success(`Limites de "${areaToUpdate.name}" atualizados!`);
      } catch (err: any) {
        toast.error("Erro ao salvar alteração da área.");
      }
    },
    [areas]
  );

  useEffect(() => {
    if (!currentProperty) {
      setLoading(false);
      return;
    }

    let active = true;
    async function fetchList() {
      setLoading(true);
      try {
        const result = await getAreas({ propertyId: currentProperty?.id, status: statusFilter });
        if (active) {
          setAreas(result.data);
        }
      } catch (err: any) {
        toast.error(err.message ?? "Não foi possível carregar as áreas de pastagem.");
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchList();
    return () => { active = false; };
  }, [currentProperty, statusFilter, refreshKey]);

  useEffect(() => {
    if (currentProperty) {
      form.setValue("propertyId", currentProperty.id);
    }
  }, [currentProperty, form]);

  const handlePolygonCreated = useCallback((layer: L.Polygon) => {
    setDrawnLayer(layer);
  }, []);

  const handlePolygonChange = useCallback((points: { lat: number; lng: number }[]) => {
    setPolygonPoints(points);
    form.setValue("polygon", points, { shouldValidate: true });

    const hasEnoughPoints = points.length >= 3;
    if (hasEnoughPoints) {
      const hectaresVal = calculateAreaHectares(points);
      form.setValue("hectares", hectaresVal.toFixed(2), { shouldValidate: true });
    } else {
      form.setValue("hectares", "");
    }

    setSheetOpen(true);
  }, [form]);

  const handleCleanup = useCallback(() => {
    setIsDrawing(false);
    setIsGlobalEditing(false);
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
    setIsGlobalEditing(false);
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
        mapInstance.fitBounds(bounds, { padding: [80, 80], maxZoom: 16, animate: true });
      }
    }

    form.reset({
      name: area.name,
      polygon: area.polygon,
      hectares: String(area.hectares),
      stockingRate: String(area.stockingRate),
      notes: area.notes ?? "",
      propertyId: area.propertyId,
    });

    setSheetOpen(true);
  };

  const handleStartRedraw = useCallback(() => {
    setSheetOpen(false);
    if (drawnLayer) {
      drawnLayer.remove();
      setDrawnLayer(null);
    }
    setPolygonPoints([]);
    form.setValue("polygon", null, { shouldValidate: true });
    form.setValue("hectares", "");
    setIsDrawing(true);
  }, [drawnLayer, form]);

  const onSubmit = async (data: AreaFormData) => {
    try {
      if (editingArea) {
        await updateArea(editingArea.id, data);
        toast.success("Registro atualizado com sucesso!");
      } else {
        await createArea(data);
        toast.success("Registro salvo com sucesso!");
      }
      setSheetOpen(false);
      handleCleanup();
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      if (err instanceof ApiError && err.errors) {
        Object.entries(err.errors).forEach(([field, msg]) => {
          form.setError(field as any, { message: msg });
        });
      } else {
        toast.error(err.message ?? "Não foi possível salvar o registro.");
      }
    }
  };

  const handleDeleteArea = (id: string) => {
    setDetailsArea(null);
    setDeletingAreaId(id);
  };

  const confirmDelete = async () => {
    if (!deletingAreaId) return;
    try {
      await deleteArea(deletingAreaId);
      toast.success("Registro excluído com sucesso!");
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toast.error(err.message ?? "Este registro já possui vínculos e não pode ser excluído.");
    } finally {
      setDeletingAreaId(null);
      setDetailsArea(null);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleAreaStatus(id);
      toast.success(statusFilter === "active" ? "Área desativada com sucesso!" : "Área ativada com sucesso!");
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao alterar o status do registro.");
    }
  };

  const calculatedHectares = calculateAreaHectares(polygonPoints);
  const hectaresInput = form.watch("hectares");
  const parsedHectaresInput = parseFloat(hectaresInput);

  let hectaresWarning: string | null = null;
  if (!isNaN(parsedHectaresInput) && calculatedHectares > 0) {
    const diffPct = Math.abs(parsedHectaresInput - calculatedHectares) / calculatedHectares;
    if (diffPct > 0.25) {
      hectaresWarning = "O valor informado está bem diferente da área desenhada no mapa";
    }
  }

  // Calcula centro inicial baseado nas áreas cadastradas se houverem
  const allAreaPoints = areas.flatMap((a) => (Array.isArray(a.polygon) ? (a.polygon as { lat: number; lng: number }[]) : []));
  const areasCentroid = allAreaPoints.length > 0 ? getCentroid(allAreaPoints) : null;

  const center: [number, number] = areasCentroid ?? propertyCoords ?? [-14.235, -51.925];
  const zoom = areasCentroid || propertyCoords ? 15 : 4;

  if (loading && areas.length === 0) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Carregando áreas de pastagem...</span>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      <div className="flex flex-col gap-4 border-b bg-background/95 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Mapa de Áreas de Pastagem</h1>
          <p className="text-sm text-muted-foreground">
            {currentProperty ? `Propriedade: ${currentProperty.name}` : "Selecione uma propriedade na sidebar"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-[180px]">
            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val as "active" | "inactive")}
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

          <div className="w-[160px]">
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

          {statusFilter === "active" && !isDrawing && !editingArea && (
            <>
              <Button
                variant={isGlobalEditing ? "secondary" : "outline"}
                onClick={() => {
                  setIsGlobalEditing(!isGlobalEditing);
                  if (sheetOpen) setSheetOpen(false);
                }}
                className="gap-2"
              >
                <Pencil className="size-4 text-primary" />
                {isGlobalEditing ? "Concluir Edição" : "Editar Várias Áreas"}
              </Button>

              <Button onClick={startDrawing} className="gap-2">
                <Plus className="size-4" /> Adicionar Área
              </Button>
            </>
          )}

          {isGlobalEditing && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              <Pencil className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Arraste os vértices de qualquer área no mapa para ajustar os limites. [Esc] cancela.</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsGlobalEditing(false)}
                className="h-7 text-xs px-2 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200"
              >
                Concluir Edição
              </Button>
            </div>
          )}

          {isDrawing && (
            <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning-foreground">
              <AlertTriangle className="size-4 text-warning shrink-0" />
              <span>Clique no mapa para desenhar. Duplo clique encerra. [Esc] cancela.</span>
              <Button size="sm" variant="ghost" onClick={handleCleanup} className="h-7 text-xs px-2 hover:bg-warning/20">
                Cancelar
              </Button>
            </div>
          )}

          {editingArea && (
            <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <span>Editando limite da área: <strong>{editingArea.name}</strong>. [Esc] cancela.</span>
              <Button size="sm" variant="ghost" onClick={handleCleanup} className="h-7 text-xs px-2 hover:bg-primary/20">
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {currentProperty ? (
          <MapContainer
            key={`${currentProperty.id}-${areasCentroid ? areasCentroid.join(",") : propertyCoords ? propertyCoords.join(",") : "default"}-${statusFilter}`}
            center={center}
            zoom={zoom}
            maxZoom={19}
            scrollWheelZoom
            className="h-full w-full z-0"
          >
            <MapTileLoadingOverlay />
            <MapReferenceController onMapReady={setMapInstance} />
            <MapBoundsController areas={areas} propertyCoords={propertyCoords} />
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
              isGlobalEditing={isGlobalEditing}
              isEditingSingle={editingArea !== null}
              onPolygonCreated={handlePolygonCreated}
              onPolygonChange={handlePolygonChange}
              onCancelEditing={handleCleanup}
            />

            {areas.map((area) => {
              const rawPoints = area.polygon as { lat: number; lng: number }[];
              const centroid = getCentroid(rawPoints);
              const isSelectedForEdit = editingArea?.id === area.id;

              return (
                <div key={area.id}>
                  <EditablePolygon
                    area={area}
                    isEditing={isSelectedForEdit}
                    isGlobalEditing={isGlobalEditing}
                    editingPoints={isSelectedForEdit ? polygonPoints : undefined}
                    onPolygonChange={handlePolygonChange}
                    onGlobalPolygonChange={handleGlobalPolygonChange}
                  >
                    {!isSelectedForEdit && !isGlobalEditing && (
                      <Tooltip sticky>
                        <div className="p-1 text-xs space-y-0.5">
                          <p className="font-semibold text-sm border-b pb-0.5 mb-1">{area.name}</p>
                          <p><strong>Hectares:</strong> {area.hectares} ha</p>
                          <p><strong>Taxa de Lotação:</strong> {area.stockingRate} UA/ha</p>
                          <p><strong>Observação:</strong> {area.notes || "Nenhuma"}</p>
                        </div>
                      </Tooltip>
                    )}

                    {!isSelectedForEdit && !isGlobalEditing && (
                      <Popup>
                        <div className="min-w-[160px] p-1 text-foreground">
                          <h4 className="font-semibold text-sm border-b pb-1 mb-2">{area.name}</h4>
                          <div className="flex flex-col gap-1.5">
                            {statusFilter === "active" ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 justify-start text-xs font-normal"
                                  onClick={() => startEditing(area)}
                                >
                                  <Pencil className="size-3.5 mr-2 text-muted-foreground" /> Editar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 justify-start text-xs font-normal"
                                  onClick={() => setDetailsArea(area)}
                                >
                                  <Info className="size-3.5 mr-2 text-muted-foreground" /> Detalhes
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 justify-start text-xs font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteArea(area.id)}
                                >
                                  <Trash2 className="size-3.5 mr-2" /> Excluir
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 justify-start text-xs font-normal text-muted-foreground hover:bg-accent"
                                  onClick={() => handleToggleStatus(area.id)}
                                >
                                  <EyeOff className="size-3.5 mr-2" /> Desativar
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 justify-start text-xs font-normal"
                                  onClick={() => handleToggleStatus(area.id)}
                                >
                                  <Eye className="size-3.5 mr-2 text-muted-foreground" /> Reativar
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
                        {area.name}
                      </Tooltip>
                    </Marker>
                  )}
                </div>
              );
            })}
          </MapContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-muted/30 p-8 text-center">
            <Landmark className="h-12 w-12 text-muted-foreground/60" />
            <h3 className="text-lg font-semibold">Nenhuma Propriedade Selecionada</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Selecione uma propriedade no menu suspenso no topo da barra lateral para visualizar e gerenciar suas áreas de pastagem.
            </p>
          </div>
        )}
      </div>

      <AreaForm
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
        onRedraw={handleStartRedraw}
        polygonPointsCount={polygonPoints.length}
        calculatedHectares={calculatedHectares}
      />

      <AreaDetails
        area={detailsArea}
        open={!!detailsArea}
        onOpenChange={(open) => !open && setDetailsArea(null)}
        onDelete={handleDeleteArea}
      />

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
