const ESTADO_LABEL_ADMIN = { abierto: "Abierto", pausado: "Pausado", cerrado: "Cerrado" };

function mostrarToast(mensaje) {
  const toast = document.getElementById("toast");
  toast.textContent = mensaje;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
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

function renderTablaPostulaciones() {
  const registros = ConsentimientosStore.getAll();
  const tbody = document.getElementById("tabla-postulaciones");
  if (!registros.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--ink-faint);">Aún no hay postulaciones registradas.</td></tr>`;
    return;
  }
  tbody.innerHTML = registros.map((r) => `
    <tr>
      <td>${r.folio}</td>
      <td>${r.estudioTitulo}</td>
      <td>${r.nombre}</td>
      <td>${r.relacion === "familiar" ? "Familiar / cuidador" : "Paciente"}</td>
      <td>${r.fecha} ${r.hora}</td>
    </tr>
  `).join("");
}

function initAdmin() {
  renderTablaEstudios();
  renderTablaPostulaciones();

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

initAdmin();
