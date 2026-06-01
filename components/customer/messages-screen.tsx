'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Send, Building2, Search, Phone, MoreVertical, Check, CheckCheck, Paperclip, MapPin, Briefcase, MessageCircle, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApp } from '@/lib/app-context'
import { useTranslation } from '@/lib/use-translation'
import { useLanguage } from '@/lib/language-context'

interface Message {
  id: string
  text: string
  timestamp: Date
  isMe: boolean
  status: 'sent' | 'delivered' | 'read'
  type: 'text' | 'contact' | 'job_card'
  contactInfo?: {
    phone: string
    whatsapp?: string
  }
  jobInfo?: {
    role: string
    salary: string
    location: string
  }
}

interface Conversation {
  id: string
  salonName: string
  salonId: string
  salonPhone: string
  salonWhatsapp?: string
  jobRole?: string
  jobSalary?: string
  location?: string
  lastMessage: string
  timestamp: Date
  unread: number
  messages: Message[]
  contactShared: boolean
}

export function MessagesScreen() {
  const { goToStep, user } = useApp()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showContactCard, setShowContactCard] = useState(false)
  const [copiedPhone, setCopiedPhone] = useState(false)
  const { t } = useTranslation()
  const { currentLanguage } = useLanguage()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const filteredConversations = conversations.filter(c => 
    c.salonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.jobRole?.toLowerCase().includes(searchQuery.toLowerCase())
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
  }, [selectedConversation?.messages.length])
  
  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone.replace(/\s/g, ''))
    setCopiedPhone(true)
    setTimeout(() => setCopiedPhone(false), 2000)
  }
  
  const openWhatsApp = (number: string) => {
    window.open(`https://wa.me/${number}`, '_blank')
  }
  
  const callPhone = (phone: string) => {
    window.open(`tel:${phone.replace(/\s/g, '')}`, '_self')
  }
  
  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return
    
    const message: Message = {
      id: `m${Date.now()}`,
      text: newMessage.trim(),
      timestamp: new Date(),
      isMe: true,
      status: 'sent',
      type: 'text',
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
        text: 'Thanks for your message! We will review and get back to you shortly.',
        timestamp: new Date(),
        isMe: false,
        status: 'read',
        type: 'text',
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
    setConversations(prev => prev.map(c => 
      c.id === conversation.id ? { ...c, unread: 0 } : c
    ))
    setSelectedConversation({ ...conversation, unread: 0 })
  }
  
  // Render contact card message
  const renderContactCard = (message: Message, conversation: Conversation) => (
    <div className="p-4 bg-gradient-to-br from-primary/20 to-accent/10 rounded-2xl border border-primary/30 max-w-[85%]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
          <Phone className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm font-medium">Contact Shared</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-background/50 rounded-xl">
          <div>
            <p className="text-xs text-muted-foreground">Phone Number</p>
            <p className="font-semibold">{message.contactInfo?.phone}</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyPhone(message.contactInfo?.phone || '')}
              className="h-8 w-8 p-0"
            >
              {copiedPhone ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => callPhone(message.contactInfo?.phone || '')}
              className="h-8 w-8 p-0 text-green-500"
            >
              <Phone className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {message.contactInfo?.whatsapp && (
          <Button
            onClick={() => openWhatsApp(message.contactInfo?.whatsapp || '')}
            className="w-full h-10 bg-green-600 hover:bg-green-700 text-white"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat on WhatsApp
          </Button>
        )}
      </div>
      
      <div className="flex items-center justify-end gap-1 mt-2 text-muted-foreground">
        <span className="text-[10px]">{formatTime(message.timestamp)}</span>
      </div>
    </div>
  )
  
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
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {selectedConversation.jobRole}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {selectedConversation.contactShared && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => callPhone(selectedConversation.salonPhone)}
                  className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                >
                  <Phone className="w-5 h-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowContactCard(!showContactCard)}
                className="text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Job Info Banner */}
          <div className="mt-3 p-3 bg-secondary/30 rounded-xl flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">{selectedConversation.jobRole}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span>{selectedConversation.jobSalary}</span>
                <span>|</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {selectedConversation.location}
                </span>
              </p>
            </div>
            {selectedConversation.contactShared && (
              <div className="px-2 py-1 bg-green-500/20 text-green-500 text-xs font-medium rounded-full">
                Contact Shared
              </div>
            )}
          </div>
        </header>
        
        {/* Contact Card Popup */}
        {showContactCard && selectedConversation.contactShared && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6">
            <div className="w-full max-w-sm p-6 glass-card rounded-2xl animate-scale-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Contact Details</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowContactCard(false)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">{selectedConversation.salonName}</h4>
                  <p className="text-sm text-muted-foreground">{selectedConversation.location}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="p-4 bg-secondary/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Phone Number</p>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-lg">{selectedConversation.salonPhone}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyPhone(selectedConversation.salonPhone)}
                    >
                      {copiedPhone ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => callPhone(selectedConversation.salonPhone)}
                    className="h-12 bg-primary hover:bg-primary/90"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                  {selectedConversation.salonWhatsapp && (
                    <Button
                      onClick={() => openWhatsApp(selectedConversation.salonWhatsapp!)}
                      className="h-12 bg-green-600 hover:bg-green-700"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Messages */}
        <div className="relative z-10 flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {selectedConversation.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'contact' ? (
                  renderContactCard(message, selectedConversation)
                ) : (
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
                )}
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
            placeholder="Search by salon or job role..."
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
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 flex items-center justify-center text-xs font-bold bg-accent text-accent-foreground rounded-full">
                      {conversation.unread}
                    </span>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className={`font-semibold truncate ${conversation.unread > 0 ? 'text-foreground' : ''}`}>
                      {conversation.salonName}
                    </h3>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatTime(conversation.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-primary mb-1 flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {conversation.jobRole}
                  </p>
                  <p className={`text-sm truncate ${conversation.unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {conversation.lastMessage}
                  </p>
                </div>
                
                {/* Contact shared badge */}
                {conversation.contactShared && (
                  <div className="shrink-0">
                    <Phone className="w-4 h-4 text-green-500" />
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {searchQuery 
                ? 'Try a different search term' 
                : 'Apply to jobs to start conversations with salon owners'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
