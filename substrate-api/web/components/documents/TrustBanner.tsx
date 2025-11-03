"use client"

import React from 'react'
import { Badge } from '../ui/Badge'

interface TrustBannerProps {
  provenance_percentage: number
  freshness_score: number
  coverage_percentage: number
  raw_gaps_used?: boolean
  processing_time_ms?: number
  substrate_count?: number
  className?: string
}

export default function TrustBanner({
  provenance_percentage,
  freshness_score,
  coverage_percentage,
  raw_gaps_used = false,
  processing_time_ms,
  substrate_count,
  className = ""
}: TrustBannerProps) {
  
  const formatPercentage = (value: number) => `${(value * 100).toFixed(0)}%`
  const formatScore = (value: number) => value.toFixed(1)
  
  // Calculate overall quality score
  const overall_score = (provenance_percentage + freshness_score + coverage_percentage) / 3
  
  const getQualityIndicator = (score: number) => {
    if (score >= 0.8) return { 
      label: 'High Quality', 
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '✓'
    }
    if (score >= 0.6) return { 
      label: 'Good Quality', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '!'
    }
    return { 
      label: 'Needs Review', 
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: '⚠'
    }
  }
  
  const quality = getQualityIndicator(overall_score)
  
  return (
    <div className={`p-3 rounded-lg border ${quality.color} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{quality.icon}</span>
            <span className="font-medium">{quality.label}</span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <span className="text-gray-600">Coverage:</span>
              <span className="font-medium">{formatPercentage(coverage_percentage)}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <span className="text-gray-600">Freshness:</span>
              <span className="font-medium">{formatScore(freshness_score)}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <span className="text-gray-600">Provenance:</span>
              <span className="font-medium">{formatPercentage(provenance_percentage)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {substrate_count && (
            <Badge variant="outline" className="text-xs">
              {substrate_count} sources
            </Badge>
          )}
          
          {raw_gaps_used && (
            <Badge className="bg-orange-100 text-orange-800 text-xs">
              Gap-fill used
            </Badge>
          )}
          
          {processing_time_ms && (
            <span className="text-xs text-gray-500">
              {processing_time_ms}ms
            </span>
          )}
        </div>
      </div>
    </div>
  )
}