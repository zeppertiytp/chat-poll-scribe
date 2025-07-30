import { useEffect, useState } from 'react';
import { authService } from '@/services/authService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CallbackScreenProps {
  onComplete: () => void;
}

export const CallbackScreen: React.FC<CallbackScreenProps> = ({ onComplete }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(urlParams.get('error_description') || 'Authentication failed');
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state');
        }

        const success = await authService.handleCallback(code, state);
        
        if (success) {
          setStatus('success');
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          // Delay completion to show success message
          setTimeout(onComplete, 1500);
        } else {
          throw new Error('Failed to process authentication');
        }
      } catch (err) {
        console.error('Callback error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setStatus('error');
      }
    };

    handleCallback();
  }, [onComplete]);

  const handleRetry = () => {
    authService.login();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-chat-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            {status === 'loading' && (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-xl">
            {status === 'loading' && 'Signing you in...'}
            {status === 'success' && 'Welcome!'}
            {status === 'error' && 'Sign-in Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'loading' && (
            <p className="text-muted-foreground">
              Please wait while we complete your authentication.
            </p>
          )}
          {status === 'success' && (
            <p className="text-green-600">
              Authentication successful! Redirecting to chat...
            </p>
          )}
          {status === 'error' && (
            <div className="space-y-4">
              <p className="text-red-600 text-sm">{error}</p>
              <Button onClick={handleRetry} variant="outline" className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};