#!/usr/bin/env python3
"""
MCP Server for Exportation Tracker Quotation Management
Provides tools for managing quotations with email-based authentication
"""

import os
import json
import asyncio
from typing import Any, Dict, List, Optional
from datetime import datetime

from mcp.server.fastmcp import FastMCP
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastMCP server
mcp = FastMCP("exportation-quotation-manager")

# Supabase client
supabase: Optional[Client] = None

# Global user email (set via tool)
current_user_email: Optional[str] = None

def get_supabase_client() -> Client:
    """Get or create Supabase client"""
    global supabase
    if supabase is None:
        supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

        if not supabase_url or not supabase_key:
            raise ValueError("Missing Supabase environment variables")

        supabase = create_client(supabase_url, supabase_key)
    return supabase

def get_user_id_from_email(email: str) -> Optional[str]:
    """Get user ID from email address"""
    try:
        client = get_supabase_client()
        response = client.table("profiles").select("id").eq("email", email).execute()

        if response.data and len(response.data) > 0:
            return response.data[0]["id"]
        return None
    except Exception as e:
        print(f"Error getting user ID from email: {e}")
        return None

@mcp.tool()
async def set_user_email(email: str) -> str:
    """Set the user email for authentication. Call this first before using other tools.

    Args:
        email: The user's email address to authenticate with

    Returns:
        Confirmation message with user info
    """
    global current_user_email
    current_user_email = email

    user_id = get_user_id_from_email(email)
    if user_id:
        return f"Authentication successful. Using email: {email} (User ID: {user_id})"
    else:
        return f"Email set to: {email}, but user not found in database. Some operations may not work."

@mcp.tool()
async def list_companies() -> str:
    """List all companies available in the system.

    Returns:
        Formatted list of companies
    """
    if not current_user_email:
        return "Please set user email first using set_user_email tool"

    try:
        client = get_supabase_client()
        user_id = get_user_id_from_email(current_user_email)

        if not user_id:
            return "Error: User not found"

        response = client.table("companies").select("*").eq("user_id", user_id).execute()

        if not response.data:
            return "No companies found. Create a company first."

        companies = []
        for company in response.data:
            companies.append(f"• {company['name']} (ID: {company['id']})")

        return f"Available Companies:\n" + "\n".join(companies)

    except Exception as e:
        return f"Error: Error listing companies: {str(e)}"

@mcp.tool()
async def list_destinations() -> str:
    """List all destinations available in the system.

    Returns:
        Formatted list of destinations
    """
    if not current_user_email:
        return "Please set user email first using set_user_email tool"

    try:
        client = get_supabase_client()
        user_id = get_user_id_from_email(current_user_email)

        if not user_id:
            return "Error: User not found"

        response = client.table("destinations").select("*").eq("user_id", user_id).execute()

        if not response.data:
            return " No destinations found. Create a destination first."

        destinations = []
        for dest in response.data:
            destinations.append(f"• {dest['country']} - {dest['port'] or 'N/A'} (ID: {dest['id']})")

        return f" Available Destinations:\n" + "\n".join(destinations)

    except Exception as e:
        return f"Error: Error listing destinations: {str(e)}"

@mcp.tool()
async def list_quotations(status_filter: Optional[str] = None) -> str:
    """List quotations for the current user.

    Args:
        status_filter: Optional filter by status ('draft', 'sent', 'accepted', 'completed', etc.)

    Returns:
        Formatted list of quotations
    """
    if not current_user_email:
        return "Please set user email first using set_user_email tool"

    try:
        client = get_supabase_client()
        user_id = get_user_id_from_email(current_user_email)

        if not user_id:
            return "Error: User not found"

        query = client.table("quotations").select("*").eq("user_id", user_id)

        if status_filter:
            query = query.eq("status", status_filter)

        response = query.order("created_at", desc=True).execute()

        if not response.data:
            filter_msg = f" with status '{status_filter}'" if status_filter else ""
            return f" No quotations found{filter_msg}."

        quotations = []
        for quote in response.data[:10]:  # Limit to 10 most recent
            status = quote.get('status', 'unknown')
            company = quote.get('company_name', 'N/A')
            destination = quote.get('destination', 'N/A')
            total_cost = quote.get('total_cost', 0)
            created_date = quote.get('created_at', '')[:10] if quote.get('created_at') else 'N/A'

            quotations.append(f"• [{status.upper()}] {company} → {destination}")
            quotations.append(f"  ID: {quote['id']}, Cost: {total_cost:,.0f} THB, Date: {created_date}")

        result = f" Quotations ({len(response.data)} total):\n" + "\n".join(quotations)

        if len(response.data) > 10:
            result += f"\n... and {len(response.data) - 10} more"

        return result

    except Exception as e:
        return f"Error: Error listing quotations: {str(e)}"

