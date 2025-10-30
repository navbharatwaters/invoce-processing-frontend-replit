import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BarChart3, Settings, LayoutDashboard, LogOut, Bell, History } from "lucide-react";

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      // Clear all localStorage data for the application
      localStorage.removeItem('selectedFileId');
      localStorage.removeItem('lastUserId');
      
      // Clear all query cache
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
  });

  const tabs = [
    { id: "dashboard", label: "Dashboard", path: "/", icon: LayoutDashboard },
    { id: "analytics", label: "Analytics", path: "/analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", path: "/settings", icon: Settings },
  ];

  const getCurrentTab = () => {
    if (location === "/" || location === "/dashboard") return "dashboard";
    if (location === "/analytics") return "analytics";
    if (location === "/settings") return "settings";
    return "dashboard";
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-semibold text-gray-900">AIAutoEye</h1>
            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = getCurrentTab() === tab.id;
                
                return (
                  <Button
                    key={tab.id}
                    onClick={() => setLocation(tab.path)}
                    variant="ghost"
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? "bg-primary text-white hover:bg-blue-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <History className="w-4 h-4 mr-1" />
                History
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Bell className="w-4 h-4 mr-1" />
                Notifications
              </Button>
              <Button
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
