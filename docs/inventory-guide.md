# Guía del Usuario: Gestión de Inventario

> **CitaBot** - Centro de Ayuda  
> Versión 1.0 | Marzo 2026

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Productos](#productos)
3. [Categorías](#categorías)
4. [Proveedores](#proveedores)
5. [Movimientos de Stock](#movimientos-de-stock)
6. [Órdenes de Compra](#órdenes-de-compra)
7. [Alertas de Stock Bajo](#alertas-de-stock-bajo)
8. [Reportes](#reportes)
9. [Integración con Servicios](#integración-con-servicios)

---

## Introducción

El sistema de **Gestión de Inventario** de CitaBot te permite llevar un control completo de tus productos, desde la compra a proveedores hasta el consumo en servicios. Características principales:

- ✅ Registro de productos con SKU, precio y costo
- ✅ Control de stock por ubicación
- ✅ Seguimiento de movimientos (entradas, salidas, ajustes)
- ✅ Gestión de proveedores y órdenes de compra
- ✅ Alertas automáticas de stock bajo
- ✅ Consumo automático de inventario por servicios

---

## Productos

### Crear un Producto

1. Ve a **Inventario** > **Productos**
2. Haz clic en **+ Nuevo Producto**
3. Completa los campos:

| Campo | Descripción | Requerido |
|-------|-------------|------------|
| **SKU** | Código único de identificación | Sí |
| **Nombre** | Nombre del producto | Sí |
| **Descripción** | Descripción detallada | No |
| **Categoría** | Categoría del producto | No |
| **Precio de Venta** | Precio al que vendes | Sí |
| **Costo** | Precio de compra al proveedor | No |
| **Unidad** | Unidad de medida (pza, kg, lt) | Sí |
| **Stock Mínimo** | Umbral para alertas | No |
| **Fecha de Vencimiento** | Para productos perecederos | No |
| **Proveedor** | Proveedor principal | No |

4. Haz clic en **Guardar**

### Editar un Producto

1. Ve a **Inventario** > **Productos**
2. Haz clic en el producto que deseas editar
3. Modifica los campos necesarios
4. Haz clic en **Guardar**

**Nota:** Los cambios en precio o costo no afectan el valor del stock existente.

### Buscar y Filtrar Productos

Usa los filtros disponibles:

- **Buscar**: Por nombre o SKU
- **Categoría**: Filtra por categoría
- **Proveedor**: Filtra por proveedor
- **Estado**: Activos / Inactivos / Todos

### Eliminar un Producto

Los productos se **eliminan lógicamente** (soft delete). El producto不会再 visible en la lista pero los datos históricos se preservan.

---

## Categorías

### Crear una Categoría

1. Ve a **Inventario** > **Categorías**
2. Haz clic en **+ Nueva Categoría**
3. Ingresa el nombre y descripción
4. Haz clic en **Guardar**

### Categorías Predefinidas

El sistema incluye categorías por defecto:

- **Belleza**: Champú, Acondicionador, Tintes, Cremas, Uñas
- **Fitness**: Suplementos, Accesorios, Ropa deportiva
- **General**: Suministros, Limpieza, Empaque

---

## Proveedores

### Crear un Proveedor

1. Ve a **Inventario** > **Proveedores**
2. Haz clic in **+ Nuevo Proveedor**
3. Completa los datos:

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Nombre de la empresa |
| **Persona de Contacto** | Nombre del contacto |
| **Teléfono** | Teléfono de contacto |
| **Email** | Correo electrónico |
| **Dirección** | Dirección fiscal |
| **RFC/Tax ID** | Identificador fiscal |
| **Términos de Pago** | Condiciones de pago |
| **Notas** | Notas adicionales |

4. Haz clic en **Guardar**

### Vincular Productos a Proveedor

1. Ve al detalle del proveedor
2. Sección **Productos Suministrados**
3. Haz clic en **+ Agregar Producto**
4. Ingresa:
   - Producto
   - SKU del proveedor
   - Precio de costo
   - Tiempo de entrega (días)

### Ver Historial de Órdenes

En el detalle del proveedor, sección **Historial de Órdenes**, puedes ver todas las órdenes de compra asociadas.

---

## Movimientos de Stock

Cada cambio en el stock se registra como un **movimiento** con:

- Fecha y hora
- Producto afectado
- Cantidad (positiva para entradas, negativa para salidas)
- Tipo de movimiento
- Razón/Motivo
- Usuario que realizó el cambio
- Referencia (orden de compra, cita, etc.)

### Tipos de Movimiento

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| **Entrada** | Stock que ingresa | Compra a proveedor |
| **Salida** | Stock que sale | Venta directa |
| **Ajuste** | Corrección de inventario | Inventario físico |
| **Consumo** | Uso en servicios | Cita completada |
| **Devolución** | Cliente devuelve producto | Returno de venta |
| **Vencimiento** | Producto venceu | Producto expirado |

### Registrar un Ajuste de Stock

1. Ve a **Inventario** > **Productos**
2. Selecciona el producto
3. Sección **Ajustar Stock**
4. Ingresa:
   - Cantidad (positiva o negativa)
   - Razón: Compra, Venta, Daño, Devolución, Ajuste, Otro
   - Notas adicionales
5. Haz clic en **Ajustar**

---

## Órdenes de Compra

### Crear una Orden de Compra

1. Ve a **Inventario** > **Órdenes de Compra**
2. Haz clic en **+ Nueva Orden**
3. Selecciona el **Proveedor**
4. Define la **Fecha Esperada de Entrega**
5. Agrega los **productos**:

| Campo | Descripción |
|-------|-------------|
| **Producto** | Producto a ordenar |
| **Cantidad** | Cantidad a comprar |
| **Precio Unitario** | Costo por unidad |
| **Subtotal** | Cantidad × Precio |

6. El sistema calcula automáticamente:
   - Subtotal
   - Impuestos
   - Total

7. Haz clic en **Crear Orden**

### Estados de la Orden

| Estado | Descripción |
|--------|-------------|
| **Borrador** | Orden creada, aún no enviada |
| **Enviada** | Orden enviada al proveedor |
| **Parcial** | Algunos productos recibidos |
| **Recibida** | Orden completamente recibida |
| **Cancelada** | Orden cancelada |

### Recibir una Orden

1. Ve a **Inventario** > **Órdenes de Compra**
2. Selecciona la orden
3. Sección **Recibir Productos**
4. Ingresa las cantidades recibidas por producto
5. Haz clic en **Recibir**

**Resultado:**
- El stock de cada producto aumenta
- Se crean registros de movimiento de stock
- El estado de la orden se actualiza

### Recepción Parcial

Puedes recibir solo algunos productos y completar el resto después:

1. Ingresa solo las cantidades recibidas
2. El estado cambia a **Parcial**
3. Cuando recibas el resto, repite el proceso

---

## Alertas de Stock Bajo

### Configurar Stock Mínimo

1. Ve a **Inventario** > **Productos**
2. Edita un producto
3. En **Stock Mínimo**, ingresa la cantidad mínima
4. Guarda los cambios

### Recibir Alertas

El sistema verifica diariamente el stock:

- Si `stock_actual < stock_mínimo`, se genera una alerta
- La alerta se envía por WhatsApp al administrador
- También puedes ver las alertas en **Dashboard** > **Alertas**

### Productos con Alerta

En la lista de productos, los productos bajo stock mínimo se muestran con:

- Indicador visual (color rojo)
- Etiqueta "Stock Bajo"
- Filtrar por: **Estado de Stock** > **Bajo**

---

## Reportes

### Reporte de Valoración de Inventario

Muestra el valor total del inventario:

- Valor por producto = Stock × Costo
- Valor por categoría = Suma de productos en categoría
- Valor total = Suma de todos los productos

### Reporte de Rotación

Mide qué tan rápido se consume el inventario:

- **Rotación** = Consumo / Stock Promedio
- Productos de alta rotación = mayor demanda
- Productos de baja rotación = considerar reducir stock

### Top Productos Consumidos

Lista de productos más usados en un período:

- Ordenado por cantidad consumida
- Ordenado por valor consumido
- Filtrable por fecha

### Exportar Reportes

1. Ve a **Reportes** > **Inventario**
2. Selecciona el tipo de reporte
3. Configura el rango de fechas
4. Haz clic en **Exportar**
5. Elige formato: **Excel** o **PDF**

---

## Integración con Servicios

### Vincular Productos a Servicios

1. Ve a **Servicios** > **Gestión de Servicios**
2. Edita un servicio
3. Sección **Productos Requeridos**
4. Agrega los productos que se consumen:

| Campo | Descripción |
|-------|-------------|
| **Producto** | Producto a consumir |
| **Cantidad** | Unidades consumidas por cita |
| **Requerido** | Si es obligatorio para el servicio |

### Consumo Automático de Stock

Cuando se **completa una cita**:

1. El sistema identifica el servicio realizado
2. Busca los productos vinculados
3. **Resta** la cantidad correspondiente del stock
4. Registra el movimiento de tipo **Consumo**

**Ejemplo:**
- Servicio: "Corte de cabello + Lavado"
- Productos: Shampoo (50ml), Acondicionador (50ml)
- Al completar la cita: -50ml Shampoo, -50ml Acondicionador

### Validación de Stock

Al intentar **confirmar una cita**:

1. El sistema verifica stock de todos los productos requeridos
2. Si algún producto no tiene stock suficiente:
   - Se muestra advertencia
   - Opcionalmente, se puede bloquear la confirmación

---

## Configuración de Ubicaciones

### Agregar Ubicaciones

Si tienes múltiples almacenes o ubicaciones:

1. Ve a **Inventario** > **Configuración** > **Ubicaciones**
2. Agrega las ubicaciones:
   - Nombre (ej: "Almacén Principal", "Sucursal Centro")
   - Descripción

### Stock por Ubicación

Cada producto puede tener stock diferente por ubicación:

1. Edita un producto
2. Sección **Stock por Ubicación**
3. Ajusta la cantidad por ubicación

---

## Mejores Prácticas

### ✅ Recomendaciones

1. **SKU único**: Mantén un código SKU diferente para cada producto
2. **Categorías claras**: Organiza productos en categorías lógicas
3. **Stock mínimo realista**: Configura umbrales basados en tu velocidad de venta
4. **Recibe ordenes completas**: Registra la recepción inmediatamente
5. **Revisa alertas**: Consulta diariamente las notificaciones de stock bajo

### ❌ Errores Comunes

1. **No registrar productos**: Todo comienza con un buen registro
2. **Olvidar el costo**: Sin costo no puedes calcular márgenes
3. **Stock mínimo muy bajo**: Genera alertas tardías
4. **No recibir órdenes**: Mantén el registro al día
5. **Ignorar consume de servicios**: Configura los productos vinculados

---

## Solución de Problemas

### El stock no disminuye al completar cita

1. Verifica que el servicio tenga **productos vinculados**
2. Confirma que los productos estén marcados como **requeridos**
3. Revisa el log de **movimientos de stock**

### La alerta no se envía

1. Verifica que el **stock mínimo** esté configurado
2. Confirma que el **número de WhatsApp** del administrador esté registrado
3. Revisa la configuración de **notificaciones**

### El costo no aparece en reportes

1. Asegúrate de ingresar el **costo** en cada producto
2. El costo en la orden de compra es referencial
3. El costo del producto es el que se usa para cálculos

---

## Próximos Pasos

¿Necesitas más ayuda? Explora estos recursos:

- [Guía del Constructor de Automatizaciones](./automation-builder-guide.md)
- [API Documentation](./api-docs.md)
- [Playbook de Migración](./migration-playbook.md)

---

*¿Te fue útil esta guía? Contáctanos soporte@citabot.io*
