import React, { useState, useRef, useEffect } from "react";
import { Send, Smile, Paperclip, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatTextBoxProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  showEmoji?: boolean;
  showAttachment?: boolean;
  showVoice?: boolean;
}

export default function ChatTextBox({ 
  onSend, 
  placeholder = "Type your message...",
  disabled = false,
  maxLength = 1000,
  showEmoji = true,
  showAttachment = true,
  showVoice = true
}: ChatTextBoxProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  function handleVoiceToggle() {
    setIsRecording(!isRecording);
    // Voice recording functionality would be implemented here
  }

  function insertEmoji(emoji: string) {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.substring(0, start) + emoji + message.substring(end);
      setMessage(newMessage);
      
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    }
  }

  const commonEmojis = ['😊', '👍', '❤️', '😂', '😢', '😮', '🎉', '👏'];

  return (
    <div className="w-full">
      <form onSubmit={handleSend} className="flex flex-col gap-2">
        {/* Emoji picker */}
        {showEmoji && isFocused && (
          <div className="flex gap-1 p-2 bg-gray-50 rounded-lg border">
            {commonEmojis.map((emoji, index) => (
              <button
                key={index}
                type="button"
                onClick={() => insertEmoji(emoji)}
                className="text-lg hover:bg-gray-200 rounded p-1 transition-colors"
                disabled={disabled}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        
        {/* Main input area */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={maxLength}
              className="min-h-[44px] max-h-32 resize-none pr-12"
              style={{ 
                paddingRight: '48px',
                lineHeight: '1.4'
              }}
            />
            
            {/* Character count */}
            {maxLength && (
              <div className="absolute bottom-1 right-2 text-xs text-gray-400">
                {message.length}/{maxLength}
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-1">
            {showAttachment && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={disabled}
                className="h-11 w-11"
                title="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            )}
            
            {showVoice && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleVoiceToggle}
                disabled={disabled}
                className={`h-11 w-11 ${isRecording ? 'bg-red-100 text-red-600' : ''}`}
                title={isRecording ? "Stop recording" : "Start recording"}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={!message.trim() || disabled}
              className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Helper text */}
        <div className="text-xs text-gray-500 flex justify-between">
          <span>Press Enter to send, Shift+Enter for new line</span>
          {disabled && <span className="text-red-500">Input disabled</span>}
        </div>
      </form>
    </div>
  );
}
