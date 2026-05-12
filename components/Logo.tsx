import Image from "next/image";
import Link from "next/link";
import type { LogoSize } from "@/lib/theme-settings";

interface LogoProps {
  className?: string;
  logoUrl?: string | null;
  logoSize?: LogoSize;
  showLogo?: boolean;
  showSiteName?: boolean;
  siteName?: string;
}

const logoSizeClassNames: Record<LogoSize, string> = {
  small: "h-8",
  medium: "h-10 sm:h-9",
  large: "h-12 sm:h-11",
};

export function Logo({
  className = "",
  logoUrl,
  logoSize = "medium",
  showLogo = true,
  showSiteName = false,
  siteName = "CuttlePlus",
}: LogoProps) {
  const shouldShowLogo = showLogo && Boolean(logoUrl);
  const shouldShowFallbackLogo = showLogo && !logoUrl;
  const logoClassName = `${logoSizeClassNames[logoSize] ?? logoSizeClassNames.medium} w-auto max-w-[160px] object-contain`;

  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`} aria-label={`${siteName} Home`}>
      {shouldShowLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl ?? undefined}
          alt={siteName}
          className={logoClassName}
        />
      ) : shouldShowFallbackLogo ? (
        <Image
          src="/logo.png"
          alt={siteName}
          width={40}
          height={40}
          className={logoClassName}
        />
      ) : null}
      {showSiteName ? (
        <span className="text-base font-bold tracking-tight text-foreground sm:text-lg">
          {siteName}
        </span>
      ) : null}
    </Link>
  );
}
