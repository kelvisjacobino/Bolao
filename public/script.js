console.log("✅ script.js carregado");
let cicloAtualId = 1;
// =======================
// VARIÁVEIS GLOBAIS
// =======================
let dezenasSelecionadas = [];
let qtdCotasSelecionadas = 0;



document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // NAVEGAÇÃO
    // =========================
   window.abrirTela = function (id) {
    document.querySelectorAll("section").forEach(sec => {
        sec.style.display = "none";
    });

    const tela = document.getElementById(id);
    if (tela) tela.style.display = "block";

    if (id === "telaCotas") {
        carregarAmigosParaCotas();
        carregarCotas(); // se já existir
    }
};


   

    const listaComprovantes = document.getElementById("listaComprovantes");
    listaComprovantes.innerHTML = "";

    // aqui você pega os comprovantes do localStorage, banco etc.
    const comprovantes = JSON.parse(localStorage.getItem("comprovantes")) || [];

    comprovantes.forEach(c => {

        const amigo = c.amigo;
        const ciclo = c.ciclo;
        const data = c.data;
        const numeros = c.numeros;
        const codigo = c.codigo;

        const div = document.createElement("div");
        div.className = "comprovante-termica";

        div.innerHTML = `
          <h4>🍀 Bolão</h4>

          <p><strong>Amigo:</strong> ${amigo}</p>
          <p><strong>Ciclo:</strong> ${ciclo}</p>
          <p><strong>Data:</strong> ${data}</p>

          <div class="comprovante-numeros">${numeros}</div>

          <p><strong>Código:</strong> ${codigo}</p>
        `;

        listaComprovantes.appendChild(div);
    });
async function buscarComprovantes() {
    const amigoId = document.getElementById("comprovanteAmigo")?.value;
    const listaComprovantes = document.getElementById("listaComprovantes");

    if (!amigoId) {
        alert("Selecione um amigo");
        return;
    }

    listaComprovantes.innerHTML = "<p>Buscando comprovantes...</p>";

    try {
        const res = await fetch(`/api/comprovantes/${amigoId}`);
        const dados = await res.json();

        listaComprovantes.innerHTML = "";

        if (!Array.isArray(dados) || dados.length === 0) {
            listaComprovantes.innerHTML = "<p>Nenhum comprovante encontrado</p>";
            return;
        }

        dados.forEach(h => {
            const div = document.createElement("div");
            div.className = "comprovante-termica";

            div.innerHTML = `
              <h4>🍀 Bolão</h4>

              <p><strong>Amigo:</strong> ${h.nome} ${h.apelido ? "(" + h.apelido + ")" : ""}</p>
              <p><strong>Ciclo:</strong> ${h.ciclo_id}</p>
              <p><strong>Data:</strong> ${h.data_inicio}</p>

              <div class="comprovante-numeros">${h.numeros}</div>

              <p><strong>Código:</strong> ${h.codigo_verificacao || "-"}</p>
            `;

            listaComprovantes.appendChild(div);
        });

    } catch (e) {
        listaComprovantes.innerHTML = "<p>Erro ao buscar comprovantes</p>";
        console.error(e);
    }
}
const btn = document.getElementById("btnBuscarComprovantes");
if (btn) {
    btn.addEventListener("click", buscarComprovantes);
}


    // =========================
    // AMIGOS
    // =========================

