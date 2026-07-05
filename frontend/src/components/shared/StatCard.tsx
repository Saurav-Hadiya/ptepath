interface StatCardProps {
  value: string | number;
  label: string;
  subtext?: string;
  subtextColor?: 'success' | 'muted';
}

export default function StatCard({ value, label, subtext, subtextColor = 'muted' }: StatCardProps) {
  return (
    <div className="rounded-card border border-border-default bg-bg-card px-5 py-4 shadow-card">
      <div className="font-display text-display-md text-brand-primary">{value}</div>
      <div className="mt-1 text-label-md text-text-secondary">{label}</div>
      {subtext && (
        <div
          className={`mt-1 text-label-sm ${
            subtextColor === 'success' ? 'text-feedback-success' : 'text-text-muted'
          }`}
        >
          {subtext}
        </div>
      )}
    </div>
  );
}
