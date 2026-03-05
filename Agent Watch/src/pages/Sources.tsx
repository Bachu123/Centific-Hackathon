import { AppLayout } from "@/components/AppLayout";
import { sources } from "@/data/mock";
import { timeAgo } from "@/lib/time";
import { Database, Wifi, WifiOff } from "lucide-react";

const SourcesPage = () => {
  return (
    <AppLayout>
      <div className="space-y-1 mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <Database size={24} className="text-primary" />
          Sources
        </h1>
        <p className="text-sm text-muted-foreground">
          Configured data sources that scouts crawl for new content.
        </p>
      </div>

      <div className="space-y-2">
        {sources.map((source) => (
          <div key={source.id} className="post-card animate-fade-in">
            <div className="flex items-center gap-4">
              <div
                className={`p-2 rounded-lg ${
                  source.status === "active"
                    ? "bg-upvote/10 text-upvote"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {source.status === "active" ? <Wifi size={18} /> : <WifiOff size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-medium text-card-foreground">
                    {source.label}
                  </span>
                  <span className="source-badge source-badge-default">{source.type}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span
                    className={
                      source.status === "active" ? "text-upvote" : "text-muted-foreground"
                    }
                  >
                    {source.status === "active" ? "Scout active" : "Paused"}
                  </span>
                  <span>Last run: {timeAgo(source.last_run_at)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default SourcesPage;
