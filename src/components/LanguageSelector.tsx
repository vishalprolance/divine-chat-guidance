
import React from 'react';
import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface LanguageSelectorProps {
  language: string;
  onChange: (value: string) => void;
  languages: Array<{ code: string; name: string }>;
}

const LanguageSelector = ({ language, onChange, languages }: LanguageSelectorProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Globe className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      <Select
        value={language}
        onValueChange={onChange}
      >
        <SelectTrigger className="h-8 w-[110px] bg-transparent border-gray-300 dark:border-gray-700 text-sm">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code} className="text-sm">
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector;
