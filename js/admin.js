const ESTADO_LABEL_ADMIN = { abierto: "Abierto", pausado: "Pausado", cerrado: "Cerrado" };
const ADMIN_USER = "admin";
const ADMIN_PASS = "qaz493500";
const ADMIN_SESSION_KEY = "loz_admin_session_v1";
let adminInicializado = false;
let consentimientosCache = [];

function mostrarToast(mensaje) {
  const toast = document.getElementById("toast");
  toast.textContent = mensaje;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function estaAutenticado() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "activa";
}

function mostrarPanel() {
  document.getElementById("admin-login").hidden = true;
  document.getElementById("admin-app").hidden = false;
  document.getElementById("btn-logout").hidden = false;
  if (!adminInicializado) initAdmin();
}

function cerrarSesion() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  window.location.reload();
}

function initLogin() {
  const formLogin = document.getElementById("form-login");
  const error = document.getElementById("login-error");

  document.getElementById("btn-logout").addEventListener("click", cerrarSesion);

  if (estaAutenticado()) {
    mostrarPanel();
    return;
  }

  document.getElementById("login-usuario").focus();
  formLogin.addEventListener("submit", (e) => {
    e.preventDefault();
    const usuario = document.getElementById("login-usuario").value.trim();
    const clave = document.getElementById("login-clave").value;

    if (usuario === ADMIN_USER && clave === ADMIN_PASS) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "activa");
      error.hidden = true;
      mostrarPanel();
      mostrarToast("Sesión iniciada");
      return;
    }

    error.hidden = false;
    document.getElementById("login-clave").value = "";
    document.getElementById("login-clave").focus();
  });
}

function limpiarFormulario() {
  document.getElementById("f-id").value = "";
  document.getElementById("f-titulo").value = "";
  document.getElementById("f-cancer").value = "";
  document.getElementById("f-fase").value = "";
  document.getElementById("f-centro").value = "";
  document.getElementById("f-comuna").value = "";
  document.getElementById("f-estado").value = "abierto";
  document.getElementById("f-patrocinador").value = "";
  document.getElementById("f-descripcion").value = "";
  document.getElementById("f-criterios").value = "";
}

function cargarEnFormulario(estudio) {
  document.getElementById("f-id").value = estudio.id;
  document.getElementById("f-titulo").value = estudio.titulo;
  document.getElementById("f-cancer").value = estudio.tipoCancer;
  document.getElementById("f-fase").value = estudio.fase;
  document.getElementById("f-centro").value = estudio.centro;
  document.getElementById("f-comuna").value = estudio.comuna;
  document.getElementById("f-estado").value = estudio.estado;
  document.getElementById("f-patrocinador").value = estudio.patrocinador || "";
  document.getElementById("f-descripcion").value = estudio.descripcionBreve;
  document.getElementById("f-criterios").value = (estudio.criterios || []).join("\n");
}

function leerFormulario() {
  const criterios = document.getElementById("f-criterios").value
    .split("\n")
    .map((c) => c.trim())
    .filter(Boolean);

  return {
    titulo: document.getElementById("f-titulo").value.trim(),
    tipoCancer: document.getElementById("f-cancer").value.trim(),
    fase: document.getElementById("f-fase").value.trim(),
    centro: document.getElementById("f-centro").value.trim(),
    comuna: document.getElementById("f-comuna").value.trim(),
    estado: document.getElementById("f-estado").value,
    patrocinador: document.getElementById("f-patrocinador").value.trim(),
    descripcionBreve: document.getElementById("f-descripcion").value.trim(),
    criterios,
    actualizado: new Date().toISOString().slice(0, 10),
  };
}

