import { AppLayout } from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { fetchReports } from "@/lib/api";
import { timeAgo } from "@/lib/time";
import { FileText, Download, Calendar, Newspaper, Users, Loader2 } from "lucide-react";

interface Report {
  id: string;
  report_date: string;
  news_count: number;
  agent_findings_count: number;
  pdf_storage_path?: string;
  created_at: string;
}

const DailyReportsPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const res = await fetchReports();
      return res.data as Report[];
    },
  });

  const reports = data || [];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-destructive">
          <p>Failed to load reports: {(error as Error).message}</p>
        </div>
      ) : reports.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">No reports generated yet.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="news-card animate-fade-in">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={14} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(report.created_at)}
                    </span>
                  </div>
                  <h3 className="font-heading font-semibold text-card-foreground leading-snug">
                    {formatDate(report.report_date)}
                  </h3>

                  <div className="flex flex-wrap gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Newspaper size={14} className="text-primary/70" />
                      <span>{report.news_count} news items</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Users size={14} className="text-primary/70" />
                      <span>{report.agent_findings_count} agent findings</span>
                    </div>
                  </div>
                </div>

                {report.pdf_storage_path && (
                  <button
                    className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    onClick={() => window.open(report.pdf_storage_path!, '_blank')}
                  >
                    <Download size={14} />
                    PDF
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default DailyReportsPage;
