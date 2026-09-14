import { cn } from '../../utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'card p-5',
        hover && 'cursor-pointer hover:shadow-card-hover transition-shadow duration-200',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

export function StatsCard({
  label,
  value,
  subtext,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'card p-5 flex items-start gap-4',
        accent && 'border-bee-yellow bg-bee-yellow-light'
      )}
    >
      {icon && <div className="text-2xl">{icon}</div>}
      <div>
        <p className="text-sm text-bee-gray">{label}</p>
        <p className="text-2xl font-bold text-bee-black mt-0.5">{value}</p>
        {subtext && <p className="text-xs text-bee-gray mt-1">{subtext}</p>}
      </div>
    </div>
  );
}
