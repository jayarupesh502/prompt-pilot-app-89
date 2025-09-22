import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ATSScore } from '@/components/common/ATSScore';
import { ParsedResume } from '@/types';
import { Mail, Phone, MapPin, Calendar, GraduationCap, Briefcase } from 'lucide-react';

interface ResumePreviewProps {
  resume: ParsedResume;
  atsScore?: number;
  isCalculatingATS?: boolean;
  className?: string;
  highlightChanges?: boolean;
  showAtsScore?: boolean;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  resume,
  atsScore = 0,
  isCalculatingATS = false,
  className = '',
  highlightChanges = false,
  showAtsScore = true
}) => {
  return (
    <Card className={`${className} max-w-4xl mx-auto bg-white shadow-lg`}>
      {showAtsScore && (
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resume Preview
            </CardTitle>
            <ATSScore score={atsScore} isCalculating={isCalculatingATS} size="sm" />
          </div>
        </CardHeader>
      )}
      
      <CardContent className="p-8 space-y-6 font-serif">
        {/* Header */}
        {resume.profile && (
          <div className="text-center space-y-2 border-b pb-6">
            <h1 className="text-3xl font-bold text-foreground">
              {resume.profile.name || 'Your Name'}
            </h1>
            
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              {resume.profile.email && (
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  {resume.profile.email}
                </div>
              )}
              {resume.profile.phone && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  {resume.profile.phone}
                </div>
              )}
              {resume.profile.location && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {resume.profile.location}
                </div>
              )}
            </div>

            {resume.profile.summary && (
              <p className="text-sm leading-relaxed mt-4 max-w-3xl mx-auto">
                {resume.profile.summary}
              </p>
            )}
          </div>
        )}

        {/* Experience */}
        {resume.experience && resume.experience.length > 0 && (
          <div>
            <h2 className="text-xl font-bold flex items-center mb-4">
              <Briefcase className="w-5 h-5 mr-2" />
              Professional Experience
            </h2>
            <div className="space-y-4">
              {resume.experience.map((exp, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{exp.title}</h3>
                      <p className="text-primary font-medium">{exp.company}</p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {exp.startDate} - {exp.endDate}
                      </div>
                      {exp.location && <p>{exp.location}</p>}
                    </div>
                  </div>
                  
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {exp.bullets.map((bullet, bulletIndex) => (
                        <li key={bulletIndex} className="text-sm leading-relaxed">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}

                  {exp.skills && exp.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {exp.skills.map((skill, skillIndex) => (
                        <Badge key={skillIndex} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {index < resume.experience!.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {resume.projects && resume.projects.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Projects</h2>
            <div className="space-y-4">
              {resume.projects.map((project, index) => (
                <div key={index} className="space-y-2">
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-muted-foreground">
                      {project.description}
                    </p>
                  )}
                  
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.map((tech, techIndex) => (
                        <Badge key={techIndex} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {project.bullets && project.bullets.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {project.bullets.map((bullet, bulletIndex) => (
                        <li key={bulletIndex} className="text-sm leading-relaxed">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}

                  {index < resume.projects!.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {resume.education && resume.education.length > 0 && (
          <div>
            <h2 className="text-xl font-bold flex items-center mb-4">
              <GraduationCap className="w-5 h-5 mr-2" />
              Education
            </h2>
            <div className="space-y-3">
              {resume.education.map((edu, index) => (
                <div key={index} className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{edu.degree}</h3>
                    <p className="text-primary">{edu.institution}</p>
                    {edu.field && (
                      <p className="text-sm text-muted-foreground">
                        Major: {edu.field}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {edu.graduationDate && <p>{edu.graduationDate}</p>}
                    {edu.gpa && <p>GPA: {edu.gpa}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {resume.skills && resume.skills.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Technical Skills</h2>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};