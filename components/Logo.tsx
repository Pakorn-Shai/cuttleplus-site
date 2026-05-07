import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center ${className}`} aria-label="CuttlePlus Home">
      <Image
        src="/logo.png"
        alt="CuttlePlus"
        width={40}
        height={40}
        className="h-10 w-auto object-contain sm:h-9"
      />
    </Link>
  );
}
