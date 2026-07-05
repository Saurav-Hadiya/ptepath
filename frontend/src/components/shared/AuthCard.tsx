interface AuthCardProps {
  children: React.ReactNode;
  maxWidth?: string;
}

export default function AuthCard({ children, maxWidth = 'max-w-[420px]' }: AuthCardProps) {
  return (
    <div className={`w-full ${maxWidth} rounded-[16px] bg-bg-card p-8 shadow-modal sm:p-10`}>
      {children}
    </div>
  );
}
