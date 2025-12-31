console.log("✅ script.js carregado");

let cicloAtualId = 1;

// =======================
// VARIÁVEIS GLOBAIS
// =======================
let dezenasSelecionadas = [];
let qtdCotasSelecionadas = 0;

document.addEventListener("DOMContentLoaded",async  () => {
await carregarCicloAtual();

  // =========================
  // NAVEGAÇÃO ENTRE TELAS
  // =========================
window.abrirTela = function (id) {

  // esconde tudo
  document.querySelectorAll("section").forEach(sec => {
    sec.classList.add("hidden");
    sec.classList.remove("active");
  });

  // mostra só a escolhida
  const tela = document.getElementById(id);
  if (tela) {
    tela.classList.remove("hidden");
    tela.classList.add("active");
  }

  // COTAS
  if (id === "telaCotas") {
    carregarAmigosParaCotas();
    carregarCotas();
  }

  // COMPROVANTES
  if (id === "tela-comprovantes") {
    carregarAmigosComprovantes();
  }

  // APOSTADORES
  if (id === "tela-amigos") {
    carregarAmigos();
  }

  // SORTEIOS
  if (id === "tela-sorteios") {
    carregarCotasDoCiclo();
    carregarResultados();
  }

  // CICLOS
  if (id === "tela-ciclos") {
    carregarHistoricoCiclos();
  }
};

let comprovanteSelecionado = null; // Variável global para armazenar o comprovante selecionado

async function buscarComprovantes() {
  const amigoId = document.getElementById("comprovanteAmigo")?.value;
  const lista = document.getElementById("listaComprovantes");

  if (!amigoId) return alert("Selecione um amigo");

  lista.innerHTML = "<p>Buscando...</p>";

  try {
    const res = await fetch(`/api/comprovantes/${amigoId}`);

    // Verifica se a resposta não é ok
    if (!res.ok) {
      throw new Error(`Erro ao buscar dados: ${res.statusText}`);
    }

    const dados = await res.json();

    lista.innerHTML = "";

    if (!Array.isArray(dados) || !dados.length) {
      lista.innerHTML = "<p>Nenhum comprovante encontrado</p>";
      return;
    }

    dados.forEach(h => {
      const div = document.createElement("div");
      div.className = "comprovante-termica";

      const dataFormatada = new Date(h.data_inicio).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      div.innerHTML = `
        <h4>🍀 Bolão</h4>
        <p><strong>Amigo:</strong> ${h.nome}</p>
        <p><strong>Ciclo:</strong> ${h.ciclo_id}</p>
        <p><strong>Data de Início:</strong> ${dataFormatada}</p>
        <div class="comprovante-numeros">${h.numeros}</div>
        <p><strong>Código de Autorização:</strong> ${h.codigo_verificacao || "-"}</p>
        <button onclick="selecionarComprovante(${JSON.stringify(h)})">Selecionar para Imprimir</button>
      `;

      lista.appendChild(div);
    });

  } catch (e) {
    console.error("Erro ao buscar comprovantes", e);
    lista.innerHTML = "<p>Erro ao carregar comprovantes.</p>";
  }
}


// Função para selecionar o comprovante para impressão
function selecionarComprovante(comprovante) {
  comprovanteSelecionado = comprovante;
  document.getElementById("btnImprimirComprovante").disabled = false; // Habilita o botão de imprimir
}

// Função de impressão
document.getElementById("btnImprimirComprovante").addEventListener("click", () => {
  if (comprovanteSelecionado) {
    imprimirComprovante(comprovanteSelecionado);
  } else {
    alert("Nenhum comprovante selecionado.");
  }
});

// Função para imprimir o comprovante
function imprimirComprovante(comprovante) {
  const conteudoImpressao = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 18px;
            width: 80mm;
            margin: 0;
            padding: 0;
          }
          h1 {
            text-align: center;
            font-size: 22px;
          }
          .comprovante {
            padding: 10px;
            border: 1px solid #000;
            margin: 10px 0;
          }
          .comprovante h2, .comprovante p {
            margin: 5px 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="comprovante">
          <h1>🍀 **Comprovante do Bolão** 🍀</h1>
          <p><strong>Nome:</strong> ${comprovante.nome}</p>
          <p><strong>Ciclo:</strong> ${comprovante.ciclo_id}</p>
          <p><strong>Data de Início:</strong> ${comprovante.data_inicio}</p>
          <p><strong>Quantidade de Dezenas:</strong> ${comprovante.qtd_dezenas}</p>
          <p><strong>Dezenas:</strong> ${comprovante.dezenas.join(', ')}</p>
          <p><strong>Código de Autorização:</strong> ${comprovante.codigo_verificacao}</p>
        </div>
      </body>
    </html>
  `;
  
  const janelaImpressao = window.open('', '_blank');
  janelaImpressao.document.write(conteudoImpressao);
  janelaImpressao.document.close();
  janelaImpressao.print();
}

async function carregarCicloAtual() {
  try {
    const res = await fetch("/api/ciclo/ativo");
    const ciclo = await res.json();

    if (!ciclo || !ciclo.id) {
      console.warn("Nenhum ciclo ativo");
      return;
    }

    cicloAtualId = ciclo.id;

    const data = new Date(ciclo.data_inicio);
    const info = document.getElementById("infoCiclo");

    if (info) {
      info.textContent =
        `Ciclo #${ciclo.id} — iniciado em ` +
        data.toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
    }

  } catch (e) {
    console.error("Erro ao obter ciclo ativo", e);
  }
}

