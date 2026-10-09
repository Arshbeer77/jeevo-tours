/* ========================================
   JEEVO TOURS & TRAVELS - JAVASCRIPT
   Interactive functionality for the website
   ======================================== */

// ========== NAVIGATION SCROLL EFFECT ==========
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-links a');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function syncHeader() {
    navbar?.classList.toggle('scrolled', window.scrollY > 50);
}
let headerFramePending = false;
window.addEventListener('scroll', () => {
    if (headerFramePending) return;
    headerFramePending = true;
    requestAnimationFrame(() => {
        syncHeader();
        headerFramePending = false;
    });
}, { passive: true });
window.addEventListener('pageshow', syncHeader);
syncHeader();

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

// Full-screen navigation lives in assets/jeevo-navigation.js.

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

// Pause off-screen/background animation so phones only render what is visible.
if (heroSlides.length > 1) {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer, visible = true;
    const syncSlideshow = () => {
        clearInterval(timer);
        if (visible && !document.hidden && !motion.matches) {
            timer = setInterval(() => {
                if (!document.documentElement.classList.contains('jv-menu-open')) nextSlide();
            }, 6500);
        }
    };
    new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        syncSlideshow();
    }, { threshold: 0 }).observe(document.querySelector('.hero'));
    document.addEventListener('visibilitychange', syncSlideshow);
    motion.addEventListener('change', syncSlideshow);
    syncSlideshow();
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
            counter.textContent = target + (counter.dataset.suffix || '');
            return;
        }

        const duration = 2000; // 2 seconds
        const increment = target / (duration / 16); // 60fps
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current) + (counter.dataset.suffix || '');
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target + (counter.dataset.suffix || '');
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
        /* Only offer WhatsApp if there is a real number behind it. This text
           is shown when a submission has already failed - pointing someone at
           a dead chat at that moment loses the enquiry for good. */
        const waDigits = String(cfg.whatsapp || '').replace(/[^\d]/g, '');
        const waReal = waDigits.length > 6 && waDigits !== '919876543210';
        const fallbackContact = waReal
            ? 'or <a href="https://wa.me/' + waDigits + '" target="_blank" rel="noopener">message us on WhatsApp</a>'
            : 'or email us at <a href="mailto:' + (cfg.contactEmail || 'jeevotoursandtravels@gmail.com') + '">' +
              (cfg.contactEmail || 'jeevotoursandtravels@gmail.com') + '</a>';

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
                    'That did not go through. Please call us ' + fallbackContact + ' and we will sort it out.');
            }
        } catch (error) {
            console.error('Submission error:', error);
            showFormStatus(contactForm, 'error',
                'That did not go through. Please call us ' + fallbackContact + ' and we will sort it out.');
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
            // offsetTop is relative to a positioned ancestor on tour pages.
            // Native anchor alignment honors the shared header scroll padding.
            history.pushState(null, '', href);
            target.scrollIntoView({
                block: 'start',
                behavior: prefersReducedMotion ? 'instant' : 'smooth'
            });
            if (this.classList.contains('skip-link')) {
                target.setAttribute('tabindex', '-1');
                target.focus({ preventScroll: true });
            }
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
