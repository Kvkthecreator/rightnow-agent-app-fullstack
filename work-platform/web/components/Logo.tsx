import Image from 'next/image';

interface LogoProps {
  /** Logo variant: dark or light */
  variant?: 'dark' | 'light';
  /** Width of the logo in pixels */
  width?: number;
  /** Height of the logo in pixels */
  height?: number;
  /** Additional CSS classes */
  className?: string;
  /** Alt text for the image */
  alt?: string;
}

/**
 * Reusable Logo component that loads optimized images from the public assets.
 */
export default function Logo({
  variant = 'dark',
  width = 32,
  height = 32,
  className = '',
  alt = 'yarn logo',
}: LogoProps) {
  const src = `/assets/logos/yarn-logo-${variant}.png`;
  return <Image src={src} alt={alt} width={width} height={height} className={className} />;
}