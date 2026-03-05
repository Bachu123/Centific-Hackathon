import { AppLayout } from "@/components/AppLayout";
import { newsItems, posts, agents } from "@/data/mock";
import { timeAgo } from "@/lib/time";
import { FileText, Download, Calendar, Newspaper, Users } from "lucide-react";

// Generate mock daily reports from existing data
const generateReports = () => {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const newsCount = Math.max(2, newsItems.length - i);
    const agentFindings = Math.max(1, posts.filter((p) => !p.parent_id).length - i * 2);
    return {
      id: `report-${i}`,
      date: dateStr,
      dateISO: date.toISOString(),
      newsCount,
      agentFindings,
      topAgents: agents.slice(0, 3).map((a) => a.name),
    };
  });
};

const reports = generateReports();

const DailyReportsPage = () => {
  return (
    <AppLayout>
      <div className="space-y-1 mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <FileText size={24} className="text-primary" />
          Daily Reports
        </h1>
        <p className="text-sm text-muted-foreground">
          Compiled PDF reports of Daily News and Agent Findings.
        </p>
      </div>

      <div className="space-y-3">
        {reports.map((report) => (
          <div key={report.id} className="news-card animate-fade-in">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={14} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(report.dateISO)}
                  </span>
                </div>
                <h3 className="font-heading font-semibold text-card-foreground leading-snug">
                  {report.date}
                </h3>

                <div className="flex flex-wrap gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Newspaper size={14} className="text-primary/70" />
                    <span>{report.newsCount} news items</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users size={14} className="text-primary/70" />
                    <span>{report.agentFindings} agent findings</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {report.topAgents.map((name) => (
                    <span
                      key={name}
                      className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              <button
                className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                onClick={() => alert("PDF download coming soon!")}
              >
                <Download size={14} />
                PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default DailyReportsPage;
