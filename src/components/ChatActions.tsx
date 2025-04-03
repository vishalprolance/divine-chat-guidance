
import React from 'react';
import { Button } from './ui/button';
import { Trash2, VolumeX, Volume2, Settings } from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import FontSizeSettings from './FontSizeSettings';

interface ChatActionsProps {
  messages: Array<{ type: 'user' | 'bot'; text: string }>;
  isSpeaking: boolean;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  onClearChat: () => void;
  onStopSpeaking: () => void;
  onSpeakLastMessage: () => void;
}

const ChatActions = ({
  messages,
  isSpeaking,
  fontSize,
  onFontSizeChange,
  onClearChat,
  onStopSpeaking,
  onSpeakLastMessage
}: ChatActionsProps) => {
  const [showsSettings, setShowSettings] = React.useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={showsSettings} onOpenChange={setShowSettings}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-sm flex items-center gap-1 text-gray-700 dark:text-gray-300"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="space-y-4">
            <h4 className="font-medium leading-none mb-2 text-gray-900 dark:text-gray-100">Display Settings</h4>
            <FontSizeSettings 
              fontSize={fontSize} 
              onFontSizeChange={onFontSizeChange} 
            />
          </div>
        </PopoverContent>
      </Popover>
      
      {isSpeaking ? (
        <Button
          onClick={onStopSpeaking}
          variant="ghost"
          size="sm"
          className="text-sm flex items-center gap-1 text-red-500"
          title="Stop Speaking"
        >
          <VolumeX className="h-4 w-4" />
          <span className="hidden sm:inline">Stop</span>
        </Button>
      ) : messages.length > 0 && messages[messages.length - 1].type === 'bot' && (
        <Button
          onClick={onSpeakLastMessage}
          variant="ghost"
          size="sm"
          className="text-sm flex items-center gap-1 text-gray-700 dark:text-gray-300"
        >
          <Volume2 className="h-4 w-4" />
          <span className="hidden sm:inline">Speak</span>
        </Button>
      )}
      
      {messages.length > 0 && (
        <Button
          onClick={onClearChat}
          variant="ghost"
          size="sm"
          className="text-sm flex items-center gap-1 text-gray-700 dark:text-gray-300"
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Clear</span>
        </Button>
      )}
    </div>
  );
};

export default ChatActions;
