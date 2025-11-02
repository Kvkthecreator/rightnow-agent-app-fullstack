import Image from 'next/image';

interface BrandProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function Brand({ className = '', width = 100, height = 28 }: BrandProps) {
  return (
    <Image
      src="/assets/logos/yarn-logo-light.png"
      alt="yarnnn logo"
      width={width}
      height={height}
      className={className}
    />
  );
}
