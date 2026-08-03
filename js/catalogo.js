const ESTADO_LABEL = { abierto: "Abierto", pausado: "Pausado", cerrado: "Cerrado" };

let estudiosCache = [];
let estadosActivos = new Set(["abierto", "pausado"]);

function poblarSelect(select, valores, etiquetaTodos) {
  const actuales = new Set(Array.from(select.options).map((o) => o.value));
  valores.forEach((v) => {
    if (!actuales.has(v)) {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    }
  });
}

function crearTarjeta(estudio) {
  const a = document.createElement("a");
  a.className = "study-card";
  a.href = `./estudio.html?id=${encodeURIComponent(estudio.id)}`;
  a.innerHTML = `
    <div class="top-row">
      <h3>${estudio.titulo}</h3>
      <span class="status-pill status-${estudio.estado}">${ESTADO_LABEL[estudio.estado] || estudio.estado}</span>
    </div>
    <div class="center">${estudio.centro} · ${estudio.comuna}</div>
    <p style="margin:0; font-size:0.86rem; color:var(--ink-soft);">${estudio.descripcionBreve}</p>
    <div class="meta">
      <span>${estudio.tipoCancer}</span>
      <span>${estudio.fase}</span>
    </div>
  `;
  return a;
}

function aplicarFiltros() {
  const texto = document.getElementById("buscar").value.trim().toLowerCase();
  const cancer = document.getElementById("filtro-cancer").value;
  const comuna = document.getElementById("filtro-comuna").value;

  const filtrados = estudiosCache.filter((e) => {
    if (!estadosActivos.has(e.estado)) return false;
    if (cancer && e.tipoCancer !== cancer) return false;
    if (comuna && e.comuna !== comuna) return false;
    if (texto && !e.titulo.toLowerCase().includes(texto) && !e.tipoCancer.toLowerCase().includes(texto)) return false;
    return true;
  });

  const grilla = document.getElementById("grilla-estudios");
  const vacio = document.getElementById("estado-vacio");
  const contador = document.getElementById("contador-resultados");

  grilla.innerHTML = "";
  filtrados.forEach((e) => grilla.appendChild(crearTarjeta(e)));

  vacio.hidden = filtrados.length > 0;
  contador.textContent = filtrados.length === 1 ? "1 estudio encontrado" : `${filtrados.length} estudios encontrados`;
}

async function init() {
  estudiosCache = await EstudiosStore.getAll();

  poblarSelect(document.getElementById("filtro-cancer"), [...new Set(estudiosCache.map((e) => e.tipoCancer))].sort());
  poblarSelect(document.getElementById("filtro-comuna"), [...new Set(estudiosCache.map((e) => e.comuna))].sort());

  document.getElementById("buscar").addEventListener("input", aplicarFiltros);
  document.getElementById("filtro-cancer").addEventListener("change", aplicarFiltros);
  document.getElementById("filtro-comuna").addEventListener("change", aplicarFiltros);

  document.querySelectorAll("#filtro-estado .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const estado = chip.dataset.estado;
      const activo = chip.getAttribute("aria-pressed") === "true";
      if (activo) {
        estadosActivos.delete(estado);
        chip.setAttribute("aria-pressed", "false");
      } else {
        estadosActivos.add(estado);
        chip.setAttribute("aria-pressed", "true");
      }
      aplicarFiltros();
    });
  });

  aplicarFiltros();
}

init();
