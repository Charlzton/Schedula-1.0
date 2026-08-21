'use client';

import React from 'react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#08184E] dark:bg-[#030A1F] text-white py-8 sm:py-10 border-t border-white/10 transition-colors duration-300 font-system">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs sm:text-sm text-blue-200/70 font-normal">
          © {currentYear} Schedula • Department of Computer Science • University of Ghana
        </p>
      </div>
    </footer>
  );
}

