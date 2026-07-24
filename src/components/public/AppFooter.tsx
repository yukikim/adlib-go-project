import Link from 'next/link';

import Container from './Container';

export default function AppFooter() {
  return (
    <footer className="py-20 relative bg-background/90">
      <Container>
        <div className="m-auto">
          <div className="items-center justify-between md:flex-nowrap">
            <div className="w-full justify-center space-x-12 text-gray-600 md:justify-start">
              <ul className="flex flex-wrap gap-4 list-inside list-none">
                <li><Link href="/" className="transition hover:text-primary">Home</Link></li>
                <li><Link href="/about" className="transition hover:text-primary">About</Link></li>
                <li><Link href="/columns" className="transition hover:text-primary">Columns</Link></li>
                <li><Link href="/contact" className="transition hover:text-primary">Contact</Link></li>
              </ul>
            </div>
            <div className="m-auto mt-16 space-y-2 text-center sm:mt-auto">
              <span className="block text-gray-500 dark:text-gray-400">Website for groups that enjoy jazz sessions.</span>
              <span className="block text-gray-500 dark:text-gray-400">Adlib Go © 2026</span>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
