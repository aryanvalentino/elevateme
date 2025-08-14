import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';

export const DataManager = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportData = () => {
    try {
      const habits = JSON.parse(localStorage.getItem('habits') || '[]');
      const journalEntries = JSON.parse(localStorage.getItem('journal_entries') || '[]');
      const timeSlots = JSON.parse(localStorage.getItem('time_slots') || '[]');

      const exportData = {
        habits,
        journalEntries,
        timeSlots,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `elevateme-data-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported successfully",
        description: "Your data has been saved to a text file",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your data",
        variant: "destructive",
      });
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);

        // Validate the data structure
        if (!importedData.version || !Array.isArray(importedData.habits)) {
          throw new Error('Invalid data format');
        }

        // Import data to localStorage
        localStorage.setItem('habits', JSON.stringify(importedData.habits || []));
        localStorage.setItem('journal_entries', JSON.stringify(importedData.journalEntries || []));
        localStorage.setItem('time_slots', JSON.stringify(importedData.timeSlots || []));

        toast({
          title: "Data imported successfully",
          description: "Your data has been restored. Please refresh the page to see changes.",
        });

        // Refresh the page to load new data
        setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        toast({
          title: "Import failed",
          description: "The file format is invalid or corrupted",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Data Management
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-4">
        <Button onClick={exportData} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
        
        <Button onClick={handleImportClick} variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Import Data
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.json"
          onChange={importData}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};