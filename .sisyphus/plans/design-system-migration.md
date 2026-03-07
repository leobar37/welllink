# Plan de Migración: Sistema de Diseño Minimalista

## TL;DR

> **Objetivo**: Transformar el sistema de diseño actual de MediApp de un estilo "genérico con bordes pronunciados" a un diseño minimalista, moderno y coherente con la identidad de wellness/salud.
>
> **Alcance**: 147 archivos afectados, 20+ patrones de cards, migración de colores hardcodeados a tokens semánticos
>
> **Esfuerzo Estimado**: Large (~8-12 horas de trabajo agente)
>
> **Ejecución Paralela**: Sí - 4 fases con 5-8 tareas paralelas por fase

---

## Contexto

### Estado Actual Identificado

**Problemas Críticos**:

1. **Bordes pronunciados**: `border-2`, `border-4`, `border-[8px]` en múltiples componentes
2. **Sombras excesivas**: `shadow-lg`, `shadow-xl`, `shadow-2xl` usadas indiscriminadamente
3. **Radios inconsistentes**: Desde `rounded-md` (0.375rem) hasta `rounded-[2.5rem]`
4. **Colores hardcodeados**: 45+ ocurrencias de colores Tailwind fuera del sistema (gray, blue, green, etc.)
5. **Cards sin sistema**: 20+ patrones de cards diferentes, cada uno con estilos propios

**Stack Tecnológico**:

- React 19 + Tailwind CSS v4 + shadcn/ui
- Tema OKLCH "Citabot" (púrpura tech)
- 67 componentes UI shadcn instalados
- 147 archivos con patrones de background
- 505+ ocurrencias de clases bg-\*

### Metas del Rediseño

**Minimalista & Moderno**:

- Bordes sutiles (`border` o `border-border/40`) en lugar de gruesos
- Sombras reducidas (solo `shadow-sm` para elevación sutil)
- Radios estandarizados (`rounded-lg` de 0.5rem para todo)
- Colores 100% semánticos del tema
- Cards con sistema coherente y reutilizable

---

## Estrategia de Verificación

### QA Strategy

**Cada tarea incluye**:

1. **Before/After Screenshots**: Playwright captura estado visual
2. **Visual Regression**: Comparación de cambios en componentes
3. **Token Compliance Check**: Verificar que no queden colores hardcodeados
4. **Responsive Testing**: Verificar en mobile/desktop

**Comandos de Verificación**:

```bash
# Build sin errores
bun run build

# Lint sin problemas
bun run lint

# TypeScript check
cd packages/web && tsc --noEmit
```

---

## Estrategia de Ejecución

### Olas de Ejecución Paralela

```
Fase 1: Fundamentos del Sistema (Base)
├── T1: Refactorizar Card base de shadcn/ui
├── T2: Crear variants de Card minimalistas
├── T3: Actualizar tokens de borde en index.css
├── T4: Crear utilidades de color semántico
└── T5: Documentar nuevos patrones

Fase 2: Migración de Cards (MAX PARALELO)
├── T6: Migrar ClientCard
├── T7: Migrar ServiceCard
├── T8: Migrar ThemeCard
├── T9: Migrar RadioCard
├── T10: Migrar SurveyCard
├── T11: Migrar RequestCard
├── T12: Migrar PaymentMethodCard
└── T13: Crear nuevos cards reusables (DataCard, SelectableCard)

Fase 3: Limpieza de Colores Hardcodeados
├── T14: Migrar WhatsApp.tsx (gray → semantic)
├── T15: Migrar PaymentMethods.tsx (icon colors)
├── T16: Migrar ClientCard.tsx (label colors)
├── T17: Migrar step-avatar.tsx
├── T18: Migrar landing components
└── T19: Auditar y limpiar resto de archivos

Fase 4: Reducción de Sombras y Bordes
├── T20: Reducir sombras en landing (hero, cta)
├── T21: Reducir bordes en preview-panel
├── T22: Estandarizar rounded en todo el sistema
├── T23: Actualizar DashboardOverview stats
└── T24: QA visual final y ajustes

Fase FINAL: Verificación y Validación
├── TF1: Auditoría de compliance (oracle)
├── TF2: Screenshots comparativos visuales
├── TF3: Revisión de tokens hardcodeados
└── TF4: Documentación final
```

### Matriz de Dependencias