@mcp.tool()
async def get_quotation_details(quotation_id: str) -> str:
    """Get detailed information about a specific quotation.

    Args:
        quotation_id: The quotation ID to retrieve

    Returns:
        Detailed quotation information
    """
    if not current_user_email:
        return "Please set user email first using set_user_email tool"

    try:
        client = get_supabase_client()
        user_id = get_user_id_from_email(current_user_email)

        if not user_id:
            return "Error: User not found"

        response = client.table("quotations").select("*").eq("id", quotation_id).eq("user_id", user_id).execute()

        if not response.data or len(response.data) == 0:
            return f"Error: Quotation with ID '{quotation_id}' not found or access denied."

        quotation = response.data[0]

        details = []
        details.append(f" Quotation Details")
        details.append(f"ID: {quotation['id']}")
        details.append(f"Status: {quotation.get('status', 'N/A')}")
        details.append(f"Company: {quotation.get('company_name', 'N/A')}")
        details.append(f"Customer: {quotation.get('customer_name', 'N/A')}")
        details.append(f"Destination: {quotation.get('destination', 'N/A')}")
        details.append(f"Contact Person: {quotation.get('contact_person', 'N/A')}")
        details.append(f"Contract No: {quotation.get('contract_no', 'N/A')}")
        details.append(f"Total Cost: {quotation.get('total_cost', 0):,.0f} THB")
        details.append(f"Created: {quotation.get('created_at', 'N/A')[:10] if quotation.get('created_at') else 'N/A'}")

        # Pallets information
        pallets = quotation.get('pallets', [])
        if pallets:
            details.append(f"\nPallets: Pallets ({len(pallets)}):")
            for i, pallet in enumerate(pallets, 1):
                details.append(f"  {i}. {pallet.get('length', 0)}×{pallet.get('width', 0)}×{pallet.get('height', 0)}cm, {pallet.get('weight', 0)}kg (×{pallet.get('quantity', 1)})")

        # Additional charges
        charges = quotation.get('additional_charges', [])
        if charges:
            details.append(f"\nAdditional Charges: Additional Charges:")
            for charge in charges:
                details.append(f"  • {charge.get('description', 'N/A')}: {charge.get('amount', 0):,.0f} THB")

        notes = quotation.get('notes')
        if notes:
            details.append(f"\n Notes: {notes}")

        return "\n".join(details)

    except Exception as e:
        return f"Error: Error getting quotation details: {str(e)}"