window.verDetalhesCiclo = async function (cicloId) {

  const modal = document.getElementById("modalResumo");
  const corpo = document.getElementById("conteudoResumo");

  corpo.innerHTML = "Carregando...";
  modal.classList.remove("hidden");

  try {
    const res = await fetch(`/api/ciclos/${cicloId}/resumo`);
    const dados = await res.json();

    corpo.innerHTML = `
  <h4>Ciclo #${cicloId}</h4>

  <div class="resumo-bloco">
    <p><strong>Total de sorteios:</strong> ${dados.total_sorteios}</p>
    <p><strong>Jogadores participantes:</strong> ${dados.total_jogadores}</p>
    <p><strong>Ganhador:</strong> ${
      dados.ganhador ? dados.ganhador : "— ninguém ganhou —"
    }</p>
  </div>

  <div class="resumo-bloco">
    <div class="resumo-titulo">Dezenas que mais saíram</div>
    <div class="resumo-grid">
      ${dados.top_dezenas.map(n => `
        <div class="bolinha-resumo">${String(n).padStart(2,"0")}</div>
      `).join("")}
    </div>
  </div>

  <div class="resumo-bloco">
    <div class="resumo-titulo">Último sorteio</div>
    <div class="resumo-grid">
      ${dados.ultimo_sorteio.map(n => `
        <div class="bolinha-resumo">${String(n).padStart(2,"0")}</div>
      `).join("")}
    </div>
  </div>

  <div class="resumo-bloco">
    <div class="resumo-titulo">Top 5 acumulados</div>

    ${dados.top5.length
      ? dados.top5.map(j => `
        <p>⭐ ${j.nome} — <strong>${j.total}</strong> acertos</p>
      `).join("")
      : "<p>Ninguém acumulou ainda</p>"
    }
  </div>

  <button class="btn-fechar" onclick="document.getElementById('modalResumo').classList.add('hidden')">
    Fechar
  </button>
`;

  } catch (e) {
    corpo.innerHTML = "Erro ao carregar resumo.";
  }
};





  // =========================
  // 🔹 COMPROVANTES
  // =========================
  window.carregarAmigosComprovantes = async function () {
    const select = document.getElementById("comprovanteAmigo");
    if (!select) return;

    const res = await fetch("/api/amigos");
    const amigos = await res.json();

    select.innerHTML = '<option value="">Selecione</option>';

    amigos.forEach(a => {
      const opt = document.createElement("option");
      opt.value = a.id;
      opt.textContent = `[${a.id}] ${a.nome}`;
      select.appendChild(opt);
    });
  };

 async function buscarComprovantes() {
  const amigoId = document.getElementById("comprovanteAmigo")?.value;
  const lista = document.getElementById("listaComprovantes");

  if (!amigoId) return alert("Selecione um amigo");

  lista.innerHTML = "<p>Buscando...</p>";

  try {
    const res = await fetch(`/api/comprovantes/${amigoId}`); // Verifique o formato da URL da API
    const dados = await res.json();

    lista.innerHTML = ""; // Limpa a lista antes de adicionar novos itens

    if (!Array.isArray(dados) || !dados.length) {
      lista.innerHTML = "<p>Nenhum comprovante encontrado.</p>";
      return;
    }

    dados.forEach(h => {
      const div = document.createElement("div");
      div.className = "comprovante-termica";

      // Formatação de data mais legível
      const dataFormatada = new Date(h.data_inicio).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      div.innerHTML = `
        <h4>🍀 Bolão</h4>
        <p><strong>Amigo:</strong> ${h.nome}</p>
        <p><strong>Ciclo:</strong> ${h.ciclo_id}</p>
        <p><strong>Data de Início:</strong> ${dataFormatada}</p>
        <div class="comprovante-numeros">${h.numeros}</div>
        <p><strong>Código de Autorização:</strong> ${h.codigo_verificacao || "-"}</p>
        <button onclick="imprimirComprovante(${JSON.stringify(h)})">Imprimir</button>
      `;

      lista.appendChild(div);
    });

  } catch (e) {
    console.error("Erro ao buscar comprovantes", e);
    lista.innerHTML = "<p>Erro ao carregar comprovantes.</p>";
  }
}

  document.getElementById("btnBuscarComprovantes")
    ?.addEventListener("click", buscarComprovantes);

  window.imprimirTermica = function () {
    window.print();
  };
