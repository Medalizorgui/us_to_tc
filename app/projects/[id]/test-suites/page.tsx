"use client"

import { TestSuiteList } from "@/app/components/test-suite-list"
import { useParams } from "next/navigation"

export default function TestSuitesPage() {
  const params = useParams();
  const id = params?.id as string; // safely cast

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Test Suites</h1>
      </div>
      <TestSuiteList />
    </div>
  )
}
