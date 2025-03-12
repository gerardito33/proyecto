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
import DriveEtaIcon from "@mui/icons-material/DriveEta";
import { useSnackbar } from "notistack";

function GestionConductores() {
  const { enqueueSnackbar } = useSnackbar();
  const [conductores, setConductores] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingConductor, setEditingConductor] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    licencia: "",
    telefono: "",
    email: "",
    fecha_contratacion: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedConductorId, setExpandedConductorId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchConductores = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get("http://localhost:8000/api/conductores/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConductores(response.data);
    } catch (error) {
      console.error("Error al obtener conductores:", error);
      enqueueSnackbar("No se pudieron obtener los conductores", { variant: "error" });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchConductores();
  }, [fetchConductores]);

  const handleOpen = (conductor = null) => {
    if (conductor) {
      setEditingConductor(conductor);
      setFormData(conductor);
    } else {
      setEditingConductor(null);
      setFormData({ nombre: "", apellido: "", licencia: "", telefono: "", email: "", fecha_contratacion: "" });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (!formData.nombre || !formData.apellido || !formData.licencia) {
      enqueueSnackbar("Por favor, complete todos los campos obligatorios", { variant: "warning" });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (editingConductor) {
        await axios.put(`http://localhost:8000/api/conductores/${editingConductor.id}/`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        enqueueSnackbar("Conductor editado con éxito", { variant: "success" });
      } else {
        await axios.post("http://localhost:8000/api/conductores/", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        enqueueSnackbar("Conductor creado con éxito", { variant: "success" });
      }
      fetchConductores();
      setOpen(false);
    } catch (error) {
      console.error("Error al guardar conductor:", error);
      enqueueSnackbar(error.response?.data?.message || "Error al guardar el conductor", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que quieres eliminar este conductor?")) {
      try {
        const token = localStorage.getItem("access_token");
        await axios.delete(`http://localhost:8000/api/conductores/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        enqueueSnackbar("Conductor eliminado", { variant: "info" });
        fetchConductores();
      } catch (error) {
        console.error("Error al eliminar conductor:", error);
        enqueueSnackbar("Error al eliminar el conductor", { variant: "error" });
      }
    }
  };

  const toggleExpand = (conductorId) => {
    setExpandedConductorId(expandedConductorId === conductorId ? null : conductorId);
  };

  const filteredConductores = conductores.filter((conductor) =>
    `${conductor.nombre} ${conductor.apellido}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <Container sx={{ mt: 4, position: "relative", minHeight: "100vh", pb: 10 }}>
      <Box display="flex" alignItems="center" mb={4}>
        <DriveEtaIcon sx={{ fontSize: 40, mr: 2, color: "primary.main" }} />
        <Typography variant="h4" gutterBottom>
          Gestión de Conductores
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        <TextField
          label="Buscar por nombre o apellido"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="contained" color="primary">
          Buscar
        </Button>
      </Box>

      {filteredConductores.map((conductor) => (
        <Card
          key={conductor.id}
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
              onClick={() => toggleExpand(conductor.id)}
              style={{ cursor: "pointer" }}
            >
              {conductor.nombre} {conductor.apellido}
            </Typography>
            <Collapse in={expandedConductorId === conductor.id}>
              <Typography variant="body2">Licencia: {conductor.licencia}</Typography>
              <Typography variant="body2">Teléfono: {conductor.telefono || "N/A"}</Typography>
              <Typography variant="body2">Email: {conductor.email || "N/A"}</Typography>
              <Typography variant="body2">Fecha Contratación: {conductor.fecha_contratacion}</Typography>
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <IconButton color="warning" onClick={() => handleOpen(conductor)} sx={{ mr: 1 }}>
                  <EditIcon />
                </IconButton>
                <IconButton color="error" onClick={() => handleDelete(conductor.id)}>
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
          Agregar Conductor
        </Button>
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingConductor ? "Editar Conductor" : "Agregar Conductor"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1, width: 400 }}>
          <TextField label="Nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
          <TextField label="Apellido" value={formData.apellido} onChange={(e) => setFormData({ ...formData, apellido: e.target.value })} />
          <TextField label="Licencia" value={formData.licencia} onChange={(e) => setFormData({ ...formData, licencia: e.target.value })} />
          <TextField label="Teléfono" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} />
          <TextField label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          <TextField label="Fecha Contratación" type="date" value={formData.fecha_contratacion?.slice(0, 10) || ""} onChange={(e) => setFormData({ ...formData, fecha_contratacion: e.target.value })} InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : editingConductor ? "Guardar Cambios" : "Agregar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default GestionConductores;