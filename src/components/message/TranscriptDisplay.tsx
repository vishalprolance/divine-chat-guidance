
import React from 'react';

interface TranscriptDisplayProps {
  transcript: string;
  isRecording: boolean;
  fontSize: number;
}

const TranscriptDisplay = ({ transcript, isRecording, fontSize }: TranscriptDisplayProps) => {
  if (!transcript || !isRecording) return null;
  
  return (
    <div className="message message-user opacity-70">
      <span style={{ fontSize: `${fontSize}px` }}>{transcript}</span>
    </div>
  );
};

export default TranscriptDisplay;
