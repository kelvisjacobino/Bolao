function log(...msg) {
  console.log("🧾 LOG:", ...msg);
}

const express = require("express");
const cors = require("cors");
const path = require("path");
const sorteios = require("./queries/sorteios");
const db = require("./db");

const { contarAcertos } = require("./services/resultado");

const ciclos = require("./queries/ciclos");
const amigos = require("./queries/amigos");
const cotas = require("./queries/cotas");
const historico = require("./queries/historico");
const campeoes = require("./queries/campeoes");


const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// =======================
// ROTAS BÁSICAS
// =======================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// =======================
// AMIGOS
// =======================
app.get("/api/amigos", async (req, res) => {
  try {
    const lista = await amigos.listarAmigos();
    res.json(lista);
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
  const a = await amigos.buscarAmigoPorId(req.params.id);
  res.json(a);
});

app.put("/api/amigos/:id/desativar", async (req, res) => {
  await amigos.desativarAmigo(req.params.id);
  res.json({ sucesso: true });
});

app.put("/api/amigos/:id/reativar", async (req, res) => {
  await amigos.reativarAmigo(req.params.id);
  res.json({ sucesso: true });
});
app.post("/api/sorteios", async (req, res) => {
  const { numeros } = req.body;

  log("🎰 SORTEIO RECEBIDO:", numeros);

  const ciclo = await ciclos.cicloAtivo();

  if (!ciclo) {
    log("⚠️ Nenhum ciclo ativo");
    return res.json({ erro: "Nenhum ciclo ativo" });
  }

  log("📌 CICLO ATUAL:", ciclo);

  try {
    await sorteios.inserirSorteio(ciclo.id, numeros);
    log("💾 Sorteio registrado no banco");
  } catch (e) {
    log("❌ ERRO AO SALVAR SORTEIO:", e);
  }

  const lista = await cotas.listarCotasPorCiclo(ciclo.id);

  log(`👥 ${lista.length} amigos no ciclo:`);

  lista.forEach(c => {
    log(`  ➜ [${c.amigo_id}] ${c.nome} (${c.apelido || "-"}) → ${c.numeros}`);
  });

let vencedores = [];

lista.forEach(c => {
  const acertos = contarAcertos(c.numeros, numeros);

  if (acertos === 6) {
    vencedores.push(c);
  }
});


 if (vencedores.length > 0) {
    log("🔒 Fechando ciclo:", ciclo.id);
    await ciclos.fecharCiclo(ciclo.id);

    log("🚀 Abrindo novo ciclo...");
    const novo = await ciclos.criarNovo();

    return res.json({
  ganhou: true,
  vencedores
});

  }

  log("⏭️ Ninguém acertou — ciclo continua");

  res.json({ ganhou: false });
});

app.get("/api/sorteios/:ciclo_id", async (req, res) => {
  try {
    const lista = await sorteios.listarPorCiclo(req.params.ciclo_id);
    res.json(lista);
  } catch (e) {
    res.status(500).json({ erro: "Erro ao buscar sorteios" });
  }
});



// COTAS
// =======================
// ==========================
// LISTAR COTAS POR CICLO
// ==========================
app.get("/api/cotas", (req, res) => {
    const { ciclo_id } = req.query;

    if (!ciclo_id) {
        return res.json({ sucesso: false, erro: "ciclo_id obrigatório" });
    }

    const sql = `
        SELECT
            c.id,
            c.ciclo_id,
            c.dezenas,
            a.id AS amigo_id,
            a.nome,
            a.apelido
        FROM cotas c
        JOIN amigos a ON a.id = c.amigo_id
        WHERE c.ciclo_id = ?
        ORDER BY a.nome
    `;

    db.all(sql, [ciclo_id], (err, rows) => {
        if (err) {
            console.error(err);
            return res.json({ sucesso: false, erro: "Erro ao buscar cotas" });
        }

        // Agrupa por amigo
        const resultado = {};
        rows.forEach(r => {
            if (!resultado[r.amigo_id]) {
                resultado[r.amigo_id] = {
                    amigo_id: r.amigo_id,
                    nome: r.nome,
                    apelido: r.apelido,
                    cotas: []
                };
            }

            resultado[r.amigo_id].cotas.push({
                id: r.id,
                dezenas: r.dezenas.split(",")
            });
        });

        res.json({
            sucesso: true,
            dados: Object.values(resultado)
        });
    });
});


// ==========================
// CRIAR COTA
// ==========================
app.post("/api/cotas", (req, res) => {
    const { amigo_id, ciclo_id, dezenas } = req.body;

    if (!amigo_id || !ciclo_id || !Array.isArray(dezenas)) {
        return res.json({ sucesso: false, erro: "Dados inválidos" });
    }

    const dezenasStr = dezenas.join(",");

    db.run(
        `INSERT INTO cotas (amigo_id, ciclo_id, dezenas)
         VALUES (?, ?, ?)`,
        [amigo_id, ciclo_id, dezenasStr],
        function (err) {
            if (err) {
                console.error(err);
                return res.json({ sucesso: false, erro: "Erro ao salvar" });
            }

            res.json({ sucesso: true, id: this.lastID });
        }
    );
});


// =======================
// COMPROVANTES
// =======================
app.get("/api/comprovantes/:amigo_id", async (req, res) => {
  
  db.all(
    `
    SELECT h.*, a.nome, a.apelido
    FROM amigos_cotas_history h
    JOIN amigos a ON a.id = h.amigo_id
    WHERE h.amigo_id = ?
    ORDER BY h.id DESC
    `,
    [req.params.amigo_id],
    (err, rows) => {
      if (err) return res.status(500).json([]);
      res.json(rows);
    }
  );
});
// =======================
// REGISTRAR SORTEIO
// =======================
app.post("/api/sorteios", async (req, res) => {
  try {
    const { numeros } = req.body;

    if (!numeros) return res.json({ erro: "Informe os números" });

    const ciclo = await ciclos.cicloAtivo();
    if (!ciclo) return res.json({ erro: "Nenhum ciclo ativo" });

    // salvar sorteio
    await sorteios.inserir(ciclo.id, numeros);

    // pegar apostas do ciclo
    const lista = await cotas.listarCotasPorCiclo(ciclo.id);

    let vencedor = null;

    lista.forEach(c => {
      const acertos = contarAcertos(c.numeros, numeros);
      if (acertos === 6) vencedor = c;
    });

    if (vencedor) {
      // fechar
      await ciclos.fecharCiclo(ciclo.id);

      // abrir novo
      const novo = await ciclos.criarNovo();

      return res.json({
        ganhou: true,
        vencedor,
        novo_ciclo: novo
      });
    }

    res.json({ ganhou: false });

  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao registrar sorteio" });
  }
});


// =======================
app.listen(PORT, () => {
  console.log("🚀 Servidor em http://localhost:8080");
});
