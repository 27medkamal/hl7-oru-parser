import React from 'react';
import { TreeTable } from 'primereact/treetable';
import { Column } from 'primereact/column';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

import { Analysis as AnalysisT, useAnalysis } from '~/lib/contexts';

type TreeNode = {
  key: string;
  data: {
    name: string;
    value: string | number;
    units: string;
    standardRange: string;
    status: string;
  };
  children?: TreeNode[];
};

export default function Analysis() {
  const { analysis } = useAnalysis();

  if (!analysis)
    return <div className="text-center">Error. No analysis found</div>;

  const transformAnalysisData = (analysisObj: AnalysisT): TreeNode[] => {
    const { data } = analysisObj;

    const groupedByGroupName: Record<string, any[]> = {};

    // Iterate through the outer object keys which are group names
    Object.keys(data).forEach((groupName) => {
      const diagnosticsInGroup = data[groupName];

      // Iterate through each diagnostic name in this group
      Object.keys(diagnosticsInGroup).forEach((diagnosticName) => {
        // Get the metrics for this diagnostic
        const metrics = diagnosticsInGroup[diagnosticName];

        // Initialize this group if not already done
        if (!groupedByGroupName[groupName]) {
          groupedByGroupName[groupName] = [];
        }

        // Add each metric to the appropriate group, along with its diagnostic name
        metrics.forEach((metric) => {
          groupedByGroupName[groupName].push({
            ...metric,
            diagnosticKey: diagnosticName,
          });
        });
      });
    });

    // Step 2: Transform into tree structure
    const result: TreeNode[] = [];

    // Create group nodes (Level 1: groupName)
    Object.keys(groupedByGroupName).forEach((groupName, groupIdx) => {
      // Group by diagnostic key within each group
      const groupMetrics = groupedByGroupName[groupName];
      const diagnosticGroups: Record<string, any[]> = {};

      groupMetrics.forEach((metric) => {
        if (!diagnosticGroups[metric.diagnosticKey]) {
          diagnosticGroups[metric.diagnosticKey] = [];
        }
        diagnosticGroups[metric.diagnosticKey].push(metric);
      });

      // Create diagnostic nodes (Level 2: diagnosticname)
      const diagnosticNodes: TreeNode[] = [];

      Object.keys(diagnosticGroups).forEach((diagnosticKey, diagIdx) => {
        const metrics = diagnosticGroups[diagnosticKey];

        // Create metric nodes (Level 3: metric)
        const metricNodes: TreeNode[] = metrics.map((metric, metricIdx) => ({
          key: `${groupIdx}-${diagIdx}-${metricIdx}`,
          data: {
            name: metric.metricName,
            value: metric.metricValue,
            units: metric.metricUnits,
            standardRange:
              metric.metricStandardLower !== null &&
              metric.metricStandardHigher !== null
                ? `${metric.metricStandardLower} - ${metric.metricStandardHigher}`
                : 'N/A',
            status: metric.everlabAtRisk,
          },
        }));

        diagnosticNodes.push({
          key: `${groupIdx}-${diagIdx}`,
          data: {
            name: diagnosticKey,
            value: '',
            units: '',
            standardRange: '',
            status: '',
          },
          children: metricNodes,
        });
      });

      result.push({
        key: `${groupIdx}`,
        data: {
          name: groupName,
          value: '',
          units: '',
          standardRange: '',
          status: '',
        },
        children: diagnosticNodes,
      });
    });

    return result;
  };

  const treeData = transformAnalysisData(analysis);

  return (
    <div className="container mx-auto p-4">
      {/* Personal Details Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">First Name</p>
              <p className="font-medium">
                {analysis?.personalDetails?.firstName || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Name</p>
              <p className="font-medium">
                {analysis?.personalDetails?.lastName || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Age</p>
              <p className="font-medium">
                {analysis?.personalDetails?.age || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p className="font-medium">
                {analysis?.personalDetails?.gender || 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Data TreeTable */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Results</CardTitle>
        </CardHeader>
        <CardContent>
          <TreeTable value={treeData} className="w-full">
            <Column field="name" header="Name" expander />
            <Column field="value" header="Value" />
            <Column field="units" header="Units" />
            <Column field="standardRange" header="Standard Range" />
            <Column
              field="status"
              header="Risk Status"
              body={(node) => {
                const status = node.data.status;
                if (!status) return null;

                let statusClass = '';
                if (status === 'Yes') statusClass = 'bg-red-100 text-red-800';
                else if (status === 'No')
                  statusClass = 'bg-green-100 text-green-800';
                else if (status === 'Possible')
                  statusClass = 'bg-yellow-100 text-yellow-800';

                return (
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${statusClass}`}
                  >
                    {status}
                  </span>
                );
              }}
            />
          </TreeTable>
        </CardContent>
      </Card>
    </div>
  );
}
