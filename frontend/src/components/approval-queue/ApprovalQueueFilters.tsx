import { useState } from "react";
import { Filter, Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type ApprovalQueueFilters } from "@/hooks/useApprovalQueue";

interface ApprovalQueueFiltersProps {
  filters: ApprovalQueueFilters;
  onFiltersChange: (filters: ApprovalQueueFilters) => void;
  totalCount: number;
  filteredCount: number;
  loading?: boolean;
}

export function ApprovalQueueFilters({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
  loading = false,
}: ApprovalQueueFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.userId || "");

  const handleTypeChange = (type: string) => {
    onFiltersChange({
      ...filters,
      type: type === "all" ? undefined : (type as "trivia" | "song"),
    });
  };

  const handleStatusChange = (status: string) => {
    onFiltersChange({
      ...filters,
      status:
        status === "all"
          ? undefined
          : (status as "pending" | "approved" | "rejected"),
    });
  };

  const handleUserIdSearch = () => {
    onFiltersChange({
      ...filters,
      userId: searchTerm.trim() || undefined,
    });
  };

  const handleUserIdChange = (value: string) => {
    setSearchTerm(value);
    // Auto-search when clearing the input
    if (!value.trim()) {
      onFiltersChange({
        ...filters,
        userId: undefined,
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleUserIdSearch();
    }
  };

  const resetFilters = () => {
    const emptyFilters: ApprovalQueueFilters = {
      type: undefined,
      status: undefined,
      userId: undefined,
    };
    onFiltersChange(emptyFilters);
    setSearchTerm("");
  };

  const hasActiveFilters = filters.type || filters.status || filters.userId;
  const isFiltered = totalCount !== filteredCount;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1">
                    {Object.values(filters).filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>

          <div className="flex items-center gap-4">
            {isFiltered && (
              <div className="text-sm text-muted-foreground">
                Showing {filteredCount} of {totalCount} requests
              </div>
            )}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="type-filter">Content Type</Label>
                <Select
                  value={filters.type || "all"}
                  onValueChange={handleTypeChange}
                  disabled={loading}
                >
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="trivia">Trivia</SelectItem>
                    <SelectItem value="song">Songs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select
                  value={filters.status || "pending"}
                  onValueChange={handleStatusChange}
                  disabled={loading}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* User ID Search */}
              <div className="space-y-2">
                <Label htmlFor="user-search">User ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="user-search"
                    placeholder="Search by User ID..."
                    value={searchTerm}
                    onChange={(e) => handleUserIdChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleUserIdSearch}
                    disabled={loading || !searchTerm.trim()}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">
                    Active filters:
                  </span>
                  {filters.type && (
                    <Badge variant="outline">Type: {filters.type}</Badge>
                  )}
                  {filters.status && (
                    <Badge variant="outline">Status: {filters.status}</Badge>
                  )}
                  {filters.userId && (
                    <Badge variant="outline">
                      User: {filters.userId.substring(0, 8)}...
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
