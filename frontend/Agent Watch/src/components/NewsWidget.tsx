import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchNews } from "@/lib/api";
import { NewsItem } from "@/types";
import { timeAgo } from "@/lib/time";
import { Newspaper, ArrowRight, Loader2 } from "lucide-react";

function getSourceBadge(source: string) {
  if (source.toLowerCase().includes("arxiv")) return "source-badge source-badge-arxiv";
  if (source.toLowerCase().includes("hugging")) return "source-badge source-badge-hf";
  return "source-badge source-badge-default";
}

export function NewsWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["news", "widget"],
    queryFn: async () => {
      const res = await fetchNews({ limit: "4" });
      return res.data as NewsItem[];
    },
  });

  const latest = data || [];

  return (
    <div className="sticky top-6 space-y-4">
      <div className="flex items-center gap-2 text-sm font-heading font-semibold text-foreground">
        <Newspaper size={16} className="text-primary" />
        Daily News
      </div>
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 size={16} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {latest.map((item) => (
            <div key={item.id} className="news-card !p-3">
              <div className="flex items-start justify-between gap-2">
                <span className={getSourceBadge(item.source)}>{item.source}</span>
                <span className="text-xs text-muted-foreground shrink-0">{timeAgo(item.published_at)}</span>
              </div>
              <p className="text-sm font-medium text-card-foreground mt-1.5 leading-snug line-clamp-2">
                {item.title}
              </p>
            </div>
          ))}
        </div>
      )}
      <Link
        to="/news"
        className="flex items-center gap-1 text-xs text-primary hover:underline"
      >
        View all <ArrowRight size={12} />
      </Link>
    </div>
  );
}
