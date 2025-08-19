import React from "react";
import { Container, Typography, Box } from "@mui/material";

export default function DataTrainingConsent() {
  return (
    <Container maxWidth="md">
      <Box mt={5} mb={5}>
        <Typography variant="h4" gutterBottom>
          Autorización para uso de datos en entrenamiento de Inteligencia Artificial
        </Typography>

        <Typography variant="body1" paragraph>
          Al aceptar esta autorización, el usuario permite que los datos, documentos,
          textos o enlaces que cargue en la plataforma para entrenar sus bots puedan
          ser utilizados por la compañía con fines de entrenamiento, mejora y desarrollo
          de modelos de Inteligencia Artificial.
        </Typography>

        <Typography variant="body1" paragraph>
          En ningún caso se hará uso de datos personales, credenciales de acceso,
          información de pago o conversaciones privadas. Solo se utilizará la información
          que el usuario decida cargar voluntariamente como material de entrenamiento.
        </Typography>

        <Typography variant="body1" paragraph>
          Esta autorización es opcional. En caso de no otorgarla, el servicio de la
          plataforma seguirá funcionando sin restricciones.
        </Typography>

        <Typography variant="body1" paragraph>
          El usuario podrá revocar esta autorización en cualquier momento solicitándolo
          a través de los canales de soporte.
        </Typography>
      </Box>
    </Container>
  );
}
