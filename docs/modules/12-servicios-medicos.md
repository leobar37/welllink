# Module 12 — Servicios Médicos

## Visión General
Este módulo permite a los médicos gestionar su catálogo de servicios y procedimientos médicos. Los servicios se muestran en la página pública y son utilizados por el Agente IA (M10) para responder preguntas de pacientes y por el sistema de citas (M11) para el agendamiento.

## Alcance MVP

- **CRUD de Servicios**: Crear, editar, eliminar y listar servicios
- **Categorización**: Organizar servicios por tipo (consulta, procedimiento, paquete)
- **Precios y Duración**: Información esencial para pacientes
- **Estado Activo/Inactivo**: Control de servicios disponibles
- **Integración con Página Pública**: Mostrar servicios en el perfil público
- **Integración con Agente IA**: Usar información de servicios para responder preguntas

## Características Principales

### Gestión de Servicios
- Nombre del servicio
- Descripción detallada
- Precio
- Duración en minutos
- Categoría
- Estado (activo/inactivo)

### Categorías
| Categoría | Descripción | Ejemplos |
|-----------|-------------|----------|
| Consulta | Visitas médicas estándar | Primera vez, Seguimiento, Control |
| Procedimiento | Intervenciones médicas | Limpieza dental, Aplicación de Botox |
| Paquete | Combinación de servicios | Paquete preventivo, Check-up completo |
| Estudio | Análisis y diagnósticos | Laboratorio, Rayos X |

### Campos del Servicio

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Primary key |
| profileId | uuid | Médico profile (FK) |
| name | varchar | Nombre del servicio |
| description | text | Descripción detallada |
| category | enum | consulta/procedimiento/paquete/estudio |
| duration | integer | Duración en minutos |
| price | decimal | Precio del servicio |
| isActive | boolean | Si está disponible |
| order | integer | Orden de visualización |
| createdAt | timestamp | Fecha de creación |
| updatedAt | timestamp | Última actualización |

## API Endpoints

### Servicios API (`/api/services`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Listar todos los servicios |
| GET | `/:id` | Obtener servicio específico |
| POST | `/` | Crear nuevo servicio |
| PUT | `/:id` | Actualizar servicio |
| DELETE | `/:id` | Eliminar servicio |
| PATCH | `/:id/status` | Cambiar estado (activo/inactivo) |
| PUT | `/reorder` | Reordenar servicios |

### Consultas Públicas (Sin Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/public/:profileId` | Listar servicios activos de un médico |
| GET | `/public/:profileId/category/:category` | Listar por categoría |

## Integraciones

### Con M10 (Agente IA)
El Agente IA utiliza la información de servicios para:
- Responder "¿Cuánto cuesta una consulta?"
- Indicar duración de procedimientos
- Explicar qué incluye cada servicio
- Diferenciar entre categorías

### Con M11 (Citas)
El sistema de citas utiliza servicios para:
- Mostrar opciones al paciente
- Calcular duración de slots
- Aplicar precios al booking
- Filtrar por tipo de servicio

### Con Página Pública
Los servicios se muestran como:
- Lista de servicios con precios
- Cards con información resumida
- links directos a agendamiento

## Ejemplo de JSON

```json
{
  "id": "uuid",
  "profileId": "uuid",
  "name": "Consulta de Primera Vez",
  "description": "Evaluación completa de su estado de salud. Incluye revisión general, historial clínico y recomendaciones personalizadas.",
  "category": "consulta",
  "duration": 45,
  "price": 500.00,
  "isActive": true,
  "order": 1,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T00:00:00Z"
}
```

## Pantallas

### Lista de Servicios (Dashboard)
```
┌─────────────────────────────────────────────────────────┐
│  🏥 Mis Servicios                          [+ Nuevo]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [✓] Mostrar solo activos   |   Buscar...              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📋 Consulta de Primera Vez                      │   │
│  │    $500 MXN • 45 min • Categoria: Consulta      │   │
│  │    [✏️ Editar] [🗑️ Eliminar] [⬆️⬇️ Reordenar] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 💉 Aplicación de Botox                          │   │
│  │    $2,500 MXN • 30 min • Categoría: Procedimiento│   │
│  │    [✏️ Editar] [🗑️ Eliminar] [⬆️⬇️ Reordenar] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Editar/Crear Servicio
```
┌─────────────────────────────────────────────────────────┐
│  ✏️ Editar Servicio                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Nombre del Servicio *                                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Consulta de Primera Vez                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Descripción                                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Evaluación completa de su estado de salud...    │   │
│  │ (Máx 500 caracteres)                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Categoría *                                            │
│  [Consulta ▼]                                           │
│                                                         │
│  Precio (MXN) *                                         │
│  [$] [500]                                              │
│                                                         │
│  Duración (minutos) *                                   │
│  [45]                                                   │
│                                                         │
│  ☐ Servicio activo                                      │
│                                                         │
│  [💾 Guardar]  [❌ Cancelar]                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Métricas

- **Servicios Activos**: Total de servicios disponibles
- **Servicios más Consultados**: Popularidad por categoría
- **Ingresos por Servicio**: Total facturado por tipo
- **Duración Promedio**: Tiempo promedio de cada categoría

## Dependencias
- **M02 (Página Pública)**: Visualización de servicios
- **M10 (Agente IA)**: Información para respuestas
- **M11 (Citas)**: Uso en agendamiento
- **M06 (Dashboard)**: Widget de gestión
