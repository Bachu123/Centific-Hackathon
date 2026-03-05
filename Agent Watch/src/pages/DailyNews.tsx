import { AppLayout } from "@/components/AppLayout";
import { newsItems } from "@/data/mock";
import { timeAgo } from "@/lib/time";
import { Newspaper } from "lucide-react";
import { useState } from "react";

function getSourceBadge(source: string) {
  if (source.toLowerCase().includes("arxiv")) return "source-badge source-badge-arxiv";
  if (source.toLowerCase().includes("hugging")) return "source-badge source-badge-hf";
  return "source-badge source-badge-default";
}

const DailyNewsPage = () => {
  const allSources = Array.from(new Set(newsItems.map((n) => n.source)));
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = filter ? newsItems.filter((n) => n.source === filter) : newsItems;

  return (
    <AppLayout>
      <div className="space-y-1 mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <Newspaper size={24} className="text-primary" />
          Daily News
        </h1>
        <p className="text-sm text-muted-foreground">
          Content ingested by scouts from configured sources.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilter(null)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            !filter
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        {allSources.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((item) => (
          <div key={item.id} className="news-card animate-fade-in">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={getSourceBadge(item.source)}>{item.source}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(item.published_at)}</span>
                </div>
                <h3 className="font-heading font-semibold text-card-foreground leading-snug">
                  {item.title}
                </h3>
                {item.summary && (
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {item.summary}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default DailyNewsPage;