window.carregarResultados = async function () {

  const lista = document.getElementById("resultadosSorteio");
  if (!lista) return;

  lista.innerHTML = "Carregando...";

  const res = await fetch(`/api/resultados/${cicloAtualId}`);
  const dados = await res.json();

  if (!dados.length) {
    lista.innerHTML = "<p>Nenhum resultado ainda.</p>";
    return;
  }

  let acumulado = {};

  let html = `<h3>Resultados do ciclo</h3>`;

  dados.forEach(r => {

    if (!acumulado[r.nome]) acumulado[r.nome] = 0;
    acumulado[r.nome] += r.acertos;

    html += `
      <div class="resultado-card">
        <strong>${r.nome}${r.apelido ? " (" + r.apelido + ")" : ""}</strong>
        <p>Sorteio #${r.sorteio_id} → Acertos: <strong>${r.acertos}</strong></p>
      </div>
    `;
  });

  
};



  // =========================
  // 🔹 AMIGOS
  // =========================
  const formAmigo = document.getElementById("formAmigo");
  const btnCancelar = document.getElementById("btnCancelarEdicao");

  window.carregarAmigos = async function () {
    const ul = document.getElementById("listaAmigos");
    if (!ul) return;

    ul.innerHTML = "<li>Carregando...</li>";

    try {
      const res = await fetch("/api/amigos");
      const amigos = await res.json();
      ul.innerHTML = "";

      if (!amigos.length) {
        ul.innerHTML = "<li>Nenhum amigo cadastrado</li>";
        return;
      }

      amigos.forEach(a => {
        const li = document.createElement("li");

        li.innerHTML = `
          [${a.id}] ${a.nome}
          ${a.apelido ? `(${a.apelido})` : ""}
          <button onclick="editarAmigo(${a.id})">✏️</button>
          ${a.ativo
            ? `<button onclick="desativarAmigo(${a.id})">🗑️</button>`
            : `<button onclick="reativarAmigo(${a.id})">♻️</button>`}
        `;

        ul.appendChild(li);
      });

    } catch (e) {
      console.error(e);
    }
  };

  if (formAmigo) {
    formAmigo.addEventListener("submit", async e => {
      e.preventDefault();

      const id = document.getElementById("amigoId").value;
      const nome = document.getElementById("nome").value;
      const apelido = document.getElementById("apelido").value;
      const telefone = document.getElementById("telefone").value;

      const url = id ? `/api/amigos/${id}` : "/api/amigos";
      const method = id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, apelido, telefone })
      });

      const json = await res.json();

      if (!json.sucesso) return alert("Erro ao salvar");

      formAmigo.reset();
      document.getElementById("amigoId").value = "";
      if (btnCancelar) btnCancelar.style.display = "none";

      carregarAmigos();
    });
  }

  window.editarAmigo = async function (id) {
    const res = await fetch(`/api/amigos/${id}`);
    const a = await res.json();

    document.getElementById("amigoId").value = a.id;
    document.getElementById("nome").value = a.nome;
    document.getElementById("apelido").value = a.apelido || "";
    document.getElementById("telefone").value = a.telefone || "";

    btnCancelar.style.display = "inline";
  };

  if (btnCancelar) {
    btnCancelar.addEventListener("click", () => {
      formAmigo.reset();
      document.getElementById("amigoId").value = "";
      btnCancelar.style.display = "none";
    });
  }

  window.desativarAmigo = async id => {
    if (!confirm("Desativar amigo?")) return;
    await fetch(`/api/amigos/${id}/desativar`, { method: "PUT" });
    carregarAmigos();
  };

  window.reativarAmigo = async id => {
    if (!confirm("Reativar amigo?")) return;
    await fetch(`/api/amigos/${id}/reativar`, { method: "PUT" });
    carregarAmigos();
  };


  // =========================
  // 🔹 SORTEIOS
  // =========================
  const inputSorteio = document.getElementById("inputSorteio");
  const erroSorteio = document.getElementById("erroSorteio");

  if (inputSorteio) {
    inputSorteio.addEventListener("input", validarEntrada);
  }

 function validarEntrada() {
  let value = inputSorteio.value;
  value = value.replace(/[^0-9,]/g, "");

  const partes = value.split(",");
  let numeros = [];
  const set = new Set();

  for (let i = 0; i < partes.length; i++) {

    let n = partes[i];
    const isUltima = i === partes.length - 1;

    if (isUltima && (n === "" || n.length < 2)) continue;

    n = n.slice(0, 2).padStart(2, "0");

    if (n === "00") {
      if (erroSorteio) erroSorteio.textContent = "Dezena 00 não é permitida.";
      return false;
    }

    if (parseInt(n) > 60) {
      if (erroSorteio) erroSorteio.textContent = "Nenhuma dezena pode ser maior que 60.";
      return false;
    }

    if (set.has(n)) {
      if (erroSorteio) erroSorteio.textContent = "Não pode repetir dezenas.";
      return false;
    }

    set.add(n);
    numeros.push(n);
  }

  if (numeros.length > 6) {
    if (erroSorteio) erroSorteio.textContent = "Digite somente 6 dezenas.";
    return false;
  }

  if (erroSorteio) erroSorteio.textContent = "";
  return true;
}
async function carregarCotasDoCiclo() {

  const lista = document.getElementById("resultadosSorteio");
  lista.innerHTML = "Carregando...";

  try {

    const res = await fetch(`/api/resultados/${cicloAtualId}`);
    const dados = await res.json();

    if (!dados.length) {
      lista.innerHTML = "<p>Ninguém está participando ainda.</p>";
      return;
    }

    // 🔥 Reaproveita o mesmo layout do sorteio
    mostrarResultadoDoSorteio(dados, []);
    
  } catch (e) {
    console.error(e);
    lista.innerHTML = "Erro ao carregar cotas.";
  }
}






