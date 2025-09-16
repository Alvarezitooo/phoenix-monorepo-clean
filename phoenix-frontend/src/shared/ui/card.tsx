import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-100 ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }: CardHeaderProps) => {
  return (
    <div className={`p-6 pb-4 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  );
};

export const CardContent = ({ children, className = '' }: CardContentProps) => {
  return (
    <div className={`p-6 pt-4 ${className}`}>
      {children}
    </div>
  );
};