import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, TextField, Button, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

function PerfilUsuario() {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
      return;
    }

    axios
      .get("http://localhost:8000/api/usuarios/me/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => setUserData(response.data))
      .catch((error) => {
        console.error("Error obteniendo usuario:", error);
        navigate("/");
      });
  }, [navigate]);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.put("http://localhost:8000/api/usuarios/update_profile/", userData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      enqueueSnackbar("Perfil actualizado con éxito", { variant: "success" });
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      enqueueSnackbar("Error al actualizar el perfil", { variant: "error" });
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>
        Perfil de Usuario
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField label="Nombre" name="first_name" value={userData.first_name} onChange={handleChange} fullWidth />
        <TextField label="Apellido" name="last_name" value={userData.last_name} onChange={handleChange} fullWidth />
        <TextField label="Correo Electrónico" name="email" value={userData.email} onChange={handleChange} fullWidth />
        <Button variant="contained" onClick={handleSubmit}>
          Guardar Cambios
        </Button>
        <Button variant="outlined" color="error" onClick={() => navigate("/dashboard")}>
          Volver al Inicio
        </Button>
      </Box>
    </Container>
  );
}

export default PerfilUsuario;

