/**
 * Jeevo Tours - Parallax Scrolling Effect
 * Uses GSAP and Lenis for smooth parallax animation
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initParallax);
    } else {
        initParallax();
    }

    function initParallax() {
        const parallaxSection = document.querySelector('[data-parallax-layers]');
        if (!parallaxSection) return;

        // Initialize smooth scroll with Lenis (if available)
        let lenis;
        if (typeof Lenis !== 'undefined') {
            lenis = new Lenis({
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                orientation: 'vertical',
                smoothWheel: true,
                smoothTouch: false,
                touchMultiplier: 2,
            });

            function raf(time) {
                lenis.raf(time);
                requestAnimationFrame(raf);
            }
            requestAnimationFrame(raf);

            // Connect Lenis to GSAP ScrollTrigger
            if (typeof gsap !== 'undefined' && gsap.ScrollTrigger) {
                lenis.on('scroll', gsap.ScrollTrigger.update);
                gsap.ticker.add((time) => {
                    lenis.raf(time * 1000);
                });
                gsap.ticker.lagSmoothing(0);
            }
        }

        // Setup GSAP parallax animation
        if (typeof gsap !== 'undefined' && gsap.ScrollTrigger) {
            gsap.registerPlugin(gsap.ScrollTrigger);

            const timeline = gsap.timeline({
                scrollTrigger: {
                    trigger: parallaxSection,
                    start: "top top",
                    end: "bottom top",
                    scrub: 0.5,
                    // markers: true // Uncomment for debugging
                }
            });

            // Define parallax layers with different speeds
            const layers = [
                { selector: '[data-parallax-layer="1"]', yPercent: 70, opacity: 0.3 },
                { selector: '[data-parallax-layer="2"]', yPercent: 55, opacity: 0.5 },
                { selector: '[data-parallax-layer="3"]', yPercent: 40, opacity: 1 },
                { selector: '[data-parallax-layer="4"]', yPercent: 10, opacity: 1 }
            ];

            layers.forEach((layer, index) => {
                const elements = parallaxSection.querySelectorAll(layer.selector);
                if (elements.length > 0) {
                    timeline.to(
                        elements,
                        {
                            yPercent: layer.yPercent,
                            ease: "none",
                        },
                        index === 0 ? undefined : "<" // Start at same time for layers 2+
                    );
                }
            });

            // Optional: Add fade effect to content section
            const contentSection = document.querySelector('.jv-parallax-content');
            if (contentSection) {
                gsap.from(contentSection, {
                    scrollTrigger: {
                        trigger: contentSection,
                        start: "top 80%",
                        end: "top 50%",
                        scrub: true,
                    },
                    opacity: 0,
                    y: 50,
                });
            }
        }

        // Add intersection observer for animation trigger
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('jv-parallax-visible');
                        }
                    });
                },
                {
                    threshold: 0.1,
                }
            );

            const parallaxElements = document.querySelectorAll('.jv-parallax-section [data-parallax-layer]');
            parallaxElements.forEach((el) => observer.observe(el));
        }

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (lenis) lenis.destroy();
            if (typeof gsap !== 'undefined' && gsap.ScrollTrigger) {
                gsap.ScrollTrigger.getAll().forEach(st => st.kill());
            }
        });
    }
})();
