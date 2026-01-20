# Script de Medios - Media Script

## Contexto y Propósito

Este documento describe el uso del script `media`, una herramienta CLI para generación de imágenes y videos usando modelos de IA de Replicate.

### ¿Cuándo Usar Este Script?

Este script de medios debe usarse en los siguientes escenarios:

**✅ Casos de Uso Apropiados:**

1. **Contenido Visual para Perfiles de Profesionales**
   - Generar avatares y fotos de perfil para wellness professionals
   - Crear imágenes de portada para perfiles
   - Generar contenido visual personalizado para cada profesional

2. **Marketing y Promoción**
   - Crear contenido para redes sociales
   - Generar banners promocionales
   - Producir videos introductorios para profesionales
   - Crear material visual para campañas de marketing

3. **Recursos del Dashboard**
   - Generar imágenes ilustrativas para el dashboard
   - Crear iconografía personalizada
   - Producir contenido multimedia para guías y tutoriales

4. **Contenido Educativo**
   - Crear videos explicativos sobre wellness
   - Generar infografías y material educativo
   - Producir animaciones para contenido instructivo

5. **Mejora de Recursos Existentes**
   - Remover fondos de imágenes de productos/servicios
   - Mejorar la calidad de imágenes existentes
   - Crear variaciones de contenido visual

**❌ Casos de Uso NO Recomendados:**

1. **Generación Masiva Automatizada**
   - No usar para generar contenido en lote sin supervisión
   - No automatizar para spam o contenido masivo

2. **Contenido Sin Relación con Wellness**
   - Evitar generar contenido no relacionado con el propósito de la plataforma
   - No usar para proyectos externos ajenos a MediApp

3. **Como Reemplazo de Contenido Humano**
   - No intended para reemplazar fotografía profesional real
   - Usar como herramienta complementaria, no sustituta

### Integración con el Proyecto

Este script complementa las funcionalidades del proyecto MediApp, que utiliza:

- **Frontend:** React 19 + Vite + Tailwind v4 + shadcn/ui
- **Backend:** Bun + Elysia REST API
- **Documentación:** PRDs en `docs/global-prd.md` y módulos en `docs/modules/`

**📖 Referencias:**

- Guía general del proyecto: [`Agents.md`](./Agents.md)
- PRD Global (español): [`docs/global-prd.md`](./global-prd.md)
- Módulos del proyecto: [`docs/modules/`](./modules/)

## Instalación

Antes de usar el script, asegúrate de instalar las dependencias:

```bash
bun install
```

## Uso

El script está disponible a través de Bun con el comando:

```bash
bun run media <comando> [opciones]
```

O directamente:

```bash
bun run scripts/media.ts <comando> [opciones]
```

## Comandos Disponibles

### Comandos de Imágenes

#### 1. nano - Generación de Imágenes (Google Nano Banana)

Genera imágenes utilizando el modelo Google Nano Banana.

```bash
bun run media nano [opciones]
```

**Opciones:**

- `-p, --prompt <prompt>`: Prompt de texto para la generación (por defecto: "Make the sheets in the style of the logo. Make the scene natural.")
- `-i, --images <images...>`: URLs de imágenes o rutas locales (opcional, puede especificar múltiples)
- `-o, --output <filename>`: Nombre del archivo de salida (por defecto: "output.jpg")

**Ejemplos:**

```bash
# Generar desde texto
bun run media nano -p "Una puesta de sol en la montaña" -o sunset.jpg

# Generar desde texto con imagen de referencia
bun run media nano -p "Transforma este estilo en una escena nocturna" -i reference.jpg -o night-scene.jpg

# Generar con múltiples imágenes de referencia
bun run media nano -p "Crea una composición con estos elementos" -i img1.jpg img2.jpg img3.jpg -o composition.jpg
```

---

#### 2. flux - Generación de Imágenes (Black Forest Labs Flux)

Genera imágenes usando el modelo Flux Kontext Max con soporte para diferentes relaciones de aspecto.

```bash
bun run media flux [opciones]
```

**Opciones:**

- `-p, --prompt <prompt>`: Prompt de texto (por defecto: "Make the letters 3D, floating in space on a city street")
- `-i, --input-image <url>`: URL de imagen o ruta local para contexto
- `-f, --format <format>`: Formato de salida (jpg, png) - por defecto: jpg
- `-a, --aspect <ratio>`: Relación de aspecto (1:1, 16:9, 9:16, 4:3, 3:4, etc.) - por defecto: 1:1
- `-o, --output <filename>`: Nombre del archivo de salida

**Ejemplos:**

