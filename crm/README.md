# Jeevo Tours CRM - Setup & Deployment Guide

A lightweight, production-ready Custom CRM built specifically for Jeevo Tours travel business.

---

## 🚀 Features

- ✅ **Public API Endpoint** for website form submissions (CORS enabled)
- ✅ **Admin Dashboard** for managing leads with status tracking
- ✅ **SQLite** for local development (zero setup)
- ✅ **PostgreSQL** support for production (Render.com compatible)
- ✅ **Beautiful Tailwind CSS UI** - no build tools needed
- ✅ **Real-time stats** - Total leads, conversion rates, pipeline tracking
- ✅ **Note-taking system** with timestamps
- ✅ **Mobile responsive** admin dashboard

---

## 📁 Project Structure

```
crm/
├── main.py              # FastAPI application with all endpoints
├── database.py          # SQLAlchemy models and database config
├── admin.html           # Admin dashboard (Tailwind CSS)
├── requirements.txt     # Python dependencies
├── README.md            # This file
└── jeevo_crm.db        # SQLite database (auto-created)
```

---

## 🛠️ Local Development Setup

### Prerequisites
- Python 3.9 or higher
- pip (Python package manager)

### Step 1: Install Dependencies

```bash
cd crm
pip install -r requirements.txt
```

### Step 2: Initialize Database

```bash
python database.py
```

You should see:
```
✅ Database initialized successfully!
📊 Using database: sqlite:///./jeevo_crm.db...
```

### Step 3: Run the Server

```bash
python main.py
```

Or use uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 4: Access the Application

- **API Root**: http://localhost:8000/
- **Admin Dashboard**: http://localhost:8000/admin
- **API Docs (Swagger)**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

## 📊 Admin Dashboard Usage

### Dashboard Features

1. **Stats Cards** (Top of page)
   - Total Leads
   - New Leads (requiring action)
   - Booked Deals
   - Conversion Rate %

2. **Leads Table**
   - Date received
   - Client name & travel dates
   - Contact info (email & phone)
   - Destination & budget
   - Current status badge
   - Action buttons (Edit, Delete)

3. **Update Lead Modal**
   - Change status (New Lead → Contacted → Itinerary Sent → Booked/Lost)
   - Add timestamped notes
   - View previous notes history

### Status Workflow

```
New Lead → Contacted → Itinerary Sent → Booked ✅
                                      → Lost ❌
```

---

## 🌐 API Endpoints

### Public Endpoints (CORS Enabled)

#### POST `/api/enquiries`
Submit a new lead from website contact form.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "destination": "Kerala",
  "budget": "$2000-3000",
  "travel_dates": "Dec 2026",
  "message": "Interested in houseboat tour"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you! Your enquiry has been received...",
  "lead_id": 1
}
```

### Admin Endpoints

#### GET `/api/crm/leads`
Get all leads (newest first).

#### GET `/api/crm/leads/{lead_id}`
Get specific lead details.

#### PUT `/api/crm/leads/{lead_id}`
Update lead status and/or add notes.

**Request Body:**
```json
{
  "status": "Contacted",
  "notes": "Called customer, discussed Kerala package"
}
```

#### DELETE `/api/crm/leads/{lead_id}`
Delete a lead permanently.

#### GET `/api/crm/stats`
Get dashboard statistics.

---

## 🔗 Integrate with Your Website

### Update Your Contact Form

Replace your existing form submission with this JavaScript:

```javascript
// In your website's contact form
document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        destination: document.getElementById('destination').value,
        budget: document.getElementById('budget')?.value,
        travel_dates: document.getElementById('dates')?.value,
        message: document.getElementById('message').value
    };
    
    try {
        const response = await fetch('https://your-crm-url.onrender.com/api/enquiries', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Thank you! We will contact you within 24 hours.');
            document.getElementById('contactForm').reset();
        }
    } catch (error) {
        alert('Failed to submit. Please try again or call us directly.');
    }
});
```

---

## 🚢 Deploy to Render.com (Free Tier)

### Step 1: Prepare for Deployment

Create a `render.yaml` file in the `crm/` folder:

```yaml
services:
  - type: web
    name: jeevo-tours-crm
    runtime: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: DATABASE_URL
        fromDatabase:
          name: jeevo-crm-db
          property: connectionString

databases:
  - name: jeevo-crm-db
    databaseName: jeevo_crm
    plan: free
```

### Step 2: Push to GitHub

```bash
cd crm
git init
git add .
git commit -m "Initial commit - Jeevo Tours CRM"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/jeevo-crm.git
git push -u origin main
```

### Step 3: Deploy on Render

1. Go to [render.com](https://render.com) and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Fill in:
   - **Name**: `jeevo-tours-crm`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variable:
   - **Key**: `DATABASE_URL`
   - **Value**: (Leave blank initially - add PostgreSQL database first)
6. Click **"Create Web Service"**

### Step 4: Add PostgreSQL Database

1. From Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Name it `jeevo-crm-db`
3. Select **Free** plan
4. Click **"Create Database"**
5. Copy the **Internal Database URL**
6. Go back to your Web Service → **Environment**
7. Add/Update `DATABASE_URL` with the copied URL

### Step 5: Initialize Production Database

Once deployed, visit:
```
https://your-app-name.onrender.com/docs
```

The database will auto-initialize on first request.

### Step 6: Access Your CRM

- **Admin Dashboard**: `https://your-app-name.onrender.com/admin`
- **API Endpoint**: `https://your-app-name.onrender.com/api/enquiries`

