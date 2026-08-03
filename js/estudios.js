const EstudiosStore = (() => {
  const STORAGE_KEY = "loz_estudios_v1";
  const SEED_URL = "./data/estudios.json";

  async function seedFromFile() {
    const res = await fetch(SEED_URL);
    const datos = await res.json();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
    return datos;
  }

  async function getAll() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
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
    return registros;
  }

  return { getAll, add };
})();
