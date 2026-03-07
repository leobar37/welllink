# CitaBot - Plan de Rebranding y Pivot

> **Fecha:** 7 de Marzo, 2026  
> **De:** MediApp (nicho médico)  
> **A:** CitaBot (agendamiento genérico para belleza y servicios)  
> **Estado:** Aprobado para implementación

---

## 1. Resumen Ejecutivo

### Cambio Estratégico
Pivotar de un CRM médico especializado a una plataforma de agendamiento con IA para negocios de servicios, enfocándonos inicialmente en el sector belleza (spas, peluquerías, barberías, uñas).

### Razón del Cambio
- El producto no ha sido lanzado (sin gastos de marketing que perder)
- Mayor mercado potencial (cualquier negocio con citas vs. solo médicos)
- Ciclo de venta más corto (decisión individual vs. comités hospitalarios)
- Menor competencia directa con IA

---

## 2. Nuevo Branding

### 2.1 Nombre
**CitaBot**

### 2.2 Propuesta de Valor
> "Tu recepcionista virtual con IA. Atiende WhatsApp y web 24/7, agenda citas automáticamente y reduce tus no-shows."

### 2.3 Nichos MVP
1. **Belleza:** Spas, peluquerías, barberías, salones de uñas
2. **Futuros:** Gimnasios, consultores, talleres técnicos

---

## 3. Paleta de Colores

### 3.1 Esquema Morado Tech (Nuevo)

#### Light Mode
```css
--primary: oklch(0.55 0.22 295);        /* Violeta #7C3AED */
--primary-foreground: oklch(1 0 0);     /* Blanco */
--background: oklch(0.99 0.002 295);    /* Blanco lila */
--foreground: oklch(0.2 0.02 295);      /* Negro lila */
--secondary: oklch(0.92 0.03 295);
--muted: oklch(0.96 0.005 295);
--accent: oklch(0.8 0.08 295);
--border: oklch(0.9 0.02 295);
--ring: oklch(0.55 0.22 295);
```

#### Dark Mode
```css
--primary: oklch(0.65 0.18 295);        /* Violeta claro */
--background: oklch(0.15 0.02 295);     /* Negro lila */
--foreground: oklch(0.95 0.01 295);     /* Blanco lila */
```

### 3.2 Temas Disponibles (Reemplazar)
- ~~Wellness Verde~~ → **Violeta Tech** (default)
- ~~Oceano~~ → **Morado Profundo**
- ~~Atardecer~~ → **Lavanda**
- ~~Tierra~~ → **Neutro**

---

## 4. Logo

### 4.1 Especificaciones
- **Formato:** Componente React SVG
- **Estilo:** Minimalista, moderno
- **Elementos:** Calendario + chat/checkmark (sin cruz médica)
- **Colores:** Usa CSS variables (--primary) para adaptarse a tema

### 4.2 Componente
```typescript
// packages/web/src/components/ui/logo-citabot.tsx
interface LogoCitaBotProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon-only' | 'text-only' | 'full';
  className?: string;
}
```

---

## 5. Cambios de Base de Datos

### 5.1 Tablas a Renombrar
| Actual | Nuevo |
|--------|-------|
| `medical_service` | `service` |

### 5.2 Columnas a Renombrar
| Tabla | Actual | Nuevo |
|-------|--------|-------|
| `reservation` | `patientName` | `customerName` |
| `reservation` | `patientPhone` | `customerPhone` |
| `reservation` | `patientEmail` | `customerEmail` |
| `reservation_request` | `patientName` | `customerName` |
| `reservation_request` | `patientPhone` | `customerPhone` |
| `reservation_request` | `patientEmail` | `customerEmail` |
| `reservation_request` | `patientAge` | `customerAge` |
| `reservation_request` | `patientGender` | `customerGender` |
| `reservation_request` | `chiefComplaint` | `reason` |
| `profile` | `clinicName` | `businessName` |
| `profile` | `clinicAddress` | `businessAddress` |
| `profile` | `clinicPhone` | `businessPhone` |
| `profile` | `clinicEmail` | `businessEmail` |
| `profile` | `clinicWebsite` | `businessWebsite` |
| `profile` | `clinicRuc` | `businessTaxId` |

