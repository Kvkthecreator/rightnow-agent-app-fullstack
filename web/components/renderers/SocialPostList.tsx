"use client";
import React from "react";
import { Card } from "@/components/ui/Card";

interface Post {
  title: string;
  content: string;
}
interface Props {
  data: {
    posts: Post[];
  };
}

export function SocialPostList({ data }: Props) {
  return (
    <Card className="bg-card text-card-foreground rounded-2xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Social Posts</h2>
      <div className="space-y-4">
        {data.posts.map((post, idx) => (
          <div key={idx}>
            <h3 className="text-lg font-semibold">{post.title}</h3>
            <p className="text-base">{post.content}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}