- **Fase 1**: Sin dependencias (inicio inmediato)
- **Fase 2**: Depende de T1, T2 (Card base y variants)
- **Fase 3**: Puede paralelizarse parcialmente con Fase 2
- **Fase 4**: Depende de Fase 1-3 completas
- **Fase FINAL**: Depende de todas las anteriores

---

## TODOs

### Fase 1: Fundamentos del Sistema

- [x] **1. Refactorizar Card base de shadcn/ui**

  **Qué hacer**:
  - Modificar `packages/web/src/components/ui/card.tsx`
  - Cambiar `rounded-xl` → `rounded-lg`
  - Quitar `shadow-sm` (opcional según variant)
  - Reducir `py-6` → `py-5`
  - Reducir `gap-6` → `gap-4`

  **Estado objetivo**:

  ```tsx
  // ANTES:
  "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm";

  // DESPUÉS:
  "bg-card text-card-foreground flex flex-col gap-4 rounded-lg border border-border/40 py-5";
  ```

  **Perfil de Agente**:
  - **Categoría**: `unspecified-high` (cambios en core UI)
  - **Skills**: `frontend` (Tailwind v4, shadcn/ui)

  **Paralelización**:
  - Puede ejecutarse inmediatamente
  - Bloquea: T2, T6-T13

  **Criterios de Aceptación**:
  - [ ] Card base compila sin errores
  - [ ] Story/playground muestra card correctamente
  - [ ] Sin `shadow-sm` en default
  - [ ] Bordes más sutiles (`border-border/40`)

  **QA Scenarios**:

  ```
  Scenario: Card base renderiza correctamente
    Tool: Playwright
    Steps:
      1. Navegar a página con Card
      2. Capturar screenshot del card
      3. Verificar: no tiene shadow-sm visible
      4. Verificar: bordes son sutiles (1px, 40% opacity)
    Evidence: .sisyphus/evidence/task-1-card-base.png
  ```

  **Commit**:
  - Mensaje: `refactor(ui): simplify Card component for minimal design`
  - Archivos: `packages/web/src/components/ui/card.tsx`

- [x] **2. Crear variants de Card minimalistas**

  **Qué hacer**:
  - Extender Card con sistema de variants usando CVA
  - Crear variants: `default`, `ghost`, `elevated`, `outlined`, `interactive`
  - Ubicación: `packages/web/src/components/ui/card.tsx`

  **Variants objetivo**:

  ```tsx
  const cardVariants = cva(
    "flex flex-col gap-4 rounded-lg py-5 transition-colors",
    {
      variants: {
        variant: {
          default: "bg-card border border-border/40",
          ghost: "bg-transparent border-0",
          elevated: "bg-card border-0 shadow-sm",
          outlined: "bg-transparent border border-border",
          interactive:
            "bg-card border border-border/40 hover:border-primary/30 hover:bg-accent/30 cursor-pointer",
        },
        padding: {
          default: "px-5",
          compact: "px-4",
          spacious: "px-6",
        },
      },
    },
  );
  ```

  **Perfil de Agente**:
  - **Categoría**: `unspecified-high`
  - **Skills**: `frontend` (CVA, Tailwind v4)

  **Paralelización**:
  - Depende de: T1
  - Bloquea: T6-T13

  **Criterios de Aceptación**:
  - [ ] Todas las variants renderizan correctamente
  - [ ] TypeScript sin errores
  - [ ] Props `variant` y `padding` funcionan

  **QA Scenarios**:

  ```
  Scenario: Todas las variants de Card funcionan
    Tool: Playwright
    Steps:
      1. Crear página de test con todas las variants
      2. Screenshot de cada variant
      3. Verificar diferencias visuales entre variants
    Evidence: .sisyphus/evidence/task-2-card-variants/
  ```

- [x] **3. Actualizar tokens de borde en index.css**

  **Qué hacer**:
  - Modificar `packages/web/src/index.css`
  - Cambiar `--border` a valor más sutil
  - Ajustar opacidad del color de borde

  **Cambio propuesto**:

  ```css
  /* ANTES: */
  --border: oklch(0.9 0.025 295);

  /* DESPUÉS: */
  --border: oklch(0.94 0.01 295); /* Más claro, menos saturado */
  ```

  **Perfil de Agente**:
  - **Categoría**: `quick`
  - **Skills**: `frontend`

  **Paralelización**:
  - Sin dependencias

  **QA Scenarios**:

  ```
  Scenario: Bordes son más sutiles
    Tool: Playwright
    Steps:
      1. Screenshot de componentes con bordes (inputs, cards)
      2. Comparar con baseline
      3. Verificar: bordes son menos prominentes
    Evidence: .sisyphus/evidence/task-3-border-tokens.png
  ```

