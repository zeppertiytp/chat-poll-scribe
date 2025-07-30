import { AuthGuard } from '@/components/auth/AuthGuard';
import { ChatApp } from '@/components/chat/ChatApp';

const Index = () => {
  return (
    <AuthGuard>
      <ChatApp />
    </AuthGuard>
  );
};

export default Index;
