# 🏥 Servicios Médicos

## ¿Qué es?

El módulo de **Servicios Médicos** es el catálogo digital de tu consultorio. Permite organizar, gestionar y presentar todos los servicios que ofreces a tus pacientes de forma clara y profesional.

> 💡 **Piensa en ello como tu menú de servicios**: cada paciente puede ver exactamente qué ofreces, cuánto cuesta y cuánto tiempo toma.

---

## Funcionalidades Principales

### ✏️ Crear Servicios

Registra cada servicio con toda la información necesaria:

- **Nombre descriptivo** — Identifica claramente el servicio
- **Descripción detallada** — Explica qué incluye y qué puede esperar el paciente
- **Precio** — Transparencia total en tus tarifas
- **Duración** — Tiempo estimado en minutos
- **Categoría** — Organización por tipo de servicio
- **Estado** — Activo (visible) o Inactivo (oculto temporalmente)

### 📝 Editar Servicios

Actualiza la información en cualquier momento:

- Modifica precios según temporada o demanda
- Ajusta descripciones para mayor claridad
- Cambia duraciones basado en tu experiencia
- Reorganiza el orden de visualización

### 🗑️ Eliminar Servicios

Retira servicios que ya no ofrezcas. Los servicios eliminados desaparecen de tu página pública y del Agente IA.

### 📋 Listar Servicios

Visualiza todos tus servicios en un panel organizado:

- Filtros por categoría
- Búsqueda rápida por nombre
- Indicadores de estado (activo/inactivo)
- Controles de ordenamiento

---

## Categorías de Servicios

| Categoría         | Descripción                                  | Ejemplos                                            |
| ----------------- | -------------------------------------------- | --------------------------------------------------- |
| **Consulta**      | Visitas médicas estándar con el profesional  | Primera vez, Seguimiento, Control mensual           |
| **Procedimiento** | Intervenciones médicas o estéticas           | Limpieza dental, Aplicación de Botox, Cirugía menor |
| **Paquete**       | Combinación de servicios con precio especial | Check-up completo, Paquete preventivo anual         |
| **Estudio**       | Análisis, diagnósticos y pruebas             | Laboratorio clínico, Rayos X, Ultrasonido           |

---

## Campos de un Servicio

Cada servicio incluye la siguiente información:

| Campo           | Descripción                | Ejemplo                                        |
| --------------- | -------------------------- | ---------------------------------------------- |
| **Nombre**      | Título del servicio        | "Consulta de Primera Vez"                      |
| **Descripción** | Detalle de qué incluye     | "Evaluación completa con historial clínico..." |
| **Precio**      | Costo en moneda local      | $500.00 MXN                                    |
| **Duración**    | Tiempo estimado en minutos | 45 minutos                                     |
| **Categoría**   | Tipo de servicio           | Consulta, Procedimiento, Paquete, Estudio      |
| **Estado**      | Disponibilidad             | Activo ✅ / Inactivo ⏸️                        |

---

## Integraciones con Otros Módulos

### 🤖 Agente IA (Módulo 10)

El Agente IA utiliza tu catálogo de servicios para responder preguntas de pacientes automáticamente:

> _"¿Cuánto cuesta una consulta?"_ → El Agente responde con el precio exacto
>
> _"¿Cuánto dura una limpieza dental?"_ → El Agente indica la duración
>
> _"¿Qué servicios ofrecen?"_ → El Agente lista todos los servicios activos

**Beneficio**: Tus pacientes obtienen respuestas instantáneas 24/7 sin que tengas que responder manualmente.

### 📅 Sistema de Citas (Módulo 11)

Los servicios se integran directamente con el agendamiento:

- Los pacientes seleccionan el servicio al agendar
- El sistema calcula automáticamente la duración del slot
- El precio se muestra antes de confirmar la cita
- Filtros por tipo de servicio facilitan la búsqueda

**Beneficio**: Flujo de agendamiento fluido y sin confusiones sobre tiempos o precios.

### 🌐 Página Pública (Módulo 2)

Tus servicios se muestran en tu perfil público profesional:

- Lista organizada con precios transparentes
- Tarjetas informativas con descripciones
- Botones directos para agendar cada servicio
- Diseño profesional que genera confianza

**Beneficio**: Tus pacientes potenciales ven exactamente qué ofreces antes de contactarte.

---

## Ejemplo de Servicios Configurados

