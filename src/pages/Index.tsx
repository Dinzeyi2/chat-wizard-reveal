import React, { useState, useRef, useEffect } from 'react';
import ChatWindow from '@/components/ChatWindow';
import InputArea from '@/components/InputArea';
import { Message } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import WelcomeScreen from '@/components/WelcomeScreen';
import { supabase } from '@/integrations/supabase/client';
import { UiScraperDemo } from '@/components/UiScraperDemo';
import { useLocation, useNavigate } from 'react-router-dom';
import { UICodeGenerator } from '@/utils/UICodeGenerator';
import { ArtifactProvider, ArtifactLayout } from '@/components/artifact/ArtifactSystem';
import { HamburgerMenuButton } from '@/components/HamburgerMenuButton';
import Dashboard from '@/components/Dashboard';
import { UserProfileMenu } from '@/components/UserProfileMenu';

// Initialize the UI code generator
const uiCodeGenerator = new UICodeGenerator({
  debug: true
});

const Index: React.FC = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showDashboard, setShowDashboard] = useState(false);
  const [artifactSystemHeight, setArtifactSystemHeight] = useState<number | null>(null);
  const artifactSystemRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  
  // Handlers for the welcome screen
  const handleStartNewChat = () => {
    setShowWelcome(false);
  };

  const handleOpenDashboard = () => {
    setShowDashboard(true);
    setShowWelcome(false);
  };
  
  const handleCloseDashboard = () => {
    setShowDashboard(false);
  };
  
  const handleStartNewProject = () => {
    setMessages([]);
    setCurrentProjectId(null);
    setShowDashboard(false);
  };
  
  // Function to handle sending a message
  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    // Create a new user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    // Add it to the messages state
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    // Clear the welcome screen
    setShowWelcome(false);
    
    // Start loading indicator
    setLoading(true);
    
    try {
      // Check for a specific command to generate UI code
      if (message.toLowerCase().includes('generate ui') || 
          message.toLowerCase().includes('create ui') ||
          message.toLowerCase().includes('design ui') ||
          message.toLowerCase().includes('make a ui') ||
          message.toLowerCase().includes('build ui')) {
        
        // Call the UI Code Generator
        const result = await uiCodeGenerator.generateCode(message);
        
        if (result.success && result.result) {
          // Create an assistant message with the response
          const assistantMessage: Message = {
            id: uuidv4(),
            role: 'assistant',
            content: `Here's the UI code I've generated based on your request:

## ${result.metadata?.componentType || 'Component'} Design

${result.result.explanation || 'I\'ve created a design based on your specifications.'}

\`\`\`jsx
${result.result.code.frontend || '// No code generated'}
\`\`\`

${result.result.code.backend ? `### Backend Code:\n\n\`\`\`jsx\n${result.result.code.backend}\n\`\`\`` : ''}

Would you like to make any adjustments to this design?`,
            timestamp: new Date()
          };
          
          // Add the assistant message to the state
          setMessages(prevMessages => [...prevMessages, assistantMessage]);
        } else {
          // Handle error
          const errorMessage: Message = {
            id: uuidv4(),
            role: 'assistant',
            content: `I'm sorry, I encountered an error while generating UI code: ${result.error || 'Unknown error'}`,
            timestamp: new Date()
          };
          
          setMessages(prevMessages => [...prevMessages, errorMessage]);
        }
      } else {
        // Regular message handling with Claude API
        const { data, error } = await supabase.functions.invoke('chat', {
          body: { 
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content
            }))
          }
        });
        
        if (error) {
          console.error('Error calling chat function:', error);
          toast({
            title: 'Error',
            description: 'Failed to get a response. Please try again.',
            variant: 'destructive',
          });
          
          const errorMessage: Message = {
            id: uuidv4(),
            role: 'assistant',
            content: 'I apologize, but I encountered an error processing your request. Please try again.',
            timestamp: new Date()
          };
          
          setMessages(prevMessages => [...prevMessages, errorMessage]);
          
        } else {
          // Process the response from Claude
          if (data && data.response) {
            // Look for generated app data in the response
            let projectId = null;
            let projectData = null;
            let isGuidanceMessage = false;
            
            // Check if this contains app generation data
            if (data.appData) {
              projectId = data.appData.projectId;
              projectData = data.appData;
              
              // Store the project ID for later use
              setCurrentProjectId(projectId);
            }
            
            // Check if this is a guidance message
            if (data.isGuidance) {
              isGuidanceMessage = true;
            }
            
            // Create an assistant message with the response
            const assistantMessage: Message = {
              id: uuidv4(),
              role: 'assistant',
              content: data.response,
              timestamp: new Date(),
              metadata: {
                projectId: projectId,
                projectData: projectData,
                isGuidance: isGuidanceMessage,
                chatId: data.chatId || null
              }
            };
            
            // Add the assistant message to the state
            setMessages(prevMessages => [...prevMessages, assistantMessage]);
          }
        }
      }
    } catch (err) {
      console.error('Error in message handling:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      
      // Scroll to the bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Update artifact system height on resize
  useEffect(() => {
    const handleResize = () => {
      if (artifactSystemRef.current) {
        const height = artifactSystemRef.current.clientHeight;
        setArtifactSystemHeight(height);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Check for shared chat param in URL and load it
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sharedChatId = params.get('chat');
    
    if (sharedChatId) {
      // Load shared chat
      const loadSharedChat = async () => {
        try {
          const { data, error } = await supabase
            .from('chat_history')
            .select('messages')
            .eq('id', sharedChatId)
            .single();
          
          if (error) {
            console.error('Error loading shared chat:', error);
            toast({
              title: 'Error',
              description: 'Could not load the shared chat.',
              variant: 'destructive',
            });
            return;
          }
          
          if (data && data.messages) {
            // Add UUIDs to the messages if they don't have them
            const processedMessages = Array.isArray(data.messages) ? data.messages.map((message: any) => ({
              ...message,
              id: message.id || uuidv4(),
              timestamp: message.timestamp ? new Date(message.timestamp) : new Date()
            })) : [];
            
            setMessages(processedMessages);
            setShowWelcome(false);
            
            // Clean up URL parameter
            navigate('/app', { replace: true });
          }
        } catch (err) {
          console.error('Error processing shared chat:', err);
        }
      };
      
      loadSharedChat();
    }
  }, [location, navigate, toast]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top navigation bar */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <HamburgerMenuButton onOpenDashboard={handleOpenDashboard} />
          <span className="text-xl font-semibold">LovableAI</span>
        </div>
        <UserProfileMenu />
      </header>

      {showWelcome ? (
        <WelcomeScreen onSendMessage={handleSendMessage} />
      ) : showDashboard ? (
        // Update Dashboard component usage to match its expected props
        <Dashboard />
      ) : (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="flex flex-col flex-1">
            <div className="flex-1 overflow-y-auto">
              <ChatWindow 
                messages={messages} 
                isLoading={loading} 
                onSendMessage={handleSendMessage}  
              />
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <InputArea onSendMessage={handleSendMessage} loading={loading} />
            </div>
          </div>

          <div 
            ref={artifactSystemRef} 
            className="w-full md:w-1/2 lg:w-3/5 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800"
          >
            <ArtifactProvider>
              <ArtifactLayout>
                {/* Add children to the ArtifactLayout */}
                <div className="h-full">
                  {/* The ArtifactSystem component is now used as a child of ArtifactLayout in ArtifactSystem.tsx */}
                </div>
              </ArtifactLayout>
            </ArtifactProvider>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
