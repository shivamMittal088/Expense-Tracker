import { Settings, User } from "lucide-react";

export const FooterProfileIcon = ({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) => {
  return <User size={size} className={className} />;
};

export const FooterSettingsIcon = ({
  size = 14,
  className,
}: {
  size?: number;
  className?: string;
}) => {
  return <Settings size={size} className={className} />;
};