window.registrarSorteio = async function () {

  const input = document.getElementById("inputSorteio").value;

  if (!input) {
    alert("Digite as dezenas do sorteio");
    return;
  }

  const numeros = input
    .split(",")
    .map(n => parseInt(n))
    .filter(n => !isNaN(n))
    .sort((a,b)=>a-b);

  if (numeros.length !== 6) {
    alert("O sorteio deve ter exatamente 6 dezenas.");
    return;
  }

  try {

    const res = await fetch("/api/sorteios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numeros })
    });

    const json = await res.json();

    console.log("🎯 RESPOSTA DO SORTEIO:", json);
const lista = document.getElementById("resultadosSorteio");
lista.innerHTML = "";

lista.innerHTML += `
  <h3>Resultado do sorteio</h3>
  <p><strong>Sorteadas:</strong> ${json.dezenas_sorteadas.join(", ")}</p>
`;
json.resultados.forEach(r => {

  const div = document.createElement("div");
  div.className = "resultado-card";

  div.innerHTML = `
    <h4>${r.nome}${r.apelido ? " ("+r.apelido+")" : ""}</h4>

    <p>
      Acertos no sorteio: <strong>${r.acertos_sorteio}</strong> |
      Acumulado: <strong>${r.acumulado} / 6</strong>
    </p>

    <div class="mt-2">
      ${r.numeros.map(n => `
        <span class="bolinha ${(r.hits || []).includes(n) ? "hit" : ""}">
          ${String(n).padStart(2,"0")}
        </span>
      `).join("")}
    </div>

    ${r.acumulado >= 6
      ? `<p class="text-success fw-bold mt-2">🏆 GANHOU A SENA!</p>`
      : ""}
  `;

  lista.appendChild(div);
});



    if (json.erro) {
      alert(json.erro);
      return;
    }

    alert("✔ Sorteio registrado!");




  } catch (e) {
    console.error("❌ ERRO NO FRONT:", e);
    alert("Erro inesperado no sorteio");
  }
};

