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
  Select,
  FormControl,
  InputLabel,
  Box,
  IconButton,
  Collapse,
  Tooltip,
  Badge,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SearchIcon from "@mui/icons-material/Search";
import { useSnackbar } from "notistack";

function GestionPedidos() {
  const { enqueueSnackbar } = useSnackbar();
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [camiones, setCamiones] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedPedidoId, setExpandedPedidoId] = useState(null);
  const [filter, setFilter] = useState("all");

  const [formData, setFormData] = useState({
    cliente_id: "",
    camion_id: "",
    conductor_id: "",
    descripcion: "",
    estado: "pendiente",
    fecha_entrega: "",
  });

  const token = localStorage.getItem("access_token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    try {
      const [clientesRes, camionesRes, conductoresRes, pedidosRes] = await Promise.all([
        axios.get("http://localhost:8000/api/clientes/", { headers }),
        axios.get("http://localhost:8000/api/camiones/", { headers }),
        axios.get("http://localhost:8000/api/conductores/", { headers }),
        axios.get("http://localhost:8000/api/pedidos/", { headers }),
      ]);

      setClientes(clientesRes.data);
      setCamiones(camionesRes.data);
      setConductores(conductoresRes.data);
      setPedidos(pedidosRes.data);
    } catch (error) {
      console.error("Error al obtener datos:", error);
      enqueueSnackbar("No se pudieron obtener los datos", { variant: "error" });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpen = (pedido = null) => {
    setSelectedPedido(pedido);
    if (pedido) {
      setFormData({
        cliente_id: pedido.cliente?.id || "",
        camion_id: pedido.camion?.id || "",
        conductor_id: pedido.conductor?.id || "",
        descripcion: pedido.descripcion,
        estado: pedido.estado,
        fecha_entrega: pedido.fecha_entrega || "",
      });
    } else {
      setFormData({
        cliente_id: "",
        camion_id: "",
        conductor_id: "",
        descripcion: "",
        estado: "pendiente",
        fecha_entrega: "",
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    try {
      const requestData = { ...formData };
      if (selectedPedido) {
        await axios.put(`http://localhost:8000/api/pedidos/${selectedPedido.id}/`, requestData, { headers });
        enqueueSnackbar("Pedido editado con éxito", { variant: "success" });
      } else {
        await axios.post("http://localhost:8000/api/pedidos/", requestData, { headers });
        enqueueSnackbar("Pedido registrado con éxito", { variant: "success" });
      }
      fetchData();
      setOpen(false);
    } catch (error) {
      console.error("Error al guardar pedido:", error);
      enqueueSnackbar("Error al guardar el pedido", { variant: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este pedido?")) {
      try {
        await axios.delete(`http://localhost:8000/api/pedidos/${id}/`, { headers });
        enqueueSnackbar("Pedido eliminado", { variant: "info" });
        fetchData();
      } catch (error) {
        console.error("Error al eliminar pedido:", error);
        enqueueSnackbar("Error al eliminar el pedido", { variant: "error" });
      }
    }
  };

  const toggleExpand = (pedidoId) => {
    setExpandedPedidoId(expandedPedidoId === pedidoId ? null : pedidoId);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const filteredPedidos = pedidos.filter((pedido) => {
    if (filter === "all") {
      return pedido.id.toString().includes(searchTerm.toLowerCase());
    } else {
      return pedido.estado === filter && pedido.id.toString().includes(searchTerm.toLowerCase());
    }
  });

  // Resumen de pedidos
  const totalPedidos = pedidos.length;
  const pedidosPendientes = pedidos.filter((p) => p.estado === "pendiente").length;
  const pedidosCompletados = pedidos.filter((p) => p.estado === "completado").length;
  const pedidosCancelados = pedidos.filter((p) => p.estado === "cancelado").length;

  return (
    <Container sx={{ mt: 4 }}>
      {/* Título con ícono */}
      <Box display="flex" alignItems="center" mb={4}>
        <LocalShippingIcon sx={{ fontSize: 40, mr: 2, color: "primary.main" }} />
        <Typography variant="h4" gutterBottom>
          Gestión de Pedidos
        </Typography>
      </Box>

      {/* Resumen de pedidos */}
      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        <Card 
          sx={{ flex: 1, p: 2, textAlign: "center", cursor: "pointer", bgcolor: filter === "all" ? "primary.main" : "background.paper" }}
          onClick={() => handleFilterChange("all")}
        >
          <Typography variant="h6">Total Pedidos</Typography>
          <Typography variant="h4">{totalPedidos}</Typography>
        </Card>
        <Card 
          sx={{ flex: 1, p: 2, textAlign: "center", cursor: "pointer", bgcolor: filter === "pendiente" ? "warning.main" : "background.paper" }}
          onClick={() => handleFilterChange("pendiente")}
        >
          <Typography variant="h6">Pendientes</Typography>
          <Typography variant="h4">{pedidosPendientes}</Typography>
        </Card>
        <Card 
          sx={{ flex: 1, p: 2, textAlign: "center", cursor: "pointer", bgcolor: filter === "completado" ? "success.main" : "background.paper" }}
          onClick={() => handleFilterChange("completado")}
        >
          <Typography variant="h6">Completados</Typography>
          <Typography variant="h4">{pedidosCompletados}</Typography>
        </Card>
        <Card 
          sx={{ flex: 1, p: 2, textAlign: "center", cursor: "pointer", bgcolor: filter === "cancelado" ? "error.main" : "background.paper" }}
          onClick={() => handleFilterChange("cancelado")}
        >
          <Typography variant="h6">Cancelados</Typography>
          <Typography variant="h4">{pedidosCancelados}</Typography>
        </Card>
      </Box>

      {/* Campo de búsqueda y botón "Buscar" */}
      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        <TextField
          label="Buscar por número de pedido"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: "action.active", mr: 1 }} />,
          }}
        />
        <Button variant="contained" color="primary">
          Buscar
        </Button>
      </Box>

      {/* Listado de pedidos filtrados */}
      {filteredPedidos.map((pedido) => (
        <Card
          key={pedido.id}
          sx={{
            mb: 2,
            borderRadius: 3,
            boxShadow: 3,
            transition: "transform 0.2s",
            "&:hover": { transform: "scale(1.02)" },
          }}
        >
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ width: '100%', overflow: 'visible' }}>
              <Typography
                variant="h6"
                onClick={() => toggleExpand(pedido.id)}
                style={{ cursor: "pointer", flex: 1, marginRight: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }}
              >
                <strong>Pedido Nro #{pedido.id}</strong> | <strong>Cliente:</strong> {pedido.cliente.nombre}
              </Typography>
              <Box sx={{ flexShrink: 0, overflow: 'visible', minWidth: '20%' }}>
                <Badge
                  badgeContent={pedido.estado}
                  color={
                    pedido.estado === "completado"
                      ? "success"
                      : pedido.estado === "pendiente"
                      ? "warning"
                      : "error"
                  }
                  sx={{ 
                    ml: 20, // Incrementamos el margen izquierdo a 2
                    whiteSpace: 'nowrap',
                    overflow: 'visible',
                  }}
                />
              </Box>
            </Box>
            <Collapse in={expandedPedidoId === pedido.id}>
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
                <strong>Camión:</strong> {pedido.camion ? pedido.camion.placa : "No asignado"}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                <strong>Conductor:</strong> {pedido.conductor ? pedido.conductor.nombre : "No asignado"}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                <strong>Descripción:</strong> {pedido.descripcion}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                <strong>Fecha de entrega:</strong> {new Date(pedido.fecha_entrega).toLocaleDateString()}
              </Typography>
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Tooltip title="Editar">
                  <IconButton color="warning" onClick={() => handleOpen(pedido)} sx={{ mr: 1 }}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton color="error" onClick={() => handleDelete(pedido.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      ))}

      {/* Botón tradicional para agregar pedido */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpen(null)}
          sx={{ borderRadius: 3 }}
        >
          Agregar Pedido
        </Button>
      </Box>

      {/* Diálogo para Agregar/Editar Pedidos */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <LocalShippingIcon sx={{ mr: 1 }} />
            {selectedPedido ? "Editar Pedido" : "Agregar Pedido"}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1, width: 400 }}>
          {/* Cliente */}
          <FormControl fullWidth>
            <InputLabel>Cliente</InputLabel>
            <Select
              name="cliente_id"
              value={formData.cliente_id}
              onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
            >
              {clientes.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Camión */}
          <FormControl fullWidth>
            <InputLabel>Camión</InputLabel>
            <Select
              name="camion_id"
              value={formData.camion_id}
              onChange={(e) => setFormData({ ...formData, camion_id: e.target.value })}
            >
              {camiones.map((camion) => (
                <MenuItem key={camion.id} value={camion.id}>
                  {camion.marca} {camion.modelo} ({camion.placa})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Conductor */}
          <FormControl fullWidth>
            <InputLabel>Conductor</InputLabel>
            <Select
              name="conductor_id"
              value={formData.conductor_id}
              onChange={(e) => setFormData({ ...formData, conductor_id: e.target.value })}
            >
              {conductores.map((conductor) => (
                <MenuItem key={conductor.id} value={conductor.id}>
                  {conductor.nombre} {conductor.apellido}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Descripción */}
          <TextField
            label="Descripción"
            name="descripcion"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          />

          {/* Fecha de Entrega */}
          <TextField
            label="Fecha de Entrega"
            type="date"
            name="fecha_entrega"
            value={formData.fecha_entrega}
            onChange={(e) => setFormData({ ...formData, fecha_entrega: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />

          {/* Estado */}
          <FormControl fullWidth>
            <InputLabel>Estado</InputLabel>
            <Select
              name="estado"
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
            >
              <MenuItem value="pendiente">Pendiente</MenuItem>
              <MenuItem value="completado">Completado</MenuItem>
              <MenuItem value="cancelado">Cancelado</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default GestionPedidos;