window.salvarCota = async function () {
    const amigoId = document.getElementById("amigoSelect").value;
    const qtd = parseInt(document.getElementById("qtdCotas").value);
    const dezenas = [...dezenasSelecionadas].sort((a, b) => a - b);

    if (!amigoId) {
        alert("Selecione o amigo");
        return;
    }

    if (!qtd || qtd < 6 || qtd > 20) {
        alert("Informe a quantidade de cotas (6 a 20)");
        return;
    }

    if (dezenas.length !== qtd) {
        alert(`Você deve selecionar exatamente ${qtd} dezenas`);
        return;
    }

    try {
        const res = await fetch("/api/cotas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amigo_id: amigoId,
                ciclo_id: cicloAtualId,
                qtd_cotas: qtd,
                dezenas
            })
        });

        const json = await res.json();

        if (!json.sucesso) {
            alert(json.erro || "Erro ao salvar cota");
            return;
        }

        alert("✅ Cota cadastrada com sucesso");

        dezenasSelecionadas = [];
        qtdCotasSelecionadas = 0;

        document.getElementById("qtdCotas").value = "";
        document.getElementById("amigoSelect").value = "";

        atualizarPreviewDezenas();
        atualizarContador();
        carregarCotas();

    } catch (e) {
        console.error("Erro ao salvar cota", e);
        alert("Erro inesperado ao salvar cota");
    }
};


    const formAmigo = document.getElementById("formAmigo");
    const btnCancelar = document.getElementById("btnCancelarEdicao");

    // Tornando a função acessível para o abrirTela
    window.carregarAmigos = async function() {
        const ul = document.getElementById("listaAmigos");
        if (!ul) return;

        ul.innerHTML = "<li>Carregando...</li>";
        try {
            const res = await fetch("/api/amigos");
            const amigos = await res.json();
            ul.innerHTML = "";

            if (!Array.isArray(amigos) || amigos.length === 0) {
                ul.innerHTML = "<li>Nenhum amigo cadastrado</li>";
                return;
            }

            amigos.forEach(a => {
                const li = document.createElement("li");
                li.className = `amigo ${a.ativo ? "ativo" : "inativo"}`;
                li.innerHTML = `
                    <div class="amigo-info">
                      <span class="amigo-nome">[${a.id}] ${a.nome}</span>
                      ${a.apelido ? `<span class="amigo-apelido">(${a.apelido})</span>` : ""}
                    </div>
                    <div class="acoes">
                      ${a.ativo ? `
                        <button class="btn-editar" onclick="editarAmigo(${a.id})">✏️</button>
                        <button class="btn-desativar" onclick="desativarAmigo(${a.id})">🗑️</button>
                      ` : `
                        <button onclick="reativarAmigo(${a.id})">♻️</button>
                      `}
                    </div>`;
                ul.appendChild(li);
            });
        } catch (e) { console.error("Erro ao carregar amigos", e); }
    };

    if(formAmigo) {
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
            if (json.sucesso) {
                formAmigo.reset();
                document.getElementById("amigoId").value = "";
                if(btnCancelar) btnCancelar.style.display = "none";
                carregarAmigos();
            } else {
                alert(json.erro || "Erro ao salvar amigo");
            }
        });
    }
window.carregarAmigosSelect = async function() {
    const select = document.getElementById("amigoSelect");
    if (!select) return;

    select.innerHTML = "<option>Carregando...</option>";

    try {
        const res = await fetch("/api/amigos");
        const amigos = await res.json();

        select.innerHTML = '<option value="">Selecione o amigo</option>';

        amigos
          .filter(a => a.ativo)
          .forEach(a => {
              const opt = document.createElement("option");
              opt.value = a.id;
              opt.textContent = `[${a.id}] ${a.nome}${a.apelido ? " ("+a.apelido+")" : ""}`;
              select.appendChild(opt);
          });

    } catch (e) {
        console.error("Erro ao carregar amigos no select", e);
        select.innerHTML = "<option>Erro ao carregar</option>";
    }
};

    window.editarAmigo = async function (id) {
        const res = await fetch(`/api/amigos/${id}`);
        const a = await res.json();
        document.getElementById("amigoId").value = a.id;
        document.getElementById("nome").value = a.nome;
        document.getElementById("apelido").value = a.apelido || "";
        document.getElementById("telefone").value = a.telefone || "";
        if(btnCancelar) btnCancelar.style.display = "inline";
    };

    if(btnCancelar) {
        btnCancelar.addEventListener("click", () => {
            formAmigo.reset();
            document.getElementById("amigoId").value = "";
            btnCancelar.style.display = "none";
        });
    }

    window.desativarAmigo = async function (id) {
        if (!confirm("Deseja desativar este amigo?")) return;
        const res = await fetch(`/api/amigos/${id}/desativar`, { method: "PUT" });
        const json = await res.json();
        if (json.sucesso) carregarAmigos();
    };

    window.reativarAmigo = async function (id) {
        if (!confirm("Deseja reativar este amigo?")) return;
        const res = await fetch(`/api/amigos/${id}/reativar`, { method: "PUT" });
        const json = await res.json();
        if (json.sucesso) carregarAmigos();
    };
const btnRegistrar = document.getElementById("btnRegistrarSorteio");

if (btnRegistrar) {
  btnRegistrar.addEventListener("click", registrarSorteio);
}

window.registrarSorteio = function () {
    alert("⚠️ O registro manual de sorteio está desativado.");
    return;
};

const inputSorteio = document.getElementById("inputSorteio");
const erroSorteio = document.getElementById("erroSorteio");

