import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';
import { useDataRefresh } from '@/contexts/DataRefreshContext';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';


export const DataManager = () => {
  const { toast } = useToast();
  const { refreshAllData } = useDataRefresh();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportData = async () => {
    try {
      const habits = JSON.parse(localStorage.getItem('habits') || '[]');
      const journalEntries = JSON.parse(localStorage.getItem('journal_entries') || '[]');
      const timeSlots = JSON.parse(localStorage.getItem('time_slots') || '[]');

      const exportPayload = {
        habits,
        journalEntries,
        timeSlots,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const dataStr = JSON.stringify(exportPayload, null, 2);
      const fileName = `elevateme-data-${new Date().toISOString().split('T')[0]}.json`;

      if (Capacitor.getPlatform() !== 'web') {
        // Create temporary file first
        const tempFileName = `temp_${fileName}`;
        await Filesystem.writeFile({
          path: tempFileName,
          data: dataStr,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        // Use Share API to let user choose where to save
        const tempFileUri = await Filesystem.getUri({
          directory: Directory.Cache,
          path: tempFileName
        });

        await Share.share({
          title: 'Save ElevateMe Data',
          text: 'Choose where to save your ElevateMe data file',
          url: tempFileUri.uri,
          dialogTitle: 'Save data file'
        });

        // Clean up temp file after a delay
        setTimeout(async () => {
          try {
            await Filesystem.deleteFile({
              path: tempFileName,
              directory: Directory.Cache
            });
          } catch (e) {
            // Ignore cleanup errors
          }
        }, 5000);

        toast({
          title: 'Data export initiated',
          description: 'Choose your save location from the share menu',
        });
        return;
      }

      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Data exported successfully',
        description: 'Your data has been saved to a text file',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'There was an error exporting your data',
        variant: 'destructive',
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
          description: "Your data has been restored and all components have been refreshed.",
        });

        // Trigger data refresh across all components
        refreshAllData();
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