- [x] **4. Crear utilidades de color semántico**

  **Qué hacer**:
  - Crear `packages/web/src/lib/colors.ts`
  - Mapear colores hardcodeados comunes a tokens semánticos
  - Exportar configuración para labels, estados, etc.

  **Estructura propuesta**:

  ```typescript
  export const semanticColors = {
    status: {
      success: { bg: "bg-primary/10", text: "text-primary" },
      warning: { bg: "bg-accent/30", text: "text-accent-foreground" },
      error: { bg: "bg-destructive/10", text: "text-destructive" },
      info: { bg: "bg-secondary", text: "text-secondary-foreground" },
    },
    labels: {
      primary: { bg: "bg-primary/10", text: "text-primary" },
      secondary: { bg: "bg-secondary", text: "text-secondary-foreground" },
      muted: { bg: "bg-muted", text: "text-muted-foreground" },
    },
  };
  ```

  **Perfil de Agente**:
  - **Categoría**: `quick`
  - **Skills**: `frontend`

  **Paralelización**:
  - Sin dependencias
  - Bloquea parcialmente: T14-T19

- [ ] **5. Documentar nuevos patrones**

  **Qué hacer**:
  - Crear `packages/web/docs/card-patterns.md`
  - Documentar uso de cada variant
  - Incluir ejemplos de migración

  **Perfil de Agente**:
  - **Categoría**: `writing`
  - **Skills**: []

---

### Fase 2: Migración de Cards

- [x] **6. Migrar ClientCard**

  **Qué hacer**:
  - Modificar `packages/web/src/components/clients/ClientCard.tsx`
  - Reemplazar colores hardcodeados de labels
  - Usar nueva variant `ghost` o `interactive`

  **Cambios específicos**:

  ```typescript
  // ANTES:
  labelConfig = {
    consumidor: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      icon: "bg-blue-100 text-blue-600",
    },
    prospecto: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      icon: "bg-emerald-100 text-emerald-600",
    },
    afiliado: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      icon: "bg-amber-100 text-amber-600",
    },
  };

  // DESPUÉS: Usar semanticColors.labels
  labelConfig = {
    consumidor: semanticColors.labels.info,
    prospecto: semanticColors.labels.success,
    afiliado: semanticColors.labels.warning,
  };
  ```

  **Perfil de Agente**:
  - **Categoría**: `unspecified-high`
  - **Skills**: `frontend`

  **Paralelización**:
  - Depende de: T1, T2, T4

- [x] **7. Migrar ServiceCard**

  **Qué hacer**:
  - Modificar `packages/web/src/components/medical-services/components/service-card.tsx`
  - Quitar gradiente del header
  - Simplificar hover effects
  - Usar variant `elevated` o `default`

  **Cambios específicos**:

  ```tsx
  // ANTES:
  <div className="h-1 w-full bg-gradient-to-r from-primary/80 via-primary/60 to-primary/35" />
  className="...hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"

  // DESPUÉS:
  // Quitar gradient line completamente o reemplazar con:
  <div className="h-1 w-full bg-primary/20" />
  className="...hover:border-primary/30"  // Sin translate ni shadow-md
  ```

  **Perfil de Agente**:
  - **Categoría**: `unspecified-high`
  - **Skills**: `frontend`

- [x] **8. Migrar ThemeCard**

  **Qué hacer**:
  - Modificar `packages/web/src/components/dashboard/theme-card.tsx`
  - Cambiar `border-2` → `border`
  - Quitar `hover:shadow-md`

  **Cambios**:

  ```tsx
  // ANTES:
  "relative flex flex-col rounded-xl border-2 p-4 text-left transition-all hover:shadow-md";

  // DESPUÉS:
  "relative flex flex-col rounded-lg border p-4 text-left transition-all";
  ```