### 5.3 Columnas a Eliminar
| Tabla | Columna | Razón |
|-------|---------|-------|
| `reservation_request` | `symptoms` | 100% médico |
| `reservation_request` | `medicalHistory` | 100% médico |
| `reservation_request` | `allergies` | 100% médico |
| `reservation_request` | `currentMedications` | 100% médico |

### 5.4 Migración SQL (Resumen)
```sql
-- Renombrar tabla
ALTER TABLE medical_service RENAME TO service;

-- Renombrar columnas
ALTER TABLE reservation RENAME COLUMN patient_name TO customer_name;
ALTER TABLE reservation RENAME COLUMN patient_phone TO customer_phone;
ALTER TABLE reservation RENAME COLUMN patient_email TO customer_email;

-- Eliminar columnas médicas
ALTER TABLE reservation_request DROP COLUMN symptoms;
ALTER TABLE reservation_request DROP COLUMN medical_history;
ALTER TABLE reservation_request DROP COLUMN allergies;
ALTER TABLE reservation_request DROP COLUMN current_medications;
```

---

## 6. Cambios de Código

### 6.1 Backend (API)

#### Archivos a Renombrar
| Ruta Actual | Nueva Ruta |
|-------------|------------|
| `api/routes/medical-services.ts` | `api/routes/services.ts` |
| `services/business/medical-service.ts` | `services/business/service.ts` |
| `services/repository/medical-service.ts` | `services/repository/service.ts` |

#### Archivos a Modificar
| Archivo | Cambios |
|---------|---------|
| `services/ai/chat/config.ts` | Eliminar referencias médicas, instrucciones genéricas |
| `services/ai/chat/tools/patient.ts` | "patient" → "customer" |
| `services/ai/chat/tools/appointments.ts` | Actualizar copy |
| `services/ai/chat/tools/services.ts` | "medical service" → "service" |
| `db/schema/index.ts` | Actualizar exports |
| `db/schema/relations.ts` | Actualizar relaciones |

### 6.2 Frontend (Web)

#### Archivos a Renombrar
| Ruta Actual | Nueva Ruta |
|-------------|------------|
| `pages/dashboard/MedicalServices.tsx` | `pages/dashboard/Services.tsx` |
| `components/medical-services/` | `components/services/` |
| `hooks/use-medical-services.ts` | `hooks/use-services.ts` |

#### Archivos a Modificar
| Archivo | Cambios |
|---------|---------|
| `components/ui/logotype.tsx` | "MediApp" → "CitaBot" |
| `components/ui/logo-icon.tsx` | Nuevo SVG sin cruz médica |
| `components/app-sidebar.tsx` | "Servicios Médicos" → "Servicios" |
| `components/landing/hero-section.tsx` | Copy belleza/spa |
| `components/landing/features-section.tsx` | "consultorio" → "salón/negocio" |
| `pages/dashboard/PendingRequestsPage.tsx` | "paciente" → "cliente" |
| `pages/dashboard/EditProfile.tsx` | "clinic" → "business" |
| `index.html` | Title "CitaBot" |
| `index.css` | Tema morado + dark mode |
| `lib/themes.ts` | Nuevos temas |

---

## 7. Funcionalidades: Preservar vs Adaptar vs Eliminar

### 7.1 Preservar (Sin Cambios)
- ✅ Sistema de citas/agendamiento
- ✅ Agente IA conversacional
- ✅ Notificaciones WhatsApp
- ✅ Perfil público digital
- ✅ Código QR
- ✅ Sistema de servicios (precio, duración, categoría)
- ✅ Recordatorios automáticos (24h, 2h)
- ✅ Sistema de FAQs
- ✅ Campañas de mensajes
- ✅ Gestión de conversaciones WhatsApp

### 7.2 Adaptar (Cambios Menores)
| Feature | Cambio |
|---------|--------|
| `medicalService` | Renombrar a `service` (ya es genérico) |
| `patient` | Renombrar a `customer` |
| Instrucciones IA | Remover "no diagnósticos", "emergencias 911" |
| Landing copy | "pacientes" → "clientes", "consultorio" → "salón/negocio" |
| Temas | Wellness → Tech/Violeta |

### 7.3 Eliminar
- ❌ Campos médicos específicos (symptoms, allergies, medicalHistory, currentMedications)
- ❌ Referencias a HIPAA/cumplimiento médico
- ❌ Logo con cruz médica
- ❌ Copy médico en landing
- ❌ Nombre "MediApp" / "Wellness Link"

---

