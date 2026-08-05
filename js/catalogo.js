const ESTADO_LABEL = { abierto: "Abierto", pausado: "Pausado", cerrado: "Cerrado" };
const ESTADO_HINT = {
  abierto: "Recibe postulaciones",
  pausado: "En revisión temporal",
  cerrado: "No recibe nuevas postulaciones",
};

let estudiosCache = [];
let estadosActivos = new Set(["abierto", "pausado"]);

function poblarSelectCategorias(select, estudios) {
  const tiposDisponibles = new Set(estudios.map((e) => e.tipoCancer));
  Patologias.todas().forEach((categoria) => {
    const tipos = categoria.tipos.filter((tipo) => tiposDisponibles.has(tipo));
    if (!tipos.length) return;
    const grupo = document.createElement("optgroup");
    grupo.label = categoria.nombre;
    tipos.forEach((tipo) => {
      const opt = document.createElement("option");
      opt.value = tipo;
      opt.textContent = tipo;
      grupo.appendChild(opt);
    });
    select.appendChild(grupo);
  });
}

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
  const paises = new Set(estudiosCache.map((e) => e.pais || "Chile")).size;

  const valores = {
    "hero-total": estudiosCache.length,
    "hero-abiertos": abiertos,
    "hero-paises": paises,
    "stat-abiertos": abiertos,
    "stat-cancer": tipos,
    "stat-paises": paises,
  };

  Object.entries(valores).forEach(([id, valor]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
  });

  renderCategorias();
}

function renderCategorias() {
  const contenedor = document.getElementById("resumen-categorias");
  if (!contenedor) return;

  const categorias = Patologias.todas().map((categoria) => {
    const estudios = estudiosCache.filter((e) => categoria.tipos.includes(e.tipoCancer));
    const abiertos = estudios.filter((e) => e.estado === "abierto").length;
    const paises = new Set(estudios.map((e) => e.pais || "Chile")).size;
    return { ...categoria, total: estudios.length, abiertos, paises };
  }).filter((c) => c.total > 0);

  contenedor.innerHTML = categorias.map((c) => `
    <button class="category-card" type="button" data-categoria="${c.nombre}">
      <span>${c.nombre}</span>
      <strong>${c.total}</strong>
      <small>${c.abiertos} reclutando · ${c.paises} países · ${c.tipos.join(", ")}</small>
    </button>
  `).join("");

  contenedor.querySelectorAll(".category-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      const categoria = Patologias.todas().find((c) => c.nombre === btn.dataset.categoria);
      const primerTipo = categoria?.tipos.find((tipo) => estudiosCache.some((e) => e.tipoCancer === tipo));
      if (!primerTipo) return;
      document.getElementById("filtro-cancer").value = primerTipo;
      aplicarFiltros();
      document.getElementById("grilla-estudios").scrollIntoView({ behavior: "smooth" });
    });
  });
}

function crearTarjeta(estudio) {
  const categoria = Patologias.categoriaDe(estudio.tipoCancer);
  const pais = estudio.pais || "Chile";
  const a = document.createElement("a");
  a.className = `study-card study-card-${estudio.estado}`;
  a.href = `./estudio.html?id=${encodeURIComponent(estudio.id)}`;
  a.addEventListener("click", () => AnalyticsStore.track("study_click", { estudioId: estudio.id, estudioTitulo: estudio.titulo, pais }));
  a.innerHTML = `
    <div class="card-visual" aria-hidden="true">
      <span>${iniciales(estudio.tipoCancer)}</span>
    </div>
    <div class="top-row">
      <span class="status-pill status-${estudio.estado}">${ESTADO_LABEL[estudio.estado] || estudio.estado}</span>
      <span class="card-phase">${estudio.fase}</span>
    </div>
    <span class="category-tag">${categoria} · ${pais}</span>
    <h3>${estudio.titulo}</h3>
    <p class="card-description">${estudio.descripcionBreve}</p>
    <div class="card-meta-list">
      <div><span>Diagnóstico</span><strong>${estudio.tipoCancer}</strong></div>
      <div><span>Centro</span><strong>${estudio.centro}</strong></div>
      <div><span>Ubicación</span><strong>${estudio.comuna}, ${pais}</strong></div>
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
  const paisFiltro = document.getElementById("filtro-pais").value;
  const cancer = document.getElementById("filtro-cancer").value;
  const comuna = document.getElementById("filtro-comuna").value;

  const filtrados = estudiosCache.filter((e) => {
    const pais = e.pais || "Chile";
    const campos = [e.titulo, e.tipoCancer, Patologias.categoriaDe(e.tipoCancer), e.centro, e.comuna, pais, e.descripcionBreve]
      .join(" ")
      .toLowerCase();
    if (!estadosActivos.has(e.estado)) return false;
    if (paisFiltro && pais !== paisFiltro) return false;
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
  document.getElementById("filtro-pais").value = "";
  document.getElementById("filtro-cancer").value = "";
  document.getElementById("filtro-comuna").value = "";
  estadosActivos = new Set(["abierto", "pausado"]);
  document.querySelectorAll("#filtro-estado .chip").forEach((chip) => {
    chip.setAttribute("aria-pressed", estadosActivos.has(chip.dataset.estado) ? "true" : "false");
  });
  aplicarFiltros();
}

async function init() {
  AnalyticsStore.track("page_view", { pagina: "catalogo" });
  estudiosCache = await EstudiosStore.getAll();

  actualizarResumen();
  poblarSelect(document.getElementById("filtro-pais"), [...new Set(estudiosCache.map((e) => e.pais || "Chile"))].sort());
  poblarSelectCategorias(document.getElementById("filtro-cancer"), estudiosCache);
  poblarSelect(document.getElementById("filtro-comuna"), [...new Set(estudiosCache.map((e) => e.comuna))].sort());

  document.getElementById("buscar").addEventListener("input", aplicarFiltros);
  document.getElementById("filtro-pais").addEventListener("change", aplicarFiltros);
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
