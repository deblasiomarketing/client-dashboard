import type { AgencyRole } from "@/types/database";

export interface NavItem {
  label: string;
  href: string;
  /** If omitted, item is visible to all roles in that shell. */
  roles?: AgencyRole[];
}

// Spec §4 — Agency Navigation
export const agencyNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Clients", href: "/clients" },
  { label: "My Tasks", href: "/my-tasks" },
  { label: "Production", href: "/production" },
  { label: "SEO", href: "/seo" },
  { label: "AI Search", href: "/ai-search" },
  { label: "Website Work", href: "/website-work" },
  { label: "Reports", href: "/reports" },
  { label: "Calendar", href: "/calendar" },
  {
    label: "Settings",
    href: "/settings",
    roles: ["agency_admin"],
  },
];

// Spec §4 — Client Navigation
export const clientNav: NavItem[] = [
  { label: "Overview", href: "/overview" },
  { label: "SEO", href: "/overview/seo" },
  { label: "AI Search", href: "/overview/ai-search" },
  { label: "Website", href: "/overview/website" },
  { label: "Analytics", href: "/overview/analytics" },
  { label: "Reports", href: "/overview/reports" },
  { label: "Activity", href: "/overview/activity" },
];

export function navForRole(role: AgencyRole): NavItem[] {
  return agencyNav.filter((item) => !item.roles || item.roles.includes(role));
}
