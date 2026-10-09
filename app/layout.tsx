import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { TimetableProvider } from '@/context/TimetableContext';
import { ToastProvider } from '@/context/ToastContext';
import { TourProvider } from '@/context/TourContext';
import { OnboardingTour } from '@/components/tour/OnboardingTour';

export const metadata: Metadata = {
  title: 'Schedula',
  description: 'Manage your schedule. Stay in control. Intelligent university timetable scheduling and hall allocation management system for academic administrators.',
  keywords: [
    'Schedula',
    'University Timetable',
    'Timetable Scheduling',
    'Lecture Hall Allocation',
    'Course Scheduling',
    'Academic Timetable',
    'Conflict-free Scheduling'
  ],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg'
  },
  openGraph: {
    title: 'Schedula',
    description: 'Intelligent timetable scheduling and hall allocation management system for academic administrators.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var stored = localStorage.getItem('schedula-theme');
                var theme = (stored === 'light' || stored === 'dark') ? stored : 'dark';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                }
              } catch (e) {}
            })();`
          }}
        />
      </head>
      <body className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0B0E] text-[#111827] dark:text-[#F9FAFB] font-system antialiased selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-[#0B0B0E] overflow-x-hidden transition-colors duration-120" suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <TimetableProvider>
              <ToastProvider>
                <TourProvider>
                  {children}
                  <OnboardingTour />
                </TourProvider>
              </ToastProvider>
            </TimetableProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