- [x] **9. Migrar RadioCard**

  **Qué hacer**:
  - Modificar `packages/web/src/components/survey/ui/RadioCard.tsx`
  - Simplificar estados seleccionados
  - Reducir intensidad de colores

  **Cambios**:

  ```tsx
  // ANTES:
  isSelected
    ? "bg-primary/10 border-primary text-foreground"
    : "bg-card border-border hover:bg-accent/50";

  // DESPUÉS:
  isSelected
    ? "bg-primary/5 border-primary/70 text-foreground"
    : "bg-card border-border/60 hover:bg-accent/30";
  ```

- [x] **10. Migrar SurveyCard**

  **Qué hacer**:
  - Modificar `packages/web/src/components/surveys/SurveyCard.tsx`
  - Cambiar badge de "Encuesta" a colores semánticos

  **Cambios**:

  ```tsx
  // ANTES:
  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">

  // DESPUÉS:
  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
  ```

- [x] **11. Migrar RequestCard**

  **Qué hacer**:
  - Modificar `packages/web/src/components/doctor/request-card.tsx`
  - Reemplazar card custom con shadcn Card
  - Estandarizar estilos

- [x] **12. Migrar PaymentMethodCard**

  **Qué hacer**:
  - Modificar `packages/web/src/components/dashboard/PaymentMethodCard.tsx`
  - Reemplazar colores hardcodeados de métodos de pago

  **Nota**: Los iconos de métodos de pago pueden mantener colores específicos de marca (MercadoPago, Yape, etc.)

- [x] **13. Crear nuevos cards reusables**

  **Qué hacer**:
  - Crear `packages/web/src/components/ui/cards/DataCard.tsx` - Para estadísticas/dashboard
  - Crear `packages/web/src/components/ui/cards/SelectableCard.tsx` - Para selección única (reemplaza ThemeCard, RadioCard)
  - Crear `packages/web/src/components/ui/cards/EmptyStateCard.tsx` - Estado vacío consistente

---

### Fase 3: Limpieza de Colores Hardcodeados

- [x] **14. Migrar WhatsApp.tsx**

  **Qué hacer**:
  - Modificar `packages/web/src/pages/dashboard/WhatsApp.tsx`
  - Reemplazar `bg-gray-50`, `text-gray-600`, etc.

  **Cambios**:

  ```tsx
  // ANTES:
  "flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg";

  // DESPUÉS:
  "flex flex-col items-center justify-center p-8 bg-muted/30 rounded-lg";
  ```

- [x] **15. Migrar PaymentMethods.tsx**

  **Qué hacer**:
  - Revisar y migrar colores hardcodeados
  - Mantener colores de marca para iconos de pago

- [ ] **16. Migrar ClientCard labels**

  **Nota**: Ya cubierto en T6

- [x] **17. Migrar step-avatar.tsx**

  **Qué hacer**:
  - Modificar `packages/web/src/components/onboarding/step-avatar.tsx`
  - Reemplazar `border-gray-300`, `text-gray-600`

- [x] **18. Migrar landing components**

  **Qué hacer**:
  - Modificar componentes en `packages/web/src/components/landing/`
  - Reemplazar whites/blacks hardcodeados donde aplique
  - Mantener gradientes de diseño intencional

- [x] **19. Auditar y limpiar resto de archivos**

  **Qué hacer**:
  - Buscar todas las ocurrencias de colores hardcodeados
  - Reemplazar con tokens semánticos

  **Colores a buscar**:

  ```bash
  grep -r "bg-gray-\|text-gray-\|border-gray-" packages/web/src
  grep -r "bg-blue-\|bg-green-\|bg-red-\|bg-yellow-" packages/web/src
  grep -r "bg-white\|bg-black" packages/web/src
  ```

---

### Fase 4: Reducción de Sombras y Bordes

- [x] **20. Reducir sombras en landing**

  **Qué hacer**:
  - `hero-section.tsx`: Reducir `shadow-2xl` → `shadow-md`
  - `cta-section.tsx`: Reducir `shadow-2xl` → `shadow-lg`
  - `phone-mockup.tsx`: Reducir `shadow-2xl` → `shadow-lg`

- [x] **21. Reducir bordes en preview-panel**

  **Qué hacer**:
  - `preview-panel.tsx`: Cambiar `border-[8px]` → `border-4`
  - Reducir opacidad del borde

- [x] **22. Estandarizar rounded en todo el sistema**

  **Qué hacer**:
  - Buscar todos los `rounded-2xl` en cards → cambiar a `rounded-xl`
  - Buscar todos los `rounded-[2.5rem]` → cambiar a `rounded-2xl`
  - Buscar `rounded-[3rem]` → cambiar a `rounded-2xl`

