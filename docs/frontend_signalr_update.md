# Frontend SignalR Update

Resumen

- Se revisó y ajustó la UI del widget para asegurar compatibilidad con el nuevo flujo backend donde el Hub encola jobs y responde con `MessageQueued` (ACK) seguido por `ReceiveMessage` (respuesta IA).
- Se registró un handler para `MessageQueued` que actualiza el mensaje temporal del usuario con el `messageId` y marca el estado como `queued`.
- No se cambió la API de SignalR ni los nombres de los métodos: `SendMessage`, `MessageQueued`, `ReceiveMessage` permanecen igual.
- La reconexión automática de SignalR (`withAutomaticReconnect`) se mantuvo.

Cambios en el código

- `src/layouts/bot/style/components/ChatWidget.js`
  - Se añadió el handler `handleMessageQueued` y su registro con `connection.on("MessageQueued", ...)`.
  - Se limpia el handler en el `return` del efecto junto a los otros listeners.

Por qué

- Antes, el frontend añadía el mensaje temporal del usuario y esperaba a que `ReceiveMessage` devolviera la respuesta IA. Con el nuevo backend la confirmación de aceptación del job llega vía `MessageQueued`. Es importante que la UI refleje este ACK para:
  - Mostrar que el mensaje fue aceptado por el sistema (estado `queued`).
  - No depender de que la IA responda inmediatamente.

Cómo probar (pasos rápidos)

1. Levanta el backend con o sin Redis (el flujo es compatible en ambos modos):

```powershell
# Sin Redis
cd C:\Users\Ivan Herrera\Documents\VIA\Api
dotnet run

# Con Redis (si quieres probar streams)
# Asegúrate de tener docker-compose instalado y ejecutar:
cd C:\Users\Ivan Herrera\Documents\VIA
docker compose -f docker-compose.redis.yml up -d
setx REDIS_CONNECTION "localhost:6379"
# Luego ejecutar backend (dotnet run)
```

2. Corre el frontend (dashboard-voia) normalmente (npm/yarn/start).

3. Abre el widget, escribe y envía un mensaje.

- Resultado esperado inmediato:
  - El mensaje del usuario aparece en la lista con `status: 'sending'` y un `tempId`.
  - Inmediatamente tras el `SendMessage` el backend enviará `MessageQueued` con `{ conversationId, messageId, tempId }`.
  - El frontend actualizará ese mensaje temporal (matching por `tempId`) marcándolo `status: 'queued'` y asignando el `id` real si viene.

- Resultado esperado después:
  - Cuando el worker procese el job y persista la respuesta, el backend enviará `ReceiveMessage` con la respuesta IA.
  - El frontend escuchará `ReceiveMessage` y mostrará la respuesta en el hilo. Si la respuesta contiene `tempId`, `ChatWidget` actualizará el temporal respectivo; si no, simplemente lo añadirá.

Pruebas automáticas (manuales rápidas)

- Comprueba la consola del navegador que muestra:
  - "📤 Enviando payload a la IA:" cuando invoca `SendMessage`.
  - "📬 MessageQueued recibido:" cuando recibe `MessageQueued`.
  - "📩 Mensaje recibido (procesado):" para `ReceiveMessage`.

Notas adicionales

- Widgets sin autenticación siguen funcionando: la conexión SignalR sigue incluyendo `conversationId` en la query string y `accessTokenFactory` devolviendo `''` no afecta el comportamiento.
- Si no llega `MessageQueued` (por compatibilidad con versiones antiguas), el código no dependerá exclusivamente de él: el mensaje temporal sigue mostrándose y `ReceiveMessage` seguirá añadiendo la respuesta cuando llegue.

Fin del documento
