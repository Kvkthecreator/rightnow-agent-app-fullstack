"use client"

import React, { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

interface SubstrateReference {
  id: string
  type: 'block' | 'context_item' | 'dump' | 'relationship'
  title: string
  content: string
  role: 'primary' | 'supporting'
  weight: number
  selection_reason?: string
  freshness_score?: number
  confidence_score?: number
}

interface CompositionMetrics {
  coverage_percentage: number
  freshness_score: number
  provenance_percentage: number
  candidates_found: Record<string, number>
  candidates_selected: Record<string, number>
  processing_time_ms: number
  raw_gaps_used: boolean
}

interface ExplainPanelProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  substrates: SubstrateReference[]
  metrics: CompositionMetrics
  compositionSummary?: string
}

export default function ExplainPanel({
  isOpen,
  onClose,
  documentId,
  substrates,
  metrics,
  compositionSummary
}: ExplainPanelProps) {
  const [activeTab, setActiveTab] = useState<'sources' | 'metrics' | 'reasoning'>('sources')
  
  if (!isOpen) return null

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`
  const formatScore = (value: number) => value.toFixed(2)

  const getTypeColor = (type: string) => {
    const colors = {
      block: 'bg-blue-100 text-blue-800',
      context_item: 'bg-green-100 text-green-800', 
      dump: 'bg-yellow-100 text-yellow-800',
      relationship: 'bg-purple-100 text-purple-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getRoleColor = (role: string) => {
    return role === 'primary' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'
  }

  const getQualityIndicator = (metrics: CompositionMetrics) => {
    const avgScore = (metrics.coverage_percentage + metrics.freshness_score + metrics.provenance_percentage) / 3
    if (avgScore >= 0.8) return { label: 'High', color: 'text-green-600' }
    if (avgScore >= 0.6) return { label: 'Good', color: 'text-yellow-600' }
    return { label: 'Needs Review', color: 'text-red-600' }
  }

  const quality = getQualityIndicator(metrics)

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={onClose}>
      <div className="fixed right-0 top-0 h-full w-1/2 bg-white shadow-xl overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Document Explanation</h2>
              <p className="text-sm text-gray-600">How this document was composed</p>
            </div>
            <Button onClick={onClose} variant="outline" size="sm">×</Button>
          </div>

          {/* Trust Banner */}
          <Card className="mb-6 p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">Composition Quality</h3>
                <p className="text-sm text-blue-700">
                  {substrates.length} sources • {formatPercentage(metrics.coverage_percentage)} coverage • {quality.label} quality
                </p>
              </div>
              <div className={`text-2xl font-bold ${quality.color}`}>
                {quality.label}
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6">
            {[
              { id: 'sources', label: 'Sources' },
              { id: 'metrics', label: 'Metrics' },
              { id: 'reasoning', label: 'Reasoning' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab === 'sources' && (
            <div className="space-y-4">
              <h3 className="font-medium mb-3">Substrate Sources ({substrates.length})</h3>
              {substrates.map((substrate, index) => (
                <Card key={substrate.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={getTypeColor(substrate.type)}>
                        {substrate.type}
                      </Badge>
                      <Badge className={getRoleColor(substrate.role)}>
                        {substrate.role}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Weight: {substrate.weight.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      #{index + 1}
                    </div>
                  </div>
                  <h4 className="font-medium text-sm mb-1">{substrate.title}</h4>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {substrate.content}
                  </p>
                  {substrate.selection_reason && (
                    <p className="text-xs text-blue-600 italic">
                      "{substrate.selection_reason}"
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    {substrate.freshness_score !== undefined && (
                      <span>Freshness: {formatScore(substrate.freshness_score)}</span>
                    )}
                    {substrate.confidence_score !== undefined && (
                      <span>Confidence: {formatScore(substrate.confidence_score)}</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-4">
              <h3 className="font-medium mb-3">Composition Metrics</h3>
              
              {/* Quality Scores */}
              <Card className="p-4">
                <h4 className="font-medium mb-3">Quality Scores</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Coverage</p>
                    <p className="text-lg font-semibold">{formatPercentage(metrics.coverage_percentage)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Freshness</p>
                    <p className="text-lg font-semibold">{formatScore(metrics.freshness_score)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Provenance</p>
                    <p className="text-lg font-semibold">{formatPercentage(metrics.provenance_percentage)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Processing Time</p>
                    <p className="text-lg font-semibold">{metrics.processing_time_ms}ms</p>
                  </div>
                </div>
              </Card>

              {/* Source Breakdown */}
              <Card className="p-4">
                <h4 className="font-medium mb-3">Source Breakdown</h4>
                <div className="space-y-2">
                  {Object.entries(metrics.candidates_found).map(([type, found]) => {
                    const selected = metrics.candidates_selected[type] || 0
                    return (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{selected} of {found}</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${found > 0 ? (selected / found) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* Flags */}
              {metrics.raw_gaps_used && (
                <Card className="p-4 bg-yellow-50 border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-1">Gap-fill Used</h4>
                  <p className="text-sm text-yellow-700">
                    Raw content was added to fill coverage gaps according to the gaps-only policy.
                  </p>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'reasoning' && (
            <div className="space-y-4">
              <h3 className="font-medium mb-3">Composition Reasoning</h3>
              
              {compositionSummary && (
                <Card className="p-4">
                  <h4 className="font-medium mb-2">AI Summary</h4>
                  <p className="text-sm text-gray-700">{compositionSummary}</p>
                </Card>
              )}

              <Card className="p-4">
                <h4 className="font-medium mb-2">Selection Strategy</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p>• Applied 90-day recency filter for freshness</p>
                  <p>• Used retrieval budgets to prevent context overflow</p>
                  <p>• Prioritized structured substrate (blocks, context items) over raw content</p>
                  {metrics.raw_gaps_used && <p>• Added raw content to fill coverage gaps</p>}
                  <p>• Applied MMR diversity scoring for balanced selection</p>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium mb-2">Phase 1 Improvements</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>✅ Retrieval budgets and per-type caps</p>
                  <p>✅ Coverage analysis and freshness scoring</p>
                  <p>✅ Gaps-only raw policy with token limits</p>
                  <p>✅ Comprehensive composition metrics</p>
                </div>
              </Card>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t">
            <p className="text-xs text-gray-500">
              Document ID: {documentId} • Generated with Phase 1 P4 improvements
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}