import { ReactNode, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../helpers/useAccessibility';
import styles from './AnimatedContainer.module.css';

interface AnimatedContainerProps {
  children: ReactNode;
  animation?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scaleIn' | 'none';
  duration?: 'fast' | 'normal' | 'slow';
  delay?: number;
  className?: string;
  trigger?: 'mount' | 'visible' | 'hover' | 'focus';
  threshold?: number; // For intersection observer
}

export const AnimatedContainer = ({
  children,
  animation = 'fadeIn',
  duration = 'normal',
  delay = 0,
  className = '',
  trigger = 'mount',
  threshold = 0.1,
}: AnimatedContainerProps) => {
  const [isVisible, setIsVisible] = useState(trigger === 'mount');
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Use intersection observer for visibility-based animations
  useEffect(() => {
    if (trigger !== 'visible' || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [trigger, threshold]);

  // Handle animation start
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isVisible, delay]);

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsVisible(false);
      setIsAnimating(false);
    }
  };

  const handleFocus = () => {
    if (trigger === 'focus') {
      setIsVisible(true);
    }
  };

  const handleBlur = () => {
    if (trigger === 'focus') {
      setIsVisible(false);
      setIsAnimating(false);
    }
  };

  const containerClasses = [
    styles.container,
    prefersReducedMotion || animation === 'none' ? '' : styles[animation],
    styles[duration],
    isAnimating ? styles.animate : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

// Stagger animation for lists
interface StaggeredListProps {
  children: ReactNode[];
  staggerDelay?: number;
  animation?: AnimatedContainerProps['animation'];
  className?: string;
}

export const StaggeredList = ({
  children,
  staggerDelay = 100,
  animation = 'slideUp',
  className = '',
}: StaggeredListProps) => {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <AnimatedContainer
          key={index}
          animation={animation}
          delay={index * staggerDelay}
          trigger="visible"
        >
          {child}
        </AnimatedContainer>
      ))}
    </div>
  );
};

// Micro-interaction components
interface HoverScaleProps {
  children: ReactNode;
  scale?: number;
  className?: string;
}

export const HoverScale = ({
  children,
  scale = 1.05,
  className = '',
}: HoverScaleProps) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={`${styles.hoverScale} ${className}`}
      style={{
        '--scale-factor': scale,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

// Press animation for buttons
interface PressAnimationProps {
  children: ReactNode;
  className?: string;
}

export const PressAnimation = ({
  children,
  className = '',
}: PressAnimationProps) => {
  return (
    <div className={`${styles.pressAnimation} ${className}`}>
      {children}
    </div>
  );
};

// Floating animation for decorative elements
interface FloatingAnimationProps {
  children: ReactNode;
  intensity?: 'subtle' | 'normal' | 'strong';
  className?: string;
}

export const FloatingAnimation = ({
  children,
  intensity = 'normal',
  className = '',
}: FloatingAnimationProps) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`${styles.floating} ${styles[intensity]} ${className}`}>
      {children}
    </div>
  );
};