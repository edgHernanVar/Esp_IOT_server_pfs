# ESP IoT Server - Dashboard Frontend

Sistema completo de monitoreo IoT con backend en Node.js/Express/TypeScript y frontend en React/TypeScript.

## Estructura del Proyecto

```
esp_iot_server_pfs/
├── server/          # Backend (Node.js/Express/TypeScript)
├── frontend/        # Frontend (React/TypeScript/Vite)
└── infra/          # Configuración Docker
```

## Requisitos Previos

- Node.js 18+ y npm
- PostgreSQL (o usar Docker Compose)
- npm o yarn

## Instalación y Configuración

### 1. Backend

```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Configurar variables de entorno (crear .env en server/)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=esp_iot
# DB_USER=postgres
# DB_PASSWORD=tu_password
# SERVER_PORT=4000
```

### 2. Base de Datos

Si usas Docker Compose:

```bash
cd infra
docker-compose up -d
```

O configura PostgreSQL manualmente y ejecuta las migraciones desde `server/src/db/migrations/001_init.sql`.

### 3. Frontend

```bash
cd frontend
npm install
```

## Ejecución

### Backend

```bash
# Desde la raíz del proyecto
npm run build  # Compilar TypeScript
node dist/app.js
```

El servidor estará disponible en `http://localhost:4000`

### Frontend

```bash
cd frontend
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

## API Endpoints

### Estadísticas
- `GET /api/stats/daily?device_id=&days=7` - Eventos por día
- `GET /api/stats/top-labels?device_id=&days=7&limit=5` - Top etiquetas

### Eventos
- `GET /api/events?device_id=&label=&limit=50&offset=0` - Lista de eventos
- `GET /api/events/:id` - Detalle de un evento

### Dispositivos
- `GET /api/devices` - Lista de dispositivos

### Errores
- `GET /api/errors?selectedDevice=` - Errores de un dispositivo

### Ingesta
- `POST /api/ingests` - Ingresar nuevos eventos (requiere autenticación)

## Características del Frontend

- **Dashboard Principal**: Visualización de estadísticas y eventos
- **Gráficas Interactivas**:
  - Gráfico de barras: Eventos por día
  - Gráfico de pie: Top 5 etiquetas
- **Tabla de Eventos**: Lista paginada con detalles
- **Modal de Detalles**: Vista completa del payload JSON de cada evento
- **Filtros**: Por dispositivo y por etiqueta

## Tecnologías Utilizadas

### Backend
- Node.js
- Express
- TypeScript
- PostgreSQL
- Ajv (validación de esquemas)

### Frontend
- React 18
- TypeScript
- Vite
- Chart.js / react-chartjs-2
- CSS3

## Desarrollo

### Compilar Backend
```bash
npm run build
```

### Desarrollo Frontend (Hot Reload)
```bash
cd frontend
npm run dev
```

### Build de Producción Frontend
```bash
cd frontend
npm run build
```

## Notas

- El backend debe estar ejecutándose antes de usar el frontend
- El frontend está configurado para hacer proxy de `/api` al backend en `localhost:4000`
- Asegúrate de tener CORS habilitado en el backend (ya está configurado)

