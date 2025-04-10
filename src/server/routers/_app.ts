// @ts-expect-error: No types - will add later
import hl7 from 'tiny-hl7';
// @ts-expect-error: No types - will add later
import HL7Date from 'hl7-date';
import _ from 'lodash';
import { differenceInYears } from 'date-fns';
import { PrismaClient } from '@prisma/client';

import { z } from 'zod';
import { createCallerFactory, publicProcedure, router } from '../trpc';

export const appRouter = router({
  healthcheck: publicProcedure.query(() => 'yay!'),

  analyse: publicProcedure
    .input(
      z.object({
        oruFileContent: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      console.log(
        'oruFileContent',
        await parseFileContent(input.oruFileContent),
      );
      return 'yay!';
    }),
});

export const createCaller = createCallerFactory(appRouter);
export type AppRouter = typeof appRouter;

// TODO: add tests here
// TODO: refactor this

const parseFileContent = async (fileContent: string) => {
  const parsedMessages = hl7.parse(fileContent) as Record<string, string>[];

  const personalDetails = {
    firstName: parsedMessages.find((m) => m['PID.5.2'])?.['PID.5.2'],
    lastName: parsedMessages.find((m) => m['PID.5.1'])?.['PID.5.1'],
    age: differenceInYears(
      Date.now(),
      HL7Date.parse(parsedMessages.find((m) => m['PID.7'])?.['PID.7']),
    ),
    gender: ({ M: 'Male', F: 'Female' } as const)[
      parsedMessages.find((m) => m['PID.8'])?.['PID.8'] as 'M' | 'F'
    ],
  };

  const supportedValueTypes = {
    NM: 'Numeric',
    SN: 'Structured Numeric',
  };

  type ResultMessage = {
    oruSonicCode: string;
    oruSonicUnit: string;
    result:
      | {
          type: 'NM';
          value: number;
        }
      | {
          type: 'SN';
          operater: '<' | '>';
          value: number;
        };
  };

  const results = parsedMessages
    .filter(
      (m) =>
        m['OBX.3.2'] && Object.keys(supportedValueTypes).includes(m['OBX.2']),
    )
    .map(
      (m): ResultMessage => ({
        oruSonicCode: m['OBX.3.2'],
        oruSonicUnit: m['OBX.6.1'],
        result:
          m['OBX.2'] === 'NM'
            ? {
                type: 'NM',
                value: parseFloat(m['OBX.5']),
              }
            : {
                type: 'SN',
                operater: m['OBX.5.1'] as '<' | '>',
                value: parseFloat(m['OBX.5.2']),
              },
      }),
    );

  const prisma = new PrismaClient();
  // This is a short list, so should be safe to load it all into memory
  const metrics = await prisma.metric.findMany({
    include: {
      condition: true,
      diagnostic: {
        include: { diagnosticGroups: { include: { group: true } } },
      },
    },
  });

  const analysis = _.chain(results)
    .reduce<
      { result: (typeof results)[number]; metric: (typeof metrics)[number] }[]
    >((acc, result) => {
      const metric = metrics.find((metric) => {
        const codeMatches = metric.oruSonicCodes.includes(result.oruSonicCode);
        const unitMatches =
          metric.oruSonicUnits.includes(result.oruSonicUnit) ||
          (metric.oruSonicUnits.length === 0 &&
            result.oruSonicUnit.trim() === '');

        const minAgeMatches =
          metric.minAge === null || personalDetails.age >= metric.minAge;

        const maxAgeMatches =
          metric.maxAge === null || personalDetails.age <= metric.maxAge;

        const genderMatches =
          metric.gender === 'Any' || metric.gender === personalDetails.gender;

        return (
          codeMatches &&
          unitMatches &&
          minAgeMatches &&
          maxAgeMatches &&
          genderMatches
        );
      });
      if (!metric) return acc;
      return [...acc, { result, metric }];
    }, [])
    .map(({ result, metric }) => {
      const atRisk = (
        lowerLimit: number | null,
        higherLimit: number | null,
      ): 'Yes' | 'No' | 'Possible' => {
        if (result.result.type === 'NM') {
          return (lowerLimit !== null && result.result.value < lowerLimit) ||
            (higherLimit !== null && result.result.value > higherLimit)
            ? 'Yes'
            : 'No';
        } else if (result.result.type === 'SN') {
          if (result.result.operater === '<') {
            // using <= below because the sign above is <
            if (lowerLimit !== null && result.result.value <= lowerLimit) {
              return 'Yes';
            } else if (
              higherLimit !== null &&
              lowerLimit === null &&
              result.result.value <= higherLimit
            ) {
              return 'No';
            } else if (lowerLimit === null && higherLimit === null) {
              return 'No';
            } else return 'Possible';
          } else if (result.result.operater === '>') {
            // using >= below because the sign above is >
            if (higherLimit !== null && result.result.value >= higherLimit) {
              return 'Yes';
            } else if (
              lowerLimit !== null &&
              higherLimit === null &&
              result.result.value >= lowerLimit
            ) {
              return 'No';
            } else if (higherLimit === null && lowerLimit === null) {
              return 'No';
            } else return 'Possible';
          }
        }

        throw new Error('atRisk should handle all cases');
      };

      return {
        metricName: metric.name,
        metricUnits: metric.units[0] ?? '',
        metricStandardLower: metric.standardLower,
        metricStandardHigher: metric.standardHigher,
        metricEverlabLower: metric.everlabLower,
        metricEverlabHigher: metric.everlabHigher,

        conditionName: metric.condition?.name ?? null,
        diagnosticName: metric.diagnostic?.name ?? null,
        groupNames:
          metric.diagnostic?.diagnosticGroups.map(
            (diagnosticGroup) => diagnosticGroup.group.name,
          ) ?? [],

        resultValue:
          result.result.type === 'NM'
            ? `${result.result.value}`
            : `${result.result.operater} ${result.result.value}`,
        standardAtRisk: atRisk(metric.standardLower, metric.standardHigher),
        everlabAtRisk: atRisk(metric.everlabLower, metric.everlabHigher),
      };
    })
    .flatMap((result) =>
      result.groupNames.map((groupName) => ({
        ...result,
        groupNames: undefined,
        groupName,
      })),
    )
    .groupBy('groupName')
    .mapValues((metrics) => _.groupBy(metrics, 'diagnosticName'))
    .value();

  return {
    personalDetails,
    analysis,
  };
};
