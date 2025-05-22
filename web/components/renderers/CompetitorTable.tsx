import React from "react";
import { Card, CardContent } from "@/components/ui/Card";

interface CompetitorRow {
  handle: string;
  positioning: string;
  tone: string;
  estimated_followers: number;
  content_notes?: string;
}

interface Props {
  data: {
    competitors: CompetitorRow[];
    differentiation_summary: string;
  };
}

export function CompetitorTable({ data }: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-2">Differentiation Insight</h3>
          <p>{data.differentiation_summary}</p>
        </CardContent>
      </Card>

      <table className="w-full text-sm">
        <thead className="text-left border-b">
          <tr>
            <th>Handle</th>
            <th>Positioning</th>
            <th>Tone</th>
            <th className="text-right">Followers</th>
          </tr>
        </thead>
        <tbody>
          {data.competitors.map((c) => (
            <tr key={c.handle} className="border-b last:border-none">
              <td>{c.handle}</td>
              <td>{c.positioning}</td>
              <td>{c.tone}</td>
              <td className="text-right">
                {c.estimated_followers.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}