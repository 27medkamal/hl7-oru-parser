import React from 'react';
import { TreeTable } from 'primereact/treetable';
import { Column } from 'primereact/column';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

import { useAnalysis } from '~/lib/contexts';
import _ from 'lodash';
import { cn } from '~/lib/utils';

// TODO: highlight at risk groups and dignostics
// add a toggle button that filters the table to show only at risk groups, diagnostics and metrics
// add a button for expand and collapse all

type TreeNode = {
  key: string;
  data: {
    name: string;
    value: string;
    unit: string; // TODO: get all units
    standardRange: string;
    everlabRange: string;
    standardAtRisk: {
      text: string;
      classification: 'Yes' | 'No' | 'Possible' | '';
    };
    everlabAtRisk: {
      text: string;
      classification: 'Yes' | 'No' | 'Possible' | '';
    };
  };
  children?: TreeNode[];
};

const formatRange = (lowerLimit: number | null, higherLimit: number | null) => {
  if (!lowerLimit && higherLimit) return `< ${higherLimit}`;
  if (lowerLimit && !higherLimit) return `> ${lowerLimit}`;
  if (lowerLimit && higherLimit) return `${lowerLimit} - ${higherLimit}`;
  return '';
};

const formatAtRisk = (
  atRisk: 'Yes' | 'No' | 'Possible',
  conditionName: string | null,
): {
  text: string;
  classification: 'Yes' | 'No' | 'Possible' | '';
} => {
  if (atRisk === 'Yes') {
    return {
      text: conditionName ? conditionName : 'At risk',
      classification: 'Yes',
    };
  } else if (atRisk === 'No') {
    return { text: 'No risk', classification: 'No' };
  } else if (atRisk === 'Possible') {
    return {
      text: conditionName
        ? `Possible risk for ${conditionName}`
        : 'Possible risk',
      classification: 'Possible',
    };
  } else {
    return { text: '', classification: '' };
  }
};

export default function Analysis() {
  const { analysis } = useAnalysis();

  if (!analysis)
    return <div className="text-center">Error. No analysis found</div>;

  // TODO: coordinate with backend to get the correct data structure
  const treeData: TreeNode[] = _.map(analysis.data, (groups, groupName) => ({
    key: groupName,
    data: {
      name: groupName,
      value: '',
      unit: '',
      standardRange: '',
      everlabRange: '',
      standardAtRisk: { text: '', classification: '' },
      everlabAtRisk: { text: '', classification: '' },
    },
    children: _.map(groups, (metrics, diagnosticName) => ({
      key: diagnosticName,
      data: {
        name: diagnosticName,
        value: '',
        unit: '',
        standardRange: '',
        everlabRange: '',
        standardAtRisk: { text: '', classification: '' },
        everlabAtRisk: { text: '', classification: '' },
      },
      children: metrics.map((metric) => ({
        key: metric.metricName,
        data: {
          name: metric.metricName,
          value: metric.resultValue,
          unit: metric.metricUnit,
          standardRange: formatRange(
            metric.metricStandardLower,
            metric.metricStandardHigher,
          ),
          everlabRange: formatRange(
            metric.metricEverlabLower,
            metric.metricEverlabHigher,
          ),
          standardAtRisk: formatAtRisk(
            metric.standardAtRisk,
            metric.conditionName,
          ),
          everlabAtRisk: formatAtRisk(
            metric.everlabAtRisk,
            metric.conditionName,
          ),
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
          <TreeTable
            value={treeData}
            className="w-full"
            tableStyle={{ tableLayout: 'auto' }}
          >
            <Column
              field="name"
              header="Name"
              expander
              bodyClassName="border border-gray-200"
              headerClassName="border border-gray-200 bg-gray-50"
            />
            <Column
              field="value"
              header="Value"
              bodyClassName="border border-gray-200"
              headerClassName="border border-gray-200 bg-gray-50"
            />
            <Column
              field="unit"
              header="Unit"
              bodyClassName="border border-gray-200"
              headerClassName="border border-gray-200 bg-gray-50"
            />
            <Column
              field="standardRange"
              header="Standard Range"
              bodyClassName="border border-gray-200"
              headerClassName="border border-gray-200 bg-gray-50"
            />
            <Column
              field="everlabRange"
              header="Everlab Range"
              bodyClassName="border border-gray-200"
              headerClassName="border border-gray-200 bg-gray-50"
            />
            <Column
              header="Standard risk"
              bodyClassName="border border-gray-200"
              headerClassName="border border-gray-200 bg-gray-50"
              body={(node: TreeNode) => {
                const atRisk = node.data.standardAtRisk;

                return (
                  atRisk && (
                    <span
                      className={cn(
                        `px-2 py-1 rounded-full text-xs`,
                        {
                          Yes: 'bg-red-100 text-red-800',
                          No: 'bg-green-100 text-green-800',
                          Possible: 'bg-yellow-100 text-yellow-800',
                          '': '',
                        }[atRisk.classification],
                      )}
                    >
                      {atRisk.text}
                    </span>
                  )
                );
              }}
            />

            <Column
              header="Everlab risk"
              bodyClassName="border border-gray-200"
              headerClassName="border border-gray-200 bg-gray-50"
              body={(node: TreeNode) => {
                const atRisk = node.data.everlabAtRisk;

                return (
                  atRisk && (
                    <span
                      className={cn(
                        `px-2 py-1 rounded-full text-xs`,
                        {
                          Yes: 'bg-red-100 text-red-800',
                          No: 'bg-green-100 text-green-800',
                          Possible: 'bg-yellow-100 text-yellow-800',
                          '': '',
                        }[atRisk.classification],
                      )}
                    >
                      {atRisk.text}
                    </span>
                  )
                );
              }}
            />
          </TreeTable>
        </CardContent>
      </Card>
    </div>
  );
}
