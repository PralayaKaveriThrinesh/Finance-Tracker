import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BackupRestorePanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("backup");
  const [backupData, setBackupData] = useState<string>("");
  const [restoreData, setRestoreData] = useState<string>("");
  
  // Backup mutation
  const backupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/backup", {});
      return response.json();
    },
    onSuccess: (data) => {
      setBackupData(JSON.stringify(data, null, 2));
      toast({
        title: "Backup created",
        description: "Your data has been backed up successfully"
      });
    },
    onError: (error) => {
      console.error("Error creating backup:", error);
      toast({
        title: "Backup failed",
        description: "There was an error creating your backup",
        variant: "destructive"
      });
    }
  });
  
  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/restore", { data });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
      
      toast({
        title: "Restore completed",
        description: "Your data has been restored successfully"
      });
      
      setIsDialogOpen(false);
      setRestoreData("");
    },
    onError: (error) => {
      console.error("Error restoring data:", error);
      toast({
        title: "Restore failed",
        description: "There was an error restoring your data. Please check the format and try again.",
        variant: "destructive"
      });
    }
  });
  
  // Download backup as JSON file
  const downloadBackup = () => {
    if (!backupData) {
      toast({
        title: "No backup data",
        description: "Please create a backup first",
        variant: "destructive"
      });
      return;
    }
    
    const blob = new Blob([backupData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fintrack_backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Handle restore from input
  const handleRestore = () => {
    try {
      const data = JSON.parse(restoreData);
      
      // Basic validation
      if (!data || typeof data !== "object") {
        throw new Error("Invalid data format");
      }
      
      // Confirm with user
      if (window.confirm("This will replace all your current data. Are you sure you want to proceed?")) {
        restoreMutation.mutate(data);
      }
    } catch (error) {
      toast({
        title: "Invalid data format",
        description: "The provided JSON is not valid. Please check the format and try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle file upload for restore
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setRestoreData(content);
    };
    reader.readAsText(file);
  };
  
  return (
    <>
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Back up your financial data or restore from a previous backup.
            </p>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setActiveTab("backup");
                  setIsDialogOpen(true);
                }}
                className="flex-1"
              >
                <i className="ri-save-line mr-1"></i> Backup Data
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setActiveTab("restore");
                  setIsDialogOpen(true);
                }}
                className="flex-1"
              >
                <i className="ri-refresh-line mr-1"></i> Restore Data
              </Button>
            </div>
            
            <div className="text-xs text-gray-500 mt-2">
              <p>* Use backup to save your financial data that can be imported later.</p>
              <p>* Restore will replace all your current data with the backup data.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Backup & Restore Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Data Management</DialogTitle>
            <DialogDescription>
              Back up your data or restore from a previous backup.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="backup">Backup</TabsTrigger>
              <TabsTrigger value="restore">Restore</TabsTrigger>
            </TabsList>
            
            <TabsContent value="backup" className="space-y-4 mt-4">
              <p className="text-sm text-gray-600">
                Generate a backup of all your financial data that you can download and save.
              </p>
              
              <div className="flex flex-col space-y-3">
                <Button 
                  onClick={() => backupMutation.mutate()}
                  disabled={backupMutation.isPending}
                >
                  {backupMutation.isPending ? "Creating Backup..." : "Create Backup"}
                </Button>
                
                {backupData && (
                  <Button onClick={downloadBackup} variant="outline">
                    <i className="ri-download-2-line mr-1"></i> Download Backup File
                  </Button>
                )}
              </div>
              
              {backupData && (
                <div className="mt-3">
                  <div className="bg-gray-100 p-2 rounded-md max-h-40 overflow-auto text-xs">
                    <pre>{backupData.substring(0, 200)}...</pre>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="restore" className="space-y-4 mt-4">
              <Alert>
                <AlertDescription>
                  Warning: Restoring from a backup will replace all your current data. Make sure you have a backup of your current data if needed.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Backup File
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Or Paste Backup JSON
                  </label>
                  <textarea
                    value={restoreData}
                    onChange={(e) => setRestoreData(e.target.value)}
                    className="w-full h-32 p-2 border rounded-md text-xs font-mono resize-none"
                    placeholder="Paste your backup JSON here..."
                  />
                </div>
                
                <Button 
                  onClick={handleRestore}
                  disabled={!restoreData || restoreMutation.isPending}
                  className="w-full"
                >
                  {restoreMutation.isPending ? "Restoring..." : "Restore Data"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}