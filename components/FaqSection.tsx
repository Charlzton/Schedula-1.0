'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const faqData: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'What is Schedula?',
    answer: 'Schedula is an intelligent academic timetable scheduling and lecture hall allocation platform built for universities and educational administrators. It automates the complex task of scheduling academic courses, lecture halls, and time slots while strictly enforcing departmental rules, instructor availability, and seating capacity constraints.'
  },
  {
    id: 'faq-2',
    question: 'How does Schedula generate clash-free timetables?',
    answer: 'Schedula uses an automated constraint satisfaction engine. It processes course enrollments, instructor availability windows, room capacities, and cohort stream allocations simultaneously to calculate an optimal schedule with zero double-bookings or room capacity overflows in seconds.'
  },
  {
    id: 'faq-3',
    question: 'What scheduling constraints can Schedula handle?',
    answer: 'Schedula natively handles hard and soft constraints including: faculty preferred and restricted time windows, maximum consecutive teaching hours, specialized computer lab and equipment requirements, multi-stream student cohorts (Level 100 to Level 400), and lecture hall seating capacity thresholds.'
  },
  {
    id: 'faq-4',
    question: 'Can administrators manage courses, lecturers, facilities, and time slots?',
    answer: 'Yes. Administrators have complete control through the Schedula Dashboard to add, edit, or import course catalogs (e.g. DCIT courses), faculty instructor profiles, lecture venues with exact seating capacities, and academic semester time blocks.'
  },
  {
    id: 'faq-5',
    question: 'How does Schedula identify and prevent double-booking?',
    answer: 'Before and during timetable generation, the engine runs continuous validation audits across faculty assignments, student cohort levels, and physical lecture rooms. Any potential conflict is instantly flagged and resolved before the final timetable is compiled.'
  },
  {
    id: 'faq-6',
    question: 'Can generated timetables be exported and shared?',
    answer: 'Yes. Generated timetables can be exported in standard formats including printable PDF documents, Excel spreadsheets, and CSV files, or published directly for faculty and students to access online.'
  }
];

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setOpenId(prev => (prev === id ? null : id));
  };

  return (
    <section 
      id="faq" 
      className="w-full bg-[#F7F9FB] dark:bg-[#070913] text-[#111827] dark:text-[#F9FAFB] pt-10 sm:pt-14 lg:pt-16 pb-24 sm:pb-32 px-4 sm:px-6 lg:px-8 transition-colors duration-300 relative z-10 font-system"
      aria-label="Frequently Asked Questions"
    >
      <div className="max-w-3xl mx-auto">
        {/* Centered Heading */}
        <div className="mb-10 sm:mb-12 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#111827] dark:text-white">
            FAQs
          </h2>
        </div>

        {/* Clean, Non-Rectangular Divider Accordion */}
        <div className="divide-y divide-zinc-200/80 dark:divide-white/10" role="presentation">
          {faqData.map((item) => {
            const isOpen = openId === item.id;
            const triggerId = `faq-trigger-${item.id}`;
            const panelId = `faq-panel-${item.id}`;

            return (
              <div 
                key={item.id} 
                className="py-5 sm:py-6"
              >
                <h3>
                  <button
                    type="button"
                    id={triggerId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleFaq(item.id)}
                    className="w-full flex items-center justify-between gap-4 text-left group cursor-pointer focus:outline-none"
                  >
                    <span className="text-[15px] sm:text-base font-semibold text-[#111827] dark:text-[#F9FAFB] group-hover:text-[#133EC6] dark:group-hover:text-blue-400 transition-colors">
                      {item.question}
                    </span>
                    <div
                      className="shrink-0 p-1 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors duration-200"
                      aria-hidden="true"
                    >
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform duration-300 ${
                          isOpen ? 'rotate-180 text-[#133EC6] dark:text-blue-400' : 'rotate-0'
                        }`} 
                      />
                    </div>
                  </button>
                </h3>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={triggerId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 pr-6 text-sm sm:text-[15px] text-[#4B5563] dark:text-[#9CA3AF] leading-relaxed font-normal">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