---

## 🔒 Security Considerations

### For Production Use:

1. **Add Authentication to Admin Dashboard**
   
   Update `main.py`:
   ```python
   from fastapi import Depends, HTTPException, status
   from fastapi.security import HTTPBasic, HTTPBasicCredentials
   import secrets
   
   security = HTTPBasic()
   
   def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
       correct_username = secrets.compare_digest(credentials.username, "admin")
       correct_password = secrets.compare_digest(credentials.password, os.getenv("ADMIN_PASSWORD", "changeme"))
       if not (correct_username and correct_password):
           raise HTTPException(
               status_code=status.HTTP_401_UNAUTHORIZED,
               detail="Invalid credentials"
           )
       return credentials.username
   
   # Protect admin endpoints
   @app.get("/api/crm/leads")
   async def get_all_leads(db: Session = Depends(get_db), user: str = Depends(verify_admin)):
       # ... existing code
   ```

2. **Restrict CORS Origins**
   
   In `main.py`, change:
   ```python
   allow_origins=["*"]  # ❌ Development only
   ```
   
   To:
   ```python
   allow_origins=["https://your-website.com", "https://www.your-website.com"]  # ✅ Production
   ```

3. **Add Rate Limiting**
   
   Install:
   ```bash
   pip install slowapi
   ```
   
   Add to `main.py`:
   ```python
   from slowapi import Limiter, _rate_limit_exceeded_handler
   from slowapi.util import get_remote_address
   
   limiter = Limiter(key_func=get_remote_address)
   app.state.limiter = limiter
   
   @app.post("/api/enquiries")
   @limiter.limit("10/hour")
   async def create_enquiry(request: Request, enquiry: EnquiryCreate, db: Session = Depends(get_db)):
       # ... existing code
   ```

4. **Set Environment Variables**
   
   On Render, add:
   - `ADMIN_PASSWORD` - Strong password for admin access
   - `DATABASE_URL` - PostgreSQL connection string (auto-provided)

---

## 🧪 Testing the API

### Test Lead Submission (Public Endpoint)

```bash
curl -X POST "http://localhost:8000/api/enquiries" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "test@example.com",
    "phone": "+1234567890",
    "destination": "Golden Triangle",
    "budget": "$1500-2000",
    "travel_dates": "January 2027",
    "message": "Interested in 7-day Golden Triangle tour"
  }'
```

### Test Admin Endpoints

```bash
# Get all leads
curl "http://localhost:8000/api/crm/leads"

# Update lead status
curl -X PUT "http://localhost:8000/api/crm/leads/1" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Contacted",
    "notes": "Customer called back, sending itinerary"
  }'

# Get stats
curl "http://localhost:8000/api/crm/stats"
```

---

## 📱 Database Schema

### Leads Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Primary key (auto-increment) |
| `name` | String(100) | Customer name |
| `email` | String(100) | Customer email |
| `phone` | String(20) | Customer phone |
| `destination` | String(100) | Desired destination (optional) |
| `budget` | String(50) | Budget range (optional) |
| `travel_dates` | String(100) | Preferred dates (optional) |
| `status` | String(50) | Lead status (default: "New Lead") |
| `notes` | Text | Timestamped notes |
| `created_at` | DateTime | Submission timestamp (UTC) |

---

## 🔄 Backup & Restore

### SQLite (Local Development)

**Backup:**
```bash
cp jeevo_crm.db jeevo_crm_backup_$(date +%Y%m%d).db
```

**Restore:**
```bash
cp jeevo_crm_backup_20261214.db jeevo_crm.db
```

### PostgreSQL (Production)

Render automatically backs up PostgreSQL databases. To manually export:

1. Go to your database on Render dashboard
2. Click **"Backups"** tab
3. Download the latest backup

---

## 🐛 Troubleshooting

### Issue: Database connection error

**Solution:** Check `DATABASE_URL` environment variable is set correctly.

```bash
# Check current setting
echo $DATABASE_URL

# For PostgreSQL, ensure format is:
postgresql://user:password@host:port/database
```

### Issue: CORS error from website

**Solution:** Ensure your website domain is in the CORS allow list in `main.py`.

### Issue: Admin dashboard shows "Loading..." forever

**Solution:** 
1. Check if backend is running (`http://localhost:8000/health`)
2. Open browser console (F12) to see error messages
3. Verify API_BASE_URL in `admin.html` is correct

### Issue: Render deployment fails

**Solution:**
1. Check build logs in Render dashboard
2. Ensure `requirements.txt` is in the root of your repository
3. Verify Python version compatibility (3.9+)

---

## 📈 Future Enhancements

- [ ] Email notifications when new leads arrive
- [ ] WhatsApp integration for instant follow-ups
- [ ] Export leads to CSV/Excel
- [ ] Calendar integration for travel dates
- [ ] Customer portal for itinerary viewing
- [ ] Payment tracking and invoicing
- [ ] Multi-user access with roles
- [ ] SMS reminders for follow-ups
- [ ] Analytics dashboard with charts
- [ ] Integration with Google Calendar/Sheets

---

## 🤝 Support

For issues or questions:
1. Check the [FastAPI Documentation](https://fastapi.tiangolo.com/)
2. Review [SQLAlchemy Docs](https://docs.sqlalchemy.org/)
3. Check [Render Deployment Guide](https://render.com/docs)

---

## 📄 License

This CRM system is proprietary software for Jeevo Tours & Travels.

---

**Built with ❤️ for Jeevo Tours**  
*Last Updated: September 2026*
