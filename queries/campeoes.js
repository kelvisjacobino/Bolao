const db = require("../db");

function registrarCampeao(ciclo_id, dezenas) {
  return new Promise((resolve, reject) => {
    db.run(
      `
      INSERT INTO campeoes (ciclo_id, dezenas)
      VALUES (?, ?)
      `,
      [ciclo_id, dezenas],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

module.exports = {
  registrarCampeao
};
