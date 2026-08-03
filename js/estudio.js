const ESTADO_LABEL_DETALLE = { abierto: "Abierto", pausado: "Pausado", cerrado: "Cerrado" };

function getIdDeUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function renderNoEncontrado() {
  document.getElementById("contenido-estudio").innerHTML = `
    <p class="lede">No encontramos este estudio. Puede que haya sido cerrado o el enlace esté incorrecto.</p>
    <a class="btn btn-primary" href="./index.html">Volver al catálogo</a>
  `;
}

function renderEstudio(estudio) {
  const cerrado = estudio.estado === "cerrado";
  const contenedor = document.getElementById("contenido-estudio");

  contenedor.innerHTML = `
    <div class="detail-header">
      <div class="top-row">
        <span class="eyebrow">${estudio.tipoCancer} · ${estudio.fase}</span>
        <span class="status-pill status-${estudio.estado}">${ESTADO_LABEL_DETALLE[estudio.estado] || estudio.estado}</span>
      </div>
      <h1>${estudio.titulo}</h1>
      <p class="lede">${estudio.descripcionBreve}</p>
    </div>

    <div class="detail-block">
      <h3>Centro y ubicación</h3>
      <p style="margin:0;">${estudio.centro}<br>${estudio.comuna}</p>
    </div>

    <div class="detail-block">
      <h3>Criterios de inclusión</h3>
      <ul class="criteria-list">
        ${estudio.criterios.map((c) => `<li>${c}</li>`).join("")}
      </ul>
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

    <div class="sticky-cta">
      <button class="btn btn-accent btn-block" id="btn-postular" ${cerrado ? "disabled" : ""}>
        ${cerrado ? "Reclutamiento cerrado" : "Postular a este estudio"}
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
