PRAGMA foreign_keys = ON;

-- =========================
-- AMIGOS
-- =========================
CREATE TABLE amigos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  apelido TEXT,
  telefone TEXT,
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- CICLOS
-- =========================
CREATE TABLE ciclos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data_inicio TEXT NOT NULL,
  data_fim TEXT,
  ativo INTEGER DEFAULT 1
);

-- =========================
-- COTAS DO CICLO ATIVO
-- =========================
CREATE TABLE amigos_cotas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amigo_id INTEGER NOT NULL,
  ciclo_id INTEGER NOT NULL,
  cota INTEGER NOT NULL,
  numeros TEXT NOT NULL,
  data_inicio TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (amigo_id) REFERENCES amigos(id),
  FOREIGN KEY (ciclo_id) REFERENCES ciclos(id)
);

-- =========================
-- HISTÓRICO DE COTAS
-- =========================
CREATE TABLE amigos_cotas_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amigo_id INTEGER NOT NULL,
  ciclo_id INTEGER NOT NULL,
  cota INTEGER NOT NULL,
  numeros TEXT NOT NULL,
  data_inicio TEXT,
  data_fim TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (amigo_id) REFERENCES amigos(id),
  FOREIGN KEY (ciclo_id) REFERENCES ciclos(id)
);

-- =========================
-- CAMPEÕES
-- =========================
CREATE TABLE campeoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ciclo_id INTEGER NOT NULL,
  dezenas TEXT NOT NULL,
  data_hora TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ciclo_id) REFERENCES ciclos(id)
);

ALTER TABLE amigos_cotas_history
ADD COLUMN codigo_verificacao TEXT;
