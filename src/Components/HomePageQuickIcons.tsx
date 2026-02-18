import { Activity, Plus } from "lucide-react";

export const HomeQuickAddIcon = ({ size = 16 }: { size?: number }) => {
  return <Plus size={size} />;
};

export const HomeActivityIcon = ({ size = 16 }: { size?: number }) => {
  return <Activity size={size} />;
};
