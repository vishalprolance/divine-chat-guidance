
import React from 'react';

const MessageStyles = () => {
  return (
    <style>
      {`
        .message {
          margin-bottom: 1rem;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          max-width: 85%;
          animation: fadeIn 0.3s ease-in-out;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .message-user {
          background-color: rgba(210, 230, 255, 0.5);
          border-left: 3px solid rgba(100, 150, 255, 0.7);
          margin-left: auto;
          border-top-right-radius: 0;
          color: #000000;
        }
        
        .dark .message-user {
          background-color: rgba(50, 80, 140, 0.4);
          border-left: 3px solid rgba(100, 150, 255, 0.5);
          color: #ffffff;
        }
        
        .message-bot {
          background-color: rgba(240, 240, 250, 0.5);
          border-left: 3px solid rgba(120, 90, 190, 0.7);
          margin-right: auto;
          border-top-left-radius: 0;
          color: #000000;
        }
        
        .dark .message-bot {
          background-color: rgba(60, 50, 100, 0.4);
          border-left: 3px solid rgba(150, 130, 200, 0.6);
          color: #ffffff;
        }
        
        .highlighted-word {
          background-color: rgba(144, 97, 249, 0.35);
          border-radius: 4px;
          padding: 0 2px;
          display: inline-block;
          transition: all 0.2s ease;
        }
        
        .dark .highlighted-word {
          background-color: rgba(144, 97, 249, 0.5);
        }
        
        /* Specific styles for Kannada and Bengali */
        .kn-IN .highlighted-word, 
        .bn-IN .highlighted-word {
          background-color: rgba(144, 97, 249, 0.5);
          padding: 0 3px;
          margin: 0 1px;
        }
        
        @media (max-width: 640px) {
          .message {
            max-width: 90%;
          }
        }
      `}
    </style>
  );
};

export default MessageStyles;
