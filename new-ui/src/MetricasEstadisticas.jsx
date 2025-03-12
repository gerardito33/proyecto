import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography, Card, CardContent } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useSnackbar } from "notistack";

function MetricasEstadisticas() {
  const { enqueueSnackbar } = useSnackbar();
  const [pedidosEstado, setPedidosEstado] = useState([]);
  const [gastosTipo, setGastosTipo] = useState([]);
  const [sueldosMes, setSueldosMes] = useState([]);
  const [resumen, setResumen] = useState({ total_pedidos: 0, total_gastos: 0, total_sueldos: 0 });
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("access_token");

  // Verifica si el usuario está autenticado
  useEffect(() => {
    if (!token) {
      enqueueSnackbar("No estás autenticado. Por favor, inicia sesión.", { variant: "error" });
      window.location.href = "/login"; // Redirige al usuario a la página de inicio de sesión
    }
  }, [token, enqueueSnackbar]);

  // Obtén las métricas solo si el token está presente
  useEffect(() => {
    if (!token) return; // Si no hay token, no hagas la solicitud

    const headers = { Authorization: `Bearer ${token}` };

    const fetchMetricas = async () => {
      try {
        const [pedidosRes, gastosRes, sueldosRes, resumenRes] = await Promise.all([
          axios.get("http://localhost:8000/api/metricas/pedidos_por_estado/", { headers }),
          axios.get("http://localhost:8000/api/metricas/gastos_por_tipo/", { headers }),
          axios.get("http://localhost:8000/api/metricas/sueldos_por_mes/", { headers }),
          axios.get("http://localhost:8000/api/metricas/resumen_general/", { headers }),
        ]);

        console.log("Pedidos por estado:", pedidosRes.data);
        console.log("Gastos por tipo:", gastosRes.data);
        console.log("Sueldos por mes:", sueldosRes.data);
        console.log("Resumen general:", resumenRes.data);

        // Ordenar los pedidos por estado: cancelado -> pendiente -> completado
        const estadosOrdenados = ["cancelado", "pendiente", "completado"];
        const pedidosOrdenados = estadosOrdenados.map(estado => {
          const pedido = pedidosRes.data.find(p => p.estado === estado);
          return pedido || { estado, total: 0 }; // Si no hay datos para un estado, se asigna 0
        });

        setPedidosEstado(pedidosOrdenados);
        setGastosTipo(gastosRes.data);
        setSueldosMes(sueldosRes.data);
        setResumen(resumenRes.data);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          enqueueSnackbar("No autorizado. Por favor, inicia sesión nuevamente.", { variant: "error" });
          window.location.href = "/login"; // Redirige al usuario a la página de inicio de sesión
        } else {
          console.error("Error obteniendo métricas:", error);
          enqueueSnackbar("Error al obtener métricas", { variant: "error" });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMetricas();
  }, [token, enqueueSnackbar]);

  if (loading) {
    return <Typography variant="h6">Cargando datos...</Typography>;
  }

  // Colores personalizados para cada estado de pedido
  const getColorForEstado = (estado) => {
    switch (estado) {
      case "cancelado":
        return "#ff6b6b"; // Rojo suave
      case "pendiente":
        return "#ffd700"; // Amarillo
      case "completado":
        return "#82ca9d"; // Verde
      default:
        return "#8884d8"; // Color por defecto
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Métricas y Estadísticas
      </Typography>

      <Box display="flex" gap={2} flexWrap="wrap">
        <Card sx={{ minWidth: 275, flex: 1 }}>
          <CardContent>
            <Typography variant="h6">Total de Pedidos</Typography>
            <Typography variant="h4">{resumen.total_pedidos}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 275, flex: 1 }}>
          <CardContent>
            <Typography variant="h6">Total Gastos</Typography>
            <Typography variant="h4">${resumen.total_gastos}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 275, flex: 1 }}>
          <CardContent>
            <Typography variant="h6">Total Sueldos</Typography>
            <Typography variant="h4">${resumen.total_sueldos}</Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mt: 4, height: 300 }}>
        <Typography variant="h6">Pedidos por Estado</Typography>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={pedidosEstado}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="estado" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total">
              {pedidosEstado.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColorForEstado(entry.estado)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <Box sx={{ mt: 4, height: 300 }}>
        <Typography variant="h6">Gastos por Tipo</Typography>
        {gastosTipo.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gastosTipo}
                dataKey="total"
                nameKey="tipo_gasto"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#82ca9d"
                label
              >
                {gastosTipo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={["#8884d8", "#82ca9d", "#ffc658", "#ff8042"][index % 4]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Typography variant="body1" sx={{ mt: 2 }}>
            No hay datos disponibles para gastos por tipo.
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default MetricasEstadisticas;

















