const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// caminho absoluto do banco
const DB_PATH = path.join(__dirname, "bolao.db");

// abre conexão
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("❌ Erro ao conectar no banco:", err.message);
  } else {
    console.log("✅ Conectado ao banco SQLite:", DB_PATH);
  }
});

// garante integridade de FK
db.run("PRAGMA foreign_keys = ON");

module.exports = db;
