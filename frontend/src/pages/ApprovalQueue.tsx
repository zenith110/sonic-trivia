import { useState } from "react";
import { Shield, AlertTriangle, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  ApprovalQueueFilters,
  ApprovalQueueList,
} from "@/components/approval-queue";
import { useApprovalQueue, type ApprovalQueueFilters as FilterType } from "@/hooks/useApprovalQueue";
import { useAuth } from "@/hooks/useAuth";

export function ApprovalQueue() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterType>({
    type: undefined,
    status: "pending",
    userId: undefined,
  });

  const {
    items,
    loading,
    error,
    totalItems,
    currentPage,
    pageSize,
    hasNextPage,
    hasPreviousPage,
    fetchApprovalRequests,
    approveRequest,
    rejectRequest,
    refreshData,
    setPage,
    setPageSize,
  } = useApprovalQueue();

  // Check if user has appropriate permissions
  const hasPermissions = user?.role === "admin" || user?.role === "moderator";

  if (!hasPermissions) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground text-center max-w-md">
              You need admin or moderator privileges to access the approval queue.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFiltersChange = (newFilters: FilterType) => {
    setFilters(newFilters);
    fetchApprovalRequests(1, newFilters);
  };

  const getStatsCards = () => {
    const pendingCount = items.filter(item => !item.questionId || !item.songId).length;
    const triviaCount = items.filter(item =>
      item.type === "trivia" || (item.type === "collection" && item.questionCollectionId)
    ).length;
    const songCount = items.filter(item =>
      item.type === "song" || (item.type === "collection" && item.songCollectionId)
    ).length;

    return [
      {
        title: "Total Requests",
        value: totalItems,
        icon: <Users className="h-4 w-4" />,
        color: "text-blue-600",
      },
      {
        title: "Pending",
        value: pendingCount,
        icon: <Clock className="h-4 w-4" />,
        color: "text-orange-600",
      },
      {
        title: "Trivia Items",
        value: triviaCount,
        icon: <AlertTriangle className="h-4 w-4" />,
        color: "text-purple-600",
      },
      {
        title: "Song Items",
        value: songCount,
        icon: <AlertTriangle className="h-4 w-4" />,
        color: "text-green-600",
      },
    ];
  };

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Approval Queue
        </h1>
        <p className="text-muted-foreground">
          Review and approve pending content submissions from community members.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getStatsCards().map((stat, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={stat.color}>
                  {stat.icon}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <ApprovalQueueFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        totalCount={totalItems}
        filteredCount={items.length}
        loading={loading}
      />

      <Separator />

      {/* Main Content */}
      <ApprovalQueueList
        items={items}
        loading={loading}
        error={error}
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        onRefresh={refreshData}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onApprove={approveRequest}
        onReject={rejectRequest}
      />

      {/* Helper Text */}
      <Card>
        <CardContent className="py-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <h4 className="font-medium text-foreground">Approval Guidelines:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Review content for appropriateness and accuracy</li>
              <li>Ensure trivia questions have correct answers</li>
              <li>Verify song information and audio quality</li>
              <li>Reject spam, inappropriate, or low-quality submissions</li>
              <li>Use your best judgment as a {user?.role}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
