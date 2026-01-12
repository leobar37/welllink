# Module 13 — Galería de Fotos

## Visión General
Este módulo permite a los médicos gestionar una galería de fotos para mostrar su consultorio, equipo médico, y práctica profesional. Las fotos se muestran en la página pública y ayudan a generar confianza en los pacientes.

## Alcance MVP

- **Subir Fotos**: Carga de imágenes al servidor/CDN
- **Álbumes**: Organización de fotos por categoría
- **Gestión**: Editar, eliminar, reordenar fotos
- **Página Pública**: Mostrar galería en el perfil público
- **Foto Principal**: Avatar del médico desde la galería

## Características Principales

### Tipos de Álbumes
| Tipo | Descripción | Ejemplos |
|------|-------------|----------|
| Consultorio | Fotos del espacio físico | Sala de espera, consultorio, recepción |
| Equipo | Fotos del equipo médico | Máquinas, instrumentos, tecnología |
| Procedimientos | Fotos de antes/después | Resultados de tratamientos |
| Equipo Humano | Fotos del staff | Médicos, enfermeros, recepcionistas |
| General | Otras fotos | Certificados, eventos, premios |

### Campos

#### Álbum
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Primary key |
| profileId | uuid | Médico profile (FK) |
| name | varchar | Nombre del álbum |
| type | enum | consultorio/equipo/procedimiento/equipo_humano/general |
| description | text | Descripción del álbum |
| coverPhotoId | uuid | Foto de portada (FK) |
| isPublic | boolean | Si es visible públicamente |
| createdAt | timestamp | Fecha de creación |

#### Foto
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Primary key |
| albumId | uuid | Álbum (FK) |
| profileId | uuid | Médico profile (FK) |
| assetId | uuid | Archivo de imagen (FK) |
| caption | varchar | Leyenda de la foto |
| order | integer | Orden de visualización |
| isPublic | boolean | Si es visible públicamente |
| createdAt | timestamp | Fecha de creación |

## API Endpoints

### Álbumes API (`/api/albums`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Listar todos los álbumes |
| GET | `/:id` | Obtener álbum específico |
| POST | `/` | Crear nuevo álbum |
| PUT | `/:id` | Actualizar álbum |
| DELETE | `/:id` | Eliminar álbum |
| PUT | `/reorder` | Reordenar álbumes |

### Fotos API (`/api/photos`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/album/:albumId` | Listar fotos de un álbum |
| POST | `/` | Subir nueva foto |
| PUT | `/:id` | Actualizar foto (caption, orden) |
| DELETE | `/:id` | Eliminar foto |
| PUT | `/reorder` | Reordenar fotos |

### Consultas Públicas (Sin Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/public/:profileId` | Listar álbumes públicos |
| GET | `/public/:profileId/album/:albumId` | Listar fotos de álbum |
| GET | `/public/:profileId/cover` | Obtener foto de portada |

## Integraciones

### Con M02 (Página Pública)
La galería se muestra como:
- Sección dedicada en la página pública
- Grid de miniaturas
- Modal para ver foto completa
- Slider de imágenes

### Con Assets (Módulo de Archivos)
Las fotos utilizan el sistema de assets para:
- Almacenamiento en CDN
- Optimización de imágenes
- Diferentes tamaños (thumbnail, medium, full)
- Lazy loading

## Pantallas

### Gestión de Álbumes (Dashboard)
```
┌─────────────────────────────────────────────────────────┐
│  📸 Galería de Fotos                       [+ Nuevo]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Todos] [Consultorio] [Equipo] [Procedimientos]       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🏥 Mi Consultorio                               │   │
│  │     5 fotos • Tipo: Consultorio                 │   │
│  │     [✏️ Editar] [🗑️ Eliminar] [👁️ Ver]        │   │
│  │     [Establecer como portada]                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔬 Equipo Médico                                │   │
│  │     8 fotos • Tipo: Equipo                      │   │
│  │     [✏️ Editar] [🗑️ Eliminar] [👁️ Ver]        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Ver Álbum
```
┌─────────────────────────────────────────────────────────┐
│  🏥 Mi Consultorio                          [⬅️ Volver] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📷 5 fotos                                             │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                        │
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │                        │
│  └───┘ └───┘ └───┘ └───┘ └───┘                        │
│                                                         │
│  [🗑️ Eliminar seleccionada]  [⬆️⬇️ Reordenar]          │
│                                                         │
│  [➕ Agregar fotos]                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Subir Foto
```
┌─────────────────────────────────────────────────────────┐
│  📷 Agregar Fotos al Álbum: Mi Consultorio              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │           📁 Arrastra fotos aquí                 │   │
│  │              o haz clic para subir               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Opciones:                                              │
│  ☐ Hacer esta foto la portada del álbum                │
│  ☐ Visible públicamente                                │
│                                                         │
│  [💾 Subir y Guardar]  [❌ Cancelar]                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Ejemplo de JSON

```json
{
  "id": "uuid",
  "profileId": "uuid",
  "name": "Mi Consultorio",
  "type": "consultorio",
  "description": "Fotos de nuestras instalaciones",
  "coverPhotoId": "uuid",
  "isPublic": true,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

```json
{
  "id": "uuid",
  "albumId": "uuid",
  "profileId": "uuid",
  "assetId": "uuid",
  "caption": "Sala de espera",
  "order": 1,
  "isPublic": true,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## Métricas

- **Vistas de Galería**: Visitas a la sección de fotos
- **Fotos más Vistas**: Popularidad de imágenes
- **Álbumes más Visitados**: Interés por categoría
- **Tasa de Conversión**: Pacientes que ven galería vs agendan

## Dependencias
- **M02 (Página Pública)**: Visualización de galería
- **M05 (Assets)**: Sistema de almacenamiento de imágenes
- **M06 (Dashboard)**: Widget de gestión

## Consideraciones Técnicas

### Optimización de Imágenes
- Generar thumbnails automáticamente
- Compresión sin pérdida de calidad
- Formatos modernos (WebP)
- Lazy loading para rendimiento

### Seguridad
- Validación de tipos de archivo (solo imágenes)
- Límite de tamaño por archivo (max 10MB)
- Scan de malware en uploads
- Acceso privado por defecto (público = opcional)

### Storage
- Almacenamiento en Supabase Storage o S3
- CDN para distribución global
- Backup automático de imágenes
