const ESTADO_LABEL_DETALLE = { abierto: "Abierto", pausado: "Pausado", cerrado: "Cerrado" };
const ESTADO_DESCRIPCION_DETALLE = {
  abierto: "Este estudio recibe nuevas postulaciones.",
  pausado: "El equipo puede revisar interés, pero el reclutamiento está en pausa.",
  cerrado: "Este estudio ya no recibe nuevas postulaciones.",
};

function getIdDeUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function renderNoEncontrado() {
  document.getElementById("contenido-estudio").innerHTML = `
    <div class="empty-state detail-empty">
      <p>No encontramos este estudio. Puede que haya sido cerrado o el enlace esté incorrecto.</p>
      <a class="btn btn-primary" href="./index.html">Volver al catálogo</a>
    </div>
  `;
}

function renderEstudio(estudio) {
  const cerrado = estudio.estado === "cerrado";
  const contenedor = document.getElementById("contenido-estudio");

  contenedor.innerHTML = `
    <div class="detail-hero">
      <div class="detail-hero-main">
        <div class="top-row">
          <span class="eyebrow">${estudio.tipoCancer} · ${estudio.fase}</span>
          <span class="status-pill status-${estudio.estado}">${ESTADO_LABEL_DETALLE[estudio.estado] || estudio.estado}</span>
        </div>
        <h1>${estudio.titulo}</h1>
        <p class="lede">${estudio.descripcionBreve}</p>
      </div>
      <aside class="detail-side" aria-label="Resumen del estudio">
        <span class="detail-side-label">Estado</span>
        <strong>${ESTADO_LABEL_DETALLE[estudio.estado] || estudio.estado}</strong>
        <p>${ESTADO_DESCRIPCION_DETALLE[estudio.estado] || "Revisa los datos del estudio."}</p>
      </aside>
    </div>

    <div class="journey-strip" aria-label="Flujo de postulación">
      <div><span>1</span><strong>Revisar requisitos</strong></div>
      <div><span>2</span><strong>Firmar consentimiento</strong></div>
      <div><span>3</span><strong>Contacto del centro</strong></div>
    </div>

    <div class="detail-grid">
      <div class="detail-block detail-block-highlight">
        <h3>Centro y ubicación</h3>
        <p style="margin:0;"><strong>${estudio.centro}</strong><br>${estudio.comuna}</p>
      </div>

      <div class="detail-block">
        <h3>Información del estudio</h3>
        <div class="info-grid">
          <div class="item">
            <div class="label">Patrocinador</div>
            <div class="value">${estudio.patrocinador}</div>
          </div>
          <div class="item">
            <div class="label">Última actualización</div>
            <div class="value">${estudio.actualizado}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="detail-block criteria-card">
      <h3>Criterios de inclusión</h3>
      <ul class="criteria-list">
        ${estudio.criterios.map((c) => `<li>${c}</li>`).join("")}
      </ul>
    </div>

    <div class="sticky-cta">
      <button class="btn btn-accent btn-block" id="btn-postular" ${cerrado ? "disabled" : ""}>
        ${cerrado ? "Reclutamiento cerrado" : "Postular con consentimiento informado"}
      </button>
    </div>
  `;

  if (!cerrado) {
    document.getElementById("btn-postular").addEventListener("click", () => {
      Consentimiento.abrir(estudio);
    });

    if (new URLSearchParams(window.location.search).get("demo") === "postular") {
      document.getElementById("btn-postular").click();
    }
  }
}

async function initDetalle() {
  const id = getIdDeUrl();
  if (!id) return renderNoEncontrado();
  const estudio = await EstudiosStore.getById(id);
  if (!estudio) return renderNoEncontrado();
  renderEstudio(estudio);
}

initDetalle();
