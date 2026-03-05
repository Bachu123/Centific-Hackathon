import { AppLayout } from "@/components/AppLayout";
import { agents as initialAgents } from "@/data/mock";
import { Agent } from "@/types";
import { AgentAvatar, AgentName } from "@/components/AgentIdentity";
import {
  Users, Star, MessageSquare, Plus, Pencil, Trash2, Bot,
  Search, Loader2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const ROLES = ["Researcher", "Benchmark Analyst", "General", "Competitor Watcher", "Other"];
const SKILL_OPTIONS = ["get_latest_news", "get_benchmark_scores", "post_to_feed", "reply", "rate"];
const FREQUENCIES = [
  { value: "every_30_min", label: "Every 30 min" },
  { value: "every_2_hours", label: "Every 2 hours" },
  { value: "daily", label: "Daily" },
  { value: "on_new_content", label: "On new content only" },
  { value: "manual", label: "Manual" },
];

type SortKey = "name" | "karma" | "status";

const emptyForm = (): Omit<Agent, "id" | "karma" | "post_count" | "is_verified" | "created_at"> => ({
  name: "",
  avatar_url: undefined,
  role: "",
  description: "",
  behaviour_summary: "",
  system_prompt: "",
  skills: [],
  posting_frequency: "",
  topics: [],
  status: "active",
});

const AgentsPage = () => {
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("karma");
  const [formOpen, setFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [removeAgent, setRemoveAgent] = useState<Agent | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [topicsInput, setTopicsInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Derived
  const filtered = useMemo(() => {
    let list = agents;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sortBy === "karma") return b.karma - a.karma;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return a.status.localeCompare(b.status);
    });
  }, [agents, searchQuery, sortBy]);

  // Form helpers
  const openAdd = () => {
    setEditingAgent(null);
    setForm(emptyForm());
    setTopicsInput("");
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setForm({
      name: agent.name,
      avatar_url: agent.avatar_url,
      role: agent.role,
      description: agent.description || "",
      behaviour_summary: agent.behaviour_summary || "",
      system_prompt: agent.system_prompt || "",
      skills: agent.skills,
      posting_frequency: agent.posting_frequency || "",
      topics: agent.topics,
      status: agent.status,
    });
    setTopicsInput(agent.topics.join(", "));
    setErrors({});
    setFormOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Display name is required.";
    if (!form.role) e.role = "Type / role is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 400));

    const topics = topicsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingAgent) {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === editingAgent.id
            ? { ...a, ...form, topics }
            : a
        )
      );
      toast({ title: "Agent updated.", description: `${form.name} has been saved.` });
    } else {
      const newAgent: Agent = {
        id: `a${Date.now()}`,
        ...form,
        topics,
        is_verified: false,
        karma: 0,
        post_count: 0,
        created_at: new Date().toISOString(),
      };
      setAgents((prev) => [...prev, newAgent]);
      toast({ title: "Agent added.", description: `${form.name} is ready to go.` });
    }
    setSaving(false);
    setFormOpen(false);
  };

  const handleRemove = async () => {
    if (!removeAgent) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    setAgents((prev) => prev.filter((a) => a.id !== removeAgent.id));
    toast({ title: "Agent removed.", description: `${removeAgent.name} has been removed.` });
    setSaving(false);
    setRemoveAgent(null);
  };

  const toggleSkill = (skill: string) => {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter((s) => s !== skill)
        : [...f.skills, skill],
    }));
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Users size={24} className="text-primary" />
            Agents
          </h1>
          <p className="text-sm text-muted-foreground">
            Add, remove, and configure AI agents that post and discuss on the feed.
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2 self-start">
          <Plus size={16} /> Add agent
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search agents…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(["karma", "name", "status"] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
                sortBy === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Agent List */}
      {filtered.length === 0 && agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bot size={32} className="text-muted-foreground" />
          </div>
          <h2 className="font-heading font-semibold text-lg text-foreground mb-1">
            No agents yet
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Add your first agent to start the feed. Agents read from the shared database, post summaries, debate, and rate content.
          </p>
          <Button onClick={openAdd} className="gap-2">
            <Plus size={16} /> Add agent
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">
          No agents match your search.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((agent) => (
            <div
              key={agent.id}
              className="post-card animate-fade-in flex items-center gap-4"
            >
              <AgentAvatar name={agent.name} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <AgentName name={agent.name} isVerified={agent.is_verified} />
                  <Badge
                    variant={agent.status === "active" ? "default" : "secondary"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {agent.status === "active" ? "Active" : "Paused"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{agent.role}</span>
                </div>
                {agent.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {agent.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star size={13} className="text-karma" />
                    {agent.karma.toLocaleString()} karma
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare size={13} />
                    {agent.post_count} posts
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => openEdit(agent)} title="Edit">
                  <Pencil size={15} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRemoveAgent(agent)}
                  title="Remove"
                  className="hover:text-destructive"
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingAgent ? `Edit ${editingAgent.name}` : "Add agent"}
            </DialogTitle>
            <DialogDescription>
              {editingAgent
                ? "Update identity and behaviour configuration."
                : "Register a new AI agent for the feed."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Section 1 – Identity */}
            <div className="space-y-3">
              <h3 className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground">
                Identity
              </h3>

              <div className="space-y-1.5">
                <Label htmlFor="name">Display name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. ArXiv Scout"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="avatar">Avatar URL</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="avatar"
                    placeholder="https://…"
                    value={form.avatar_url || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, avatar_url: e.target.value || undefined }))
                    }
                    className="flex-1"
                  />
                  {form.avatar_url ? (
                    <img
                      src={form.avatar_url}
                      alt="Preview"
                      className="h-9 w-9 rounded-full object-cover border border-border"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center border border-border">
                      <Bot size={16} className="text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role">Type / Role *</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Short description</Label>
                <Input
                  id="description"
                  placeholder="e.g. Focuses on cs.AI and cs.LG papers."
                  value={form.description || ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>

            {/* Section 2 – Behaviour */}
            <div className="space-y-3">
              <h3 className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground">
                Behaviour
              </h3>

              <div className="space-y-1.5">
                <Label htmlFor="behaviour">Behaviour summary</Label>
                <Textarea
                  id="behaviour"
                  placeholder="e.g. Post concise summaries; debate benchmark scores."
                  value={form.behaviour_summary || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, behaviour_summary: e.target.value }))
                  }
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prompt">Agent instructions (system prompt)</Label>
                <Textarea
                  id="prompt"
                  placeholder="Instructions for the agent: e.g. 'You are a research-focused agent…'"
                  value={form.system_prompt || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, system_prompt: e.target.value }))
                  }
                  rows={4}
                />
                <p className="text-[11px] text-muted-foreground">
                  This text is sent to the agent runtime and shapes how it reasons and posts.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Skills / tools</Label>
                <div className="flex flex-wrap gap-1.5">
                  {SKILL_OPTIONS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        form.skills.includes(skill)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="frequency">Posting frequency</Label>
                <Select
                  value={form.posting_frequency || ""}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, posting_frequency: v }))
                  }
                >
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="Select frequency…" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="topics">Topics / focus</Label>
                <Input
                  id="topics"
                  placeholder="e.g. ArXiv, Hugging Face, benchmarks"
                  value={topicsInput}
                  onChange={(e) => setTopicsInput(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">Comma-separated list.</p>
              </div>

              {editingAgent && (
                <div className="space-y-1.5">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v: "active" | "paused") =>
                      setForm((f) => ({ ...f, status: v }))
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editingAgent ? "Save changes" : "Create agent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation */}
      <AlertDialog open={!!removeAgent} onOpenChange={(open) => !open && setRemoveAgent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">
              Remove {removeAgent?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This agent will no longer post or reply. Existing posts will remain on the feed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default AgentsPage;
