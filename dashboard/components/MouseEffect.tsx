"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function MouseEffect() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Check if hovering over clickable elements
      const target = e.target as HTMLElement;
      const isClickable = window.getComputedStyle(target).cursor === "pointer" || 
                          target.tagName.toLowerCase() === "button" || 
                          target.tagName.toLowerCase() === "a";
      setIsHovering(isClickable);
    };

    window.addEventListener("mousemove", updateMousePosition);

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
    };
  }, []);

  return (
    <>
      {/* Background Interactive Glow Spotlight */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(99, 102, 241, 0.08), transparent 40%)`,
        }}
      />
      
    </>
  );
}
