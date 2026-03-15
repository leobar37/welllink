/**
 * Industry-specific terminology configuration
 * 
 * This file defines dynamic labels based on business type:
 * - beauty: Salones de belleza, peluquerías, barberías, spas
 * - health: Clínicas, consultorios médicos, odontología, fisioterapia
 * - fitness: Gimnasios, estudios de yoga, crossfit, entrenamiento personal
 * - professional: Consultorios legales, contables, asesoría, coaching
 * - technical: Talleres mecánicos, servicios técnicos, reparaciones
 */

export type BusinessTypeKey = 
  | 'beauty' 
  | 'health' 
  | 'fitness' 
  | 'professional' 
  | 'technical';

export interface TerminologyConfig {
  // People terminology
  /** Primary customer term (Cliente/Paciente/Cliente/Miembro/Cliente) */
  customer: string;
  /** Plural customer term (Clientes/Pacientes/Clientes/Miembros/Clientes) */
  customers: string;
  /** Customer singular indefinite (un cliente/un paciente/un cliente/un miembro/un cliente) */
  aCustomer: string;
  /** Secondary customer term for VIP/premium customers */
  vipCustomer?: string;
  vipCustomers?: string;
  
  // Service terminology
  /** Primary service term (Tratamiento/Consulta/Clase/Servicio/Técnico) */
  service: string;
  /** Plural service term (Tratamientos/Consultas/Clases/Servicios/Técnicos) */
  services: string;
  /** Service singular indefinite */
  aService: string;
  
  // Appointment/session terminology
  /** Appointment/session term (Cita/Sesión/Clase/Cita/Turno) */
  appointment: string;
  /** Plural appointment term (Citas/Sesiones/Clases/Citas/Turnos) */
  appointments: string;
  /** Booking action (Reservar/Agendar/Reservar/Reservar/Solicitar) */
  book: string;
  /** Booked status (Reservado/Agendado/Reservado/Reservado/Confirmado) */
  booked: string;
  
  // Product terminology  
  /** Product term (Producto/Producto/Producto/Producto/Repuesto) */
  product: string;
  /** Plural product term (Productos/Productos/Productos/Productos/Repuestos) */
  products: string;
  
  // Additional industry-specific terms
  /** Intake form or initial assessment */
  intakeForm?: string;
  intakeForms?: string;
  /** Follow-up or review */
  followUp?: string;
  followUps?: string;
  /** Consultation or evaluation */
  consultation?: string;
  consultations?: string;
  /** Package or bundle */
  package?: string;
  packages?: string;
  /** Membership or subscription */
  membership?: string;
  memberships?: string;
  
  // UI Labels
  /** Dashboard label for this industry */
  dashboard: string;
  /** New item button text */
  newItem: string;
  /** Edit item button text */
  editItem: string;
  /** Delete action text */
  deleteItem: string;
  /** Save action text */
  saveItem: string;
  /** Cancel action text */
  cancel: string;
  /** Search placeholder */
  search: string;
  /** Filter label */
  filter: string;
  /** No items message */
  noItems: string;
  /** Add first item message */
  addFirstItem: string;
}

/**
 * Terminology configuration for each business type
 * Fallback default is 'beauty'
 */
