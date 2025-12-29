const db = require("../db");

// ABRIR NOVO CICLO
function abrirCiclo() {
  return new Promise((resolve, reject) => {
    db.run(
      `
      INSERT INTO ciclos (data_inicio, ativo)
      VALUES (datetime('now','localtime'), 1)
      `,
      [],
      function (err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });
}

// FECHAR CICLO
function fecharCiclo(id) {
  return new Promise((resolve, reject) => {
    db.run(
      `
      UPDATE ciclos
      SET ativo = 0,
          data_fim = datetime('now','localtime')
      WHERE id = ?
      `,
      [id],
      err => err ? reject(err) : resolve(true)
    );
  });
}

// PEGAR CICLO ATIVO
function cicloAtivo() {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM ciclos WHERE ativo = 1 ORDER BY id DESC LIMIT 1",
      (err, row) => err ? reject(err) : resolve(row)
    );
  });
}

// CRIAR NOVO (atalho)
function criarNovo() {
  return abrirCiclo();
}

module.exports = {
  abrirCiclo,
  fecharCiclo,
  cicloAtivo,
  criarNovo
};
