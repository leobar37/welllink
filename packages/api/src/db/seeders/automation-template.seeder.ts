import { db } from "../index";
import { automationTemplate } from "../schema/automation-template";

/**
 * Seed automation templates - pre-built automation templates by business type
 * 
 * Templates include:
 * - Post-treatment reminder: After appointment completed, send reminder to book next appointment
 * - Client reactivation: After X days of inactivity, send reactivation message
 * - Class reminder: Before class starts, send reminder
 * - Birthday greeting: On client's birthday, send birthday wish
 * - Welcome message: When new client is created, send welcome message
 * - No-show follow-up: After no-show, send follow-up message
 */
export async function seedAutomationTemplates() {
  console.log("🌱 Seeding automation templates...\n");

  const templates = [
    // ========================================
    // BEAUTY templates (beauty, hair, nails, spa)
    // ========================================
    {
      name: "Recordatorio Post-Tratamiento",
      description: "Envía un recordatorio amigable después de un tratamiento para agendar la próxima cita. Mantén a tus clientes volver.",
      category: "retencion",
      businessTypeKey: "beauty",
      icon: "calendar-heart",
      isActive: true,
      defaultName: "Recordatorio Post-Tratamiento",
      defaultDescription: "Recordatorio automático para agendar próxima cita",
      triggerConfig: {
        type: "event",
        eventType: "appointment.completed",
      },
      actionConfigs: [
        {
          type: "whatsapp",
          name: "Enviar recordatorio de seguimiento",
          order: 0,
          recipientType: "client",
          message: "¡Hola! 👋 Gracias por visitarnos hoy. Esperamos que hayas disfrutado tu tratamiento. ¿Te gustaría agendar tu próxima cita? Estamos felices de ayudarte a mantener tu look perfecto. 💅✨",
        },
      ],
      tags: ["recordatorio", "seguimiento", "belleza", "retencion"],
    },
    {
      name: "Reactivación de Cliente Inactivo",
      description: "Recupera clientes que no han visitado en 30+ días con un mensaje personalizado.",
      category: "reactivacion",
      businessTypeKey: "beauty",
      icon: "user-refresh",
      isActive: true,
      defaultName: "Reactivación de Cliente",
      defaultDescription: "Mensaje de reactivación para clientes inactivos",
      triggerConfig: {
        type: "condition",
        entityType: "client",
        conditions: [
          {
            field: "daysSinceLastAppointment",
            operator: "gte",
            value: 30,
          },
        ],
      },
      actionConfigs: [
        {
          type: "whatsapp",
          name: "Enviar mensaje de reactivación",
          order: 0,
          recipientType: "client",
          message: "¡Te extrañamos! 🥺 Ha pasado un tiempo desde tu última visita y queremos verte de nuevo. ¿Qué tal si reservas tu próximo tratamiento? Tenemos ofertas especiales para ti. 💆‍♀️✨",
        },
      ],
      tags: ["reactivacion", "inactivo", "belleza", "marketing"],
    },
    {
      name: "Mensaje de Bienvenida",
      description: "Da la bienvenida a nuevos clientes con un mensaje cálido y útil.",
      category: "bienvenida",
      businessTypeKey: "beauty",
      icon: "hand-wave",
      isActive: true,
      defaultName: "Bienvenida Nuevo Cliente",
      defaultDescription: "Mensaje de bienvenida para nuevos clientes",
      triggerConfig: {
        type: "event",
        eventType: "client.created",
      },
      actionConfigs: [
        {
          type: "whatsapp",
          name: "Enviar mensaje de bienvenida",
          order: 0,
          recipientType: "client",
          message: "¡Bienvenido/a a nuestro salon! 🎉 Estamos muy felices de tenerte con nosotros. Aquí encontrarás los mejores tratamientos de belleza. ¿Te gustaría conocer nuestros servicios? ¡Contáctanos para agendar tu primera cita! 💅✨",
        },
      ],
      tags: ["bienvenida", "nuevo cliente", "belleza"],
    },
    {
      name: "Seguimiento Cliente No Asistió",
      description: "Contacta amablemente a clientes que no asisticron a su cita.",
      category: "seguimiento",
      businessTypeKey: "beauty",
      icon: "calendar-x",
      isActive: true,
      defaultName: "Seguimiento No Asistió",
      defaultDescription: "Seguimiento a clientes que no asistió a su cita",
      triggerConfig: {
        type: "event",
        eventType: "appointment.no_show",
      },
      actionConfigs: [
        {
          type: "whatsapp",
          name: "Enviar seguimiento",
          order: 0,
          recipientType: "client",
          message: "Hola, notamos que no pudiste asistir a tu cita hoy. ¡No te preocupes! Estamos para ayudarte. ¿Te gustaría reagendar? We'd love to see you soon. 😊",
        },
      ],
      tags: ["no-show", "seguimiento", "belleza", "asistencia"],
    },

    // ========================================
    // HEALTH templates (medical, dental, physiotherapy)
    // ========================================
    {
      name: "Recordatorio de Cita Médica",
      description: "Envía un recordatorio antes de la cita médica para reducir ausencias.",
      category: "recordatorio",
      businessTypeKey: "health",
      icon: "calendar-check",
      isActive: true,
      defaultName: "Recordatorio de Cita",
      defaultDescription: "Recordatorio antes de cita médica",
      triggerConfig: {
        type: "schedule",
        cronExpression: "0 18 * * *",
        hours: [18],
        daysOfWeek: [1, 2, 3, 4, 5],
      },
      actionConfigs: [
        {
          type: "whatsapp",
          name: "Recordatorio de cita mañana",
          order: 0,
          recipientType: "client",
          message: "Recordatorio: Tienes una cita mañana a las [TIME] con [PROFESSIONAL]. Por favor arrive 10 minutos antes. ¿Necesitas algo especial para tu cita?",
        },
      ],
      tags: ["recordatorio", "salud", "cita medica"],
    },
    {
      name: "Seguimiento Post-Consulta",
      description: "Envía un mensaje de seguimiento después de una consulta médica.",
      category: "seguimiento",
      businessTypeKey: "health",
      icon: "stethoscope",
      isActive: true,
      defaultName: "Seguimiento Post-Consulta",
      defaultDescription: "Seguimiento después de consulta médica",
      triggerConfig: {
        type: "event",
        eventType: "appointment.completed",
      },
      actionConfigs: [
        {
          type: "whatsapp",
          name: "Enviar seguimiento post-consulta",
          order: 0,
          recipientType: "client",
          message: "Gracias por tu visita hoy. ¿Cómo te sientes? Si tienes alguna duda sobre tu tratamiento o medicamentos, no dudes en contactarnos. Tu salud es nuestra prioridad. 💚",
        },
      ],
      tags: ["seguimiento", "salud", "consulta"],
    },
    {
      name: "Felicitaciones de Cumpleaños",
      description: "Envía deseos de cumpleaños a tus pacientes.",
      category: "felicitacion",
      businessTypeKey: "health",
      icon: "cake",
      isActive: true,
      defaultName: "Felicitaciones de Cumpleaños",
      defaultDescription: "Mensaje de cumpleaños para pacientes",
      triggerConfig: {
        type: "event",
        eventType: "client.birthday",
      },
      actionConfigs: [
        {
          type: "whatsapp",
          name: "Enviar felicitación",
          order: 0,
          recipientType: "client",
          message: "🎂 ¡Feliz cumpleaños! En nombre de todo nuestro equipo, queremos desearte un día maravilloso lleno de salud y felicidad. ¡Celebramos contigo! 🎉",
        },
      ],
      tags: ["birthday", "felicitacion", "salud"],
    },
    {
      name: "Reactivación Paciente Inactivo",
      description: "Recupera pacientes que no han vuelto en 60+ días.",
      category: "reactivacion",
      businessTypeKey: "health",
      icon: "user-heart",
      isActive: true,
      defaultName: "Reactivación de Paciente",
      defaultDescription: "Mensaje de reactivación para pacientes inactivos",
      triggerConfig: {
        type: "condition",
        entityType: "client",
        conditions: [
          {
            field: "daysSinceLastAppointment",
            operator: "gte",
            value: 60,
          },
        ],
      },
      actionConfigs: [
        {
          type: "whatsapp",
          name: "Enviar mensaje de reactivación",
          order: 0,
          recipientType: "client",
          message: "Hola, hemos pensado en ti. Han pasado unos meses desde tu última visita. ¿Todo bien? Estamos aquí para cuidarte. ¿Te gustaría programar una cita? Tu salud es importante para nosotros. 💚",
        },
      ],
      tags: ["reactivacion", "salud", "paciente"],
    },

    // ========================================
    // FITNESS templates (gym, yoga, crossfit, personal training)
    // ========================================
    {
      name: "Recordatorio de Clase",
      description: "Envía recordatorios antes de clases programadas.",
      category: "recordatorio",
      businessTypeKey: "fitness",
      icon: "dumbbell",
      isActive: true,
      defaultName: "Recordatorio de Clase",
      defaultDescription: "Recordatorio antes de clase",
      triggerConfig: {
        type: "schedule",
        cronExpression: "0 7 * * *",
        hours: [7],
        daysOfWeek: [1, 2, 3, 4, 5, 6],
      },
      actionConfigs: [
        {
          type: "whatsapp",
          name: "Recordatorio clase hoy",
          order: 0,
          recipientType: "client",
          message: "💪 ¡Hola! Hoy tienes clase a las [TIME]. No olvides traer tu toalla y agua. ¡Nos vemos pronto para sudar juntos!",
        },
      ],
      tags: ["recordatorio", "fitness", "clase", "gimnasio"],
    },
    {
      name: "Bienvenida Nuevo Miembro",
      description: "Da la bienvenida a nuevos miembros del gimnasio o estudio.",
      category: "bienvenida",
      businessTypeKey: "fitness",
      icon: "trophy",
      isActive: true,
      defaultName: "Bienvenida Nuevo Miembro",
      defaultDescription: "Mensaje de bienvenida para nuevos miembros",
      triggerConfig: {
        type: "event",
        eventType: "client.created",
      },
      actionConfigs: [
        {
          type: "whatsapp",
          name: "Enviar bienvenida",
          order: 0,
          recipientType: "client",
          message: "🎉 ¡Bienvenido/a al equipo! Estamos super emocionados de tenerte con nosotros. Aquí tienes algunos consejos para empezar: 1) Establece metas realistas 2)来找我们的教练谈话 3) ¡Diviértete! 💪",
        },
      ],
      tags: ["bienvenida", "fitness", "miembro", "gimnasio"],
    },
    {
      name: "Felicitaciones de Cumpleaños",
      description: "Envía deseos de cumpleaños a tus miembros.",
      category: "felicitacion",
      businessTypeKey: "fitness",
      icon: "gift",
      isActive: true,
      defaultName: "Felicitaciones de Cumpleaños",
      defaultDescription: "Mensaje de cumpleaños para miembros",
      triggerConfig: {
        type: "event",
        eventType: "client.birthday",
      },
      actionConfigs: [
        {
          type: "whatsapp",
          name: "Felicitación de cumpleaños",
          order: 0,
          recipientType: "client",
          message: "🎂 ¡Feliz cumpleaños! Que este nuevo año de vida te traiga mucha salud, energía y fortaleza. ¡Celebra con nosotros! 🎉💪",
        },
      ],
      tags: ["birthday", "felicitacion", "fitness", "cumpleanos"],
    },
    {
      name: "Reactivación Miembro Inactivo",
      description: "Contacta miembros que no han asistido en 14+ días.",
      category: "reactivacion",
      businessTypeKey: "fitness",
      icon: "user-run",
      isActive: true,
      defaultName: "Reactivación de Miembro",
      defaultDescription: "Mensaje para miembros inactivos",
      triggerConfig: {
        type: "condition",
        entityType: "client",
        conditions: [
          {
            field: "daysSinceLastAppointment",
            operator: "gte",
            value: 14,
          },
        ],
      },
      actionConfigs: [
        {
          type: "whatsapp",
          name: "Mensaje de reactivación",
          order: 0,
          recipientType: "client",
          message: "¡Te extrañamos en el gym! 🏋️ Ha pasado un tiempo desde tu última clase. ¿Todo bien? Recuerda que tu progreso no se logra sin consistencia. ¿Vienes mañana?",
        },
      ],
      tags: ["reactivacion", "fitness", "inactivo", "gimnasio"],
    },
    {
      name: "Crear Tarea de Seguimiento",
      description: "Crea una tarea de seguimiento cuando un cliente no asiste a su clase.",
      category: "tarea",
      businessTypeKey: "fitness",
      icon: "clipboard-check",
      isActive: true,
      defaultName: "Tarea Seguimiento No-Asistencias",
      defaultDescription: "Crear tarea de seguimiento para no-assistencias",
      triggerConfig: {
        type: "event",
        eventType: "appointment.no_show",
      },
      actionConfigs: [
        {
          type: "create_task",
          name: "Crear tarea de seguimiento",
          order: 0,
          title: "Seguimiento: Cliente no asistió",
          description: "Contactar al cliente [CLIENT_NAME] que no asistió a su clase de [SERVICE_NAME]",
          assignToType: "owner",
          dueDateType: "relative",
          relativeDueDate: "+1d",
          priority: "normal",
        },
      ],
      tags: ["tarea", "fitness", "no-show", "seguimiento"],
    },

    // ========================================
    // PROFESSIONAL templates (legal, accounting, consulting)
    // ========================================
    {
      name: "Recordatorio de Cita",
      description: "Envía recordatorios antes de citas de consultoría.",
      category: "recordatorio",
      businessTypeKey: "professional",
      icon: "briefcase",
      isActive: true,
      defaultName: "Recordatorio de Cita",
      defaultDescription: "Recordatorio antes de cita de consultoría",
      triggerConfig: {
        type: "schedule",
        cronExpression: "0 9 * * *",
        hours: [9],
        daysOfWeek: [1, 2, 3, 4, 5],
      },
      actionConfigs: [
        {
          type: "email",
          name: "Recordatorio por email",
          order: 0,
          recipientType: "client",
          subject: "Recordatorio: Cita mañana",
          body: "Estimado/a cliente,\n\nEste es un recordatorio de su cita programada para mañana.\n\nDetalles:\n- Fecha: [DATE]\n- Hora: [TIME]\n- Servicio: [SERVICE]\n\nPor favor confirme su asistencia o reagende con al menos 24 horas de anticipación.\n\nSaludos cordiales,\n[PROFILE_NAME]",
        },
      ],
      tags: ["recordatorio", "profesional", "consultoria"],
    },
    {
      name: "Seguimiento Post-Consulta",
      description: "Envía seguimiento después de una consulta profesional.",
      category: "seguimiento",
      businessTypeKey: "professional",
      icon: "file-check",
      isActive: true,
      defaultName: "Seguimiento Post-Consulta",
      defaultDescription: "Seguimiento después de consulta",
      triggerConfig: {
        type: "event",
        eventType: "appointment.completed",
      },
      actionConfigs: [
        {
          type: "email",
          name: "Enviar seguimiento",
          order: 0,
          recipientType: "client",
          subject: "Gracias por su visita - Seguimiento",
          body: "Estimado/a cliente,\n\nGracias por confiar en nuestros servicios.\n\nAdjuntamos cualquier documentación relevante de nuestra sesión.\n\nNo dude en contactarnos si tiene alguna pregunta.\n\nSaludos cordiales,\n[PROFILE_NAME]",
        },
      ],
      tags: ["seguimiento", "profesional", "consultoria"],
    },
    {
      name: "Mensaje de Bienvenida",
      description: "Da la bienvenida a nuevos clientes.",
      category: "bienvenida",
      businessTypeKey: "professional",
      icon: "handshake",
      isActive: true,
      defaultName: "Bienvenida Nuevo Cliente",
      defaultDescription: "Mensaje de bienvenida",
      triggerConfig: {
        type: "event",
        eventType: "client.created",
      },
      actionConfigs: [
        {
          type: "email",
          name: "Bienvenida por email",
          order: 0,
          recipientType: "client",
          subject: "Bienvenido/a a [PROFILE_NAME]",
          body: "Estimado/a cliente,\n\n¡Bienvenido/a a nuestros servicios!\n\nSomos [PROFILE_NAME] y estamos comprometidos a brindarle la mejor atención profesional.\n\nNuestro equipo le contactará pronto para agendar una cita inicial.\n\nSaludos cordiales,\n[PROFILE_NAME]",
        },
      ],
      tags: ["bienvenida", "profesional", "nuevo cliente"],
    },

    // ========================================
    // TECHNICAL templates (mechanics, repairs, technical services)
    // ========================================
    {
      name: "Confirmación de Cita",
      description: "Confirma citas de servicio técnico.",
      category: "confirmacion",
      businessTypeKey: "technical",
      icon: "wrench",
      isActive: true,
      defaultName: "Confirmación de Cita",
      defaultDescription: "Confirmación de cita de servicio",
      triggerConfig: {
        type: "event",
        eventType: "appointment.created",
      },
      actionConfigs: [
        {
          type: "whatsapp",
          name: "Confirmar cita",
          order: 0,
          recipientType: "client",
          message: "¡Gracias por confiar en nosotros! ✅ Tu cita ha sido confirmada para el [DATE] a las [TIME]. Trae tu [VEHICLE/EQUIPO] si aplica. ¿Tienes alguna pregunta?",
        },
      ],
      tags: ["confirmacion", "tecnico", "servicio"],
    },
    {
      name: "Recordatorio de Servicio",
      description: "Envía recordatorio antes de servicios programados.",
      category: "recordatorio",
      businessTypeKey: "technical",
      icon: "truck",
      isActive: true,
      defaultName: "Recordatorio de Servicio",
      defaultDescription: "Recordatorio de servicio",
      triggerConfig: {
        type: "schedule",
        cronExpression: "0 8 * * *",
        hours: [8],
        daysOfWeek: [1, 2, 3, 4, 5],
      },
      actionConfigs: [
        {
          type: "whatsapp",
          name: "Recordatorio servicio",
          order: 0,
          recipientType: "client",
          message: "Recordatorio: Tu servicio está programado para mañana. Por favor arrive 15 minutos antes si es posible. ¿Necesitas transporte alternativo? Contáctanos. 🔧",
        },
      ],
      tags: ["recordatorio", "tecnico", "servicio"],
    },
    {
      name: "Notificación de Servicio Completado",
      description: "Informa cuando el servicio técnico está completado.",
      category: "notificacion",
      businessTypeKey: "technical",
      icon: "check-circle",
      isActive: true,
      defaultName: "Servicio Completado",
      defaultDescription: "Notificación de servicio completado",
      triggerConfig: {
        type: "event",
        eventType: "appointment.completed",
      },
      actionConfigs: [
        {
          type: "whatsapp",
          name: "Notificar completado",
          order: 0,
          recipientType: "client",
          message: "¡Tu servicio está listo! 🎉 Puedes pasar a recoger tu [VEHICLE/EQUIPO] en nuestro taller. Nuestro equipo te explicará los trabajos realizados. ¿Te gustaría programar tu próximo servicio de mantenimiento?",
        },
      ],
      tags: ["notificacion", "tecnico", "completado"],
    },
    {
      name: "Seguimiento Post-Servicio",
      description: "Hace seguimiento después de un servicio técnico.",
      category: "seguimiento",
      businessTypeKey: "technical",
      icon: "star",
      isActive: true,
      defaultName: "Seguimiento Post-Servicio",
      defaultDescription: "Seguimiento después de servicio",
      triggerConfig: {
        type: "event",
        eventType: "appointment.completed",
      },
      actionConfigs: [
        {
          type: "whatsapp",
          name: "Seguimiento",
          order: 0,
          recipientType: "client",
          message: "¡Gracias por elegirnos! 🛠️ ¿Cómo estuvo el servicio? Tu satisfacción es nuestra prioridad. ¿Tienes alguna duda sobre el trabajo realizado? Estamos para ayudarte.",
        },
      ],
      tags: ["seguimiento", "tecnico", "post-servicio"],
    },
  ];

  for (const template of templates) {
    // Check if already exists by name and business type
    const existing = await db.query.automationTemplate.findFirst({
      where: (t, { and, eq }) => and(
        eq(t.name, template.name),
        eq(t.businessTypeKey, template.businessTypeKey)
      ),
    });

    if (existing) {
      console.log(`  ℹ️  Template "${template.name}" (${template.businessTypeKey}) already exists, skipping`);
      continue;
    }

    await db.insert(automationTemplate).values({
      name: template.name,
      description: template.description,
      category: template.category,
      businessTypeKey: template.businessTypeKey,
      icon: template.icon,
      isActive: template.isActive,
      defaultName: template.defaultName!,
      defaultDescription: template.defaultDescription!,
      triggerConfig: template.triggerConfig!,
      actionConfigs: template.actionConfigs!,
      usageCount: 0,
      tags: template.tags!,
    } as any);

    console.log(`  ✅ Created template: ${template.name} (${template.businessTypeKey})`);
  }

  console.log("\n✅ Automation templates seeded successfully\n");
}
