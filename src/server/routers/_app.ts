import { createCallerFactory, publicProcedure, router } from '../trpc';
import { analyseRoute } from './anaylse';

export const appRouter = router({
  healthcheck: publicProcedure.query(() => 'yay!'),
  analyse: analyseRoute,
});

export const createCaller = createCallerFactory(appRouter);
export type AppRouter = typeof appRouter;
