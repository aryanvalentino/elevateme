import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const GuestSignInButton = () => {
  const navigate = useNavigate();
  const { isGuest } = useAuth();

  console.log('GuestSignInButton render:', { isGuest });

  if (!isGuest) return null;

  return (
    <Button
      onClick={() => navigate('/auth')}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <LogIn className="h-4 w-4" />
      Sign In
    </Button>
  );
};