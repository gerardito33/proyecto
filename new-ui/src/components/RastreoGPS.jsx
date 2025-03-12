import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";

// Configuración del ícono del marcador (necesario para Leaflet)
const iconoCamion = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2907/2907978.png", // Icono de camión
  iconSize: [40, 40], // Tamaño del ícono
  iconAnchor: [20, 40], // Punto de anclaje del ícono
  popupAnchor: [0, -40], // Punto de anclaje del popup
});

function RastreoGPS() {
  const [ubicaciones, setUbicaciones] = useState([]); // Todas las ubicaciones
  const [camiones, setCamiones] = useState([]); // Lista de camiones
  const [camionSeleccionado, setCamionSeleccionado] = useState(null); // Camión seleccionado
  const [rutaCamion, setRutaCamion] = useState([]); // Ruta del camión seleccionado

  // Obtener la lista de camiones desde el backend
  useEffect(() => {
    const fetchCamiones = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/camiones/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        setCamiones(response.data);
      } catch (error) {
        console.error("Error obteniendo camiones:", error);
      }
    };

    fetchCamiones();
  }, []);

  // Obtener las ubicaciones del camión seleccionado
  useEffect(() => {
    const fetchUbicaciones = async () => {
      if (camionSeleccionado) {
        try {
          const response = await axios.get(
            `http://localhost:8000/api/ubicaciones/?camion_id=${camionSeleccionado}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("access_token")}`,
              },
            }
          );
          setUbicaciones(response.data);
          // Extraer las coordenadas para dibujar la ruta
          const coordenadas = response.data.map((ubicacion) => [
            ubicacion.latitud,
            ubicacion.longitud,
          ]);
          setRutaCamion(coordenadas);
        } catch (error) {
          console.error("Error obteniendo ubicaciones:", error);
        }
      }
    };

    fetchUbicaciones();
  }, [camionSeleccionado]);

  return (
    <div style={{ width: "100%", height: "600px", position: "relative" }}>
      {/* Selector de camión */}
      <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 1000, background: "white", padding: "10px", borderRadius: "5px" }}>
        <label htmlFor="camion">Seleccionar camión: </label>
        <select
          id="camion"
          value={camionSeleccionado || ""}
          onChange={(e) => setCamionSeleccionado(e.target.value)}
          style={{ padding: "5px" }}
        >
          <option value="">Todos los camiones</option>
          {camiones.map((camion) => (
            <option key={camion.id} value={camion.id}>
              {camion.placa} - {camion.marca} {camion.modelo}
            </option>
          ))}
        </select>
      </div>

      {/* Mapa */}
      <MapContainer
        center={[-34.6037, -58.3816]} // Centro del mapa (ej: Buenos Aires)
        zoom={13}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Capa del mapa (OpenStreetMap) */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marcadores de ubicaciones */}
        {ubicaciones.map((ubicacion) => (
          <Marker
            key={ubicacion.id}
            position={[ubicacion.latitud, ubicacion.longitud]}
            icon={iconoCamion}
          >
            <Popup>
              <strong>Camion:</strong> {ubicacion.camion.placa} <br />
              <strong>Hora:</strong> {new Date(ubicacion.timestamp).toLocaleTimeString()} <br />
              <strong>Coordenadas:</strong> {ubicacion.latitud}, {ubicacion.longitud}
            </Popup>
          </Marker>
        ))}

        {/* Línea de la ruta del camión */}
        {rutaCamion.length > 0 && (
          <Polyline
            positions={rutaCamion}
            color="blue"
            weight={3}
            opacity={0.7}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default RastreoGPS;