export const terminologyConfigs: Record<BusinessTypeKey, TerminologyConfig> = {
  beauty: {
    customer: 'Cliente',
    customers: 'Clientes',
    aCustomer: 'un cliente',
    vipCustomer: 'Cliente VIP',
    vipCustomers: 'Clientes VIP',
    service: 'Tratamiento',
    services: 'Tratamientos',
    aService: 'un tratamiento',
    appointment: 'Cita',
    appointments: 'Citas',
    book: 'Reservar',
    booked: 'Reservado',
    product: 'Producto',
    products: 'Productos',
    intakeForm: 'Formulario de Clienta',
    intakeForms: 'Formularios de Clienta',
    consultation: 'Consulta',
    consultations: 'Consultas',
    package: 'Paquete',
    packages: 'Paquetes',
    dashboard: 'Panel de Belleza',
    newItem: 'Nuevo Tratamiento',
    editItem: 'Editar Tratamiento',
    deleteItem: 'Eliminar Tratamiento',
    saveItem: 'Guardar',
    cancel: 'Cancelar',
    search: 'Buscar cliente...',
    filter: 'Filtrar',
    noItems: 'No hay tratamientos',
    addFirstItem: 'Añadir primer tratamiento',
  },
  health: {
    customer: 'Paciente',
    customers: 'Pacientes',
    aCustomer: 'un paciente',
    vipCustomer: 'Paciente Preferente',
    vipCustomers: 'Pacientes Preferentes',
    service: 'Consulta',
    services: 'Consultas',
    aService: 'una consulta',
    appointment: 'Cita',
    appointments: 'Citas',
    book: 'Agendar',
    booked: 'Agendado',
    product: 'Producto',
    products: 'Productos',
    intakeForm: 'Historia Clínica',
    intakeForms: 'Historias Clínicas',
    followUp: 'Seguimiento',
    followUps: 'Seguimientos',
    consultation: 'Evaluación',
    consultations: 'Evaluaciones',
    dashboard: 'Panel Médico',
    newItem: 'Nueva Consulta',
    editItem: 'Editar Consulta',
    deleteItem: 'Eliminar Consulta',
    saveItem: 'Guardar',
    cancel: 'Cancelar',
    search: 'Buscar paciente...',
    filter: 'Filtrar',
    noItems: 'No hay consultas',
    addFirstItem: 'Añadir primera consulta',
  },
  fitness: {
    customer: 'Miembro',
    customers: 'Miembros',
    aCustomer: 'un miembro',
    vipCustomer: 'Miembro Premium',
    vipCustomers: 'Miembros Premium',
    service: 'Clase',
    services: 'Clases',
    aService: 'una clase',
    appointment: 'Clase',
    appointments: 'Clases',
    book: 'Reservar',
    booked: 'Reservado',
    product: 'Producto',
    products: 'Productos',
    membership: 'Membresía',
    memberships: 'Membresías',
    package: 'Paquete',
    packages: 'Paquetes',
    followUp: 'Seguimiento',
    followUps: 'Seguimientos',
    dashboard: 'Panel de Fitness',
    newItem: 'Nueva Clase',
    editItem: 'Editar Clase',
    deleteItem: 'Eliminar Clase',
    saveItem: 'Guardar',
    cancel: 'Cancelar',
    search: 'Buscar miembro...',
    filter: 'Filtrar',
    noItems: 'No hay clases',
    addFirstItem: 'Añadir primera clase',
  },
  professional: {
    customer: 'Cliente',
    customers: 'Clientes',
    aCustomer: 'un cliente',
    vipCustomer: 'Cliente Preferido',
    vipCustomers: 'Clientes Preferidos',
    service: 'Servicio',
    services: 'Servicios',
    aService: 'un servicio',
    appointment: 'Cita',
    appointments: 'Citas',
    book: 'Reservar',
    booked: 'Reservado',
    product: 'Material',
    products: 'Materiales',
    consultation: 'Consulta',
    consultations: 'Consultas',
    package: 'Paquete',
    packages: 'Paquetes',
    dashboard: 'Panel Profesional',
    newItem: 'Nuevo Servicio',
    editItem: 'Editar Servicio',
    deleteItem: 'Eliminar Servicio',
    saveItem: 'Guardar',
    cancel: 'Cancelar',
    search: 'Buscar cliente...',
    filter: 'Filtrar',
    noItems: 'No hay servicios',
    addFirstItem: 'Añadir primer servicio',
  },
  technical: {
    customer: 'Cliente',
    customers: 'Clientes',
    aCustomer: 'un cliente',
    vipCustomer: 'Cliente Preferente',
    vipCustomers: 'Clientes Preferentes',
    service: 'Servicio',
    services: 'Servicios',
    aService: 'un servicio',
    appointment: 'Turno',
    appointments: 'Turnos',
    book: 'Solicitar',
    booked: 'Confirmado',
    product: 'Repuesto',
    products: 'Repuestos',
    consultation: 'Diagnóstico',
    consultations: 'Diagnósticos',
    dashboard: 'Panel Técnico',
    newItem: 'Nuevo Servicio',
    editItem: 'Editar Servicio',
    deleteItem: 'Eliminar Servicio',
    saveItem: 'Guardar',
    cancel: 'Cancelar',
    search: 'Buscar cliente...',
    filter: 'Filtrar',
    noItems: 'No hay servicios',
    addFirstItem: 'Añadir primer servicio',
  },
};

/**
 * Get terminology config by business type key
 * Falls back to 'beauty' if key not found
 */
export function getTerminology(key: BusinessTypeKey | string | undefined): TerminologyConfig {
  if (!key) {
    return terminologyConfigs.beauty;
  }
  return terminologyConfigs[key as BusinessTypeKey] || terminologyConfigs.beauty;
}

/**
 * Get default terminology (beauty industry)
 */
export function getDefaultTerminology(): TerminologyConfig {
  return terminologyConfigs.beauty;
}