async function renderTablaEstudios() {
  const estudios = await EstudiosStore.getAll();
  const tbody = document.getElementById("tabla-estudios");
  tbody.innerHTML = estudios.map((e) => `
    <tr>
      <td>${e.titulo}</td>
      <td>${e.tipoCancer}</td>
      <td>${Patologias.categoriaDe(e.tipoCancer)}</td>
      <td><span class="status-pill status-${e.estado}">${ESTADO_LABEL_ADMIN[e.estado] || e.estado}</span></td>
      <td>${e.comuna}</td>
      <td>${e.actualizado}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-accion="editar" data-id="${e.id}">Editar</button>
          <button class="icon-btn" data-accion="eliminar" data-id="${e.id}">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join("");

  document.getElementById("contador-estudios").textContent =
    estudios.length === 1 ? "1 estudio" : `${estudios.length} estudios`;

  tbody.querySelectorAll("[data-accion='editar']").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const estudio = await EstudiosStore.getById(btn.dataset.id);
      cargarEnFormulario(estudio);
      document.getElementById("form-estudio").hidden = false;
      document.getElementById("form-estudio").scrollIntoView({ behavior: "smooth" });
    });
  });

  tbody.querySelectorAll("[data-accion='eliminar']").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar este estudio del catálogo?")) return;
      await EstudiosStore.remove(btn.dataset.id);
      mostrarToast("Estudio eliminado");
      renderTablaEstudios();
    });
  });
}

function renderMetricas() {
  const resumen = AnalyticsStore.resumen();
  document.getElementById("metric-visitas").textContent = resumen.visitas;
  document.getElementById("metric-sesiones").textContent = resumen.sesiones;
  document.getElementById("metric-fichas").textContent = resumen.vistasEstudio;
  document.getElementById("metric-consentimientos").textContent = ConsentimientosStore.getAll().length;
}

function renderTablaEventos() {
  const eventos = AnalyticsStore.getAll().slice(0, 12);
  const tbody = document.getElementById("tabla-eventos");
  if (!eventos.length) {
    tbody.innerHTML = `<tr><td colspan="3" style="color:var(--ink-faint);">Aún no hay eventos registrados.</td></tr>`;
    return;
  }
  tbody.innerHTML = eventos.map((e) => `
    <tr>
      <td>${e.tipo}</td>
      <td>${e.ruta}</td>
      <td>${new Date(e.fecha).toLocaleString("es-CL")}</td>
    </tr>
  `).join("");
}

function abrirConsentimiento(folio) {
  const registro = consentimientosCache.find((r) => r.folio === folio);
  if (!registro) return;
  const detalle = document.getElementById("detalle-consentimiento-admin");
  detalle.innerHTML = `
    <div class="consent-record-grid">
      <div><span>Folio</span><strong>${registro.folio}</strong></div>
      <div><span>Fecha y hora</span><strong>${registro.fecha} ${registro.hora}</strong></div>
      <div><span>Firmante</span><strong>${registro.nombre}</strong></div>
      <div><span>RUT</span><strong>${registro.rut}</strong></div>
      <div><span>Relación</span><strong>${registro.relacion === "familiar" ? "Familiar / cuidador" : "Paciente"}</strong></div>
      <div><span>IP registrada</span><strong>${registro.ip}</strong></div>
    </div>
    <div class="consent-record-study">
      <span>Estudio</span>
      <strong>${registro.estudioTitulo}</strong>
    </div>
    <div class="signature-preview">
      <span>Firma digital</span>
      <img src="${registro.firma}" alt="Firma digital del consentimiento ${registro.folio}">
    </div>
    <p class="consent-meta">User-agent: ${registro.userAgent || "no disponible"}</p>
  `;
  document.getElementById("modal-consentimiento-admin").hidden = false;
}

function renderTablaPostulaciones() {
  consentimientosCache = ConsentimientosStore.getAll();
  const tbody = document.getElementById("tabla-postulaciones");
  if (!consentimientosCache.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--ink-faint);">Aún no hay consentimientos registrados.</td></tr>`;
    return;
  }
  tbody.innerHTML = consentimientosCache.map((r) => `
    <tr>
      <td>${r.folio}</td>
      <td>${r.estudioTitulo}</td>
      <td>${r.nombre}<br><small>${r.relacion === "familiar" ? "Familiar / cuidador" : "Paciente"}</small></td>
      <td>${r.rut}</td>
      <td>${r.fecha} ${r.hora}</td>
      <td>${r.ip}</td>
      <td><button class="icon-btn" data-consentimiento="${r.folio}">Ver firma</button></td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-consentimiento]").forEach((btn) => {
    btn.addEventListener("click", () => abrirConsentimiento(btn.dataset.consentimiento));
  });
}

function initAdmin() {
  adminInicializado = true;
  AnalyticsStore.track("page_view", { pagina: "admin" });
  renderMetricas();
  renderTablaEstudios();
  renderTablaPostulaciones();
  renderTablaEventos();

  document.getElementById("btn-cerrar-consentimiento-admin").addEventListener("click", () => {
    document.getElementById("modal-consentimiento-admin").hidden = true;
  });

  document.getElementById("btn-nuevo").addEventListener("click", () => {
    limpiarFormulario();
    document.getElementById("form-estudio").hidden = false;
    document.getElementById("form-estudio").scrollIntoView({ behavior: "smooth" });
  });

  document.getElementById("btn-cancelar-form").addEventListener("click", () => {
    document.getElementById("form-estudio").hidden = true;
  });

  document.getElementById("form-estudio").addEventListener("submit", async (e) => {
    e.preventDefault();
    const datos = leerFormulario();
    const idExistente = document.getElementById("f-id").value;

    if (idExistente) {
      datos.id = idExistente;
    } else {
      const estudios = await EstudiosStore.getAll();
      datos.id = EstudiosStore.nextId(estudios);
    }

    await EstudiosStore.upsert(datos);
    document.getElementById("form-estudio").hidden = true;
    mostrarToast(idExistente ? "Estudio actualizado" : "Estudio creado");
    renderTablaEstudios();
  });

  document.getElementById("btn-restablecer").addEventListener("click", async () => {
    if (!confirm("Esto reemplazará los estudios actuales por los datos de ejemplo. ¿Continuar?")) return;
    await EstudiosStore.resetToSeed();
    mostrarToast("Datos de ejemplo restablecidos");
    renderTablaEstudios();
  });
}

initLogin();
