import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOwnerSession } from "@/lib/auth";
import { getSiteSettings } from "@/core/site/settings";

export async function GET() {
  const session = await getOwnerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [totals, byStatus, byModel, recentFailures, dailyUsage, settings] = await Promise.all([
    prisma.aIJob.aggregate({
      _count: { id: true },
      _sum: { inputTokens: true, outputTokens: true, estimatedCost: true },
    }),
    prisma.aIJob.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.aIJob.groupBy({
      by: ["model"],
      _count: { id: true },
      _sum: { inputTokens: true, outputTokens: true, estimatedCost: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.aIJob.findMany({
      where: { status: "FAILED" },
      select: { id: true, model: true, jobType: true, errorMessage: true, createdAt: true, content: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.aIJob.groupBy({
      by: ["createdAt"],
      _count: { id: true },
      _sum: { inputTokens: true, outputTokens: true, estimatedCost: true },
      orderBy: { createdAt: "asc" },
    }),
    getSiteSettings(),
  ]);

  const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count.id]));
  const totalJobs = totals._count.id;
  const completedJobs = statusMap.COMPLETED ?? 0;
  const failedJobs = statusMap.FAILED ?? 0;
  const successRate = totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(1) : "0.0";

  // Aggregate daily usage into date-keyed map
  const dailyMap = new Map<string, { jobs: number; inputTokens: number; outputTokens: number; cost: number }>();
  for (const day of dailyUsage) {
    const dateKey = day.createdAt.toISOString().slice(0, 10);
    const existing = dailyMap.get(dateKey) ?? { jobs: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
    existing.jobs += day._count.id;
    existing.inputTokens += day._sum.inputTokens ?? 0;
    existing.outputTokens += day._sum.outputTokens ?? 0;
    existing.cost += Number(day._sum.estimatedCost ?? 0);
    dailyMap.set(dateKey, existing);
  }
  const daily = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  const monthlyBudget = settings.aiMonthlyBudgetUsd;
  const usageThisMonth = settings.aiUsageThisMonthUsd;
  const budgetPercent = monthlyBudget > 0 ? Math.min(100, Math.round((usageThisMonth / monthlyBudget) * 100)) : 0;
  const budgetWarning = monthlyBudget > 0 && usageThisMonth >= monthlyBudget * 0.8;

  return NextResponse.json({
    totals: {
      jobs: totalJobs,
      inputTokens: totals._sum.inputTokens ?? 0,
      outputTokens: totals._sum.outputTokens ?? 0,
      estimatedCost: Number(totals._sum.estimatedCost ?? 0),
    },
    successRate: `${successRate}%`,
    completedJobs,
    failedJobs,
    queuedJobs: statusMap.QUEUED ?? 0,
    runningJobs: statusMap.RUNNING ?? 0,
    cancelledJobs: statusMap.CANCELLED ?? 0,
    byModel: byModel.map((m) => ({
      model: m.model,
      jobs: m._count.id,
      inputTokens: m._sum.inputTokens ?? 0,
      outputTokens: m._sum.outputTokens ?? 0,
      estimatedCost: Number(m._sum.estimatedCost ?? 0),
    })),
    recentFailures: recentFailures.map((f) => ({
      id: f.id,
      model: f.model,
      jobType: f.jobType,
      errorMessage: f.errorMessage,
      createdAt: f.createdAt.toISOString(),
      contentTitle: f.content?.title ?? null,
    })),
    daily,
    budget: {
      monthlyLimit: monthlyBudget,
      usageThisMonth,
      percent: budgetPercent,
      warning: budgetWarning,
    },
  });
}