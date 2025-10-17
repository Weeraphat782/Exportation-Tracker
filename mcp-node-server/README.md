# Exportation Quotation MCP Node.js Server

HTTP-based MCP Server for managing Exportation Tracker quotations using Node.js and Express.

## Features

- 🌐 **HTTP API**: RESTful endpoints for MCP tools
- 🔐 **Service Role Authentication**: Bypasses RLS for admin access
- 🏢 **Company Management**: List and match companies
- 📍 **Destination Management**: List and match destinations
- 📋 **Quotation Management**: Create, list, and analyze quotations
- 💰 **Financial Analytics**: Calculate totals by company

## API Endpoints

### Authentication
```http
POST /tools/set_user_email
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Company & Destination
```http
POST /tools/list_companies
POST /tools/list_destinations
```

### Quotations
```http
POST /tools/list_quotations
Content-Type: application/json

{
  "status_filter": "draft" // optional
}
```

```http
POST /tools/create_quotation
Content-Type: application/json

{
  "company_name": "CIBID GROUP TH CO., LTD.",
  "customer_name": "Pharmaserv",
  "destination": "Switzerlands (HIF)",
  "pallets": "[{\"length\":150,\"width\":120,\"height\":110,\"weight\":500,\"quantity\":2}]",
  "contact_person": "",
  "contract_no": null,
  "notes": "Created via API"
}
```

```http
POST /tools/get_total_amount_by_company
Content-Type: application/json

{
  "company_name": "cibid"
}
```

### System
```http
GET /health
GET /tools
```

## Setup

### 1. Install Dependencies
```bash
cd mcp-node-server
npm install
```

### 2. Environment Variables
The server uses the same environment variables as the main application:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (for admin access)

### 3. Start Server
```bash
npm start
# or
node server.js
```

Server runs on `http://localhost:3001` by default.

## Integration with Cursor

### Option 1: Custom MCP Tools (Recommended)
Since this is an HTTP-based MCP server, you can integrate it with Cursor by:

1. **Create a custom tool script** that calls the HTTP endpoints
2. **Add it to Cursor's MCP configuration**

Example script (`cursor-mcp-wrapper.js`):
```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function callMCPTool(tool, params = {}) {
  try {
    const response = await axios.post(`${BASE_URL}/tools/${tool}`, params);
    return response.data.result;
  } catch (error) {
    return `Error: ${error.response?.data?.error || error.message}`;
  }
}

// Usage examples:
callMCPTool('set_user_email', { email: 'user@example.com' });
callMCPTool('list_companies');
callMCPTool('create_quotation', {
  company_name: 'Company Name',
  customer_name: 'Customer',
  destination: 'Destination',
  pallets: '[...]',
  // ... other params
});
```

### Option 2: Direct API Calls
Use the REST API endpoints directly in your applications.

## Architecture

- **Express.js**: Web server framework
- **Supabase Client**: Database access with service role
- **REST API**: HTTP endpoints for MCP tools
- **JSON Communication**: Request/response format

## Differences from Python Version

| Feature | Python (stdio) | Node.js (HTTP) |
|---------|----------------|----------------|
| Transport | stdio streams | HTTP REST API |
| Integration | Direct MCP protocol | API calls |
| Setup | Cursor config | HTTP client |
| Authentication | Session-based | Request-based |
| Deployment | Local process | Web server |

## Testing

```bash
# Health check
curl http://localhost:3001/health

# Set user email
curl -X POST http://localhost:3001/tools/set_user_email \
  -H "Content-Type: application/json" \
  -d '{"email":"vieww.weeraphat@gmail.com"}'

# List companies
curl -X POST http://localhost:3001/tools/list_companies \
  -H "Content-Type: application/json" \
  -d '{}'

# Create quotation
curl -X POST http://localhost:3001/tools/create_quotation \
  -H "Content-Type: application/json" \
  -d '{
    "company_name":"CIBID GROUP TH CO., LTD.",
    "customer_name":"Pharmaserv",
    "destination":"Switzerlands (HIF)",
    "pallets":"[{\"length\":150,\"width\":120,\"height\":110,\"weight\":500,\"quantity\":2}]"
  }'
```

## Development

### Adding New Tools

1. **Create endpoint** in `server.js`:
```javascript
app.post('/tools/new_tool', async (req, res) => {
  try {
    const { param1, param2 } = req.body;
    // Tool logic here
    res.json({ result: 'Tool response' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

2. **Update tools list** in the `/tools` endpoint
3. **Add documentation** to README

### Error Handling

All endpoints include comprehensive error handling for:
- Authentication failures
- Database errors
- Invalid input data
- Missing required fields

## Production Deployment

- Set `NODE_ENV=production`
- Use process manager (PM2, Docker)
- Configure reverse proxy (nginx)
- Set up proper environment variables
- Enable HTTPS/SSL


