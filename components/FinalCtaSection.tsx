'use client';

import React from 'react';
import { 
  ShieldCheck, 
  CheckCircle2
} from 'lucide-react';

interface FinalCtaSectionProps {
  onSignInClick?: () => void;
}

export function FinalCtaSection({ onSignInClick }: FinalCtaSectionProps) {
  const handleCta = () => {
    if (onSignInClick) {
      onSignInClick();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section id="final-cta" className="py-24 bg-[#F9F9F7] border-b border-[#E5E5E1] relative overflow-hidden">
      
      {/* Background ghost watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none select-none text-[220px] font-black text-[#1A1A1A]">
        SCHEDULA
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Main CTA Card */}
        <div className="bg-white rounded-2xl p-8 sm:p-14 border border-[#E5E5E1] shadow-xl relative overflow-hidden">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F9F9F7] border border-[#E5E5E1] text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-6 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
            <span>Administrator Workspace</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1A1A1A] tracking-tight leading-tight max-w-2xl mx-auto">
            Ready to organize your institution&apos;s <span className="text-[#2563EB] italic font-serif font-light">academic</span> timetable?
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#4B5563] max-w-xl mx-auto leading-relaxed">
            Eliminate double-booking conflicts, prevent lecture hall overcrowding, and systematically balance your university&apos;s courses in minutes.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={() => handleCta()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-[0.98] transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              id="cta-primary-btn"
            >
              <span>Access Administrator Portal</span>
            </button>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 rounded-xl text-base font-bold text-[#1A1A1A] bg-[#F9F9F7] hover:bg-[#E5E5E1] border border-[#E5E5E1] transition-all"
              id="cta-secondary-btn"
            >
              Review System Workflow
            </a>
          </div>

          {/* Institutional Trust Indicators */}
          <div className="mt-10 pt-8 border-t border-[#E5E5E1] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#4B5563] font-bold">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
              <span>Strict Capacity Adherence</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
              <span>Zero-Clash Hall Guarantee</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
              <span>Multi-Format Export Ready</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
