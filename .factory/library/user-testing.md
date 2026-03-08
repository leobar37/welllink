# User Testing

Testing surface and procedures for manual validation.

## Application URLs

| Environment | URL | Purpose |
|-------------|-----|---------|
| Web Dev | http://localhost:5176 | Frontend development |
| API Dev | http://localhost:5300 | Backend API |
| Inngest | http://localhost:8288 | Background jobs dashboard |

## Authentication

- Better Auth with email/password
- Session-based authentication
- Test credentials: Create via registration flow

## Testing Tools

### Playwright (agent-browser)
- Primary tool for UI testing
- Screenshots for visual validation
- Network interception for API verification

### curl/httpie
- API endpoint testing
- Quick verification of responses

### Inngest Dashboard
- http://localhost:8288
- View function runs
- Send test events
- Check execution logs

## Common Test Flows

### Inventory Management
1. Login to dashboard
2. Navigate to /dashboard/inventory
3. Create new product
4. Adjust stock
5. Verify movements

### Automation
1. Create automation
2. Trigger event (or wait for schedule)
3. Check execution logs
4. Verify action executed

### Staff Management
1. Add staff member
2. Assign services
3. Set availability
4. Book appointment with staff

## Data Setup

### Test Business Profile
- Use existing test account or create new
- Set business type for industry-specific testing

### Test Data
- Products with various stock levels
- Services with product consumption
- Staff members with schedules
- Automations for testing

## Known Quirks

- Inngest dev server must be running for background jobs
- WhatsApp requires Evolution API credentials
- Some features require specific business type
