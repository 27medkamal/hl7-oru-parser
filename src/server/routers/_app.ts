import { createCallerFactory, publicProcedure, router } from '../trpc';
import { analyseRoute } from './analyse';

export const appRouter = router({
  healthcheck: publicProcedure.query(() => 'yay!'),
  analyse: analyseRoute,
});

export const createCaller = createCallerFactory(appRouter);
export type AppRouter = typeof appRouter;
