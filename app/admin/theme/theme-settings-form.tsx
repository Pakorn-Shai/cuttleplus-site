"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { HeroStyle, ThemeSettings } from "@/lib/theme-settings";

type ThemeSettingsFormProps = {
  settings: ThemeSettings;
  action: (formData: FormData) => void | Promise<void>;
};

const hexColorPattern = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function toColorPickerValue(value: string) {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const [, r, g, b] = value;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return "#000000";
}

const colorFields = [
  ["Primary color", "primaryColor", "Main brand color for buttons, links, and highlights."],
  ["Accent color", "accentColor", "Secondary accent color for badges and subtle highlights."],
  ["Background color", "backgroundColor", "Main page background."],
  ["Text color", "textColor", "Main text color."],
  ["Muted text color", "mutedTextColor", "Secondary text color for descriptions."],
  ["Card background color", "cardBackgroundColor", "Card and panel background."],
] as const;

type ColorFieldName = (typeof colorFields)[number][1];

const contentWidthOptions = [
  { label: "Compact — 960px", value: "960px" },
  { label: "Standard — 1200px", value: "1200px" },
  { label: "Wide — 1440px", value: "1440px" },
];

const cardRadiusOptions = [
  { label: "Sharp — 0px", value: "0px" },
  { label: "Soft — 12px", value: "12px" },
  { label: "Rounded — 16px", value: "16px" },
  { label: "Extra rounded — 24px", value: "24px" },
];

const headerStyleOptions = [
  { label: "Default — current navigation layout", value: "default" },
  { label: "Minimal — saved for future simpler header style", value: "minimal" },
];

const logoSizeSelectOptions = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];

const heroStyleSelectOptions = [
  { label: "Gradient — uses primary and accent colors", value: "gradient" },
  { label: "Solid — uses primary color", value: "solid" },
  { label: "Image — uses background image URL", value: "image" },
  { label: "Minimal — clean white/simple hero", value: "minimal" },
] as const;

function SelectCard({ label, name, defaultValue, options, help }: {
  label: string;
  name: string;
  defaultValue: string;
  options: { label: string; value: string }[];
  help: string;
}) {
  return (
    <label className="grid min-w-0 gap-2 rounded-xl border border-border bg-background/70 p-4 text-sm font-medium">
      <span>{label}</span>
      <select name={name} defaultValue={defaultValue} className="min-w-0 w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <span className="text-xs font-normal leading-5 text-muted">{help}</span>
    </label>
  );
}

