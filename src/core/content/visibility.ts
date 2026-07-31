export type VisibilityState = "PRIVATE" | "UNLISTED" | "PUBLIC";
export type PublicationState = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export function appearsInPublicListing(status: PublicationState, visibility: VisibilityState) {
  return status === "PUBLISHED" && visibility === "PUBLIC";
}

export function canOpenByPublicSlug(status: PublicationState, visibility: VisibilityState) {
  return status === "PUBLISHED" && visibility !== "PRIVATE";
}
