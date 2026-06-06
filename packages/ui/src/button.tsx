import { ArrowRight } from 'lucide-react';

type Variant = 'primary' | 'outline';

interface ButtonProps {
  href?: string;
  variant?: Variant;
  children: React.ReactNode;
  withArrow?: boolean;
  className?: string;
}

export default function Button({
  href = '#',
  variant = 'primary',
  children,
  withArrow = false,
  className = '',
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium text-sm rounded-lg px-5 py-2.5 transition-colors duration-150';

  const styles: Record<Variant, string> = {
    primary: 'bg-gray-900 text-white hover:bg-gray-700',
    outline: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
  };

  return (
    <a href={href} className={`${base} ${styles[variant]} group ${className}`}>
      {children}
      {withArrow && (
        <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
      )}
    </a>
  );
}
