"""
Jeevo Tours CRM - FastAPI Backend
A lightweight CRM system for managing travel business leads
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
import os

from database import get_db, init_db, Lead

# Initialize FastAPI app
app = FastAPI(
    title="Jeevo Tours CRM API",
    description="Lightweight CRM for travel business lead management",
    version="1.0.0"
)

# CORS Configuration - Allow all origins for public form submissions
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your specific domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()


# ============================================
# PYDANTIC MODELS (Request/Response Schemas)
# ============================================

class EnquiryCreate(BaseModel):
    """Schema for public enquiry form submission"""
    name: str
    email: EmailStr
    phone: str
    destination: Optional[str] = None
    budget: Optional[str] = None
    travel_dates: Optional[str] = None
    message: Optional[str] = None  # Can be stored in notes


class LeadUpdate(BaseModel):
    """Schema for updating lead status and notes"""
    status: Optional[str] = None
    notes: Optional[str] = None


class LeadResponse(BaseModel):
    """Schema for lead response"""
    id: int
    name: str
    email: str
    phone: str
    destination: Optional[str]
    budget: Optional[str]
    travel_dates: Optional[str]
    status: str
    notes: str
    created_at: str

    class Config:
        from_attributes = True


# ============================================
# PUBLIC API ENDPOINTS
# ============================================

@app.get("/", response_class=HTMLResponse)
async def root():
    """Root endpoint - simple welcome message"""
    return """
    <html>
        <head>
            <title>Jeevo Tours CRM</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <h1>🕉 Jeevo Tours CRM API</h1>
            <p>Your lightweight travel business CRM is running successfully!</p>
            <ul>
                <li><a href="/docs">📚 API Documentation (Swagger UI)</a></li>
                <li><a href="/admin">🔧 Admin Dashboard</a></li>
            </ul>
            <p style="color: #666; font-size: 14px;">
                API Version: 1.0.0 | Status: ✅ Online
            </p>
        </body>
    </html>
    """


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "Jeevo Tours CRM",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/enquiries", status_code=201)
async def create_enquiry(enquiry: EnquiryCreate, db: Session = Depends(get_db)):
    """
    PUBLIC ENDPOINT: Accept lead submissions from website contact forms
    CORS enabled for all origins
    """
    try:
        # Create new lead from enquiry
        new_lead = Lead(
            name=enquiry.name,
            email=enquiry.email,
            phone=enquiry.phone,
            destination=enquiry.destination,
            budget=enquiry.budget,
            travel_dates=enquiry.travel_dates,
            status="New Lead",
            notes=enquiry.message if enquiry.message else "",
            created_at=datetime.utcnow()
        )

        db.add(new_lead)
        db.commit()
        db.refresh(new_lead)

        return {
            "success": True,
            "message": "Thank you! Your enquiry has been received. We'll get back to you within 24 hours.",
            "lead_id": new_lead.id
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create enquiry: {str(e)}")


# ============================================
# CRM ADMIN API ENDPOINTS
# ============================================

@app.get("/api/crm/leads", response_model=List[LeadResponse])
async def get_all_leads(db: Session = Depends(get_db)):
    """
    Get all leads ordered by creation date (newest first)
    """
    try:
        leads = db.query(Lead).order_by(Lead.created_at.desc()).all()
        return [lead.to_dict() for lead in leads]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch leads: {str(e)}")


@app.get("/api/crm/leads/{lead_id}", response_model=LeadResponse)
async def get_lead(lead_id: int, db: Session = Depends(get_db)):
    """
    Get a specific lead by ID
    """
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead.to_dict()


@app.put("/api/crm/leads/{lead_id}")
async def update_lead(lead_id: int, lead_update: LeadUpdate, db: Session = Depends(get_db)):
    """
    Update lead status and/or append notes
    """
    try:
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")

        # Update status if provided
        if lead_update.status:
            valid_statuses = ["New Lead", "Contacted", "Itinerary Sent", "Booked", "Lost"]
            if lead_update.status not in valid_statuses:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
                )
            lead.status = lead_update.status

        # Append notes if provided (with timestamp)
        if lead_update.notes:
            timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
            new_note = f"\n[{timestamp}] {lead_update.notes}"
            lead.notes = (lead.notes or "") + new_note

        db.commit()
        db.refresh(lead)

        return {
            "success": True,
            "message": "Lead updated successfully",
            "lead": lead.to_dict()
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update lead: {str(e)}")


@app.delete("/api/crm/leads/{lead_id}")
async def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    """
    Delete a lead permanently
    """
    try:
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")

        db.delete(lead)
        db.commit()

        return {
            "success": True,
            "message": f"Lead #{lead_id} deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete lead: {str(e)}")


@app.get("/api/crm/stats")
async def get_stats(db: Session = Depends(get_db)):
    """
    Get dashboard statistics
    """
    try:
        total_leads = db.query(Lead).count()
        new_leads = db.query(Lead).filter(Lead.status == "New Lead").count()
        contacted = db.query(Lead).filter(Lead.status == "Contacted").count()
        itinerary_sent = db.query(Lead).filter(Lead.status == "Itinerary Sent").count()
        booked = db.query(Lead).filter(Lead.status == "Booked").count()
        lost = db.query(Lead).filter(Lead.status == "Lost").count()

        return {
            "total_leads": total_leads,
            "new_leads": new_leads,
            "contacted": contacted,
            "itinerary_sent": itinerary_sent,
            "booked": booked,
            "lost": lost,
            "conversion_rate": round((booked / total_leads * 100) if total_leads > 0 else 0, 1)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")


# ============================================
# SERVE ADMIN DASHBOARD
# ============================================

@app.get("/admin", response_class=HTMLResponse)
async def serve_admin():
    """Serve the admin dashboard HTML"""
    try:
        with open("crm/admin.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(
            content="<h1>Admin dashboard not found</h1><p>Please ensure admin.html exists in the crm folder.</p>",
            status_code=404
        )


# ============================================
# RUN SERVER (for local development)
# ============================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True  # Remove in production
    )
