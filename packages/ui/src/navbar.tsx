import { Pencil } from 'lucide-react';
import Button from './button';

const NAV_LINKS = ['Features', 'Changelog', 'Docs'] as const;

export default function Navbar() {
  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gray-900 rounded-md flex items-center justify-center">
            <Pencil size={13} className="text-white" />
          </div>
          <span className="font-semibold text-gray-900">Sketchpad</span>
        </a>

        <nav className="hidden sm:flex items-center gap-6">
          {NAV_LINKS.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">
            Sign in
          </a>
          <Button href="#" variant="primary">Start Drawing</Button>
        </div>
      </div>
    </header>
  );
}
