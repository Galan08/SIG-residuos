import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { CAPA_OSM, ICONO_MARCADOR, ZOOM_INICIAL } from "../mapa";

function Seguir({ posicion }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(posicion);
  }, [map, posicion]);
  return null;
}

function AlTocar({ onCambio }) {
  useMapEvents({ click: (e) => onCambio([e.latlng.lat, e.latlng.lng]) });
  return null;
}

// Mapa con un marcador. Si recibe onCambio, el marcador se puede arrastrar o mover tocando el mapa.
export default function MapaUbicacion({ posicion, onCambio, alto = 260 }) {
  const editable = Boolean(onCambio);
  return (
    <MapContainer
      center={posicion}
      zoom={ZOOM_INICIAL}
      className="mapa"
      style={{ height: alto }}
      scrollWheelZoom={editable}
      dragging={true}
    >
      <TileLayer url={CAPA_OSM.url} attribution={CAPA_OSM.attribution} />
      <Marker
        position={posicion}
        icon={ICONO_MARCADOR}
        draggable={editable}
        eventHandlers={
          editable
            ? {
                dragend: (e) => {
                  const p = e.target.getLatLng();
                  onCambio([p.lat, p.lng]);
                },
              }
            : {}
        }
      />
      <Seguir posicion={posicion} />
      {editable && <AlTocar onCambio={onCambio} />}
    </MapContainer>
  );
}
