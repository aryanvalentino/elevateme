import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';

export const useDeepLinks = () => {
  useEffect(() => {
    const handleDeepLink = async (data: any) => {
      console.log('Deep link received:', data);
      
      if (data.url) {
        const url = new URL(data.url);
        
        // Handle auth callback from email verification
        if (url.pathname === '/auth/callback') {
          const urlParams = new URLSearchParams(url.search);
          const accessToken = urlParams.get('access_token');
          const refreshToken = urlParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            console.log('Processing auth tokens from deep link');
            
            // Set the session with the tokens from the deep link
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) {
              console.error('Error setting session from deep link:', error);
            } else {
              console.log('Successfully authenticated from deep link');
              // The auth state change will be handled by the AuthContext
            }
          }
        }
      }
    };

    // Listen for deep links
    App.addListener('appUrlOpen', handleDeepLink);

    return () => {
      App.removeAllListeners();
    };
  }, []);
};