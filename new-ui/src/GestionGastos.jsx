import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Box,
  Select,
  FormControl,
  InputLabel,
  Collapse,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney"; // Ícono para el módulo de gastos
import { useSnackbar } from "notistack";

function GestionGastos() {
  const { enqueueSnackbar } = useSnackbar();

  // Estados principales
  const [camiones, setCamiones] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedGasto, setSelectedGasto] = useState(null);
  const [selectedCamion, setSelectedCamion] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // Estado para el término de búsqueda
  const [expandedGastoId, setExpandedGastoId] = useState(null); // Estado para expandir/colapsar detalles

  // Datos del formulario (Agregar/Editar)
  const [formData, setFormData] = useState({
    camion_id: "",
    tipo_gasto: "combustible",
    monto: "",
    fecha: "",
    comentarios: "",
  });

  // Config de axios
  const headers = { Authorization: `Bearer ${localStorage.getItem("access_token")}` };

  // Cargar camiones y gastos
  const fetchData = useCallback(async () => {
    try {
      const [camionesRes, gastosRes] = await Promise.all([
        axios.get("http://localhost:8000/api/camiones/", { headers }),
        axios.get("http://localhost:8000/api/gastos/", { headers }),
      ]);
      setCamiones(camionesRes.data);
      setGastos(gastosRes.data);
    } catch (error) {
      console.error("Error al obtener datos:", error);
      enqueueSnackbar("No se pudieron obtener los datos", { variant: "error" });
    }
  }, [enqueueSnackbar, headers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Abrir diálogo para Agregar/Editar gasto
  const handleOpen = (gasto = null, camion = null) => {
    setSelectedGasto(gasto || null);

    // Si es edición (gasto != null), cargamos sus datos
    // Si es nuevo, cargamos el camión que se pasó (o ninguno)
    if (gasto) {
      setFormData({
        camion_id: gasto.camion ? gasto.camion.id : "",
        tipo_gasto: gasto.tipo_gasto,
        monto: gasto.monto.toString(),
        fecha: gasto.fecha || "",
        comentarios: gasto.comentarios || "",
      });
    } else {
      setFormData({
        camion_id: camion ? camion.id : "",
        tipo_gasto: "combustible",
        monto: "",
        fecha: "",
        comentarios: "",
      });
    }
    setOpen(true);
  };

  // Cerrar diálogo
  const handleClose = () => {
    setOpen(false);
    setSelectedGasto(null);
  };

  // Guardar gasto (Agregar o Editar)
  const handleSubmit = async () => {
    try {
      // Validación mínima
      if (!formData.camion_id) {
        enqueueSnackbar("Debes seleccionar un camión para asignar el gasto", { variant: "warning" });
        return;
      }

      const requestData = {
        camion_id: formData.camion_id,
        tipo_gasto: formData.tipo_gasto,
        monto: parseFloat(formData.monto),
        fecha: formData.fecha,
        comentarios: formData.comentarios,
      };

      if (selectedGasto) {
        // Editar gasto (PUT)
        await axios.put(`http://localhost:8000/api/gastos/${selectedGasto.id}/`, requestData, { headers });
        enqueueSnackbar("Gasto editado con éxito", { variant: "success" });
      } else {
        // Agregar gasto (POST)
        await axios.post("http://localhost:8000/api/gastos/", requestData, { headers });
        enqueueSnackbar("Gasto registrado con éxito", { variant: "success" });
      }

      fetchData();
      handleClose();
    } catch (error) {
      console.error("Error al guardar gasto:", error);
      enqueueSnackbar("Error al guardar el gasto", { variant: "error" });
    }
  };

  // Eliminar gasto
  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este gasto?")) {
      try {
        await axios.delete(`http://localhost:8000/api/gastos/${id}/`, { headers });
        enqueueSnackbar("Gasto eliminado", { variant: "info" });
        fetchData();
      } catch (error) {
        console.error("Error al eliminar gasto:", error);
        enqueueSnackbar("Error al eliminar el gasto", { variant: "error" });
      }
    }
  };

  // Calcular gastos del mes para el camión seleccionado
  const handleCalcularGastos = async () => {
    if (!selectedCamion) {
      enqueueSnackbar("Selecciona un camión antes de calcular gastos", { variant: "warning" });
      return;
    }
    const mes = prompt("Ingresa el mes en formato YYYY-MM (Ej: 2025-03):");
    if (!mes) {
      enqueueSnackbar("Mes requerido para calcular gastos", { variant: "warning" });
      return;
    }
    try {
      const response = await axios.get(
        `http://localhost:8000/api/gastos/gastos_por_mes/?camion_id=${selectedCamion}&mes=${mes}`,
        { headers }
      );
      enqueueSnackbar(`Total de gastos en ${mes}: $${response.data.total_gasto}`, { variant: "info" });
    } catch (error) {
      console.error("Error al calcular gastos:", error);
      enqueueSnackbar("Error al calcular los gastos", { variant: "error" });
    }
  };

  // Calcular gastos totales (todos los camiones), con o sin mes
  const handleCalcularGastosTotales = async () => {
    const mes = prompt("Ingresa el mes en formato YYYY-MM (déjalo vacío para todos los meses):");
    const url = mes
      ? `http://localhost:8000/api/gastos/gastos_totales/?mes=${mes}`
      : `http://localhost:8000/api/gastos/gastos_totales/`;

    try {
      const response = await axios.get(url, { headers });
      enqueueSnackbar(`Gasto total: $${response.data.total_gasto}`, { variant: "info" });
    } catch (error) {
      console.error("Error al calcular los gastos totales:", error);
      enqueueSnackbar("Error al calcular los gastos totales", { variant: "error" });
    }
  };

  // Función para expandir/colapsar detalles del gasto
  const toggleExpand = (gastoId) => {
    setExpandedGastoId(expandedGastoId === gastoId ? null : gastoId);
  };

  // Filtrar gastos por tipo de gasto o camión
  const filteredGastos = gastos.filter((gasto) =>
    `${gasto.tipo_gasto} ${gasto.camion ? gasto.camion.marca : ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <Container sx={{ mt: 4, position: "relative", minHeight: "100vh", pb: 10 }}>
      {/* Título con ícono */}
      <Box display="flex" alignItems="center" mb={4}>
        <AttachMoneyIcon sx={{ fontSize: 40, mr: 2, color: "primary.main" }} />
        <Typography variant="h4" gutterBottom>
          Gestión de Gastos
        </Typography>
      </Box>

      {/* Campo de búsqueda y botón "Buscar" */}
      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        <TextField
          label="Buscar por tipo de gasto o camión"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="contained" color="primary">
          Buscar
        </Button>
      </Box>

      {/* Listado de gastos filtrados */}
      {camiones.map((camion) => (
        <Card
          key={camion.id}
          sx={{
            mb: 2,
            borderRadius: 3,
            boxShadow: 3,
            transition: "transform 0.2s",
            "&:hover": { transform: "scale(1.02)" },
          }}
        >
          <CardContent>
            <Typography variant="h6">
              {camion.marca} {camion.modelo} ({camion.placa})
            </Typography>

            {filteredGastos
              .filter((g) => g.camion && g.camion.id === camion.id)
              .map((gasto) => (
                <Box key={gasto.id}>
                  <Typography
                    variant="body1"
                    onClick={() => toggleExpand(gasto.id)}
                    style={{ cursor: "pointer" }}
                  >
                    {gasto.tipo_gasto} - ${gasto.monto} (Fecha: {gasto.fecha})
                  </Typography>
                  <Collapse in={expandedGastoId === gasto.id}>
                    <Typography variant="body2">Comentarios: {gasto.comentarios}</Typography>
                    <Box display="flex" justifyContent="flex-end" mt={1}>
                      <IconButton color="warning" onClick={() => handleOpen(gasto)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(gasto.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Collapse>
                </Box>
              ))}

            <Button variant="contained" sx={{ mt: 1 }} onClick={() => handleOpen(null, camion)}>
              Agregar Gasto
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* Selección de un camión para cálculo */}
      <FormControl sx={{ minWidth: 200, mt: 2 }}>
        <InputLabel>Selecciona un Camión</InputLabel>
        <Select
          value={selectedCamion}
          label="Selecciona un Camión"
          onChange={(e) => setSelectedCamion(e.target.value)}
        >
          {camiones.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.marca} {c.modelo} ({c.placa})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box display="flex" gap={2} mt={2}>
        <Button variant="contained" color="primary" onClick={handleCalcularGastos}>
          Calcular Gastos del Mes
        </Button>
        <Button variant="contained" color="secondary" onClick={handleCalcularGastosTotales}>
          Gastos Totales
        </Button>
      </Box>

      {/* Diálogo para Agregar/Editar Gasto */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{selectedGasto ? "Editar Gasto" : "Agregar Gasto"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1, width: 400 }}>
          <TextField
            select
            label="Tipo de Gasto"
            value={formData.tipo_gasto}
            onChange={(e) => setFormData({ ...formData, tipo_gasto: e.target.value })}
          >
            <MenuItem value="combustible">Combustible</MenuItem>
            <MenuItem value="reparacion">Reparación</MenuItem>
            <MenuItem value="filtros">Filtros</MenuItem>
            <MenuItem value="seguro">Seguro</MenuItem>
            <MenuItem value="otros">Otros</MenuItem>
          </TextField>

          <TextField
            label="Monto ($)"
            type="number"
            value={formData.monto}
            onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
          />

          <TextField
            label="Fecha"
            type="date"
            value={formData.fecha}
            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Comentarios"
            multiline
            rows={3}
            value={formData.comentarios}
            onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {selectedGasto ? "Guardar Cambios" : "Agregar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default GestionGastos;