import React from "react";
import { notFound } from "next/navigation";
import { getTestResultsAction } from "@/app/dashboard/lms/actions";
import { TestResultsView } from "./_components/test-results-view";

interface TestResultsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TestResultsPage({ params }: TestResultsPageProps) {
  const { id } = await params;
  const res = await getTestResultsAction(id);

  if (!res.success || !res.test || !res.questions || !res.studentsResults) {
    return (
      <div className="p-6 text-center space-y-3">
        <h2 className="text-base font-bold text-destructive">Ошибка при загрузке результатов</h2>
        <p className="text-xs text-muted-foreground">{res.error || "Тест не найден или нет доступа"}</p>
      </div>
    );
  }

  return (
    <TestResultsView
      test={res.test}
      questions={res.questions}
      studentsResults={res.studentsResults}
    />
  );
}