```
┌─────────────────────────────────────────────────────────────┐
│                    CATÁLOGO DE SERVICIOS                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📋 CONSULTAS                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Consulta de Primera Vez                             │   │
│  │ Evaluación completa de su estado de salud          │   │
│  │ 💰 $500 MXN  •  ⏱️ 45 minutos                       │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Consulta de Seguimiento                             │   │
│  │ Revisión de tratamiento en curso                   │   │
│  │ 💰 $350 MXN  •  ⏱️ 30 minutos                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💉 PROCEDIMIENTOS                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Limpieza Dental Profunda                            │   │
│  │ Eliminación de placa y tártaro                     │   │
│  │ 💰 $800 MXN  •  ⏱️ 60 minutos                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📦 PAQUETES                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Check-up Preventivo Completo                        │   │
│  │ Consulta + Laboratorio básico + Electrocardiograma │   │
│  │ 💰 $1,200 MXN  •  ⏱️ 90 minutos                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Beneficios para el Médico

> 🎯 **"Un catálogo de servicios bien organizado no solo informa a tus pacientes, sino que también posiciona tu práctica como profesional, transparente y confiable."**

### Ventajas Clave:

- ✅ **Transparencia** — Precios claros evitan malentendidos
- ✅ **Profesionalismo** — Presentación ordenada genera confianza
- ✅ **Eficiencia** — Menos preguntas repetitivas, más tiempo para atender
- ✅ **Automatización** — El Agente IA responde por ti 24/7
- ✅ **Conversión** — Pacientes informados agendan con mayor seguridad
- ✅ **Flexibilidad** — Activa o desactiva servicios según temporada

---

## Copy para Marketing

### Frases Listas para Usar

#### Para Redes Sociales

> 🏥 **"Conoce todos nuestros servicios médicos con precios transparentes. Agenda tu cita en minutos."**

> 💙 **"Tu salud es nuestra prioridad. Explora nuestro catálogo de servicios y encuentra lo que necesitas."**

> 📋 **"¿Buscas atención médica de calidad? Revisa nuestros servicios, precios y agenda directamente desde nuestro perfil."**

#### Para WhatsApp / Bio

> 🩺 **Catálogo completo de servicios médicos → [tu-link] Agenda tu cita aquí.**

> 💬 **Consulta nuestros servicios y precios. Responde tus dudas con nuestro asistente virtual 24/7.**

#### Para Email Marketing

> **Asunto:** Tu consultorio médico, ahora más accesible
>
> **Cuerpo:** Hemos organizado todos nuestros servicios para que encuentres exactamente lo que necesitas. Precios claros, duración definida y agendamiento en un clic.

---

## Casos de Uso por Especialidad

### 🦷 Dentista

| Servicio                    | Categoría     | Precio     | Duración |
| --------------------------- | ------------- | ---------- | -------- |
| Consulta de Valoración      | Consulta      | $400 MXN   | 30 min   |
| Limpieza Dental             | Procedimiento | $600 MXN   | 45 min   |
| Blanqueamiento Dental       | Procedimiento | $2,500 MXN | 60 min   |
| Paquete Preventivo Familiar | Paquete       | $1,800 MXN | 120 min  |

**Beneficio**: Los pacientes ven todos los tratamientos disponibles y pueden agendar limpiezas de rutina sin llamar.

### ❤️ Cardiólogo

| Servicio                | Categoría | Precio     | Duración |
| ----------------------- | --------- | ---------- | -------- |
| Consulta Cardiológica   | Consulta  | $800 MXN   | 45 min   |
| Electrocardiograma      | Estudio   | $350 MXN   | 15 min   |
| Estudio de Holter       | Estudio   | $1,500 MXN | 30 min   |
| Check-up Cardiovascular | Paquete   | $2,200 MXN | 90 min   |

**Beneficio**: Pacientes con antecedentes familiares pueden ver opciones de prevención y agendar check-ups completos.

### 🧴 Dermatólogo

| Servicio                 | Categoría     | Precio     | Duración |
| ------------------------ | ------------- | ---------- | -------- |
| Consulta Dermatológica   | Consulta      | $700 MXN   | 30 min   |
| Aplicación de Botox      | Procedimiento | $3,500 MXN | 45 min   |
| Biopsia de Piel          | Procedimiento | $1,200 MXN | 30 min   |
| Paquete Rejuvenecimiento | Paquete       | $5,000 MXN | 120 min  |

**Beneficio**: Pacientes interesados en tratamientos estéticos pueden explorar opciones y precios antes de consultar.

---

## Métricas Clave

| Métrica                       | Descripción                    | Por Qué Importa                   |
| ----------------------------- | ------------------------------ | --------------------------------- |
| **Servicios Activos**         | Total de servicios disponibles | Indica la variedad de tu oferta   |
| **Servicios Más Consultados** | Popularidad por categoría      | Ayuda a identificar demanda       |
| **Servicios Más Agendados**   | Conversión de vista a cita     | Mide efectividad del catálogo     |
| **Ingresos por Servicio**     | Total facturado por tipo       | Identifica tus servicios estrella |
| **Duración Promedio**         | Tiempo medio por categoría     | Optimiza tu agenda                |
| **Tasa de Conversión**        | Visitas vs. agendamientos      | Mide interés real de pacientes    |

---

## Mejores Prácticas

### ✅ Hazlo Bien

- Usa nombres descriptivos y claros
- Incluye precios actualizados
- Describe qué incluye cada servicio
- Mantén el catálogo organizado por categorías
- Activa/desactiva servicios según disponibilidad

### ❌ Evita

- Nombres ambiguos o técnicos excesivos
- Precios desactualizados
- Descripciones muy cortas o genéricas
- Servicios sin categoría definida
- Dejar servicios inactivos visibles

---

## Resumen

El módulo de **Servicios Médicos** transforma tu consultorio en una experiencia digital profesional donde:

1. **Tus pacientes** encuentran información clara y transparente
2. **Tú** reduces consultas repetitivas sobre precios y tiempos
3. **Tu práctica** se posiciona como moderna y accesible

> 🚀 **Resultado**: Más pacientes informados, menos fricción en el agendamiento y una imagen profesional que genera confianza desde el primer contacto.
