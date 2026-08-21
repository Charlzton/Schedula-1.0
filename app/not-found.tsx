import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#0B0B0E] text-[#121212] dark:text-[#F4F4F6] p-4 text-center">
      <h2 className="text-3xl font-bold mb-2">Page Not Found</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Could not find the requested page.</p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-full bg-[#111] dark:bg-white text-white dark:text-[#111] text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Return Home
      </Link>
    </div>
  );
}
