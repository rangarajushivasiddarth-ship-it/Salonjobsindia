'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Send, Building2, Search, Phone, MoreVertical, Check, CheckCheck, Image, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApp } from '@/lib/app-context'

interface Message {
  id: string
  text: string
  timestamp: Date
  isMe: boolean
  status: 'sent' | 'delivered' | 'read'
}

interface Conversation {
  id: string
  salonName: string
  salonId: string
  lastMessage: string
  timestamp: Date
  unread: number
  messages: Message[]
}

// Mock conversations
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    salonName: 'Glamour Studio',
    salonId: 's1',
    lastMessage: 'Yes, we are still hiring. Can you come for an interview?',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    unread: 2,
    messages: [
      { id: 'm1', text: 'Hi, I saw your job posting for Hair Stylist position. I have 3 years of experience.', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), isMe: true, status: 'read' },
      { id: 'm2', text: 'Hello! Thanks for reaching out. Your profile looks great!', timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000), isMe: false, status: 'read' },
      { id: 'm3', text: 'Is the position still available?', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), isMe: true, status: 'read' },
      { id: 'm4', text: 'Yes, we are still hiring. Can you come for an interview?', timestamp: new Date(Date.now() - 30 * 60 * 1000), isMe: false, status: 'read' },
    ],
  },
  {
    id: 'c2',
    salonName: 'Style Haven',
    salonId: 's2',
    lastMessage: 'Thank you for applying!',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    unread: 0,
    messages: [
      { id: 'm5', text: 'I would like to apply for the Makeup Artist position.', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), isMe: true, status: 'read' },
      { id: 'm6', text: 'Thank you for applying!', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), isMe: false, status: 'read' },
    ],
  },
  {
    id: 'c3',
    salonName: 'Beauty Bliss',
    salonId: 's3',
    lastMessage: 'We will get back to you soon.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    unread: 0,
    messages: [
      { id: 'm7', text: 'Hello, is the receptionist role still open?', timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000), isMe: true, status: 'read' },
      { id: 'm8', text: 'We will get back to you soon.', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), isMe: false, status: 'read' },
    ],
  },
]

export function MessagesScreen() {
  const { goToStep, user } = useApp()
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const filteredConversations = conversations.filter(c => 
    c.salonName.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0)
  
  const formatTime = (date: Date) => {
    const now = Date.now()
    const diff = now - date.getTime()
    
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    } else if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    if (selectedConversation) {
      scrollToBottom()
    }
  }, [selectedConversation])
  
  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return
    
    const message: Message = {
      id: `m${Date.now()}`,
      text: newMessage.trim(),
      timestamp: new Date(),
      isMe: true,
      status: 'sent',
    }
    
    setConversations(prev => prev.map(c => {
      if (c.id === selectedConversation.id) {
        return {
          ...c,
          messages: [...c.messages, message],
          lastMessage: message.text,
          timestamp: message.timestamp,
        }
      }
      return c
    }))
    
    setSelectedConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, message],
    } : null)
    
    setNewMessage('')
    
    // Simulate reply after 2 seconds
    setTimeout(() => {
      const reply: Message = {
        id: `m${Date.now()}`,
        text: 'Thanks for your message! We will review and get back to you.',
        timestamp: new Date(),
        isMe: false,
        status: 'read',
      }
      
      setConversations(prev => prev.map(c => {
        if (c.id === selectedConversation.id) {
          return {
            ...c,
            messages: [...c.messages, reply],
            lastMessage: reply.text,
            timestamp: reply.timestamp,
          }
        }
        return c
      }))
      
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, reply],
      } : null)
    }, 2000)
  }
  
  const openConversation = (conversation: Conversation) => {
    // Mark as read
    setConversations(prev => prev.map(c => 
      c.id === conversation.id ? { ...c, unread: 0 } : c
    ))
    setSelectedConversation({ ...conversation, unread: 0 })
  }
  
  // Chat View
  if (selectedConversation) {
    return (
      <div className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
        
        {/* Header */}
        <header className="relative z-10 p-4 glass border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedConversation(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold">{selectedConversation.salonName}</h1>
                <p className="text-xs text-muted-foreground">Usually replies within an hour</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                <Phone className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>
        
        {/* Messages */}
        <div className="relative z-10 flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {selectedConversation.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.isMe
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'glass-card rounded-bl-md'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <div className={`flex items-center justify-end gap-1 mt-1 ${
                    message.isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    <span className="text-[10px]">
                      {formatTime(message.timestamp)}
                    </span>
                    {message.isMe && (
                      message.status === 'read' 
                        ? <CheckCheck className="w-3 h-3" />
                        : <Check className="w-3 h-3" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Input */}
        <div className="relative z-10 p-4 glass border-t border-border/30 safe-area-bottom">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground shrink-0"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 h-10 bg-secondary/50 border-border/50"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              size="icon"
              className="bg-primary hover:bg-primary/90 shrink-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  // Conversations List View
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden pb-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      
      {/* Header */}
      <header className="relative z-10 p-4 glass">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => goToStep(user?.isSubscribed ? 'results' : 'discovery')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Messages</h1>
              {totalUnread > 0 && (
                <p className="text-sm text-muted-foreground">{totalUnread} unread</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-12 bg-secondary/50 border-border/50"
          />
        </div>
      </header>
      
      {/* Conversations List */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          <div className="divide-y divide-border/30">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => openConversation(conversation)}
                className="w-full p-4 flex items-center gap-3 hover:bg-secondary/30 transition-colors text-left"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  {conversation.unread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 flex items-center justify-center text-xs font-bold bg-destructive text-destructive-foreground rounded-full">
                      {conversation.unread}
                    </span>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-semibold truncate ${conversation.unread > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {conversation.salonName}
                    </h3>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatTime(conversation.timestamp)}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${conversation.unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {conversation.lastMessage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery 
                ? 'Try a different search term' 
                : 'Start a conversation by applying to a job'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
