'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';

export function FluidRibbonBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme, mounted } = useTheme();
  const isDark = mounted ? theme === 'dark' : false;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let time = 0;

    // Mouse Tracking for natural fluid response
    let mouseX = -1000;
    let mouseY = -1000;
    let targetMouseX = -1000;
    let targetMouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      targetMouseX = -1000;
      targetMouseY = -1000;
    };

    const handleResize = () => {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    // Multi-layer Ribbon Ribs Definition
    interface RibbonLayer {
      baseY: number; // normalized 0..1
      amplitude: number;
      speed: number;
      wavelength: number;
      twistSpeed: number;
      thickness: number;
      phase: number;
      depth: number;
      colorType: 'emerald' | 'amber' | 'chrome' | 'obsidian' | 'cyan';
    }

    const ribbons: RibbonLayer[] = [
      // Major upper curving ribbon (Dark Emerald / Chrome)
      {
        baseY: 0.28,
        amplitude: 65,
        speed: 0.007,
        wavelength: 0.0028,
        twistSpeed: 0.009,
        thickness: 54,
        phase: 0,
        depth: 0.9,
        colorType: 'emerald',
      },
      // Central looping titanium wave
      {
        baseY: 0.46,
        amplitude: 85,
        speed: 0.005,
        wavelength: 0.0022,
        twistSpeed: 0.007,
        thickness: 78,
        phase: Math.PI * 0.4,
        depth: 1.0,
        colorType: 'chrome',
      },
      // Lower sweeping amber / copper highlight fold
      {
        baseY: 0.68,
        amplitude: 55,
        speed: 0.006,
        wavelength: 0.0032,
        twistSpeed: 0.008,
        thickness: 44,
        phase: Math.PI * 0.9,
        depth: 0.75,
        colorType: 'amber',
      },
      // Deep secondary cyan / obsidian back-wave
      {
        baseY: 0.38,
        amplitude: 45,
        speed: 0.004,
        wavelength: 0.0035,
        twistSpeed: 0.005,
        thickness: 36,
        phase: Math.PI * 1.4,
        depth: 0.6,
        colorType: 'cyan',
      },
      // Subtle bottom crest
      {
        baseY: 0.82,
        amplitude: 38,
        speed: 0.008,
        wavelength: 0.004,
        twistSpeed: 0.01,
        thickness: 28,
        phase: Math.PI * 0.2,
        depth: 0.5,
        colorType: 'obsidian',
      },
    ];

    const render = () => {
      time += 1;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      if (targetMouseX > 0 && targetMouseY > 0) {
        mouseX += (targetMouseX - mouseX) * 0.08;
        mouseY += (targetMouseY - mouseY) * 0.08;
      } else {
        mouseX = width * 0.5;
        mouseY = height * 0.5;
      }

      // Draw subtle ambient glow spots (as seen in video)
      if (isDark) {
        // Dark mode: Amber core glow & Emerald upper diffuse glow
        const glowAmber = ctx.createRadialGradient(
          width * 0.58,
          height * 0.72,
          10,
          width * 0.58,
          height * 0.72,
          width * 0.45
        );
        glowAmber.addColorStop(0, 'rgba(234, 88, 12, 0.14)');
        glowAmber.addColorStop(0.5, 'rgba(180, 83, 9, 0.05)');
        glowAmber.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowAmber;
        ctx.fillRect(0, 0, width, height);

        const glowEmerald = ctx.createRadialGradient(
          width * 0.78,
          height * 0.32,
          10,
          width * 0.78,
          height * 0.32,
          width * 0.4
        );
        glowEmerald.addColorStop(0, 'rgba(16, 185, 129, 0.12)');
        glowEmerald.addColorStop(0.6, 'rgba(6, 182, 212, 0.04)');
        glowEmerald.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowEmerald;
        ctx.fillRect(0, 0, width, height);
      } else {
        // Light mode: Clean bright background with soft luminous silver/sky ambient sheen
        const glowLight = ctx.createRadialGradient(
          width * 0.5,
          height * 0.4,
          20,
          width * 0.5,
          height * 0.4,
          width * 0.6
        );
        glowLight.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        glowLight.addColorStop(0.5, 'rgba(248, 250, 252, 0.4)');
        glowLight.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glowLight;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw Ribbon Waves
      const step = Math.max(4, Math.floor(width / 180));

      ribbons.forEach((ribbon) => {
        const centerY = ribbon.baseY * height;
        const ptsTop: { x: number; y: number }[] = [];
        const ptsBottom: { x: number; y: number }[] = [];
        const ptsCenter: { x: number; y: number; normalY: number; spec: number }[] = [];

        for (let x = -20; x <= width + 20; x += step) {
          // Complex organic wave formula combining multi-frequency sine modulations
          const mouseDistX = (x - mouseX) / width;
          const mouseEffect = Math.exp(-mouseDistX * mouseDistX * 6) * (mouseY - centerY) * 0.15;

          const wave1 = Math.sin(x * ribbon.wavelength + time * ribbon.speed + ribbon.phase);
          const wave2 = Math.cos(x * ribbon.wavelength * 1.8 - time * ribbon.speed * 0.7 + ribbon.phase);
          const wave3 = Math.sin(x * 0.001 + time * 0.003) * 20;

          const y = centerY + (wave1 * ribbon.amplitude + wave2 * (ribbon.amplitude * 0.4) + wave3) + mouseEffect;

          // Twisting 3D ribbon profile (thickness varies along curve to create 3D ribbon twists)
          const twist = Math.sin(x * ribbon.wavelength * 1.2 + time * ribbon.twistSpeed + ribbon.phase);
          const currentThick = ribbon.thickness * (0.35 + 0.65 * Math.abs(twist));

          // Normal direction approximation for specular highlight
          const slope =
            Math.cos(x * ribbon.wavelength + time * ribbon.speed + ribbon.phase) * ribbon.amplitude * ribbon.wavelength;
          const spec = Math.max(0, Math.sin(x * 0.004 + time * 0.015 - slope * 2));

          const halfThick = currentThick * 0.5;
          ptsTop.push({ x, y: y - halfThick });
          ptsBottom.push({ x, y: y + halfThick });
          ptsCenter.push({ x, y, normalY: slope, spec });
        }

        if (ptsTop.length < 2) return;

        // 1. Draw Ribbon Body
        ctx.beginPath();
        ctx.moveTo(ptsTop[0].x, ptsTop[0].y);
        for (let i = 1; i < ptsTop.length; i++) {
          ctx.lineTo(ptsTop[i].x, ptsTop[i].y);
        }
        for (let i = ptsBottom.length - 1; i >= 0; i--) {
          ctx.lineTo(ptsBottom[i].x, ptsBottom[i].y);
        }
        ctx.closePath();

        // Create Dynamic Gradient Mesh for Ribbon
        const grad = ctx.createLinearGradient(0, centerY - ribbon.amplitude, width, centerY + ribbon.amplitude);

        if (isDark) {
          // Dark Mode: Deep metallic obsidian with Emerald / Amber / Chrome iridescence
          switch (ribbon.colorType) {
            case 'emerald':
              grad.addColorStop(0, 'rgba(8, 20, 18, 0.7)');
              grad.addColorStop(0.3, 'rgba(16, 68, 52, 0.85)');
              grad.addColorStop(0.55, 'rgba(5, 150, 105, 0.75)');
              grad.addColorStop(0.8, 'rgba(6, 78, 59, 0.6)');
              grad.addColorStop(1, 'rgba(4, 12, 10, 0.4)');
              break;
            case 'amber':
              grad.addColorStop(0, 'rgba(30, 15, 6, 0.6)');
              grad.addColorStop(0.35, 'rgba(180, 83, 9, 0.8)');
              grad.addColorStop(0.65, 'rgba(245, 158, 11, 0.7)');
              grad.addColorStop(1, 'rgba(15, 8, 4, 0.5)');
              break;
            case 'cyan':
              grad.addColorStop(0, 'rgba(6, 24, 38, 0.6)');
              grad.addColorStop(0.4, 'rgba(14, 116, 144, 0.75)');
              grad.addColorStop(0.7, 'rgba(6, 182, 212, 0.65)');
              grad.addColorStop(1, 'rgba(4, 15, 25, 0.4)');
              break;
            case 'chrome':
            default:
              grad.addColorStop(0, 'rgba(18, 18, 24, 0.75)');
              grad.addColorStop(0.3, 'rgba(55, 65, 81, 0.9)');
              grad.addColorStop(0.5, 'rgba(156, 163, 175, 0.85)');
              grad.addColorStop(0.75, 'rgba(31, 41, 55, 0.8)');
              grad.addColorStop(1, 'rgba(15, 15, 20, 0.5)');
              break;
          }
        } else {
          // Light Mode: Pure White background with liquid platinum / silver metallic sheen
          switch (ribbon.colorType) {
            case 'emerald':
              grad.addColorStop(0, 'rgba(230, 238, 235, 0.85)');
              grad.addColorStop(0.4, 'rgba(180, 215, 205, 0.75)');
              grad.addColorStop(0.7, 'rgba(210, 235, 228, 0.65)');
              grad.addColorStop(1, 'rgba(245, 250, 248, 0.4)');
              break;
            case 'amber':
              grad.addColorStop(0, 'rgba(245, 235, 225, 0.8)');
              grad.addColorStop(0.4, 'rgba(235, 205, 175, 0.75)');
              grad.addColorStop(0.7, 'rgba(250, 225, 200, 0.65)');
              grad.addColorStop(1, 'rgba(255, 248, 242, 0.4)');
              break;
            case 'cyan':
              grad.addColorStop(0, 'rgba(225, 238, 248, 0.8)');
              grad.addColorStop(0.4, 'rgba(185, 215, 240, 0.75)');
              grad.addColorStop(0.7, 'rgba(215, 235, 250, 0.65)');
              grad.addColorStop(1, 'rgba(245, 250, 255, 0.4)');
              break;
            case 'chrome':
            default:
              grad.addColorStop(0, 'rgba(225, 228, 235, 0.9)');
              grad.addColorStop(0.35, 'rgba(195, 202, 214, 0.85)');
              grad.addColorStop(0.55, 'rgba(160, 170, 188, 0.75)');
              grad.addColorStop(0.8, 'rgba(215, 220, 230, 0.85)');
              grad.addColorStop(1, 'rgba(240, 243, 248, 0.5)');
              break;
          }
        }

        ctx.fillStyle = grad;
        ctx.fill();

        // 2. Draw 3D Specular Highlight Ridge along the top/edge of the ribbon
        ctx.beginPath();
        ctx.moveTo(ptsTop[0].x, ptsTop[0].y);
        for (let i = 1; i < ptsTop.length; i++) {
          ctx.lineTo(ptsTop[i].x, ptsTop[i].y);
        }
        ctx.lineWidth = isDark ? 1.8 : 1.4;
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.55)' : 'rgba(255, 255, 255, 0.95)';
        ctx.stroke();

        // 3. Draw Inner Liquid Chromatic Glint along Center Spline
        ctx.beginPath();
        ctx.moveTo(ptsCenter[0].x, ptsCenter[0].y);
        for (let i = 1; i < ptsCenter.length; i++) {
          ctx.lineTo(ptsCenter[i].x, ptsCenter[i].y);
        }
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(180, 190, 205, 0.4)';
        ctx.stroke();

        // 4. Draw Traveling Specular Flare Beads (Mimicking moving iridescent light reflections in video)
        for (let i = 0; i < ptsCenter.length; i += 8) {
          const pt = ptsCenter[i];
          if (pt.spec > 0.8) {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, (pt.spec - 0.8) * 12, 0, Math.PI * 2);
            ctx.fillStyle = isDark
              ? `rgba(255, 255, 255, ${(pt.spec - 0.8) * 2.5})`
              : `rgba(255, 255, 255, ${(pt.spec - 0.8) * 3.5})`;
            ctx.fill();
          }
        }
      });

      // Subtle Floating Stardust Elements (Floating in foreground of the ribbons)
      const stardustCount = 35;
      for (let i = 0; i < stardustCount; i++) {
        const sx = (Math.sin(time * 0.002 + i * 1.7) * 0.5 + 0.5) * width;
        const sy = (Math.cos(time * 0.0015 + i * 2.3) * 0.5 + 0.5) * height;
        const sz = (Math.sin(time * 0.005 + i) * 0.5 + 0.5) * 1.6 + 0.6;
        const op = (Math.sin(time * 0.004 + i * 3) * 0.5 + 0.5) * (isDark ? 0.45 : 0.25);

        ctx.beginPath();
        ctx.arc(sx, sy, sz, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${op})` : `rgba(70, 80, 100, ${op})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 w-full h-full"
      style={{ display: 'block' }}
      aria-hidden="true"
    />
  );
}
