import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Activity, 
  Zap, 
  FileText, 
  Shield,
  Sparkles,
  Loader2
} from 'lucide-react';
import apiClient from '../../../lib/api-client';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt: string;
}

const AiToolbox: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickActions: QuickAction[] = [
    { id: 'audit', label: 'Generate Audit', icon: FileText, prompt: 'Generate a quick audit report for today. Include revenue, expenses, and any anomalies.' },
    { id: 'predict', label: 'Predict Demand', icon: Zap, prompt: 'Analyze recent sales trends and predict demand for the next week.' },
    { id: 'scan', label: 'Scan for Theft', icon: Shield, prompt: 'Check for any suspicious patterns or potential theft indicators in recent transactions.' },
    { id: 'report', label: 'Draft Report', icon: FileText, prompt: 'Create a comprehensive daily operations report with key metrics and insights.' },
  ];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 10) return 'Just now';
    if (diffMins < 1) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    // Add user message to state
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setCommandInput('');
    setIsLoading(true);

    try {
      // Convert messages to API format (history)
      const history = messages.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      // Call API
      const response = await apiClient.ai.chat(messageText, history);
      
      // Add assistant response to state
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('AI Chat Error:', error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message || 'Failed to process your request'}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    sendMessage(action.prompt);
  };

  const handleSendCommand = () => {
    sendMessage(commandInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendCommand();
    }
  };

  return (
    <>
      {/* Collapsed State - Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 bg-white rounded-full shadow-xl border border-slate-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-black text-slate-900">AI Assistant</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-500">3 Agents Active</span>
            </div>
          </div>
        </button>
      )}

      {/* Expanded State - Toolbox Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden flex flex-col max-h-[600px] min-h-[500px]">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-sm font-black text-white tracking-widest uppercase">HGT ORCHESTRATOR</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-400">3 Agents Active</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors relative z-10"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-16 -mt-16"></div>
            </div>

            {/* Chat Messages Section */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Chat History</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent flex-1">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Bot className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-medium">No messages yet. Ask me anything about factory operations!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2 p-2 rounded-lg transition-colors border ${
                        msg.role === 'user'
                          ? 'bg-emerald-50 border-emerald-100'
                          : 'bg-white/80 border-slate-100/50'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                        msg.role === 'user' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-black text-slate-900">
                            {msg.role === 'user' ? 'You' : 'HGT Orchestrator'}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold">
                            {formatTimeAgo(msg.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white/80 border border-slate-100/50">
                    <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                    <span className="text-xs text-slate-500 font-medium">Thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Quick Actions Section */}
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Quick Actions</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      disabled={isLoading}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white group-hover:bg-emerald-100 flex items-center justify-center transition-colors border border-slate-200 group-hover:border-emerald-300">
                        <Icon className="w-4 h-4 text-slate-600 group-hover:text-emerald-600 transition-colors" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 group-hover:text-emerald-700 text-center">
                        {action.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Command Input Section */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Command Input</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask HGT to analyze factory performance..."
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-all"
                />
                <button
                  onClick={handleSendCommand}
                  disabled={!commandInput.trim() || isLoading}
                  className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiToolbox;
