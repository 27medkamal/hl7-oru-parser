import React from 'react';
import { TreeTable } from 'primereact/treetable';
import { Column } from 'primereact/column';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

import { useAnalysis } from '~/lib/contexts';
import _ from 'lodash';

type TreeNode = {
  key: string;
  data: {
    name: string;
    value: string | number;
    unit: string;
    standardRange: string;
    status: string;
  };
  children?: TreeNode[];
};

export default function Analysis() {
  const { analysis } = useAnalysis();

  if (!analysis)
    return <div className="text-center">Error. No analysis found</div>;

  const treeData: TreeNode[] = _.map(analysis.data, (groups, groupName) => ({
    key: groupName,
    data: {
      name: groupName,
      value: '',
      unit: '',
      standardRange: '',
      status: '',
    },
    children: _.map(groups, (metrics, diagnosticName) => ({
      key: diagnosticName,
      data: {
        name: diagnosticName,
        value: '',
        unit: '',
        standardRange: '',
        status: '',
      },
      children: metrics.map((metric) => ({
        key: metric.metricName,
        data: {
          name: metric.metricName,
          value: metric.resultValue,
          unit: metric.metricUnit,
          standardRange:
            metric.metricStandardLower !== null &&
            metric.metricStandardHigher !== null
              ? `${metric.metricStandardLower} - ${metric.metricStandardHigher}`
              : 'N/A',
          status: metric.everlabAtRisk,
        },
      })),
    })),
  }));

  return (
    <div className="container mx-auto p-4">
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
