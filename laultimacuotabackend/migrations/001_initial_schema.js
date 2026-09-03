/* eslint-disable no-unused-vars */

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgl
 */
exports.up = (pgl) => {
  pgl.createTable('usuarios', {
    id: 'SERIAL PRIMARY KEY',
    username: 'VARCHAR(50) UNIQUE NOT NULL',
    email: 'VARCHAR(100) UNIQUE NOT NULL',
    password_hash: 'VARCHAR(255) NOT NULL',
    saldo: "NUMERIC(12,2) DEFAULT 1000.00",
    ultima_recompensa_diaria: 'TIMESTAMP NULL',
    created_at: "TIMESTAMP DEFAULT NOW()",
    updated_at: "TIMESTAMP DEFAULT NOW()",
  });

  pgl.createTable('caballos', {
    id: 'SERIAL PRIMARY KEY',
    propietario_id: 'INTEGER REFERENCES usuarios(id) ON DELETE SET NULL',
    nombre: 'VARCHAR(100) NOT NULL',
    edad: 'INTEGER NOT NULL',
    velocidad: 'INTEGER NOT NULL',
    resistencia: 'INTEGER NOT NULL',
    corazon: 'INTEGER NOT NULL',
    fatiga: "INTEGER DEFAULT 0",
    carreras_totales: "INTEGER DEFAULT 0",
    victorias: "INTEGER DEFAULT 0",
    posicion_promedio: 'NUMERIC(4,2) NULL',
    en_venta: "BOOLEAN DEFAULT FALSE",
    precio_venta: 'NUMERIC(12,2) NULL',
    created_at: "TIMESTAMP DEFAULT NOW()",
    updated_at: "TIMESTAMP DEFAULT NOW()",
  });

  pgl.createTable('carreras', {
    id: 'SERIAL PRIMARY KEY',
    nombre: 'VARCHAR(100) NOT NULL',
    estado: "VARCHAR(20) DEFAULT 'programada' CHECK (estado IN ('programada', 'en_curso', 'finalizada', 'cancelada'))",
    fecha_programada: 'TIMESTAMP NOT NULL',
    fecha_inicio_real: 'TIMESTAMP NULL',
    fecha_fin_real: 'TIMESTAMP NULL',
    cupo_maximo: "INTEGER DEFAULT 12",
    created_at: "TIMESTAMP DEFAULT NOW()",
    updated_at: "TIMESTAMP DEFAULT NOW()",
  });

  pgl.createTable('inscripciones', {
    id: 'SERIAL PRIMARY KEY',
    carrera_id: 'INTEGER REFERENCES carreras(id) ON DELETE CASCADE',
    caballo_id: 'INTEGER REFERENCES caballos(id) ON DELETE CASCADE',
    usuario_id: 'INTEGER REFERENCES usuarios(id) ON DELETE CASCADE',
    numero_carril: 'INTEGER NULL',
    fecha_inscripcion: "TIMESTAMP DEFAULT NOW()",
  });

  pgl.addConstraint('inscripciones', 'unique_carrera_caballo', {
    unique: ['carrera_id', 'caballo_id'],
  });

  pgl.createTable('resultados_carrera', {
    id: 'SERIAL PRIMARY KEY',
    carrera_id: 'INTEGER REFERENCES carreras(id) ON DELETE CASCADE',
    caballo_id: 'INTEGER REFERENCES caballos(id) ON DELETE CASCADE',
    posicion_final: 'INTEGER NOT NULL',
    tiempo_final: 'NUMERIC(8,2) NULL',
  });

  pgl.addConstraint('resultados_carrera', 'unique_carrera_caballo resultado', {
    unique: ['carrera_id', 'caballo_id'],
  });

  pgl.addConstraint('resultados_carrera', 'unique_carrera_posicion', {
    unique: ['carrera_id', 'posicion_final'],
  });

  pgl.createTable('apuestas', {
    id: 'SERIAL PRIMARY KEY',
    usuario_id: 'INTEGER REFERENCES usuarios(id) ON DELETE CASCADE',
    carrera_id: 'INTEGER REFERENCES carreras(id) ON DELETE CASCADE',
    caballo_id: 'INTEGER REFERENCES caballos(id) ON DELETE CASCADE',
    monto: 'NUMERIC(12,2) NOT NULL',
    cuota: 'NUMERIC(6,2) NOT NULL',
    estado: "VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'ganada', 'perdida', 'cancelada'))",
    monto_ganado: 'NUMERIC(12,2) NULL',
    created_at: "TIMESTAMP DEFAULT NOW()",
  });

  pgl.createTable('transacciones_saldo', {
    id: 'SERIAL PRIMARY KEY',
    usuario_id: 'INTEGER REFERENCES usuarios(id) ON DELETE CASCADE',
    tipo: "VARCHAR(30) NOT NULL CHECK (tipo IN ('compra_caballo', 'venta_caballo', 'apuesta_realizada', 'apuesta_ganada', 'moneda_diaria', 'ajuste_admin'))",
    monto: 'NUMERIC(12,2) NOT NULL',
    saldo_resultante: 'NUMERIC(12,2) NOT NULL',
    referencia_tabla: 'VARCHAR(50) NULL',
    referencia_id: 'INTEGER NULL',
    created_at: "TIMESTAMP DEFAULT NOW()",
  });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgl
 */
exports.down = (pgl) => {
  pgl.dropTable('transacciones_saldo');
  pgl.dropTable('apuestas');
  pgl.dropTable('resultados_carrera');
  pgl.dropTable('inscripciones');
  pgl.dropTable('carreras');
  pgl.dropTable('caballos');
  pgl.dropTable('usuarios');
};
