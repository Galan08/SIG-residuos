import L from "leaflet";
import icono from "leaflet/dist/images/marker-icon.png";
import icono2x from "leaflet/dist/images/marker-icon-2x.png";
import sombra from "leaflet/dist/images/marker-shadow.png";

// Vite cambia las rutas de las imágenes, así que el ícono del marcador se arma a mano
export const ICONO_MARCADOR = new L.Icon({
  iconUrl: icono,
  iconRetinaUrl: icono2x,
  shadowUrl: sombra,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export const OCANA = [8.2376, -73.356];
export const ZOOM_INICIAL = 15;
export const CAPA_OSM = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

export const COLOR_ESTADO = {
  pendiente: "#d97706",
  en_proceso: "#1d4f91",
  limpio: "#1f6f4a",
};

export function coordenadas(lat, lng) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
