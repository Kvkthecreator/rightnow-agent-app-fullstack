"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { fetchWithToken } from "@/lib/fetchWithToken";

interface Document {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  wordCount: number;
  basketId: string;
}

export function useBasketDocuments(basketId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    basketId ? `/api/documents?basketId=${basketId}` : null,
    async (url: string) => {
      const response = await fetchWithToken(url);
      if (!response.ok) throw new Error('Failed to fetch documents');
      const result = await response.json();
      // API returns array directly, not wrapped in documents property
      return Array.isArray(result) ? result : [];
    }
  );

  const createDocument = async (title: string, content: string = '') => {
    try {
      const response = await fetchWithToken(`/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          content, 
          basketId // Include basketId to associate with this basket
        })
      });

      if (!response.ok) throw new Error('Failed to create document');
      
      const newDocument = await response.json();
      mutate(); // Refresh the list
      return newDocument;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  };

  const updateDocument = async (documentId: string, updates: Partial<Document>) => {
    try {
      const response = await fetchWithToken(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update document');
      
      mutate(); // Refresh the list
      return await response.json();
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  };

  return {
    documents: data || [],
    isLoading,
    error,
    createDocument,
    updateDocument,
    refresh: mutate
  };
}