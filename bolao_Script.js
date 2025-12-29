document.addEventListener("DOMContentLoaded", () => {

  const API_BASE = ""; 
  // vazio = mesmo host (funciona em localhost e conguito.ddns.net)

  let dados = [];

  // =============================
  // BUSCAR CICLO ATIVO
  // =============================
  async function carregarCiclo() {
    const res = await fetch(`${API_BASE}/api/ciclo/ativo`);
    return await res.json();
  }

  // =============================
  // BUSCAR COTAS DO CICLO
  // =============================
  async function carregarCotas() {
    const res = await fetch(`${API_BASE}/api/cotas`);
    return await res.json();
  }

  // =============================
  // FREQUÊNCIA SIMULADA (mantida)
  // =============================
  const frequency = {};
  for (let i = 1; i <= 60; i++) {
    const k = String(i).padStart(2, "0");
    frequency[k] = (Math.random() * 10).toFixed(2);
  }

  // =============================
  // GERAR TABELAS
  // =============================
  function buildTable(cota) {
    const container = document.getElementById("table-" + cota);
    const rows = dados.filter(d => d.cota === cota);

    if (rows.length === 0) {
      container.innerHTML = `<div class="empty">Nenhum participante nesta cota</div>`;
      return;
    }

    let html = `
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Números</th>
            <th>Acertos</th>
            <th>Média</th>
          </tr>
        </thead>
        <tbody>
    `;

    rows.forEach(r => {
      const nums = r.numeros.split(",").map(n => n.trim());
      const numsHTML = nums.map(n =>
        `<span class="num" data-num="${n}">${n}</span>`
      ).join(" ");

      const avg = (
        nums.reduce((s, n) => s + (parseFloat(frequency[n]) || 0), 0) /
        nums.length
      ).toFixed(2);

      html += `
        <tr>
          <td>${r.nome}</td>
          <td>${numsHTML}</td>
          <td class="hits">0</td>
          <td>${avg}</td>
        </tr>
      `;
    });

    html += "</tbody></table>";
    container.innerHTML = html;
  }

  function buildAll() {
    buildTable(6);
    buildTable(8);
    buildTable(10);
  }

  // =============================
  // INPUT DE DEZENAS (mantido)
  // =============================
  const drawInput = document.getElementById("drawInput");

  function parseDraw(input) {
    return input.split(",")
      .map(s => s.trim())
      .filter(s => s.length === 2);
  }

  // =============================
  // MARCAR SORTEIO (visual apenas)
  // =============================
  function markDraw() {
    const drawn = parseDraw(drawInput.value);
    document.querySelectorAll(".num").forEach(el => {
      if (drawn.includes(el.dataset.num)) {
        el.classList.add("hit");
      } else {
        el.classList.remove("hit");
      }
    });
  }

  function clearHighlights() {
    drawInput.value = "";
    document.querySelectorAll(".num").forEach(el =>
      el.classList.remove("hit")
    );
  }

  document.getElementById("markBtn").addEventListener("click", markDraw);
  document.getElementById("clearBtn").addEventListener("click", clearHighlights);

  // =============================
  // START
  // =============================
  async function init() {
    const ciclo = await carregarCiclo();

    if (!ciclo || !ciclo.id) {
      alert("Nenhum ciclo ativo. Abra um ciclo primeiro.");
      return;
    }

    dados = await carregarCotas();
    buildAll();
  }

  init();
});