```bash
# Generar imagen cuadrada
bun run media flux -p "Logo moderno de wellness" -a 1:1 -o logo.jpg

# Generar imagen panorámica
bun run media flux -p "Paisaje urbano futurista" -a 16:9 -o panorama.jpg

# Generar imagen vertical para móvil
bun run media flux -p "Retrato artístico" -a 9:16 -o portrait.jpg

# Usar imagen de referencia
bun run media flux -p "Convierte esto en estilo cartoon" -i input.jpg -f png -o cartoon.png
```

---

#### 3. remove-bg - Remover Fondo

Remueve el fondo de una imagen usando Bria AI.

```bash
bun run media remove-bg [opciones]
```

**Opciones:**

- `-i, --image <path>`: Ruta o URL de la imagen (requerido)
- `-o, --output <filename>`: Nombre del archivo de salida (por defecto: "no-bg.png")

**Ejemplos:**

```bash
# Remover fondo de imagen local
bun run media remove-bg -i photo.jpg -o photo-no-bg.png

# Remover fondo desde URL
bun run media remove-bg -i https://example.com/image.jpg -o clean.png
```

---

#### 4. enhance - Mejorar Calidad

Mejora la calidad y resolución de una imagen usando Bria AI.

```bash
bun run media enhance [opciones]
```

**Opciones:**

- `-i, --image <path>`: Ruta o URL de la imagen (requerido)
- `-s, --scale <number>`: Factor de aumento de resolución (2, 4, o 8) - por defecto: 4
- `-o, --output <filename>`: Nombre del archivo de salida

**Ejemplos:**

```bash
# Mejorar calidad al doble
bun run media enhance -i low-res.jpg -s 2 -o enhanced-2x.jpg

# Mejorar calidad al cuádruple (por defecto)
bun run media enhance -i medium-res.jpg -o enhanced-4x.jpg

# Mejorar calidad al octuple
bun run media enhance -i small.jpg -s 8 -o enhanced-8x.jpg
```

---

### Comandos de Videos

#### 5. hailuo - Generación de Videos (MiniMax Hailuo 2.3)

Genera videos de alta calidad usando MiniMax Hailuo 2.3 (modelo más reciente).

```bash
bun run media hailuo [opciones]
```

**Opciones:**

- `-p, --prompt <prompt>`: Prompt de texto para el video
- `-i, --image <path>`: Ruta de imagen para conversión imagen-a-video
- `-d, --duration <duration>`: Duración del video (6s, 10s) - por defecto: 6s
- `-q, --quality <quality>`: Calidad (standard para 768p o pro para 1080p) - por defecto: standard
- `-o, --output <filename>`: Nombre del archivo de salida

**Ejemplos:**

```bash
# Generar video desde texto (6 segundos, calidad estándar)
bun run media hailuo -p "Olas del océano al atardecer" -o ocean-sunset.mp4

# Generar video largo en alta calidad
bun run media hailuo -p "Time-lapse de una ciudad" -d 10s -q pro -o timelapse.mp4

# Convertir imagen a video
bun run media hailuo -i static-image.jpg -p "Añade movimiento a esta escena" -o animated.mp4
```

---

#### 6. hailuo2 - Generación de Videos (MiniMax Hailuo 02)

Genera videos con excelente física usando MiniMax Hailuo 02.

```bash
bun run media hailuo2 [opciones]
```

**Opciones:**

- `-p, --prompt <prompt>`: Prompt de texto para el video
- `-i, --image <path>`: Ruta de imagen para conversión imagen-a-video
- `-d, --duration <duration>`: Duración del video (6s, 10s) - por defecto: 6s
- `-q, --quality <quality>`: Calidad (standard para 768p o pro para 1080p) - por defecto: standard
- `-o, --output <filename>`: Nombre del archivo de salida

**Ejemplos:**

```bash
# Generar video con física realista
bun run media hailuo2 -p "Pelota rebotando realisticamente" -o physics.mp4

# Generar video de alta calidad
bun run media hailuo2 -p "Escena de lluvia" -q pro -o rain.mp4
```

---

#### 7. hailuo-fast - Generación de Videos Rápida

Genera videos rápidamente y a menor costo usando MiniMax Hailuo 02 Fast (512p).

```bash
bun run media hailuo-fast [opciones]
```

**Opciones:**

- `-p, --prompt <prompt>`: Prompt de texto para el video
- `-i, --image <path>`: Ruta de imagen para conversión imagen-a-video
- `-d, --duration <duration>`: Duración del video (6s, 10s) - por defecto: 6s
- `-o, --output <filename>`: Nombre del archivo de salida

**Ejemplos:**

```bash
# Generación rápida y económica
bun run media hailuo-fast -p "Nubes moviéndose" -o clouds.mp4

# Conversión rápida imagen-a-video
bun run media hailuo-fast -i foto.jpg -p "Añade viento" -o windy.mp4
```

