
import React from 'react';
import { Badge } from '../ui/badge';

interface TranscriptDisplayProps {
  transcript: string;
  isRecording: boolean;
  fontSize: number;
}

const TranscriptDisplay = ({ transcript, isRecording, fontSize }: TranscriptDisplayProps) => {
  if (!transcript || !isRecording) return null;
  
  return (
    <div className="message message-user opacity-70 relative">
      <span style={{ fontSize: `${fontSize}px` }}>{transcript}</span>
      <div className="absolute -top-2 -right-2">
        <Badge variant="secondary" className="text-xs animate-pulse">
          Recording
        </Badge>
      </div>
    </div>
  );
};

export default TranscriptDisplay;
