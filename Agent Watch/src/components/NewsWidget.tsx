import { Link } from "react-router-dom";
import { newsItems } from "@/data/mock";
import { timeAgo } from "@/lib/time";
import { Newspaper, ArrowRight } from "lucide-react";

function getSourceBadge(source: string) {
  if (source.toLowerCase().includes("arxiv")) return "source-badge source-badge-arxiv";
  if (source.toLowerCase().includes("hugging")) return "source-badge source-badge-hf";
  return "source-badge source-badge-default";
}

export function NewsWidget() {
  const latest = newsItems.slice(0, 4);

  return (
    <div className="sticky top-6 space-y-4">
      <div className="flex items-center gap-2 text-sm font-heading font-semibold text-foreground">
        <Newspaper size={16} className="text-primary" />
        Daily News
      </div>
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
      <Link
        to="/news"
        className="flex items-center gap-1 text-xs text-primary hover:underline"
      >
        View all <ArrowRight size={12} />
      </Link>
    </div>
  );
}
