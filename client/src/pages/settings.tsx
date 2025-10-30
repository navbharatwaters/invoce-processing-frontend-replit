import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Save, CheckCircle, Settings as SettingsIcon, Globe, Car, Clock, RotateCcw } from "lucide-react";

interface SettingsData {
  webhookUrl: string;
  processingTimeout: number;
  pollingInterval: number;
  autoApprove: boolean;
  enableWebhook: boolean;
  enableDrive: boolean;
  driveFolderId?: string;
}

const settingsSchema = z.object({
  webhookUrl: z.string().url("Please enter a valid URL"),
  processingTimeout: z.number().min(1).max(30),
  pollingInterval: z.number().min(1).max(10),
  autoApprove: z.boolean(),
  enableWebhook: z.boolean(),
  enableDrive: z.boolean(),
  driveFolderId: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<SettingsData>({
    queryKey: ["/api/settings"],
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      webhookUrl: "https://navbharatwater.one/webhook/5fd4e2ef-bc4e-404a-9b6e-23ccd70c6871",
      processingTimeout: 5,
      pollingInterval: 2,
      autoApprove: false,
      enableWebhook: true,
      enableDrive: true,
      driveFolderId: "",
    },
    values: settings ? {
      webhookUrl: settings.webhookUrl || "https://navbharatwater.one/webhook/5fd4e2ef-bc4e-404a-9b6e-23ccd70c6871",
      processingTimeout: settings.processingTimeout || 5,
      pollingInterval: settings.pollingInterval || 2,
      autoApprove: settings.autoApprove || false,
      enableWebhook: settings.enableWebhook !== false,
      enableDrive: settings.enableDrive !== false,
      driveFolderId: settings.driveFolderId || "",
    } : undefined,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const response = await apiRequest("PATCH", "/api/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
          <SettingsIcon className="w-6 h-6 mr-2" />
          Settings
        </h2>
        <p className="text-gray-600">Configure your document processing preferences</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        {/* Webhook Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Webhook Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Processing Webhook URL
              </Label>
              <Input
                id="webhookUrl"
                type="url"
                {...form.register("webhookUrl")}
                placeholder="https://example.com/webhook"
              />
              {form.formState.errors.webhookUrl && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.webhookUrl.message}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">This endpoint will receive uploaded files for processing</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableWebhook"
                checked={form.watch("enableWebhook")}
                onCheckedChange={(checked) => form.setValue("enableWebhook", !!checked)}
              />
              <Label htmlFor="enableWebhook" className="text-sm text-gray-700">
                Enable webhook processing
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Processing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Processing Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="processingTimeout" className="block text-sm font-medium text-gray-700 mb-2">
                Default Processing Timeout (minutes)
              </Label>
              <Input
                id="processingTimeout"
                type="number"
                min="1"
                max="30"
                {...form.register("processingTimeout", { valueAsNumber: true })}
              />
              {form.formState.errors.processingTimeout && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.processingTimeout.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="pollingInterval" className="block text-sm font-medium text-gray-700 mb-2">
                Status Polling Interval (seconds)
              </Label>
              <Input
                id="pollingInterval"
                type="number"
                min="1"
                max="10"
                {...form.register("pollingInterval", { valueAsNumber: true })}
              />
              {form.formState.errors.pollingInterval && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.pollingInterval.message}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoApprove"
                checked={form.watch("autoApprove")}
                onCheckedChange={(checked) => form.setValue("autoApprove", !!checked)}
              />
              <Label htmlFor="autoApprove" className="text-sm text-gray-700">
                Auto-approve files without changes
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Google Drive Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Car className="w-5 h-5 mr-2" />
              Google Drive Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="driveFolderId" className="block text-sm font-medium text-gray-700 mb-2">
                Drive Folder ID
              </Label>
              <Input
                id="driveFolderId"
                {...form.register("driveFolderId")}
                placeholder="Enter Google Drive folder ID"
              />
              <p className="text-sm text-gray-500 mt-2">Approved files will be uploaded to this folder</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableDrive"
                checked={form.watch("enableDrive")}
                onCheckedChange={(checked) => form.setValue("enableDrive", !!checked)}
              />
              <Label htmlFor="enableDrive" className="text-sm text-gray-700">
                Enable Google Drive upload
              </Label>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-sm text-blue-700">Google Drive integration ready (mock implementation)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings */}
        <div className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            className="px-6 py-3"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          
          <Button
            type="submit"
            disabled={updateSettingsMutation.isPending}
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
        
        {/* Current Settings Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Current Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Webhook URL:</span>
                <p className="text-gray-600 break-all">{form.watch("webhookUrl") || "Not configured"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Processing Timeout:</span>
                <p className="text-gray-600">{form.watch("processingTimeout")} minutes</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Polling Interval:</span>
                <p className="text-gray-600">{form.watch("pollingInterval")} seconds</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Auto Approve:</span>
                <p className="text-gray-600">{form.watch("autoApprove") ? "Enabled" : "Disabled"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Webhook Processing:</span>
                <p className="text-gray-600">{form.watch("enableWebhook") ? "Enabled" : "Disabled"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Google Drive:</span>
                <p className="text-gray-600">{form.watch("enableDrive") ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
