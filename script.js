/* ========================================
   JEEVO TOURS & TRAVELS - JAVASCRIPT
   Interactive functionality for the website
   ======================================== */

// ========== NAVIGATION SCROLL EFFECT ==========
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-links a');
let lastScroll = 0;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    // Add shadow on scroll
    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

// Active navigation link on scroll
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
});

// ========== MOBILE NAVIGATION TOGGLE ==========
const navToggle = document.getElementById('navToggle');
const navLinksContainer = document.getElementById('navLinks');

if (navToggle) {
    navToggle.addEventListener('click', () => {
        navLinksContainer.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Close menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinksContainer.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });
}

// ========== SMOOTH HERO SLIDESHOW ==========
const heroSlides = document.querySelectorAll('.hero-slide');
let currentSlide = 0;

function nextSlide() {
    // Remove active class from current slide
    heroSlides[currentSlide].classList.remove('active');

    // Move to next slide
    currentSlide = (currentSlide + 1) % heroSlides.length;

    // Add active class to new slide
    heroSlides[currentSlide].classList.add('active');
}

// Change slide every 5 seconds with smooth transition
if (heroSlides.length > 1 && !prefersReducedMotion) {
    setInterval(nextSlide, 5000);
}

// ========== ANIMATED COUNTER ==========
const counters = document.querySelectorAll('.stat-num');
let counterAnimated = false;

function animateCounters() {
    if (counterAnimated) return;

    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'), 10);

        /* Stats written as text (e.g. "24/7") have no data-count and
           must be left exactly as they are. */
        if (!Number.isFinite(target)) return;

        if (prefersReducedMotion) {
            counter.textContent = target;
            return;
        }

        const duration = 2000; // 2 seconds
        const increment = target / (duration / 16); // 60fps
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };

        updateCounter();
    });

    counterAnimated = true;
}

// Trigger counter animation when hero section is visible
const heroSection = document.querySelector('.hero');
const observerOptions = {
    threshold: 0.5
};

const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
        }
    });
}, observerOptions);

if (heroSection) {
    heroObserver.observe(heroSection);
}

// ========== BACK TO TOP BUTTON ==========
const backToTop = document.getElementById('backToTop');

if (backToTop) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    });
}

// ========== CONTACT FORM HANDLING (INTEGRATED WITH CUSTOM CRM) ==========
const contactForm = document.getElementById('contactForm');

// Base URL for the Jeevo Tours CRM API (auto-detects local dev vs production)
const CRM_API_URL = '/api/enquiry'; // Vercel function -> Airtable

/* Inline status message inside the form. Replaces window.alert(),
   which blocks the page and gives screen readers nothing. */
function showFormStatus(form, type, html) {
    let status = form.querySelector('.form-status');
    if (!status) {
        status = document.createElement('p');
        status.className = 'form-status';
        form.appendChild(status);
    }
    status.className = 'form-status is-' + type;
    status.setAttribute('role', type === 'error' ? 'alert' : 'status');
    status.innerHTML = html;
}

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        /* Browser-side validation before anything is sent */
        if (!contactForm.checkValidity()) {
            contactForm.reportValidity();
            return;
        }

        const submitBtn = contactForm.querySelector('button[type="submit"]') || document.getElementById('contactSubmit');
        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'Send Enquiry';

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        }

        /* Send every field the form collects (month, nights, party size,
           hotel standard, budget, flights, reason). The old code only sent
           name/email/phone, so all the trip details never reached the CRM. */
        const formData = new FormData(contactForm);
        const payload = { source: 'Website' };
        formData.forEach((value, key) => {
            const v = String(value).trim();
            if (v) payload[key] = v;
        });

        const firstName = (payload.name || '').split(' ')[0];
        const cfg = window.JEEVO_CONFIG || {};
        const waLink = 'https://wa.me/' + String(cfg.whatsapp || '919876543210');

        /* Airtable first, then email, so an enquiry is never lost. */
        const sendByEmail = async () => {
            const key = cfg.web3formsKey;
            if (!key) return false;
            try {
                const r = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify(Object.assign({
                        access_key: key,
                        subject: 'Jeevo enquiry - ' + (payload.name || ''),
                        from_name: 'Jeevo website',
                        replyto: payload.email || ''
                    }, payload))
                });
                return r.ok;
            } catch (e) { return false; }
        };

        try {
            let ok = false;
            try {
                const response = await fetch(CRM_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                ok = response.ok;
            } catch (e) { ok = false; }

            if (!ok) ok = await sendByEmail();

            if (ok) {
                showFormStatus(contactForm, 'success',
                    'Thank you' + (firstName ? ', ' + firstName : '') + '. Your enquiry is in. We reply within one business day.');
                contactForm.reset();
            } else {
                showFormStatus(contactForm, 'error',
                    'That did not go through. Please call us or <a href="' + waLink + '" target="_blank" rel="noopener">message us on WhatsApp</a> and we will sort it out.');
            }
        } catch (error) {
            console.error('Submission error:', error);
            showFormStatus(contactForm, 'error',
                'That did not go through. Please call us or <a href="' + waLink + '" target="_blank" rel="noopener">message us on WhatsApp</a> and we will sort it out.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml;
            }
        }
    });
}

/* Newsletter signups are handled in assets/jeevo-forms.js */

// ========== SMOOTH SCROLL FOR ANCHOR LINKS ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');

        // Don't prevent default for empty hash or just #
        if (href === '#' || href === '') return;

        e.preventDefault();
        const target = document.querySelector(href);

        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ========== LAZY LOADING IMAGES ==========
const images = document.querySelectorAll('img[loading="lazy"]');

if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.src; // Trigger loading
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// ========== PREVENT FLASH OF UNSTYLED CONTENT ==========
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

console.log('🕉 Jeevo Tours & Travels - Website Loaded Successfully!');
