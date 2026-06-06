interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

export default function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="card-hover bg-white rounded-xl p-5 border border-gray-100">
      <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center mb-3 text-gray-700">
        <Icon size={18} />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}
