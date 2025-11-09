import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/vaultbank-logo.png";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const userId = searchParams.get('userId');

      if (!token || !userId) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        // Call the verify-email-link edge function
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-email-link?token=${token}&userId=${userId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok || response.redirected) {
          setStatus('success');
          setMessage('Email verified successfully!');
          
          // Redirect to success page after 2 seconds
          setTimeout(() => {
            navigate('/verification-success?verified=true');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Failed to verify email. The link may be invalid or expired.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0A0A0A] via-[#1A1A2E] to-[#16213E]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <Card className="w-full max-w-md relative z-10 border-primary/20 bg-card/95 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-4 pb-6">
          <div className="flex justify-center">
            <img src={logo} alt="VaultBank" className="h-16 w-auto" />
          </div>

          <div className="text-center space-y-2">
            <CardTitle className="text-2xl">Email Verification</CardTitle>
            <CardDescription>{message}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Please wait...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full"></div>
                <div className="relative bg-green-500/10 border-green-500/30 p-4 rounded-2xl border">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Redirecting you to the dashboard...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 text-center w-full">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"></div>
                <div className="relative bg-red-500/10 border-red-500/30 p-4 rounded-2xl border">
                  <XCircle className="h-12 w-12 text-red-500" />
                </div>
              </div>
              <div className="space-y-4 w-full">
                <p className="text-sm text-muted-foreground">{message}</p>
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={() => navigate('/resend-emails')}
                    className="w-full"
                  >
                    Resend Verification Email
                  </Button>
                  <Button 
                    onClick={() => navigate('/auth')}
                    variant="outline"
                    className="w-full"
                  >
                    Back to Login
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
