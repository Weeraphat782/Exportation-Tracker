# Exportation Quotation MCP Server

MCP Server for managing Exportation Tracker quotations with Cursor IDE integration.

## Features

- 📧 **Email-based Authentication**: Simple authentication using user email
- 🏢 **Company Management**: List and manage companies
- 📍 **Destination Management**: List and manage destinations
- 📋 **Quotation Management**: Create, list, update, and view quotations
- 🔄 **Status Updates**: Update quotation statuses

## Tools Available

### Authentication
- `set_user_email` - Set user email for authentication

### Company & Destination
- `list_companies` - List all companies
- `list_destinations` - List all destinations

### Quotations
- `list_quotations` - List quotations with optional status filter
- `get_quotation_details` - Get detailed quotation information
- `create_quotation` - Create new quotation
- `update_quotation_status` - Update quotation status

## Setup

### 1. Environment Variables

Copy the `.env.example` file and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### 2. Install Dependencies

```bash
pip install -r requirements.txt
# or
uv sync
```

### 3. Run the Server

```bash
python -m src.quotation_server
# or with uv
uv run python -m src.quotation_server
```

## Usage with Cursor

1. Make sure the MCP server is running
2. In Cursor, the server will be automatically detected
3. Use the tools in chat or code completion

### Example Usage

```
First, set your email:
"Set user email to: user@example.com"

Then you can use other tools:
"List my companies"
"Show my quotations"
"Create a new quotation for ABC Company to Japan"
```

## Authentication Flow

1. User provides email via `set_user_email` tool
2. Server looks up user ID from the profiles table
3. All subsequent operations use this user ID for data filtering

## Error Handling

The server includes comprehensive error handling for:
- Authentication failures
- Database connection issues
- Invalid data formats
- Permission errors

## Development

### Project Structure

```
mcp-server/
├── src/
│   └── quotation_server.py  # Main server implementation
├── pyproject.toml            # Project configuration
├── README.md                 # This file
└── .env.example             # Environment variables template
```

### Adding New Tools

1. Add the tool function with `@mcp.tool()` decorator
2. Include proper type hints and docstrings
3. Handle authentication checks
4. Add error handling

### Testing

Run the server and test with Cursor or other MCP clients.