if (inputSorteio) {
  inputSorteio.addEventListener("input", validarEntrada);
}

function validarEntrada() {
  let value = inputSorteio.value;

  // permite apenas números e vírgula
  value = value.replace(/[^0-9,]/g, "");

  // quebra
  let partes = value.split(",");

  // lista final validada
  let numeros = [];

  const set = new Set();

  for (let i = 0; i < partes.length; i++) {
    let n = partes[i];

    // última parte: ainda digitando → não validar
    const isUltima = i === partes.length - 1;

    // se estiver vazia e for a última, ignora
    if (isUltima && (n === "" || n === "0")) {
      continue;
    }

    // se for número incompleto (ex: "6"), deixa quieto
    if (isUltima && n.length < 2) {
      continue;
    }

    // corta pra 2 dígitos
    n = n.slice(0, 2);

    // completa com zero
    n = n.padStart(2, "0");

    // validações
    if (n === "00") {
      erroSorteio.textContent = "Dezena 00 não é permitida.";
      return false;
    }

    if (parseInt(n) > 60) {
      erroSorteio.textContent = "Nenhuma dezena pode ser maior que 60.";
      return false;
    }

    if (set.has(n)) {
      erroSorteio.textContent = "Não pode repetir dezenas.";
      return false;
    }

    set.add(n);
    numeros.push(n);
  }

  // limite
  if (numeros.length > 6) {
    erroSorteio.textContent = "Digite somente 6 dezenas.";
    return false;
  }

  erroSorteio.textContent = "";
  return true;
}



    // =========================
    // COTAS
    // =========================
    window.carregarCotas = async function () {
    const container = document.getElementById("listaCotas");
    if (!container) return;

    if (!window.cicloAtualId) {
        console.warn("⚠️ cicloAtualId indefinido, usando 1");
        window.cicloAtualId = 1;
    }

    container.innerHTML = "Carregando...";

    try {
        const res = await fetch(`/api/cotas?ciclo_id=${window.cicloAtualId}`);
        const json = await res.json();

        if (!json.sucesso || !json.dados.length) {
            container.innerHTML = "<p>Nenhuma cota cadastrada</p>";
            return;
        }

        let html = "";

        json.dados.forEach(amigo => {
            html += `
              <div class="bloco-amigo">
                <strong>${amigo.nome}${amigo.apelido ? " ("+amigo.apelido+")" : ""}</strong>
                <ul>
            `;

            amigo.cotas.forEach((cota, idx) => {
                html += `
                  <li>
                    Cota ${idx + 1}:
                    ${cota.dezenas.map(d => `<span class="num">${d}</span>`).join(" ")}
                  </li>
                `;
            });

            html += "</ul></div>";
        });

        container.innerHTML = html;

    } catch (e) {
        console.error("Erro ao carregar cotas", e);
        container.innerHTML = "Erro ao carregar cotas";
    }
};

const inputCotas = document.getElementById("cotaNumeros");
const erroCotas = document.createElement("div");
erroCotas.style.color = "#d63031";
erroCotas.style.fontSize = "12px";


    // Criada para evitar erro de "function not found"
    window.editarCota = function(id) {
        console.log("Editar cota:", id);
        // Implemente a lógica de edição aqui
    };
window.carregarAmigosParaCotas = async function () {
    console.log("🔄 carregando amigos para cotas...");

    const select = document.getElementById("amigoSelect");
    if (!select) {
        console.warn("❌ select amigoSelect não encontrado");
        return;
    }

    select.innerHTML = `<option value="">Selecione o amigo</option>`;

    try {
        const res = await fetch("/api/amigos");
        const amigos = await res.json();

        console.log("👀 amigos recebidos:", amigos);

        if (!Array.isArray(amigos)) return;

        amigos
          .filter(a => a.ativo) // só ativos
          .forEach(a => {
              const opt = document.createElement("option");
              opt.value = a.id;
              opt.textContent =
                `[${a.id}] ${a.nome}${a.apelido ? " (" + a.apelido + ")" : ""}`;
              select.appendChild(opt);
          });

        console.log("📌 total de opções no select:", select.options.length);

    } catch (e) {
        console.error("Erro ao carregar amigos para cotas", e);
    }
};




