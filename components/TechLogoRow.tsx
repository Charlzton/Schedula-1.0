'use client';

import React, { useEffect, useRef } from 'react';

interface TechLogoRowProps {
  isDark?: boolean;
}

export function TechLogoRow({ isDark = false }: TechLogoRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  const dragOffsetStartRef = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    isDraggingRef.current = true;
    setIsDragging(true);
    startXRef.current = e.clientX;
    
    const totalWidth = trackRef.current ? trackRef.current.scrollWidth : 0;
    const W = totalWidth / 4;
    if (W > 0) {
      scrollOffsetRef.current = (scrollOffsetRef.current % W + W) % W;
    }
    dragOffsetStartRef.current = scrollOffsetRef.current;
    
    containerRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    
    const deltaX = e.clientX - startXRef.current;
    scrollOffsetRef.current = dragOffsetStartRef.current - deltaX;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    
    const totalWidth = trackRef.current ? trackRef.current.scrollWidth : 0;
    const W = totalWidth / 4;
    if (W > 0) {
      scrollOffsetRef.current = (scrollOffsetRef.current % W + W) % W;
    }
    
    containerRef.current?.releasePointerCapture(e.pointerId);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    
    const totalWidth = trackRef.current ? trackRef.current.scrollWidth : 0;
    const W = totalWidth / 4;
    if (W > 0) {
      scrollOffsetRef.current = (scrollOffsetRef.current % W + W) % W;
    }
    
    containerRef.current?.releasePointerCapture(e.pointerId);
  };

  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = 0;

    const tick = (timestamp: number) => {
      if (!lastTimestamp) {
        lastTimestamp = timestamp;
      }
      const dt = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (!containerRef.current || !trackRef.current) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      const totalWidth = trackRef.current.scrollWidth;
      const W = totalWidth / 4;

      if (W > 0) {
        if (!isDraggingRef.current) {
          const speed = W / 38; // 38 seconds for a full loop of width W
          scrollOffsetRef.current += speed * dt;
          scrollOffsetRef.current = (scrollOffsetRef.current % W + W) % W;
        }

        const normalizedOffset = (scrollOffsetRef.current % W + W) % W;
        trackRef.current.style.transform = `translate3d(${- (W + normalizedOffset)}px, 0, 0)`;
      }

      // Center focus update
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      const focusRadius = Math.min(containerRect.width * 0.35, 95);

      const items = trackRef.current.querySelectorAll<HTMLDivElement>('.tech-logo-item');

      items.forEach((item) => {
        const itemRect = item.getBoundingClientRect();
        const itemCenter = itemRect.left + itemRect.width / 2;
        const distance = Math.abs(itemCenter - containerCenter);

        if (distance < focusRadius) {
          const normalized = distance / focusRadius;
          const factor = 0.5 * (1 + Math.cos(normalized * Math.PI));
          
          const scale = 1 + 0.22 * factor;
          const opacity = 0.75 + 0.25 * factor;

          item.style.transform = `scale(${scale})`;
          item.style.opacity = `${opacity}`;
          item.style.zIndex = factor > 0.5 ? '10' : '1';
        } else {
          item.style.transform = 'scale(1)';
          item.style.opacity = '0.75';
          item.style.zIndex = '1';
        }
      });

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  // Define the 9 authoritative SVGs
  const renderLogos = (keyPrefix: string) => [
    /* 1. FIREBASE */
    <div
      key={`${keyPrefix}-firebase`}
      title="Firebase"
      className="tech-logo-item flex-shrink-0 flex items-center justify-center h-9 sm:h-10 w-16 sm:w-20 transition-transform duration-75 ease-out select-none"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="75.37 20.86 442.36 555.61"
        className="h-full w-auto max-h-9 pointer-events-none select-none"
      >
        <path
          d="M213.918 560.499C237.166 569.856 262.387 575.408 288.87 576.333C324.71 577.585 358.792 570.175 389.261 556.099C352.724 541.744 319.634 520.751 291.392 494.651C273.086 523.961 246.01 547.113 213.918 560.499Z"
          fill="#FF9100"
        />
        <path
          d="M291.389 494.66C226.923 435.038 187.815 348.743 191.12 254.092C191.228 251.019 191.39 247.947 191.58 244.876C180.034 241.89 167.98 240.068 155.576 239.635C137.821 239.015 120.626 241.217 104.393 245.788C87.1838 275.933 76.7989 310.521 75.5051 347.569C72.1663 443.18 130.027 526.723 213.914 560.508C246.007 547.121 273.082 523.998 291.389 494.66Z"
          fill="#FFC400"
        />
        <path
          d="M291.39 494.657C306.378 470.671 315.465 442.551 316.523 412.254C319.306 332.559 265.731 264.003 191.581 244.873C191.391 247.944 191.229 251.016 191.121 254.089C187.816 348.74 226.924 435.035 291.39 494.657Z"
          fill="#FF9100"
        />
        <path
          d="M308.231 20.8584C266 54.6908 232.652 99.302 212.475 150.693C200.924 180.129 193.665 211.748 191.546 244.893C265.696 264.023 319.272 332.579 316.489 412.273C315.431 442.57 306.317 470.663 291.355 494.677C319.595 520.804 352.686 541.77 389.223 556.124C462.56 522.224 514.593 449.278 517.606 362.997C519.558 307.096 498.08 257.273 467.731 215.219C435.68 170.742 308.231 20.8584 308.231 20.8584Z"
          fill="#DD2C00"
        />
      </svg>
    </div>,

    /* 2. GITHUB */
    <div
      key={`${keyPrefix}-github`}
      title="GitHub"
      className="tech-logo-item flex-shrink-0 flex items-center justify-center h-9 sm:h-10 w-16 sm:w-20 text-[#1b1f23] dark:text-white transition-transform duration-75 ease-out select-none"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlSpace="preserve"
        viewBox="0 0 512 512"
        className="h-full w-auto max-h-9 pointer-events-none select-none"
      >
        <path
          d="M256 6.3C114.6 6.3 0 120.9 0 262.3c0 113.3 73.3 209 175 242.9 12.8 2.2 17.6-5.4 17.6-12.2 0-6.1-.3-26.2-.3-47.7-64.3 11.8-81-15.7-86.1-30.1-2.9-7.4-15.4-30.1-26.2-36.2-9-4.8-21.8-16.6-.3-17 20.2-.3 34.6 18.6 39.4 26.2 23 38.7 59.8 27.8 74.6 21.1 2.2-16.6 9-27.8 16.3-34.2-57-6.4-116.5-28.5-116.5-126.4 0-27.8 9.9-50.9 26.2-68.8-2.6-6.4-11.5-32.6 2.6-67.8 0 0 21.4-6.7 70.4 26.2 20.5-5.8 42.2-8.6 64-8.6s43.5 2.9 64 8.6c49-33.3 70.4-26.2 70.4-26.2 14.1 35.2 5.1 61.4 2.6 67.8 16.3 17.9 26.2 40.6 26.2 68.8 0 98.2-59.8 120-116.8 126.4 9.3 8 17.3 23.4 17.3 47.4 0 34.2-.3 61.8-.3 70.4 0 6.7 4.8 14.7 17.6 12.2C438.7 471.3 512 375.3 512 262.3c0-141.4-114.6-256-256-256"
          style={{
            fillRule: 'evenodd',
            clipRule: 'evenodd',
            fill: 'currentColor',
          }}
        />
      </svg>
    </div>,

    /* 3. NEXT.JS */
    <div
      key={`${keyPrefix}-nextjs`}
      title="Next.js"
      className="tech-logo-item flex-shrink-0 flex items-center justify-center h-9 sm:h-10 w-16 sm:w-20 text-black dark:text-white transition-transform duration-75 ease-out select-none"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlSpace="preserve"
        viewBox="0 0 180 180"
        className="h-full w-auto max-h-9 pointer-events-none select-none"
      >
        <circle cx="90" cy="90" r="90" fill="#e0e0e0" />
        <circle cx="90" cy="90" r="90" fill="#e0e0e0" />
        <linearGradient
          id={`nextjs-grad-${keyPrefix}`}
          x1="93.23"
          x2="128.73"
          y1="52.776"
          y2="8.776"
          fill="#e0e0e0"
          gradientTransform="matrix(1 0 0 -1 0 182)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" />
          <stop offset="1" stopOpacity="0" />
        </linearGradient>
        <path
          d="M149.5 157.5 69.1 54H54v72h12.1V69.4l73.9 95.5c3.3-2.3 6.5-4.7 9.5-7.4"
          style={{ fill: `url(#nextjs-grad-${keyPrefix})` }}
        />
        <path d="M115 54h12v72h-12z" />
      </svg>
    </div>,

    /* 4. BEHANCE */
    <div
      key={`${keyPrefix}-behance`}
      title="Behance"
      className="tech-logo-item flex-shrink-0 flex items-center justify-center h-9 sm:h-10 w-16 sm:w-20 transition-transform duration-75 ease-out select-none"
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1080 1080"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        xmlSpace="preserve"
        className="h-full w-auto max-h-9 pointer-events-none select-none"
        style={{
          fillRule: 'evenodd',
          clipRule: 'evenodd',
          strokeLinejoin: 'round',
          strokeMiterlimit: 2,
        }}
      >
        <circle cx="540" cy="540" r="534.247" style={{ fill: '#1d63f7' }} />
        <path
          d="M481.568,519.218c98.275,11.068 92.159,169.252 16.984,212.144c-45.083,25.723 -60.415,22.103 -271.96,22.086c-2.923,-0 -34.525,-0.003 -36.281,-4.339c-1.888,-4.66 -0.321,-389.796 -0.822,-412.577c-0.567,-25.763 11.11,-18.646 37.103,-18.647c207.131,-0.008 278.715,-12.971 307.577,79.759c6.342,20.376 11.5,85.436 -32.077,108.777c-15.284,8.186 -26.826,2.054 -20.525,12.798Z"
          style={{ fill: '#f6f6f7' }}
        />
        <path
          d="M890.317,595.105c-0.114,4.958 3.504,22.314 -10.692,22.581c-203.922,3.835 -216.501,-9.109 -215.233,8.075c6.77,91.738 126.379,74.868 140.738,39.486c1.731,-4.266 3.076,-8.682 4.802,-12.95c3.918,-9.689 73.1,-8.612 75.731,-0.966c12.77,37.112 -49.434,139.752 -202.965,104.384c-185.344,-42.696 -132.976,-379.923 104.447,-320.962c6.312,1.567 42.939,10.663 68.669,43.513c37.496,47.872 34.481,116.182 34.503,116.839Z"
          style={{ fill: '#f6f6f6' }}
        />
        <path
          d="M461.186,608.465c0.004,78.24 -32.433,67.299 -155.712,67.289c-13.82,-0.001 -16.346,-1.234 -16.451,-14.921c-0.714,-93.743 -2.685,-95.284 3.668,-100.177c2.263,-1.743 120.87,-3.508 134.868,1.257c30.23,10.291 32.811,43.708 33.626,46.552Z"
          style={{ fill: '#1d63f8' }}
        />
        <path
          d="M314.242,395.972c94.412,-0 105.758,-0.891 113.176,3.383c3.228,1.86 19.101,11.004 19.366,42.356c0.529,62.805 -51.015,50.899 -62.422,50.912c-83.82,0.098 -93.961,1.954 -95.196,-7.266c-0.313,-2.339 -0.089,-81.28 0.064,-82.854c0.618,-6.338 22.944,-6.515 25.012,-6.531Z"
          style={{ fill: '#1d63f7' }}
        />
        <path
          d="M644.78,371.593c0.696,-19.541 -3.979,-27.675 15.675,-27.885c12.28,-0.131 119.673,-1.277 153.511,0.025c17.472,0.672 11.615,52.292 4.057,53.368c-5.536,0.788 -164.01,0.307 -166.232,0.211c-10.868,-0.472 -5.618,-6.009 -7.011,-25.72Z"
          style={{ fill: '#f6f6f6' }}
        />
        <path
          d="M802.235,537.659c2.026,14.353 8.515,21.399 -5.972,21.579c-10.141,0.126 -120.559,1.497 -126.77,-0.145c-21.218,-5.608 33.817,-94.129 104.032,-58.736c17.528,8.835 27.333,33.797 28.71,37.302Z"
          style={{ fill: '#1d63f8' }}
        />
      </svg>
    </div>,

    /* 5. TYPESCRIPT */
    <div
      key={`${keyPrefix}-typescript`}
      title="TypeScript"
      className="tech-logo-item flex-shrink-0 flex items-center justify-center h-9 sm:h-10 w-16 sm:w-20 transition-transform duration-75 ease-out select-none"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="512"
        height="512"
        viewBox="0 0 512 512"
        fill="none"
        className="h-full w-auto max-h-9 pointer-events-none select-none"
      >
        <rect width="512" height="512" fill="#3178c6" rx="50" />
        <rect width="512" height="512" fill="#3178c6" rx="50" />
        <path
          fill="#fff"
          fillRule="evenodd"
          d="M316.939 407.424v50.061q12.207 6.258 28.875 9.386c16.668 3.128 22.823 3.129 35.135 3.129q17.998 0 34.196-3.442 16.199-3.441 28.406-11.342 12.207-7.9 19.328-20.65C470 421.816 470 415.559 470 403.044q0-13.61-4.069-23.857c-4.069-10.247-6.625-12.906-11.738-18.225q-7.668-7.979-18.389-14.315c-10.721-6.336-15.207-8.213-24.18-11.967q-9.86-4.068-17.685-7.9-7.825-3.834-13.303-7.822-5.478-3.99-8.451-8.448t-2.974-10.091q0-5.162 2.661-9.308c2.661-4.146 4.278-5.136 7.512-7.118q4.852-2.972 11.894-4.615 7.043-1.642 15.651-1.642 6.26 0 13.224.938 6.964.94 14.008 2.894a97.5 97.5 0 0 1 13.694 4.928q6.651 2.973 12.285 6.884v-46.776q-11.424-4.38-24.962-6.492C421.64 238 415.797 238 404.112 238q-17.842 0-33.805 3.833c-15.963 3.833-20.006 6.544-28.093 11.967q-12.129 8.136-19.171 20.729Q316 287.122 316 304.643q0 22.371 12.912 38.172 12.91 15.8 39.204 26.751 10.33 4.224 19.25 8.291c8.92 4.067 11.086 5.528 15.415 8.448q6.495 4.38 10.252 9.543 3.756 5.161 3.756 11.733 0 4.85-2.348 8.995c-2.348 4.145-3.939 5.162-7.121 7.196s-7.147 3.624-11.894 4.771q-7.121 1.721-16.668 1.721-16.276 0-32.24-5.71-15.963-5.709-29.579-17.13M232.78 284.082H297V243H118v41.082h63.906V467h50.874z"
          clipRule="evenodd"
        />
      </svg>
    </div>,

    /* 6. VERCEL */
    <div
      key={`${keyPrefix}-vercel`}
      title="Vercel"
      className="tech-logo-item flex-shrink-0 flex items-center justify-center h-9 sm:h-10 w-16 sm:w-20 text-zinc-900 dark:text-white transition-transform duration-75 ease-out select-none"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1155"
        height="1000"
        viewBox="0 0 1155 1000"
        fill="none"
        className="h-full w-auto max-h-9 pointer-events-none select-none"
      >
        <path fill="currentColor" d="m577.344 0 577.346 1000H0z" />
      </svg>
    </div>,

    /* 7. CHATGPT */
    <div
      key={`${keyPrefix}-chatgpt`}
      title="ChatGPT"
      className="tech-logo-item flex-shrink-0 flex items-center justify-center h-9 sm:h-10 w-16 sm:w-20 transition-transform duration-75 ease-out select-none"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 2406 2406"
        className="h-full w-auto max-h-9 pointer-events-none select-none"
      >
        <path
          d="M1 578.4C1 259.5 259.5 1 578.4 1h1249.1c319 0 577.5 258.5 577.5 577.4V2406H578.4C259.5 2406 1 2147.5 1 1828.6V578.4z"
          fill="#74aa9c"
        />
        <path
          id={`chatgpt-a-${keyPrefix}`}
          d="M1107.3 299.1c-197.999 0-373.9 127.3-435.2 315.3L650 743.5v427.9c0 21.4 11 40.4 29.4 51.4l344.5 198.515V833.3h.1v-27.9L1372.7 604c33.715-19.52 70.44-32.857 108.47-39.828L1447.6 450.3C1361 353.5 1237.1 298.5 1107.3 299.1zm0 117.5-.6.6c79.699 0 156.3 27.5 217.6 78.4-2.5 1.2-7.4 4.3-11 6.1L952.8 709.3c-18.4 10.4-29.4 30-29.4 51.4V1248l-155.1-89.4V755.8c-.1-187.099 151.601-338.9 339-339.2z"
          fill="#fff"
        />
        <use xlinkHref={`#chatgpt-a-${keyPrefix}`} transform="rotate(60 1203 1203)" />
        <use xlinkHref={`#chatgpt-a-${keyPrefix}`} transform="rotate(120 1203 1203)" />
        <use xlinkHref={`#chatgpt-a-${keyPrefix}`} transform="rotate(180 1203 1203)" />
        <use xlinkHref={`#chatgpt-a-${keyPrefix}`} transform="rotate(240 1203 1203)" />
        <use xlinkHref={`#chatgpt-a-${keyPrefix}`} transform="rotate(300 1203 1203)" />
      </svg>
    </div>,

    /* 8. ANTIGRAVITY */
    <div
      key={`${keyPrefix}-antigravity`}
      title="Antigravity"
      className="tech-logo-item flex-shrink-0 flex items-center justify-center h-9 sm:h-10 w-16 sm:w-20 transition-transform duration-75 ease-out select-none"
    >
      <svg
        height="1em"
        style={{ flex: 'none', lineHeight: 1 }}
        viewBox="0 0 24 24"
        width="1em"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto max-h-9 pointer-events-none select-none text-2xl sm:text-3xl"
      >
        <title>Antigravity</title>
        <mask
          height="23"
          id={`antigravity-mask-${keyPrefix}`}
          maskUnits="userSpaceOnUse"
          width="24"
          x="0"
          y="1"
        >
          <path
            d="M21.751 22.607c1.34 1.005 3.35.335 1.508-1.508C17.73 15.74 18.904 1 12.037 1 5.17 1 6.342 15.74.815 21.1c-2.01 2.009.167 2.511 1.507 1.506 5.192-3.517 4.857-9.714 9.715-9.714 4.857 0 4.522 6.197 9.714 9.715z"
            fill="#fff"
          ></path>
        </mask>
        <g mask={`url(#antigravity-mask-${keyPrefix})`}>
          <g filter={`url(#lobe-icons-antigravity-1-${keyPrefix})`}>
            <path
              d="M-1.018-3.992c-.408 3.591 2.686 6.89 6.91 7.37 4.225.48 7.98-2.043 8.387-5.633.408-3.59-2.686-6.89-6.91-7.37-4.225-.479-7.98 2.043-8.387 5.633z"
              fill="#FFE432"
            ></path>
          </g>
          <g filter={`url(#lobe-icons-antigravity-2-${keyPrefix})`}>
            <path
              d="M15.269 7.747c1.058 4.557 5.691 7.374 10.348 6.293 4.657-1.082 7.575-5.653 6.516-10.21-1.058-4.556-5.691-7.374-10.348-6.292-4.657 1.082-7.575 5.653-6.516 10.21z"
              fill="#FC413D"
            ></path>
          </g>
          <g filter={`url(#lobe-icons-antigravity-3-${keyPrefix})`}>
            <path
              d="M-12.443 10.804c1.338 4.703 7.36 7.11 13.453 5.378 6.092-1.733 9.947-6.95 8.61-11.652C8.282-.173 2.26-2.58-3.833-.848-9.925.884-13.78 6.1-12.443 10.804z"
              fill="#00B95C"
            ></path>
          </g>
          <g filter={`url(#lobe-icons-antigravity-4-${keyPrefix})`}>
            <path
              d="M-12.443 10.804c1.338 4.703 7.36 7.11 13.453 5.378 6.092-1.733 9.947-6.95 8.61-11.652C8.282-.173 2.26-2.58-3.833-.848-9.925.884-13.78 6.1-12.443 10.804z"
              fill="#00B95C"
            ></path>
          </g>
          <g filter={`url(#lobe-icons-antigravity-5-${keyPrefix})`}>
            <path
              d="M-7.608 14.703c3.352 3.424 9.126 3.208 12.896-.483 3.77-3.69 4.108-9.459.756-12.883C2.69-2.087-3.083-1.871-6.853 1.82c-3.77 3.69-4.108 9.458-.755 12.883z"
              fill="#00B95C"
            ></path>
          </g>
          <g filter={`url(#lobe-icons-antigravity-6-${keyPrefix})`}>
            <path
              d="M9.932 27.617c1.04 4.482 5.384 7.303 9.7 6.3 4.316-1.002 6.971-5.448 5.93-9.93-1.04-4.483-5.384-7.304-9.7-6.301-4.316 1.002-6.971 5.448-5.93 9.93z"
              fill="#3186FF"
            ></path>
          </g>
          <g filter={`url(#lobe-icons-antigravity-7-${keyPrefix})`}>
            <path
              d="M2.572-8.185C.392-3.329 2.778 2.472 7.9 4.771c5.122 2.3 11.042.227 13.222-4.63 2.18-4.855-.205-10.656-5.327-12.955-5.122-2.3-11.042-.227-13.222 4.63z"
              fill="#FBBC04"
            ></path>
          </g>
          <g filter={`url(#lobe-icons-antigravity-8-${keyPrefix})`}>
            <path
              d="M-3.267 38.686c-5.277-2.072 3.742-19.117 5.984-24.83 2.243-5.712 8.34-8.664 13.616-6.592 5.278 2.071 11.533 13.482 9.29 19.195-2.242 5.713-23.613 14.298-28.89 12.227z"
              fill="#3186FF"
            ></path>
          </g>
          <g filter={`url(#lobe-icons-antigravity-9-${keyPrefix})`}>
            <path
              d="M28.71 17.471c-1.413 1.649-5.1.808-8.236-1.878-3.135-2.687-4.531-6.201-3.118-7.85 1.412-1.649 5.1-.808 8.235 1.878s4.532 6.2 3.119 7.85z"
              fill="#749BFF"
            ></path>
          </g>
          <g filter={`url(#lobe-icons-antigravity-10-${keyPrefix})`}>
            <path
              d="M18.163 9.077c5.81 3.93 12.502 4.19 14.946.577 2.443-3.612-.287-9.727-6.098-13.658-5.81-3.931-12.502-4.19-14.946-.577-2.443 3.612.287 9.727 6.098 9.077z"
              fill="#FC413D"
            ></path>
          </g>
          <g filter={`url(#lobe-icons-antigravity-11-${keyPrefix})`}>
            <path
              d="M-.915 2.684c-1.44 3.473-.97 6.967 1.05 7.804 2.02.837 4.824-1.3 6.264-4.772 1.44-3.473.97-6.967-1.05-7.804-2.02-.837-4.824-4.824-6.264 4.772z"
              fill="#FFEE48"
            ></path>
          </g>
        </g>
      </svg>
    </div>,

    /* 9. REACT */
    <div
      key={`${keyPrefix}-react`}
      title="React"
      className="tech-logo-item flex-shrink-0 flex items-center justify-center h-9 sm:h-10 w-16 sm:w-20 transition-transform duration-75 ease-out select-none"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="-11.5 -10.23174 23 20.46348"
        className="h-full w-auto max-h-9 pointer-events-none select-none"
      >
        <title>React Logo</title>
        <circle cx="0" cy="0" r="2.05" fill="#61dafb" />
        <g stroke="#61dafb" strokeWidth="1" fill="none">
          <ellipse rx="11" ry="4.2" />
          <ellipse rx="11" ry="4.2" transform="rotate(60)" />
          <ellipse rx="11" ry="4.2" transform="rotate(120)" />
        </g>
      </svg>
    </div>,

    /* 10. GOOGLE AI STUDIO */
    <div
      key={`${keyPrefix}-google-aistudio`}
      title="Google AI Studio"
      className="tech-logo-item flex-shrink-0 flex items-center justify-center h-9 sm:h-10 w-16 sm:w-20 transition-transform duration-75 ease-out select-none"
    >
      <svg
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 65 65"
        className="h-full w-auto max-h-9 pointer-events-none select-none"
      >
        <mask
          id={`google-aistudio-maskme-${keyPrefix}`}
          style={{ maskType: 'alpha' }}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="65"
          height="65"
        >
          <path
            d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z"
            fill="#000"
          />
          <path
            d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z"
            fill={`url(#google-aistudio-paint0-${keyPrefix})`}
          />
        </mask>
        <g mask={`url(#google-aistudio-maskme-${keyPrefix})`}>
          <g filter={`url(#google-aistudio-filter0-${keyPrefix})`}>
            <path
              d="M-5.859 50.734c7.498 2.663 16.116-2.33 19.249-11.152 3.133-8.821-.406-18.131-7.904-20.794-7.498-2.663-16.116 2.33-19.25 11.151-3.132 8.822.407 18.132 7.905 20.795z"
              fill="#FFE432"
            />
          </g>
          <g filter={`url(#google-aistudio-filter1-${keyPrefix})`}>
            <path
              d="M27.433 21.649c10.3 0 18.651-8.535 18.651-19.062 0-10.528-8.35-19.062-18.651-19.062S8.78-7.94 8.78 2.587c0 10.527 8.35 19.062 18.652 19.062z"
              fill="#FC413D"
            />
          </g>
          <g filter={`url(#google-aistudio-filter2-${keyPrefix})`}>
            <path
              d="M20.184 82.608c10.753-.525 18.918-12.244 18.237-26.174-.68-13.93-9.95-24.797-20.703-24.271C6.965 32.689-1.2 44.407-.519 58.337c.681 13.93 9.95 24.797 20.703 24.271z"
              fill="#00B95C"
            />
          </g>
          <g filter={`url(#google-aistudio-filter3-${keyPrefix})`}>
            <path
              d="M20.184 82.608c10.753-.525 18.918-12.244 18.237-26.174-.68-13.93-9.95-24.797-20.703-24.271C6.965 32.689-1.2 44.407-.519 58.337c.681 13.93 9.95 24.797 20.703 24.271z"
              fill="#00B95C"
            />
          </g>
          <g filter={`url(#google-aistudio-filter4-${keyPrefix})`}>
            <path
              d="M30.954 74.181c9.014-5.485 11.427-17.976 5.389-27.9-6.038-9.925-18.241-13.524-27.256-8.04-9.015 5.486-11.428 17.977-5.39 27.902 6.04 9.924 18.242 13.523 27.257 8.038z"
              fill="#00B95C"
            />
          </g>
          <g filter={`url(#google-aistudio-filter5-${keyPrefix})`}>
            <path
              d="M67.391 42.993c10.132 0 18.346-7.91 18.346-17.666 0-9.757-8.214-17.667-18.346-17.667s-18.346 7.91-18.346 17.667c0 9.757 8.214 17.666 18.346 17.666z"
              fill="#3186FF"
            />
          </g>
          <g filter={`url(#google-aistudio-filter6-${keyPrefix})`}>
            <path
              d="M-13.065 40.944c9.33 7.094 22.959 4.869 30.442-4.972 7.483-9.84 5.987-23.569-3.343-30.663C4.704-1.786-8.924.439-16.408 10.28c-7.483 9.84-5.986 23.57 3.343 30.664z"
              fill="#FBBC04"
            />
          </g>
          <g filter={`url(#google-aistudio-filter7-${keyPrefix})`}>
            <path
              d="M34.74 51.43c11.135 7.656 25.896 5.524 32.968-4.764 7.073-10.287 3.779-24.832-7.357-32.488C49.215 6.52 34.455 8.654 27.382 18.94c-7.072 10.288-3.779 24.833 7.357 32.49z"
              fill="#3186FF"
            />
          </g>
          <g filter={`url(#google-aistudio-filter8-${keyPrefix})`}>
            <path
              d="M54.984-2.336c2.833 3.852-.808 11.34-8.131 16.727-7.324 5.387-15.557 6.631-18.39 2.78-2.833-3.853.807-11.342 8.13-16.728 7.324-5.387 15.558-6.631 18.39-2.78z"
              fill="#749BFF"
            />
          </g>
          <g filter={`url(#google-aistudio-filter9-${keyPrefix})`}>
            <path
              d="M31.727 16.104C43.053 5.598 46.94-8.626 40.41-15.666c-6.53-7.04-21.006-4.232-32.332 6.274s-15.214 24.73-8.683 31.77c6.53 7.04 21.006 4.232 32.332-6.274z"
              fill="#FC413D"
            />
          </g>
          <g filter={`url(#google-aistudio-filter10-${keyPrefix})`}>
            <path
              d="M8.51 53.838c6.732 4.818 14.46 5.55 17.262 1.636 2.802-3.915-.384-10.994-7.116-15.812-6.731-4.818-14.46-5.55-17.261-1.636-.802 3.915.383 10.994 7.115 15.812z"
              fill="#FFEE48"
            />
          </g>
        </g>
        <defs>
          <filter
            id={`google-aistudio-filter0-${keyPrefix}`}
            x="-19.824"
            y="13.152"
            width="39.274"
            height="43.217"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="2.46" result="effect1_foregroundBlur_2001_67" />
          </filter>
          <filter
            id={`google-aistudio-filter1-${keyPrefix}`}
            x="-15.001"
            y="-40.257"
            width="84.868"
            height="85.688"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="11.891" result="effect1_foregroundBlur_2001_67" />
          </filter>
          <filter
            id={`google-aistudio-filter2-${keyPrefix}`}
            x="-20.776"
            y="11.927"
            width="79.454"
            height="90.916"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur_2001_67" />
          </filter>
          <filter
            id={`google-aistudio-filter3-${keyPrefix}`}
            x="-20.776"
            y="11.927"
            width="79.454"
            height="90.916"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur_2001_67" />
          </filter>
          <filter
            id={`google-aistudio-filter4-${keyPrefix}`}
            x="-19.845"
            y="15.459"
            width="79.731"
            height="81.505"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur_2001_67" />
          </filter>
          <filter
            id={`google-aistudio-filter5-${keyPrefix}`}
            x="29.832"
            y="-11.552"
            width="75.117"
            height="73.758"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="9.606" result="effect1_foregroundBlur_2001_67" />
          </filter>
          <filter
            id={`google-aistudio-filter6-${keyPrefix}`}
            x="-38.583"
            y="-16.253"
            width="78.135"
            height="78.758"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="8.706" result="effect1_foregroundBlur_2001_67" />
          </filter>
          <filter
            id={`google-aistudio-filter7-${keyPrefix}`}
            x="8.107"
            y="-5.966"
            width="78.877"
            height="77.539"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="7.775" result="effect1_foregroundBlur_2001_67" />
          </filter>
          <filter
            id={`google-aistudio-filter8-${keyPrefix}`}
            x="13.587"
            y="-18.488"
            width="56.272"
            height="51.81"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="6.957" result="effect1_foregroundBlur_2001_67" />
          </filter>
          <filter
            id={`google-aistudio-filter9-${keyPrefix}`}
            x="-15.526"
            y="-31.297"
            width="70.856"
            height="69.306"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="5.876" result="effect1_foregroundBlur_2001_67" />
          </filter>
          <filter
            id={`google-aistudio-filter10-${keyPrefix}`}
            x="-14.168"
            y="20.964"
            width="55.501"
            height="51.571"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="7.273" result="effect1_foregroundBlur_2001_67" />
          </filter>
          <linearGradient
            id={`google-aistudio-paint0-${keyPrefix}`}
            x1="18.447"
            y1="43.42"
            x2="52.153"
            y2="15.004"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#4893FC" />
            <stop offset=".27" stopColor="#4893FC" />
            <stop offset=".777" stopColor="#969DFF" />
            <stop offset="1" stopColor="#BD99FE" />
          </linearGradient>
        </defs>
      </svg>
    </div>,

    /* 11. CLAUDE */
    <div
      key={`${keyPrefix}-claude`}
      title="Claude"
      className="tech-logo-item flex-shrink-0 flex items-center justify-center h-9 sm:h-10 w-16 sm:w-20 transition-transform duration-75 ease-out select-none"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 1200"
        className="h-full w-auto max-h-9 pointer-events-none select-none"
      >
        <g id={`claude-g314-${keyPrefix}`}>
          <path
            id={`claude-path147-${keyPrefix}`}
            fill="#d97757"
            stroke="none"
            d="M 233.959793 800.214905 L 468.644287 668.536987 L 472.590637 657.100647 L 468.644287 650.738403 L 457.208069 650.738403 L 417.986633 648.322144 L 283.892639 644.69812 L 167.597321 639.865845 L 54.926208 633.825623 L 26.577238 627.785339 L 3.3e-05 592.751709 L 2.73832 575.27533 L 26.577238 559.248352 L 60.724873 562.228149 L 136.187973 567.382629 L 249.422867 575.194763 L 331.570496 580.026978 L 453.261841 592.671082 L 472.590637 592.671082 L 475.328857 584.859009 L 468.724915 580.026978 L 463.570557 575.194763 L 346.389313 495.785217 L 219.543671 411.865906 L 153.100723 363.543762 L 117.181267 339.060425 L 99.060455 316.107361 L 91.248367 266.01355 L 123.865784 230.093994 L 167.677887 233.073853 L 178.872513 236.053772 L 223.248367 270.201477 L 318.040283 343.570496 L 441.825592 434.738342 L 459.946411 449.798706 L 467.194672 444.64447 L 468.080597 441.020203 L 459.946411 427.409485 L 392.617493 305.718323 L 320.778564 181.932983 L 288.80542 130.630859 L 280.348999 99.865845 C 277.369171 87.221436 275.194641 76.590698 275.194641 63.624268 L 312.322174 13.20813 L 332.8591 6.604126 L 382.389313 13.20813 L 403.248352 31.328979 L 434.013519 101.71814 L 483.865753 212.537048 L 561.181274 363.221497 L 583.812134 407.919434 L 595.892639 449.315491 L 600.40271 461.959839 L 608.214783 461.959839 L 608.214783 454.711609 L 614.577271 369.825623 L 626.335632 265.61084 L 637.771851 131.516846 L 641.718201 93.745117 L 660.402832 48.483276 L 697.530334 24.000122 L 726.52356 37.852417 L 750.362549 72 L 747.060486 94.067139 L 732.886047 186.201416 L 705.100708 330.52356 L 686.979919 427.167847 L 697.530334 427.167847 L 709.61084 415.087341 L 758.496704 350.174561 L 840.644348 247.490051 L 876.885925 206.738342 L 919.167847 161.71814 L 946.308838 140.29541 L 997.61084 140.29541 L 1035.38269 196.429626 L 1018.469849 254.416199 L 965.637634 321.422852 L 921.825562 378.201538 L 859.006714 462.765259 L 819.785278 530.41626 L 823.409424 535.812073 L 832.75177 534.92627 L 974.657776 504.724915 L 1051.328979 490.872559 L 1142.818848 475.167786 L 1184.214844 494.496582 L 1188.724854 514.147644 L 1172.456421 554.335693 L 1074.604126 578.496765 L 959.838989 601.449829 L 788.939636 641.879272 L 786.845764 643.409485 L 789.261841 646.389343 L 866.255127 653.637634 L 899.194702 655.409424 L 979.812134 655.409424 L 1129.932861 666.604187 L 1169.154419 692.537109 L 1192.671265 724.268677 L 1188.724854 748.429688 L 1128.322144 779.194641 L 1046.818848 759.865845 L 856.590759 714.604126 L 791.355774 698.335754 L 782.335693 698.335754 L 782.335693 703.731567 L 836.69812 756.885986 L 936.322205 846.845581 L 1061.073975 962.81897 L 1067.436279 991.490112 L 1051.409424 1014.120911 L 1034.496704 1011.704712 L 924.885986 929.234924 L 882.604126 892.107544 L 786.845764 811.48999 L 780.483276 811.48999 L 780.483276 819.946289 L 802.550415 852.241699 L 919.087341 1027.409424 L 925.127625 1081.127686 L 916.671204 1098.604126 L 886.469849 1109.154419 L 853.288696 1103.114136 L 785.073914 1007.355835 L 714.684631 899.516785 L 657.906067 802.872498 L 650.979858 806.81897 L 617.476624 1167.704834 L 601.771851 1186.147705 L 565.530212 1200 L 535.328857 1177.046997 L 519.302124 1139.919556 L 535.328857 1066.550537 L 554.657776 970.792053 L 570.362488 894.68457 L 584.536926 800.134277 L 592.993347 768.724976 L 592.429626 766.630859 L 585.503479 767.516968 L 514.22821 865.369263 L 405.825531 1011.865906 L 320.053711 1103.677979 L 299.516815 1111.812256 L 263.919525 1093.369263 L 267.221497 1060.429688 L 287.114136 1031.114136 L 405.825531 880.107361 L 477.422913 786.52356 L 523.651062 732.483276 L 523.328918 724.671265 L 520.590698 724.671265 L 205.288605 929.395935 L 149.154434 936.644409 L 124.993355 914.01355 L 127.973183 876.885986 L 139.409409 864.80542 L 234.201385 799.570435 L 233.879227 799.8927 Z"
          />
        </g>
      </svg>
    </div>,

    /* 12. YOUTUBE */
    <div
      key={`${keyPrefix}-youtube`}
      title="YouTube"
      className="tech-logo-item flex-shrink-0 flex items-center justify-center h-9 sm:h-10 w-16 sm:w-20 transition-transform duration-75 ease-out select-none"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlSpace="preserve"
        viewBox="0 76.8 512 358.4"
        className="h-full w-auto max-h-9 pointer-events-none select-none"
      >
        <path
          d="M501.3 132.8c-5.9-22-23.2-39.4-45.3-45.3-39.9-10.7-200-10.7-200-10.7s-160.1 0-200 10.7c-22 5.9-39.4 23.2-45.3 45.3C0 172.7 0 256 0 256s0 83.3 10.7 123.2c5.9 22 23.2 39.4 45.3 45.3 39.9 10.7 200 10.7 200 10.7s160.1 0 200-10.7c22-5.9 39.4-23.2 45.3-45.3C512 339.3 512 256 512 256s0-83.3-10.7-123.2"
          fill="#FF0000"
        />
        <path d="m204.8 332.8 133-76.8-133-76.8z" fill="#FFFFFF" />
      </svg>
    </div>,
  ];

  return (
    <section className="w-full pt-6 pb-2 flex flex-col justify-center items-center overflow-hidden font-system select-none">
      {/* Subtle Section Heading */}
      <h3 className="text-xs uppercase tracking-widest font-semibold text-zinc-500 dark:text-zinc-400 mb-6 text-center select-none">
        Tools and Technologies
      </h3>

      {/* Marquee Viewport with Edge Fades */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className={`relative w-full max-w-[260px] sm:max-w-[320px] md:max-w-[360px] mx-auto overflow-hidden py-4 select-none touch-pan-y ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          maskImage:
            'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
        }}
      >
        {/* Infinite Scrolling Track */}
        <div
          ref={trackRef}
          className="flex items-center gap-4 sm:gap-6 md:gap-7 w-max will-change-transform"
        >
          {renderLogos('set1')}
          {renderLogos('set2')}
          {renderLogos('set3')}
          {renderLogos('set4')}
        </div>
      </div>
    </section>
  );
}