- [x] **23. Actualizar DashboardOverview stats**

  **Qué hacer**:
  - `DashboardOverview.tsx`: Reducir `rounded-2xl` → `rounded-xl`
  - Revisar otros componentes de dashboard

- [x] **24. QA visual final y ajustes**

  **Qué hacer**:
  - Screenshots de todas las páginas principales
  - Comparar antes/después
  - Ajustes finos de espaciado y colores

---

### Fase FINAL: Verificación y Validación

- [ ] **F1. Auditoría de compliance**

  **Qué hacer**:
  - Verificar que todos los cards usan el sistema nuevo
  - Confirmar no hay colores hardcodeados restantes
  - Validar tokens de diseño consistentes

  **Perfil de Agente**:
  - **Categoría**: `oracle`
  - **Skills**: []

- [ ] **F2. Screenshots comparativos visuales**

  **Qué hacer**:
  - Generar screenshots de todas las páginas clave
  - Comparar con estado inicial
  - Documentar mejoras

- [ ] **F3. Revisión de tokens hardcodeados**

  **Qué hacer**:
  - Script de verificación: `grep -r "bg-gray-\|text-gray-" packages/web/src --include="*.tsx"`
  - Confirmar 0 ocurrencias

- [ ] **F4. Documentación final**

  **Qué hacer**:
  - Actualizar README con nuevos patrones
  - Crear guía de migración para futuros desarrollos

---

## Estrategia de Commits

**Convención**: `type(scope): description`

**Ejemplos**:

```
refactor(ui): simplify Card component for minimal design
feat(ui): add Card variants system with CVA
refactor(clients): migrate ClientCard to semantic colors
refactor(themes): update border tokens for subtler borders
refactor(landing): reduce shadow intensity in hero section
docs: add card patterns documentation
```

---

## Criterios de Éxito

### Métricas Cuantitativas

- [ ] 0 colores hardcodeados (gray, blue, green, etc.)
- [ ] 100% de cards usan el sistema de variants
- [ ] Reducción de 70%+ en uso de `shadow-lg`+
- [ ] Reducción de 80%+ en uso de `border-2`+
- [ ] Build sin errores
- [ ] Lint sin warnings

### Métricas Cualitativas

- [ ] Diseño percibido como "más moderno" y "más limpio"
- [ ] Consistencia visual en toda la aplicación
- [ ] Cards con comportamiento predecible
- [ ] Feedback positivo en review visual

---

## Notas y Riesgos

### Riesgos Identificados

1. **Cambios en componentes core** pueden afectar múltiples páginas
   - **Mitigación**: T1 tiene QA exhaustivo antes de continuar
2. **Colores de marca de terceros** (MercadoPago, Yape) deben preservarse
   - **Mitigación**: T12 mantiene excepciones documentadas

3. **Gradientes intencionales** en landing pueden perder impacto
   - **Mitigación**: T20 revisa caso por caso, no cambios automáticos

### Decisiones de Diseño Pendientes

1. ¿Mantener `shadow-sm` en cards o eliminar completamente?
2. ¿Usar `ring` en lugar de `border-2` para estados seleccionados?
3. ¿Reducir más el valor de `--border`?

**Recomendación**: Decidir en T1-T3, documentar, y aplicar consistentemente.

---

## Archivos Afectados (Resumen)

| Categoría           | Cantidad | Ejemplos                         |
| ------------------- | -------- | -------------------------------- |
| Componentes UI core | 1        | card.tsx                         |
| Componentes domain  | 9        | ClientCard, ServiceCard, etc.    |
| Pages               | 15+      | WhatsApp.tsx, PaymentMethods.tsx |
| Landing             | 8        | hero-section, cta-section        |
| Configuración       | 1        | index.css                        |
| Utilidades          | 1        | colors.ts (nuevo)                |
| Documentación       | 2        | card-patterns.md, README         |

**Total estimado**: ~40 archivos modificados

---

## Próximos Pasos

1. Revisar este plan con el equipo
2. Confirmar decisiones de diseño pendientes
3. Ejecutar con `/start-work design-system-migration`
4. Iterar según feedback

---

_Plan generado por Prometheus - última actualización: 2026-03-07_
