
import React, { useState, useRef, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import LanguageSelector from './LanguageSelector';
import ChatActions from './ChatActions';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useChatState } from '@/hooks/useChatState';

const ChatInterface = () => {
  const [language, setLanguage] = useState('en-US'); // Default language
  const [fontSize, setFontSize] = useState(16); // Default font size
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Use custom hooks to manage speech, recognition, and chat state
  const {
    isRecording,
    transcript,
    toggleRecording,
    stopRecording,
    startRecording
  } = useSpeechRecognition(language);

  const {
    isSpeaking,
    highlightedWordIndex,
    currentSpeakingMessage,
    speakResponse,
    stopSpeaking
  } = useSpeechSynthesis();

  const {
    messages,
    input,
    setInput,
    isProcessing,
    handleSendMessage,
    clearChat
  } = useChatState();

  const languages = [
    { code: 'en-US', name: 'English' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'kn-IN', name: 'Kannada' },
    { code: 'sa-IN', name: 'Sanskrit' },
    { code: 'mr-IN', name: 'Marathi' },
    { code: 'bn-IN', name: 'Bengali' },
  ];

  const greetingMessages = {
    'en-US': 'Speak or type your question to receive guidance. Krishna\'s wisdom awaits your inquiry.',
    'hi-IN': 'मार्गदर्शन प्राप्त करने के लिए अपना प्रश्न बोलें या टाइप करें। कृष्ण का ज्ञान आपके प्रश्न की प्रतीक्षा कर रहा है।',
    'kn-IN': 'ಮಾರ್ಗದರ್ಶನ ಪಡೆಯಲು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ. ಕೃಷ್ಣನ ಜ್ಞಾನವು ನಿಮ್ಮ ಪ್ರಶ್ನೆಗಾಗಿ ಕಾಯುತ್ತಿದೆ.',
    'sa-IN': 'मार्गदर्शनं प्राप्तुं प्रश्नं वदतु अथवा लिखतु। कृष्णस्य ज्ञानं भवतः प्रश्नस्य प्रतीक्षायां वर्तते।',
    'mr-IN': 'मार्गदर्शन मिळवण्यासाठी आपला प्रश्न बोला किंवा टाइप करा. कृष्णाचे ज्ञान आपल्या प्रश्नाची प्रतीक्षा करत आहे.',
    'bn-IN': 'নির্দেশনা পেতে আপনার প্রশ্ন বলুন বা টাইপ করুন। কৃষ্ণের জ্ঞান আপনার প্রশ্নের অপেক্ষায় রয়েছে।'
  };

  // Set font size
  useEffect(() => {
    document.documentElement.style.setProperty('--message-font-size', `${fontSize}px`);
  }, [fontSize]);

  // Add class to body for language-specific styling
  useEffect(() => {
    document.body.className = language;
  }, [language]);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    
    stopSpeaking();
    
    if (isRecording) {
      stopRecording(false);
      
      setTimeout(() => {
        startRecording(value);
      }, 300);
    }
  };

  const handleToggleRecording = async () => {
    const result = await toggleRecording();
    if (result) {
      handleSendMessage(result, language, speakResponse);
    }
  };

  const handleChatClear = () => {
    clearChat(stopSpeaking, isRecording, stopRecording);
  };

  const handleSpeakLastMessage = () => {
    if (messages.length > 0 && messages[messages.length - 1].type === 'bot') {
      speakResponse(messages[messages.length - 1].text, language);
    }
  };

  const handleMessageSend = (text: string) => {
    handleSendMessage(text, language, speakResponse);
  };

  const greetingMessage = greetingMessages[language] || greetingMessages['en-US'];

  return (
    <div 
      className={`flex flex-col h-full max-h-full rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-950 ${language}`} 
      ref={chatContainerRef}
    >
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black sticky top-0 z-10">
        <LanguageSelector 
          language={language}
          onChange={handleLanguageChange}
          languages={languages}
        />
        
        <ChatActions 
          messages={messages}
          isSpeaking={isSpeaking}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          onClearChat={handleChatClear}
          onStopSpeaking={stopSpeaking}
          onSpeakLastMessage={handleSpeakLastMessage}
        />
      </div>
      
      <div 
        className="flex-grow overflow-hidden relative" 
        style={{
          height: "calc(100% - 120px)",
          overscrollBehavior: 'none',
        }}
        ref={messageListRef}
      >
        <MessageList 
          messages={messages}
          isProcessing={isProcessing}
          transcript={transcript}
          isRecording={isRecording}
          greetingMessage={greetingMessage}
          fontSize={fontSize}
          highlightedWordIndex={highlightedWordIndex}
          currentSpeakingMessage={currentSpeakingMessage}
        />
      </div>
      
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black sticky bottom-0 z-10">
        <ChatInput 
          input={input}
          setInput={setInput}
          isRecording={isRecording}
          isProcessing={isProcessing}
          toggleRecording={handleToggleRecording}
          handleSendMessage={handleMessageSend}
        />
      </div>
    </div>
  );
};

export default ChatInterface;
