import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
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
import { trpc } from '~/utils/trpc';

export default function Home() {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const { toast } = useToast();

  const analyse = trpc.analyse.useMutation();

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file)
      return toast({
        title: 'Error',
        description: 'No file selected',
        variant: 'destructive',
      });

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result)
        return toast({
          title: 'Error',
          description: 'Failed to read file content',
          variant: 'destructive',
        });

      const content = event.target.result;

      if (typeof content !== 'string')
        return toast({
          title: 'Error',
          description: 'Invalid file content',
          variant: 'destructive',
        });

      setFileContent(content);
    };
    reader.readAsText(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/plain': ['.oru.txt'] },
    multiple: false,
  });

  const handleUpload = async () => {
    if (!fileContent) {
      toast({
        title: 'Error',
        description: 'Please select a file first',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalysing(true);

    try {
      const data = await analyse.mutateAsync({ oruFileContent: fileContent });
      console.log(data);
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to upload file content',
        variant: 'destructive',
      });
      setIsAnalysing(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      <Card>
        <CardHeader className="flex flex-col items-center justify-center">
          <CardTitle>HL7/ORU Analyser</CardTitle>
          <CardDescription>
            Upload your file to start the analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer',
              isDragActive
                ? 'border-primary bg-primary/10'
                : 'border-muted hover:border-primary hover:bg-primary/5',
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">
              Drag and drop your file here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supports HL7/ORU text files
            </p>
            {fileName && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded-md w-full">
                <File className="h-4 w-4" />
                <span className="text-xs truncate">{fileName}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleUpload}
            disabled={!fileContent || isAnalysing}
            className="w-full"
          >
            {isAnalysing ? 'Analysing...' : 'Analyse'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
