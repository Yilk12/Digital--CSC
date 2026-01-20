-- CreateTable
CREATE TABLE "PlanReport" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "reportingFrequency" "ReportFrequency"[] DEFAULT ARRAY[]::"ReportFrequency"[],
    "keyTasksCompletedThisWeek" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "progressVsGoals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "majorChallengesAndResolutions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "teamCollaborationHighlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "performanceMetrics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "learningOrInsights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "planForNextWeek" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "teamLeaderComment" TEXT,
    "departmentHeadComment" TEXT,
    "teamLeaderApproved" BOOLEAN NOT NULL DEFAULT false,
    "departmentHeadApproved" BOOLEAN NOT NULL DEFAULT false,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanReport_planId_idx" ON "PlanReport"("planId");

-- CreateIndex
CREATE INDEX "PlanReport_userId_idx" ON "PlanReport"("userId");

-- AddForeignKey
ALTER TABLE "PlanReport" ADD CONSTRAINT "PlanReport_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanReport" ADD CONSTRAINT "PlanReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