async function carregarResultados() {

  const lista = document.getElementById("resultadosSorteio");
  if (!lista) return;

  lista.innerHTML = "Carregando...";

  const res = await fetch(`/api/resultados/${cicloAtualId}`);
  const dados = await res.json();

  // Se não tem sorteio ainda
  if (!dados.length) {
    lista.innerHTML = "<p>Nenhum sorteio realizado ainda.</p>";
    return;
  }

  // 👉 pega SOMENTE o último sorteio
  const ultimoSorteioId = dados[dados.length - 1].sorteio_id;

  const filtrados = dados.filter(r => r.sorteio_id === ultimoSorteioId);

  let html = `<h3>Último sorteio</h3>`;

  filtrados.forEach(r => {

    html += `
      <div class="resultado-card">
        <strong>${r.nome}${r.apelido ? " ("+r.apelido+")" : ""}</strong>
        <p>Acertos: <strong>${r.acertos}</strong></p>
      </div>
    `;
  });

  lista.innerHTML = html;
}







  // =========================
  // 🔹 COTAS
  // =========================
  window.carregarAmigosParaCotas = async function () {

    const select = document.getElementById("amigoSelect");
    if (!select) return;

    select.innerHTML = `<option value="">Selecione</option>`;

    const res = await fetch("/api/amigos");
    const amigos = await res.json();

    amigos.filter(a => a.ativo).forEach(a => {
      const opt = document.createElement("option");
      opt.value = a.id;
      opt.textContent = `[${a.id}] ${a.nome}${a.apelido ? " (" + a.apelido + ")" : ""}`;
      select.appendChild(opt);
    });
  };


  window.carregarCotas = async function () {
    const container = document.getElementById("listaCotas");
    if (!container) return;

    container.innerHTML = "Carregando...";

    try {
      const res = await fetch(`/api/cotas?ciclo_id=${cicloAtualId}`);
const json = await res.json();

console.log("📌 API /cotas resposta:", json);


      if (!json.sucesso || !json.dados.length) {
        container.innerHTML = "<p>Nenhuma cota cadastrada</p>";
        return;
      }

      let html = "";

     json.dados.forEach(cota => {

  html += `
    <div class="bloco-amigo">
      <strong>${cota.nome}${cota.apelido ? " ("+cota.apelido+")" : ""}</strong>
      <p>
        ${cota.dezenas
          .map(d => `<span class="num">${d}</span>`)
          .join(" ")}
      </p>
    </div>
  `;

});


      container.innerHTML = html;

    } catch (e) {
      console.error(e);
      container.innerHTML = "Erro ao carregar";
    }
  };


  window.salvarCota = async function () {
    const amigoId = document.getElementById("amigoSelect").value;
    const qtd = parseInt(document.getElementById("qtdCotas").value);
    const dezenas = [...dezenasSelecionadas].sort((a, b) => a - b);

    if (!amigoId) return alert("Selecione o amigo");
    if (!qtd || qtd < 6 || qtd > 20) return alert("Quantidade inválida");
    if (dezenas.length !== qtd) return alert(`Selecione exatamente ${qtd} dezenas`);

    try {
      const res = await fetch("/api/cotas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amigo_id: amigoId,
          ciclo_id: cicloAtualId,
          dezenas
        })
      });

      const json = await res.json();

      if (!json.sucesso) return alert(json.erro || "Erro ao salvar");

      dezenasSelecionadas = [];
      qtdCotasSelecionadas = 0;

      document.getElementById("qtdCotas").value = "";
      atualizarPreviewDezenas();
      atualizarContador();
      carregarCotas();

      alert("✔ Cota salva!");

    } catch (e) {
      console.error(e);
      alert("Erro inesperado");
    }
  };


  // =========================
  // MODAL DE DEZENAS
  // =========================
  window.abrirModal = function () {
    document.getElementById("modalDezenas").classList.remove("hidden");
    renderizarGridDezenas();
  };

  window.fecharModal = function () {
    document.getElementById("modalDezenas").classList.add("hidden");
  };
