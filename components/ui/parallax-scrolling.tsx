'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import { Compass, Sparkles, PhoneCall, Award, ShieldCheck, HeartHandshake } from 'lucide-react';

export interface ParallaxComponentProps {
  title?: string;
  subtitle?: string;
  tagline?: string;
  bgImage?: string;
  midImage?: string;
  foreImage?: string;
}

export function ParallaxComponent({
  title = "Discover the Soul of India",
  subtitle = "Curated luxury expeditions, royal heritage retreats, and sacred spiritual journeys across Incredible India.",
  tagline = "🙏 Namaste — Welcome to Jeevo Tours & Travels",
  bgImage = "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=1600&q=80",
  midImage = "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1600&q=80",
  foreImage = "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1600&q=80"
}: ParallaxComponentProps) {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const triggerElement = parallaxRef.current?.querySelector('[data-parallax-layers]');

    if (triggerElement) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerElement,
          start: "0% 0%",
          end: "100% 0%",
          scrub: 0
        }
      });

      const layers = [
        { layer: "1", yPercent: 70 },
        { layer: "2", yPercent: 55 },
        { layer: "3", yPercent: 40 },
        { layer: "4", yPercent: 10 }
      ];

      layers.forEach((layerObj, idx) => {
        tl.to(
          triggerElement.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`),
          {
            yPercent: layerObj.yPercent,
            ease: "none"
          },
          idx === 0 ? undefined : "<"
        );
      });
    }

    const LenisClass = (Lenis as unknown as { default: typeof Lenis }).default || Lenis;
    const lenis = new LenisClass();
    lenis.on('scroll', ScrollTrigger.update);

    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
      if (triggerElement) gsap.killTweensOf(triggerElement);
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="parallax font-sans text-white bg-[#121222] min-h-screen overflow-x-hidden" ref={parallaxRef}>
      <section className="parallax__header relative h-screen w-full overflow-hidden flex items-center justify-center">
        <div className="parallax__visuals absolute inset-0 w-full h-full">
          <div className="parallax__black-line-overflow absolute inset-0 bg-black/30 z-10 pointer-events-none" />

          <div data-parallax-layers className="parallax__layers absolute inset-0 w-full h-full">
            <img
              src={bgImage}
              loading="eager"
              width="1600"
              height="900"
              data-parallax-layer="1"
              alt="Golden India Backdrop"
              className="parallax__layer-img absolute inset-0 w-full h-[120%] object-cover brightness-[0.65] contrast-[1.1]"
            />

            <img
              src={midImage}
              loading="eager"
              width="1600"
              height="900"
              data-parallax-layer="2"
              alt="Rajasthan Fort Silhouette"
              className="parallax__layer-img absolute inset-0 w-full h-[115%] object-cover mix-blend-screen opacity-75 brightness-90"
            />

            <div data-parallax-layer="3" className="parallax__layer-title absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 pointer-events-auto">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#FF9933]/15 border border-[#FF9933]/40 backdrop-blur-md text-amber-300 font-semibold text-sm tracking-wide uppercase">
                  <Sparkles size={16} className="text-[#FF9933]" />
                  <span>{tagline}</span>
                </div>

                <h1 className="parallax__title text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight font-serif text-white drop-shadow-2xl">
                  {title.includes("Soul of India") ? (
                    <>
                      Discover the <span className="bg-gradient-to-r from-[#FF9933] via-amber-300 to-[#FF6B35] bg-clip-text text-transparent">Soul of India</span>
                    </>
                  ) : (
                    title
                  )}
                </h1>

                <p className="text-base sm:text-lg md:text-xl text-amber-100/90 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-md">
                  {subtitle}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                  <a
                    href="#packages"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#FF9933] to-[#E85A28] text-white font-bold shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    <Compass className="w-5 h-5" />
                    <span>Explore Packages</span>
                  </a>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-amber-300/30 text-amber-200 font-semibold shadow-lg hover:scale-105 transition-all duration-300"
                  >
                    <PhoneCall className="w-5 h-5 text-[#FF9933]" />
                    <span>Contact Travel Expert</span>
                  </a>
                </div>
              </div>
            </div>

            <img
              src={foreImage}
              loading="eager"
              width="1600"
              height="900"
              data-parallax-layer="4"
              alt="Foreground Archway"
              className="parallax__layer-img absolute inset-0 w-full h-[110%] object-cover mix-blend-overlay opacity-50"
            />
          </div>

          <div className="parallax__fade absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-[#121222] via-[#121222]/80 to-transparent z-30 pointer-events-none" />
        </div>
      </section>

      <section className="parallax__content relative z-30 bg-[#121222] text-white min-h-screen py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-20">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 160 160" fill="none" className="text-[#FF9933]">
              <path d="M94.8284 53.8578C92.3086 56.3776 88 54.593 88 51.0294V0H72V59.9999C72 66.6273 66.6274 71.9999 60 71.9999H0V87.9999H51.0294C54.5931 87.9999 56.3777 92.3085 53.8579 94.8283L18.3431 130.343L29.6569 141.657L65.1717 106.142C67.684 103.63 71.9745 105.396 72 108.939V160L88.0001 160L88 99.9999C88 93.3725 93.3726 87.9999 100 87.9999H160V71.9999H108.939C105.407 71.9745 103.64 67.7091 106.12 65.1938L106.142 65.1716L141.657 29.6568L130.343 18.3432L94.8284 53.8578Z" fill="currentColor"></path>
            </svg>
            <span className="text-[#FF9933] uppercase text-xs tracking-widest font-bold">Jeevo Signature Experiences</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-serif">
              Why Travel With <span className="text-[#FF9933]">Jeevo Tours</span>?
            </h2>
            <p className="text-gray-300 max-w-2xl text-center text-sm sm:text-base">
              We blend authentic local heritage with 5-star comfort, tailored itineraries, and expert local guides across India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-[#FF9933]/50 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-xl bg-[#FF9933]/15 flex items-center justify-center text-[#FF9933] mb-6">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">5-Star Rated Luxury</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Hand-picked heritage palaces, luxury houseboats, and premier boutique hotels tailored for unmatched comfort.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-[#FF9933]/50 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-xl bg-[#FF9933]/15 flex items-center justify-center text-[#FF9933] mb-6">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">24/7 Dedicated Concierge</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Seamless end-to-end assistance from your personal travel planner from arrival to departure.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-[#FF9933]/50 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-xl bg-[#FF9933]/15 flex items-center justify-center text-[#FF9933] mb-6">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Authentic Local Culture</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Exclusive culinary walks, spiritual VIP darshans, and cultural folklore performances.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ParallaxComponent;