function ColorInput({ label, name, value, description, onChange }: {
  label: string;
  name: ColorFieldName;
  value: string;
  description: string;
  onChange: (name: ColorFieldName, value: string) => void;
}) {
  const isValid = hexColorPattern.test(value);

  return (
    <div className="grid gap-2 rounded-xl border border-border bg-background/70 p-4 text-sm font-medium">
      <span>{label}</span>
      <span className="text-xs font-normal leading-5 text-muted">{description}</span>
      <div className="flex flex-wrap items-center gap-3">
        <input type="color" value={toColorPickerValue(value)} onChange={(event) => onChange(name, event.target.value)} className="h-10 w-14 cursor-pointer rounded border border-border bg-background p-1" />
        <input name={name} value={value} onChange={(event) => onChange(name, event.target.value)} className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-xs uppercase" placeholder="#0f766e" />
        <span className="h-8 w-8 rounded-full border border-border" style={{ backgroundColor: isValid ? value : "transparent" }} />
      </div>
      {!isValid ? <span className="text-xs font-normal text-red-700">Use a valid hex color, for example #0f766e.</span> : null}
    </div>
  );
}

type HeroDraft = {
  showHero: boolean;
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroButtonHref: string;
  heroStyle: HeroStyle;
  heroBackgroundImageUrl: string;
  heroOverlay: boolean;
};

function normalizePreviewHero(draft: HeroDraft, settings: ThemeSettings) {
  const hasImage = draft.heroBackgroundImageUrl.trim().length > 0;
  return {
    ...draft,
    heroTitle: draft.heroTitle.trim() || settings.heroTitle,
    heroSubtitle: draft.heroSubtitle.trim() || settings.heroSubtitle,
    heroButtonText: draft.heroButtonText.trim() || settings.heroButtonText,
    heroButtonHref: draft.heroButtonHref.trim() || settings.heroButtonHref,
    heroStyle: draft.heroStyle === "image" && !hasImage ? "gradient" : draft.heroStyle,
  };
}

function HeroPreview({ settings, colors, hero }: {
  settings: ThemeSettings;
  colors: Record<ColorFieldName, string>;
  hero: HeroDraft;
}) {
  const safe = Object.fromEntries(
    Object.entries(colors).map(([key, value]) => [key, hexColorPattern.test(value) ? value : settings[key as ColorFieldName]]),
  ) as Record<ColorFieldName, string>;
  const preview = normalizePreviewHero(hero, settings);
  const heroStyle: CSSProperties = preview.heroStyle === "solid"
    ? { backgroundColor: safe.primaryColor, color: "#ffffff" }
    : preview.heroStyle === "image"
      ? {
          backgroundImage: `url(${preview.heroBackgroundImageUrl})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          color: "#ffffff",
        }
      : preview.heroStyle === "minimal"
        ? { backgroundColor: safe.cardBackgroundColor, color: safe.textColor }
        : { background: `linear-gradient(135deg, ${safe.primaryColor}, ${safe.accentColor})`, color: "#ffffff" };
  const buttonStyle = preview.heroStyle === "minimal"
    ? { backgroundColor: safe.primaryColor, color: "#ffffff" }
    : { backgroundColor: safe.cardBackgroundColor, color: safe.primaryColor };

  if (!preview.showHero) {
    return (
      <section className="rounded-xl border border-border bg-surface/70 p-5">
        <h2 className="text-lg font-semibold">Hero Preview</h2>
        <p className="mt-1 text-sm text-muted">Hero is currently hidden on the homepage.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-surface/70 p-5">
      <h2 className="text-lg font-semibold">Hero Preview</h2>
      <p className="mt-1 text-sm text-muted">Preview updates as you edit hero fields and colors.</p>
      <div className="mt-4 overflow-hidden border shadow-sm" style={{ backgroundColor: safe.backgroundColor, color: safe.textColor, borderColor: safe.mutedTextColor, borderRadius: settings.cardRadius }}>
        <div className="flex items-center justify-between border-b px-4 py-3 text-sm font-semibold" style={{ borderColor: safe.mutedTextColor }}>
          <span>{settings.siteName}</span><span style={{ color: safe.mutedTextColor }}>{preview.heroStyle} hero</span>
        </div>
        <div className="relative overflow-hidden p-5" style={heroStyle}>
          {preview.heroStyle === "image" && preview.heroOverlay ? <div className="absolute inset-0 bg-black/45" /> : null}
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">Hero / Banner</p>
            <h3 className="mt-2 text-2xl font-bold">{preview.heroTitle}</h3>
            <p className="mt-2 max-w-xl text-sm opacity-90">{preview.heroSubtitle}</p>
            <button type="button" className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm" style={buttonStyle}>{preview.heroButtonText}</button>
            <p className="mt-2 text-xs opacity-75">Button link: {preview.heroButtonHref}</p>
          </div>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="border p-4" style={{ backgroundColor: safe.cardBackgroundColor, borderColor: safe.mutedTextColor, borderRadius: settings.cardRadius }}>
            <p className="text-sm font-semibold">Card preview</p>
            <p className="mt-2 text-sm" style={{ color: safe.mutedTextColor }}>This muted description uses your secondary text color.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: safe.accentColor }}>Accent badge</span>
            <span className="text-sm font-semibold" style={{ color: safe.primaryColor }}>Link preview</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ThemeSettingsForm({ settings, action }: ThemeSettingsFormProps) {
  const [colors, setColors] = useState<Record<ColorFieldName, string>>({
    primaryColor: settings.primaryColor,
    accentColor: settings.accentColor,
    backgroundColor: settings.backgroundColor,
    textColor: settings.textColor,
    mutedTextColor: settings.mutedTextColor,
    cardBackgroundColor: settings.cardBackgroundColor,
  });
  const [hero, setHero] = useState<HeroDraft>({
    showHero: settings.showHero,
    heroTitle: settings.heroTitle,
    heroSubtitle: settings.heroSubtitle,
    heroButtonText: settings.heroButtonText,
    heroButtonHref: settings.heroButtonHref,
    heroStyle: settings.heroStyle,
    heroBackgroundImageUrl: settings.heroBackgroundImageUrl ?? "",
    heroOverlay: settings.heroOverlay,
  });

  const updateColor = (name: ColorFieldName, value: string) => setColors((current) => ({ ...current, [name]: value.trim() }));
  const updateHeroText = (name: keyof Pick<HeroDraft, "heroTitle" | "heroSubtitle" | "heroButtonText" | "heroButtonHref" | "heroBackgroundImageUrl">, value: string) => {
    setHero((current) => ({ ...current, [name]: value }));
  };

  return (
    <>
      <HeroPreview settings={settings} colors={colors} hero={hero} />
      <form action={action} className="space-y-8">
        <input type="hidden" name="id" value={settings.id ?? ""} />
        <input type="hidden" name="contentWidth" value={settings.contentWidth} />
        <input type="hidden" name="cardRadius" value={settings.cardRadius} />
        <input type="hidden" name="headerStyle" value={settings.headerStyle} />
        <section className="grid gap-4 rounded-xl border border-border bg-surface/70 p-5 md:grid-cols-2">
          <div className="md:col-span-2"><h2 className="text-lg font-semibold">Branding</h2><p className="mt-1 text-sm text-muted">Edit public site name and description. Logo and favicon uploads are handled above and saved immediately.</p></div>
          <label className="grid gap-1 text-sm font-medium">Site name<input name="siteName" required defaultValue={settings.siteName} className="rounded-md border border-border bg-background px-3 py-2 text-sm" /></label>
          <label className="grid gap-1 text-sm font-medium">Site description<input name="siteDescription" defaultValue={settings.siteDescription} className="rounded-md border border-border bg-background px-3 py-2 text-sm" /></label>
          <SelectCard label="Logo display size" name="logoSize" defaultValue={settings.logoSize} options={logoSizeSelectOptions} help="Controls the logo height in the public navbar without changing the uploaded file." />
        </section>
        <section className="grid gap-4 rounded-xl border border-border bg-surface/70 p-5 md:grid-cols-2 xl:grid-cols-3">
          <div className="md:col-span-2 xl:col-span-3"><h2 className="text-lg font-semibold">Brand &amp; Site Colors</h2><p className="mt-1 text-sm text-muted">These colors control the main look of your site, including buttons, text, cards, and hero/banner accents.</p></div>
          {colorFields.map(([label, name, description]) => <ColorInput key={name} label={label} name={name} description={description} value={colors[name]} onChange={updateColor} />)}
          <div className="rounded-lg border border-dashed border-border bg-background/60 p-4 text-sm text-muted md:col-span-2 xl:col-span-3">Gradient hero uses the primary and accent colors. Solid hero uses primary color.</div>
        </section>
        <section className="grid gap-4 rounded-xl border border-border bg-surface/70 p-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold">Hero / Banner</h2>
            <p className="mt-1 text-sm text-muted">Manage the homepage hero content and background style.</p>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
            <input name="showHero" type="checkbox" checked={hero.showHero} onChange={(event) => setHero((current) => ({ ...current, showHero: event.target.checked }))} />
            Show hero on homepage
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Hero title
            <input name="heroTitle" value={hero.heroTitle} onChange={(event) => updateHeroText("heroTitle", event.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Hero subtitle
            <input name="heroSubtitle" value={hero.heroSubtitle} onChange={(event) => updateHeroText("heroSubtitle", event.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Button text
            <input name="heroButtonText" value={hero.heroButtonText} onChange={(event) => updateHeroText("heroButtonText", event.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Button link
            <input name="heroButtonHref" value={hero.heroButtonHref} onChange={(event) => updateHeroText("heroButtonHref", event.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="/blog" />
            <span className="text-xs font-normal text-muted">Must start with /, http://, or https://.</span>
          </label>
          <label className="grid gap-2 rounded-xl border border-border bg-background/70 p-4 text-sm font-medium">
            <span>Hero style</span>
            <select name="heroStyle" value={hero.heroStyle} onChange={(event) => setHero((current) => ({ ...current, heroStyle: event.target.value as HeroStyle }))} className="min-w-0 w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
              {heroStyleSelectOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <span className="text-xs font-normal leading-5 text-muted">Choose gradient, solid, image, or minimal homepage hero styling.</span>
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Background image URL/path
            <input name="heroBackgroundImageUrl" value={hero.heroBackgroundImageUrl} onChange={(event) => updateHeroText("heroBackgroundImageUrl", event.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="/hero.jpg or https://..." />
            <span className="text-xs font-normal text-muted">Hero image upload can be added later. For now, use an image URL or project path.</span>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
            <input name="heroOverlay" type="checkbox" checked={hero.heroOverlay} onChange={(event) => setHero((current) => ({ ...current, heroOverlay: event.target.checked }))} />
            Overlay checkbox
          </label>
        </section>
        <p className="rounded-xl border border-dashed border-border bg-surface/60 p-4 text-sm text-muted">
          Advanced layout controls will be added later.
        </p>
        <section className="space-y-3 rounded-xl border border-border bg-surface/70 p-5">
          <h2 className="text-lg font-semibold">Visibility</h2>
          <label className="flex items-center gap-2 text-sm font-medium"><input name="showSiteName" type="checkbox" defaultChecked={settings.showSiteName} />Show site name in navbar</label>
          <label className="flex items-center gap-2 text-sm font-medium"><input name="showLogo" type="checkbox" defaultChecked={settings.showLogo} />Show logo when logoUrl is available</label>
          <label className="flex items-center gap-2 text-sm font-medium"><input name="showFooterBranding" type="checkbox" defaultChecked={settings.showFooterBranding} />Show footer branding</label>
        </section>
        <button type="submit" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">Save Theme Settings</button>
      </form>
    </>
  );
}