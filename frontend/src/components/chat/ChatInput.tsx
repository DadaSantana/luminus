import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Plus, Send, Paperclip, Mic, Volume2, X, File } from "lucide-react";
import { useT } from "@/lib/i18n";
import { GoogleDriveLogoColored, OneDriveLogoColored, DropboxLogoColored } from "@/components/ui/ProviderLogos";

interface ChatInputProps {
  message: string;
  setMessage: (message: string) => void;
  onSend: (e: React.FormEvent) => void;
  sending: boolean;
  thinking: boolean;
  attachedFiles?: File[];
  onFileSelect?: (file: File) => void;
  onRemoveFile?: (index: number) => void;
  onGoogleDriveConnect?: () => void;
  onOneDriveConnect?: () => void;
  onDropboxConnect?: () => void;
}

export function ChatInput({
  message,
  setMessage,
  onSend,
  sending,
  thinking,
  attachedFiles = [],
  onFileSelect,
  onRemoveFile,
  onGoogleDriveConnect,
  onOneDriveConnect,
  onDropboxConnect,
}: ChatInputProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useT();

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleGoogleDriveClick = () => {
    setIsPopoverOpen(false);
    onGoogleDriveConnect?.();
  };

  const handleOneDriveClick = () => {
    setIsPopoverOpen(false);
    onOneDriveConnect?.();
  };

  const handleDropboxClick = () => {
    setIsPopoverOpen(false);
    onDropboxConnect?.();
  };

  const handleRemoveFile = (index: number) => {
    onRemoveFile?.(index);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="border-t bg-background/30 dark:bg-white/5 backdrop-blur-sm p-6">
      <form onSubmit={onSend} className="max-w-4xl mx-auto">
        <div className="relative">
          {/* Attached files section */}
          {attachedFiles.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm"
                  >
                    <File className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-900 dark:text-blue-100 font-medium">
                      {file.name}
                    </span>
                    <span className="text-blue-700 dark:text-blue-300 text-xs">
                      {formatFileSize(file.size)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      onClick={() => handleRemoveFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input container */}
          <div className="relative flex items-end gap-2 p-4 rounded-2xl border border-input bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            {/* Plus button for file options */}
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-2" align="start">
                <div className="space-y-1">
                  {/* File upload option */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-10 px-3"
                    onClick={handleFileClick}
                  >
                    <Paperclip className="h-4 w-4 mr-3" />
                    Adicionar ficheiro
                  </Button>
                  
                  <Separator />
                  
                  {/* Cloud storage options */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-10 px-3"
                    onClick={handleGoogleDriveClick}
                  >
                    <GoogleDriveLogoColored className="h-4 w-4 mr-3" />
                    Conectar ao Drive
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-10 px-3"
                    onClick={handleOneDriveClick}
                  >
                    <OneDriveLogoColored className="h-4 w-4 mr-3" />
                    Conectar ao OneDrive
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-10 px-3"
                    onClick={handleDropboxClick}
                  >
                    <DropboxLogoColored className="h-4 w-4 mr-3" />
                    Conectar ao Dropbox
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept="*/*"
            />

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder="Pergunte qualquer coisa"
              className="flex-1 min-h-[24px] max-h-[120px] resize-none border-0 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0"
              disabled={sending || thinking}
              rows={1}
            />

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              {/* Microphone button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setIsRecording(!isRecording)}
              >
                <Mic className={`h-4 w-4 ${isRecording ? 'text-red-500' : ''}`} />
              </Button>

              {/* Send button */}
              <Button
                type="submit"
                size="sm"
                disabled={!message.trim() || sending || thinking}
                className="h-8 w-8 p-0 bg-luminus-primary hover:bg-luminus-primary/90 disabled:opacity-50"
              >
                {sending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-center mt-3">
            <p className="text-xs text-muted-foreground">
              O ChatGPT pode cometer erros. Considere verificar informações importantes.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
