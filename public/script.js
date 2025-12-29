console.log("✅ script.js carregado");

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

        // Chamando as funções que agora estão no escopo correto
        if (id === "tela-amigos") carregarAmigos();
        if (id === "tela-cotas") {
  carregarCotas();
  carregarAmigosParaCotas();
}

        if (id === "tela-comprovantes") carregarAmigosComprovantes();
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

async function registrarSorteio() {
   if (!validarEntrada()) {
    alert("Corrija as dezenas antes de registrar.");
    return;
  }
  const numeros = document.getElementById("inputSorteio").value.trim();
  const lista = document.getElementById("listaResultados");

  if (!numeros) {
    alert("Digite os números do sorteio");
    return;
  }

  lista.innerHTML = "<p>Processando...</p>";

  try {
    const res = await fetch("/api/sorteios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numeros })
    });

    const json = await res.json();
    lista.innerHTML = "";

    if (json.erro) {
      lista.innerHTML = `<p>${json.erro}</p>`;
      return;
    }

    if (json.ganhou) {
      const div = document.createElement("div");
      div.className = "resultado-card resultado-vencedor";

      div.innerHTML = `
        <div class="resultado-header">
          🎉 Vencedor encontrado!
        </div>

        <p><strong>Amigo:</strong> ${json.vencedor.nome || ""}</p>
        <p><strong>Números:</strong> ${json.vencedor.numeros}</p>
        <p><strong>Ciclo encerrado.</strong></p>
      `;

      lista.appendChild(div);
    } else {
      const header = document.createElement("div");
header.className = "resultado-card";

header.innerHTML = `
  <div class="resultado-header">
    Ninguém acertou as 6 dezenas.
  </div>
  <p class="resultado-acertos">Veja quem chegou perto 👇</p>
`;

lista.appendChild(header);

// agora listar amigos
json.resultados.forEach(r => {
  const div = document.createElement("div");
  div.className = "resultado-amigo";

  const dezenas = r.numeros.split(",");
  const sorteio = json.resultados[0].sorteio.split(",");

  div.innerHTML = `
    <div class="resultado-nome">
      [${r.amigo_id}] ${r.nome} ${r.apelido ? "(" + r.apelido + ")" : ""}
      — <strong>${r.acertos} acertos</strong>
    </div>

    <div class="dezenas">
      ${dezenas.map(n => `
        <span class="dezena ${sorteio.includes(n) ? "acertou" : ""}">
          ${n}
        </span>
      `).join("")}
    </div>
  `;

  lista.appendChild(div);
});

    }

  } catch (e) {
    console.error(e);
    lista.innerHTML = "<p>Erro ao registrar sorteio</p>";
  }
}
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
    window.carregarCotas = async function() {
        const ul = document.getElementById("listaCotas");
        if (!ul) return;
        ul.innerHTML = "<li>Carregando...</li>";
        const res = await fetch("/api/cotas");
        const cotas = await res.json();
        ul.innerHTML = "";

        cotas.forEach(c => {
            const li = document.createElement("li");
            li.className = "cota-item";
            li.innerHTML = `
                <div class="cota-info">
                  <strong>[${c.amigo_id}] ${c.nome}${c.apelido ? ` (${c.apelido})` : ""}</strong>
                </div>
                <div class="cota-detalhes">
                  Cota: <strong>${c.cota}</strong> dezenas<br>
                  Números: ${c.numeros.split(",").join(" ")}
                </div>
                <div class="acoes">
                  <button class="btn-editar" onclick="editarCota(${c.id})">✏️</button>
                </div>`;
            ul.appendChild(li);
        });
    };
const inputCotas = document.getElementById("cotaNumeros");
const erroCotas = document.createElement("div");
erroCotas.style.color = "#d63031";
erroCotas.style.fontSize = "12px";

inputCotas.after(erroCotas);

inputCotas.addEventListener("input", () => {
  let txt = inputCotas.value;

  // troca espaço por vírgula
  txt = txt.replace(/\s+/g, ",");

  // permite digitar ainda
  const partes = txt.split(",").filter(x => x !== "");

  let set = new Set();
  let erro = "";

  for (let p of partes) {

    if (!/^\d+$/.test(p)) continue; // deixa digitar

    let n = parseInt(p);

    if (n < 1 || n > 60) {
      erro = "As dezenas devem ser entre 01 e 60";
      break;
    }

    if (set.has(n)) {
      erro = "Não pode repetir dezenas";
      break;
    }

    set.add(n);
  }

  erroCotas.textContent = erro;
});


    // Criada para evitar erro de "function not found"
    window.editarCota = function(id) {
        console.log("Editar cota:", id);
        // Implemente a lógica de edição aqui
    };
async function carregarAmigosParaCotas() {
  console.log("🔄 carregando amigos para cotas...");

  const sel = document.getElementById("cotaAmigo");
  console.log("🎯 select encontrado?", sel);

  if (!sel) return;

  const res = await fetch("/api/amigos");
  const amigos = await res.json();

  console.log("👀 amigos recebidos:", amigos);

  sel.innerHTML = '<option value="">Selecione</option>';

  amigos.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.textContent = `[${a.id}] ${a.nome} ${a.apelido ? "(" + a.apelido + ")" : ""}`;

    console.log("➕ adicionando opção:", opt.textContent);

    sel.appendChild(opt);
  });

  console.log("📌 total de opções no select:", sel.options.length);
}




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