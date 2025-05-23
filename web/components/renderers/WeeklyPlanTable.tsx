"use client";
import React from "react";
import { Card } from "@/components/ui/Card";

interface Props {
  data: {
    headers: string[];
    rows: any[][];
  };
}

export function WeeklyPlanTable({ data }: Props) {
  return (
    <Card className="bg-card text-card-foreground rounded-2xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Weekly Plan</h2>
      <table className="w-full border border-border">
        <thead>
          <tr>
            {data.headers.map((header) => (
              <th key={header} className="p-2 text-left border-b border-border">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-none">
              {row.map((cell, j) => (
                <td key={j} className="p-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}