window.fecharResumo = function(){
  document.getElementById("modalResumoCiclo").classList.add("hidden");
};

  function renderizarGridDezenas() {
    const grid = document.getElementById("gridDezenas");
    grid.innerHTML = "";

    for (let i = 1; i <= 60; i++) {
      const btn = document.createElement("button");
      btn.className = "dezena";
      btn.textContent = i.toString().padStart(2, "0");

      if (dezenasSelecionadas.includes(i))
        btn.classList.add("ativa");

      btn.onclick = () => {
        if (btn.classList.contains("ativa")) {
          dezenasSelecionadas = dezenasSelecionadas.filter(n => n !== i);
          btn.classList.remove("ativa");
        } else {
          if (dezenasSelecionadas.length >= qtdCotasSelecionadas)
            return alert(`Você só pode selecionar ${qtdCotasSelecionadas}`);

          dezenasSelecionadas.push(i);
          btn.classList.add("ativa");
        }

        atualizarContador();
      };

      grid.appendChild(btn);
    }
  }

  window.confirmarDezenas = function () {
    atualizarPreviewDezenas();
    fecharModal();
  };

  function atualizarPreviewDezenas() {
    const el = document.getElementById("previewDezenas");

    if (!dezenasSelecionadas.length) {
      el.textContent = "Nenhuma dezena selecionada";
      return;
    }

    el.innerHTML = dezenasSelecionadas
      .sort((a, b) => a - b)
      .map(n => `<span class="num">${n.toString().padStart(2, "0")}</span>`)
      .join(" ");
  }
async function carregarCotasDoCiclo() {

  const lista = document.getElementById("cotasDoCiclo");
  if (!lista) return; 
  lista.innerHTML = "Carregando...";

  try {

    const res = await fetch(`/api/cotas?ciclo_id=${cicloAtualId}`);
    const json = await res.json();

    console.log("API /cotas resposta:", json);

    if (!json.sucesso || !json.dados.length) {
      lista.innerHTML = "<p>Ninguém está participando ainda</p>";
      return;
    }

    let html = "";
json.dados.forEach(c => {
  html += `
    <div class="card p-2 mb-2">
      <strong>${c.nome}${c.apelido ? " ("+c.apelido+")" : ""}</strong><br>
      ${c.dezenas.join(", ")}
    </div>
  `;
});

   
    lista.innerHTML = html;

  } catch (e) {
    console.error(e);
    lista.innerHTML = "Erro ao carregar cotas.";
  }
}



  function atualizarContador() {
    document.getElementById("contadorDezenas").textContent =
      `${dezenasSelecionadas.length} / ${qtdCotasSelecionadas} dezenas selecionadas`;
  }
