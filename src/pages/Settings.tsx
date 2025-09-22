import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Bell, Shield, Download, Trash2, Settings as SettingsIcon, CreditCard, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';

const Settings: React.FC = () => {
  const { user, isGuest, profile, signOut } = useAuthStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    atsScoreAlerts: true,
    weeklyReports: false,
    autoSave: true,
    defaultTemplate: 'modern',
    exportFormat: 'pdf'
  });

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      // Save profile changes
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Delete account logic
      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete account. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleExportData = async () => {
    try {
      // Export user data
      toast({
        title: "Export started",
        description: "Your data export will begin shortly.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {isGuest && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <SettingsIcon className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">Guest User</p>
                <p className="text-xs text-amber-700">
                  Sign up to save your settings permanently and access all features
                </p>
              </div>
              <Button size="sm" asChild>
                <a href="/auth">Sign Up</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    defaultValue={profile?.firstName || ''} 
                    disabled={isGuest}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    defaultValue={profile?.lastName || ''} 
                    disabled={isGuest}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  defaultValue={user?.email || ''} 
                  disabled={isGuest}
                />
              </div>
              
              {!isGuest && (
                <Button onClick={handleSaveProfile} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => 
                    setPreferences({...preferences, emailNotifications: checked})
                  }
                  disabled={isGuest}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="atsScoreAlerts">ATS Score Alerts</Label>
                  <p className="text-xs text-muted-foreground">Get notified when scores improve</p>
                </div>
                <Switch
                  id="atsScoreAlerts"
                  checked={preferences.atsScoreAlerts}
                  onCheckedChange={(checked) => 
                    setPreferences({...preferences, atsScoreAlerts: checked})
                  }
                  disabled={isGuest}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weeklyReports">Weekly Reports</Label>
                  <p className="text-xs text-muted-foreground">Summary of your activity</p>
                </div>
                <Switch
                  id="weeklyReports"
                  checked={preferences.weeklyReports}
                  onCheckedChange={(checked) => 
                    setPreferences({...preferences, weeklyReports: checked})
                  }
                  disabled={isGuest}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultTemplate">Default Template</Label>
                <select 
                  id="defaultTemplate" 
                  className="w-full p-2 border rounded-md"
                  value={preferences.defaultTemplate}
                  onChange={(e) => setPreferences({...preferences, defaultTemplate: e.target.value})}
                  disabled={isGuest}
                >
                  <option value="modern">Modern</option>
                  <option value="classic">Classic</option>
                  <option value="creative">Creative</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="exportFormat">Default Export Format</Label>
                <select 
                  id="exportFormat" 
                  className="w-full p-2 border rounded-md"
                  value={preferences.exportFormat}
                  onChange={(e) => setPreferences({...preferences, exportFormat: e.target.value})}
                  disabled={isGuest}
                >
                  <option value="pdf">PDF</option>
                  <option value="docx">DOCX</option>
                  <option value="txt">TXT</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoSave">Auto-save</Label>
                  <p className="text-xs text-muted-foreground">Automatically save changes</p>
                </div>
                <Switch
                  id="autoSave"
                  checked={preferences.autoSave}
                  onCheckedChange={(checked) => 
                    setPreferences({...preferences, autoSave: checked})
                  }
                  disabled={isGuest}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Data & Privacy</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Resume Data</p>
                    <p className="text-xs text-muted-foreground">
                      {isGuest ? 'Stored temporarily (7 days)' : 'Stored securely in your account'}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {isGuest ? 'Temporary' : 'Secure'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Analytics Data</p>
                    <p className="text-xs text-muted-foreground">
                      Used to improve your experience
                    </p>
                  </div>
                  <Badge variant="outline">Anonymized</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Export Data</p>
                    <p className="text-xs text-muted-foreground">
                      Download all your data
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportData} disabled={isGuest}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="account" className="space-y-6">
          {!isGuest && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Subscription</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Current Plan</p>
                      <p className="text-xs text-muted-foreground">Free Plan</p>
                    </div>
                    <Badge>Free</Badge>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    Upgrade to Pro
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Account Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" onClick={signOut} className="w-full">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Account</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove all your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount}>
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;