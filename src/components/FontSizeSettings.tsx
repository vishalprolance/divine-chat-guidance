
import React from 'react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Type, MinusCircle, PlusCircle, RotateCcw } from 'lucide-react';

interface FontSizeSettingsProps {
  fontSize: number;
  onFontSizeChange: (size: number) => void;
}

const FontSizeSettings: React.FC<FontSizeSettingsProps> = ({ fontSize, onFontSizeChange }) => {
  const MIN_FONT_SIZE = 12;
  const MAX_FONT_SIZE = 24;
  const DEFAULT_FONT_SIZE = 16;

  const increaseFontSize = () => {
    if (fontSize < MAX_FONT_SIZE) {
      onFontSizeChange(Math.min(fontSize + 1, MAX_FONT_SIZE));
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > MIN_FONT_SIZE) {
      onFontSizeChange(Math.max(fontSize - 1, MIN_FONT_SIZE));
    }
  };

  const resetFontSize = () => {
    onFontSizeChange(DEFAULT_FONT_SIZE);
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-divine-blue/70 dark:text-divine-gold/70 flex items-center">
          <Type className="h-4 w-4 mr-1" />
          Font Size
        </span>
        <Button
          onClick={resetFontSize}
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          onClick={decreaseFontSize}
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0 rounded-full"
          disabled={fontSize <= MIN_FONT_SIZE}
        >
          <MinusCircle className="h-4 w-4" />
        </Button>
        
        <Slider
          value={[fontSize]}
          min={MIN_FONT_SIZE}
          max={MAX_FONT_SIZE}
          step={1}
          onValueChange={(values) => onFontSizeChange(values[0])}
          className="flex-1"
        />
        
        <Button
          onClick={increaseFontSize}
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0 rounded-full"
          disabled={fontSize >= MAX_FONT_SIZE}
        >
          <PlusCircle className="h-4 w-4" />
        </Button>
        
        <span className="text-sm font-medium min-w-[30px] text-center">
          {fontSize}px
        </span>
      </div>
    </div>
  );
};

export default FontSizeSettings;
