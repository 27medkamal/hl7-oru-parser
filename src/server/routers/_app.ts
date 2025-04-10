/**
 * This file contains the root router of your tRPC-backend
 */
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
      console.log('oruFileContent', input.oruFileContent);
      return 'yay!';
    }),
});

export const createCaller = createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
