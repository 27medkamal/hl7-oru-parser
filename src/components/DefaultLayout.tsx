import Head from 'next/head';
import { PrimeReactProvider } from 'primereact/api';
import { Toaster } from '~/components/ui/toaster';
import type { ReactNode } from 'react';
import { AnalysisProvider } from '~/lib/contexts';

import 'primereact/resources/themes/lara-light-cyan/theme.css';

type DefaultLayoutProps = { children: ReactNode };

export const DefaultLayout = ({ children }: DefaultLayoutProps) => {
  return (
    <PrimeReactProvider>
      <AnalysisProvider>
        <Head>
          <title>Prisma Starter</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className="h-screen">{children}</main>
        <Toaster />
      </AnalysisProvider>
    </PrimeReactProvider>
  );
};
