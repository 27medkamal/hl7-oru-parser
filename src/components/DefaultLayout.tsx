import Head from 'next/head';
import { Toaster } from '~/components/ui/toaster';
import type { ReactNode } from 'react';
import { AnalysisProvider } from '~/lib/contexts';

type DefaultLayoutProps = { children: ReactNode };

export const DefaultLayout = ({ children }: DefaultLayoutProps) => {
  return (
    <>
      <AnalysisProvider>
        <Head>
          <title>Prisma Starter</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className="h-screen">{children}</main>
        <Toaster />
      </AnalysisProvider>
    </>
  );
};