document.getElementById("qtdCotas")?.addEventListener("input", e => {
  qtdCotasSelecionadas = parseInt(e.target.value) || 0;
  atualizarContador();
});
window.carregarHistoricoCiclos = async function () {

  console.log("🔎 carregando histórico...");

  const lista = document.getElementById("listaCiclos");
  if (!lista) return;

  lista.innerHTML = "Carregando...";

  try {
    const res = await fetch("/api/ciclos/historico");
    const dados = await res.json();

    console.log("📌 HISTÓRICO:", dados);
    document.getElementById("listaCiclos").innerHTML = "Renderizando...";


    if (!dados.length) {
      lista.innerHTML = "<p>Nenhum ciclo finalizado ainda.</p>";
      return;
    }

    let html = "";

    dados.forEach(c => {

      const inicio = new Date(c.data_inicio).toLocaleString("pt-BR");
      const fim = new Date(c.data_fim).toLocaleString("pt-BR");
html += `
  <div class="card p-3 mb-2 shadow-sm">

    <div class="d-flex justify-content-between align-items-center">

      <h5 class="mb-0">Ciclo #${c.id}</h5>

      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-success"
          onclick="verDetalhesCiclo(${c.id})">
          Ver detalhes
        </button>

        <span class="badge bg-danger">Encerrado</span>
      </div>

    </div>

    <div class="ciclo-info mt-2">
      <p><strong>Início:</strong> ${inicio}</p>
      <p><strong>Fim:</strong> ${fim}</p>
    </div>

  </div>
`;


      
    });

    lista.innerHTML = html;

  } catch (e) {
    console.error(e);
    lista.innerHTML = "Erro ao carregar histórico.";
  }
};
function gerarCodigoAutorizacao() {
  const data = new Date();
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  const hora = String(data.getHours()).padStart(2, '0');
  const minuto = String(data.getMinutes()).padStart(2, '0');
  const segundo = String(data.getSeconds()).padStart(2, '0');
  
  // Exemplo de código: "20251229-152347"
  return `${ano}${mes}${dia}-${hora}${minuto}${segundo}`;
}
function gerarComprovante(cota) {
  const codigoAutorizacao = gerarCodigoAutorizacao();
  const dataInicioCiclo = new Date(cota.data_inicio);
  
  const comprovante = `
    🎰 **Comprovante do Bolão**
    
    -----------------------------------
    **Nome:** ${cota.amigo_nome}
    **Número do Ciclo:** ${cota.ciclo_id}
    **Data de Início do Ciclo:** ${dataInicioCiclo.toLocaleString()}
    
    **Quantidade de Dezenas:** ${cota.qtd_dezenas}
    **Dezenas:** ${cota.dezenas.join(', ')}
    
    **Código de Autorização:** ${codigoAutorizacao}
    
    -----------------------------------
    **Obrigado por participar!**
  `;
  
  return comprovante;
}
function imprimirComprovante(cota) {
  const comprovante = gerarComprovante(cota);
  
  const conteudoImpressao = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 18px;
            width: 80mm;
            margin: 0;
            padding: 0;
          }
          h1 {
            text-align: center;
            font-size: 22px;
          }
          .comprovante {
            padding: 10px;
            border: 1px solid #000;
            margin: 10px 0;
          }
          .comprovante h2, .comprovante p {
            margin: 5px 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="comprovante">
          <h1>🎰 **Comprovante do Bolão** 🎰</h1>
          <p><strong>Nome:</strong> ${cota.amigo_nome}</p>
          <p><strong>Ciclo:</strong> ${cota.ciclo_id}</p>
          <p><strong>Data de Início:</strong> ${new Date(cota.data_inicio).toLocaleString()}</p>
          <p><strong>Quantidade de Dezenas:</strong> ${cota.qtd_dezenas}</p>
          <p><strong>Dezenas:</strong> ${cota.dezenas.join(', ')}</p>
          <p><strong>Código de Autorização:</strong> ${gerarCodigoAutorizacao()}</p>
        </div>
      </body>
    </html>
  `;
  
  const janelaImpressao = window.open('', '_blank');
  janelaImpressao.document.write(conteudoImpressao);
  janelaImpressao.document.close();
  janelaImpressao.print();
}
window.imprimirComprovante = function (comprovante) {
  const conteudoImpressao = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 18px;
            width: 80mm;
            margin: 0;
            padding: 0;
          }
          h1 {
            text-align: center;
            font-size: 22px;
          }
          .comprovante {
            padding: 10px;
            border: 1px solid #000;
            margin: 10px 0;
          }
          .comprovante h2, .comprovante p {
            margin: 5px 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="comprovante">
          <h1>🍀 **Comprovante do Bolão** 🍀</h1>
          <p><strong>Nome:</strong> ${comprovante.nome}</p>
          <p><strong>Ciclo:</strong> ${comprovante.ciclo_id}</p>
          <p><strong>Data de Início:</strong> ${comprovante.data_inicio}</p>
          <p><strong>Quantidade de Dezenas:</strong> ${comprovante.qtd_dezenas}</p>
          <p><strong>Dezenas:</strong> ${comprovante.dezenas.join(', ')}</p>
          <p><strong>Código de Autorização:</strong> ${comprovante.codigo_verificacao}</p>
        </div>
      </body>
    </html>
  `;
  
  const janelaImpressao = window.open('', '_blank');
  janelaImpressao.document.write(conteudoImpressao);
  janelaImpressao.document.close();
  janelaImpressao.print();
}



  // =========================
  // START
  // =========================
  abrirTela("home");
});
