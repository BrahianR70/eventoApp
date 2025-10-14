# Evento App (React + Backend monolítico)

Proyecto de ejemplo con:
- Backend monolítico en `backend/index.js` (Express + MySQL + QR + BasicAuth)
- Frontend en React (módulos separados: Registro y Confirmación)

### Notas importantes
- He dejado valores *placeholder* para la conexión a la base de datos en `backend/index.js`.
  Cambia esos valores por los tuyos cuando quieras.
- Las credenciales BasicAuth por defecto son: `admin` / `changeme`. Cámbialas en `backend/index.js`.
- El backend crea la tabla `inscripciones` automáticamente si no existe.

### Ejecutar

1. Backend
```bash
cd backend
npm install
node index.js
```

2. Frontend
```bash
cd frontend
npm install
npm start
```

### SQL (si quieres crear la DB manualmente)
```sql
CREATE DATABASE evento_db;
USE evento_db;
CREATE TABLE inscripciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  cedula VARCHAR(50),
  email VARCHAR(150),
  cargo VARCHAR(100),
  entidad VARCHAR(100),
  qr TEXT,
  asistencia TINYINT DEFAULT 0,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Rutas
- `POST /api/inscripcion` : crear inscripción -> recibe JSON { nombre, cedula, email, cargo, entidad } -> devuelve `{ mensaje, qrCode }`
- `POST /api/confirmar` : confirmar asistencia -> BasicAuth requerido -> recibe JSON { cedula } -> devuelve `{ mensaje }`

Si quieres que cambie cualquier detalle (por ejemplo: agregar validaciones, PDF con etiqueta, o distinta autenticación),
dime y lo adapto.
