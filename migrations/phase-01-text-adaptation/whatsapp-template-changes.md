# WhatsApp Template Changes - Wellness to Medical

## Template Content Transformations

### 1. Welcome/Introduction Templates

#### Before: Wellness Welcome

```json
{
  "name": "wellness_welcome",
  "content": "¡Hola! Soy tu asesor de bienestar digital. Estoy aquí para ayudarte en tu viaje hacia una vida más saludable. ¿En qué puedo asistirte hoy?"
}
```

#### After: Medical Welcome

```json
{
  "name": "medical_welcome",
  "content": "¡Hola! Soy tu asistente médico virtual. Estoy aquí para ayudarte con el agendamiento de citas y resolver tus dudas sobre nuestros servicios médicos. ¿En qué puedo asistirte hoy?"
}
```

### 2. Health Survey Templates

#### Before: Wellness Survey

```json
{
  "name": "wellness_survey_start",
  "content": "Vamos a comenzar con tu evaluación de bienestar. Esto nos ayudará a crear un plan personalizado para ti. ¿Estás listo?"
}
```

#### After: Medical Intake

```json
{
  "name": "medical_intake_start",
  "content": "Vamos a comenzar con tu evaluación médica inicial. Esto nos ayudará a entender mejor tus necesidades de atención médica. ¿Estás listo?"
}
```

### 3. Service Recommendation Templates

#### Before: Wellness Recommendations

```json
{
  "name": "wellness_recommendations",
  "content": "Basado en tu perfil de bienestar, te recomiendo: {recommendations}. ¿Te gustaría saber más sobre estos servicios?"
}
```

#### After: Medical Recommendations

```json
{
  "name": "medical_recommendations",
  "content": "Basado en tu evaluación médica, te recomiendo los siguientes servicios: {recommendations}. ¿Te gustaría agendar una consulta para discutir tu tratamiento?"
}
```

### 4. Appointment Confirmation Templates

#### Before: General Confirmation

```json
{
  "name": "appointment_confirmation",
  "content": "Tu cita ha sido confirmada para el {date} a las {time}. Nos vemos pronto para continuar con tu viaje de bienestar."
}
```

#### After: Medical Confirmation

```json
{
  "name": "medical_appointment_confirmation",
  "content": "Tu cita médica ha sido confirmada para el {date} a las {time} con el {doctor_name}. Por favor traer tu identificación y seguro médico. Nos vemos pronto."
}
```

### 5. Reminder Templates

#### Before: Wellness Reminder

```json
{
  "name": "wellness_reminder",
  "content": "¡Hola! Recordatorio de tu cita de bienestar mañana a las {time}. Prepárate para continuar con tu camino hacia una vida más saludable."
}
```

#### After: Medical Reminder

```json
{
  "name": "medical_appointment_reminder",
  "content": "¡Hola! Recordatorio de tu cita médica mañana a las {time} con el {doctor_name}. Por favor traer: identificación, seguro médico, y cualquier estudio reciente. Nos vemos pronto."
}
```

### 6. Follow-up Templates

#### Before: Wellness Follow-up

```json
{
  "name": "wellness_followup",
  "content": "¿Cómo te sientes después de tu sesión de bienestar? Recuerda seguir tus recomendaciones para mantener tu progreso."
}
```

#### After: Medical Follow-up

```json
{
  "name": "medical_followup",
  "content": "¿Cómo te sientes después de tu consulta médica? Recuerda seguir las indicaciones del doctor y tomar tus medicamentos según lo prescrito."
}
```

### 7. Service Catalog Templates

#### Before: Wellness Services

```json
{
  "name": "service_catalog",
  "content": "📋 *Catálogo de Servicios de Bienestar*\n\n🧘 Sesión de meditación guiada\n💪 Plan de ejercicios personalizado\n🥗 Asesoría nutricional\n🌿 Terapia holística\n\n¿Cuál te interesa?"
}
```

#### After: Medical Services

```json
{
  "name": "medical_service_catalog",
  "content": "📋 *Catálogo de Servicios Médicos*\n\n🏥 Consulta general\n🔬 Análisis clínicos\n💊 Control de medicamentos\n📋 Chequeo médico completo\n\n¿Cuál servicio necesitas?"
}
```

### 8. Location/Clinic Information Templates

#### Before: Wellness Location

```json
{
  "name": "location_info",
  "content": "📍 *Ubicación de bienestar*\n\nNos encontramos en: {address}\nHorarios: {schedule}\nContacto: {phone}\n\n¡Te esperamos para comenzar tu viaje de bienestar!"
}
```

#### After: Medical Clinic Info

```json
{
  "name": "clinic_info",
  "content": "🏥 *Información de la Clínica*\n\n📍 Dirección: {address}\n🕐 Horarios de atención: {schedule}\n📞 Contacto: {phone}\n🅿️ Estacionamiento disponible\n\n¡Te esperamos para tu consulta médica!"
}
```

### 9. Payment Information Templates

#### Before: Wellness Payment

```json
{
  "name": "payment_methods",
  "content": "💳 *Métodos de pago para servicios de bienestar*\n\n• Efectivo\n• Tarjeta de crédito/débito\n• Transferencia bancaria\n• Pagos digitales\n\n¿Cuál prefieres?"
}
```

#### After: Medical Payment

```json
{
  "name": "medical_payment_methods",
  "content": "💳 *Métodos de pago aceptados*\n\n• Efectivo\n• Tarjeta de crédito/débito\n• Transferencia bancaria\n• Seguros médicos (verificar cobertura)\n• Planes de pago\n\n¿Con cuál deseas pagar tu consulta?"
}
```

### 10. Cancellation Templates

#### Before: Wellness Cancellation

```json
{
  "name": "cancellation_policy",
  "content": "Para cancelar tu sesión de bienestar, por favor avísanos al menos 24 horas antes. Así podemos reprogramar y ayudar a otros en su camino de bienestar."
}
```

#### After: Medical Cancellation

```json
{
  "name": "medical_cancellation_policy",
  "content": "Para cancelar tu cita médica, por favor avísanos al menos 24 horas antes. Esto nos permite atender a otros pacientes y reprogramar tu consulta en el próximo horario disponible."
}
```

## Variable Updates for Templates

### Before: Wellness Variables

```json
{
  "variables": [
    { "name": "client_name", "type": "text", "example": "María" },
    { "name": "wellness_goal", "type": "text", "example": "bajar de peso" },
    { "name": "health_focus", "type": "text", "example": "nutrición" },
    { "name": "lifestyle", "type": "text", "example": "activo" }
  ]
}
```

### After: Medical Variables

```json
{
  "variables": [
    { "name": "patient_name", "type": "text", "example": "María" },
    { "name": "medical_specialty", "type": "text", "example": "cardiología" },
    { "name": "treatment_type", "type": "text", "example": "consulta general" },
    { "name": "doctor_name", "type": "text", "example": "Dr. Juan Pérez" },
    { "name": "appointment_type", "type": "text", "example": "consulta" },
    { "name": "medical_service", "type": "text", "example": "chequeo general" }
  ]
}
```

## Implementation Priority

1. **High Priority**: Welcome, appointment confirmation, reminders
2. **Medium Priority**: Service catalog, location info, payment
3. **Low Priority**: Follow-up, cancellation policies

## Files to Update

- WhatsApp template service definitions
- Template variable configurations
- Message sending logic
- Template approval workflows
