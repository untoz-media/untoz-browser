import React from 'react';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  name?: string;
  shape?: 'circle' | 'square';
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({
    src,
    alt,
    size = 'md',
    name,
    shape = 'circle',
    className = '',
    ...props
  }, ref) => {
    // Size classes
    const sizeClasses = {
      xs: 'h-6 w-6',
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
      xl: 'h-14 w-14',
    };

    // Shape classes
    const shapeClasses = {
      circle: 'rounded-full',
      square: 'rounded-md',
    };

    const initials = name
      ? name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : '?';

    return (
      <div
        ref={ref}
        className={`${sizeClasses[size]} ${shapeClasses[shape]} flex items-center justify-center bg-primary/20 text-primary-600 font-medium ${className}`}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt ?? initials}
            className="object-cover w-full h-full"
            onError={(e) => {
              // Fallback to initials if image fails to load
              (e.target as HTMLImageElement).src = '';
              (e.target as HTMLImageElement).alt = initials;
            }}
          />
        ) : (
          <span className="truncate">{initials}</span>
        )}
      </div>
    )
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
