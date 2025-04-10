import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { useToast } from '~/hooks/use-toast';
import { Upload, File } from 'lucide-react';
import { cn } from '~/lib/utils';
import { useAnalysis } from '~/lib/contexts';
import { useRouter } from 'next/router';

export default function Home() {
  const { toast } = useToast();
  const { analysis } = useAnalysis();

  const router = useRouter();

  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      <Card>
        <CardHeader className="flex flex-col items-center justify-center">
          <CardTitle>HL7/ORU Analyser</CardTitle>
          <CardDescription>
            Upload your file to start the analysis
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
