const Patologias = (() => {
  const CATEGORIAS = [
    { nombre: "Tumores sólidos frecuentes", tipos: ["Mama", "Pulmón", "Próstata"] },
    { nombre: "Cánceres hematológicos", tipos: ["Linfoma", "Mieloma múltiple", "Leucemia"] },
    { nombre: "Tumores digestivos", tipos: ["Gástrico", "Colorrectal"] },
    { nombre: "Piel y genitourinario", tipos: ["Melanoma"] },
  ];

  function categoriaDe(tipoCancer) {
    const categoria = CATEGORIAS.find((c) => c.tipos.includes(tipoCancer));
    return categoria ? categoria.nombre : "Otras patologías";
  }

  function todas() {
    return CATEGORIAS;
  }

  return { categoriaDe, todas };
})();

const EstudiosStore = (() => {
  const STORAGE_KEY = "loz_estudios_v1";
  const SEED_VERSION_KEY = "loz_estudios_seed_version";
  const SEED_VERSION = "chile-only-2026-08-05";
  const SEED_URL = "./data/estudios.json";

  async function seedFromFile() {
    const res = await fetch(SEED_URL);
    const datos = await res.json();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
    localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
    return datos;
  }

  async function getAll() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const version = localStorage.getItem(SEED_VERSION_KEY);
    if (raw && version === SEED_VERSION) {
      try {
        return JSON.parse(raw);
      } catch {
        return seedFromFile();
      }
    }
    return seedFromFile();
  }

  async function getById(id) {
    const estudios = await getAll();
    return estudios.find((e) => e.id === id) || null;
  }

  function saveAll(estudios) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estudios));
    localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
  }

  async function upsert(estudio) {
    const estudios = await getAll();
    const idx = estudios.findIndex((e) => e.id === estudio.id);
    if (idx >= 0) {
      estudios[idx] = estudio;
    } else {
      estudios.unshift(estudio);
    }
    saveAll(estudios);
    return estudios;
  }

  async function remove(id) {
    const estudios = await getAll();
    const filtered = estudios.filter((e) => e.id !== id);
    saveAll(filtered);
    return filtered;
  }

  async function resetToSeed() {
    return seedFromFile();
  }

  function nextId(estudios) {
    const nums = estudios
      .map((e) => parseInt((e.id || "").replace(/\D/g, ""), 10))
      .filter((n) => !Number.isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `est-${String(max + 1).padStart(3, "0")}`;
  }

  return { getAll, getById, saveAll, upsert, remove, resetToSeed, nextId };
})();

const ConsentimientosStore = (() => {
  const STORAGE_KEY = "loz_consentimientos_v1";

  function getAll() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  function add(registro) {
    const registros = getAll();
    registros.unshift(registro);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
    AnalyticsStore.track("consentimiento_firmado", {
      estudioId: registro.estudioId,
      estudioTitulo: registro.estudioTitulo,
      estudioPais: registro.estudioPais,
    });
    return registros;
  }

  return { getAll, add };
})();

const AnalyticsStore = (() => {
  const STORAGE_KEY = "loz_analytics_v1";
  const SESSION_KEY = "loz_visit_session_v1";

  function sessionId() {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `SES-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  function getAll() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  function saveAll(eventos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(eventos.slice(0, 500)));
  }

  function track(tipo, datos = {}) {
    const eventos = getAll();
    eventos.unshift({
      id: `EV-${Date.now().toString(36).toUpperCase()}`,
      tipo,
      datos,
      ruta: window.location.pathname + window.location.search,
      fecha: new Date().toISOString(),
      sessionId: sessionId(),
      userAgent: navigator.userAgent,
    });
    saveAll(eventos);
    return eventos;
  }

  function resumen() {
    const eventos = getAll();
    const sesiones = new Set(eventos.map((e) => e.sessionId));
    return {
      eventos,
      visitas: eventos.filter((e) => e.tipo === "page_view").length,
      sesiones: sesiones.size,
      vistasEstudio: eventos.filter((e) => e.tipo === "study_view").length,
      postulaciones: eventos.filter((e) => e.tipo === "consentimiento_firmado").length,
    };
  }

  return { track, getAll, resumen };
})();
