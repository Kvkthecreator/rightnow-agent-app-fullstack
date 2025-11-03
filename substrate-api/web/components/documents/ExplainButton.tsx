"use client"

import React, { useState } from 'react'
import { Button } from '../ui/Button'
import ExplainPanel from './ExplainPanel'

interface ExplainButtonProps {
  documentId: string
  substrates?: any[]
  metrics?: any
  compositionSummary?: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export default function ExplainButton({
  documentId,
  substrates = [],
  metrics = {},
  compositionSummary,
  className = "",
  variant = "outline",
  size = "sm"
}: ExplainButtonProps) {
  const [showExplain, setShowExplain] = useState(false)
  
  const hasMetrics = metrics && Object.keys(metrics).length > 0
  
  return (
    <>
      <Button
        onClick={() => setShowExplain(true)}
        variant={variant}
        size={size}
        className={`${className} ${!hasMetrics ? 'opacity-50' : ''}`}
        disabled={!hasMetrics}
      >
        <span className="mr-1">📊</span>
        Explain
      </Button>
      
      {showExplain && hasMetrics && (
        <ExplainPanel
          isOpen={showExplain}
          onClose={() => setShowExplain(false)}
          documentId={documentId}
          substrates={substrates}
          metrics={metrics}
          compositionSummary={compositionSummary}
        />
      )}
    </>
  )
}