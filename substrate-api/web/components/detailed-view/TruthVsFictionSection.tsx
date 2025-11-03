import React from 'react';
import { Scale, Eye, EyeOff } from 'lucide-react';

interface TruthVsFictionProps {
  comparison: {
    dashboard: {
      contextQuality: number;
      alignment: number;
      themes: number;
      intent: string;
    };
    reality: {
      contextQuality: number;
      alignment: number;
      themes: number;
      intent: string | null;
    };
    discrepancies: Array<{
      metric: string;
      dashboardValue: any;
      realValue: any;
      explanation: string;
    }>;
  };
}

export function TruthVsFictionSection({ comparison }: TruthVsFictionProps) {
  const { dashboard, reality, discrepancies } = comparison;

  const formatValue = (value: any, metric: string): string => {
    if (typeof value === 'number') {
      if (metric.includes('Quality') || metric.includes('Alignment')) {
        return `${Math.round(value * 100)}%`;
      }
      return value.toString();
    }
    if (typeof value === 'string') {
      return value.length > 40 ? value.substring(0, 40) + '...' : value;
    }
    return value?.toString() || 'None';
  };

  const getDiscrepancySeverity = (metric: string, dashboardVal: any, realVal: any) => {
    if (metric.includes('Quality') || metric.includes('Alignment')) {
      const diff = Math.abs(dashboardVal - realVal);
      if (diff > 0.4) return 'high';
      if (diff > 0.2) return 'medium';
      return 'low';
    }
    if (metric.includes('Themes')) {
      const diff = Math.abs(dashboardVal - realVal);
      if (diff >= 3) return 'high';
      if (diff >= 1) return 'medium';
      return 'low';
    }
    return 'medium';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-300 bg-red-50';
      case 'medium': return 'border-yellow-300 bg-yellow-50';
      case 'low': return 'border-blue-300 bg-blue-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Scale className="h-5 w-5 mr-2 text-gray-500" />
          Truth vs Fiction
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Side-by-side comparison of dashboard claims vs reality
        </p>
      </div>

      {/* Quick Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Overall Trust Score</span>
          <div className="flex items-center">
            {discrepancies.length === 0 ? (
              <>
                <span className="text-green-600 mr-2">✅</span>
                <span className="text-sm font-bold text-green-700">100% Honest</span>
              </>
            ) : discrepancies.length <= 2 ? (
              <>
                <span className="text-yellow-600 mr-2">⚠️</span>
                <span className="text-sm font-bold text-yellow-700">Partially Inflated</span>
              </>
            ) : (
              <>
                <span className="text-red-600 mr-2">⛔</span>
                <span className="text-sm font-bold text-red-700">Heavily Inflated</span>
              </>
            )}
          </div>
        </div>
        {discrepancies.length > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            {discrepancies.length} significant discrepancies detected
          </div>
        )}
      </div>

      {/* Comparison Table */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Metric Comparison</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    Dashboard Shows
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <EyeOff className="h-4 w-4 mr-1" />
                    Reality
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Context Quality
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatValue(dashboard.contextQuality, 'Quality')}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatValue(reality.contextQuality, 'Quality')}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {dashboard.contextQuality === reality.contextQuality ? (
                    <span className="text-green-600">✅ Accurate</span>
                  ) : (
                    <span className="text-red-600">⚠️ Inflated</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Document Alignment
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatValue(dashboard.alignment, 'Alignment')}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatValue(reality.alignment, 'Alignment')}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {dashboard.alignment === reality.alignment ? (
                    <span className="text-green-600">✅ Accurate</span>
                  ) : (
                    <span className="text-red-600">⚠️ Misleading</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Themes Detected
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {dashboard.themes}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {reality.themes}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {dashboard.themes === reality.themes ? (
                    <span className="text-green-600">✅ Accurate</span>
                  ) : (
                    <span className="text-orange-600">🤖 Augmented</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Strategic Intent
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                  {formatValue(dashboard.intent, 'Intent')}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                  {formatValue(reality.intent, 'Intent')}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {reality.intent ? (
                    <span className="text-green-600">✅ Extracted</span>
                  ) : (
                    <span className="text-yellow-600">🤖 Template</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Discrepancies */}
      {discrepancies.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Detailed Discrepancies</h3>
          <div className="space-y-3">
            {discrepancies.map((discrepancy, index) => {
              const severity = getDiscrepancySeverity(
                discrepancy.metric, 
                discrepancy.dashboardValue, 
                discrepancy.realValue
              );
              
              return (
                <div key={index} className={`border rounded-lg p-4 ${getSeverityColor(severity)}`}>
                  <div className="flex items-start">
                    <span className="text-lg mr-3">{getSeverityIcon(severity)}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{discrepancy.metric}</h4>
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                          {severity} severity
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                        <div>
                          <span className="text-gray-600">Dashboard: </span>
                          <span className="font-medium">{discrepancy.dashboardValue}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Reality: </span>
                          <span className="font-medium">{discrepancy.realValue}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-700">{discrepancy.explanation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {discrepancies.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Discrepancies Found</h3>
          <p className="text-sm text-gray-600">
            Your dashboard is showing accurate, uninflatted metrics.
          </p>
        </div>
      )}
    </div>
  );
}