@mcp.tool()
async def create_quotation(
    company_name: str,
    customer_name: str,
    destination: str,
    pallets: str,
    contact_person: str = "",
    contract_no: Optional[str] = None,
    notes: Optional[str] = None
) -> str:
    """Create a new quotation.

    Args:
        company_name: Name of the company
        customer_name: Name of the customer
        destination: Destination country/port
        pallets: JSON string of pallets array, e.g., '[{"length":100,"width":100,"height":100,"weight":150,"quantity":1}]'
        contact_person: Contact person name (optional)
        contract_no: Contract number (optional)
        notes: Additional notes (optional)

    Returns:
        Success message with quotation ID
    """
    if not current_user_email:
        return "Please set user email first using set_user_email tool"

    try:
        client = get_supabase_client()
        user_id = get_user_id_from_email(current_user_email)

        if not user_id:
            return "Error: User not found"

        # Parse pallets JSON
        try:
            pallets_data = json.loads(pallets)
            if not isinstance(pallets_data, list) or len(pallets_data) == 0:
                return "Error: Pallets must be a non-empty JSON array"
        except json.JSONDecodeError:
            return "Error: Invalid pallets JSON format"

        # Get company and destination IDs
        company_response = client.table("companies").select("id").eq("name", company_name).eq("user_id", user_id).execute()
        if not company_response.data:
            return f"Error: Company '{company_name}' not found. Please create the company first."

        dest_response = client.table("destinations").select("id").eq("country", destination).eq("user_id", user_id).execute()
        if not dest_response.data:
            # Try to find by port as well
            dest_response = client.table("destinations").select("id").eq("port", destination).eq("user_id", user_id).execute()
            if not dest_response.data:
                return f"Error: Destination '{destination}' not found. Please create the destination first."

        company_id = company_response.data[0]["id"]
        destination_id = dest_response.data[0]["id"]

        # Calculate basic costs (simplified)
        total_weight = sum(p.get("weight", 0) * p.get("quantity", 1) for p in pallets_data)
        volume_weight = sum((p.get("length", 0) * p.get("width", 0) * p.get("height", 0) * p.get("quantity", 1)) / 6000 for p in pallets_data)
        chargeable_weight = max(total_weight, volume_weight)

        # Simple freight calculation (150 THB per kg)
        freight_cost = chargeable_weight * 150

        quotation_data = {
            "user_id": user_id,
            "company_id": company_id,
            "company_name": company_name,
            "customer_name": customer_name,
            "destination_id": destination_id,
            "destination": destination,
            "contact_person": contact_person,
            "contract_no": contract_no,
            "pallets": pallets_data,
            "delivery_service_required": False,
            "delivery_vehicle_type": "4wheel",
            "additional_charges": [],
            "notes": notes,
            "total_freight_cost": freight_cost,
            "delivery_cost": 0,
            "clearance_cost": 0,
            "total_cost": freight_cost,
            "total_volume_weight": volume_weight,
            "total_actual_weight": total_weight,
            "chargeable_weight": chargeable_weight,
            "status": "draft"
        }

        response = client.table("quotations").insert(quotation_data).execute()

        if response.data and len(response.data) > 0:
            quotation_id = response.data[0]["id"]
            return f"Success: Quotation created successfully!\nID: {quotation_id}\nTotal Cost: {freight_cost:,.0f} THB\nStatus: draft"
        else:
            return "Error: Failed to create quotation"

    except Exception as e:
        return f"Error: Error creating quotation: {str(e)}"

@mcp.tool()
async def update_quotation_status(quotation_id: str, new_status: str) -> str:
    """Update the status of a quotation.

    Args:
        quotation_id: The quotation ID to update
        new_status: New status ('draft', 'sent', 'accepted', 'rejected', 'completed', etc.)

    Returns:
        Success message
    """
    if not current_user_email:
        return "Please set user email first using set_user_email tool"

    valid_statuses = ['draft', 'sent', 'accepted', 'rejected', 'docs_uploaded', 'completed', 'Shipped']

    if new_status not in valid_statuses:
        return f"Error: Invalid status. Valid statuses: {', '.join(valid_statuses)}"

    try:
        client = get_supabase_client()
        user_id = get_user_id_from_email(current_user_email)

        if not user_id:
            return "Error: User not found"

        # Check if quotation exists and belongs to user
        check_response = client.table("quotations").select("id").eq("id", quotation_id).eq("user_id", user_id).execute()

        if not check_response.data:
            return f"Error: Quotation '{quotation_id}' not found or access denied."

        # Update status
        update_data = {"status": new_status}
        if new_status == "completed":
            update_data["completed_at"] = datetime.now().isoformat()

        response = client.table("quotations").update(update_data).eq("id", quotation_id).eq("user_id", user_id).execute()

        if response.data:
            return f"Success: Quotation {quotation_id} status updated to '{new_status}'"
        else:
            return "Error: Failed to update quotation status"

    except Exception as e:
        return f"Error: Error updating quotation status: {str(e)}"

def main():
    """Main entry point"""
    # Initialize and run the server
    mcp.run(transport='stdio')

if __name__ == "__main__":
    main()
