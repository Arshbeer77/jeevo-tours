# 🚀 QUICKSTART GUIDE - Jeevo Tours CRM

Get your CRM running in **5 minutes**!

---

## ⚡ Super Quick Start (Windows)

```bash
# 1. Run the setup wizard
python setup.py

# 2. Start the server (after setup completes)
start.bat
# OR
python main.py

# 3. Open your browser
http://localhost:8000/admin
```

---

## 📋 Manual Setup (All Platforms)

### Step 1: Install Dependencies
```bash
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

### Step 3: Start the Server
```bash
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Step 4: Access the Dashboard
Open in your browser:
- **Admin Dashboard**: http://localhost:8000/admin
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

## 🧪 Add Test Data (Optional)

In a new terminal window (while server is running):

```bash
python test_data.py
```

This will add 5 sample leads to test the CRM functionality.

---

## 🌐 Key URLs

| What | URL |
|------|-----|
| 🎛️ **Admin Dashboard** | http://localhost:8000/admin |
| 📚 **API Docs (Swagger)** | http://localhost:8000/docs |
| 💚 **Health Check** | http://localhost:8000/health |
| 📮 **Submit Lead (Public)** | http://localhost:8000/api/enquiries |

---

## 📝 Testing the API

### Test Lead Submission (CURL)

```bash
curl -X POST "http://localhost:8000/api/enquiries" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "test@example.com",
    "phone": "+1234567890",
    "destination": "Kerala",
    "budget": "$2000-3000",
    "travel_dates": "December 2026",
    "message": "Interested in houseboat tour"
  }'
```

### Test Lead Submission (PowerShell)

```powershell
$body = @{
    name = "Test Customer"
    email = "test@example.com"
    phone = "+1234567890"
    destination = "Kerala"
    budget = "$2000-3000"
    travel_dates = "December 2026"
    message = "Interested in houseboat tour"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/enquiries" -Method Post -Body $body -ContentType "application/json"
```

---

## 🎯 Using the Admin Dashboard

### Dashboard Overview

1. **Stats Cards** (Top)
   - Total Leads
   - New Leads
   - Booked Deals
   - Conversion Rate

2. **Leads Table**
   - View all leads with details
   - Click **Edit** (✏️) to update status/notes
   - Click **Delete** (🗑️) to remove lead

3. **Update Modal**
   - Change lead status
   - Add timestamped notes
   - View previous notes history

### Status Flow
```
New Lead → Contacted → Itinerary Sent → Booked ✅
                                      → Lost ❌
```

---

## 🔗 Connect Your Website Form

Update your website's contact form JavaScript:

```javascript
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
        const response = await fetch('http://localhost:8000/api/enquiries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Thank you! We will contact you within 24 hours.');
            document.getElementById('contactForm').reset();
        }
    } catch (error) {
        alert('Failed to submit. Please try again.');
    }
});
```

**Note**: Replace `http://localhost:8000` with your deployed URL (e.g., `https://your-app.onrender.com`)

---

## 🚢 Deploy to Production (Render.com)

### Quick Deploy Steps:

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial CRM setup"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/jeevo-crm.git
   git push -u origin main
   ```

2. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

3. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Settings:
     - **Name**: `jeevo-tours-crm`
     - **Runtime**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
     - **Plan**: `Free`

4. **Create PostgreSQL Database**
   - Click "New +" → "PostgreSQL"
   - Name: `jeevo-crm-db`
   - Plan: `Free`
   - Copy the **Internal Database URL**

5. **Add Environment Variable**
   - Go to your Web Service → "Environment"
   - Add variable:
     - **Key**: `DATABASE_URL`
     - **Value**: (paste the PostgreSQL URL)

6. **Deploy!**
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)
   - Access at: `https://your-app-name.onrender.com/admin`

---

## 🔐 Production Security Checklist

Before going live, update these in `main.py`:

```python
# 1. Restrict CORS to your domain only
allow_origins=["https://jeevotours.com", "https://www.jeevotours.com"]

# 2. Add authentication to admin endpoints (see README.md for code)

# 3. Add rate limiting to prevent spam (see README.md)

# 4. Set ADMIN_PASSWORD environment variable on Render
```

---

## 📱 File Structure

```
crm/
├── main.py              # FastAPI backend
├── database.py          # Database models
├── admin.html           # Admin dashboard UI
├── requirements.txt     # Python dependencies
├── setup.py            # Interactive setup wizard
├── test_data.py        # Sample data generator
├── start.bat           # Windows quick-start script
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore rules
├── README.md           # Full documentation
└── QUICKSTART.md       # This file
```

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 8000 is already in use
# Windows:
netstat -ano | findstr :8000

# Mac/Linux:
lsof -i :8000

# Use a different port:
uvicorn main:app --port 8001
```

### Database error
```bash
# Delete and recreate database
rm jeevo_crm.db
python database.py
```

### CORS error from website
- Check that `allow_origins=["*"]` is set in `main.py`
- For production, add your website domain to the list

### Dashboard shows "Loading..."
- Check server is running: http://localhost:8000/health
- Open browser console (F12) to see error messages
- Verify API_BASE_URL in `admin.html` matches your server URL

---

## 📚 Need More Help?

- **Full Documentation**: See `README.md`
- **API Reference**: http://localhost:8000/docs (when server running)
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Render Docs**: https://render.com/docs

---

## ✅ Quick Checklist

- [ ] Python 3.9+ installed
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] Database initialized (`python database.py`)
- [ ] Server running (`python main.py`)
- [ ] Dashboard accessible (http://localhost:8000/admin)
- [ ] Test data added (`python test_data.py`)
- [ ] Website form connected
- [ ] Ready to deploy! 🚀

---

**Built with ❤️ for Jeevo Tours**  
*Last Updated: September 14, 2026*
