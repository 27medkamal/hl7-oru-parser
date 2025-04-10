import { createContextInner } from '../context';
import { createCaller } from './_app';
import * as fs from 'fs';

test('Analyses file snapshot', async () => {
  const ctx = await createContextInner({});
  const caller = createCaller(ctx);

  expect(
    await caller.analyse({
      oruFileContent: fs
        .readFileSync('prisma/data/MP826520.oru.txt')
        .toString(),
    }),
  ).toMatchSnapshot();
});
