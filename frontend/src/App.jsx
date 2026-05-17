import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  FileText, 
  MessageSquare, 
  ChevronRight, 
  ExternalLink, 
  Layers, 
  History, 
  RefreshCcw,
  Maximize2,
  Minimize2,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  GripVertical
} from 'lucide-react';

const API_URL = 'http://localhost:8000';

function App() {
  const defaultMessage = { 
    id: 'default', 
    type: 'ai', 
    content: "Welcome to Maryam's AI — your intelligent enterprise RAG assistant for advanced document analysis and accurate AI-powered answers.",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  const [messages, setMessages] = useState([defaultMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activePdfUrl, setActivePdfUrl] = useState(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfFilename, setPdfFilename] = useState('');
  
  // Resizable & Fullscreen PDF states
  const [pdfWidth, setPdfWidth] = useState(45);
  const [isDragging, setIsDragging] = useState(false);
  const [isPdfFullscreen, setIsPdfFullscreen] = useState(false);

  // Chat History States
  const [chatList, setChatList] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const [suggestedQuestions] = useState([
    "What are the main topics discussed?",
    "Summarize the key findings.",
    "Are there any specific dates mentioned?"
  ]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial load
  useEffect(() => {
    fetchChats();
  }, []);

  // Resize Handlers
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const newWidth = ((window.innerWidth - e.clientX) / window.innerWidth) * 100;
    if (newWidth > 25 && newWidth < 75) {
      setPdfWidth(newWidth);
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);


  const fetchChats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/chats`);
      const data = await res.json();
      setChatList(data.chats || []);
      
      if (!currentChatId && data.chats && data.chats.length > 0) {
        loadChat(data.chats[0].id);
      } else if (!currentChatId) {
        createNewChat();
      }
    } catch (e) {
      console.error("Failed to fetch chats", e);
    }
  };

  const createNewChat = async () => {
    try {
      const res = await fetch(`${API_URL}/api/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: "New Chat" })
      });
      const data = await res.json();
      setChatList(prev => [data, ...prev]);
      setCurrentChatId(data.id);
      setMessages([defaultMessage]);
      setActivePdfUrl(null);
      setIsPdfFullscreen(false);
    } catch (e) {
      console.error("Failed to create chat", e);
    }
  };

  const loadChat = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/chats/${id}`);
      const data = await res.json();
      setCurrentChatId(id);
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages);
        const lastCitationMsg = [...data.messages].reverse().find(m => m.citations && m.citations.length > 0);
        if (lastCitationMsg && lastCitationMsg.citations[0]) {
          setPdfFilename(lastCitationMsg.citations[0].source);
        }
      } else {
        setMessages([defaultMessage]);
      }
      setActivePdfUrl(null);
      setIsPdfFullscreen(false);
    } catch (e) {
      console.error("Failed to load chat", e);
    }
  };

  const deleteChat = async (e, id) => {
    e.stopPropagation();
    try {
      await fetch(`${API_URL}/api/chats/${id}`, { method: 'DELETE' });
      setChatList(prev => prev.filter(c => c.id !== id));
      if (currentChatId === id) {
        setCurrentChatId(null);
        setMessages([defaultMessage]);
        fetchChats();
      }
    } catch (e) {
      console.error("Failed to delete chat", e);
    }
  };

  const startRename = (e, chat) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const saveRename = async (e, id) => {
    e.stopPropagation();
    try {
      await fetch(`${API_URL}/api/chats/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle })
      });
      setChatList(prev => prev.map(c => c.id === id ? { ...c, title: editTitle } : c));
      setEditingChatId(null);
    } catch (e) {
      console.error("Failed to rename chat", e);
    }
  };

  const handleSend = async (e, customInput = null) => {
    if (e) e.preventDefault();
    const textToSend = customInput || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => {
        const newMsgs = prev[0]?.id === 'default' ? [] : prev;
        return [...newMsgs, userMessage];
    });
    if (!customInput) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: textToSend,
          chat_id: currentChatId
        }),
      });

      if (!response.ok) throw new Error('Failed to connect to backend');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: '',
        citations: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim());

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === 'citations') {
              aiMessage.citations = parsed.data;
              if (parsed.data.length > 0) {
                setPdfFilename(parsed.data[0].source);
              }
            } else if (parsed.type === 'meta') {
              aiMessage.confidence = parsed.data.confidence;
            } else if (parsed.type === 'error') {
              aiMessage.content += `\n\n**Error:** ${parsed.data}`;
            } else if (parsed.type === 'chunk') {
              aiMessage.content += parsed.data;
            }
            
            setMessages(prev => {
              const newMsgs = [...prev];
              newMsgs[newMsgs.length - 1] = { ...aiMessage };
              return newMsgs;
            });
          } catch (e) {
            console.error("Error parsing chunk", line, e);
          }
        }
      }
      
      fetchChats();
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        content: 'Something went wrong. Please check if the backend is running.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const openSource = (page, source) => {
    // Append parameters for better view fit and readability
    setActivePdfUrl(`${API_URL}/api/data/${source}#page=${page}&view=FitH,top&zoom=100`);
    setPdfPage(page);
    // If on mobile, entering source opens fullscreen implicitly via CSS below
  };

  return (
    <div className={`flex h-screen bg-dark-900 text-white overflow-hidden font-sans ${isDragging ? 'select-none cursor-col-resize' : ''}`}>
      {/* Sidebar */}
      <div className={`w-72 bg-dark-800 border-r border-dark-700 flex flex-col hidden md:flex z-40 transition-all ${isPdfFullscreen ? '-ml-72' : ''}`}>
        <div className="p-4 border-b border-dark-700">
          <div className="flex items-center gap-3 mb-6 px-2 group cursor-default">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-700 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all duration-300">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Maryam's AI</span>
          </div>

          <button 
            onClick={createNewChat}
            className="w-full flex items-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-500 rounded-xl text-white font-medium transition-all shadow-lg shadow-primary-600/20"
          >
            <Plus className="w-5 h-5" />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
            <History className="w-4 h-4" /> History
          </div>
          
          <AnimatePresence>
            {chatList.map((chat) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                onClick={() => loadChat(chat.id)}
                className={`group cursor-pointer rounded-lg px-3 py-3 flex items-center justify-between transition-all ${
                  currentChatId === chat.id ? 'bg-dark-700 text-white' : 'text-gray-400 hover:bg-dark-700/50 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <MessageSquare className={`w-4 h-4 shrink-0 ${currentChatId === chat.id ? 'text-primary-500' : ''}`} />
                  
                  {editingChatId === chat.id ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.key === 'Enter' && saveRename(e, chat.id)}
                      className="bg-dark-900 border border-primary-500 rounded px-2 py-1 text-sm w-full outline-none text-white"
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm truncate pr-2">{chat.title}</span>
                  )}
                </div>

                <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${currentChatId === chat.id ? 'opacity-100' : ''}`}>
                  {editingChatId === chat.id ? (
                    <>
                      <button onClick={(e) => saveRename(e, chat.id)} className="p-1 hover:text-green-400"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingChatId(null); }} className="p-1 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={(e) => startRename(e, chat)} className="p-1 text-gray-500 hover:text-white transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={(e) => deleteChat(e, chat.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="p-4 border-t border-dark-700 bg-dark-800">
          <div className="p-3 bg-dark-900 rounded-xl border border-dark-700 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-gray-200">System Online</span>
              </div>
              <p className="text-[10px] text-gray-500">Groq + FAISS Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-dark-900">
        {/* Header */}
        <header className={`h-20 border-b border-dark-700 bg-dark-900/60 backdrop-blur-xl flex items-center justify-between px-6 z-20 shadow-sm transition-all ${isPdfFullscreen ? '-mt-20' : ''}`}>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white tracking-wide">
              <Sparkles className="w-5 h-5 text-primary-500" />
              RAG Based AI Application
            </h2>
            <p className="text-xs text-primary-400 font-medium tracking-wider uppercase ml-7 mt-0.5 opacity-80">
              Enterprise Multimodal Document Intelligence
            </p>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative w-full h-full">
          {/* Chat Panel */}
          <div 
            className="flex flex-col h-full bg-dark-900 transition-all duration-300 relative"
            style={{ 
              width: activePdfUrl ? (isPdfFullscreen ? '0%' : `${100 - pdfWidth}%`) : '100%',
              minWidth: activePdfUrl && !isPdfFullscreen ? '25%' : '0%',
              opacity: isPdfFullscreen ? 0 : 1
            }}
          >
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[90%] md:max-w-[85%] rounded-2xl p-5 shadow-sm ${
                      msg.type === 'user' 
                        ? 'bg-primary-600 text-white rounded-tr-none' 
                        : msg.type === 'error'
                          ? 'bg-red-500/10 border border-red-500/50 text-red-200'
                          : 'bg-dark-800 border border-dark-700 text-gray-100 rounded-tl-none shadow-lg'
                    }`}>
                      <div className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                        {msg.content || (isLoading && msg.type === 'ai' ? <div className="flex gap-1 py-2"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" /><div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" /></div> : '')}
                      </div>

                      {msg.confidence && (
                        <div className="mt-4 flex items-center gap-2">
                           <div className="h-1.5 w-24 bg-dark-900 rounded-full overflow-hidden shadow-inner">
                              <div 
                                className={`h-full transition-all duration-1000 ${msg.confidence > 80 ? 'bg-green-500' : msg.confidence > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${msg.confidence}%` }}
                              />
                           </div>
                           <span className="text-[11px] text-gray-400 font-bold tracking-wide">CONFIDENCE: {msg.confidence}%</span>
                        </div>
                      )}
                      
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-dark-700/70">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Sources Referenced</p>
                          <div className="flex flex-wrap gap-2.5">
                            {msg.citations.map((cite, i) => (
                              <button
                                key={i}
                                onClick={() => openSource(cite.page, cite.source)}
                                className="flex items-center gap-3 px-3 py-2 bg-dark-900/60 hover:bg-primary-600/20 border border-dark-600/50 hover:border-primary-500/60 rounded-xl transition-all group backdrop-blur-sm"
                              >
                                <img src={`${API_URL}${cite.preview}`} className="w-9 h-12 object-cover rounded shadow-md group-hover:scale-105 transition-transform border border-dark-600" />
                                <div className="text-left">
                                  <span className="block text-xs font-bold text-primary-400 group-hover:text-primary-300">Page {cite.page}</span>
                                  <span className="block text-[10px] text-gray-500 truncate w-24 group-hover:text-gray-400">{cite.source}</span>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-primary-400 ml-1" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-4 flex items-center justify-between opacity-50">
                         <div className="flex items-center gap-1.5 text-[11px] font-medium">
                           <Clock className="w-3 h-3" />
                           {msg.timestamp}
                         </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={chatEndRef} className="h-4" />
            </div>

            {/* Suggested Questions */}
            {!isLoading && messages.length <= 2 && (
              <div className="px-6 py-2 flex flex-wrap gap-2 justify-center mb-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={(e) => handleSend(e, q)}
                    className="text-[13px] px-5 py-2.5 bg-dark-800 border border-dark-600 hover:border-primary-500 hover:bg-dark-700 rounded-full text-gray-300 hover:text-white transition-all shadow-md font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 md:p-6 bg-gradient-to-t from-dark-900 via-dark-900 to-transparent">
              <form onSubmit={(e) => handleSend(e)} className="relative group max-w-4xl mx-auto">
                <div className="absolute inset-0 bg-primary-500/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl" />
                <div className="relative flex items-center bg-dark-800/90 backdrop-blur-md border border-dark-600 hover:border-dark-500 rounded-2xl p-1.5 transition-all focus-within:border-primary-500/60 shadow-xl">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about the document..."
                    className="flex-1 bg-transparent px-5 py-3 outline-none text-gray-100 placeholder-gray-500 text-[15px] font-medium"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="p-3 bg-primary-600 hover:bg-primary-500 disabled:bg-dark-700 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-primary-600/30 text-white"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
              <p className="mt-3 text-center text-[11px] text-gray-500 font-medium">
                AI can make mistakes. Verify important information.
              </p>
            </div>
          </div>

          {/* Draggable Divider */}
          {activePdfUrl && !isPdfFullscreen && (
            <div 
              className="w-1.5 bg-dark-800 hover:bg-primary-500/50 active:bg-primary-500 cursor-col-resize z-30 transition-colors flex items-center justify-center hidden md:flex"
              onMouseDown={() => setIsDragging(true)}
            >
              <div className="h-10 w-1 bg-dark-600 rounded-full flex items-center justify-center">
                <GripVertical className="w-3 h-3 text-gray-500" />
              </div>
            </div>
          )}

          {/* PDF Preview Sidebar */}
          <AnimatePresence>
            {activePdfUrl && (
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={`absolute right-0 top-0 bottom-0 bg-dark-800 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] z-40 transition-all duration-300 md:relative md:z-10`}
                style={{ 
                  width: isPdfFullscreen ? '100%' : (window.innerWidth < 768 ? '100%' : `${pdfWidth}%`),
                  borderLeft: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <div className="h-14 border-b border-dark-700/50 flex items-center justify-between px-4 bg-dark-900/80 backdrop-blur-md">
                  <div className="flex items-center gap-3 truncate">
                    <div className="p-1.5 bg-primary-500/10 rounded-lg border border-primary-500/20">
                      <FileText className="w-4 h-4 text-primary-500 shrink-0" />
                    </div>
                    <span className="text-sm font-semibold text-gray-200 truncate">{pdfFilename}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsPdfFullscreen(!isPdfFullscreen)}
                      className="p-2 hover:bg-dark-700 text-gray-400 hover:text-white rounded-lg transition-colors hidden md:block"
                      title={isPdfFullscreen ? "Exit Fullscreen" : "Fullscreen Viewer"}
                    >
                      {isPdfFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => setActivePdfUrl(null)}
                      className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 bg-[#2b2b2b] flex items-center justify-center p-0 md:p-2 overflow-hidden relative">
                  <div className="absolute inset-0 shadow-inner pointer-events-none" />
                  <iframe 
                    src={activePdfUrl} 
                    className="w-full h-full border-none rounded-none md:rounded-lg shadow-2xl bg-white"
                    title="PDF Viewer"
                  />
                </div>
                
                <div className="p-3 border-t border-dark-700/50 flex justify-between items-center text-xs text-gray-400 bg-dark-900">
                  <span className="font-semibold px-2 py-1 bg-dark-800 rounded-md border border-dark-700">Page {pdfPage}</span>
                  <div className="flex gap-2">
                    <button onClick={() => window.open(activePdfUrl.split('#')[0], '_blank')} className="flex items-center gap-2 hover:text-primary-400 transition-colors font-medium">
                      Open Externally <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default App;
