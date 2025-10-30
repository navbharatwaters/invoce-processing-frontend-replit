import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, Edit, BarChart3 } from "lucide-react";

interface AnalyticsData {
  totalFiles: number;
  approvedWithoutChanges: number;
  modifiedBeforeApproval: number;
  monthlyData: Array<{
    month: string;
    files: number;
    value: number;
  }>;
  processingAccuracy: number;
  avgProcessingTime: string;
}

interface FileData {
  id: number;
  status: string;
  originalName: string;
  modifiedData?: string[][];
  updatedAt: string;
}

export default function Analytics() {
  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
  });

  const { data: files = [] } = useQuery<FileData[]>({
    queryKey: ["/api/files"],
  });

  // Use real analytics data
  const totalFiles = analytics?.totalFiles || 0;
  const approvedWithoutChanges = analytics?.approvedWithoutChanges || 0;
  const modifiedBeforeApproval = analytics?.modifiedBeforeApproval || 0;
  const processingAccuracy = analytics?.processingAccuracy || 0;
  const avgProcessingTime = analytics?.avgProcessingTime || "N/A";
  
  const approvedPercentage = totalFiles > 0 ? Math.round((approvedWithoutChanges / totalFiles) * 100) : 0;
  const modifiedPercentage = totalFiles > 0 ? Math.round((modifiedBeforeApproval / totalFiles) * 100) : 0;

  // Use real monthly data from analytics
  const monthlyData = analytics?.monthlyData || [];

  // Recent activity from processed files
  const recentActivity = files
    .filter((file: any) => file.status === "complete")
    .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10)
    .map((file: any) => ({
      id: file.id,
      fileName: file.originalName,
      status: file.modifiedData ? "modified" : "approved",
      time: new Date(file.updatedAt).toLocaleString(),
      isApproved: file.isApproved,
      hasModifications: file.modifiedData !== null
    }));

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
        <p className="text-gray-600">Track your document processing performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Files Processed</h3>
                <p className="text-3xl font-bold text-gray-900">{totalFiles}</p>
                <p className="text-xs text-gray-400 mt-1">Complete documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Processing Accuracy</h3>
                <p className="text-3xl font-bold text-gray-900">{processingAccuracy}%</p>
                <p className="text-xs text-gray-400 mt-1">No edits required</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Edit className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Files Modified</h3>
                <p className="text-3xl font-bold text-gray-900">{modifiedBeforeApproval}</p>
                <p className="text-xs text-gray-400 mt-1">Required manual edits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Avg Processing Time</h3>
                <p className="text-3xl font-bold text-gray-900">{avgProcessingTime}</p>
                <p className="text-xs text-gray-400 mt-1">Per document</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Processing Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Monthly Processing Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">No data available yet. Process some files to see monthly trends.</p>
            </div>
          ) : (
            <div className="h-64 flex items-end justify-between space-x-2">
              {monthlyData.map((month, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="text-xs text-gray-600 mb-1">{month.files}</div>
                  <div
                    className="w-full bg-primary rounded-t transition-all duration-300 hover:bg-blue-600"
                    style={{ height: `${Math.max(10, month.value)}%` }}
                    title={`${month.month}: ${month.files} files processed`}
                  />
                  <span className="text-sm text-gray-600 mt-2">{month.month}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent activity to show</p>
            ) : (
              recentActivity.map((activity: any) => (
                <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full ${
                    activity.hasModifications ? "bg-yellow-100" : "bg-green-100"
                  }`}>
                    {activity.hasModifications ? (
                      <Edit className="w-4 h-4 text-yellow-600" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Processed {activity.time}
                      {activity.hasModifications && " • Modified before approval"}
                      {activity.isApproved && " • Approved"}
                    </p>
                  </div>
                  <div className="flex flex-col space-y-1">
                    {activity.isApproved && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Approved
                      </span>
                    )}
                    {activity.hasModifications && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Modified
                      </span>
                    )}
                    {!activity.isApproved && !activity.hasModifications && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        Processed
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
