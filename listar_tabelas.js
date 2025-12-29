const db = require("./db");

db.all(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;",
  (err, rows) => {
    if (err) {
      console.error("Erro:", err.message);
    } else {
      console.log("📦 Tabelas no banco:");
      rows.forEach(r => console.log("-", r.name));
    }
    db.close();
  }
);
