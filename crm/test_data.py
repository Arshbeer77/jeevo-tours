"""
Test script to add sample leads to the CRM
Run this after initializing the database to see the CRM in action
"""

import requests
import json
from datetime import datetime

API_URL = "http://localhost:8000"

# Sample leads data
sample_leads = [
    {
        "name": "Sarah Mitchell",
        "email": "sarah.mitchell@example.com",
        "phone": "+1-555-0123",
        "destination": "Golden Triangle",
        "budget": "$2000-2500",
        "travel_dates": "January 2027",
        "message": "Interested in the 7-day Golden Triangle tour. Prefer 4-star hotels."
    },
    {
        "name": "James Anderson",
        "email": "j.anderson@example.com",
        "phone": "+44-20-1234-5678",
        "destination": "Kerala Paradise",
        "budget": "$3000-3500",
        "travel_dates": "February 15-25, 2027",
        "message": "Looking for Kerala backwater experience with houseboat. Honeymoon trip."
    },
    {
        "name": "Maria Garcia",
        "email": "maria.garcia@example.com",
        "phone": "+34-91-123-4567",
        "destination": "Royal Rajasthan",
        "budget": "$4000-5000",
        "travel_dates": "March 2027",
        "message": "Want luxury palace hotels and desert safari. Group of 4 people."
    },
    {
        "name": "David Chen",
        "email": "david.chen@example.com",
        "phone": "+86-10-1234-5678",
        "destination": "Spiritual India",
        "budget": "$1500-2000",
        "travel_dates": "November 2026",
        "message": "Interested in yoga retreat and Varanasi Ganga Aarti experience."
    },
    {
        "name": "Emma Thompson",
        "email": "emma.t@example.com",
        "phone": "+61-2-1234-5678",
        "destination": "Delhi & Kathmandu",
        "budget": "$2500-3000",
        "travel_dates": "December 20-27, 2026",
        "message": "Want to explore both India and Nepal. UNESCO heritage sites."
    }
]

def add_sample_leads():
    """Add sample leads to the CRM"""
    print("=" * 60)
    print("  Adding Sample Leads to Jeevo Tours CRM")
    print("=" * 60)
    print()

    success_count = 0
    fail_count = 0

    for i, lead in enumerate(sample_leads, 1):
        print(f"[{i}/{len(sample_leads)}] Adding lead: {lead['name']}...", end=" ")

        try:
            response = requests.post(
                f"{API_URL}/api/enquiries",
                json=lead,
                headers={"Content-Type": "application/json"}
            )

            if response.status_code == 201:
                result = response.json()
                print(f"✅ Success (ID: {result['lead_id']})")
                success_count += 1
            else:
                print(f"❌ Failed (Status: {response.status_code})")
                fail_count += 1

        except requests.exceptions.ConnectionError:
            print("❌ Failed - Cannot connect to server")
            print()
            print("ERROR: Make sure the FastAPI server is running!")
            print("Run: python main.py")
            return
        except Exception as e:
            print(f"❌ Failed ({str(e)})")
            fail_count += 1

    print()
    print("=" * 60)
    print(f"  Summary: {success_count} successful, {fail_count} failed")
    print("=" * 60)
    print()

    if success_count > 0:
        print("✨ Sample data added successfully!")
        print()
        print("📊 Access the admin dashboard:")
        print(f"   {API_URL}/admin")
        print()

if __name__ == "__main__":
    add_sample_leads()