## 8. Plan de Implementación

### Fase 1: Branding y Tema (Día 1)
- [ ] Crear `logo-citabot.tsx` con SVG simple
- [ ] Actualizar `logotype.tsx` con "CitaBot"
- [ ] Implementar tema morado en `index.css`
- [ ] Actualizar `themes.ts` con nuevos temas
- [ ] Actualizar `index.html` title

### Fase 2: Database Migration (Día 2)
- [ ] Crear migración SQL
- [ ] Renombrar tabla `medical_service` → `service`
- [ ] Renombrar columnas (patient → customer, clinic → business)
- [ ] Eliminar columnas médicas
- [ ] Actualizar schema TypeScript
- [ ] Actualizar relaciones

### Fase 3: Backend API (Día 3)
- [ ] Renombrar archivos de servicios
- [ ] Actualizar todos los imports
- [ ] Actualizar rutas API
- [ ] Actualizar instrucciones de IA
- [ ] Actualizar tools de IA

### Fase 4: Frontend (Día 4)
- [ ] Renombrar componentes y carpetas
- [ ] Actualizar sidebar y rutas
- [ ] Actualizar hooks
- [ ] Actualizar copy de landing page
- [ ] Revisar todas las páginas del dashboard

### Fase 5: QA y Testing (Día 5)
- [ ] Ejecutar migraciones en local
- [ ] Verificar flujo completo de citas
- [ ] Verificar agente IA
- [ ] Verificar tema dark/light mode
- [ ] Actualizar tests E2E

### Fase 6: Deploy (Día 6)
- [ ] Deploy a staging
- [ ] Pruebas finales
- [ ] Deploy a producción

---

## 9. Copy de Landing Page (Propuesta)

### Hero Section
```
Heading: Tu recepcionista virtual con IA agenda citas 24/7

Subtitle: Convierte leads en clientes automáticamente. 
El agente conversa por WhatsApp, responde preguntas y 
agenda citas mientras te dedicas a lo que mejor haces.

Benefits:
- Sin perder nunca un lead
- Clientes reservan las 24 horas
- Dashboard de citas integrado

CTA: Activar mi agente
```

### Features Section
```
Heading: Todo lo que necesitas para automatizar tu salón

Features:
1. Agente de IA - Conversa con clientes por WhatsApp 24/7
2. Reserva de Citas - Gestión completa de disponibilidad
3. Tarjeta Digital - Tu perfil profesional en una URL
4. Servicios - Catálogo con precios para tus clientes
```

---

## 10. Documentación

### Archivos a Actualizar
| Archivo | Acción |
|---------|--------|
| `README.md` | Reescribir con nueva descripción |
| `docs/global-prd.md` | Archivar o reescribir |
| `docs/modules/*.md` | Archivar (documentación médica) |
| `CLAUDE.md` | Actualizar contexto del proyecto |

---

## 11. Checklist Pre-Deploy

- [ ] Logo CitaBot renderiza correctamente
- [ ] Tema morado aplica en light y dark mode
- [ ] Migraciones ejecutan sin errores
- [ ] Flujo de creación de cita funciona
- [ ] Agente IA responde sin referencias médicas
- [ ] Landing page muestra copy genérico
- [ ] Dashboard muestra "cliente" no "paciente"
- [ ] Sidebar muestra "Servicios" no "Servicios Médicos"
- [ ] Perfil editable con campos de negocio (no clínica)
- [ ] Tests E2E pasan

---

## 12. Notas Técnicas

### Dependencias a Mantener
- Tailwind CSS v4 (con OKLCH colors)
- shadcn/ui components
- React 19 + Vite
- Elysia + Bun (backend)
- Drizzle ORM
- Evolution API (WhatsApp)
- VoltAgent (IA)

### Consideraciones
- Los temas existentes se mantienen como opciones pero renombrados
- El schema de DB debe mantener compatibilidad hacia atrás durante migración
- Las instrucciones de IA deben ser neutrales pero mantener calidez
- El color morado debe funcionar tanto en belleza como en futuros nichos

---

**Documento preparado por:** AI Assistant  
**Fecha:** 7 de Marzo, 2026  
**Estado:** Listo para implementación

---

## Aprobación

- [ ] Plan revisado y aprobado
- [ ] Recursos asignados
- [ ] Fecha de inicio definida
- [ ] Fecha de lanzamiento objetivo
