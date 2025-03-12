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
  Collapse,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BusinessIcon from "@mui/icons-material/Business";
import { useSnackbar } from "notistack";

function GestionClientes() {
  const { enqueueSnackbar } = useSnackbar();
  const [clientes, setClientes] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    empresa: "",
    email: "",
    telefono: "",
    direccion: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedClienteId, setExpandedClienteId] = useState(null);

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

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const handleOpen = (cliente = null) => {
    if (cliente) {
      setEditingCliente(cliente);
      setFormData(cliente);
    } else {
      setEditingCliente(null);
      setFormData({
        nombre: "",
        empresa: "",
        email: "",
        telefono: "",
        direccion: "",
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (editingCliente) {
        await axios.put(
          `http://localhost:8000/api/clientes/${editingCliente.id}/`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        enqueueSnackbar("Cliente editado con éxito", { variant: "success" });
      } else {
        await axios.post("http://localhost:8000/api/clientes/", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        enqueueSnackbar("Cliente creado con éxito", { variant: "success" });
      }
      fetchClientes();
      setOpen(false);
    } catch (error) {
      console.error("Error al guardar cliente:", error);
      enqueueSnackbar("Error al guardar el cliente", { variant: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que quieres eliminar este cliente?")) {
      try {
        const token = localStorage.getItem("access_token");
        await axios.delete(`http://localhost:8000/api/clientes/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        enqueueSnackbar("Cliente eliminado", { variant: "info" });
        fetchClientes();
      } catch (error) {
        console.error("Error al eliminar cliente:", error);
        enqueueSnackbar("Error al eliminar el cliente", { variant: "error" });
      }
    }
  };

  const toggleExpand = (clienteId) => {
    setExpandedClienteId(expandedClienteId === clienteId ? null : clienteId);
  };

  const filteredClientes = clientes.filter((cliente) =>
    `${cliente.nombre} ${cliente.empresa}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <Container sx={{ mt: 4, position: "relative", minHeight: "100vh", pb: 10 }}>
      {/* Título con ícono */}
      <Box display="flex" alignItems="center" mb={4}>
        <BusinessIcon sx={{ fontSize: 40, mr: 2, color: "primary.main" }} />
        <Typography variant="h4" gutterBottom>
          Gestión de Clientes
        </Typography>
      </Box>

      {/* Campo de búsqueda y botón "Buscar" */}
      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        <TextField
          label="Buscar por nombre o empresa"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="contained" color="primary">
          Buscar
        </Button>
      </Box>

      {/* Listado de clientes filtrados */}
      {filteredClientes.map((cliente) => (
        <Card
          key={cliente.id}
          sx={{
            mb: 2,
            borderRadius: 3,
            boxShadow: 3,
            transition: "transform 0.2s",
            "&:hover": { transform: "scale(1.02)" },
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              onClick={() => toggleExpand(cliente.id)}
              style={{ cursor: "pointer" }}
            >
              {cliente.nombre}
            </Typography>
            <Collapse in={expandedClienteId === cliente.id}>
              <Typography variant="body2">Empresa: {cliente.empresa}</Typography>
              <Typography variant="body2">Email: {cliente.email}</Typography>
              <Typography variant="body2">Teléfono: {cliente.telefono}</Typography>
              <Typography variant="body2">Dirección: {cliente.direccion}</Typography>
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <IconButton color="warning" onClick={() => handleOpen(cliente)} sx={{ mr: 1 }}>
                  <EditIcon />
                </IconButton>
                <IconButton color="error" onClick={() => handleDelete(cliente.id)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      ))}

      {/* Botón para agregar cliente */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpen(null)}
          sx={{ 
            borderRadius: 2, // Bordes redondeados
            textTransform: "none", // Evita que el texto se transforme a mayúsculas
            fontSize: "1rem", // Tamaño de la fuente
            padding: "10px 20px", // Padding para hacer el botón más grande
          }}
        >
          Agregar Cliente
        </Button>
      </Box>

      {/* Dialog para crear/editar cliente */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <BusinessIcon sx={{ mr: 1 }} />
            {editingCliente ? "Editar Cliente" : "Agregar Cliente"}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1, width: 400 }}>
          <TextField
            label="Nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          />
          <TextField
            label="Empresa"
            value={formData.empresa}
            onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
          />
          <TextField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <TextField
            label="Teléfono"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
          />
          <TextField
            label="Dirección"
            multiline
            rows={2}
            value={formData.direccion}
            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingCliente ? "Guardar Cambios" : "Agregar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default GestionClientes;