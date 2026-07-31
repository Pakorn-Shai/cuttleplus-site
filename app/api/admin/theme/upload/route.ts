import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultThemeSettings } from "@/lib/theme-settings";
import {
  type BrandingUploadKind,
  uploadBrandingFileToCloudinary,
  validateBrandingUploadFile,
} from "@/lib/branding-upload";

const revalidatePaths = ["/", "/blog", "/worksheets", "/game", "/admin/theme"];

function isBrandingUploadKind(value: FormDataEntryValue | null): value is BrandingUploadKind {
  return value === "logo" || value === "favicon";
}

function revalidateThemePaths() {
  for (const path of revalidatePaths) {
    revalidatePath(path);
  }
}

async function getOrCreateSiteSettingId() {
  const existing = await prisma.siteSetting.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (existing) return existing.id;

  const created = await prisma.siteSetting.create({
    data: {
      siteName: defaultThemeSettings.siteName,
      siteDescription: defaultThemeSettings.siteDescription,
    },
    select: { id: true },
  });

  return created.id;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const kind = formData.get("kind");
    const file = formData.get("file");

    if (!isBrandingUploadKind(kind)) {
      return NextResponse.json({ error: "Upload kind must be logo or favicon." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please choose a file to upload." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = validateBrandingUploadFile(file, buffer, kind);

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const uploaded = await uploadBrandingFileToCloudinary(file, buffer, kind);
    const id = await getOrCreateSiteSettingId();

    const updated = await prisma.siteSetting.update({
      where: { id },
      data:
        kind === "logo"
          ? { logoUrl: uploaded.url, logoPublicId: uploaded.publicId }
          : { faviconUrl: uploaded.url, faviconPublicId: uploaded.publicId },
      select: {
        logoUrl: true,
        logoPublicId: true,
        faviconUrl: true,
        faviconPublicId: true,
      },
    });

    revalidateThemePaths();

    return NextResponse.json({
      ok: true,
      kind,
      url: kind === "logo" ? updated.logoUrl : updated.faviconUrl,
      publicId: kind === "logo" ? updated.logoPublicId : updated.faviconPublicId,
      dimensions: validation.dimensions ?? null,
    });
  } catch (error) {
    console.error("Branding upload failed", error);
    return NextResponse.json(
      { error: "Upload failed. Please check the file and upload settings, then try again." },
      { status: 500 },
    );
  }
}