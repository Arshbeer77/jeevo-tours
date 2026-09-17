/* ========================================
   JEEVO TOURS & TRAVELS - JAVASCRIPT
   Interactive functionality for the website
   ======================================== */

// ========== NAVIGATION SCROLL EFFECT ==========
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-links a');
let lastScroll = 0;

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
if (heroSlides.length > 1) {
    setInterval(nextSlide, 5000);
}

// ========== ANIMATED COUNTER ==========
const counters = document.querySelectorAll('.stat-num');
let counterAnimated = false;

function animateCounters() {
    if (counterAnimated) return;

    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
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

// ========== SCROLL ANIMATIONS ==========
const animateOnScroll = document.querySelectorAll('.package-card, .dest-card, .testimonial-card, .gallery-item');

const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

animateOnScroll.forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    scrollObserver.observe(element);
});

// ========== BACK TO TOP BUTTON ==========
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        backToTop.classList.add('show');
    } else {
        backToTop.classList.remove('show');
    }
});

// ========== CONTACT FORM HANDLING (INTEGRATED WITH CUSTOM CRM) ==========
const contactForm = document.getElementById('contactForm');

// Base URL for the Jeevo Tours CRM API (auto-detects local dev vs production)
const CRM_API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8000/api/enquiries'
    : 'https://jeevo-tours-crm.onrender.com/api/enquiries'; // Update with your Render service URL once live

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnHtml = submitBtn.innerHTML;

        // UI Loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

        // Collect form data
        const nameVal = document.getElementById('name')?.value || '';
        const emailVal = document.getElementById('email')?.value || '';
        const phoneVal = document.getElementById('phone')?.value || 'N/A';
        const destSelect = document.getElementById('destination');
        const destinationVal = destSelect && destSelect.options[destSelect.selectedIndex]
            ? destSelect.options[destSelect.selectedIndex].text
            : '';
        const messageVal = document.getElementById('message')?.value || '';

        const payload = {
            name: nameVal,
            email: emailVal,
            phone: phoneVal,
            destination: destinationVal !== 'Select a destination' ? destinationVal : '',
            notes: messageVal
        };

        try {
            const response = await fetch(CRM_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert('Thank you! Your trip enquiry has been submitted. Our team will get back to you within 24 hours.');
                contactForm.reset();
            } else {
                const errData = await response.json();
                alert('Form submission error: ' + (errData.detail || 'Failed to submit enquiry.'));
            }
        } catch (error) {
            console.error('CRM Submission Error:', error);
            alert('Thank you for reaching out! If the automatic submission fails, please feel free to call or WhatsApp us directly.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
        }
    });
}

// ========== NEWSLETTER FORM ==========
const newsletterForm = document.querySelector('.newsletter-form');

if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input[type="email"]').value;

        alert(`Thank you for subscribing with ${email}!`);
        newsletterForm.reset();
    });
}

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
