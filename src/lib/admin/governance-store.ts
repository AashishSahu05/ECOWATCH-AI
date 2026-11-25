import { CIVIC_SERVICE_AREAS } from "@/lib/civic/service-areas";
import { CivicServiceArea } from "@/lib/civic/types";
import { DEMO_USERS } from "@/lib/auth/mock-adapter";

export interface GovernanceOfficer {
  id: string;
  fullName: string;
  email: string;
  role: "citizen" | "municipal_officer" | "administrator";
  ward: string;
  status: "active" | "inactive";
  createdAt: string;
}

interface GovernanceState {
  wards: CivicServiceArea[];
  officers: GovernanceOfficer[];
}

const globalForGovernance = globalThis as unknown as {
  __nagardrishtiGovernance?: GovernanceState;
};

function getInitialState(): GovernanceState {
  const wards: CivicServiceArea[] = JSON.parse(JSON.stringify(CIVIC_SERVICE_AREAS));
  const officers: GovernanceOfficer[] = Object.values(DEMO_USERS).map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    ward: u.ward || (u.role === "administrator" ? "Global Citywide" : "Ward 04 — South Lake District"),
    status: "active",
    createdAt: u.createdAt,
  }));

  return { wards, officers };
}

function getStore(): GovernanceState {
  if (!globalForGovernance.__nagardrishtiGovernance) {
    globalForGovernance.__nagardrishtiGovernance = getInitialState();
  }
  return globalForGovernance.__nagardrishtiGovernance;
}

export function listWards(): CivicServiceArea[] {
  return getStore().wards;
}

export function createWard(input: {
  name: string;
  code: string;
  centerLat?: number;
  centerLng?: number;
}): CivicServiceArea {
  const store = getStore();
  const normalizedCode = input.code.trim().toUpperCase();
  if (store.wards.some((w) => w.wardNumber.toUpperCase() === normalizedCode)) {
    throw new Error(`Ward with code ${normalizedCode} already exists.`);
  }
  const newWard: CivicServiceArea = {
    id: `ward_${normalizedCode.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now().toString().slice(-4)}`,
    wardNumber: normalizedCode,
    wardName: input.name.trim(),
    centerLat: input.centerLat ?? 12.9352,
    centerLng: input.centerLng ?? 77.6245,
    isActive: true,
  };
  store.wards.push(newWard);
  return newWard;
}

export function updateWard(
  id: string,
  updates: { name?: string; isActive?: boolean }
): CivicServiceArea {
  const store = getStore();
  const idx = store.wards.findIndex((w) => w.id === id);
  if (idx === -1) {
    throw new Error(`Ward not found: ${id}`);
  }
  store.wards[idx] = {
    ...store.wards[idx],
    ...(updates.name !== undefined ? { wardName: updates.name.trim() } : {}),
    ...(updates.isActive !== undefined ? { isActive: updates.isActive } : {}),
  };
  return store.wards[idx];
}

export function listOfficers(): GovernanceOfficer[] {
  return getStore().officers;
}

export function createOfficer(input: {
  fullName: string;
  email: string;
  ward: string;
  role?: "municipal_officer" | "administrator";
}): GovernanceOfficer {
  const store = getStore();
  const normalizedEmail = input.email.trim().toLowerCase();
  if (store.officers.some((o) => o.email.toLowerCase() === normalizedEmail)) {
    throw new Error(`An account with email ${normalizedEmail} already exists.`);
  }
  const newOfficer: GovernanceOfficer = {
    id: `usr_officer_${Date.now().toString(36)}`,
    fullName: input.fullName.trim(),
    email: normalizedEmail,
    role: input.role || "municipal_officer",
    ward: input.ward.trim(),
    status: "active",
    createdAt: new Date().toISOString(),
  };
  store.officers.push(newOfficer);
  return newOfficer;
}

export function assignOfficerWard(officerId: string, ward: string): GovernanceOfficer {
  const store = getStore();
  const idx = store.officers.findIndex((o) => o.id === officerId);
  if (idx === -1) {
    throw new Error(`Officer not found: ${officerId}`);
  }
  store.officers[idx] = {
    ...store.officers[idx],
    ward: ward.trim(),
  };
  return store.officers[idx];
}
