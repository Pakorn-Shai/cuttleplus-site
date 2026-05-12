import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CmsShell } from "@/app/_components/cms-shell";
import { BrandingUploadForm } from "@/app/admin/theme/branding-upload-form";
import { ThemeSettingsForm } from "@/app/admin/theme/theme-settings-form";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  defaultThemeSettings,
  getOrCreateThemeSettings,
  heroStyleOptions,
  isValidHexColor,
  logoSizeOptions,
  normalizeThemeSettings,
  themeSettingPresets,
} from "@/lib/theme-settings";

export const metadata: Metadata = { title: "Theme Settings | Admin" };

const colorFieldNames = [
  "primaryColor",
  "accentColor",
  "backgroundColor",
  "textColor",
  "mutedTextColor",
  "cardBackgroundColor",
] as const;

const mainRevalidatePaths = ["/", "/blog", "/worksheets", "/game", "/admin/theme"];

function getString(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function getOptionalString(formData: FormData, name: string) {
  const value = getString(formData, name);
  return value || null;
}

function getColorOrFallback(formData: FormData, name: (typeof colorFieldNames)[number]) {
  const value = getString(formData, name);
  return isValidHexColor(value) ? value : defaultThemeSettings[name];
}

function getPresetOrFallback<T extends readonly string[]>(
  formData: FormData,
  name: string,
  options: T,
  fallback: T[number],
) {
  const value = getString(formData, name);
  return options.includes(value as T[number]) ? (value as T[number]) : fallback;
}

function validateThemeForm(formData: FormData) {
  const siteName = getString(formData, "siteName");
  if (!siteName) throw new Error("Site name is required.");

  return normalizeThemeSettings({
    siteName,
    siteDescription: getOptionalString(formData, "siteDescription") ?? undefined,
    logoSize: getPresetOrFallback(formData, "logoSize", logoSizeOptions, "medium"),
    primaryColor: getColorOrFallback(formData, "primaryColor"),
    accentColor: getColorOrFallback(formData, "accentColor"),
    backgroundColor: getColorOrFallback(formData, "backgroundColor"),
    textColor: getColorOrFallback(formData, "textColor"),
    mutedTextColor: getColorOrFallback(formData, "mutedTextColor"),
    cardBackgroundColor: getColorOrFallback(formData, "cardBackgroundColor"),
    contentWidth: getPresetOrFallback(formData, "contentWidth", themeSettingPresets.contentWidths, "1200px"),
    headerStyle: getPresetOrFallback(formData, "headerStyle", themeSettingPresets.headerStyles, "default"),
    cardRadius: getPresetOrFallback(formData, "cardRadius", themeSettingPresets.cardRadii, "16px"),
    showSiteName: formData.get("showSiteName") === "on",
    showLogo: formData.get("showLogo") === "on",
    showFooterBranding: formData.get("showFooterBranding") === "on",
    showHero: formData.get("showHero") === "on",
    heroTitle: getString(formData, "heroTitle"),
    heroSubtitle: getString(formData, "heroSubtitle"),
    heroButtonText: getString(formData, "heroButtonText"),
    heroButtonHref: getString(formData, "heroButtonHref"),
    heroStyle: getPresetOrFallback(formData, "heroStyle", heroStyleOptions, "gradient"),
    heroBackgroundImageUrl: getOptionalString(formData, "heroBackgroundImageUrl"),
    heroOverlay: formData.get("heroOverlay") === "on",
  });
}

function revalidateThemePaths() {
  for (const path of mainRevalidatePaths) revalidatePath(path);
}

async function saveThemeSettings(formData: FormData) {
  "use server";

  await requireAdmin();
  const data = validateThemeForm(formData);
  const id = getString(formData, "id");
  const updateData = {
    siteName: data.siteName,
    siteDescription: data.siteDescription,
    logoSize: data.logoSize,
    primaryColor: data.primaryColor,
    accentColor: data.accentColor,
    backgroundColor: data.backgroundColor,
    textColor: data.textColor,
    mutedTextColor: data.mutedTextColor,
    cardBackgroundColor: data.cardBackgroundColor,
    contentWidth: data.contentWidth,
    headerStyle: data.headerStyle,
    cardRadius: data.cardRadius,
    showSiteName: data.showSiteName,
    showLogo: data.showLogo,
    showFooterBranding: data.showFooterBranding,
    showHero: data.showHero,
    heroTitle: data.heroTitle,
    heroSubtitle: data.heroSubtitle,
    heroButtonText: data.heroButtonText,
    heroButtonHref: data.heroButtonHref,
    heroStyle: data.heroStyle,
    heroBackgroundImageUrl: data.heroBackgroundImageUrl,
    heroOverlay: data.heroOverlay,
  };

  if (id) {
    await prisma.siteSetting.update({ where: { id }, data: updateData });
  } else {
    await prisma.siteSetting.create({ data: updateData });
  }

  revalidateThemePaths();
  redirect("/admin/theme?saved=1");
}

type AdminThemeSettingsPageProps = {
  searchParams?: Promise<{ saved?: string }>;
};

export default async function AdminThemeSettingsPage({ searchParams }: AdminThemeSettingsPageProps) {
  await requireAdmin();
  const [settings, params] = await Promise.all([
    getOrCreateThemeSettings(),
    searchParams ?? Promise.resolve({} as { saved?: string }),
  ]);

  return (
    <CmsShell
      eyebrow="Admin"
      title="Theme Settings"
      description="Manage simple site branding, logo, favicon, colors, spacing, and visibility options."
      links={[{ href: "/admin/dashboard", label: "Back to dashboard" }]}
    >
      <div className="space-y-8">
        {params.saved === "1" ? (
          <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
            Settings saved successfully.
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <BrandingUploadForm kind="logo" currentUrl={settings.logoUrl} publicId={settings.logoPublicId} />
          <BrandingUploadForm kind="favicon" currentUrl={settings.faviconUrl} publicId={settings.faviconPublicId} />
        </div>

        <ThemeSettingsForm settings={settings} action={saveThemeSettings} />
      </div>
    </CmsShell>
  );
}