---

#### 8. director - Videos con Movimientos de Cámara

Genera videos con movimientos de cámara específicos usando MiniMax Video-01 Director.

```bash
bun run media director [opciones]
```

**Opciones:**

- `-p, --prompt <prompt>`: Prompt de texto para el video
- `-i, --image <path>`: Ruta o URL de imagen
- `-c, --camera <movement>`: Movimiento de cámara (ej: pan-left, zoom-in, orbit, tracking-shot, tilt-up, etc.)
- `-o, --output <filename>`: Nombre del archivo de salida

**Ejemplos:**

```bash
# Video con paneo hacia la izquierda
bun run media director -p "Paisaje montañoso" -c pan-left -o pan.mp4

# Video con zoom in
bun run media director -p "Rostroclose-up" -c zoom-in -o zoom.mp4

# Video con órbita alrededor del sujeto
bun run media director -i person.jpg -c orbit -o orbit.mp4

# Video con toma de seguimiento
bun run media director -p "Coche en movimiento" -c tracking-shot -o tracking.mp4
```

**Movimientos de cámara disponibles:**

- `pan-left`, `pan-right`: Paneo horizontal
- `tilt-up`, `tilt-down`: Inclinación vertical
- `zoom-in`, `zoom-out`: Zoom
- `orbit`: Órbita alrededor del sujeto
- `tracking-shot`: Toma de seguimiento
- `dolly-in`, `dolly-out`: Travelling hacia adelante/atrás

---

#### 9. live - Videos Animados (Live2D)

Genera videos animados desde imágenes usando MiniMax Video-01 Live, optimizado para Live2D y animación.

```bash
bun run media live [opciones]
```

**Opciones:**

- `-i, --image <path>`: Ruta o URL de imagen (requerido)
- `-p, --prompt <prompt>`: Prompt opcional para el estilo de animación
- `-o, --output <filename>`: Nombre del archivo de salida

**Ejemplos:**

```bash
# Animar imagen de personaje
bun run media live -i character.png -o animated-character.mp4

# Animar con prompt de estilo
bun run media live -i portrait.jpg -p "Animación sutil y suave" -o subtle-animation.mp4

# Animar ilustración
bun run media live -i illustration.jpg -p "Hacer que las pestañas parpadeen" -o blinking.mp4
```

---

## Archivos de Salida

Todos los archivos generados se guardan en el directorio `public/` del proyecto actual. La estructura será:

```
project-root/
├── public/
│   ├── output.jpg
│   ├── video.mp4
│   ├── enhanced.png
│   └── ...
```

## Requisitos

- **Bun**: Asegúrate de tener Bun instalado
- **Conexión a Internet**: Necesaria para comunicarse con la API de Replicate
- **Token de API**: El script ya incluye un token hardcodeado para Replicate

## Notas Importantes

1. **Tamaño de archivos**: Los videos y imágenes de alta resolución pueden tardar más en generarse
2. **Límites de API**: Replicate tiene límites de rate; si encuentras errores, espera un momento e inténtalo de nuevo
3. **Formatos soportados**:
   - Imágenes: JPG, PNG
   - Videos: MP4
4. **Calidad vs Velocidad**: Usa `hailuo-fast` para pruebas rápidas y `hailuo`/`hailuo2` para resultados finales

## Solución de Problemas

### Error: "File does not exist"

- Verifica que la ruta de la imagen sea correcta
- Usa rutas absolutas o relativas desde el directorio del proyecto

### Error: "Either --prompt or --image is required"

- Para videos, debes proporcionar al menos uno de: `-p` (prompt) o `-i` (imagen)

### Error de autenticación

- El script incluye un token de API preconfigurado
- Si encuentras errores, contacta al administrador para actualizar el token

## Ejemplos de Flujo Completo

### Flujo 1: Crear un logo y convertirlo en video

```bash
# 1. Generar imagen base
bun run media nano -p "Logo minimalista de wellness" -o logo.jpg

# 2. Remover fondo
bun run media remove-bg -i logo.jpg -o logo-clean.png

# 3. Mejorar calidad
bun run media enhance -i logo-clean.png -s 4 -o logo-hd.png

# 4. Crear video animado
bun run media live -i logo-hd.png -p "Rotación suave del logo" -o logo-animation.mp4
```

### Flujo 2: Crear contenido para redes sociales

```bash
# Generar imagen vertical para stories
bun run media flux -p "Paisaje inspirador" -a 9:16 -o story.jpg

# Crear video corto para reel
bun run media hailuo-fast -p "Transición suave" -d 6s -o reel.mp4

# Video con movimiento de cámara
bun run media director -i story.jpg -c zoom-in -o cinematic.mp4
```
