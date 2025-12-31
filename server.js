/**
 * =============================================
 *  SERVIDOR PRINCIPAL — BOLÃO
 *  Express + SQLite
 * =============================================
 */


const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");

/**
 * =============================================
 *  HELPERS / LOG
 * =============================================
 */
function log(...msg) {
  console.log("🧾 LOG:", ...msg);
}

/**
 * =============================================
 *  IMPORTANDO QUERIES
 * =============================================
 */
const ciclos = require("./queries/ciclos");
const amigos = require("./queries/amigos");
const cotas = require("./queries/cotas");
const sorteios = require("./queries/sorteios");

/**
 * =============================================
 *  TABELAS AUXILIARES (CASO NÃO EXISTAM)
 * =============================================
 */
db.run(`
CREATE TABLE IF NOT EXISTS resultados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cota_id INTEGER,
  sorteio_id INTEGER,
  acertos INTEGER,
  ganhou INTEGER DEFAULT 0
);
`);

/**
 * =============================================
 *  CONFIG APP
 * =============================================
 */
const app = express();
const PORT = 3030;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/**
 * Middleware de LOG
 */
app.use((req, res, next) => {
  console.log(`➡️  ${req.method} ${req.url}`, req.body || "");
  next();
});

/**
 * =============================================
 *  PÁGINA PRINCIPAL
 * =============================================
 */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

/**
 * =============================================
 *  ROTAS — AMIGOS
 * =============================================
 */
