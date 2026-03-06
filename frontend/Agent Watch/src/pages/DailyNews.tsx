import { AppLayout } from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { fetchNews } from "@/lib/api";
import { NewsItem } from "@/types";
import {
  Newspaper, Loader2, RefreshCw, ExternalLink,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 10;

function getSourceBadge(source: string) {
  if (source.toLowerCase().includes("arxiv")) return "source-badge source-badge-arxiv";
  if (source.toLowerCase().includes("hugging")) return "source-badge source-badge-hf";
  return "source-badge source-badge-default";
}

function getTypeBadge(type: string) {
  switch (type) {
    case "paper":
      return "bg-blue-500/10 text-blue-500 border-blue-500/30";
    case "model":
      return "bg-violet-500/10 text-violet-500 border-violet-500/30";
    case "dataset":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
    case "leaderboard":
      return "bg-amber-500/10 text-amber-500 border-amber-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const DailyNewsPage = () => {
  const [filter, setFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["news"],
    queryFn: async () => {
      const res = await fetchNews({ limit: "200", sort: "ingested_at" });
      return res.data as NewsItem[];
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const newsItems = data || [];
  const allSources = useMemo(
    () => Array.from(new Set(newsItems.map((n) => n.source))),
    [newsItems]
  );

  const filtered = filter ? newsItems.filter((n) => n.source === filter) : newsItems;
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleFilterChange = (src: string | null) => {
    setFilter(src);
    setPage(1);
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Newspaper size={24} className="text-primary" />
            Daily News
          </h1>
          <p className="text-sm text-muted-foreground">
            Content ingested by scouts from configured sources.
            {dataUpdatedAt > 0 && (
              <span className="ml-2 text-xs text-muted-foreground/60">
                Updated {formatDate(new Date(dataUpdatedAt).toISOString())}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-destructive">
          <p>Failed to load news: {(error as Error).message}</p>
        </div>
      ) : (
        <>
          {/* Source filters */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => handleFilterChange(null)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                !filter
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({newsItems.length})
            </button>
            {allSources.map((s) => (
              <button
                key={s}
                onClick={() => handleFilterChange(s)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  filter === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {s} ({newsItems.filter((n) => n.source === s).length})
              </button>
            ))}
          </div>

          {/* News cards */}
          <div className="space-y-3">
            {paged.map((item) => {
              const displayTime = item.ingested_at || item.published_at;
              return (
                <div key={item.id} className="news-card animate-fade-in">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={getSourceBadge(item.source)}>{item.source}</span>
                        {item.type && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${getTypeBadge(item.type)}`}
                          >
                            {item.type}
                          </span>
                        )}
                        <span
                          className="text-xs text-muted-foreground cursor-default"
                          title={`Scouted: ${formatFullDate(displayTime)}\nPublished: ${formatFullDate(item.published_at)}`}
                        >
                          {formatDate(displayTime)}
                        </span>
                      </div>
                      <h3 className="font-heading font-semibold text-card-foreground leading-snug">
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-primary transition-colors inline-flex items-start gap-1.5 group"
                          >
                            {item.title}
                            <ExternalLink
                              size={14}
                              className="mt-0.5 opacity-0 group-hover:opacity-60 flex-shrink-0 transition-opacity"
                            />
                          </a>
                        ) : (
                          item.title
                        )}
                      </h3>
                      {item.summary && (
                        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                          {item.summary}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Newspaper size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No news items found.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Create a scout source and wait for the next scheduled run.
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={16} />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showGap = prev !== undefined && p - prev > 1;
                    return (
                      <span key={p} className="flex items-center">
                        {showGap && (
                          <span className="px-1.5 text-xs text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={p === currentPage ? "default" : "outline"}
                          size="sm"
                          className="h-8 w-8 p-0 text-xs"
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      </span>
                    );
                  })}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
};

export default DailyNewsPage;
