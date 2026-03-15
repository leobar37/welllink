# Environment

Environment variables, external dependencies, and setup notes.

## Required Environment Variables

### packages/api/.env
```
DATABASE_URL=postgresql://xxx:xxx@localhost:5432/xxx
INNGEST_SIGNING_KEY=dev-local
INNGEST_EVENT_KEY=dev-local
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
```

### packages/web/.env
```
VITE_API_URL=http://localhost:5300
```

## External Services

| Service | Default URL | Purpose |
|---------|-------------|---------|
| PostgreSQL | localhost:5432 | Primary database |
| Inngest Dev | localhost:8288 | Background jobs |
| Evolution API | - | WhatsApp integration |

## Feature Flags (Future)

Planned for enabling/disabling modules per business:
- `FEATURE_INVENTORY=true/false`
- `FEATURE_AUTOMATIONS=true/false`
- `FEATURE_STAFF=true/false`

## Database Connection

Default connection string:
```
postgresql://xxx:xxx@localhost:5432/xxx
```

## Notes

- Inngest dev server runs separately in development
- Evolution API is optional for local development
- WhatsApp testing requires Evolution API credentials
