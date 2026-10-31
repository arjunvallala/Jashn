import React from 'react';

interface SkipLinkProps {
  label?: string;
  targetId?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  label = 'Skip to main content',
  targetId = 'main-content',
}) => {
  return (
    <a href={`#${targetId}`} className="skip-link">
      {label}
    </a>
  );
};
