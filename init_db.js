const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "bolao.db");
const schemaPath = path.join(__dirname, "schema.sql");

const db = new sqlite3.Database(dbPath);

console.log("Banco aberto/criado:", dbPath);

const schema = fs.readFileSync(schemaPath, "utf8");

db.exec(schema, (err) => {
  if (err) {
    console.error("Erro ao executar schema.sql:", err.message);
  } else {
    console.log("Estrutura criada com sucesso!");
  }
  db.close();
});
