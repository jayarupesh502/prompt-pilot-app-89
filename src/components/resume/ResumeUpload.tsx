import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useResumeStore } from '@/stores/resumeStore';

interface ResumeUploadProps {
  onUploadComplete?: (resumeData: any) => void;
  onUploadSuccess?: (resumeData: any) => void; // Added for compatibility
  className?: string;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({ 
  onUploadComplete,
  onUploadSuccess,
  className = ''
}) => {
  const { toast } = useToast();
  const { isGuest, guestSessionId } = useAuthStore();
  const { createResume } = useResumeStore();
  const [isUploading, setIsUploading] = React.useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type with fallback to extension
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/rtf',
      'application/rtf'
    ];
    const allowedExts = new Set(['pdf', 'docx', 'doc', 'txt', 'rtf']);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (!(allowedTypes.includes(file.type) || allowedExts.has(ext))) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF, DOCX, DOC, TXT, or RTF file.",
        variant: "destructive"
      });
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('isGuest', isGuest.toString());
      if (isGuest && guestSessionId) {
        formData.append('guestSessionId', guestSessionId);
      }

      // Call parse-resume edge function
      const { data, error } = await supabase.functions.invoke('parse-resume', {
        body: formData
      });

      if (error) throw error;

      if (!data.success) {
        // Handle specific validation errors for non-resume files
        if (data.reason && data.suggestion) {
          toast({
            title: "Invalid file detected",
            description: `${data.reason} ${data.suggestion}`,
            variant: "destructive"
          });
          return;
        }
        throw new Error(data.error || 'Failed to parse resume');
      }

      // Optional soft validation notice
      if (data.validation && (!data.validation.aiIsResume && !data.validation.heuristicGuess)) {
        toast({
          title: "Proceeding with low-confidence detection",
          description: "We could not confidently detect a resume, but we will continue as requested.",
        });
      }

      // Create resume in database
      const resumeTitle = `${file.name.split('.')[0]} Resume`;
      const newResume = await createResume(
        resumeTitle,
        data.parsedContent,
        isGuest,
        guestSessionId
      );

      // Update the resume with additional data
      await useResumeStore.getState().updateResume(newResume.id, {
        originalFilename: data.originalFilename,
        atsScore: data.atsScore
      });

      toast({
        title: "Resume uploaded successfully!",
        description: `Parsed ${file.name} with ATS score of ${data.atsScore}/100`,
      });

      // Call both callbacks for compatibility
      onUploadComplete?.(newResume);
      onUploadSuccess?.({
        ...newResume,
        parsed_content: newResume.parsedContent,
        ats_score: newResume.atsScore,
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload and parse resume.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast, isGuest, guestSessionId, createResume, onUploadComplete, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'text/rtf': ['.rtf'],
      'application/rtf': ['.rtf']
    },
    multiple: false,
    disabled: isUploading,
    noClick: true,
  });

  return (
    <Card className={`${className}`}>
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center space-y-4">
            {isUploading ? (
              <div className="animate-spin">
                <FileText className="w-12 h-12 text-primary" />
              </div>
            ) : (
              <Upload className="w-12 h-12 text-muted-foreground" />
            )}
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isUploading ? 'Parsing resume...' : 'Drag & drop or click to select'}
              </p>
              <p className="text-xs text-muted-foreground">
                Supports PDF, DOCX, and TXT files (max 10MB)
              </p>
            </div>

            {!isDragActive && !isUploading && (
              <Button variant="outline" className="mt-4" onClick={() => open()}>
                <FileText className="w-4 h-4 mr-2" />
                Browse Files
              </Button>
            )}
          </div>
        </div>

        {isGuest && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              As a guest, your resume will be stored for 7 days. 
              <Button variant="link" className="p-0 h-auto font-semibold">
                Sign up
              </Button> to save permanently.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};