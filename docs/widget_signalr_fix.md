# Widget SignalR Fix

Qué estaba fallando

- `WidgetFrame.js` enviaba el `token` tal cual desde la query string sin validar. Cuando `token` venía como `undefined` o no estaba presente, la llamada a `GET /api/Bots/{id}/widget-settings` recibía `token=undefined` y devolvía 400/401.
- El `public/widget.js` incrusta el iframe con `?token=${token}` incluso cuando `token` es `undefined`, propagando el problema.
- `botService.getBotDataWithToken` mandaba siempre `params: { token }`, lo que hacía que axios transmitiera `token=undefined` en la URL.
- Como resultado la negociación SignalR (`/chatHub/negotiate`) devolvía 401 al intentar autenticar con token inválido, y el widget no recibía `MessageQueued` ni podía conectarse.

Qué cambié y por qué

1. `botService.getBotDataWithToken` (frontend)
   - Cambié la llamada para que incluya `params: { token }` solo si `token` es una cadena no vacía y no es la palabra literal `'undefined'`.
   - Esto evita que la API reciba `token=undefined` y responde mejor cuando no hay token (modo público).

2. `WidgetFrame.js` (frontend)
   - Evita llamar `substring` sobre `undefined` (lo que hacía fallar los logs y complicar debugging).
   - Añadí un fallback que intenta leer un token desde `localStorage` (`widgetToken`, `jwt` o `token`) en caso de que la query string no lo contenga.
   - Conservé la opción `?token=auto` para solicitar un token al backend via `widgetAuthService.getWidgetToken(botId)`.
   - Si `getBotDataWithToken` falla al usar token, intento un fallback `widgetAuthService.getWidgetSettings(botId, token)` que lee configuración directa de DB (no requiere token).
   - Paso finalmente `widgetToken={realToken || tokenParam}` a `ChatWidget` pero ahora con controles para que no sea `undefined`.

3. `public/widget.js` (nota)
   - Si bien no cambié `public/widget.js` en esta iteración, recuerda que el snippet de integración que se inyecta en páginas externas debe evitar pasar `token=undefined` cuando no hay token. Si generas script desde el dashboard, asegúrate de no incluir `data-token="undefined"`.

4. Documentación añadida
   - `docs/widget_signalr_fix.md` (este archivo) describe la causa y la solución y cómo probar.

Cómo probar (pasos)

1. Pruebas básicas en local (sin Redis):

```powershell
# Backend
cd C:\Users\Ivan Herrera\Documents\VIA\Api
dotnet run

# Frontend (en otra terminal)
cd C:\Users\Ivan Herrera\Documents\VIA\dashboard-voia
npm start
```

2. Abrir el widget como iframe (modo público):
   - Visita: `http://localhost:3000/widget-frame?bot=2` (sin token)
   - Resultado esperado: `GET /api/Bots/2/widget-settings` se hará sin `token` query param. Backend validará como integración existente o, si no encuentra integración, `widgetAuthService.getWidgetSettings` fallback proveerá estilos.
   - SignalR `/chatHub/negotiate` debe devolver 200 (anon connection supported). Chat se inicializa.

3. Abrir el widget con token auto-generated via server-side flow:
   - Use: `http://localhost:3000/widget-frame?bot=2&token=auto`
   - `WidgetFrame` pedirá token al endpoint `POST /api/BotIntegrations/generate-widget-token` (vía `widgetAuthService.getWidgetToken`) y lo usará para `getBotDataWithToken` y para `accessTokenFactory`.
   - Negotiation should return 200 and SignalR connect.

4. Dashboard internal conversation view (authenticated)
   - Confirm that authenticated dashboard pages still work (they don't use widget token flow but the same `ChatWidget` for authenticated users). No breaking changes expected.

Notas adicionales

- Si el widget sigue recibiendo `401` en `/chatHub/negotiate` revisa la URL del iframe inyectada por `public/widget.js` y asegúrate de que no incluya `&token=undefined`.
- Si deseas que la integración genere siempre el token y lo propague al script, asegúrate desde el dashboard (Integraciones) de que el token se haya generado y que `data-token` no sea `undefined`.

Fin.
