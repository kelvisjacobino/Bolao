const express = require("express");
const router = express.Router();
const db = require("../db"); // seu sqlite

// ==========================
// CRIAR COTA
// ==========================
router.post("/", (req, res) => {
  const { amigo_id, ciclo_id, dezenas } = req.body;

  if (!amigo_id || !ciclo_id || !Array.isArray(dezenas) || dezenas.length < 6) {
    return res.json({ sucesso: false, erro: "Dados inválidos" });
  }

  // normaliza dezenas
  const normalizada = [...dezenas]
    .map(d => String(d).padStart(2, "0"))
    .sort()
    .join(",");

  // 🔒 REGRA DE DUPLICIDADE
  const sqlCheck = `
    SELECT id FROM cotas
    WHERE amigo_id = ?
      AND ciclo_id = ?
      AND dezenas = ?
    LIMIT 1
  `;

  db.get(sqlCheck, [amigo_id, ciclo_id, normalizada], (err, row) => {
    if (err) {
      console.error(err);
      return res.json({ sucesso: false, erro: "Erro no banco" });
    }

    if (row) {
      return res.json({
        sucesso: false,
        erro: "Essa cota já existe para esse amigo neste ciclo"
      });
    }

    // ✅ INSERE
    const sqlInsert = `
      INSERT INTO cotas (amigo_id, ciclo_id, dezenas)
      VALUES (?, ?, ?)
    `;

    db.run(sqlInsert, [amigo_id, ciclo_id, normalizada], function (err) {
      if (err) {
        console.error(err);
        return res.json({ sucesso: false, erro: "Erro ao salvar cota" });
      }

      res.json({
        sucesso: true,
        id: this.lastID
      });
    });
  });
});


module.exports = router;
