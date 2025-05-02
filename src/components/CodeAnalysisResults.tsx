
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CodeAnalysisResult } from '@/hooks/use-gemini-code-analysis';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface CodeAnalysisResultsProps {
  result: CodeAnalysisResult;
  onClose?: () => void;
}

const CodeAnalysisResults: React.FC<CodeAnalysisResultsProps> = ({ result, onClose }) => {
  if (!result.success) {
    return (
      <Card className="border-red-300">
        <CardHeader>
          <CardTitle className="text-red-500 flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Analysis Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{result.error || "An unknown error occurred during code analysis."}</p>
        </CardContent>
      </Card>
    );
  }
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };
  
  const getScoreColor = () => {
    const score = result.overallScore || 0;
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            Code Analysis Results
          </CardTitle>
          {result.overallScore && (
            <div className="flex items-center">
              <span className="text-sm mr-2">Overall Score:</span>
              <span className={`font-bold text-lg ${getScoreColor()}`}>
                {result.overallScore}/100
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Feedback</h3>
          <p className="text-sm">{result.feedback}</p>
        </div>
        
        {result.suggestions.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Suggestions</h3>
            <div className="space-y-2">
              {result.suggestions.map((suggestion, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center mb-1">
                    <Badge className={getSeverityColor(suggestion.severity)}>
                      <span className="flex items-center">
                        {getSeverityIcon(suggestion.severity)}
                        <span className="ml-1 capitalize">{suggestion.severity}</span>
                      </span>
                    </Badge>
                    <span className="ml-2 text-xs font-medium">
                      {suggestion.file} {suggestion.line ? `(Line ${suggestion.line})` : ''}
                    </span>
                  </div>
                  <p className="text-sm">{suggestion.suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CodeAnalysisResults;
