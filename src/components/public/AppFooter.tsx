import Container from "./Container";

export default function AppFooter() {
  return (
    <footer className="py-20 relative bg-background/90">
      <Container>
        <div className="m-auto">
          <div className="items-center justify-between md:flex-nowrap">
            <div className="w-full justify-center space-x-12 text-gray-600 md:justify-start">
              <ul className="flex gap-4 list-inside list-none space-y-8">
                <li><a href="#" className="transition hover:text-primary">Home</a></li>
                <li><a href="#" className="transition hover:text-primary">About</a></li>
                <li><a href="#" className="transition hover:text-primary">Guide</a></li>
                <li><a href="#" className="transition hover:text-primary">Blocks</a></li>
                <li><a href="#" className="transition hover:text-primary">Contact</a></li>
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
