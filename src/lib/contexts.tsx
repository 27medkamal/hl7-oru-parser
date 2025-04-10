import { inferRouterOutputs } from '@trpc/server';
import { createContext, useState, useContext, ReactNode } from 'react';
import { AppRouter } from '~/server/routers/_app';

export type Analysis = inferRouterOutputs<AppRouter>['analyse'];

type AnalysisContext = {
  analysis: Analysis | undefined;
  setAnalysis: (analysis: Analysis) => void;
};

const AnalysisContext = createContext<AnalysisContext | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [analysis, setAnalysis] = useState<Analysis | undefined>(undefined);

  return (
    <AnalysisContext.Provider value={{ analysis, setAnalysis }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis(): AnalysisContext {
  const analysis = useContext(AnalysisContext);
  if (analysis === undefined)
    throw new Error('useFileContent must be used within a FileContentProvider');

  return analysis;
}
