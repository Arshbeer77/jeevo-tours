"use client";

import React, { useState, useEffect } from "react";
import {
  Landmark,
  Palmtree,
  Castle,
  Ship,
  Sparkles,
  Globe,
  ArrowRight,
} from "lucide-react";

interface TourOption {
  title: string;
  description: string;
  image: string;
  icon: React.ReactNode;
  link: string;
  tag: string;
}

const InteractiveSelector = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animatedOptions, setAnimatedOptions] = useState<number[]>([]);

  const options: TourOption[] = [
    {
      title: "Golden Triangle",
      description: "Delhi → Agra → Jaipur · 7 Days",
      image:
        "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80",
      icon: <Landmark size={24} className="text-white" />,
      link: "tours/golden-triangle.html",
      tag: "Best Seller",
    },
    {
      title: "Kerala Paradise",
      description: "Kochi → Munnar → Alleppey · 10 Days",
      image:
        "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80",
      icon: <Palmtree size={24} className="text-white" />,
      link: "tours/kerala-paradise.html",
      tag: "Most Popular",
    },
    {
      title: "Royal Rajasthan",
      description: "Jaipur → Jodhpur → Udaipur · 12 Days",
      image:
        "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&q=80",
      icon: <Castle size={24} className="text-white" />,
      link: "tours/royal-rajasthan.html",
      tag: "Luxury",
    },
    {
      title: "Vietnam Discovery",
      description: "Hanoi → Ha Long Bay → Saigon · 10 Days",
      image:
        "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80",
      icon: <Ship size={24} className="text-white" />,
      link: "tours/vietnam-discovery.html",
      tag: "International",
    },
    {
      title: "Spiritual India",
      description: "Varanasi → Rishikesh → Haridwar · 9 Days",
      image:
        "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&q=80",
      icon: <Sparkles size={24} className="text-white" />,
      link: "tours/spiritual-india.html",
      tag: "Spiritual",
    },
    {
      title: "Delhi & Kathmandu",
      description: "Delhi → Kathmandu → Bhaktapur · 7 Days",
      image:
        "https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=800&q=80",
      icon: <Globe size={24} className="text-white" />,
      link: "tours/delhi-kathmandu.html",
      tag: "Adventure",
    },
  ];

  const handleOptionClick = (index: number) => {
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    options.forEach((_, i) => {
      const timer = setTimeout(() => {
        setAnimatedOptions((prev) => [...prev, i]);
      }, 180 * i);
      timers.push(timer);
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-screen bg-[#1a1a2e] font-sans text-white py-12 px-4">
      {/* Background Decorative Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF9933]/15 via-[#1a1a2e]/60 to-[#1a1a2e] pointer-events-none" />

      {/* Header Section */}
      <div className="w-full max-w-3xl px-6 mt-4 mb-2 text-center relative z-10">
        <span className="inline-block px-4 py-1.5 mb-3 text-xs md:text-sm font-semibold tracking-wider text-[#FF9933] uppercase bg-[#FF9933]/10 border border-[#FF9933]/30 rounded-full">
          Featured Expeditions
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight drop-shadow-lg animate-fade-in-top [animation-delay:0.3s]">
          Handcrafted <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9933] via-[#FF6B35] to-[#F26419]">Journeys</span>
        </h1>
        <p className="text-base md:text-lg text-gray-300 font-medium max-w-xl mx-auto animate-fade-in-top [animation-delay:0.6s]">
          Explore Jeevo Tours&apos; signature itineraries across India & Beyond in a luxury interactive view.
        </p>
      </div>

      <div className="h-8" />

      {/* Options Container */}
      <div className="flex w-full max-w-[1000px] min-w-0 md:min-w-[650px] h-[440px] mx-0 items-stretch overflow-hidden relative z-10 rounded-2xl p-1 bg-[#161625] border border-[#FF9933]/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        {options.map((option, index) => (
          <div
            key={index}
            className="relative flex flex-col justify-end overflow-hidden transition-all duration-700 ease-in-out cursor-pointer rounded-xl"
            style={{
              backgroundImage: `url('${option.image}')`,
              backgroundSize:
                activeIndex === index ? "cover" : "cover",
              backgroundPosition: "center",
              backfaceVisibility: "hidden",
              opacity: animatedOptions.includes(index) ? 1 : 0,
              transform: animatedOptions.includes(index)
                ? "translateX(0)"
                : "translateX(-60px)",
              minWidth: "60px",
              minHeight: "100px",
              margin: "2px",
              borderWidth: "2px",
              borderStyle: "solid",
              borderColor: activeIndex === index ? "#FF9933" : "rgba(255, 255, 255, 0.08)",
              backgroundColor: "#181824",
              boxShadow:
                activeIndex === index
                  ? "0 0 30px rgba(255, 153, 51, 0.4), inset 0 0 20px rgba(0,0,0,0.5)"
                  : "0 10px 25px rgba(0,0,0,0.4)",
              flex: activeIndex === index ? "7 1 0%" : "1 1 0%",
              zIndex: activeIndex === index ? 10 : 1,
              willChange:
                "flex-grow, box-shadow, background-size, background-position",
            }}
            onClick={() => handleOptionClick(index)}
          >
            {/* Dark gradient overlay */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-700 ease-in-out"
              style={{
                background:
                  activeIndex === index
                    ? "linear-gradient(to top, rgba(26,26,46,0.95) 0%, rgba(26,26,46,0.4) 40%, rgba(0,0,0,0.15) 100%)"
                    : "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 100%)",
              }}
            />

            {/* Saffron tag badge for active option */}
            {activeIndex === index && (
              <div className="absolute top-4 left-4 z-10 animate-fade-in-top">
                <span className="px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-[#FF9933] to-[#FF6B35] rounded-full shadow-md uppercase tracking-wider">
                  {option.tag}
                </span>
              </div>
            )}

            {/* Label with icon and info */}
            <div className="absolute left-0 right-0 bottom-4 flex items-center justify-between h-14 z-[2] px-4 gap-3 w-full">
              <div className="flex items-center gap-3 overflow-hidden">
                <div
                  className="min-w-[46px] max-w-[46px] h-[46px] flex items-center justify-center rounded-full shadow-[0_4px_12px_rgba(255,153,51,0.3)] shrink-0 grow-0 transition-all duration-300"
                  style={{
                    background: activeIndex === index
                      ? "linear-gradient(135deg, #FF9933 0%, #FF6B35 100%)"
                      : "rgba(30, 30, 48, 0.85)",
                    border: activeIndex === index ? "2px solid #FFB366" : "1.5px solid rgba(255, 153, 51, 0.4)"
                  }}
                >
                  {option.icon}
                </div>

                <div className="text-white whitespace-nowrap relative overflow-hidden">
                  <div
                    className="font-bold text-lg md:text-xl text-white transition-all duration-700 ease-in-out"
                    style={{
                      opacity: activeIndex === index ? 1 : 0,
                      transform:
                        activeIndex === index
                          ? "translateX(0)"
                          : "translateX(25px)",
                    }}
                  >
                    {option.title}
                  </div>
                  <div
                    className="text-xs md:text-sm text-[#FFB366] font-medium transition-all duration-700 ease-in-out flex items-center gap-1"
                    style={{
                      opacity: activeIndex === index ? 1 : 0,
                      transform:
                        activeIndex === index
                          ? "translateX(0)"
                          : "translateX(25px)",
                    }}
                  >
                    {option.description}
                  </div>
                </div>
              </div>

              {/* Action Button on Active Card */}
              {activeIndex === index && (
                <a
                  href={option.link}
                  onClick={(e) => e.stopPropagation()}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold text-white bg-gradient-to-r from-[#FF9933] to-[#E85A28] hover:from-[#E85A28] hover:to-[#FF9933] rounded-lg shadow-lg hover:shadow-orange-500/30 transition-all duration-300 pointer-events-auto shrink-0"
                >
                  Explore <ArrowRight size={16} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InteractiveSelector;