app.get("/api/amigos", async (req, res) => {
  try {
    res.json(await amigos.listarAmigos());
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.post("/api/amigos", async (req, res) => {
  const { nome, apelido, telefone } = req.body;
  const id = await amigos.criarAmigo(nome, apelido, telefone);
  res.json({ sucesso: true, id });
});

app.get("/api/amigos/:id", async (req, res) => {
  res.json(await amigos.buscarAmigoPorId(req.params.id));
});

app.put("/api/amigos/:id/desativar", async (req, res) => {
  await amigos.desativarAmigo(req.params.id);
  res.json({ sucesso: true });
});

app.put("/api/amigos/:id/reativar", async (req, res) => {
  await amigos.reativarAmigo(req.params.id);
  res.json({ sucesso: true });
});
app.get("/api/comprovantes/:amigoId", (req, res) => {
  const amigoId = parseInt(req.params.amigoId);

  if (isNaN(amigoId)) {
    return res.status(400).json({ erro: "ID de amigo inválido" });
  }

  // Verificar se os dados existem (mock)
  const comprovantesDoAmigo = comprovantes.filter(
    (comprovante) => comprovante.amigo_id === amigoId
  );

  if (comprovantesDoAmigo.length === 0) {
    return res.status(404).json({ erro: "Nenhum comprovante encontrado" });
  }

  // Se não houver erro, retorna os dados do comprovante
  res.json(comprovantesDoAmigo);
});



function gerarCodigoAutorizacao() {
  const data = new Date();
  return `COT-${data.getFullYear()}${(data.getMonth() + 1).toString().padStart(2, '0')}${data.getDate().toString().padStart(2, '0')}-${data.getHours().toString().padStart(2, '0')}${data.getMinutes().toString().padStart(2, '0')}`;
}

app.post('/api/comprovantes', (req, res) => {
  const { nome, ciclo_id, qtd_dezenas, dezenas } = req.body;

  const codigoAutorizacao = gerarCodigoAutorizacao();

  // Salvar o comprovante no banco de dados, se necessário
  const comprovante = {
    nome,
    ciclo_id,
    qtd_dezenas,
    dezenas,
    codigo_verificacao: codigoAutorizacao
  };

  // Enviar de volta o comprovante criado
  res.json({ sucesso: true, comprovante });
});

/**
 * =============================================
 *  ROTAS — CICLO ATUAL
 * =============================================
 */
app.get("/api/ciclo/ativo", async (req, res) => {
  try {
    let ciclo = await ciclos.cicloAtivo();

    // cria caso não exista
    if (!ciclo) {
      const novoId = await ciclos.criarNovo();
      ciclo = { id: novoId, ativo: 1 };
      console.log("🆕 Novo ciclo criado:", novoId);
    }

    res.json(ciclo);

  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

/**
 * =============================================
 *  ROTAS — COTAS DO CICLO
 *  (tabela amigos_cotas)
 * =============================================
 */

// listar cotas por ciclo
app.get("/api/cotas", (req, res) => {
  const { ciclo_id } = req.query;

  if (!ciclo_id)
    return res.json({ sucesso: false, erro: "ciclo_id obrigatório" });

  const sql = `
    SELECT
      c.id,
      c.amigo_id,
      c.ciclo_id,
      c.numeros,
      a.nome,
      a.apelido
    FROM amigos_cotas c
    JOIN amigos a ON a.id = c.amigo_id
    WHERE c.ciclo_id = ?
    ORDER BY a.nome
  `;

  db.all(sql, [ciclo_id], (err, rows) => {
    if (err) return res.json({ sucesso: false });

    res.json({
      sucesso: true,
      dados: rows.map(r => ({
        id: r.id,
        amigo_id: r.amigo_id,
        ciclo_id: r.ciclo_id,
        nome: r.nome,
        apelido: r.apelido,
        dezenas: r.numeros.split(",")
      }))
    });
  });
});

// cadastrar nova cota
app.post("/api/cotas", async (req, res) => {
  try {
    const { amigo_id, dezenas } = req.body;

    const ciclo = await ciclos.cicloAtivo();
    if (!ciclo) return res.json({ erro: "Nenhum ciclo ativo" });

    const dezenasStr = dezenas.join(",");

    db.run(
      `
      INSERT INTO amigos_cotas (amigo_id, ciclo_id, cota, numeros)
      VALUES (?, ?, 1, ?)
      `,
      [amigo_id, ciclo.id, dezenasStr],
      function (err) {
        if (err) return res.json({ erro: "Erro ao salvar" });

        res.json({ sucesso: true, id: this.lastID });
      }
    );

  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

/**
 * =============================================
 *  ROTAS — SORTEIOS
 * =============================================
 */
app.get("/api/sorteios/:ciclo_id", async (req, res) => {
  try {
    res.json(await sorteios.listarPorCiclo(req.params.ciclo_id));
  } catch {
    res.status(500).json({ erro: "Erro ao buscar sorteios" });
  }
});

// registrar sorteio
app.post("/api/sorteios", async (req, res) => {
  try {
    const { numeros } = req.body;

    if (!numeros || !Array.isArray(numeros))
      return res.json({ erro: "Informe corretamente os números" });

    const ciclo = await ciclos.cicloAtivo();
    if (!ciclo) return res.json({ erro: "Nenhum ciclo ativo" });

    const sorteioId = await sorteios.inserirSorteio(
      ciclo.id,
      numeros.join(",")
    );

    const lista = await cotas.listarCotasPorCiclo(ciclo.id);

    let houveSena = false;
    let resultados = [];

    for (const cota of lista) {

      const dezenasCota = Array.isArray(cota.numeros)
        ? cota.numeros
        : cota.numeros.toString().split(",").map(Number);

      // ACERTOS SOMENTE DO SORTEIO ATUAL
      const acertadas = dezenasCota.filter(n => numeros.includes(n));
      const acertosSorteio = acertadas.length;

      db.run(
        `
        INSERT INTO resultados (cota_id, sorteio_id, acertos, ganhou)
        VALUES (?, ?, ?, ?)
        `,
        [cota.id, sorteioId, acertosSorteio, 0]
      );

      // 🔥 BUSCA TODAS AS DEZENAS DO CICLO JÁ ACERTADAS
      const sqlHits = `
        SELECT s.numeros
        FROM resultados r
        JOIN sorteios s ON s.id = r.sorteio_id
        WHERE r.cota_id = ?
      `;

      const hits = await new Promise(resolve => {
        db.all(sqlHits, [cota.id], (err, rows) => {
          if (err || !rows) return resolve([]);

          let lista = [];

          rows.forEach(r => {
            r.numeros.split(",").forEach(num => {
              num = Number(num);

              // só entra se fizer parte da cota
              if (dezenasCota.includes(num) && !lista.includes(num)) {
                lista.push(num);
              }
            });
          });

          resolve(lista);
        });
      });

      const acumulado = hits.length;

      if (acumulado >= 6) houveSena = true;

      resultados.push({
        nome: cota.nome,
        apelido: cota.apelido,
        numeros: dezenasCota,
        acertos_sorteio: acertosSorteio,
        acumulado,
        hits
      });
    }

    resultados.sort((a, b) => b.acertos_sorteio - a.acertos_sorteio);

    // SE FECHOU SENA
    if (houveSena) {

  await ciclos.fecharCiclo(ciclo.id);

  // ==========================
  // 📊 MONTAR RELATÓRIO DO CICLO
  // ==========================

  // quem fez 6, 5, 4, 3
  const ranking = {
    sena: [],
    quina: [],
    quadra: [],
    terno: []
  };

  resultados.forEach(r => {
    if (r.acumulado >= 6) ranking.sena.push(r);
    else if (r.acumulado === 5) ranking.quina.push(r);
    else if (r.acumulado === 4) ranking.quadra.push(r);
    else if (r.acumulado === 3) ranking.terno.push(r);
  });

  // pega os números sorteados do ciclo
  const sqlNums = `
    SELECT numeros FROM sorteios WHERE ciclo_id = ?
  `;

  const numerosCiclo = await new Promise(resolve => {
    db.all(sqlNums, [ciclo.id], (err, rows) => {
      if (err || !rows) return resolve([]);

      let todos = [];
      rows.forEach(r => {
        r.numeros.split(",").forEach(n => todos.push(Number(n)));
      });

      resolve(todos);
    });
  });

  // conta mais sorteados
  const contador = {};
  numerosCiclo.forEach(n => {
    contador[n] = (contador[n] || 0) + 1;
  });

  const maisSorteados = Object.entries(contador)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 6)
    .map(([numero, qtd]) => ({ numero, qtd }));

  const historico = {
    ciclo_id: ciclo.id,
    apostadores: resultados.length,
    ranking,
    maisSorteados,
    data_fechamento: new Date().toISOString()
  };

  db.run(
    `INSERT INTO ciclos_historico (ciclo_id, data_fechamento, vencedor, resumo_json)
     VALUES (?, ?, ?, ?)`,
    [
      ciclo.id,
      historico.data_fechamento,
      ranking.sena.length ? ranking.sena.map(r => r.nome).join(", ") : null,
      JSON.stringify(historico)
    ]
  );

  // cria novo ciclo
  const novo = await ciclos.criarNovo();

  return res.json({
    ciclo_fechou: true,
    novo_ciclo: novo,
    dezenas_sorteadas: numeros,
    resultados
  });
}

    res.json({
      ciclo_fechou: false,
      dezenas_sorteadas: numeros,
      resultados
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: e.message });
  }
});










/**
 * =============================================
 *  RESULTADOS DO CICLO
 * =============================================
 */
app.get("/api/resultados/:ciclo_id", (req, res) => {
  const cicloId = req.params.ciclo_id;

  const sql = `
    SELECT 
      a.nome,
      a.apelido,
      c.numeros AS dezenas_cota,
      s.numeros AS dezenas_sorteadas,
      r.acertos,
      s.id AS sorteio_id
    FROM resultados r
    JOIN amigos_cotas c ON c.id = r.cota_id
    JOIN amigos a ON a.id = c.amigo_id
    JOIN sorteios s ON s.id = r.sorteio_id
    WHERE s.ciclo_id = ?
    ORDER BY s.id ASC
  `;

  db.all(sql, [cicloId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.json([]);
    }

    const dados = rows.map(r => ({
      nome: r.nome,
      apelido: r.apelido,
      dezenas: r.dezenas_cota.split(",").map(Number),
      dezenas_sorteadas: r.dezenas_sorteadas.split(",").map(Number),
      acertos: r.acertos,
      sorteio_id: r.sorteio_id
    }));

    res.json(dados);
  });
});

app.get("/api/ciclos/historico", (req, res) => {

  const sql = `
    SELECT 
      id,
      data_inicio,
      data_fim,
      ativo
    FROM ciclos
    WHERE ativo = 0
    ORDER BY id DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("ERRO AO LISTAR HISTÓRICO:", err);
      return res.json([]);
    }

    res.json(rows);
  });

});
app.get("/api/ciclos/:id/resumo", async (req, res) => {
  const cicloId = req.params.id;

  try {

    // TOTAL DE SORTEIOS
    const totalSorteios = await new Promise(resolve =>
      db.get(
        `SELECT COUNT(*) AS total FROM sorteios WHERE ciclo_id = ?`,
        [cicloId],
        (err, row) => resolve(row?.total || 0)
      )
    );

    // TOTAL DE JOGADORES NO CICLO
    const totalJogadores = await new Promise(resolve =>
      db.get(
        `
        SELECT COUNT(DISTINCT amigo_id) AS total
        FROM amigos_cotas
        WHERE ciclo_id = ?
      `,
        [cicloId],
        (err, row) => resolve(row?.total || 0)
      )
    );

    // GANHADOR (quem chegou em 6 acertos)
    const ganhador = await new Promise(resolve =>
      db.get(
        `
        SELECT a.nome, SUM(r.acertos) AS total
        FROM resultados r
        JOIN amigos_cotas c ON c.id = r.cota_id
        JOIN amigos a ON a.id = c.amigo_id
        JOIN sorteios s ON s.id = r.sorteio_id
        WHERE s.ciclo_id = ?
        GROUP BY a.id
        HAVING total >= 6
        ORDER BY total DESC
        LIMIT 1
      `,
        [cicloId],
        (err, row) => resolve(row || null)
      )
    );

    // ÚLTIMO SORTEIO
    const ultimo = await new Promise(resolve =>
      db.get(
        `
        SELECT numeros
        FROM sorteios
        WHERE ciclo_id = ?
        ORDER BY id DESC
        LIMIT 1
      `,
        [cicloId],
        (err, row) =>
          resolve(row?.numeros ? row.numeros.split(",").map(Number) : [])
      )
    );

    // DEZENAS MAIS SORTEADAS
    const dezenas = await new Promise(resolve =>
      db.all(
        `
        SELECT numeros
        FROM sorteios
        WHERE ciclo_id = ?
      `,
        [cicloId],
        (err, rows) => {
          if (!rows) return resolve([]);

          let mapa = {};

          rows.forEach(r => {
            r.numeros.split(",").forEach(n => {
              n = Number(n);
              mapa[n] = (mapa[n] || 0) + 1;
            });
          });

          const ranking = Object.entries(mapa)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(x => Number(x[0]));

          resolve(ranking);
        }
      )
    );

    // TOP 5 ACUMULADOS
    const top5 = await new Promise(resolve =>
      db.all(
        `
        SELECT a.nome, SUM(r.acertos) AS total
        FROM resultados r
        JOIN amigos_cotas c ON c.id = r.cota_id
        JOIN amigos a ON a.id = c.amigo_id
        JOIN sorteios s ON s.id = r.sorteio_id
        WHERE s.ciclo_id = ?
        GROUP BY a.id
        ORDER BY total DESC
        LIMIT 5
      `,
        [cicloId],
        (err, rows) => resolve(rows || [])
      )
    );

    res.json({
      total_sorteios: totalSorteios,
      total_jogadores: totalJogadores,
      ganhador: ganhador ? ganhador.nome : null,
      ultimo_sorteio: ultimo,
      top_dezenas: dezenas,
      top5
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao gerar resumo" });
  }
});





/**
 * =============================================
 *  START SERVER
 * =============================================
 */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
