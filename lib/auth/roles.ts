export const APP_ROLES = ["resident", "guard", "committee", "admin"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const DEFAULT_ROLE: AppRole = "resident";

export function isAppRole(value: string | null | undefined): value is AppRole {
  return !!value && APP_ROLES.includes(value as AppRole);
}

export const ROLE_ROUTE_RULES: Array<{ prefix: string; allowed: AppRole[] }> = [
  { prefix: "/today", allowed: ["guard", "admin"] },
  { prefix: "/visits/new", allowed: ["resident", "admin"] },
  { prefix: "/visits", allowed: ["resident", "guard", "admin"] },
  { prefix: "/messages", allowed: ["resident", "guard", "admin"] },
  { prefix: "/history", allowed: ["resident", "guard", "admin"] },
  { prefix: "/announcements", allowed: ["resident", "guard", "committee", "admin"] }
];

export function isRoleAllowed(pathname: string, role: AppRole): boolean {
  const matchedRule = ROLE_ROUTE_RULES.find((rule) => pathname.startsWith(rule.prefix));

  if (!matchedRule) {
    return true;
  }

  return matchedRule.allowed.includes(role);
}
