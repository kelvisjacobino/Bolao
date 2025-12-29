const db = require("../db");

// =======================
// INSERIR COTA
// =======================
function inserirCota(amigo_id, ciclo_id, cota, numeros) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO amigos_cotas
      (amigo_id, ciclo_id, cota, numeros, data_inicio)
      VALUES (?, ?, ?, ?, datetime('now','localtime'))
    `;
    db.run(sql, [amigo_id, ciclo_id, cota, numeros], function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

// =======================
// LISTAR COTAS DO CICLO
// =======================
async function listarCotasPorCiclo(cicloId) {
  return new Promise((resolve, reject) => {
    const sql = `
     SELECT
  c.id,
  c.amigo_id,
  a.nome,
  a.apelido,
  c.cota,
  c.numeros
FROM amigos_cotas c
JOIN amigos a ON a.id = c.amigo_id
WHERE c.ciclo_id = ?

    `;

    db.all(sql, [cicloId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  inserirCota,
  listarCotasPorCiclo
};
function buscarCotaPorId(id) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM amigos_cotas WHERE id = ?",
      [id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

function atualizarCota(id, amigo_id, cota, numeros) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE amigos_cotas
       SET amigo_id = ?, cota = ?, numeros = ?
       WHERE id = ?`,
      [amigo_id, cota, numeros, id],
      function (err) {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
}

function existeCotaComMesmasDezenas(amigo_id, ciclo_id, numeros) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT 1
       FROM amigos_cotas
       WHERE amigo_id = ?
         AND ciclo_id = ?
         AND numeros = ?`,
      [amigo_id, ciclo_id, numeros],
      (err, row) => {
        if (err) {
          console.error("❌ ERRO SQL:", err);
          reject(err);
        } else {
          resolve(!!row);
        }
      }
    );
  });
  function buscarPorAmigoECiclo(amigo_id, ciclo_id) {
  return new Promise((resolve, reject) => {
    db.get(
      `
      SELECT * FROM amigos_cotas
      WHERE amigo_id = ? AND ciclo_id = ?
      `,
      [amigo_id, ciclo_id],
      (err, row) => err ? reject(err) : resolve(row)
    );
  });
}

module.exports = {
  listarCotasPorCiclo,
  inserirCota,
  buscarPorAmigoECiclo,

  listarCotasPorCiclo,
  buscarCotaPorId,
  atualizarCota,
  existeCotaComMesmasDezenas
};

}


