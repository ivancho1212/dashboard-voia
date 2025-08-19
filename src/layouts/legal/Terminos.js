// src/layouts/legal/Terminos.js
import React from "react";
import { Container, Typography, Box } from "@mui/material";

const Terminos = () => {
  return (
    <Container maxWidth="md">
      <Box py={5}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Términos y Condiciones
        </Typography>
        
        <Typography variant="body1" paragraph>
          Bienvenido a nuestra plataforma. Al registrarte y utilizar nuestros servicios,
          aceptas cumplir con los siguientes Términos y Condiciones. Por favor, léelos
          detenidamente.
        </Typography>

        <Typography variant="h6" gutterBottom>
          1. Uso del servicio
        </Typography>
        <Typography variant="body2" paragraph>
          El usuario se compromete a utilizar la plataforma de manera legal, sin realizar
          actividades que puedan dañar, sobrecargar o afectar el funcionamiento del sistema.
        </Typography>

        <Typography variant="h6" gutterBottom>
          2. Privacidad de datos
        </Typography>
        <Typography variant="body2" paragraph>
          La información personal proporcionada será tratada de acuerdo con nuestra Política
          de Privacidad, disponible en esta misma aplicación.
        </Typography>

        <Typography variant="h6" gutterBottom>
          3. Responsabilidad
        </Typography>
        <Typography variant="body2" paragraph>
          No nos hacemos responsables por el mal uso de la plataforma ni por fallos causados
          por factores externos como problemas de conexión a internet.
        </Typography>

        <Typography variant="h6" gutterBottom>
          4. Modificaciones
        </Typography>
        <Typography variant="body2" paragraph>
          Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier
          momento. Los cambios serán notificados a través de la aplicación.
        </Typography>

        <Typography variant="body2" paragraph mt={3}>
          Si tienes preguntas sobre estos Términos y Condiciones, puedes ponerte en contacto
          con nuestro equipo de soporte.
        </Typography>
      </Box>
    </Container>
  );
};

export default Terminos;
