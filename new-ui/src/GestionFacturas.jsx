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
  IconButton,
  Box,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Tooltip,
  Paper,
  Grid,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PrintIcon from "@mui/icons-material/Print";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { useSnackbar } from "notistack";
import jsPDF from "jspdf";
import "jspdf-autotable";

function GestionFacturas() {
  const { enqueueSnackbar } = useSnackbar();
  const [facturas, setFacturas] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingFactura, setEditingFactura] = useState(null);
  const [formData, setFormData] = useState({
    fecha: "",
    servicio: "",
    origen: "",
    destino: "",
    horas_espera: 0,
    precio_hora: 0,
    peajes: 0,
    importe_lista: 0,
    cliente_id: "",
    pedido_id: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [clientes, setClientes] = useState([]);
  const [pedidos, setPedidos] = useState([]);

  const fetchFacturas = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get("http://localhost:8000/api/facturas/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFacturas(response.data);
    } catch (error) {
      console.error("Error al obtener facturas:", error);
      enqueueSnackbar("No se pudieron obtener las facturas", { variant: "error" });
    }
  }, [enqueueSnackbar]);

  const fetchClientes = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get("http://localhost:8000/api/clientes/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClientes(response.data);
    } catch (error) {
      console.error("Error al obtener clientes:", error);
      enqueueSnackbar("No se pudieron obtener los clientes", { variant: "error" });
    }
  }, [enqueueSnackbar]);

  const fetchPedidos = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get("http://localhost:8000/api/pedidos/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPedidos(response.data);
    } catch (error) {
      console.error("Error al obtener pedidos:", error);
      enqueueSnackbar("No se pudieron obtener los pedidos", { variant: "error" });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchFacturas();
    fetchClientes();
    fetchPedidos();
  }, [fetchFacturas, fetchClientes, fetchPedidos]);

  const handleOpen = (factura = null) => {
    if (factura) {
      setEditingFactura(factura);
      setFormData({
        ...factura,
        cliente_id: factura.cliente?.id || "",
        pedido_id: factura.pedido?.id || "",
      });
    } else {
      setEditingFactura(null);
      setFormData({
        fecha: "",
        servicio: "",
        origen: "",
        destino: "",
        horas_espera: 0,
        precio_hora: 0,
        peajes: 0,
        importe_lista: 0,
        cliente_id: "",
        pedido_id: "",
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    // Validar campos obligatorios
    if (!formData.fecha || !formData.servicio || !formData.cliente_id || !formData.pedido_id) {
      enqueueSnackbar("Por favor, complete todos los campos obligatorios", { variant: "warning" });
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const url = editingFactura
        ? `http://localhost:8000/api/facturas/${editingFactura.id}/`
        : "http://localhost:8000/api/facturas/";

      const method = editingFactura ? "put" : "post";

      const response = await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(
          editingFactura ? "Factura editada con éxito" : "Factura creada con éxito",
          { variant: "success" }
        );
        fetchFacturas();
        setOpen(false);
      }
    } catch (error) {
      console.error("Error al guardar factura:", error);
      enqueueSnackbar(error.response?.data?.message || "Error al guardar la factura", { variant: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que quieres eliminar esta factura?")) {
      try {
        const token = localStorage.getItem("access_token");
        await axios.delete(`http://localhost:8000/api/facturas/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        enqueueSnackbar("Factura eliminada", { variant: "info" });
        fetchFacturas();
      } catch (error) {
        console.error("Error al eliminar factura:", error);
        enqueueSnackbar("Error al eliminar la factura", { variant: "error" });
      }
    }
  };

  const generatePDF = (factura) => {
    const doc = new jsPDF();
    doc.text(`Factura #${factura.id}`, 20, 20);
    doc.autoTable({
      startY: 30,
      head: [["Campo", "Valor"]],
      body: [
        ["Fecha", factura.fecha],
        ["Servicio", factura.servicio],
        ["Origen", factura.origen],
        ["Destino", factura.destino],
        ["Horas de espera", factura.horas_espera],
        ["Precio por hora", `$${factura.precio_hora}`],
        ["Peajes", `$${factura.peajes}`],
        ["Importe de lista", `$${factura.importe_lista}`],
        ["Importe total", `$${factura.importe_total}`],
        ["Cliente", factura.cliente?.nombre],
        ["Pedido ID", factura.pedido_id],
      ],
    });
    doc.save(`Factura_${factura.id}.pdf`);
  };

  const printFactura = (factura) => {
    const ventana = window.open("", "_blank");
    ventana.document.write(`
      <html>
      <head><title>Factura #${factura.id}</title></head>
      <body>
        <h2>Factura #${factura.id}</h2>
        <p><strong>Fecha:</strong> ${factura.fecha}</p>
        <p><strong>Servicio:</strong> ${factura.servicio}</p>
        <p><strong>Origen:</strong> ${factura.origen}</p>
        <p><strong>Destino:</strong> ${factura.destino}</p>
        <p><strong>Horas de espera:</strong> ${factura.horas_espera}</p>
        <p><strong>Precio por hora:</strong> $${factura.precio_hora}</p>
        <p><strong>Peajes:</strong> $${factura.peajes}</p>
        <p><strong>Importe de lista:</strong> $${factura.importe_lista}</p>
        <p><strong>Importe total:</strong> $${factura.importe_total}</p>
        <script>window.print();</script>
      </body>
      </html>
    `);
    ventana.document.close();
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Facturas
      </Typography>

      <TextField
        label="Buscar por servicio o cliente"
        variant="outlined"
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />

   <Grid container spacing={2}>
  {facturas.map((factura) => (
    <Grid item xs={12} sm={6} md={4} key={factura.id}>
      <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
        {/* Mostrar el ID de la factura en la parte superior */}
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "primary.main" }}>
          Factura # {factura.id}
        </Typography>

        <Typography variant="h6" sx={{ fontWeight: "bold", mt: 1 }}>
          {factura.servicio} - ${factura.importe_total.toLocaleString()}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>Cliente:</strong> {factura.cliente?.nombre}
        </Typography>
        <Typography variant="body2">
          <strong>Fecha:</strong> {factura.fecha}
        </Typography>

        <Box display="flex" justifyContent="flex-end" mt={2} gap={1}>
          <Tooltip title="Editar">
            <IconButton color="warning" onClick={() => handleOpen(factura)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton color="error" onClick={() => handleDelete(factura.id)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Descargar PDF">
            <IconButton color="primary" onClick={() => generatePDF(factura)}>
              <PictureAsPdfIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Imprimir">
            <IconButton color="secondary" onClick={() => printFactura(factura)}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
    </Grid>
  ))}
</Grid>

      <Button variant="contained" color="primary" onClick={() => handleOpen(null)} sx={{ mt: 2 }}>
        Agregar Factura
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <ReceiptIcon sx={{ mr: 1 }} />
            {editingFactura ? "Editar Factura" : "Agregar Factura"}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box display="flex" flexDirection="column" gap={3}>
            <Box display="flex" flexDirection="row" gap={3}>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>ID de Pedido</InputLabel>
                <Select
                  value={formData.pedido_id}
                  onChange={(e) => setFormData({ ...formData, pedido_id: e.target.value })}
                  label="ID de Pedido"
                >
                  {pedidos.map((pedido) => (
                    <MenuItem key={pedido.id} value={pedido.id}>
                      {pedido.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Cliente</InputLabel>
                <Select
                  value={formData.cliente_id}
                  onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                  label="Cliente"
                >
                  {clientes.map((cliente) => (
                    <MenuItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box display="flex" flexDirection="row" gap={3}>
              <TextField
                label="Fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Servicio"
                value={formData.servicio}
                onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Origen"
                value={formData.origen}
                onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                sx={{ flex: 1 }}
              />
            </Box>

            <Box display="flex" flexDirection="row" gap={3}>
              <TextField
                label="Destino"
                value={formData.destino}
                onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Horas de espera"
                type="number"
                value={formData.horas_espera}
                onChange={(e) => setFormData({ ...formData, horas_espera: parseFloat(e.target.value) })}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Precio por hora"
                type="number"
                value={formData.precio_hora}
                onChange={(e) => setFormData({ ...formData, precio_hora: parseFloat(e.target.value) })}
                sx={{ flex: 1 }}
              />
            </Box>

            <Box display="flex" flexDirection="row" gap={3}>
              <TextField
                label="Peajes"
                type="number"
                value={formData.peajes}
                onChange={(e) => setFormData({ ...formData, peajes: parseFloat(e.target.value) })}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Importe de lista"
                type="number"
                value={formData.importe_lista}
                onChange={(e) => setFormData({ ...formData, importe_lista: parseFloat(e.target.value) })}
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingFactura ? "Guardar Cambios" : "Agregar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default GestionFacturas;