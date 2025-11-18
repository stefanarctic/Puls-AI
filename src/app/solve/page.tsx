'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SolveProblemForm from '@/components/solve-problem-form';

export default function SolvePhysicsProblemPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Rezolvă Problema de Fizică</CardTitle>
          <CardDescription>
            Introdu textul sau imaginea problemei și vei primi o soluție detaliată.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SolveProblemForm />
        </CardContent>
      </Card>
    </div>
  );
} 