'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  length: number;
  angle: number;
  rotationSpeed: number;
  color: string;
  opacity: number;
  type: 'chrono-pill' | 'chrono-dot' | 'dust-dot';
  orbitAngle?: number;
  orbitRadiusX?: number;
  orbitRadiusY?: number;
  orbitSpeed?: number;
  orbitCenterX?: number;
  orbitCenterY?: number;
  baseX: number;
  baseY: number;
}

export function ParticleField() {
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

    // Schedula Palette (Electric Blue, Cobalt, Cyan, Indigo, Violet, Warm Gold time blocks)
    const chronoColorsLight = [
      '#2563EB', // Royal Blue
      '#3B82F6', // Cobalt
      '#60A5FA', // Sky Blue
      '#06B6D4', // Cyan
      '#0EA5E9', // Ocean
      '#6366F1', // Indigo
      '#8B5CF6', // Purple
      '#10B981', // Emerald
      '#F59E0B', // Amber
      '#EC4899', // Pink
      '#475569', // Slate
    ];

    const chronoColorsDark = [
      '#3B82F6',
      '#60A5FA',
      '#93C5FD',
      '#06B6D4',
      '#38BDF8',
      '#818CF8',
      '#A78BFA',
      '#34D399',
      '#FBBF24',
      '#F472B6',
      '#94A3B8',
    ];

    // Dust stipple colors
    const dustColorsLight = [
      'rgba(30, 41, 59, 0.45)',
      'rgba(71, 85, 105, 0.35)',
      'rgba(100, 116, 139, 0.25)',
      'rgba(15, 23, 42, 0.55)',
    ];

    const dustColorsDark = [
      'rgba(241, 245, 249, 0.40)',
      'rgba(203, 213, 225, 0.30)',
      'rgba(148, 163, 184, 0.25)',
      'rgba(255, 255, 255, 0.50)',
    ];

    const currentColors = isDark ? chronoColorsDark : chronoColorsLight;
    const currentDust = isDark ? dustColorsDark : dustColorsLight;

    let particles: Particle[] = [];

    const initParticles = () => {
      particles = [];
      const isMobile = width < 768;

      // 1. Orbital Schedule Stream (Upper right quadrant)
      const streamCount = isMobile ? 140 : 280;
      const streamCenterX = width * (isMobile ? 0.88 : 0.84);
      const streamCenterY = height * 0.40;

      for (let i = 0; i < streamCount; i++) {
        const orbitAngle = Math.random() * Math.PI * 1.65 - Math.PI * 0.85;
        const radiusX = Math.random() * (width * 0.40) + (width * 0.07);
        const radiusY = radiusX * (0.62 + Math.random() * 0.28);
        const isPill = Math.random() > 0.4;
        const color = currentColors[Math.floor(Math.random() * currentColors.length)];

        const x = streamCenterX + Math.cos(orbitAngle) * radiusX;
        const y = streamCenterY + Math.sin(orbitAngle) * radiusY;

        const speed = (0.22 + Math.random() * 0.48) * (1 + (1 - radiusX / (width * 0.5)));
        const tangAngle = orbitAngle + Math.PI / 2;

        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: Math.cos(tangAngle) * speed * 0.35,
          vy: Math.sin(tangAngle) * speed * 0.35,
          size: isPill ? Math.random() * 2.2 + 2.0 : Math.random() * 3.0 + 2.0,
          length: isPill ? Math.random() * 8 + 5 : 0,
          angle: tangAngle + (Math.random() - 0.5) * 0.5,
          rotationSpeed: (Math.random() - 0.5) * 0.025,
          color,
          opacity: Math.random() * 0.45 + (isDark ? 0.45 : 0.55),
          type: isPill ? 'chrono-pill' : 'chrono-dot',
          orbitAngle,
          orbitRadiusX: radiusX,
          orbitRadiusY: radiusY,
          orbitSpeed: speed * 0.0016,
          orbitCenterX: streamCenterX,
          orbitCenterY: streamCenterY,
        });
      }

      // 2. Ambient Micro-Schedule Dust Specks across the canvas
      const dustCount = isMobile ? 90 : 200;
      for (let i = 0; i < dustCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const dustSize = Math.random() * 1.8 + 0.8;

        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.2,
          vy: -Math.random() * 0.25 - 0.04,
          size: dustSize,
          length: 0,
          angle: 0,
          rotationSpeed: 0,
          color: currentDust[Math.floor(Math.random() * currentDust.length)],
          opacity: Math.random() * 0.45 + 0.2,
          type: 'dust-dot',
        });
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      initParticles();
    };

    handleResize();

    // Mouse Interaction
    let mouseX = -1000;
    let mouseY = -1000;
    let targetMouseX = -1000;
    let targetMouseY = -1000;
    let mouseActive = false;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
      mouseActive = true;
    };

    const handleMouseLeave = () => {
      mouseActive = false;
      targetMouseX = -1000;
      targetMouseY = -1000;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (mouseActive) {
        mouseX += (targetMouseX - mouseX) * 0.15;
        mouseY += (targetMouseY - mouseY) * 0.15;
      } else {
        mouseX = -1000;
        mouseY = -1000;
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (p.type === 'dust-dot') {
          p.x += p.vx + Math.sin(p.y * 0.01) * 0.08;
          p.y += p.vy;

          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;

          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const dist = Math.hypot(dx, dy);
          if (dist < 120 && dist > 0) {
            const force = (1 - dist / 120) * 1.5;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        } else {
          if (p.orbitAngle !== undefined && p.orbitRadiusX !== undefined && p.orbitRadiusY !== undefined && p.orbitSpeed !== undefined && p.orbitCenterX !== undefined && p.orbitCenterY !== undefined) {
            p.orbitAngle += p.orbitSpeed;
            p.angle += p.rotationSpeed;

            const targetX = p.orbitCenterX + Math.cos(p.orbitAngle) * p.orbitRadiusX;
            const targetY = p.orbitCenterY + Math.sin(p.orbitAngle) * p.orbitRadiusY;

            const noiseX = Math.cos(p.orbitAngle * 3 + i) * 5;
            const noiseY = Math.sin(p.orbitAngle * 2 + i) * 5;

            p.baseX = targetX + noiseX;
            p.baseY = targetY + noiseY;

            const dx = p.x - mouseX;
            const dy = p.y - mouseY;
            const dist = Math.hypot(dx, dy);

            if (dist < 140 && dist > 0) {
              const force = (1 - dist / 140) * 22;
              p.vx += (dx / dist) * force * 0.1;
              p.vy += (dy / dist) * force * 0.1;
            }

            p.vx += (p.baseX - p.x) * 0.04;
            p.vy += (p.baseY - p.y) * 0.04;

            p.vx *= 0.88;
            p.vy *= 0.88;

            p.x += p.vx;
            p.y += p.vy;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.globalAlpha = p.opacity;

            if (p.type === 'chrono-pill') {
              ctx.lineWidth = p.size;
              ctx.lineCap = 'round';
              ctx.strokeStyle = p.color;
              ctx.beginPath();
              ctx.moveTo(-p.length / 2, 0);
              ctx.lineTo(p.length / 2, 0);
              ctx.stroke();
            } else {
              ctx.fillStyle = p.color;
              ctx.beginPath();
              ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.restore();
          }
        }
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
