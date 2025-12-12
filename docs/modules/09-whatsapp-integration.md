# Module 09 — WhatsApp Integration

## Overview
This module enables wellness advisors to connect their WhatsApp Business accounts through Evolution API, allowing automated messaging, appointment confirmations, and direct client communication directly from their wellness profiles.

## MVP Scope
- Evolution API integration with multi-tenant architecture (one WhatsApp instance per advisor).
- WhatsApp Business account connection via QR code scanning.
- Automated message sending (appointment confirmations, reminders, follow-ups).
- Message template system with variable substitution (client name, appointment time, etc.).
- Async message queue with BullMQ for reliable delivery.
- Webhook handling for inbound messages and delivery status updates.
- Integration with existing features (Module 04) for WhatsApp CTA on public profiles.

## Key Features
- **Instance Management**: Auto-create and manage individual WhatsApp instances per advisor.
- **Message Queue**: BullMQ-based async processing with retry logic and exponential backoff.
- **Template System**: Pre-built and custom templates with variables (e.g., {nombre_cliente}, {fecha_cita}).
- **Delivery Tracking**: Real-time status updates (sent, delivered, read, failed).
- **Multi-Channel Support**: Text messages, images with captions, and media attachments.
- **Rate Limiting**: Configurable per-advisor limits to prevent abuse.
- **Webhook Integration**: Real-time updates for message status and incoming messages.
- **Public Profile Integration**: WhatsApp CTA button that opens direct chat with pre-filled message.

## Technical Implementation

### Database Schema
- `whatsapp-config`: Stores Evolution API credentials and connection status per advisor.
- `whatsapp-message`: Tracks all messages with status, metadata, and retry counts.
- `whatsapp-template`: Manages message templates with variable substitution.

### Services
- `EvolutionService`: Direct Evolution API client (singleton pattern).
- `WhatsAppConfigService`: Business logic for instance management.
- `WhatsAppService`: Message sending and receiving operations.
- `WhatsAppTemplateService`: Template rendering and management.
- `WhatsAppQueueService`: BullMQ queue management for async processing.

### API Endpoints
```
/api/whatsapp/config - Configure WhatsApp instance
/api/whatsapp/connect - Generate QR code for connection
/api/whatsapp/disconnect - Disconnect instance
/api/whatsapp/send - Send message
/api/whatsapp/messages - Get message history
/api/whatsapp/templates - Manage templates
/api/whatsapp/webhook - Receive updates from Evolution API
```

## Dependencies
- Public Profile (Module 02) for WhatsApp CTA button integration.
- Feature System (Module 04) for enabling/disabling WhatsApp features.
- Dashboard (Module 06) for WhatsApp configuration UI.
- Better Auth (Module 01) for secure instance ownership.
- QR Card (Module 05) for sharing connection QR codes.

## Message Templates

### Pre-Built Templates
1. **Appointment Confirmation**
   - Variables: {nombre_cliente}, {fecha_cita}, {hora_cita}, {nombre_asesor}
   - Usage: Automatic after booking confirmation

2. **Appointment Reminder**
   - Variables: {nombre_cliente}, {fecha_cita}, {hora_cita}, {direccion}
   - Usage: 24 hours before appointment

3. **Follow-up Message**
   - Variables: {nombre_cliente}, {nombre_asesor}, {mensaje_personalizado}
   - Usage: Post-consultation check-in

4. **Custom Message**
   - Variables: Configurable by advisor
   - Usage: Manual sending from dashboard

## Configuration Flow
1. Advisor navigates to Settings (Module 07) → WhatsApp tab.
2. Clicks "Connect WhatsApp Business".
3. System creates Evolution API instance (if not exists).
4. Displays QR code for scanning with WhatsApp Business app.
5. Upon successful connection, status updates to "connected".
6. Advisor can configure templates and default messages.

## Security & Privacy
- WhatsApp credentials encrypted at rest.
- Instance ownership tied to advisor's account (Module 01).
- Rate limiting to prevent spam.
- Webhook signature verification.
- Message content audit log.

## Metrics & Notes
- **Connection Rate**: Percentage of advisors who successfully connect WhatsApp.
- **Message Delivery Rate**: Successful sends / total attempts.
- **Template Usage**: Most popular templates and customization rate.
- **Response Time**: Average time from send to delivery confirmation.
- **Feature Adoption**: Advisors using WhatsApp vs total active advisors.

## Environment Variables
```env
EVOLUTION_API_URL=https://your-evolution-instance.com
EVOLUTION_API_KEY=your_api_key
REDIS_URL=redis://localhost:6379
WHATSAPP_RATE_LIMIT_MAX=50
WHATSAPP_RATE_LIMIT_DURATION=60000
```

## Future Enhancements
- WhatsApp Business API approval for template pre-approval.
- Group messaging for multi-advisor practices.
- Chatbot integration with AI responses.
- Integration with calendar systems for automatic reminders.
- Message analytics dashboard.
- Broadcast messaging to client lists.
