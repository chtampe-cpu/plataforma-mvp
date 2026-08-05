const ESTADO_LABEL = { abierto: "Abierto", pausado: "Pausado", cerrado: "Cerrado" };
const ESTADO_HINT = {
  abierto: "Recibe postulaciones",
  pausado: "En revisión temporal",
  cerrado: "No recibe nuevas postulaciones",
};

let estudiosCache = [];
let estadosActivos = new Set(["abierto", "pausado"]);

function poblarSelect(select, valores) {
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

function iniciales(valor) {
  return valor
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function actualizarResumen() {
  const abiertos = estudiosCache.filter((e) => e.estado === "abierto").length;
  const tipos = new Set(estudiosCache.map((e) => e.tipoCancer)).size;
  const comunas = new Set(estudiosCache.map((e) => e.comuna)).size;
  const centros = new Set(estudiosCache.map((e) => e.centro)).size;

  const valores = {
    "hero-total": estudiosCache.length,
    "hero-abiertos": abiertos,
    "hero-comunas": comunas,
    "stat-abiertos": abiertos,
    "stat-cancer": tipos,
    "stat-centros": centros,
  };

  Object.entries(valores).forEach(([id, valor]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
  });
}

function crearTarjeta(estudio) {
  const a = document.createElement("a");
  a.className = `study-card study-card-${estudio.estado}`;
  a.href = `./estudio.html?id=${encodeURIComponent(estudio.id)}`;
  a.innerHTML = `
    <div class="card-visual" aria-hidden="true">
      <span>${iniciales(estudio.tipoCancer)}</span>
    </div>
    <div class="top-row">
      <span class="status-pill status-${estudio.estado}">${ESTADO_LABEL[estudio.estado] || estudio.estado}</span>
      <span class="card-phase">${estudio.fase}</span>
    </div>
    <h3>${estudio.titulo}</h3>
    <p class="card-description">${estudio.descripcionBreve}</p>
    <div class="card-meta-list">
      <div><span>Diagnóstico</span><strong>${estudio.tipoCancer}</strong></div>
      <div><span>Centro</span><strong>${estudio.centro}</strong></div>
      <div><span>Comuna</span><strong>${estudio.comuna}</strong></div>
    </div>
    <div class="card-footer">
      <span>${ESTADO_HINT[estudio.estado] || "Revisar estado"}</span>
      <strong>Ver requisitos</strong>
    </div>
  `;
  return a;
}

function aplicarFiltros() {
  const texto = document.getElementById("buscar").value.trim().toLowerCase();
  const cancer = document.getElementById("filtro-cancer").value;
  const comuna = document.getElementById("filtro-comuna").value;

  const filtrados = estudiosCache.filter((e) => {
    const campos = [e.titulo, e.tipoCancer, e.centro, e.comuna, e.descripcionBreve]
      .join(" ")
      .toLowerCase();
    if (!estadosActivos.has(e.estado)) return false;
    if (cancer && e.tipoCancer !== cancer) return false;
    if (comuna && e.comuna !== comuna) return false;
    if (texto && !campos.includes(texto)) return false;
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

function limpiarFiltros() {
  document.getElementById("buscar").value = "";
  document.getElementById("filtro-cancer").value = "";
  document.getElementById("filtro-comuna").value = "";
  estadosActivos = new Set(["abierto", "pausado"]);
  document.querySelectorAll("#filtro-estado .chip").forEach((chip) => {
    chip.setAttribute("aria-pressed", estadosActivos.has(chip.dataset.estado) ? "true" : "false");
  });
  aplicarFiltros();
}

async function init() {
  estudiosCache = await EstudiosStore.getAll();

  actualizarResumen();
  poblarSelect(document.getElementById("filtro-cancer"), [...new Set(estudiosCache.map((e) => e.tipoCancer))].sort());
  poblarSelect(document.getElementById("filtro-comuna"), [...new Set(estudiosCache.map((e) => e.comuna))].sort());

  document.getElementById("buscar").addEventListener("input", aplicarFiltros);
  document.getElementById("filtro-cancer").addEventListener("change", aplicarFiltros);
  document.getElementById("filtro-comuna").addEventListener("change", aplicarFiltros);
  document.getElementById("btn-limpiar-filtros")?.addEventListener("click", limpiarFiltros);

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
