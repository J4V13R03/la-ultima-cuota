# Documentación Técnica — La Última Cuota

Documentación completa del sistema: funcionalidades, lógica core, puntos críticos, esquema de base de datos, endpoints y arquitectura.

---

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura](#arquitectura)
3. [Funcionalidades](#funcionalidades)
4. [Lógica Core](#lógica-core)
5. [Esquema de Base de Datos](#esquema-de-base-de-datos)
6. [Endpoints API](#endpoints-api)
7. [Eventos Socket.IO](#eventos-socketio)
8. [Puntos Críticos](#puntos-críticos)
9. [Configuración](#configuración)
10. [Convenciones](#convenciones)

---

## Visión General

**La Última Cuota** es un simulador de apuestas hípicas con mecánicas gacha, gestión de establo, mercado de compra/venta y carreras en vivo. Los usuarios reciben monedas diarias (`$CC`), tiran gacha para obtener caballos, los inscriben en carreras programadas automáticamente y apuestan entre ellos.

- **Moneda**: Chilean Coconut (`$CC`), valores proporcionales al peso chileno
- **Idioma**: Español neutro latinoamericano (sin voseo)
- **Sin emojis**: Solo iconos Bootstrap (`bi-*`)
- **Tipografía**: Outfit (headings), Inter (body), Consolas/monospace (figuras)
- **Paleta**: `#15BD0F`, `#F8F2F2`, `#1A1A1A`, `#411C1C`

---

## Arquitectura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend   │────▶│   Backend   │────▶│  PostgreSQL  │
│  React 19    │     │  Express    │     │    16        │
│  Bootstrap 5 │     │  Socket.IO  │     │              │
│  Puerto 3000 │     │  Puerto 4000│     │  Puerto 5432 │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │  Scheduler  │
                    │  (cron 1m)  │
                    └─────────────┘
```

### Componentes

| Servicio | Tecnología | Puerto | Descripción |
|----------|-----------|--------|-------------|
| Frontend | React 19 + Bootstrap 5 | 3000 | SPA con React Router |
| Backend | Node.js + Express | 4000 | REST API + Socket.IO |
| Database | PostgreSQL 16 | 5432 | Base de datos relacional |

### Docker

```yaml
services:
  db:       # PostgreSQL, volumen persistente, healthcheck
  backend:  # Express, nodemon (dev), depende de db
  frontend: # React dev server, depende de backend
```

---

## Funcionalidades

### 1. Autenticación (JWT)
- Registro con username, email y contraseña (mínimo 6 caracteres)
- Login con email y contraseña
- Token JWT con expiración configurable
- Middleware de autenticación en rutas protegidas
- Endpoint `/api/auth/me` para verificar sesión

### 2. Recompensa Diaria
- `$500 CC` gratis cada 24 horas
- Cooldown visible con countdown en tiempo real
- Botón en Landing (no autenticado) y Home (autenticado)
- Transacción registrada en `transacciones_saldo`

### 3. Sistema Gacha
- Costo: `$300 CC` por tirada
- Caballos aleatorios con stats: velocidad, resistencia, corazon
- 5 rarezas: Común (40%), Poco Frecuente (25%), Rara (20%), Épica (10%), Legendaria (5%)
- Stats escalan según rareza
- Transacción registrada

### 4. Establo
- Lista de caballos del usuario con paginación (10/página)
- Detalle de caballo: stats, historial de carreras, renaming
- Eliminación de caballos
- Puesta en venta con precio en `$CC`
- Fatiga del caballo (se incrementa al competir)

### 5. Carreras Automáticas
- Scheduler crea carreras cada 10 minutos en punto (XX:00, XX:10, XX:20...)
- Mínimo 4 carreras programadas en todo momento
- Carreras creadas vacías (0/12 cupos)
- Bots fill solo cuando la carrera pasa a `en_curso`
- naming: "Carrera #ID" (sin nombres en DB)

### 6. Inscripción
- Usuarios inscriben sus caballos en carreras programadas
- Validación: carrera programada, cupo disponible, caballo no fatigado, no duplicado
- Marca `tiene_interaccion_humana = TRUE` en la carrera
- Asignación automática de número de carril

### 7. Sistema de Apuestas
- Odds dinámicas calculadas en tiempo real (pari-mutuel)
- `cuota = pool_total / pool_del_caballo`
- Validación: saldo suficiente, carrera programada, caballo inscrito
- Descuento inmediato del saldo
- Liquidación automática al finalizar carrera
- Comisión al dueño del caballo ganador (10% configurable)

### 8. Simulación en Vivo
- Server-driven: backend calcula posiciones cada 1 segundo
- Velocidad x2, sin timer — espera a que todos terminen
- Socket.IO emite `race_positions` a clientes en la sala
- Componente `RaceTrack` compartido (pista de tierra, carriles, meta)
- Auto-redirección al detectar `race_started`
- Late joiners reciben estado actual via `getRacePositions()`

### 9. Mercado
- Caballos en venta de todos los usuarios (no bots)
- Búsqueda por nombre, ordenamiento (precio/reciente)
- Compra: descuento al comprador, crédito al vendedor
- Transacciones atómicas con transacciones DB

### 10. Historial
- Últimas 5 apuestas ganadoras en navbar
- Historial completo de apuestas con filtros y paginación
- Estadísticas: total apostado, ganancias, ROI, apuestas ganadas

---

## Lógica Core

### Ciclo de Vida de una Carrera

```
programada ──▶ en_curso ──▶ finalizada
     │              │
     │              └──▶ (si solo bots) DELETE CASCADE
     └──▶ (sin inscripciones) DELETE CASCADE
```

1. **Scheduler** crea carrera cada 10 min con `estado = 'programada'`
2. Usuarios inscriben caballos (marcan `tiene_interaccion_humana`)
3. Cuando `fecha_programada` llega:
   - Si tiene interacción humana → `en_curso`, fill bots, iniciar simulación
   - Si no → DELETE CASCADE
4. **Simulación server-side**: posiciones cada 1s via Socket.IO
5. Cuando todos terminan → liquidar apuestas, actualizar stats, `finalizada`
6. Si solo había bots → DELETE CASCADE después de finalizar

### Simulación de Carrera

```javascript
// Velocidad por tick = (random * 10 + 3) * 2
// Sin timer — espera a que todos lleguen a TRACK_WIDTH - HORSE_WIDTH
// Posiciones emitidas cada 1s via Socket.IO
```

### Cálculo de Odds (Pari-Mutuel)

```
cuota = pool_total / pool_del_caballo
```

- Pool total = suma de todas las apuestas pendientes
- Pool del caballo = apuestas pendientes para ese caballo
- Odds se recalculan en tiempo real al consultarse

### Liquidación de Apuestas

```javascript
// Por cada apuesta ganadora:
monto_ganado = monto * cuota
// Se acredita al usuario ganador

// Comisión al dueño del caballo ganador:
comision = monto_ganado * (owner_commission_pct / 100)
```

### Gacha: Generación de Caballos

```javascript
// Rareza: random weighted
// Común 40%, Poco Frecuente 25%, Rara 20%, Épica 10%, Legendaria 5%

// Stats = base + random * multiplier * rareza_scale
// velocidad = 40 + random * 30 * rareza_scale
// resistencia = 40 + random * 30 * rareza_scale
// corazon = 40 + random * 30 * rareza_scale
```

---

## Esquema de Base de Datos

### usuarios

```sql
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    saldo NUMERIC(12,2) DEFAULT 1000.00,
    ultima_recompensa_diaria TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### caballos

```sql
CREATE TABLE caballos (
    id SERIAL PRIMARY KEY,
    propietario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    nombre VARCHAR(100) NOT NULL,
    edad INTEGER NOT NULL,
    velocidad INTEGER NOT NULL,
    resistencia INTEGER NOT NULL,
    corazon INTEGER NOT NULL,
    fatiga INTEGER DEFAULT 0,
    carreras_totales INTEGER DEFAULT 0,
    victorias INTEGER DEFAULT 0,
    posicion_promedio NUMERIC(4,2) NULL,
    en_venta BOOLEAN DEFAULT FALSE,
    precio_venta NUMERIC(12,2) NULL,
    es_bot BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### carreras

```sql
CREATE TABLE carreras (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NULL,
    estado VARCHAR(20) DEFAULT 'programada'
        CHECK (estado IN ('programada', 'en_curso', 'finalizada', 'cancelada')),
    fecha_programada TIMESTAMP NOT NULL,
    fecha_inicio_real TIMESTAMP NULL,
    fecha_fin_real TIMESTAMP NULL,
    cupo_maximo INTEGER DEFAULT 12,
    tiene_interaccion_humana BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### inscripciones

```sql
CREATE TABLE inscripciones (
    id SERIAL PRIMARY KEY,
    carrera_id INTEGER REFERENCES carreras(id) ON DELETE CASCADE,
    caballo_id INTEGER REFERENCES caballos(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    numero_carril INTEGER NULL,
    fecha_inscripcion TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_carrera_caballo UNIQUE (carrera_id, caballo_id)
);
```

### resultados_carrera

```sql
CREATE TABLE resultados_carrera (
    id SERIAL PRIMARY KEY,
    carrera_id INTEGER REFERENCES carreras(id) ON DELETE CASCADE,
    caballo_id INTEGER REFERENCES caballos(id) ON DELETE CASCADE,
    posicion_final INTEGER NOT NULL,
    tiempo_final NUMERIC(8,2) NULL,
    CONSTRAINT unique_carrera_caballo_resultado UNIQUE (carrera_id, caballo_id),
    CONSTRAINT unique_carrera_posicion UNIQUE (carrera_id, posicion_final)
);
```

### apuestas

```sql
CREATE TABLE apuestas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    carrera_id INTEGER REFERENCES carreras(id) ON DELETE CASCADE,
    caballo_id INTEGER REFERENCES caballos(id) ON DELETE CASCADE,
    monto NUMERIC(12,2) NOT NULL,
    cuota NUMERIC(6,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'ganada', 'perdida', 'cancelada')),
    monto_ganado NUMERIC(12,2) NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### transacciones_saldo

```sql
CREATE TABLE transacciones_saldo (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL
        CHECK (tipo IN ('compra_caballo', 'venta_caballo', 'apuesta_realizada',
                        'apuesta_ganada', 'moneda_diaria', 'ajuste_admin')),
    monto NUMERIC(12,2) NOT NULL,
    saldo_resultante NUMERIC(12,2) NOT NULL,
    referencia_tabla VARCHAR(50) NULL,
    referencia_id INTEGER NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### configuracion

```sql
CREATE TABLE configuracion (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor VARCHAR(255) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Datos iniciales:**

| Clave | Valor | Descripción |
|-------|-------|-------------|
| `daily_reward_amount` | 500 | Recompensa diaria en $CC |
| `gacha_cost` | 300 | Costo de tirada gacha en $CC |
| `owner_commission_pct` | 10 | Comisión al dueño del caballo ganador (%) |
| `race_duration_seconds` | 30 | Duración simulada de carrera (segundos) |
| `race_interval_minutes` | 30 | Intervalo de creación de carreras (minutos) |

### Caballos Bot (Seed)

20 caballos bot con `es_bot = TRUE` y `propietario_id = NULL`:

```
Huaso del Sur, Poncho Rojo, Chacarero Veloz, Diablo del Ranco,
Puma Andino, Condor de la Frontera, Machaqmara, Trauco Legendario,
Boroniol del Bosque, Chiflon del Norte, Trentrenlevu, Pinen el Indomable,
Viento Blanco, Salamanka del Sur, Trueno del Maipo, Centella Andina,
Rayo del Desierto, Relámpago Cordillerano, Porteño Veloz, Huinca Rapido
```

---

## Endpoints API

### Autenticación

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | No | Registrar usuario |
| `POST` | `/api/auth/login` | No | Iniciar sesión, devuelve JWT |
| `GET` | `/api/auth/me` | Sí | Obtener usuario actual |

### Carreras

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/races` | No | Listar carreras (filtro `?estado=`) |
| `GET` | `/api/races/:id` | No | Detalle de carrera con inscripciones |
| `GET` | `/api/races/:id/odds` | Sí | Odds actuales de apuestas |
| `GET` | `/api/races/:id/results` | Sí | Resultados de carrera finalizada |
| `POST` | `/api/races/:id/inscribe` | Sí | Inscribir caballo en carrera |
| `POST` | `/api/races/:id/bet` | Sí | Realizar apuesta |

### Recompensa Diaria

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/daily/status` | Sí | Estado del cooldown y monto |
| `POST` | `/api/daily/claim` | Sí | Reclamar recompensa diaria |

### Gacha

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/gacha/pull` | Sí | Tirada de gacha ($300 CC) |

### Establo

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/stable` | Sí | Listar caballos del usuario |
| `GET` | `/api/stable/:id/history` | Sí | Historial de carreras del caballo |
| `PATCH` | `/api/stable/:id/rename` | Sí | Renombrar caballo |
| `DELETE` | `/api/stable/:id` | Sí | Eliminar caballo |
| `PATCH` | `/api/stable/:id/sell` | Sí | Poner caballo en venta |
| `PATCH` | `/api/stable/:id/unsell` | Sí | Quitar caballo de venta |

### Mercado

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/market` | No | Caballos en venta (`?search=`, `?sort=`) |
| `POST` | `/api/market/:id/buy` | Sí | Comprar caballo |

### Historial

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/history/bets` | Sí | Apuestas del usuario (paginado, `?estado=`) |
| `GET` | `/api/history/wins` | Sí | Últimas 5 apuestas ganadoras |
| `GET` | `/api/history/stats` | Sí | Estadísticas generales |

### Health

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/health` | No | Health check |

---

## Eventos Socket.IO

| Dirección | Evento | Payload | Descripción |
|-----------|--------|---------|-------------|
| Cliente → Servidor | `join_race` | `raceId (number)` | Unirse a sala de carrera |
| Cliente → Servidor | `leave_race` | `raceId (number)` | Salir de sala de carrera |
| Servidor → Cliente | `race_positions` | `{ carrera_id, positions, elapsed }` | Posiciones en tiempo real (cada 1s) |
| Servidor → Cliente | `race_started` | `{ carrera_id }` | Carrera iniciada (auto-redirección) |

**Reconexión**: El cliente reconecta automáticamente al cambiar de pestaña (`visibilitychange`).

---

## Puntos Críticos

### 1. Transacciones DB

Todas las operaciones que modifican saldo usan transacciones:
- `BEGIN` → validaciones → `COMMIT` o `ROLLBACK`
- Conexión cliente dedicada por operación
- `client.release()` en `finally` para evitar connection leaks

### 2. Condiciones de Carrera

| Riesgo | Estado | Mitigación |
|--------|--------|------------|
| Doble apuesta con mismo saldo | Abierto | `SELECT ... FOR UPDATE` recomendado |
| Doble compra del mismo caballo | Abierto | `SELECT ... FOR UPDATE` recomendado |
| Inscripción concurrente | Parcial | `UNIQUE (carrera_id, caballo_id)` constraint |
| Scheduler duplicado | Parcial | Intervalo de 1 min, operaciones rápidas |
| Bots beyond cupo | Parcial | `UNIQUE (carrera_id, caballo_id)` + random IDs |

### 3. Lógica de Eliminación de Carreras

```javascript
// Carreras sin interacción humana → DELETE CASCADE
// Carreras solo con bots después de finalizar → DELETE CASCADE
// Carreras con interacción humana → persisten como 'finalizada'
```

`tiene_interaccion_humana` se marca cuando:
- Un usuario inscribe un caballo
- Un usuario realiza una apuesta

### 4. Simulación Server-Side

- Backend calcula posiciones, frontend solo renderiza
- Sin timer — espera a que todos los caballos lleguen
- Velocidad base: `(random * 10 + 3) * 2`
- Posiciones emitidas cada 1s via Socket.IO
- Late joiners reciben estado actual al hacer `join_race`

### 5. Fatiga

- Los caballos ganan fatiga al competir
- No hay mecanismo de recuperación implementado
- Caballos con fatiga >= 80 no pueden inscribirse
- Esto limita la reutilización de caballos

### 6. Hardcoded Values

| Valor | Ubicación | Problema |
|-------|-----------|----------|
| `$300 CC` | Gacha.jsx UI | Hardcoded, no lee de config |
| `localhost:4000` | Socket.IO clients | Hardcoded, rompe en producción |
| `http://localhost:4000` | RaceSimulation.jsx | Hardcoded para Socket.IO |

---

## Configuración

### Variables de Entorno (.env)

```env
# Database
POSTGRES_USER=ultimacuota
POSTGRES_DB=ultimacuota
POSTGRES_PASSWORD=ultimacuota123

# Backend
DB_HOST=db
DB_PORT=5432
DB_USER=ultimacuota
DB_PASSWORD=ultimacuota123
DB_NAME=ultimacuota
JWT_SECRET=tu-clave-secreta-super-segura-aqui-cambiar-en-produccion
JWT_EXPIRES_IN=7d
PORT=4000

# Frontend
REACT_APP_API_URL=http://localhost:4000
```

### Configuración en DB (configuracion)

| Clave | Valor Default | Descripción |
|-------|---------------|-------------|
| `daily_reward_amount` | 500 | Monto recompensa diaria |
| `gacha_cost` | 300 | Costo tirada gacha |
| `owner_commission_pct` | 10 | Comisión dueño ganador (%) |
| `race_duration_seconds` | 30 | Duración simulada carrera |
| `race_interval_minutes` | 30 | Intervalo creación carreras |

---

## Convenciones

### Código

- **Sin comentarios** en el código (solo si el usuario lo pide)
- **Sin emojis** — solo iconos Bootstrap (`bi-*`)
- **Español neutro** — sin voseo, con tildes y ñ correctas
- **API responses**: `{ success: boolean, data?: object, error?: string }`
- **Horse stats**: NUNCA expuestas en frontend o API pública

### Nombres

- Carreras: "Carrera #ID" (sin nombres en DB)
- Caballos: nombres en español chileno (huasos, mitología mapuche)
- Rutas: `/api/[recurso]`

### Paginación

- 10 items por página en todas las listas
- Respuesta: `{ data: [], pagination: { page, pages, total } }`

### Estilos

- CSS variables para colores y tipografía
- Bootstrap 5 para layout y componentes
- Border-radius: 8px para inputs, 12px para cards
- Sombras sutiles: `shadow-sm`

---

## Archivos Clave

### Backend

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/index.js` | Express + Socket.IO + rutas |
| `src/config/db.js` | Pool de conexiones PostgreSQL |
| `src/middleware/auth.js` | Verificación JWT |
| `src/workers/raceScheduler.js` | Scheduler + simulación server-side |
| `src/models/*.js` | Acceso a datos (queries SQL) |
| `src/controllers/*.js` | Lógica de negocio |
| `src/routes/*.js` | Definición de endpoints |

### Frontend

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/app/App.jsx` | Rutas y layout |
| `src/shared/context/AuthContext.jsx` | Estado de autenticación |
| `src/shared/context/SocketContext.jsx` | Conexión Socket.IO global |
| `src/shared/context/ToastContext.jsx` | Sistema de notificaciones |
| `src/shared/components/RaceTrack.jsx` | Pista de carrera compartida |
| `src/shared/components/Sidebar.jsx` | Navegación lateral |
| `src/shared/components/Navbar.jsx` | Barra superior |
| `src/shared/services/api.js` | Cliente HTTP (axios) |
| `src/features/*/pages/*.jsx` | Páginas por feature |

### Tests

| Archivo | Cobertura |
|---------|-----------|
| `test/models.test.js` | User model, JWT, bcrypt |
| `test/controllers.test.js` | Auth, Daily, Gacha, Stable, Market, Race |

---

## Roadmap Completado

| Fase | Estado | Descripción |
|------|--------|-------------|
| 0 | ✅ | Docker + DB + Express + React |
| 1 | ✅ | Login / Registro (JWT) |
| 2 | ✅ | Calendario de carreras |
| 3 | ✅ | Gacha de caballos |
| 4 | ✅ | Gestión de establo |
| 5 | ✅ | Inscripción a carreras |
| 6 | ✅ | Sistema de apuestas |
| 7 | ✅ | Visualización en vivo (Socket.IO) |
| 8 | ✅ | Compra/venta de caballos |
| 9 | ✅ | Monedas diarias |
| 10 | ✅ | Sidebar + Navbar + Landing |
| 11 | ✅ | Simulador dev independiente |
| 12 | ✅ | Historial + Estadísticas |
| 13 | ✅ | Calendar grid/list + Server-driven simulation |

---

*Documento generado automáticamente. Última actualización: Septiembre 2026.*
