'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion, TargetAndTransition } from 'motion/react';

interface HeroBackgroundProps {
  isDark?: boolean;
  subdued?: boolean;
}

export function HeroBackground({ isDark = false, subdued = false }: HeroBackgroundProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse parallax motion values
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);

  // Smooth springs for gentle mouse parallax
  const springConfig = { damping: 30, stiffness: 60 };
  const mouseX = useSpring(rawMouseX, springConfig);
  const mouseY = useSpring(rawMouseY, springConfig);

  useEffect(() => {
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (shouldReduceMotion || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const offsetX = (e.clientX - centerX) / (rect.width / 2);
        const offsetY = (e.clientY - centerY) / (rect.height / 2);

        // Gentle parallax movement max 12px
        rawMouseX.set(offsetX * 12);
        rawMouseY.set(offsetY * 12);
      } else {
        rawMouseX.set(0);
        rawMouseY.set(0);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [rawMouseX, rawMouseY, shouldReduceMotion]);

  if (!mounted) {
    return (
      <div className="absolute inset-0 bg-[#070913] dark:bg-[#070913] pointer-events-none" />
    );
  }

  // Explicit TargetAndTransition definitions to ensure strict Motion type safety
  const floatOrb1: TargetAndTransition = shouldReduceMotion
    ? { y: 0, x: 0, scale: 1 }
    : {
        y: [0, -22, 12, -15, 0],
        x: [0, 18, -10, 12, 0],
        scale: [1, 1.04, 0.97, 1.02, 1],
        transition: {
          duration: 11,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      };

  const floatOrb2: TargetAndTransition = shouldReduceMotion
    ? { y: 0, x: 0, scale: 1 }
    : {
        y: [0, 24, -16, 18, 0],
        x: [0, -20, 14, -10, 0],
        scale: [1, 1.05, 0.96, 1.03, 1],
        transition: {
          duration: 9.5,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      };

  const floatOrb3: TargetAndTransition = shouldReduceMotion
    ? { y: 0, x: 0 }
    : {
        y: [0, -16, 14, -10, 0],
        x: [0, 12, -14, 8, 0],
        transition: {
          duration: 7.5,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      };

  const floatOrb4: TargetAndTransition = shouldReduceMotion
    ? { y: 0, x: 0, scale: 1 }
    : {
        y: [0, 18, -12, 15, 0],
        x: [0, -15, 12, -8, 0],
        scale: [1, 1.06, 0.95, 1.02, 1],
        transition: {
          duration: 8.5,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      };

  const floatOrb5: TargetAndTransition = shouldReduceMotion
    ? { y: 0, x: 0 }
    : {
        y: [0, -14, 10, -8, 0],
        x: [0, -12, 10, -6, 0],
        transition: {
          duration: 10.5,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      };

  // Glass panel micro float
  const floatGlassCard: TargetAndTransition = shouldReduceMotion
    ? { y: 0 }
    : {
        y: [0, -8, 4, -5, 0],
        transition: {
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      };

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`${subdued ? 'fixed' : 'absolute'} inset-0 overflow-hidden pointer-events-none select-none z-0`}
    >
      {/* ----------------------------------------------------------------------- */}
      {/* 1. BASE BACKGROUND CANVASES (THEME ADAPTIVE)                            */}
      {/* ----------------------------------------------------------------------- */}
      <div
        className={`absolute inset-0 transition-colors duration-700 ${
          isDark
            ? 'bg-[#060812]'
            : 'bg-gradient-to-b from-[#F4F7FC] via-[#EDF3FA] to-[#E2E8F4]'
        }`}
      />

      {/* Subtle Radial Gradient Canvas Tint */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isDark
            ? 'bg-[radial-gradient(circle_at_50%_30%,_#0e172e_0%,_transparent_70%)] opacity-80'
            : 'bg-[radial-gradient(circle_at_50%_30%,_#ffffff_0%,_transparent_75%)] opacity-90'
        }`}
      />

      {/* ----------------------------------------------------------------------- */}
      {/* 2. PARALLAX CONTAINER FOR FLOATING 3D GLASSMOPHISMS SPHERES & ORBS      */}
      {/* ----------------------------------------------------------------------- */}
      <motion.div
        style={{ x: mouseX, y: mouseY }}
        className="absolute inset-0 w-full h-full"
      >
        {/* SVG Noise Filter Definition for Authentic Frosted Glass Texture */}
        <svg className="hidden">
          <defs>
            <filter id="glass-grain-noise">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.7"
                numOctaves="3"
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
          </defs>
        </svg>

        {/* ==================================================================== */}
        {/* SPHERE 1: TOP-RIGHT GIANT LIGHT-BLUE GLOWING ORB                      */}
        {/* ==================================================================== */}
        <motion.div
          animate={floatOrb1}
          className={`absolute -top-12 -right-12 sm:top-[-4%] sm:right-[2%] w-[280px] sm:w-[420px] lg:w-[520px] h-[280px] sm:h-[420px] lg:h-[520px] rounded-full filter transition-all duration-700 ${
            subdued ? 'blur-[45px] sm:blur-[70px]' : 'blur-[1px] sm:blur-[2px]'
          }`}
          style={{
            background: isDark
              ? 'radial-gradient(circle at 35% 30%, #a5f3fc 0%, #38bdf8 32%, #0284c7 65%, #0369a1 95%)'
              : 'radial-gradient(circle at 35% 30%, #f0f9ff 0%, #bae6fd 35%, #38bdf8 70%, #0284c7 100%)',
            boxShadow: isDark
              ? '0 25px 60px rgba(56, 189, 248, 0.35), inset 0 2px 12px rgba(255, 255, 255, 0.4)'
              : '0 20px 50px rgba(56, 189, 248, 0.22), inset 0 2px 14px rgba(255, 255, 255, 0.7)',
            opacity: isDark ? (subdued ? 0.38 : 0.9) : (subdued ? 0.32 : 0.85),
          }}
        />

        {/* Ambient Specular Highlight Glow behind Sphere 1 */}
        <div
          className={`absolute top-0 right-0 w-[350px] sm:w-[550px] h-[350px] sm:h-[550px] rounded-full blur-[60px] sm:blur-[100px] pointer-events-none transition-all duration-700 ${
            isDark ? (subdued ? 'bg-cyan-500/15' : 'bg-cyan-500/25') : (subdued ? 'bg-sky-400/12' : 'bg-sky-400/20')
          }`}
        />

        {/* ==================================================================== */}
        {/* SPHERE 2: BOTTOM-LEFT LARGE DEEP VIVID BLUE ORB                      */}
        {/* ==================================================================== */}
        <motion.div
          animate={floatOrb2}
          className={`absolute -bottom-20 -left-16 sm:bottom-[-8%] sm:left-[-5%] w-[260px] sm:w-[400px] lg:w-[480px] h-[260px] sm:h-[400px] lg:h-[480px] rounded-full filter transition-all duration-700 ${
            subdued ? 'blur-[45px] sm:blur-[70px]' : 'blur-[1px] sm:blur-[2px]'
          }`}
          style={{
            background: isDark
              ? 'radial-gradient(circle at 32% 28%, #60a5fa 0%, #2563eb 40%, #1d4ed8 72%, #1e3a8a 100%)'
              : 'radial-gradient(circle at 32% 28%, #93c5fd 0%, #3b82f6 42%, #2563eb 75%, #1d4ed8 100%)',
            boxShadow: isDark
              ? '0 30px 70px rgba(37, 99, 235, 0.4), inset 0 2px 10px rgba(255, 255, 255, 0.35)'
              : '0 20px 50px rgba(37, 99, 235, 0.22), inset 0 2px 12px rgba(255, 255, 255, 0.65)',
            opacity: isDark ? (subdued ? 0.38 : 0.92) : (subdued ? 0.30 : 0.82),
          }}
        />

        {/* Ambient Specular Highlight Glow behind Sphere 2 */}
        <div
          className={`absolute bottom-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full blur-[70px] sm:blur-[110px] pointer-events-none transition-all duration-700 ${
            isDark ? (subdued ? 'bg-blue-600/18' : 'bg-blue-600/30') : (subdued ? 'bg-blue-400/14' : 'bg-blue-400/20')
          }`}
        />

        {/* ==================================================================== */}
        {/* SPHERE 3: LEFT-MIDDLE CRISP FLOATING 3D SPHERE                      */}
        {/* ==================================================================== */}
        <motion.div
          animate={floatOrb3}
          className={`absolute top-[28%] left-[2%] sm:left-[5%] lg:left-[8%] w-[64px] sm:w-[96px] lg:w-[120px] h-[64px] sm:h-[96px] lg:h-[120px] rounded-full filter transition-all duration-700 ${
            subdued ? 'blur-[25px] sm:blur-[40px]' : 'blur-[0.5px]'
          }`}
          style={{
            background: isDark
              ? 'radial-gradient(circle at 30% 25%, #e0f2fe 0%, #60a5fa 38%, #2563eb 78%, #1e40af 100%)'
              : 'radial-gradient(circle at 30% 25%, #ffffff 0%, #93c5fd 40%, #3b82f6 80%, #2563eb 100%)',
            boxShadow: isDark
              ? '0 12px 30px rgba(37, 99, 235, 0.35), inset 0 2px 6px rgba(255, 255, 255, 0.6)'
              : '0 10px 25px rgba(37, 99, 235, 0.2), inset 0 2px 8px rgba(255, 255, 255, 0.85)',
            opacity: isDark ? (subdued ? 0.40 : 0.95) : (subdued ? 0.35 : 0.9),
          }}
        />

        {/* ==================================================================== */}
        {/* SPHERE 4: BOTTOM-CENTER PEEKING BLUE ORB                             */}
        {/* ==================================================================== */}
        <motion.div
          animate={floatOrb4}
          className={`absolute bottom-[2%] left-[45%] sm:left-[48%] -translate-x-1/2 w-[140px] sm:w-[200px] lg:w-[260px] h-[140px] sm:h-[200px] lg:h-[260px] rounded-full filter transition-all duration-700 ${
            subdued ? 'blur-[35px] sm:blur-[55px]' : 'blur-[1px]'
          }`}
          style={{
            background: isDark
              ? 'radial-gradient(circle at 38% 30%, #93c5fd 0%, #3b82f6 45%, #1d4ed8 80%, #1e3a8a 100%)'
              : 'radial-gradient(circle at 38% 30%, #e0f2fe 0%, #60a5fa 45%, #2563eb 82%, #1e40af 100%)',
            boxShadow: isDark
              ? '0 18px 45px rgba(29, 78, 216, 0.35), inset 0 2px 8px rgba(255, 255, 255, 0.4)'
              : '0 14px 35px rgba(37, 99, 235, 0.18), inset 0 2px 10px rgba(255, 255, 255, 0.75)',
            opacity: isDark ? (subdued ? 0.35 : 0.88) : (subdued ? 0.28 : 0.8),
          }}
        />

        {/* ==================================================================== */}
        {/* SPHERE 5: TOP-LEFT BACKGROUND DEPTH ORB                             */}
        {/* ==================================================================== */}
        <motion.div
          animate={floatOrb5}
          className={`absolute top-[-5%] left-[22%] sm:left-[28%] w-[110px] sm:w-[160px] lg:w-[210px] h-[110px] sm:h-[160px] lg:h-[210px] rounded-full filter transition-all duration-700 ${
            subdued ? 'blur-[35px] sm:blur-[50px]' : 'blur-[1.5px]'
          }`}
          style={{
            background: isDark
              ? 'radial-gradient(circle at 35% 30%, #bfdbfe 0%, #60a5fa 42%, #2563eb 80%, #1e3a8a 100%)'
              : 'radial-gradient(circle at 35% 30%, #f0f9ff 0%, #93c5fd 42%, #3b82f6 80%, #1d4ed8 100%)',
            boxShadow: isDark
              ? '0 15px 35px rgba(59, 130, 246, 0.25), inset 0 2px 6px rgba(255, 255, 255, 0.35)'
              : '0 12px 28px rgba(59, 130, 246, 0.15), inset 0 2px 8px rgba(255, 255, 255, 0.65)',
            opacity: isDark ? (subdued ? 0.30 : 0.75) : (subdued ? 0.24 : 0.7),
          }}
        />

        {/* ==================================================================== */}
        {/* 3. CENTRAL FROSTED GLASSMOPRHISM PANEL (REFERENCED FROM IMAGE)      */}
        {/* ==================================================================== */}
        {!subdued && (
          <motion.div
            animate={floatGlassCard}
            className="absolute inset-x-3 sm:inset-x-8 lg:inset-x-16 top-16 sm:top-20 bottom-8 sm:bottom-12 rounded-[28px] sm:rounded-[40px] lg:rounded-[48px] overflow-hidden pointer-events-none transition-all duration-700"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.42) 0%, rgba(10, 15, 30, 0.28) 50%, rgba(15, 23, 42, 0.38) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.58) 0%, rgba(240, 246, 255, 0.38) 50%, rgba(255, 255, 255, 0.52) 100%)',
              backdropFilter: 'blur(28px) saturate(140%)',
              WebkitBackdropFilter: 'blur(28px) saturate(140%)',
              border: isDark
                ? '1px solid rgba(255, 255, 255, 0.14)'
                : '1px solid rgba(255, 255, 255, 0.75)',
              boxShadow: isDark
                ? '0 30px 80px -15px rgba(0, 0, 0, 0.65), inset 0 1px 1px rgba(255, 255, 255, 0.22), inset 0 -1px 1px rgba(0, 0, 0, 0.4)'
                : '0 25px 70px -15px rgba(37, 99, 235, 0.12), inset 0 1px 2px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(255, 255, 255, 0.4)',
            }}
          >
            {/* Top Specular Edge Highlight Gradient */}
            <div
              className={`absolute top-0 left-0 right-0 h-[1px] transition-opacity duration-700 ${
                isDark
                  ? 'bg-gradient-to-r from-transparent via-white/35 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-white/90 to-transparent'
              }`}
            />

            {/* Left Specular Edge Highlight Gradient */}
            <div
              className={`absolute top-0 bottom-0 left-0 w-[1px] transition-opacity duration-700 ${
                isDark
                  ? 'bg-gradient-to-b from-white/30 via-white/10 to-transparent'
                  : 'bg-gradient-to-b from-white/80 via-white/40 to-transparent'
              }`}
            />

            {/* Subtle Authentic Glass Texture Overlay */}
            <div
              className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none"
              style={{ filter: 'url(#glass-grain-noise)' }}
            />

            {/* Soft Radial Ambient Refraction Glint Inside Panel */}
            <div
              className={`absolute -top-1/2 left-1/4 w-[500px] h-[500px] rounded-full blur-[90px] transition-all duration-700 ${
                isDark ? 'bg-cyan-400/12' : 'bg-blue-300/20'
              }`}
            />
          </motion.div>
        )}
      </motion.div>

      {/* ----------------------------------------------------------------------- */}
      {/* 4. EDGE FADE MASKS TO ENSURE SEAMLESS CONTENT INTEGRATION                */}
      {/* ----------------------------------------------------------------------- */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Header Transition Fade */}
        <div
          className={`absolute top-0 left-0 right-0 h-24 sm:h-36 bg-gradient-to-b ${
            isDark
              ? 'from-[#060812] via-[#060812]/80 to-transparent'
              : 'from-[#F4F7FC] via-[#F4F7FC]/80 to-transparent'
          }`}
        />

        {/* Bottom Section Curve Transition Mask */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-24 sm:h-36 bg-gradient-to-t ${
            isDark
              ? 'from-[#04060E] via-[#04060E]/70 to-transparent'
              : 'from-[#E2E8F4] via-[#E2E8F4]/60 to-transparent'
          }`}
        />
      </div>
    </div>
  );
}
