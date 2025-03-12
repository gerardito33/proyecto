import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import GestionCamiones from "./GestionCamiones";
import GestionConductores from "./GestionConductores";
import GestionClientes from "./GestionClientes";
import GestionPedidos from "./GestionPedidos";
import GestionGastos from "./GestionGastos";
import GestionSueldos from "./GestionSueldos";
import GestionFacturas from "./GestionFacturas"; // Importar el módulo de facturas
import MetricasEstadisticas from "./MetricasEstadisticas";
import PerfilUsuario from "./PerfilUsuario";
import Login from "./Login";
import { Button, Box, Menu, MenuItem } from "@mui/material";
import axios from "axios";
import RastreoGPS from "./components/RastreoGPS";

// Componente para proteger rutas
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function Dashboard() {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState("camiones");
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
    } else {
      axios
        .get("http://localhost:8000/api/usuarios/me/", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => setUser(response.data))
        .catch((error) => {
          console.error("Error obteniendo usuario:", error);
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          navigate("/");
        });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/");
  };

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  return (
    <Box sx={{ padding: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
        <Box>
          <Button
            variant={activeModule === "camiones" ? "contained" : "outlined"}
            onClick={() => setActiveModule("camiones")}
            sx={{ margin: 1 }}
          >
            Camiones
          </Button>
          <Button
            variant={activeModule === "conductores" ? "contained" : "outlined"}
            onClick={() => setActiveModule("conductores")}
            sx={{ margin: 1 }}
          >
            Conductores
          </Button>
          <Button
            variant={activeModule === "clientes" ? "contained" : "outlined"}
            onClick={() => setActiveModule("clientes")}
            sx={{ margin: 1 }}
          >
            Clientes
          </Button>
          <Button
            variant={activeModule === "pedidos" ? "contained" : "outlined"}
            onClick={() => setActiveModule("pedidos")}
            sx={{ margin: 1 }}
          >
            Pedidos
          </Button>
          <Button
            variant={activeModule === "gastos" ? "contained" : "outlined"}
            onClick={() => setActiveModule("gastos")}
            sx={{ margin: 1 }}
          >
            Gastos
          </Button>
          <Button
            variant={activeModule === "sueldos" ? "contained" : "outlined"}
            onClick={() => setActiveModule("sueldos")}
            sx={{ margin: 1 }}
          >
            Sueldos
          </Button>
          <Button
            variant={activeModule === "facturas" ? "contained" : "outlined"} // Botón para facturas
            onClick={() => setActiveModule("facturas")}
            sx={{ margin: 1 }}
          >
            Facturas
          </Button>
          <Button
            variant={activeModule === "metricas" ? "contained" : "outlined"}
            onClick={() => setActiveModule("metricas")}
            sx={{ margin: 1 }}
          >
            Métricas
          </Button>
          <Button
            variant={activeModule === "rastreo" ? "contained" : "outlined"}
            onClick={() => setActiveModule("rastreo")}
            sx={{ margin: 1 }}
          >
            Rastreo GPS
          </Button>
        </Box>

        <Box>
          {user && (
            <>
              <Button variant="contained" color="primary" onClick={handleMenuOpen}>
                {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
              </Button>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={() => { navigate("/perfil"); handleMenuClose(); }}>Perfil</MenuItem>
                <MenuItem onClick={handleLogout}>Cerrar Sesión</MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Box>

      {activeModule === "camiones" && <GestionCamiones />}
      {activeModule === "conductores" && <GestionConductores />}
      {activeModule === "clientes" && <GestionClientes />}
      {activeModule === "pedidos" && <GestionPedidos />}
      {activeModule === "gastos" && <GestionGastos />}
      {activeModule === "sueldos" && <GestionSueldos />}
      {activeModule === "facturas" && <GestionFacturas />} {/* Módulo de facturas */}
      {activeModule === "metricas" && <MetricasEstadisticas />}
      {activeModule === "rastreo" && <RastreoGPS />}
    </Box>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <PerfilUsuario />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;