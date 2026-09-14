# Jeevo Tours & Travels Website

A modern, fully responsive travel agency website showcasing tours across India and international destinations. Built with vanilla HTML, CSS, and JavaScript featuring a professional Indian aesthetic with saffron/orange color scheme.

---

## 📁 Project Structure

```
jeevo-tours/
├── index.html              # Main homepage
├── styles.css              # Global stylesheet
├── script.js               # Interactive features & animations
├── README.md               # Project documentation (this file)
└── tours/                  # Individual tour pages
    ├── tour-page.css       # Tour page specific styles
    ├── golden-triangle.html
    ├── kerala-paradise.html
    ├── royal-rajasthan.html
    ├── spiritual-india.html
    ├── vietnam-discovery.html
    └── delhi-kathmandu.html
```

---

## 🎨 Design Features

### Color Palette
- **Primary**: Saffron/Orange (`#FF9933`, `#FF6B35`)
- **Accent**: Green (`#138808`, `#4CAF50`)
- **Neutral**: Dark navy, gray shades, white
- **Gradients**: Linear gradients with warm Indian tones

### Typography
- **Headings**: Playfair Display (serif, elegant)
- **Body**: Poppins (sans-serif, modern)
- **Icons**: Font Awesome 6.5.1

### Visual Elements
- Smooth hero slideshow with Ken Burns effect
- Mandala-inspired background animations
- Card-based layouts with hover effects
- Responsive grid systems
- Shadow depths for visual hierarchy
- Scroll-triggered animations

---

## ✨ Features

### Navigation (`index.html`)
- Fixed navbar with scroll effects
- Active link highlighting based on scroll position
- Mobile-responsive hamburger menu
- CTA button for quick booking access

### Hero Section
- **Rotating Slideshow**: 4 high-quality images with 5-second transitions
- **Animated Stats Counter**: 1200+ travelers, 50+ destinations, 8+ years
- **Ken Burns Effect**: Subtle zoom animation on active slides
- **Scroll Indicator**: Animated scroll prompt

### Main Sections
1. **About Us** - Company story with image gallery and feature grid
2. **Destinations** - 6 popular destinations with hover overlays
3. **Packages** - 6 tour packages with detailed information
4. **Gallery** - Masonry grid with 8 images
5. **Testimonials** - 3 customer reviews with ratings
6. **CTA Section** - Call-to-action with WhatsApp integration
7. **Contact** - Contact form with office details and social links
8. **Footer** - Newsletter signup, quick links, social media

### JavaScript Functionality (`script.js`)
- ✅ Smooth hero slideshow transitions
- ✅ Navbar scroll effects and shadows
- ✅ Active navigation link highlighting
- ✅ Mobile menu toggle
- ✅ Animated statistics counter
- ✅ Intersection Observer for scroll animations
- ✅ Back-to-top button
- ✅ Form handling (contact & newsletter)
- ✅ Smooth anchor scrolling
- ✅ Lazy image loading

### Tour Pages (`tours/*.html`)
Each tour page includes:
- **Hero Section**: Tour title, route, duration, group size, seasonality
- **Pricing**: "Contact for Pricing" model (encourages direct enquiries)
- **Overview**: Detailed tour description
- **Highlights Grid**: Key attractions with icons
- **Day-by-Day Itinerary**: Complete schedule with activities
- **Inclusions/Exclusions**: What's covered in the package
- **Booking Form**: Enquiry form for custom quotes
- **Quick Info Sidebar**: Duration, group size, best time, difficulty
- **Contact Options**: Phone, email, WhatsApp buttons

---

## 📦 Available Tours

### 1. **Golden Triangle Tour** 
- **Duration**: 7 Days / 6 Nights
- **Route**: Delhi → Agra → Jaipur → Delhi
- **Highlights**: Taj Mahal sunrise, Amber Fort, Red Fort, City Palace
- **Badge**: Best Seller
- **File**: `tours/golden-triangle.html`

### 2. **Kerala Paradise Escape**
- **Duration**: 10 Days / 9 Nights
- **Route**: Kochi → Munnar → Alleppey → Kovalam
- **Highlights**: Houseboat stay, Ayurvedic spa, tea plantations, Kathakali dance
- **Badge**: Most Popular
- **File**: `tours/kerala-paradise.html`

### 3. **Royal Rajasthan Odyssey**
- **Duration**: 12 Days / 11 Nights
- **Route**: Jaipur → Jodhpur → Udaipur → Jaisalmer
- **Highlights**: Palace hotels, desert safari, hot air balloon, royal dinner
- **Badge**: Luxury
- **File**: `tours/royal-rajasthan.html`

### 4. **Spiritual India Journey**
- **Duration**: 9 Days / 8 Nights
- **Route**: Varanasi → Bodh Gaya → Rishikesh → Haridwar
- **Highlights**: Ganga Aarti, yoga & meditation, ashram visits, boat rides
- **Badge**: Spiritual
- **File**: `tours/spiritual-india.html`

### 5. **Vietnam Discovery Tour**
- **Duration**: 10 Days / 9 Nights
- **Route**: Hanoi → Ha Long Bay → Hoi An → Saigon
- **Highlights**: Ha Long cruise, ancient town, Mekong Delta, street food
- **Badge**: International
- **File**: `tours/vietnam-discovery.html`

### 6. **Delhi & Kathmandu Heritage**
- **Duration**: 7 Days / 6 Nights
- **Route**: Delhi → Kathmandu → Bhaktapur → Patan
- **Highlights**: UNESCO sites, Living Goddess Kumari, stupas, Himalayan views
- **Badge**: International
- **File**: `tours/delhi-kathmandu.html`

