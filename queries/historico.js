const db = require("../db");

// 🔐 gera código único do comprovante
function gerarCodigoComprovante(amigoId, data) {
  const d = new Date(data);

  const dataFmt =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");

  const horaFmt =
    String(d.getHours()).padStart(2, "0") +
    String(d.getMinutes()).padStart(2, "0") +
    String(d.getSeconds()).padStart(2, "0");

  const hash = Math.random().toString(36).substring(2, 7).toUpperCase();

  return `BM-${dataFmt}-${horaFmt}-${hash}`;
}

// =======================
// MOVER COTAS PARA HISTÓRICO
// =======================
async function moverParaHistorico(ciclo_id) {
  return new Promise((resolve, reject) => {

    const sqlSelect = `
      SELECT amigo_id, cota, numeros, data_inicio
      FROM amigos_cotas
      WHERE ciclo_id = ?
    `;

    db.all(sqlSelect, [ciclo_id], (err, rows) => {
      if (err) return reject(err);

      const stmt = db.prepare(`
        INSERT INTO amigos_cotas_history (
          amigo_id,
          ciclo_id,
          cota,
          numeros,
          data_inicio,
          codigo_verificacao
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

     rows.forEach(r => {
  if (!r.amigo_id || !r.cota || !r.numeros) return;

  const codigo = gerarCodigoComprovante(r.amigo_id, r.data_inicio);

  stmt.run([
    r.amigo_id,
    ciclo_id,
    r.cota,
    r.numeros,
    r.data_inicio,
    codigo
  ]);
});


      stmt.finalize(err2 => {
        if (err2) reject(err2);
        else resolve(true);
      });
    });
  });
}
// =======================
// LISTAR COMPROVANTES POR AMIGO (COM JOIN)
// =======================
function listarPorAmigo(amigoId) {
  return new Promise((resolve, reject) => {

    const sql = `
      SELECT
        h.id,
        h.amigo_id,
        a.nome,
        a.apelido,
        h.ciclo_id,
        h.cota,
        h.numeros,
        h.data_inicio,
        h.codigo_verificacao
      FROM amigos_cotas_history h
      JOIN amigos a ON a.id = h.amigo_id
      WHERE h.amigo_id = ?
      ORDER BY h.data_inicio DESC
    `;

    db.all(sql, [amigoId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}


module.exports = {
  moverParaHistorico,
  listarPorAmigo
};

