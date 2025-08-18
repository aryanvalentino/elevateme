import { DataManager } from '@/components/DataManager';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DataManagement = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground pt-12 pb-6 px-6 safe-area-inset-top">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="h-8 w-8 p-0 bg-white/10 hover:bg-white/20 border-0 text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-white">Data Management</h1>
            <p className="text-sm mt-1 text-white/80">Export and import your data</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <DataManager />
        </div>
      </main>
    </div>
  );
};

export default DataManagement;