# TimeGoBetter Frontend

Cliente React + TypeScript para TimeGoBetter.

## Inicio local

1. Copia `.env.example` a `.env`.
2. Confirma que la API está disponible en `http://localhost:8080`.
3. Instala y ejecuta:

```powershell
npm ci
npm run lint
npm run build
npm run dev
```

Abrir `http://localhost:5173`.

## Variables

## Despliegue

```powershell
docker build --build-arg VITE_API_BASE_URL=https://api.tudominio.com/api --build-arg VITE_WS_URL=wss://api.tudominio.com/ws -t timegobetter-web .
docker run -p 8081:80 timegobetter-web
```

Las variables `VITE_*` se incorporan durante el build y no deben contener secretos. Publica el contenedor tras HTTPS mediante un proxy inverso.

## Alcance del pago de demostraciÃ³n

El checkout y la factura PDF son parte de una demostraciÃ³n acadÃ©mica: no procesan tarjetas ni son comprobantes fiscales. El historial permite reabrir comprobantes internos pagados; una operaciÃ³n comercial requerirÃ­a pasarela, webhooks y facturaciÃ³n fiscal.

```dotenv
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
```

El cliente usa el token de sesión para las llamadas REST y la conexión WebSocket autenticada del dashboard de cliente.
