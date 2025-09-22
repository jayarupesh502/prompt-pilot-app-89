import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { JobDescription } from '@/types';
import { 
  Building2, 
  MapPin, 
  Clock, 
  Star, 
  Code, 
  Target,
  Users,
  Briefcase,
  GraduationCap
} from 'lucide-react';

interface JobAnalysisResultsProps {
  jobData: JobDescription;
  className?: string;
}

export const JobAnalysisResults: React.FC<JobAnalysisResultsProps> = ({
  jobData,
  className = ''
}) => {
  const content = jobData.parsedContent;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Job Analysis Results
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Job Header */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">{content.title}</h2>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {content.company && (
              <div className="flex items-center">
                <Building2 className="w-4 h-4 mr-1" />
                {content.company}
              </div>
            )}
            {content.location && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {content.location}
              </div>
            )}
            {content.employment_type && (
              <div className="flex items-center">
                <Briefcase className="w-4 h-4 mr-1" />
                {content.employment_type}
              </div>
            )}
            {content.salary_range && (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {content.salary_range}
              </div>
            )}
          </div>

          {content.industry && (
            <Badge variant="secondary" className="w-fit">
              {content.industry}
            </Badge>
          )}
        </div>

        <Separator />

        {/* Requirements */}
        {content.requirements && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Star className="w-5 h-5 mr-2" />
              Requirements
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {content.requirements.required_skills && content.requirements.required_skills.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-red-600">Required Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {content.requirements.required_skills.map((skill, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {content.requirements.preferred_skills && content.requirements.preferred_skills.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-orange-600">Preferred Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {content.requirements.preferred_skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-orange-300">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-4">
              {content.requirements.experience_years && (
                <div>
                  <h4 className="font-medium mb-1 flex items-center text-sm">
                    <Users className="w-4 h-4 mr-1" />
                    Experience
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {content.requirements.experience_years}
                  </p>
                </div>
              )}

              {content.requirements.education && (
                <div>
                  <h4 className="font-medium mb-1 flex items-center text-sm">
                    <GraduationCap className="w-4 h-4 mr-1" />
                    Education
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {content.requirements.education}
                  </p>
                </div>
              )}

              {content.requirements.certifications && content.requirements.certifications.length > 0 && (
                <div>
                  <h4 className="font-medium mb-1 text-sm">Certifications</h4>
                  <div className="space-y-1">
                    {content.requirements.certifications.map((cert, index) => (
                      <Badge key={index} variant="outline" className="text-xs block w-fit">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Tech Stack */}
        {content.tech_stack && content.tech_stack.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold flex items-center mb-3">
              <Code className="w-5 h-5 mr-2" />
              Technology Stack
            </h3>
            <div className="flex flex-wrap gap-2">
              {content.tech_stack.map((tech, index) => (
                <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Responsibilities */}
        {content.responsibilities && content.responsibilities.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Key Responsibilities</h3>
            <ul className="space-y-2">
              {content.responsibilities.map((responsibility, index) => (
                <li key={index} className="text-sm flex items-start">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  {responsibility}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Keywords */}
        {content.keywords && content.keywords.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Key Terms & Keywords</h3>
            <div className="flex flex-wrap gap-1">
              {content.keywords.map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};