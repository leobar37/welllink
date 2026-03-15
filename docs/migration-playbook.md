# Playbook de Migración: De CitaBot Básico a CitaBot Pro

> **CitaBot** - Guía de Actualización  
> Versión 1.0 | Marzo 2026

---

## ¿Qué es CitaBot Pro?

**CitaBot Pro** es la versión avanzada de CitaBot que incluye:

- 📦 **Sistema de Inventario**: Controla tus productos, stock y proveedores
- ⚡ **Motor de Automatizaciones**: Automatiza tareas repetitivas
- 👥 **Gestión de Staff**: Administra tu equipo de trabajo
- 📊 **Reportes Avanzados**: Métricas y analytics detallados

### ¿Qué se mantiene igual?

- ✅ Tu cuenta y datos existentes
- ✅ Clientes y reservas actuales
- ✅ Servicios y precios
- ✅ Configuración de WhatsApp
- ✅ Tu perfil público digital

---

## Tabla de Contenidos

1. [¿Necesitas Migrar?](#necesitas-migrar)
2. [Novedades](#novedades)
3. [Antes de Migrar](#antes-de-migrar)
4. [Proceso de Migración](#proceso-de-migración)
5. [Configuración Inicial](#configuración-inicial)
6. [Migrar Inventario](#migrar-inventario)
7. [Configurar Automatizaciones](#configurar-automatizaciones)
8. [Gestión de Staff](#gestión-de-staff)
9. [Soporte](#soporte)

---

## ¿Necesitas Migrar?

### ¿Deberías actualizar a CitaBot Pro?

| Si usas... | Te Beneficia |
|------------|--------------|
| Productos físicos en tus servicios | 📦 Inventario |
| Múltiples empleados | 👥 Staff |
| Recordatorios manuales | ⚡ Automatizaciones |
| Hojas de cálculo para reportes | 📊 Analytics |
| Proveedores para insumos | 📦 Compras |

### ¿Puedes mantenerte en CitaBot Básico?

¡Por supuesto! CitaBot Básico seguirá funcionando exactamente igual. La migración es opcional.

**CitaBot Básico incluye:**
- Reservas y citas
- Perfil público digital
- WhatsApp con IA
- Dashboard básico
- Notificaciones automáticas

---

## Novedades

### 📦 Sistema de Inventario

**Gestiona tus productos como un profesional:**

```
✅ Productos con SKU, precio y costo
✅ Control de stock por ubicación
✅ Movimiento de inventario (entradas/salidas)
✅ Proveedores y órdenes de compra
✅ Alertas automáticas de stock bajo
✅ Consumo automático por servicios
```

**Antes:** ¿Comprabas shampoo y no sabías cuánto te quedaba?  
**Ahora:** Todo controlado automáticamente.

### ⚡ Motor de Automatizaciones

**Automatiza tareas repetitivas:**

```
✅ Disparadores por eventos (cita creada, completada, cancelada)
✅ Programación por horario (diario, semanal, mensual)
✅ Condiciones personalizadas
✅ Acciones: WhatsApp, Email, Actualizar registros, Crear tareas
✅ Plantillas por industria
✅ Logs de ejecución
```

**Antes:** ¿Enviabas recordatorios manualmente cada día?  
**Ahora:** El sistema lo hace solo, 24/7.

### 👥 Gestión de Staff

**Administra tu equipo:**

```
✅ Registro de empleados
✅ Roles y permisos (admin, manager, staff)
✅ Asignación de servicios
✅ Horarios de disponibilidad
✅ Citas por empleado
```

**Antes:** ¿Tus empleados compartían el mismo calendario?  
**Ahora:** Cada uno tiene su propia agenda.

### 📊 Reportes Avanzados

**Toma decisiones informadas:**

```
✅ Valoración de inventario
✅ Rotación de productos
✅ Productos más consumidos
✅ Métricas de automatizaciones
✅ KPIs por industria
✅ Exportación a Excel/PDF
```

---

## Antes de Migrar

### 1. Respalda tu Información

Antes de cualquier cambio, asegúrate de tener exportados:

- [ ] Lista de clientes (Configuración > Exportar)
- [ ] Lista de servicios
- [ ] Historial de reservas
- [ ] Configuración de WhatsApp

### 2. Evalúa tu Inventario

Haz una lista de tus productos:

| Producto | Cantidad Actual | Costo Unitario | Proveedor |
|----------|----------------|----------------|-----------|
| Shampoo 500ml | 20 | $150 | Distribuidor A |
| Tinte rubio | 50 | $45 | Distribuidor B |
| ... | ... | ... | ... |

### 3. Identifica Procesos a Automatizar

¿Qué haces manualmente que podría ser automático?

- [ ] Recordatorios de citas
- [ ] Seguimiento después de servicios
- [ ] Recuperar clientes inactivos
- [ ] Notificaciones de cumpleaños
- [ ] Avisos de inventario bajo

---

## Proceso de Migración

### Paso 1: Solicita la Actualización

Contacta a soporte@citabot.io indicando:

```
Asunto: Solicito migración a CitaBot Pro
Nombre del negocio: [tu negocio]
Plan actual: CitaBot Básico
```

### Paso 2: Confirmación

Nuestro equipo:

1. Verificará tu cuenta
2. Activará las nuevas funcionalidades
3. Te enviará las credenciales actualizadas

### Paso 3: Primer Acceso

1. Inicia sesión como siempre
2. Verás nuevas opciones en el menú:
   - **Inventario**
   - **Automatizaciones**
   - **Staff** (si aplica)
3. ¡Listo! Ya puedes comenzar a configurar

---

## Configuración Inicial

### 1. Configura tu Perfil de Negocio

Ve a **Configuración > Perfil** y verifica:

- Nombre del negocio
- Horario de atención
- Zona horaria

### 2. Explora las Nuevas Secciones

Dedica 10 minutos a navegar:

| Sección | Qué Hacer |
|---------|-----------|
| Inventario | Revisa el panel |
| Productos | Explora la lista vacía |
| Automatizaciones | Mira las plantillas |
| Staff | Revisa tu perfil |

### 3. Configura Notificaciones

Ve a **Configuración > Notificaciones** y activa:

- [ ] Alertas de stock bajo
- [ ] Reportes automáticos
- [ ] Notificaciones de automatizaciones

---

## Migrar Inventario

### Opción 1: Importación Masiva

Si tienes muchos productos:

1. Exporta tu formato de Excel
2. Usa la plantilla de importación
3. Carga el archivo

**Plantilla de Importación:**

| sku | nombre | descripcion | categoria | precio | costo | unidad | stock_minimo |
|-----|--------|-------------|-----------|--------|-------|--------|--------------|
| SH500 | Shampoo 500ml | Shampoo profesional | Belleza | 200 | 150 | pza | 10 |
| TI123 | Tinte Rubio | Tinte 7.0 | Belleza | 80 | 45 | pza | 20 |

### Opción 2: Entrada Manual

Para pocos productos:

1. Ve a **Inventario > Productos**
2. Clic en **+ Nuevo Producto**
3. Ingresa los datos

### Registrar Stock Inicial

Después de crear los productos:

1. Ve a cada producto
2. Sección **Ajustar Stock**
3. Ingresa la cantidad actual
4. Razón: **Ajuste** (inventario inicial)

### Configurar Proveedores

1. Ve a **Inventario > Proveedores**
2. Crea cada proveedor
3. En cada producto, asigna el proveedor

---

## Configurar Automatizaciones

### Usar Plantillas

La forma más rápida:

1. Ve a **Automatizaciones > Plantillas**
2. Filtra por tu industria
3. Clic en **Usar** en la plantilla deseada
4. Personaliza el mensaje
5. Activa

### Plantillas Recomendadas

| Plantilla | Cuándo Usar |
|-----------|--------------|
| Recordatorio 24h | Siempre |
| Recordatorio 2h | Siempre |
| Seguimiento post-servicio | Belleza, salud |
| Reactivación 30 días | Todos |
| Cumpleaños | Todos |
| No-show follow-up | Todos |

### Crear Automatizaciones Personalizadas

#### Ejemplo: Recordatorio de Cita

```
Nombre: Recordatorio 24h antes
Disparador: Programado (diario 2 PM)
Condición: Cita mañana = true
Acción: WhatsApp al cliente
Mensaje: Hola {{client.name}}, te recordampos que 
tienes {{appointment.service}} mañana a las {{appointment.time}}
```

#### Ejemplo: Stock Bajo

```
Nombre: Alerta Stock Bajo
Disparador: Condición (stock < stock_minimo)
Condición: Producto con stock bajo
Acción: WhatsApp al admin
Mensaje: ⚠️ Alerta: Los siguientes productos están bajo stock:
{{products}}
```

---

## Gestión de Staff

### Agregar Miembros del Equipo

1. Ve a **Staff > Equipo**
2. Clic en **+ Agregar Miembro**
3. Completa:
   - Nombre
   - Email
   - Teléfono
   - Rol: Admin | Manager | Staff

### Roles y Permisos

| Permiso | Admin | Manager | Staff |
|---------|-------|---------|-------|
| Ver dashboard | ✅ | ✅ | ✅ |
| Gestionar reservas | ✅ | ✅ | ✅ |
| Gestionar inventario | ✅ | ✅ | ❌ |
| Gestionar automatizaciones | ✅ | ✅ | ❌ |
| Gestionar staff | ✅ | ❌ | ❌ |
| Configuración | ✅ | ❌ | ❌ |

### Asignar Servicios

1. Edita un miembro del staff
2. Sección **Servicios**
3. Selecciona los servicios que puede realizar

### Horarios de Disponibilidad

1. Edita un miembro del staff
2. Sección **Horario**
3. Configura días y horas de trabajo

---

## Preguntas Frecuentes

### ¿Mi información anterior se pierde?

**No.** Todos tus datos se mantienen: clientes, servicios, reservas, historial.

### ¿Puedo revertir a CitaBot Básico?

**Sí.** En cualquier momento puedes contactar soporte para volver a tu plan anterior.

### ¿Las automatizaciones afectan a mis clientes actuales?

**No.** Las automatizaciones solo aplican a partir del momento de activación. No afectan datos históricos.

### ¿Necesito configurar todo inmediatamente?

**No.** Puedes ir activando funciones gradualmente. El sistema funciona igual sin inventario o automatizaciones.

### ¿El precio cambia?

Consulta tu plan en **Configuración > Suscripción**. Las nuevas funcionalidades pueden tener costo adicional.

---

## Timeline Sugerido

### Semana 1: Fundamentos

| Día | Tarea |
|-----|-------|
| 1 | Explorar interfaz |
| 2-3 | Migrar inventario |
| 4-5 | Configurar stock inicial |
| 6-7 | Probar con 1-2 productos |

### Semana 2: Automatizaciones

| Día | Tarea |
|-----|-------|
| 1-2 | Revisar plantillas |
| 3-4 | Activar recordatorios |
| 5 | Configurar seguimiento |
| 6-7 | Probar y ajustar |

### Semana 3: Staff (si aplica)

| Día | Tarea |
|-----|-------|
| 1-2 | Agregar staff |
| 3-4 | Configurar servicios |
| 5 | Configurar horarios |
| 6-7 | Capacitar al equipo |

---

## Soporte

### ¿Necesitas Ayuda?

| Canal | Disponibilidad |
|-------|----------------|
| Email | soporte@citabot.io |
| WhatsApp | [Tu enlace de soporte] |
| Docs | docs.citabot.io |

### Documentación Adicional

- [Guía de Inventario](./inventory-guide.md)
- [Guía de Automatizaciones](./automation-builder-guide.md)
- [API Documentation](./api-docs.md)

---

## Checklist de Migración

Antes de dar por completada la migración, verifica:

- [ ] Productos registrados con stock
- [ ] Proveedores configurados (si aplica)
- [ ] Al menos 1 automatización activada
- [ ] Staff agregado (si aplica)
- [ ] Alertas de stock configuradas
- [ ] Reportes funcionando

---

*¿Te fue útil este playbook? Comparte con otros usuarios de CitaBot - soporte@citabot.io*
