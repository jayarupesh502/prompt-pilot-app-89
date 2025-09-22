import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ATSScoreProps {
  score: number;
  previousScore?: number;
  showTrend?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ATSScore: React.FC<ATSScoreProps> = ({
  score,
  previousScore,
  showTrend = false,
  size = 'md',
  className = ''
}) => {
  const getScoreLevel = (score: number) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  };

  const getScoreClass = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'ats-score-excellent';
      case 'good':
        return 'ats-score-good';
      case 'fair':
        return 'ats-score-fair';
      case 'poor':
        return 'ats-score-poor';
      default:
        return 'ats-score-fair';
    }
  };

  const level = getScoreLevel(score);
  const scoreClass = getScoreClass(level);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const getTrendIcon = () => {
    if (!showTrend || previousScore === undefined) return null;
    
    const diff = score - previousScore;
    if (diff > 0) {
      return <TrendingUp className="w-3 h-3 text-green-600" />;
    } else if (diff < 0) {
      return <TrendingDown className="w-3 h-3 text-red-600" />;
    } else {
      return <Minus className="w-3 h-3 text-gray-500" />;
    }
  };

  const getTrendText = () => {
    if (!showTrend || previousScore === undefined) return '';
    
    const diff = score - previousScore;
    if (diff === 0) return 'No change';
    return `${diff > 0 ? '+' : ''}${diff} from last`;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Badge 
        variant="outline" 
        className={`${scoreClass} ${sizeClasses[size]} font-mono font-semibold`}
      >
        ATS: {score}%
      </Badge>
      
      {showTrend && previousScore !== undefined && (
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          {getTrendIcon()}
          <span>{getTrendText()}</span>
        </div>
      )}
    </div>
  );
};