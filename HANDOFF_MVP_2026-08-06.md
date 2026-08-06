# Handoff MVP - 2026-08-06

## Enlace publico

- Home: https://chtampe-cpu.github.io/plataforma-mvp/?v=82ce7af
- Administracion: https://chtampe-cpu.github.io/plataforma-mvp/admin.html?v=82ce7af
- Ultimo commit verificado en GitHub Pages: `82ce7af`
- Estado Pages verificado: `built`

## Estado actual

El MVP publico quedo enfocado solo en Chile. Se retiraron del catalogo publico los paises no confirmados y cualquier copy que sugiriera cobertura regional.

Verificaciones realizadas en produccion:

- Home sin texto `regional`.
- Home sin filtro de pais.
- Home sin indicador `paises`.
- JSON publico sin Argentina, Colombia, Peru, Mexico ni Uruguay.
- Catalogo publico usa indicadores de estudios, abiertos, tipos de cancer y centros.
- Seed actualizado a `chile-only-2026-08-05` para forzar refresco de datos en navegadores que ya hubieran cargado versiones anteriores.

## Decisiones tomadas

- El contenido formal del MVP se interpreta como Chile-only.
- Las menciones de otros paises no se tratan como informacion del cliente para publicar estudios.
- El panel de administracion puede conservar campo Pais como dato interno/futuro, pero el catalogo publico no muestra filtro de pais ni estudios fuera de Chile.
- Las credenciales de demo se muestran solo al entrar a `admin.html`, no en la portada.

## Funcionalidad incluida

- Catalogo de estudios clinicos oncologicos demo.
- Filtros por patologia, ciudad/comuna y estado de reclutamiento.
- Patologias agrupadas por categoria.
- Ficha de estudio con requisitos.
- Flujo de postulacion con consentimiento informado digital, firma, folio, IP, fecha/hora y user-agent.
- Administracion con login demo, CRUD de estudios, analitica local de visitas/eventos y registro de consentimientos.

## Pendientes para manana

- Revisar interfaz visual con foco en que no se sienta simplona.
- Evaluar si se mantiene o se oculta el campo Pais en administracion mientras el MVP sea solo Chile.
- Revisar detalle de estudio y consentimiento para asegurar copy legal consistente con Chile.
- Confirmar si el dominio custom `fundacion.doll.cl` se reactivara o si se presenta solo con GitHub Pages.
- Preparar guion corto de demo: catalogo, filtro, detalle, postulacion, consentimiento y revision en admin.

## Notas tecnicas

- App estatica HTML/CSS/JS sin backend.
- Datos seed en `data/estudios.json`.
- Persistencia de estudios, analitica y consentimientos en `localStorage` del navegador.
- No usar localhost para validacion final; validar siempre con el enlace publico y query `?v=<commit>`.
