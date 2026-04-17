import { motion } from "motion/react";
import { TrendingUp, LucideIcon } from "lucide-react";

interface Stat {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

interface Props {
  stats: Stat[];
}

export default function StatCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {stats.map((stat, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="premium-card rounded-3xl p-8 bg-white/40 backdrop-blur-md shadow-lg border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl`}>
              <stat.icon className="h-7 w-7" />
            </div>
            <TrendingUp className="h-5 w-5 text-on-surface-variant/30" />
          </div>
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">{stat.label}</p>
          <p className="text-4xl font-black text-on-surface">{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
}
