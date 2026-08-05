const Consentimiento = (() => {
  let estudioActual = null;
  let dibujando = false;
  let firmaVacia = true;
  let canvas, ctx;

  function textoConsentimiento(estudio) {
    return `
      <p><strong>Consentimiento informado para postulación a estudio clínico</strong></p>
      <p>Usted está postulando al estudio "${estudio.titulo}" (${estudio.fase}), realizado en ${estudio.centro}. Este documento registra su interés en participar y su autorización para ser contactado por el equipo del estudio.</p>
      <p>La participación final en el estudio quedará sujeta a una evaluación clínica adicional realizada por el equipo médico, incluyendo la verificación de los criterios de inclusión y la firma del consentimiento informado definitivo del protocolo, según lo exige el Comité Ético Científico correspondiente.</p>
      <p>Sus datos de contacto y la información entregada serán compartidos únicamente con el centro de investigación asociado a este estudio, y tratados conforme a la normativa de protección de datos personales vigente en Chile.</p>
      <p>Usted puede retirar su postulación en cualquier momento contactando a la Fundación La Voz de los Pacientes Chile, sin que esto afecte su atención en la fundación.</p>
    `;
  }

  function resizeCanvas() {
    const wrap = canvas.parentElement;
    const ratio = window.devicePixelRatio || 1;
    const width = wrap.clientWidth;
    const height = 140;
    const firmaAnterior = !firmaVacia && canvas.width && canvas.height
      ? canvas.toDataURL("image/png")
      : null;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.strokeStyle = (getComputedStyle(document.body).getPropertyValue("--ink") || "").trim() || "#1b211d";

    if (firmaAnterior) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, width, height);
      img.src = firmaAnterior;
    }
  }

  function posDesdeEvento(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function iniciarTrazo(e) {
    dibujando = true;
    canvas.setPointerCapture(e.pointerId);
    const p = posDesdeEvento(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    document.getElementById("firma-hint").style.display = "none";
  }

  function trazar(e) {
    if (!dibujando) return;
    const p = posDesdeEvento(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    firmaVacia = false;
    document.getElementById("firma-estado").textContent = "Firma capturada";
  }

  function terminarTrazo() {
    dibujando = false;
  }

  function limpiarFirma() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    firmaVacia = true;
    document.getElementById("firma-estado").textContent = "Sin firma";
    document.getElementById("firma-hint").style.display = "flex";
  }

  async function obtenerIp() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch("https://api.ipify.org?format=json", { signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      return data.ip || "no disponible";
    } catch {
      return "no disponible (sin conexión)";
    }
  }

  function generarFolio() {
    return `CI-${Date.now().toString(36).toUpperCase()}`;
  }

  function reiniciarFormulario() {
    document.getElementById("nombre-paciente").value = "";
    document.getElementById("rut-paciente").value = "";
    document.getElementById("relacion-paciente").value = "paciente";
    document.getElementById("check-acepto").checked = false;
    limpiarFirma();
  }

  async function enviar() {
    const nombre = document.getElementById("nombre-paciente").value.trim();
    const rut = document.getElementById("rut-paciente").value.trim();
    const acepto = document.getElementById("check-acepto").checked;

    if (!nombre || !rut) {
      alert("Por favor completa tu nombre y RUT.");
      return;
    }
    if (!acepto) {
      alert("Debes aceptar el consentimiento informado para continuar.");
      return;
    }
    if (firmaVacia) {
      alert("Por favor firma en el recuadro antes de enviar.");
      return;
    }

    const btn = document.getElementById("btn-enviar-consentimiento");
    btn.disabled = true;
    btn.textContent = "Enviando…";

    const ahora = new Date();
    const ip = await obtenerIp();
    const folio = generarFolio();

    ConsentimientosStore.add({
      folio,
      estudioId: estudioActual.id,
      estudioTitulo: estudioActual.titulo,
      nombre,
      rut,
      relacion: document.getElementById("relacion-paciente").value,
      fecha: ahora.toLocaleDateString("es-CL"),
      hora: ahora.toLocaleTimeString("es-CL"),
      timestamp: ahora.toISOString(),
      ip,
      userAgent: navigator.userAgent,
      firma: canvas.toDataURL("image/png"),
    });

    btn.disabled = false;
    btn.textContent = "Firmar y enviar postulación";

    document.getElementById("vista-formulario").hidden = true;
    document.getElementById("vista-confirmacion").hidden = false;
    document.getElementById("folio-confirmacion").textContent = `Folio ${folio} · ${ahora.toLocaleDateString("es-CL")} ${ahora.toLocaleTimeString("es-CL")}`;
  }

  function cerrar() {
    document.getElementById("modal-consentimiento").hidden = true;
    document.getElementById("vista-formulario").hidden = false;
    document.getElementById("vista-confirmacion").hidden = true;
    reiniciarFormulario();
  }

  function abrir(estudio) {
    estudioActual = estudio;
    document.getElementById("modal-subtitulo").textContent = estudio.titulo;
    document.getElementById("texto-consentimiento").innerHTML = textoConsentimiento(estudio);
    document.getElementById("modal-consentimiento").hidden = false;

    canvas = document.getElementById("firma-canvas");
    canvas.parentElement.getBoundingClientRect(); // fuerza reflow para medir el ancho ya visible
    resizeCanvas();
    limpiarFirma();

    if (new URLSearchParams(window.location.search).get("demo") === "postular") {
      dibujarFirmaDemo();
    }
  }

  function dibujarFirmaDemo() {
    document.getElementById("nombre-paciente").value = "María Torres";
    document.getElementById("rut-paciente").value = "12.345.678-9";
    document.getElementById("relacion-paciente").value = "familiar";
    document.getElementById("check-acepto").checked = true;
    document.getElementById("firma-hint").style.display = "none";

    const w = canvas.clientWidth || 260;
    const h = 140;
    ctx.strokeStyle = "#1b211d";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(w * 0.08, h * 0.6);
    ctx.bezierCurveTo(w * 0.18, h * 0.2, w * 0.28, h * 0.85, w * 0.4, h * 0.5);
    ctx.bezierCurveTo(w * 0.48, h * 0.25, w * 0.55, h * 0.7, w * 0.65, h * 0.45);
    ctx.bezierCurveTo(w * 0.72, h * 0.3, w * 0.8, h * 0.55, w * 0.92, h * 0.4);
    ctx.stroke();
    firmaVacia = false;
    document.getElementById("firma-estado").textContent = "Firma capturada";
  }

  function init() {
    document.getElementById("btn-cerrar-modal").addEventListener("click", cerrar);
    document.getElementById("btn-cerrar-confirmacion").addEventListener("click", () => {
      window.location.href = "./index.html";
    });
    document.getElementById("btn-limpiar-firma").addEventListener("click", limpiarFirma);
    document.getElementById("btn-enviar-consentimiento").addEventListener("click", enviar);

    canvas = document.getElementById("firma-canvas");
    canvas.addEventListener("pointerdown", iniciarTrazo);
    canvas.addEventListener("pointermove", trazar);
    window.addEventListener("pointerup", terminarTrazo);
    window.addEventListener("resize", () => {
      if (!document.getElementById("modal-consentimiento").hidden) resizeCanvas();
    });
  }

  document.addEventListener("DOMContentLoaded", init);

  return { abrir };
})();
