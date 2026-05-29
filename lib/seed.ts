export type Tenant = {
  tenant_id: number;
  first_name: string;
  last_name: string;
  phone: string;
  lease_end: string;
  complex: string;
  unit: string;
};

const COMPLEXES = ["Aspire Heights", "The Maple at Lakewood", "Cherry Creek Commons"];
const UNITS = ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B"];

// Obviously fake names (see PRD open question #1 — lean fake to avoid confusion).
const NAMES: [string, string][] = [
  ["Pat", "Reynolds"], ["Sam", "Carter"], ["Alex", "Monroe"], ["Jordan", "Blake"],
  ["Casey", "Whitman"], ["Morgan", "Ellis"], ["Riley", "Foster"], ["Taylor", "Quinn"],
  ["Jamie", "Hollis"], ["Drew", "Patton"], ["Cameron", "Vance"], ["Avery", "Sloan"],
  ["Reese", "Calloway"], ["Skyler", "Dunn"], ["Quinn", "Marsh"], ["Hayden", "Pruitt"],
  ["Emerson", "Briggs"], ["Finley", "Stratton"], ["Rowan", "Decker"], ["Sawyer", "Lowery"],
  ["Parker", "Nash"], ["Dakota", "Reeves"], ["Charlie", "Webb"], ["Frankie", "Hale"],
];

const LEASE_ENDS = [
  "2026-07-31", "2026-08-15", "2026-09-30", "2026-10-31",
  "2026-11-30", "2026-12-31", "2027-01-15", "2027-02-28",
];

function buildTenants(): Tenant[] {
  const tenants: Tenant[] = [];
  let id = 1;
  let nameIdx = 0;
  for (const complex of COMPLEXES) {
    UNITS.forEach((unit, i) => {
      const [first_name, last_name] = NAMES[nameIdx % NAMES.length];
      tenants.push({
        tenant_id: id,
        first_name,
        last_name,
        phone: `(615) 555-${(1000 + id).toString()}`,
        lease_end: LEASE_ENDS[i % LEASE_ENDS.length],
        complex,
        unit,
      });
      id += 1;
      nameIdx += 1;
    });
  }
  return tenants;
}

const g = globalThis as unknown as { __pmiTenants?: Tenant[] };
export const tenants: Tenant[] = (g.__pmiTenants ??= buildTenants());

export function findTenant(complex: string, unit: string): Tenant | undefined {
  const c = complex.trim().toLowerCase();
  const u = unit.trim().toLowerCase();
  return tenants.find(
    (t) => t.complex.toLowerCase() === c && t.unit.toLowerCase() === u
  );
}

export function getTenantById(tenant_id: number): Tenant | undefined {
  return tenants.find((t) => t.tenant_id === tenant_id);
}
