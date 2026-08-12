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

```dotenv
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
```

El cliente usa el token de sesión para las llamadas REST y la conexión WebSocket autenticada del dashboard de cliente.