---

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No build tools or dependencies required
- Internet connection for external resources (fonts, Font Awesome icons)

### Installation
1. Clone or download the repository
2. Open `index.html` in your browser
3. Navigate through the website

```bash
# If using a local server (optional)
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js
npx http-server
```

Then visit: `http://localhost:8000`

---

## 📱 Responsive Design

### Breakpoints
- **Desktop**: 1024px and above (full layout)
- **Tablet**: 768px - 1023px (2-column grids)
- **Mobile**: Below 768px (single column, hamburger menu)
- **Small Mobile**: Below 480px (optimized for small screens)

### Mobile Features
- Hamburger navigation menu
- Stacked hero buttons
- Single-column package cards
- Touch-optimized interactions
- Optimized image sizes

---

## 🔧 Customization Guide

### Update Contact Information
Edit these sections in `index.html`:
- **Phone**: Lines 520-521 (Contact section), Line 490 (WhatsApp)
- **Email**: Lines 527-528
- **Address**: Lines 513-514
- **Working Hours**: Lines 534-535

### Change Colors
Edit CSS variables in `styles.css` (lines 7-50):
```css
:root {
    --primary: #FF6B35;        /* Main orange */
    --saffron: #FF9933;        /* Indian saffron */
    --accent: #138808;         /* Green accent */
    /* ... */
}
```

### Add New Tour
1. Duplicate an existing tour HTML file in `tours/` folder
2. Update tour-specific content (title, itinerary, highlights)
3. Add package card to `index.html` (lines 224-379)
4. Link to new tour page with "View Details" button

### Update Images
Images are loaded from Pexels CDN. To use custom images:
1. Replace image URLs in HTML files
2. Ensure images are optimized for web (compressed, correct dimensions)
3. Add `loading="lazy"` attribute for performance

### Form Backend Integration
Forms currently show alerts. To connect to backend:
```javascript
// In script.js, replace the alert with:
fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
})
.then(response => response.json())
.then(data => {
    // Handle success
})
.catch(error => {
    // Handle error
});
```

---

## 🌐 External Resources

- **Fonts**: Google Fonts (Playfair Display, Poppins)
- **Icons**: Font Awesome 6.5.1 CDN
- **Images**: Pexels (high-quality stock photography)

All external resources are loaded via CDN for optimal performance and caching.

---

## ✅ Browser Compatibility

- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅
- Opera 76+ ✅

**Features used:**
- CSS Grid & Flexbox
- CSS Custom Properties (variables)
- Intersection Observer API
- ES6+ JavaScript

---

## 📊 Performance Features

- **Lazy Loading**: Images load as they enter viewport
- **Optimized Animations**: Hardware-accelerated CSS transforms
- **Smooth Scrolling**: Native CSS smooth scroll
- **Efficient Selectors**: Minimal DOM queries
- **Caching**: External resources cached by CDN
- **Responsive Images**: Properly sized images for different viewports

---

## 🔮 Future Enhancements

### Recommended Additions
- [ ] Backend API for form submissions
- [ ] Payment gateway integration
- [ ] User authentication & booking dashboard
- [ ] Blog section for travel tips
- [ ] Multi-language support (Hindi, Spanish, French)
- [ ] Live chat widget
- [ ] Google Analytics tracking
- [ ] SEO optimization (meta tags, schema markup)
- [ ] Customer testimonials with real photos
- [ ] Interactive map integration
- [ ] Social media feed integration
- [ ] Email newsletter automation
- [ ] Booking calendar with availability
- [ ] Review & rating system
- [ ] Virtual tour videos
- [ ] Weather widget for destinations

### Technical Improvements
- [ ] Convert to React/Vue for better scalability
- [ ] Add TypeScript for type safety
- [] Implement PWA features (offline mode, app install)
- [ ] Add automated testing (Jest, Cypress)
- [ ] Set up CI/CD pipeline
- [ ] Optimize images with WebP format
- [ ] Implement service workers for caching
- [ ] Add internationalization (i18n)

---

## 📝 Notes for Developers

### Code Style
- **CSS**: BEM-inspired naming (component-based)
- **JavaScript**: ES6+ features, modular functions
- **HTML**: Semantic markup, ARIA labels for accessibility
- **Comments**: Section headers for easy navigation

### File Organization
- Global styles in `styles.css`
- Page-specific styles in separate files (`tour-page.css`)
- All JavaScript functionality in single `script.js`
- Tour pages follow consistent template structure

### Accessibility
- ARIA labels on interactive elements
- Alt text on all images
- Semantic HTML5 elements
- Keyboard navigation support
- Color contrast ratios meet WCAG AA standards
- Focus indicators on interactive elements

---

## 📞 Support & Contact

For questions about the website codebase:
- Review the code comments in each file
- Check the browser console for JavaScript errors
- Validate HTML at [W3C Validator](https://validator.w3.org/)
- Test CSS at [CSS Validator](https://jigsaw.w3.org/css-validator/)

---

## 📜 License

This is a commercial website template for Jeevo Tours & Travels. All rights reserved.

---

## 🎉 Version History

**Current Version**: 1.0 (September 2026)
- ✅ Complete responsive website
- ✅ 6 tour packages with detailed pages
- ✅ Interactive JavaScript features
- ✅ Professional Indian-themed design
- ✅ Contact forms and newsletter signup
- ✅ Mobile-optimized navigation
- ✅ Smooth animations and transitions

---

**Last Updated**: September 14, 2026  
**Status**: Production Ready 🚀  
**Maintained by**: Jeevo Tours & Travels Web Team
