import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/core/site/settings";

/**
 * Check if the monthly AI budget has been exceeded.
 * Throws if budget is set (>0) and usage has reached or exceeded the limit.
 */
export async function checkBudget(): Promise<void> {
  const settings = await getSiteSettings();
  if (settings.aiMonthlyBudgetUsd <= 0) return; // No budget set
  if (settings.aiUsageThisMonthUsd >= settings.aiMonthlyBudgetUsd) {
    throw new Error("AI_BUDGET_EXCEEDED");
  }
}

/**
 * Track AI usage cost by incrementing the monthly usage counter.
 * Should be called after a successful AI job completion.
 */
export async function trackUsage(costUsd: number): Promise<void> {
  if (costUsd <= 0) return;
  const settings = await getSiteSettings();
  const newUsage = settings.aiUsageThisMonthUsd + costUsd;
  await prisma.siteSetting.upsert({
    where: { key: "aiUsageThisMonthUsd" },
    update: { valueJson: newUsage },
    create: { key: "aiUsageThisMonthUsd", valueJson: newUsage },
  });
}
