# Estudios Clínicos Oncológicos — MVP

Portal para que pacientes (o sus familiares) naveguen estudios clínicos oncológicos disponibles en Chile y postulen firmando un consentimiento informado digital.

Prototipo **MVP** para la Fundación La Voz de los Pacientes Chile. Es una app **100% cliente** (HTML/CSS/JS puro, sin frameworks ni backend): los datos viven en `localStorage` del navegador, sembrados desde `data/estudios.json`.

## Cómo correrlo localmente

Necesitas servirlo con un servidor HTTP local (no basta con abrir los `.html` con doble clic, porque el navegador bloquea el `fetch()` del JSON sobre `file://`).

**Con Python** (viene instalado en la mayoría de los equipos):

```bash
cd plataforma-mvp
python -m http.server 8000
```

Abre [http://localhost:8000](http://localhost:8000) en el navegador.

**Con Node** (alternativa si tienes `npx`):

```bash
cd plataforma-mvp
npx serve .
```

## Páginas

| Página | Descripción |
|---|---|
| `index.html` | Catálogo de estudios: buscador, filtros por tipo de cáncer, comuna y estado de reclutamiento. |
| `estudio.html?id=<id>` | Ficha de un estudio (criterios de inclusión, centro, patrocinador) con botón "Postular" que abre el consentimiento informado. |
| `admin.html` | Panel interno para crear, editar y cerrar estudios, y ver las postulaciones recibidas. |

## Flujo de consentimiento informado

Al postular a un estudio se despliega un modal con:
- Texto del consentimiento informado.
- Datos de quien postula (nombre, RUT, si es el paciente o un familiar/cuidador).
- Firma digital en un `<canvas>` (con el dedo en celular o el mouse).
- Registro automático de fecha, hora, IP (best-effort, vía API pública) y user-agent.

Cada postulación queda guardada en `localStorage` y es visible en `admin.html` → "Postulaciones recibidas".

## PWA

Incluye `manifest.json` y `sw.js` (service worker) para que la app sea instalable y cachee el shell para uso offline. El service worker solo se registra correctamente sobre `http(s)://` (no funciona abriendo el archivo directo).

## Estructura

```
plataforma-mvp/
├── index.html          Catálogo
├── estudio.html         Ficha de estudio + consentimiento
├── admin.html            Panel de administración
├── css/estilos.css       Estilos (mobile-first)
├── js/
│   ├── estudios.js       Acceso a datos (localStorage + seed)
│   ├── catalogo.js        Lógica del catálogo y filtros
│   ├── estudio.js          Lógica de la ficha de estudio
│   ├── consentimiento.js    Modal de firma y consentimiento
│   └── admin.js              CRUD del panel de administración
├── data/estudios.json     Datos de ejemplo (6 estudios oncológicos)
├── icons/                   Íconos de la PWA
├── manifest.json
└── sw.js                    Service worker
```

## Estado y próximos pasos

Este es un **prototipo cliente-only**, pensado para maquetar el flujo y presentarlo. Para producción falta:

- Backend real (base de datos, autenticación, almacenamiento seguro del consentimiento e IP real).
- Validar contra el ISP / Comité Ético Científico que cada estudio publicado esté vigente.
- Alinear el tratamiento de datos a la Ley 21.719 de Protección de Datos Personales (vigente desde el 1-dic-2026).

Detalle completo de preguntas pendientes en `Preguntas_Reunion_Miercoles.md` (carpeta del proyecto, fuera de este repo).
