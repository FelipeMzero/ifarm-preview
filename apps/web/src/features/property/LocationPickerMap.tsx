"use client";

import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { StaticImageData } from "next/image";

const markerIconDefault = L.icon({
  iconUrl: markerIcon as unknown as string,
  iconRetinaUrl: markerIcon2x as unknown as string,
  shadowUrl: markerShadow as unknown as string,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

console.log("markerIcon =", markerIcon);
console.log("typeof =", typeof markerIcon);
console.log("keys =", Object.keys(markerIcon));
console.log("src =", markerIcon.src);


const DEFAULT_CENTER: [number, number] = [-14.235, -51.925]; // centro aproximado do Brasil
const DEFAULT_ZOOM = 4;
const SELECTED_ZOOM = 14;

function ClickHandler({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

type LocationPickerMapProps = {
  latitude: number | null;
  longitude: number | null;
  onPick: (lat: number, lon: number) => void;
};

export default function LocationPickerMap({ latitude, longitude, onPick }: LocationPickerMapProps) {
  const hasPosition = latitude != null && longitude != null;
  const center: [number, number] = hasPosition ? [latitude, longitude] : DEFAULT_CENTER;
  const zoom = hasPosition ? SELECTED_ZOOM : DEFAULT_ZOOM;

  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom className="size-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
      {hasPosition && (
        <Marker
          position={[latitude, longitude]}
          icon={markerIconDefault}
          draggable
          eventHandlers={{
            dragend: (e: any) => {
              const { lat, lng } = e.target.getLatLng();
              onPick(lat, lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
