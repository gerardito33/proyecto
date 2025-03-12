import React, { useEffect, useState, useCallback, useMemo } from "react";
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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney"; // Ícono para el módulo de sueldos
import { useSnackbar } from "notistack";

function GestionSueldos() {
  const { enqueueSnackbar } = useSnackbar();
  const [sueldos, setSueldos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedSueldo, setSelectedSueldo] = useState(null);
  const [expandedSueldoId, setExpandedSueldoId] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // Estado para el término de búsqueda

  const headers = useMemo(() => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  }), []);

  const fetchData = useCallback(async () => {
    try {
      const [empleadosRes, sueldosRes] = await Promise.all([
        axios.get("http://localhost:8000/api/conductores/", { headers }),
        axios.get("http://localhost:8000/api/sueldos/", { headers }),
      ]);
      setEmpleados(empleadosRes.data);
      setSueldos(sueldosRes.data);
    } catch (error) {
      console.error("Error al obtener datos:", error);
      enqueueSnackbar("No se pudieron obtener los datos", { variant: "error" });
    }
  }, [enqueueSnackbar, headers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [formData, setFormData] = useState({
    empleado_id: "",
    salario_base: "",
    bonos: "",
    deducciones: "",
    horas_extras: "",
    adelanto: "",
    total_neto: "",
    fecha_pago: "",
    metodo_pago: "efectivo",
  });

  const calcularTotalNeto = (salario_base, bonos, deducciones, horas_extras, adelanto) => {
    return parseFloat(salario_base || 0) + parseFloat(bonos || 0) + parseFloat(horas_extras || 0) - parseFloat(deducciones || 0) - parseFloat(adelanto || 0);
  };

  const handleOpen = (sueldo = null) => {
    setSelectedSueldo(sueldo);
    if (sueldo) {
      setFormData({
        empleado_id: sueldo.empleado.id,
        salario_base: sueldo.salario_base,
        bonos: sueldo.bonos,
        deducciones: sueldo.deducciones,
        horas_extras: sueldo.horas_extras,
        adelanto: sueldo.adelanto,
        total_neto: sueldo.total_neto,
        fecha_pago: sueldo.fecha_pago,
        metodo_pago: sueldo.metodo_pago,
      });
    } else {
      setFormData({
        empleado_id: "",
        salario_base: "",
        bonos: "",
        deducciones: "",
        horas_extras: "",
        adelanto: "",
        total_neto: "",
        fecha_pago: "",
        metodo_pago: "efectivo",
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };

    updatedFormData.total_neto = calcularTotalNeto(
      updatedFormData.salario_base,
      updatedFormData.bonos,
      updatedFormData.deducciones,
      updatedFormData.horas_extras,
      updatedFormData.adelanto
    );

    setFormData(updatedFormData);
  };

  const handleSubmit = async () => {
    try {
      const requestData = { ...formData };
      if (selectedSueldo) {
        await axios.put(`http://localhost:8000/api/sueldos/${selectedSueldo.id}/`, requestData, { headers });
        enqueueSnackbar("Sueldo editado con éxito", { variant: "success" });
      } else {
        await axios.post("http://localhost:8000/api/sueldos/", requestData, { headers });
        enqueueSnackbar("Sueldo registrado con éxito", { variant: "success" });
      }
      await fetchData();
      setOpen(false);
    } catch (error) {
      console.error("Error al guardar sueldo:", error);
      enqueueSnackbar("Error al guardar el sueldo", { variant: "error" });
    }
  };

  const toggleExpand = (sueldoId) => {
    setExpandedSueldoId(expandedSueldoId === sueldoId ? null : sueldoId);
  };

  // Filtrar sueldos por nombre del conductor
  const filteredSueldos = sueldos.filter((sueldo) =>
    `${sueldo.empleado.nombre} ${sueldo.empleado.apellido}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <Container sx={{ mt: 4, position: "relative", minHeight: "100vh", pb: 10 }}>
      {/* Título con ícono */}
      <Box display="flex" alignItems="center" mb={4}>
        <AttachMoneyIcon sx={{ fontSize: 40, mr: 2, color: "primary.main" }} />
        <Typography variant="h4" gutterBottom>
          Gestión de Sueldos
        </Typography>
      </Box>

      {/* Campo de búsqueda y botón "Buscar" */}
      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        <TextField
          label="Buscar por nombre"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="contained" color="primary">
          Buscar
        </Button>
      </Box>

      {/* Listado de sueldos filtrados */}
      {filteredSueldos.map((sueldo) => (
        <Card
          key={sueldo.id}
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
              onClick={() => toggleExpand(sueldo.id)}
              style={{ cursor: "pointer" }}
            >
              {sueldo.empleado.nombre} {sueldo.empleado.apellido}
            </Typography>
            <Collapse in={expandedSueldoId === sueldo.id}>
              <Typography><strong>Periodo: {sueldo.periodo_sueldo}</strong></Typography>
              <Typography>Salario Base: ${sueldo.salario_base}</Typography>
              <Typography>Bonos: ${sueldo.bonos}</Typography>
              <Typography>Deducciones: ${sueldo.deducciones}</Typography>
              <Typography>Horas Extras: ${sueldo.horas_extras}</Typography>
              <Typography>Adelanto: ${sueldo.adelanto}</Typography>
              <Typography><strong>Total Neto: ${sueldo.total_neto}</strong></Typography>
              <Typography>Fecha de Pago: {sueldo.fecha_pago}</Typography>
              <Typography>Método de Pago: {sueldo.metodo_pago}</Typography>
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <IconButton color="warning" onClick={() => handleOpen(sueldo)} sx={{ mr: 1 }}>
                  <EditIcon />
                </IconButton>
                <IconButton color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      ))}

      {/* Botón para agregar sueldo */}
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
          Agregar Sueldo
        </Button>
      </Box>

      {/* Diálogo para Agregar/Editar Sueldos */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{selectedSueldo ? "Editar Sueldo" : "Agregar Sueldo"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1, width: 400 }}>
          <FormControl fullWidth>
            <InputLabel>Empleado</InputLabel>
            <Select name="empleado_id" value={formData.empleado_id} onChange={handleChange}>
              {empleados.map((empleado) => (
                <MenuItem key={empleado.id} value={empleado.id}>
                  {empleado.nombre} {empleado.apellido}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Periodo de Sueldo (Ej: Marzo 2024)" name="periodo_sueldo" value={formData.periodo_sueldo} onChange={(e) => setFormData({ ...formData, periodo_sueldo: e.target.value })} />
          <TextField label="Salario Base ($)" type="number" name="salario_base" value={formData.salario_base} onChange={handleChange} />
          <TextField label="Bonos ($)" type="number" name="bonos" value={formData.bonos} onChange={handleChange} />
          <TextField label="Deducciones ($)" type="number" name="deducciones" value={formData.deducciones} onChange={handleChange} />
          <TextField label="Horas Extras ($)" type="number" name="horas_extras" value={formData.horas_extras} onChange={handleChange} />
          <TextField label="Adelanto ($)" type="number" name="adelanto" value={formData.adelanto} onChange={handleChange} />
          <TextField label="Fecha de Pago" type="date" name="fecha_pago" value={formData.fecha_pago} onChange={handleChange} InputLabelProps={{ shrink: true }} />
          <TextField label="Método de pago" type="text" name="metodo_pago" value={formData.metodo_pago} onChange={handleChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            {selectedSueldo ? "Guardar Cambios" : "Agregar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default GestionSueldos;