async function adicionarCota() {
  console.log("➕ adicionar cota clicado");
  const amigo_id = document.getElementById("cotaAmigo").value;
  const numeros = document.getElementById("cotaNumeros").value.trim();

  if (!amigo_id) {
    alert("Selecione um amigo");
    return;
  }

  if (!numeros) {
    alert("Digite as dezenas");
    return;
  }

  const res = await fetch("/api/cotas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amigo_id,
      cota: 6,
      numeros
    })
  });

  const json = await res.json();

  if (json.sucesso) {
    document.getElementById("cotaNumeros").value = "";
    carregarCotas();
  }
}
const btnAdicionarCota = document.getElementById("btnAdicionarCota");

if (btnAdicionarCota) {
  btnAdicionarCota.addEventListener("click", adicionarCota);

}function cotaJaExiste(amigoId, cicloId, dezenas) {
  const normalizada = [...dezenas].sort().join(",");

  return data.some(c =>
    c.amigo_id === amigoId &&
    c.ciclo_id === cicloId &&
    [...c.dezenas].sort().join(",") === normalizada
  );
}
let dezenasSelecionadas = [];
function salvarCota(){
  const amigoId = Number(document.getElementById("amigoSelect").value);
  const cicloId = cicloAtualId; // você já tem ou vai ter isso
  const dezenas = dezenasSelecionadas;

  if(dezenas.length < 6){
    alert("Selecione no mínimo 6 dezenas");
    return;
  }

  if(cotaJaExiste(amigoId, cicloId, dezenas)){
    alert("❌ Essa cota já existe para esse amigo neste ciclo.\nAltere ao menos uma dezena.");
    return;
  }

  // ✅ salvar
  data.push({
    amigo_id: amigoId,
    ciclo_id: cicloId,
    dezenas: [...dezenas],
    acertos: [],
    ganhou: false
  });

  saveAll();
  buildAll();

  alert("✅ Cota cadastrada com sucesso!");
}


// =======================
// MODAL DE DEZENAS
// =======================



window.abrirModal = function () {
    const modal = document.getElementById("modalDezenas");
    if (!modal) return;

    modal.classList.remove("hidden");
    renderizarGridDezenas();
};

window.fecharModal = function () {
    const modal = document.getElementById("modalDezenas");
    if (!modal) return;

    modal.classList.add("hidden");
};

window.confirmarDezenas = function () {
    atualizarPreviewDezenas();
    fecharModal();
};


function confirmarDezenas(){
  if(dezenasSelecionadas.length < 6){
    alert("Selecione no mínimo 6 dezenas");
    return;
  }

  dezenasSelecionadas.sort();
  document.getElementById("previewDezenas").innerHTML =
    dezenasSelecionadas.map(d => `<span class="num">${d}</span>`).join(" ");

  fecharModal();
}
function atualizarContador() {
    const el = document.getElementById("contadorDezenas");
    if (!el) return;

    el.textContent =
      `${dezenasSelecionadas.length} / ${qtdCotasSelecionadas} dezenas selecionadas`;
}
function confirmarDezenas() {
    atualizarPreviewDezenas();
    atualizarContador();
    fecharModal();
}

function renderizarGridDezenas() {
    const grid = document.getElementById("gridDezenas");
    if (!grid) return;

    grid.innerHTML = "";

    for (let i = 1; i <= 60; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = i.toString().padStart(2, "0");
        btn.className = "dezena";

        if (dezenasSelecionadas.includes(i)) {
            btn.classList.add("ativa");
        }

       btn.onclick = () => {

    if (dezenasSelecionadas.includes(i)) {
        dezenasSelecionadas = dezenasSelecionadas.filter(n => n !== i);
        btn.classList.remove("ativa");
        atualizarContador();
        return;
    }

    if (dezenasSelecionadas.length >= qtdCotasSelecionadas) {
        alert(`Você só pode selecionar ${qtdCotasSelecionadas} dezenas`);
        return;
    }

    dezenasSelecionadas.push(i);
    btn.classList.add("ativa");
    atualizarContador();
};


        grid.appendChild(btn);
    }
}
function atualizarPreviewDezenas() {
    const preview = document.getElementById("previewDezenas");
    if (!preview) return;

    if (dezenasSelecionadas.length === 0) {
        preview.textContent = "Nenhuma dezena selecionada";
        return;
    }

    const ordenadas = [...dezenasSelecionadas].sort((a, b) => a - b);
    preview.textContent = ordenadas
        .map(n => n.toString().padStart(2, "0"))
        .join(", ");
}

    // =========================
    // COMPROVANTES
    // =========================
    
    window.carregarAmigosComprovantes = async function() {
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
window.imprimirTermica = function() {
    window.print();
};

    // START
    abrirTela("home");
});