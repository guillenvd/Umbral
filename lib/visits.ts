export const VISIT_TYPES = ["visitor", "delivery"] as const;
export type VisitType = (typeof VISIT_TYPES)[number];

export const VISIT_STATUSES = [
  "pending",
  "arrived",
  "authorized",
  "rejected",
  "cancelled",
  "expired",
  "delivered_gate",
  "sent_to_house"
] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

export type VisitRecord = {
  id: string;
  resident_id: string;
  house_id: string;
  type: VisitType;
  visitor_name: string | null;
  eta_at: string;
  status: VisitStatus;
  note: string | null;
  delivery_company: string | null;
  delivery_type: string | null;
  dropoff_location: "gate" | "house" | null;
  instructions: string | null;
  contactless: boolean;
  created_at: string;
  house?: { code: string | null } | null;
};

type RawVisitRecord = VisitRecord & {
  house?: { code: string | null } | Array<{ code: string | null }> | null;
};

export function isVisitType(value: string | null | undefined): value is VisitType {
  return !!value && VISIT_TYPES.includes(value as VisitType);
}

export function isVisitStatus(value: string | null | undefined): value is VisitStatus {
  return !!value && VISIT_STATUSES.includes(value as VisitStatus);
}

export function isTerminalStatus(status: VisitStatus) {
  return ["authorized", "rejected", "cancelled", "expired", "delivered_gate", "sent_to_house"].includes(status);
}

export function visitDisplayName(visit: VisitRecord) {
  if (visit.type === "delivery") {
    return visit.delivery_company || visit.delivery_type || visit.visitor_name || "Repartidor";
  }
  return visit.visitor_name || "Visita";
}

export function statusLabel(status: VisitStatus) {
  const labels: Record<VisitStatus, string> = {
    pending: "Pendiente",
    arrived: "Llegó",
    authorized: "Autorizada",
    rejected: "Rechazada",
    cancelled: "Cancelada",
    expired: "Expirada",
    delivered_gate: "Entregada en caseta",
    sent_to_house: "Enviada a casa"
  };
  return labels[status];
}

export function statusBadgeClass(status: VisitStatus) {
  const classes: Record<VisitStatus, string> = {
    pending: "bg-amber-100 text-amber-800",
    arrived: "bg-sky-100 text-sky-800",
    authorized: "bg-emerald-100 text-emerald-800",
    rejected: "bg-rose-100 text-rose-800",
    cancelled: "bg-slate-200 text-slate-700",
    expired: "bg-slate-200 text-slate-700",
    delivered_gate: "bg-indigo-100 text-indigo-800",
    sent_to_house: "bg-indigo-100 text-indigo-800"
  };
  return classes[status];
}

export function normalizeVisitRecord(raw: RawVisitRecord): VisitRecord {
  const house = Array.isArray(raw.house) ? raw.house[0] : raw.house;
  return {
    ...raw,
    house: house ?? null
  };
}
