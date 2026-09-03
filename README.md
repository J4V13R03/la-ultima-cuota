# 🏇 La Última Cuota — Simulador de Apuestas de Caballos

Simulador de apuestas de caballos para diversión personal. Gestiona tu establo, inscribí caballos en carreras, apostá y competí.

## Stack

- **Frontend:** React 19 + Bootstrap 5
- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL 16
- **Migraciones:** node-pg-migrate
- **Contenedores:** Docker + Docker Compose

## Requisitos

- [Docker](https://docs.docker.com/get-docker/) y Docker Compose v2

## Levantar el proyecto

```bash
# Clonar el repositorio
git clone https://github.com/J4V13R03/la-ultima-cuota.git
cd la-ultima-cuota

# Copiar el archivo de variables de entorno
cp .env.example .env

# Levantar todo (primera vez: tarda en descargar imágenes)
docker compose up --build
```

Los servicios quedan disponibles en:

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| PostgreSQL | localhost:5432 |

## Estructura del proyecto

```
/
├── docker-compose.yml
├── .env
├── backend/
│   ├── Dockerfile
│   ├── migrations/
│   │   ├── 001_initial_schema.js
│   │   └── 002_seed_races.js
│   └── src/
│       ├── index.js
│       ├── config/db.js
│       ├── middleware/auth.js
│       ├── routes/
│       │   ├── auth.js
│       │   └── races.js
│       └── utils/hash.js
└── frontend/
    ├── Dockerfile
    └── src/
        ├── App.js
        ├── components/
        ├── pages/
        ├── services/api.js
        └── context/AuthContext.js
```

## API Endpoints

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Obtener usuario actual (JWT) |

### Carreras
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/races` | Listar carreras |
| GET | `/api/races/:id` | Detalle de carrera |

## Esquema de Base de Datos

El esquema completo incluye tablas para todas las features del roadmap:

- **usuarios** — Cuentas y establos
- **caballos** — Estadísticas y propiedad
- **carreras** — Calendario de carreras
- **inscripciones** — Relación caballo ↔ carrera
- **resultados_carrera** — Podio y tiempos
- **apuestas** — Historial de apuestas
- **transacciones_saldo** — Ledger de movimientos

## Roadmap

1. ✅ Login / Registro
2. ✅ Calendario de carreras
3. 🔲 Gacha de caballos
4. 🔲 Gestión de establo
5. 🔲 Inscripción a carreras
6. 🔲 Sistema de apuestas
7. 🔲 Visualización en vivo
8. 🔲 Compra/venta de caballos
9. 🔲 Monedas diarias

## Licencia

Proyecto personal — uso educativo.
