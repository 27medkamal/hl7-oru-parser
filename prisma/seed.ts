import * as fs from 'fs';
import camelcaseKeys from 'camelcase-keys';

import { PrismaClient } from '@prisma/client';
import neatCsv from 'neat-csv';
import { z } from 'zod';

const prisma = new PrismaClient();

const readCSVFile = async (path: string) => {
  return camelcaseKeys(
    await neatCsv(
      fs
        .readFileSync(path)
        .toString()
        .replace(/^\uFEFF/g, ''),
    ),
  );
};

const splitBy = (delimiter: string) => (val: string) =>
  val
    .split(delimiter)
    .map((item) => item.trim())
    .filter((item) => item !== '');

const parseFloatOrUndefined = (val: string) => {
  const parsedValue = parseFloat(val);
  if (!isNaN(parsedValue) && parsedValue !== 0) return parsedValue;
};

const metricSchema = z.object({
  name: z.string(),
  oruSonicCodes: z.string().transform(splitBy(';')),
  diagnostic: z.string().transform((val) => val || undefined),
  diagnosticGroups: z.string().transform(splitBy(',')),
  oruSonicUnits: z.string().transform(splitBy(';')),
  units: z.string().transform(splitBy(';')),
  minAge: z.string().transform((val) => {
    if (!['0', ''].includes(val)) return parseInt(val);
  }),
  maxAge: z.string().transform((val) => {
    if (!['200', ''].includes(val)) return parseInt(val);
  }),
  gender: z.union([z.literal('Male'), z.literal('Female'), z.literal('Any')]),
  standardLower: z.string().transform(parseFloatOrUndefined),
  standardHigher: z.string().transform(parseFloatOrUndefined),
  everlabLower: z.string().transform(parseFloatOrUndefined),
  everlabHigher: z.string().transform(parseFloatOrUndefined),
});

const conditionSchema = z.object({
  name: z.string(),
  diagnosticMetrics: z.string().transform(splitBy(',')),
});

(async () => {
  const metrics = (await readCSVFile('prisma/data/diagnostic_metrics.csv')).map(
    (metric) => metricSchema.parse(metric),
  );

  const conditions = (await readCSVFile('prisma/data/conditions.csv')).map(
    (condition) => conditionSchema.parse(condition),
  );

  for (const metric of metrics) {
    const condition = conditions.find((condition) =>
      condition.diagnosticMetrics.includes(metric.name),
    );

    const dbDiagnostic = await (async () => {
      if (!metric.diagnostic) return;

      const dbDiagnostic = await prisma.diagnostic.upsert({
        where: { name: metric.diagnostic },
        create: { name: metric.diagnostic },
        update: {},
      });

      const dbGroups = await Promise.all(
        metric.diagnosticGroups.map(
          async (group) =>
            await prisma.group.upsert({
              where: { name: group },
              create: { name: group },
              update: {},
            }),
        ),
      );

      for (const dbGroup of dbGroups) {
        await prisma.diagnosticGroup.upsert({
          where: {
            uniqueDiagnosticGroup: {
              diagnosticId: dbDiagnostic.id,
              groupId: dbGroup.id,
            },
          },
          create: {
            diagnosticId: dbDiagnostic.id,
            groupId: dbGroup.id,
          },
          update: {},
        });
      }
      return dbDiagnostic;
    })();

    const dbCondition = condition
      ? await prisma.condition.upsert({
          where: { name: condition.name },
          create: { name: condition.name },
          update: {},
        })
      : undefined;

    await prisma.metric.upsert({
      where: {
        uniqueNameOruSonicCodesOruSonicUnits: {
          name: metric.name,
          oruSonicCodes: metric.oruSonicCodes,
          oruSonicUnits: metric.oruSonicUnits,
        },
      },
      create: {
        name: metric.name,
        oruSonicCodes: metric.oruSonicCodes,
        oruSonicUnits: metric.oruSonicUnits,
        units: metric.units,
        minAge: metric.minAge,
        maxAge: metric.maxAge,
        gender: metric.gender,
        standardLower: metric.standardLower,
        standardHigher: metric.standardHigher,
        everlabLower: metric.everlabLower,
        everlabHigher: metric.everlabHigher,
        conditionId: dbCondition?.id,
        diagnosticId: dbDiagnostic?.id,
      },
      update: {},
    });
  }
})();
