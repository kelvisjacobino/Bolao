const db = require("../db");

// =======================
// CADASTRAR AMIGO
// =======================
function criarAmigo(nome, apelido, telefone) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO amigos (nome, apelido, telefone)
      VALUES (?, ?, ?)
    `;
    db.run(sql, [nome, apelido, telefone], function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

// =======================
// LISTAR AMIGOS
// =======================
function listarAmigos() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM amigos ORDER BY nome", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  criarAmigo,
  listarAmigos
};
// Buscar amigo por ID
function buscarAmigoPorId(id) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM amigos WHERE id = ?",
      [id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

// Atualizar amigo
function atualizarAmigo(id, nome, apelido, telefone) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE amigos
       SET nome = ?, apelido = ?, telefone = ?
       WHERE id = ?`,
      [nome, apelido, telefone, id],
      function (err) {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
}

// Desativar amigo
function desativarAmigo(id) {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE amigos SET ativo = 0 WHERE id = ?",
      [id],
      function (err) {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
}

// Reativar amigo
function reativarAmigo(id) {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE amigos SET ativo = 1 WHERE id = ?",
      [id],
      function (err) {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
}

module.exports = {
  listarAmigos,
  criarAmigo,
  buscarAmigoPorId,
  atualizarAmigo,
  desativarAmigo,
  reativarAmigo
};
