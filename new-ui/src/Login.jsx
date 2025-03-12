import React, { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Box,
  Link,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { styled } from "@mui/system";
import camion from "./assets/camion.png"; // Importa la imagen del camión

// Estilos personalizados
const StyledContainer = styled(Container)({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  backgroundColor: "#ffffff", // Fondo blanco
});

const StyledCard = styled(Card)({
  padding: "40px",
  borderRadius: "15px",
  boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.1)", // Sombra suave
  textAlign: "center",
  maxWidth: "400px",
  width: "100%",
  border: "2px solid #2196F3", // Borde azul para remarcar el formulario
});

const StyledButton = styled(Button)({
  marginTop: "20px",
  background: "#2196F3", // Color azul sólido
  color: "white",
  "&:hover": {
    background: "#1976D2", // Color azul más oscuro al hacer hover
  },
});

const StyledInput = styled(TextField)({
  marginBottom: "20px",
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: "#2196F3", // Borde azul
    },
    "&:hover fieldset": {
      borderColor: "#1976D2", // Borde azul más oscuro al hacer hover
    },
  },
});

function Login({ onLoginSuccess }) {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: "", password: "" });

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:8000/api/token/", credentials);
      
      // Guardar tokens en localStorage
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);

      enqueueSnackbar("Inicio de sesión exitoso", { variant: "success" });

      // Llamamos a la función de App.js para actualizar el estado de login
      if (onLoginSuccess) {
        onLoginSuccess();
      }

      navigate("/dashboard"); // Redirigir al dashboard
    } catch (error) {
      console.error("Error en login:", error);
      enqueueSnackbar(
        error.response?.data?.detail || "Credenciales incorrectas",
        { variant: "error" }
      );
    }
  };

  return (
    <StyledContainer>
      <StyledCard elevation={3}>
        {/* Logo y nombre de la empresa */}
        <img
          src={camion} // Usa la imagen importada
          alt="Logo Transvol"
          style={{ width: "100px", marginBottom: "20px" }}
        />
        <Typography variant="h4" gutterBottom style={{ color: "#2196F3", fontWeight: "bold" }}>
          Transvol
        </Typography>

        {/* Icono de candado */}
        <LockIcon color="primary" sx={{ fontSize: 50, marginBottom: 2 }} />

        {/* Formulario de inicio de sesión */}
        <Box 
          component="form" 
          onSubmit={handleSubmit} 
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <StyledInput
            label="Usuario"
            name="username"
            variant="outlined"
            fullWidth
            required
            value={credentials.username}
            onChange={handleChange}
          />
          <StyledInput
            label="Contraseña"
            name="password"
            type="password"
            variant="outlined"
            fullWidth
            required
            value={credentials.password}
            onChange={handleChange}
          />
          <StyledButton type="submit" variant="contained" fullWidth>
            Iniciar sesión
          </StyledButton>
        </Box>

        {/* Enlaces adicionales */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
          <Link href="/register" variant="body2" style={{ color: "#2196F3", textDecoration: "none" }}>
            ¿No tienes cuenta? Regístrate
          </Link>
          <Link href="/forgot-password" variant="body2" style={{ color: "#2196F3", textDecoration: "none" }}>
            ¿Olvidaste tu contraseña?
          </Link>
        </Box>
      </StyledCard>
    </StyledContainer>
  );
}

export default Login;