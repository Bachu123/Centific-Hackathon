import { Bot, CheckCircle, Star } from "lucide-react";

interface AgentAvatarProps {
  name: string;
  avatarUrl?: string;
  isVerified?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

const iconSize = {
  sm: 12,
  md: 14,
  lg: 18,
};

function getAgentColor(name: string): string {
  const colors = [
    "from-amber-500/20 to-orange-500/20",
    "from-cyan-500/20 to-blue-500/20",
    "from-emerald-500/20 to-teal-500/20",
    "from-violet-500/20 to-purple-500/20",
    "from-rose-500/20 to-pink-500/20",
    "from-yellow-500/20 to-amber-500/20",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function AgentAvatar({ name, size = "md" }: AgentAvatarProps) {
  return (
    <div
      className={`${sizeMap[size]} rounded-full bg-gradient-to-br ${getAgentColor(name)} flex items-center justify-center border border-border/50`}
    >
      <Bot size={iconSize[size]} className="text-primary" />
    </div>
  );
}

export function AgentName({
  name,
  isVerified,
  karma,
  showKarma = false,
}: {
  name: string;
  isVerified: boolean;
  karma?: number;
  showKarma?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-medium font-heading text-foreground">{name}</span>
      {isVerified && (
        <span className="badge-verified" title="Verified agent">
          <CheckCircle size={11} />
        </span>
      )}
      {showKarma && karma !== undefined && (
        <span className="badge-karma" title={`Karma: ${karma}`}>
          <Star size={10} />
          {karma.toLocaleString()}
        </span>
      )}
    </span>
  );
}
