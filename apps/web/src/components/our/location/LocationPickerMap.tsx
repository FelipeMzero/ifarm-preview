import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const markerIconDefault = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER: [number, number] = [-14.235, -51.925]; // centro aproximado do Brasil
const DEFAULT_ZOOM = 4;
const SELECTED_ZOOM = 14;

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// MapContainer só aplica `center`/`zoom` na montagem inicial; em modo somente-leitura
// o componente permanece montado enquanto os campos de lat/long mudam, então recentraliza
// manualmente sempre que a posição de destino muda.
function Recenter({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], zoom]);
  return null;
}

// O Leaflet mede o container na montagem; se o layout (grid/flex, import dinâmico) ainda
// não tiver resolvido o tamanho final nesse instante, o tile grid fica com dimensões erradas
// mesmo que a caixa em volta esteja do tamanho certo. Reavalia sempre que o container mudar.
function SyncSize() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    map.invalidateSize();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

type LocationPickerMapProps = {
  latitude: number | null;
  longitude: number | null;
  onPick: (lat: number, lon: number) => void;
  readOnly?: boolean;
};

export function LocationPickerMap({
  latitude,
  longitude,
  onPick,
  readOnly = false,
}: LocationPickerMapProps) {
  const hasPosition = latitude != null && longitude != null;
  const center: [number, number] = hasPosition
    ? [latitude, longitude]
    : DEFAULT_CENTER;
  const zoom = hasPosition ? SELECTED_ZOOM : DEFAULT_ZOOM;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={!readOnly}
      dragging={!readOnly}
      zoomControl={!readOnly}
      doubleClickZoom={!readOnly}
      touchZoom={!readOnly}
      attributionControl={!readOnly}
      className="isolate size-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <SyncSize />
      {readOnly ? (
        <Recenter center={center} zoom={zoom} />
      ) : (
        <ClickHandler onPick={onPick} />
      )}
      {hasPosition && (
        <Marker
          position={[latitude, longitude]}
          icon={markerIconDefault}
          draggable={!readOnly}
          eventHandlers={
            readOnly
              ? undefined
              : {
                  dragend: (e) => {
                    const { lat, lng } = e.target.getLatLng();
                    onPick(lat, lng);
                  },
                }
          }
        />
      )}
    </MapContainer>
  );
}
