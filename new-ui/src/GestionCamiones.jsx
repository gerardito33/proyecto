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
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import { useSnackbar } from "notistack";

function GestionCamiones() {
  const { enqueueSnackbar } = useSnackbar();
  const [camiones, setCamiones] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingCamion, setEditingCamion] = useState(null);
  const [formData, setFormData] = useState({
    marca: "",
    modelo: "",
    placa: "",
    capacidad: "",
    año: "",
    informacion_adicional: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCamionId, setExpandedCamionId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCamiones = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get("http://localhost:8000/api/camiones/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCamiones(response.data);
    } catch (error) {
      console.error("Error al obtener camiones:", error);
      enqueueSnackbar("No se pudieron obtener los camiones", { variant: "error" });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchCamiones();
  }, [fetchCamiones]);

  const handleOpen = (camion = null) => {
    if (camion) {
      setEditingCamion(camion);
      setFormData(camion);
    } else {
      setEditingCamion(null);
      setFormData({ marca: "", modelo: "", placa: "", capacidad: "", año: "", informacion_adicional: "" });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (!formData.marca || !formData.modelo || !formData.placa || !formData.capacidad || !formData.año) {
      enqueueSnackbar("Por favor, complete todos los campos obligatorios", { variant: "warning" });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (editingCamion) {
        await axios.put(`http://localhost:8000/api/camiones/${editingCamion.id}/`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        enqueueSnackbar("Camión editado con éxito", { variant: "success" });
      } else {
        await axios.post("http://localhost:8000/api/camiones/", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        enqueueSnackbar("Camión creado con éxito", { variant: "success" });
      }
      fetchCamiones();
      setOpen(false);
    } catch (error) {
      console.error("Error al guardar camión:", error);
      enqueueSnackbar(error.response?.data?.message || "Error al guardar camión", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que quieres eliminar este camión?")) {
      try {
        const token = localStorage.getItem("access_token");
        await axios.delete(`http://localhost:8000/api/camiones/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        enqueueSnackbar("Camión eliminado", { variant: "info" });
        fetchCamiones();
      } catch (error) {
        console.error("Error al eliminar camión:", error);
        enqueueSnackbar("Error al eliminar camión", { variant: "error" });
      }
    }
  };

  const toggleExpand = (camionId) => {
    setExpandedCamionId(expandedCamionId === camionId ? null : camionId);
  };

  const filteredCamiones = camiones.filter((camion) =>
    `${camion.marca} ${camion.modelo}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <Container sx={{ mt: 4, position: "relative", minHeight: "100vh", pb: 10 }}>
      <Box display="flex" alignItems="center" mb={4}>
        <LocalShippingIcon sx={{ fontSize: 40, mr: 2, color: "primary.main" }} />
        <Typography variant="h4" gutterBottom>
          Gestión de Camiones
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        <TextField
          label="Buscar por marca o modelo"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="contained" color="primary">
          Buscar
        </Button>
      </Box>

      {filteredCamiones.map((camion) => (
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
            <Typography
              variant="h6"
              onClick={() => toggleExpand(camion.id)}
              style={{ cursor: "pointer" }}
            >
              {camion.marca} {camion.modelo}
            </Typography>
            <Collapse in={expandedCamionId === camion.id}>
              <Typography variant="body2">Placa: {camion.placa}</Typography>
              <Typography variant="body2">Capacidad: {camion.capacidad} Ton</Typography>
              <Typography variant="body2">Año: {camion.año}</Typography>
              <Typography variant="body2">Información adicional: {camion.informacion_adicional}</Typography>
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <IconButton color="warning" onClick={() => handleOpen(camion)} sx={{ mr: 1 }}>
                  <EditIcon />
                </IconButton>
                <IconButton color="error" onClick={() => handleDelete(camion.id)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      ))}

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
        <Button
          variant="contained"
          onClick={() => handleOpen(null)}
          sx={{ 
            borderRadius: 2,
            textTransform: "none",
            fontSize: "1rem",
            padding: "10px 20px",
          }}
        >
          Agregar Camión
        </Button>
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingCamion ? "Editar Camión" : "Agregar Camión"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1, width: 400 }}>
          <TextField label="Marca" value={formData.marca} onChange={(e) => setFormData({ ...formData, marca: e.target.value })} />
          <TextField label="Modelo" value={formData.modelo} onChange={(e) => setFormData({ ...formData, modelo: e.target.value })} />
          <TextField label="Placa" value={formData.placa} onChange={(e) => setFormData({ ...formData, placa: e.target.value })} />
          <TextField label="Capacidad (Ton)" type="number" value={formData.capacidad} onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })} />
          <TextField label="Año" type="number" value={formData.año} onChange={(e) => setFormData({ ...formData, año: e.target.value })} />
          <TextField label="Información adicional" multiline rows={4} value={formData.informacion_adicional} onChange={(e) => setFormData({ ...formData, informacion_adicional: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : editingCamion ? "Guardar Cambios" : "Agregar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default GestionCamiones;