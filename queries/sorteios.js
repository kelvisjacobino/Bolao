const db = require("../db");

module.exports = {

  inserirSorteio(ciclo_id, numeros) {
    return new Promise((resolve, reject) => {
      db.run(
        `
        INSERT INTO sorteios (ciclo_id, numeros, data_sorteio)
        VALUES (?, ?, datetime('now','localtime'))
        `,
        [ciclo_id, numeros],
        function (err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  },

  listarPorCiclo(ciclo_id) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM sorteios WHERE ciclo_id = ?`,
        [ciclo_id],
        (err, rows) => err ? reject(err) : resolve(rows)
      );
    });
  }

};
