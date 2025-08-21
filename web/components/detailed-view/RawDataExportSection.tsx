import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Download, Code } from 'lucide-react';

interface RawDataExportProps {
  rawData: {
    basket: any;
    documentsCount: number;
    rawDumpsCount: number;
    contextItemsCount: number;
    blocksCount: number;
    intelligenceApiResponse: any;
  };
}

export function RawDataExportSection({ rawData }: RawDataExportProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const downloadJson = (data: any, filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  const truncateJson = (obj: any, maxLines: number = 10) => {
    const json = formatJson(obj);
    const lines = json.split('\n');
    if (lines.length <= maxLines) return json;
    return lines.slice(0, maxLines).join('\n') + `\n... (${lines.length - maxLines} more lines)`;
  };

  const dataExports = [
    {
      id: 'basket',
      title: 'Basket Metadata',
      description: 'Core basket information and settings',
      data: rawData.basket,
      filename: `basket-${rawData.basket?.id || 'unknown'}.json`
    },
    {
      id: 'intelligence',
      title: 'Intelligence API Response',
      description: 'Full response from the dashboard intelligence endpoint',
      data: rawData.intelligenceApiResponse,
      filename: `intelligence-${rawData.basket?.id || 'unknown'}.json`
    },
    {
      id: 'summary',
      title: 'Content Summary',
      description: 'High-level overview of all content in workspace',
      data: {
        basketId: rawData.basket?.id,
        basketName: rawData.basket?.name,
        contentCounts: {
          documents: rawData.documentsCount,
          rawDumps: rawData.rawDumpsCount,
          contextItems: rawData.contextItemsCount,
          blocks: rawData.blocksCount
        },
        lastActivity: rawData.basket?.last_activity_ts ?? rawData.basket?.created_at,
        createdAt: rawData.basket?.created_at
      },
      filename: `summary-${rawData.basket?.id || 'unknown'}.json`
    }
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Code className="h-5 w-5 mr-2 text-gray-500" />
          Raw Data Export
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          For developers and power users who want the full technical details
        </p>
      </div>

      {/* Quick Stats */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Data Inventory</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{rawData.documentsCount}</div>
            <div className="text-xs text-gray-600">Documents</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{rawData.rawDumpsCount}</div>
            <div className="text-xs text-gray-600">Raw Dumps</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{rawData.contextItemsCount}</div>
            <div className="text-xs text-gray-600">Context Items</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">{rawData.blocksCount}</div>
            <div className="text-xs text-gray-600">Blocks</div>
          </div>
        </div>
      </div>

      {/* Exportable Data Sections */}
      <div className="space-y-4">
        {dataExports.map((exportItem) => {
          const isExpanded = expandedSections[exportItem.id];
          const hasData = exportItem.data !== null && exportItem.data !== undefined;
          
          return (
            <div key={exportItem.id} className="border rounded-lg">
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection(exportItem.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500 mr-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500 mr-2" />
                    )}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{exportItem.title}</h4>
                      <p className="text-xs text-gray-600">{exportItem.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {hasData ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadJson(exportItem.data, exportItem.filename);
                        }}
                        className="flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500">No data</span>
                    )}
                  </div>
                </div>
              </div>
              
              {isExpanded && hasData && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="mt-3">
                    <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                      <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                        {truncateJson(exportItem.data)}
                      </pre>
                    </div>
                    {formatJson(exportItem.data).split('\n').length > 10 && (
                      <div className="mt-2 text-xs text-gray-600">
                        Showing first 10 lines. Download full file to see all data.
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {isExpanded && !hasData && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="mt-3 p-3 bg-yellow-50 rounded-lg text-center">
                    <div className="text-2xl mb-2">💭</div>
                    <p className="text-sm text-yellow-800">No data available for this section</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      This could indicate the API call failed or returned empty results
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Technical Notes */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Technical Notes</h4>
        <div className="text-xs text-blue-800 space-y-1">
          <div>• All exports are in JSON format for programmatic access</div>
          <div>• Intelligence API response shows what the dashboard actually receives</div>
          <div>• Timestamps are in ISO 8601 format (UTC)</div>
          <div>• Null values indicate missing or unavailable data</div>
          <div>• Use this data to build custom analytics or debugging tools</div>
        </div>
      </div>
    </div>
  );
}