# Socket / SignalR Optimization for VIA

Resumen de cambios aplicados

- Protegido `ChatHub` con `[Authorize]` para requerir token JWT en conexiones autenticadas.
- Cliente: `signalr.js` actualizado para usar `accessTokenFactory` (envía JWT desde `localStorage` si existe). Los widgets que no tengan token siguen enviando `conversationId` por query string.
- Añadido `RedisService` y `PresenceService` (opcional). Cuando se proporciona `REDIS_CONNECTION` en la configuración, el servicio Redis se registra y `PresenceService` usa Redis para mantener userId -> connectionIds.
- `ChatHub` implementa `OnConnectedAsync` y `OnDisconnectedAsync` y utiliza `PresenceService` cuando está disponible. También registra conexiones en logs.
- `Program.cs` actualizado para registrar `PresenceService` y `RedisService` condicionalmente (no requiere Redis si no está disponible).

Por qué

- Mejorar seguridad: enviar JWT vía `accessTokenFactory` y aplicar `[Authorize]` reduce conexiones anónimas no deseadas.
- Preparar la aplicación para escalar horizontalmente: `PresenceService` y `RedisService` permiten introducir un backplane y un store de presencia sin cambiar la lógica del Hub.
- Evitar bloquear el Hub con operaciones largas: plan propuesto para encolar mensajes (no implementado en este cambio mínimo) está documentado abajo.

Cómo revertir

- Revertir cambios en `ChatHub.cs` (remover `[Authorize]` y los overrides `OnConnectedAsync/OnDisconnectedAsync`).
- Restaurar `dashboard-voia/src/services/signalr.js` a la versión anterior que no envía `accessTokenFactory`.
- Eliminar `RedisService` y `PresenceService` del `Api/Services` y quitar las registraciones en `Program.cs`.

Cómo probar localmente

1. Sin Redis (rápido, no requiere dependencias):
   - No definas `REDIS_CONNECTION` en environment variables.
   - Ejecutar el backend `dotnet run` desde `Api` y el frontend normalmente.
   - Si tienes un JWT en `localStorage` (p. ej. al iniciar sesión en dashboard), la conexión SignalR usará ese token. Si no, el widget seguirá funcionando enviando `conversationId` por query.

2. Con Redis (opcional, recomendado para pruebas de presencia/distribución):
   - Instala y ejecuta Redis localmente o usa docker-compose provided.
   - Definir `REDIS_CONNECTION=localhost:6379` (o la conexión adecuada) en tu ambiente.
   - Ejecutar backend; `RedisService` y `PresenceService` se registrarán.

Notas y próximos pasos (recomendado)

- Desacoplar IA del Hub: actualmente `SendMessage` todavía hace muchos pasos sincrónicos (IA, DB). Recomendado:
  1. Hub persiste mensaje y publica evento a Redis Stream / RabbitMQ.
  2. Background worker (consumer) procesa el evento, llama al proveedor IA y persiste la respuesta.
  3. Worker usa `IHubContext<ChatHub>` para enviar la respuesta al grupo.

- Habilitar Redis backplane para SignalR:
  - Agregar `Microsoft.AspNetCore.SignalR.StackExchangeRedis` NuGet y descomentar el `signalRBuilder.AddStackExchangeRedis(...)` en `Program.cs`.

- Subida de ficheros: mover a endpoint HTTP y usar object storage; SignalR solo notifica metadatos.

## Cómo activar Redis Stream Queue

Si quieres que los jobs de IA sean duraderos y procesados por varios workers concurrentes, activa Redis Streams:

1. Asegúrate de tener Redis disponible (local con docker-compose o un servicio gestionado).
  - El repositorio incluye `docker-compose.redis.yml` para pruebas locales.

2. Define la variable de entorno `REDIS_CONNECTION` con la cadena de conexión de Redis, por ejemplo:

```powershell
setx REDIS_CONNECTION "localhost:6379"
```

3. El backend detectará `REDIS_CONNECTION` y registrará `RedisService` y `PresenceService`. También se registrará `RedisStreamMessageQueue` automáticamente. Cuando Redis está presente, la cola en memoria no se registra.

4. Worker y consumidores:
  - `MessageProcessingWorker` crea un consumer group `voia_workers` en la stream `voia:message_jobs` (si no existe) y utilizará `XREADGROUP` para leer mensajes.
  - Tras procesar correctamente un job, el worker hace `XACK` sobre la entrada para marcarla como procesada.

5. Seguridad y operaciones:
  - Asegura tu instancia de Redis cuando la uses en producción (auth, TLS, redes privadas).
  - Implementa políticas de retry o dead-letter para entradas que fallen repetidamente (no implementado aquí, pero logs permiten detectarlas).

6. Fallback:
  - Si `REDIS_CONNECTION` no está definido o Redis no está disponible, el sistema hace fallback a `InMemoryMessageQueue` automáticamente y no fallará.

Notas:
- No cambian los eventos SignalR (`MessageQueued` y `ReceiveMessage`) ni la persistencia de mensajes en la base de datos.
- Los consumidores pueden escalar horizontalmente: la stream y el consumer group coordinan el reparto de trabajo.

*** End of document
