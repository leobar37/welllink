# Module 08 — Tu Historia (Feature "Mi historia")

## Overview
Extiende los módulos 02 (Perfil Público) y 04 (Sistema de Features) para ofrecer un botón "Mi historia" en el bio link. El objetivo es mostrar transformaciones visuales del asesor (y opcionalmente de sus clientes) con énfasis en un deslizador de imágenes antes/después, reforzando la confianza antes del contacto.

## MVP Scope
- Nuevo feature `tuHistoria` en el registro del Sistema de Features con label por defecto "Mi historia".
- Mostrar botón en `wellnesslink.com/{username}` cuando el feature está activo y existe al menos una historia publicada.
- Vista pública dedicada (ruta o modal) con título, intro opcional y visor principal con slider de imágenes antes/después.
- Texto de cada historia oculto por defecto; botón "Ver texto" lo despliega bajo demanda.
- CTA global opcional al final (por defecto WhatsApp) con label y URL configurables.
- Dashboard: toggle ON/OFF, formulario de configuración general y CRUD de historias (máx. 3 publicadas) con ordenamiento.

## Key Features
- **Visor visual prioritario:** Slider con animación suave para comparar imagen antes vs después. Solo se habilita si ambas imágenes están presentes.
- **Historias auto/directas:** Permite historias propias del asesor o casos de clientes; el tipo define mensajes guía en la UI.
- **Selección adaptativa:**
  - 1 historia → se abre directo sin selector.
  - 2–3 historias → tabs o indicadores para cambiar de historia.
- **Texto opcional:** Botón "Ver texto" / "Ver historia" expande la narrativa (resumen antes/después) cuando el visitante quiere más contexto.
- **CTA global:** Botón configurable (ej. "Escríbeme por WhatsApp") que aparece tras las historias para capitalizar el interés.

## User Stories
### Asesor
1. Activar/desactivar "Tu Historia" desde el dashboard para controlar la visibilidad del botón.
2. Crear historias propias con imágenes antes/después para mostrar su transformación.
3. Registrar historias de clientes (sin datos sensibles) reutilizando el mismo flujo.
4. Gestionar hasta 3 historias: ordenar, publicar/despublicar y editar contenido.
5. Definir título, intro y CTA global que contextualicen la sección.

### Visitante
1. Ver un botón "Mi historia" en la tarjeta pública para explorar resultados.
2. Deslizar sobre las imágenes para comparar visualmente el antes/después.
3. Cambiar entre historias si hay más de una disponible.
4. Abrir el texto solo cuando desea leer más detalles.
5. Pulsar el CTA final para contactar al asesor tras inspirarse.

## UX & Flows
```
Perfil público /{username}
    ↓ (botón "Mi historia")
Vista Tu Historia
    - Título + intro
    - Selector (solo si ≥2 historias)
    - Visor slider antes/después
    - Botón "Ver texto" → expande narrativa
    - CTA global (WhatsApp / URL)
```

Dashboard → Features → Toggle "Tu Historia" ON → Config general (título, intro, CTA) → Gestión de historias (tipo self/cliente, título, imágenes antes/después, texto opcional, orden, publicar).

## Content Model (Conceptual)
- `StorySectionConfig`: `title`, `intro`, `ctaLabel`, `ctaUrl`.
- `Story`: `id`, `advisorId`, `type` (`self` | `client`), `title`, `beforeImageAssetId`, `afterImageAssetId`, `text`, `order`, `isPublished`.
- Restricciones:
  - Máx. 3 historias publicadas.
  - Slider requiere ambas imágenes; validar proporciones mínimas.
  - Nota de privacidad en UI: "Evita datos identificables de tus clientes".

## Dependencies
- **Módulo 02 (Perfil Público):** Renderiza botón y vista pública, emite eventos de vistas/cambios.
- **Módulo 04 (Features):** Define metadata, toggle y esquema de configuración.
- **Módulo 06 (Dashboard):** Aloja la UI de gestión e integra métricas básicas.
- **Assets:** Reutiliza tabla `asset` para almacenar imágenes antes y después.

## Metrics & Notes
- Eventos mínimos: `story_section_viewed`, `story_changed`, `story_text_opened`, `story_cta_clicked`.
- Dashboard muestra vistas últimos 7/30 días y CTR del CTA.
- Priorizar tiempo de carga optimizando imágenes (lazy loading + compresión) para mantener el slider fluido.
