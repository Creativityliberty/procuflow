import { apiDownload, apiFetch, clearSession, demoMode, saveSession } from "@/lib/api-client";
import type {
  AcdeNeedRecord,
  AppNotificationRecord,
  AutomationSettings,
  ApprovalInboxRecord,
  ApprovalRecord,
  ApprovalWorkflowRecord,
  ComparisonWeights,
  ContractOptions,
  ContractRecord,
  ContractSummary,
  DashboardData,
  DeliveryRecord,
  InvoiceRecord,
  InformationRequestRecord,
  PortalInformationRequestData,
  Paginated,
  OfferAssessmentRecord,
  OfferRequirementResponseRecord,
  PortalLinkRecord,
  PortalRfqData,
  PurchaseOrderRecord,
  ProcurementPolicyTierRecord,
  PurchaseRequestItemRecord,
  PurchaseRequestRecord,
  RfqInvitationRecord,
  RfqComparisonRecord,
  RfqRecord,
  StockCheckRecord,
  SupplierOfferItemRecord,
  SupplierOfferRecord,
  SupplierDocumentRecord,
  SupplierEvaluationRecord,
  SupplierRecord,
  SubscriptionCheckout,
  SubscriptionDetail,
  SubscriptionPaymentRecord,
  TeamData,
  TeamInvitationRecord,
  InvitationPreview,
  ReportOverviewData,
  BudgetVarianceReport,
  SupplierPerformanceReport,
  ReportSnapshotRecord
} from "@/lib/types";

type AuthResponse = {
  token: string;
  user: { id: number; name: string; email: string };
  tenant: { id: number; name: string };
  role: string;
};

export type RegisterPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  company: string;
  country: string;
  company_size: string;
};

type DemoDatabase = {
  suppliers: SupplierRecord[];
  acdeNeeds: AcdeNeedRecord[];
  purchaseRequests: PurchaseRequestRecord[];
  workflow: ApprovalWorkflowRecord;
  policy?: ProcurementPolicyTierRecord[];
  rfqs?: RfqRecord[];
  purchaseOrders?: PurchaseOrderRecord[];
  deliveries?: DeliveryRecord[];
  invoices?: InvoiceRecord[];
  notifications?: AppNotificationRecord[];
  automationSettings?: AutomationSettings;
  team?: TeamData;
  contracts?: ContractRecord[];
  subscription?: SubscriptionDetail;
  subscriptionPayments?: SubscriptionPaymentRecord[];
  informationRequests?: InformationRequestRecord[];
};

const DEMO_DATABASE_KEY = "procuflow_demo_database_v5";
const DEMO_PROFILE_KEY = "procuflow_demo_profile_v5";

const defaultDemoDatabase: DemoDatabase = {
  suppliers: [
    { id: 1, legal_name: "CamTech Services", rccm: "RC/DLA/2024/B/00125", niu: "M012345678901A", email: "contact@camtech.example", phone: "+237 600 000 000", contact_name: "Nadine Mbarga", category: "Informatique", city: "Douala", country: "CM", payment_terms_days: 30, status: "active", score: 4.6, documents_count: 3, documents: [{ id: 1, document_type: "rccm", original_name: "rccm-camtech.pdf", size_bytes: 345000, status: "valid", created_at: "2026-06-02T08:00:00Z" }, { id: 2, document_type: "niu", original_name: "niu-camtech.pdf", size_bytes: 210000, status: "valid", created_at: "2026-06-02T08:05:00Z" }, { id: 3, document_type: "tax_certificate", original_name: "attestation-fiscale.pdf", size_bytes: 450000, status: "pending_review", expires_at: "2026-07-28", created_at: "2026-06-30T09:00:00Z" }], evaluations: [{ id: 1, credit_score: 5, payment_terms_score: 4, proximity_score: 5, support_score: 4, warranty_score: 5, value_score: 5, score: 4.67, comment: "Partenaire fiable.", evaluator: { id: 1, name: "Armand Essomba", email: "demo@procuflow.local" }, created_at: "2026-07-01T09:00:00Z" }], status_history: [{ id: 1, from_status: "pending", to_status: "active", user: { id: 1, name: "Armand Essomba", email: "demo@procuflow.local" }, created_at: "2026-06-02T10:00:00Z" }] },
    { id: 2, legal_name: "Digital Office Cameroun", email: "offres@digitaloffice.example", category: "Informatique", city: "Douala", country: "CM", payment_terms_days: 30, status: "active", score: 4.3, documents_count: 3 },
    { id: 3, legal_name: "AfriSupply Solutions", email: "commercial@afrisupply.example", category: "Informatique", city: "Yaounde", country: "CM", payment_terms_days: 45, status: "active", score: 4.1, documents_count: 3 }
  ],
  acdeNeeds: [
    {
      id: 1,
      title: "Renouvellement du parc informatique Finance",
      service: "Finance",
      status: "draft",
      priority: "high",
      creator: { id: 1, name: "Armand Essomba", email: "demo@procuflow.local" },
      items: [
        { id: 1, kind: "expectation", priority_level:"mandatory", content: "Ameliorer la productivite de l'equipe Finance.", criterion:"Temps de traitement",target_value:"-20",unit:"%",verification_method:"Mesure avant/apres",position: 0 },
        { id: 2, kind: "constraint", priority_level:"mandatory", content: "Compatibilite avec le parc et les normes de securite.", position: 1 },
        { id: 3, kind: "data", priority_level:"mandatory", content: "Cinq postes a livrer a Douala avant la cloture trimestrielle.",target_value:"5",unit:"postes", position: 2 },
        { id: 4, kind: "requirement", priority_level:"mandatory", content: "Garantie de trois ans et assistance locale.",criterion:"Duree de garantie",target_value:"3",unit:"ans",verification_method:"Contrat et certificat",position: 3 }
      ]
    }
  ],
  purchaseRequests: [
    {
      id: 1,
      reference: "DA-2026-000001",
      title: "Ordinateurs pour l'equipe Finance",
      service: "Finance",
      cost_center: "CC-210 Finance",
      priority: "high",
      reason: "Renouveler les postes de travail ralentis.",
      currency: "XAF",
      estimated_amount: 6200000,
      status: "pending",
      creator: { id: 1, name: "Armand Essomba", email: "demo@procuflow.local" },
      items: [{ id: 1, description: "Ordinateur portable professionnel", quantity: 5, unit: "unite", estimated_unit_price: 1240000 }],
      approvals: [
        { id: 1, step_order: 1, role: "manager", status: "approved", decided_at: "2026-07-14T08:00:00Z", approver: { id: 1, name: "Armand Essomba", email: "demo@procuflow.local" } },
        { id: 2, step_order: 2, role: "finance", status: "pending" }
      ],
      created_at: "2026-07-14T07:30:00Z"
    },
    {
      id: 2,
      reference: "DA-2026-000002",
      title: "Maintenance du groupe electrogene",
      service: "Operations",
      cost_center: "CC-320 Operations",
      priority: "normal",
      reason: "Maintenance preventive semestrielle.",
      currency: "XAF",
      estimated_amount: 1100000,
      status: "approved",
      creator: { id: 1, name: "Armand Essomba", email: "demo@procuflow.local" },
      items: [{ id: 2, description: "Forfait de maintenance", quantity: 1, unit: "service", estimated_unit_price: 1100000 }],
      approvals: [
        { id: 3, step_order: 1, role: "manager", status: "approved", decided_at: "2026-07-13T10:00:00Z" },
        { id: 4, step_order: 2, role: "finance", status: "approved", decided_at: "2026-07-13T12:00:00Z" }
      ],
      created_at: "2026-07-13T08:00:00Z"
    }
  ],
  workflow: {
    id: 1,
    name: "Validation des demandes d'achat",
    document_type: "purchase_request",
    is_active: true,
    steps: [
      { id: 1, step_order: 1, role: "manager", minimum_amount: 0, maximum_amount: null },
      { id: 2, step_order: 2, role: "finance", minimum_amount: 1000000, maximum_amount: null },
      { id: 3, step_order: 3, role: "director", minimum_amount: 10000000, maximum_amount: null }
    ]
  },
  policy: [
    { id:1,name:"Achat direct",minimum_amount:0,maximum_amount:99999,required_quotes:1,competition_method:"direct_purchase",validator_roles:["procurement_manager"] },
    { id:2,name:"Consultation simplifiee",minimum_amount:100000,maximum_amount:999999,required_quotes:2,competition_method:"simplified_rfq",validator_roles:["procurement_manager","finance"] },
    { id:3,name:"Consultation concurrentielle",minimum_amount:1000000,maximum_amount:9999999,required_quotes:3,competition_method:"competitive_rfq",validator_roles:["procurement_manager","finance","director"] },
    { id:4,name:"Appel d'offres restreint",minimum_amount:10000000,maximum_amount:100000000,required_quotes:3,competition_method:"restricted_tender",validator_roles:["director","finance"] },
    { id:5,name:"Appel d'offres formel",minimum_amount:100000001,maximum_amount:null,required_quotes:5,competition_method:"formal_tender",validator_roles:["director","procurement_committee"] }
  ],
  rfqs: [],
  purchaseOrders: []
  ,deliveries: [],invoices: [],informationRequests:[],notifications: [],automationSettings:{email_enabled:true,in_app_enabled:true,rfq_reminder_days:2,approval_reminder_hours:48,delivery_reminder_days:0,invoice_reminder_days:3,document_expiry_days:30,contract_expiry_days:90}
};

function pause() {
  return new Promise((resolve) => globalThis.setTimeout(resolve, 250));
}

function cloneDefaults(): DemoDatabase {
  return JSON.parse(JSON.stringify(defaultDemoDatabase)) as DemoDatabase;
}

function readDemoDatabase(): DemoDatabase {
  if (typeof window === "undefined") return cloneDefaults();
  const saved = window.localStorage.getItem(DEMO_DATABASE_KEY);
  if (!saved) {
    const initial = cloneDefaults();
    window.localStorage.setItem(DEMO_DATABASE_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const database = JSON.parse(saved) as DemoDatabase;
    database.automationSettings = {
      ...cloneDefaults().automationSettings!,
      ...database.automationSettings
    };
    return database;
  } catch {
    const initial = cloneDefaults();
    window.localStorage.setItem(DEMO_DATABASE_KEY, JSON.stringify(initial));
    return initial;
  }
}

function writeDemoDatabase(database: DemoDatabase) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DEMO_DATABASE_KEY, JSON.stringify(database));
  }
}

function saveDemoProfile(profile: AuthResponse) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile));
  }
}

function demoAuth(name: string, email: string, company = "Yogi Conseils"): AuthResponse {
  return {
    token: "procuflow-local-preview",
    user: { id: 1, name, email },
    tenant: { id: 1, name: company },
    role: "owner"
  };
}

function readDemoProfile(): AuthResponse {
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem(DEMO_PROFILE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as AuthResponse;
      } catch {
        window.localStorage.removeItem(DEMO_PROFILE_KEY);
      }
    }
  }
  return demoAuth("Armand Essomba", "demo@procuflow.local");
}

function paginated<T>(data: T[]): Paginated<T> {
  return { data, current_page: 1, last_page: 1, per_page: 20, total: data.length };
}

function queryString(filters: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const value = search.toString();
  return value ? `?${value}` : "";
}

export async function login(payload: { email: string; password: string; remember: boolean }) {
  const response = demoMode
    ? (await pause(), { ...readDemoProfile(), user: { ...readDemoProfile().user, email: payload.email } })
    : await apiFetch<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(payload) });
  saveSession(response.token, response.tenant.id, payload.remember);
  if (demoMode) saveDemoProfile(response);
  return response;
}

export async function register(payload: RegisterPayload) {
  const response = demoMode
    ? (await pause(), demoAuth(`${payload.first_name} ${payload.last_name}`, payload.email, payload.company))
    : await apiFetch<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(payload) });
  saveSession(response.token, response.tenant.id);
  if (demoMode) saveDemoProfile(response);
  return response;
}

export async function requestPasswordReset(email: string) {
  if (demoMode) {
    await pause();
    return { message: "Mode demonstration : le lien de reinitialisation serait envoye par e-mail." };
  }
  return apiFetch<{ message: string }>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
}

export async function resetPassword(payload: { token: string; email: string; password: string; password_confirmation: string }) {
  if (demoMode) {
    await pause();
    return { message: "Mot de passe reinitialise. Vous pouvez vous connecter." };
  }
  return apiFetch<{ message: string }>("/auth/reset-password", { method: "POST", body: JSON.stringify(payload) });
}

function demoTeam(database: DemoDatabase): TeamData {
  if (!database.team) {
    const profile = readDemoProfile();
    database.team = {
      members: [{ ...profile.user, role: "owner", job_title: "Responsable achats", joined_at: new Date().toISOString() }],
      invitations: [],
      roles: ["owner", "admin", "requester", "buyer", "procurement_manager", "manager", "storekeeper", "accounting", "finance", "controller", "director"]
    };
  }
  return database.team;
}

export async function getTeam(): Promise<TeamData> {
  if (!demoMode) return apiFetch<TeamData>("/team");
  await pause();
  const database = readDemoDatabase();
  const team = demoTeam(database);
  writeDemoDatabase(database);
  return team;
}

export async function inviteTeamMember(payload: { email: string; role: string }): Promise<TeamInvitationRecord> {
  if (!demoMode) return apiFetch<TeamInvitationRecord>("/team/invitations", { method: "POST", body: JSON.stringify(payload) });
  await pause();
  const database = readDemoDatabase();
  const team = demoTeam(database);
  if (team.members.some((member) => member.email.toLowerCase() === payload.email.toLowerCase())) throw new Error("Cette personne appartient deja a l equipe.");
  team.invitations = team.invitations.filter((invitation) => invitation.email.toLowerCase() !== payload.email.toLowerCase());
  const invitation = { id: Date.now(), ...payload, expires_at: new Date(Date.now() + 7 * 86400000).toISOString(), created_at: new Date().toISOString() };
  team.invitations.unshift(invitation);
  writeDemoDatabase(database);
  return invitation;
}

export async function updateTeamMember(id: number, payload: { role: string; job_title?: string | null }) {
  if (!demoMode) return apiFetch<{ message: string }>(`/team/members/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  await pause();
  const database = readDemoDatabase();
  const member = demoTeam(database).members.find((row) => row.id === id);
  if (!member) throw new Error("Membre introuvable.");
  member.role = payload.role;
  member.job_title = payload.job_title ?? null;
  writeDemoDatabase(database);
  return { message: "Membre mis a jour." };
}

export async function removeTeamMember(id: number) {
  if (!demoMode) return apiFetch<void>(`/team/members/${id}`, { method: "DELETE" });
  await pause();
  const database = readDemoDatabase();
  const team = demoTeam(database);
  if (team.members.length === 1) throw new Error("Le dernier proprietaire ne peut pas etre retire.");
  team.members = team.members.filter((row) => row.id !== id);
  writeDemoDatabase(database);
}

export async function revokeTeamInvitation(id: number) {
  if (!demoMode) return apiFetch<void>(`/team/invitations/${id}`, { method: "DELETE" });
  await pause();
  const database = readDemoDatabase();
  const team = demoTeam(database);
  team.invitations = team.invitations.filter((row) => row.id !== id);
  writeDemoDatabase(database);
}

export async function getInvitation(token: string): Promise<InvitationPreview> {
  if (!demoMode) return apiFetch<InvitationPreview>(`/invitations/${token}`);
  await pause();
  return { email: "invite@entreprise.com", role: "buyer", tenant: { id: 1, name: readDemoProfile().tenant.name }, expires_at: new Date(Date.now() + 7 * 86400000).toISOString(), existing_user: false };
}

export async function acceptInvitation(token: string, payload: { name?: string; password: string; password_confirmation?: string }) {
  const response = demoMode
    ? (await pause(), demoAuth(payload.name || "Membre invite", "invite@entreprise.com"))
    : await apiFetch<AuthResponse>(`/invitations/${token}/accept`, { method: "POST", body: JSON.stringify(payload) });
  saveSession(response.token, response.tenant.id);
  if (demoMode) saveDemoProfile(response);
  return response;
}

export async function currentSession() {
  if (demoMode) {
    await pause();
    const profile = readDemoProfile();
    return { user: profile.user, tenant: profile.tenant, role: profile.role };
  }
  return apiFetch<{ user: AuthResponse["user"]; tenant: AuthResponse["tenant"]; role: string }>("/auth/me");
}

export async function logout() {
  try {
    if (!demoMode) await apiFetch<void>("/auth/logout", { method: "POST" });
  } finally {
    clearSession();
  }
}

const demoOverviewReport: ReportOverviewData = {
  period: { from: "2026-01-01", to: "2026-07-31" },
  currency: "XAF",
  metrics: { order_count: 18, purchase_volume: 42850000, committed_amount: 11300000, realized_amount: 31550000, savings: 3840000, budget_variance: -2260000, average_request_processing_days: 2.8, average_order_processing_days: 3.4, validation_rate: 91.7, on_time_delivery_rate: 87.5, unreceived_orders: 3, cancelled_orders: 1 },
  monthly_spend: [
    { month: "2026-01", label: "janv. 2026", amount: 4200000 }, { month: "2026-02", label: "fevr. 2026", amount: 6100000 },
    { month: "2026-03", label: "mars 2026", amount: 5300000 }, { month: "2026-04", label: "avr. 2026", amount: 7800000 },
    { month: "2026-05", label: "mai 2026", amount: 4900000 }, { month: "2026-06", label: "juin 2026", amount: 8200000 },
    { month: "2026-07", label: "juil. 2026", amount: 6350000 }
  ],
  request_statuses: [{ status: "approved", count: 9 }, { status: "pending", count: 3 }, { status: "ordered", count: 14 }],
  generated_at: new Date().toISOString()
};

const demoBudgetReport: BudgetVarianceReport = {
  period: demoOverviewReport.period,
  currency: "XAF",
  summary: { budget_total: 45110000, actual_total: 42850000, variance_total: -2260000, over_budget_count: 2 },
  rows: [
    { purchase_order_id: 1, reference: "BC-2026-0018", request_reference: "DA-2026-0019", title: "Maintenance groupe electrogene", service: "Operations", cost_center: "CC-320", supplier: "AfriSupply Solutions", currency: "XAF", budget_amount: 3100000, actual_amount: 3565000, variance_amount: 465000, variance_percent: 15, severity: "high" },
    { purchase_order_id: 2, reference: "BC-2026-0015", request_reference: "DA-2026-0016", title: "Mobilier espace client", service: "Commercial", cost_center: "CC-410", supplier: "Digital Office Cameroun", currency: "XAF", budget_amount: 4800000, actual_amount: 4980000, variance_amount: 180000, variance_percent: 3.8, severity: "medium" },
    { purchase_order_id: 3, reference: "BC-2026-0012", request_reference: "DA-2026-0013", title: "Parc informatique Finance", service: "Finance", cost_center: "CC-210", supplier: "CamTech Services", currency: "XAF", budget_amount: 7200000, actual_amount: 6680000, variance_amount: -520000, variance_percent: -7.2, severity: "positive" }
  ],
  generated_at: new Date().toISOString()
};

const demoSupplierReport: SupplierPerformanceReport = {
  period: demoOverviewReport.period,
  currency: "XAF",
  summary: { supplier_count: 3, watched_count: 2, high_risk_count: 1, average_score: 4.33 },
  rows: [
    { supplier_id: 3, supplier: "AfriSupply Solutions", category: "Maintenance", score: 4.1, revenue: 11200000, order_count: 5, late_orders: 2, cancelled_orders: 0, average_lead_time_days: 9.4, on_time_rate: 60, conformity_rate: 80, disputes: 1, risk_level: "high" },
    { supplier_id: 2, supplier: "Digital Office Cameroun", category: "Informatique", score: 4.3, revenue: 14200000, order_count: 6, late_orders: 1, cancelled_orders: 1, average_lead_time_days: 6.2, on_time_rate: 83.3, conformity_rate: 100, disputes: 0, risk_level: "medium" },
    { supplier_id: 1, supplier: "CamTech Services", category: "Informatique", score: 4.6, revenue: 17450000, order_count: 7, late_orders: 0, cancelled_orders: 0, average_lead_time_days: 4.8, on_time_rate: 100, conformity_rate: 100, disputes: 0, risk_level: "low" }
  ],
  generated_at: new Date().toISOString()
};

function reportQuery(from: string, to: string) { return `?${new URLSearchParams({ from, to }).toString()}`; }
export async function getReportOverview(from: string, to: string): Promise<ReportOverviewData> { if (!demoMode) return apiFetch<ReportOverviewData>(`/reports/overview${reportQuery(from, to)}`); await pause(); return { ...demoOverviewReport, period: { from, to } }; }
export async function getBudgetVariances(from: string, to: string): Promise<BudgetVarianceReport> { if (!demoMode) return apiFetch<BudgetVarianceReport>(`/reports/budget-variances${reportQuery(from, to)}`); await pause(); return { ...demoBudgetReport, period: { from, to } }; }
export async function getSupplierPerformance(from: string, to: string): Promise<SupplierPerformanceReport> { if (!demoMode) return apiFetch<SupplierPerformanceReport>(`/reports/supplier-performance${reportQuery(from, to)}`); await pause(); return { ...demoSupplierReport, period: { from, to } }; }
export async function getReportSnapshots(): Promise<ReportSnapshotRecord[]> { if (!demoMode) return apiFetch<ReportSnapshotRecord[]>("/reports/snapshots"); await pause(); return [{ id: 1, report_type: "overview", frequency: "monthly", period_start: "2026-06-01", period_end: "2026-06-30", generated_at: "2026-07-01T06:00:00Z" }, { id: 2, report_type: "suppliers", frequency: "quarterly", period_start: "2026-04-01", period_end: "2026-06-30", generated_at: "2026-07-01T06:15:00Z" }]; }
export async function generateReportSnapshot(type: "overview" | "budget" | "suppliers", from: string, to: string) { if (!demoMode) return apiFetch<ReportSnapshotRecord>("/reports/generate", { method: "POST", body: JSON.stringify({ type, from, to }) }); await pause(); return { id: Date.now(), report_type: type, frequency: type === "suppliers" ? "quarterly" : "monthly", period_start: from, period_end: to, generated_at: new Date().toISOString() } as ReportSnapshotRecord; }
export async function downloadReport(type: "overview" | "budget" | "suppliers", from: string, to: string) {
  if (!demoMode) return apiDownload(`/reports/export?${new URLSearchParams({ type, from, to }).toString()}`);
  await pause();
  const report = type === "overview" ? demoOverviewReport.metrics : type === "budget" ? demoBudgetReport.rows : demoSupplierReport.rows;
  const rows = Array.isArray(report) ? report : Object.entries(report).map(([indicator, value]) => ({ indicator, value }));
  const headers = Object.keys(rows[0] ?? { resultat: "" });
  const csv = [headers.join(";"), ...rows.map((row) => headers.map((header) => String((row as unknown as Record<string, unknown>)[header] ?? "").replaceAll(";", ",")).join(";"))].join("\n");
  return { blob: new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }), filename: `procuflow-${type}-${from}-${to}.csv` };
}

export async function updateTenant(payload: Record<string, unknown>) {
  if (demoMode) {
    await pause();
    const profile = readDemoProfile();
    const legalName = typeof payload.legal_name === "string" ? payload.legal_name : profile.tenant.name;
    const updated = { ...profile, tenant: { ...profile.tenant, name: legalName } };
    saveDemoProfile(updated);
    return { id: profile.tenant.id, ...payload };
  }
  return apiFetch("/tenant", { method: "PUT", body: JSON.stringify(payload) });
}

export async function getDashboard(): Promise<DashboardData> {
  if (!demoMode) return apiFetch<DashboardData>("/dashboard");
  await pause();
  const database = readDemoDatabase();
  const actionable = actionableApprovals(database.purchaseRequests);
  return {
    pending_purchase_requests: database.purchaseRequests.filter((request) => request.status === "pending").length,
    pending_approvals: actionable.length,
    committed_amount_xaf: database.purchaseRequests.filter((request) => ["pending", "approved", "ordered"].includes(request.status)).reduce((total, request) => total + request.estimated_amount, 0),
    active_suppliers: database.suppliers.filter((supplier) => supplier.status === "active").length,
    draft_purchase_requests: database.purchaseRequests.filter((request) => request.status === "draft").length,
    approved_purchase_requests: database.purchaseRequests.filter((request) => request.status === "approved").length,
    recent_purchase_requests: database.purchaseRequests.slice().sort((a, b) => b.id - a.id).slice(0, 5),
    generated_at: new Date().toISOString()
  };
}

export async function getSuppliers(filters: { search?: string; status?: string; category?: string } = {}) {
  if (!demoMode) return apiFetch<Paginated<SupplierRecord>>(`/suppliers${queryString(filters)}`);
  await pause();
  const needle = filters.search?.toLocaleLowerCase("fr");
  const rows = readDemoDatabase().suppliers.filter((supplier) =>
    (!needle || [supplier.legal_name, supplier.niu, supplier.email].some((value) => value?.toLocaleLowerCase("fr").includes(needle)))
    && (!filters.status || supplier.status === filters.status)
    && (!filters.category || supplier.category === filters.category)
  );
  return paginated(rows);
}

export async function getSupplier(id: number | string) {
  if (!demoMode) return apiFetch<SupplierRecord>(`/suppliers/${id}`);
  await pause();
  const supplier = readDemoDatabase().suppliers.find((entry) => String(entry.id) === String(id));
  if (!supplier) throw new Error("Fournisseur introuvable.");
  return supplier;
}

export async function createSupplier(payload: Record<string, unknown>) {
  if (!demoMode) return apiFetch<SupplierRecord>("/suppliers", { method: "POST", body: JSON.stringify(payload) });
  await pause();
  const database = readDemoDatabase();
  const supplier: SupplierRecord = {
    id: Math.max(0, ...database.suppliers.map((entry) => entry.id)) + 1,
    legal_name: String(payload.legal_name),
    rccm: String(payload.rccm || "") || null,
    niu: String(payload.niu || "") || null,
    email: String(payload.email || "") || null,
    phone: String(payload.phone || "") || null,
    contact_name: String(payload.contact_name || "") || null,
    category: String(payload.category || "") || null,
    address: String(payload.address || "") || null,
    city: String(payload.city || "") || null,
    country: String(payload.country || "") || null,
    bank_name: String(payload.bank_name || "") || null,
    iban: String(payload.iban || "") || null,
    swift: String(payload.swift || "") || null,
    products: Array.isArray(payload.products) ? payload.products.map(String) : [],
    services: Array.isArray(payload.services) ? payload.services.map(String) : [],
    payment_terms_days: Number(payload.payment_terms_days || 0),
    status: "draft",
    score: null,
    documents_count: 0,
    created_at: new Date().toISOString()
  };
  database.suppliers.unshift(supplier);
  writeDemoDatabase(database);
  return supplier;
}

export async function evaluateSupplier(id: number | string, payload: Omit<SupplierEvaluationRecord, "id" | "score" | "evaluator" | "created_at">) {
  if (!demoMode) return apiFetch<SupplierEvaluationRecord>(`/suppliers/${id}/evaluations`, { method: "POST", body: JSON.stringify(payload) });
  await pause();
  const database = readDemoDatabase();
  const supplier = database.suppliers.find((entry) => String(entry.id) === String(id));
  if (!supplier) throw new Error("Fournisseur introuvable.");
  const scores = [payload.credit_score, payload.payment_terms_score, payload.proximity_score, payload.support_score, payload.warranty_score, payload.value_score];
  const score = Math.round((scores.reduce((total, value) => total + value, 0) / scores.length) * 100) / 100;
  const evaluation: SupplierEvaluationRecord = {
    ...payload,
    id: Date.now(),
    score,
    evaluator: readDemoProfile().user,
    created_at: new Date().toISOString()
  };
  supplier.evaluations = [evaluation, ...(supplier.evaluations ?? [])];
  supplier.score = score;
  writeDemoDatabase(database);
  return evaluation;
}

export async function uploadSupplierDocument(id: number | string, payload: { document_type: string; file: File; expires_at?: string }) {
  if (!demoMode) {
    const body = new FormData();
    body.set("document_type", payload.document_type);
    body.set("file", payload.file);
    if (payload.expires_at) body.set("expires_at", payload.expires_at);
    return apiFetch<SupplierDocumentRecord>(`/suppliers/${id}/documents`, { method: "POST", body });
  }
  await pause();
  const database = readDemoDatabase();
  const supplier = database.suppliers.find((entry) => String(entry.id) === String(id));
  if (!supplier) throw new Error("Fournisseur introuvable.");
  const document: SupplierDocumentRecord = {
    id: Date.now(),
    document_type: payload.document_type,
    original_name: payload.file.name,
    mime_type: payload.file.type,
    size_bytes: payload.file.size,
    expires_at: payload.expires_at || null,
    status: "pending_review",
    created_at: new Date().toISOString()
  };
  supplier.documents = [document, ...(supplier.documents ?? [])];
  supplier.documents_count = supplier.documents.length;
  writeDemoDatabase(database);
  return document;
}

export async function transitionSupplier(id: number | string, action: "submit" | "approve" | "suspend" | "reactivate", comment?: string) {
  if (!demoMode) return apiFetch<SupplierRecord>(`/suppliers/${id}/${action}`, { method: "POST", body: JSON.stringify({ comment }) });
  await pause();
  const database = readDemoDatabase();
  const supplier = database.suppliers.find((entry) => String(entry.id) === String(id));
  if (!supplier) throw new Error("Fournisseur introuvable.");
  const transitions = {
    submit: { from: ["draft"], to: "pending" },
    approve: { from: ["pending"], to: "active" },
    suspend: { from: ["active", "inactive"], to: "suspended" },
    reactivate: { from: ["inactive", "suspended"], to: "active" }
  } as const;
  const transition = transitions[action];
  if (!(transition.from as readonly string[]).includes(supplier.status)) throw new Error("Transition de statut impossible.");
  const previous = supplier.status;
  supplier.status = transition.to;
  supplier.status_history = [{ id: Date.now(), from_status: previous, to_status: transition.to, comment: comment || null, user: readDemoProfile().user, created_at: new Date().toISOString() }, ...(supplier.status_history ?? [])];
  writeDemoDatabase(database);
  return supplier;
}

export async function getAcdeNeeds(filters: { search?: string; status?: string } = {}) {
  if (!demoMode) return apiFetch<Paginated<AcdeNeedRecord>>(`/acde-needs${queryString(filters)}`);
  await pause();
  const needle = filters.search?.toLocaleLowerCase("fr");
  const rows = readDemoDatabase().acdeNeeds.filter((need) =>
    (!needle || need.title.toLocaleLowerCase("fr").includes(needle))
    && (!filters.status || need.status === filters.status)
  );
  return paginated(rows);
}

export async function getAcdeNeed(id: number | string) {
  if (!demoMode) return apiFetch<AcdeNeedRecord>(`/acde-needs/${id}`);
  await pause();
  const need = readDemoDatabase().acdeNeeds.find((entry) => String(entry.id) === String(id));
  if (!need) throw new Error("Besoin ACDE introuvable.");
  return need;
}

export async function createAcdeNeed(payload: Omit<AcdeNeedRecord, "id" | "status">) {
  if (!demoMode) return apiFetch<AcdeNeedRecord>("/acde-needs", { method: "POST", body: JSON.stringify(payload) });
  await pause();
  const database = readDemoDatabase();
  const id = Math.max(0, ...database.acdeNeeds.map((entry) => entry.id)) + 1;
  const need: AcdeNeedRecord = {
    ...payload,
    id,
    status: "draft",
    items: payload.items.map((item, position) => ({ ...item, id: Date.now() + position, position })),
    creator: readDemoProfile().user,
    created_at: new Date().toISOString()
  };
  database.acdeNeeds.unshift(need);
  writeDemoDatabase(database);
  return need;
}

export async function uploadAcdeDocument(id:number|string,file:File){if(!demoMode){const form=new FormData();form.append("file",file);return apiFetch(`/acde-needs/${id}/documents`,{method:"POST",body:form});}await pause();const db=readDemoDatabase(),need=db.acdeNeeds.find(row=>String(row.id)===String(id));if(!need)throw new Error("Cahier des charges introuvable.");const document={id:Date.now()+Math.floor(Math.random()*1000),original_name:file.name,mime_type:file.type,size_bytes:file.size,created_at:new Date().toISOString(),uploader:readDemoProfile().user};need.documents=[document,...(need.documents??[])];writeDemoDatabase(db);return document;}
export async function deleteAcdeDocument(needId:number|string,documentId:number|string){if(!demoMode)return apiFetch<void>(`/acde-needs/${needId}/documents/${documentId}`,{method:"DELETE"});await pause();const db=readDemoDatabase(),need=db.acdeNeeds.find(row=>String(row.id)===String(needId));if(need)need.documents=(need.documents??[]).filter(row=>String(row.id)!==String(documentId));writeDemoDatabase(db);}
export async function downloadAcdeDocument(needId:number|string,documentId:number|string){return apiDownload(`/acde-needs/${needId}/documents/${documentId}/download`);}

export async function uploadPurchaseRequestDocument(id:number|string,file:File){if(!demoMode){const form=new FormData();form.append("file",file);return apiFetch(`/purchase-requests/${id}/documents`,{method:"POST",body:form});}await pause();const db=readDemoDatabase(),request=db.purchaseRequests.find(row=>String(row.id)===String(id));if(!request)throw new Error("Demande introuvable.");const document={id:Date.now()+Math.floor(Math.random()*1000),original_name:file.name,mime_type:file.type,size_bytes:file.size,created_at:new Date().toISOString(),uploader:readDemoProfile().user};request.documents=[document,...(request.documents??[])];writeDemoDatabase(db);return document;}
export async function deletePurchaseRequestDocument(requestId:number|string,documentId:number|string){if(!demoMode)return apiFetch<void>(`/purchase-requests/${requestId}/documents/${documentId}`,{method:"DELETE"});await pause();const db=readDemoDatabase(),request=db.purchaseRequests.find(row=>String(row.id)===String(requestId));if(request)request.documents=(request.documents??[]).filter(row=>String(row.id)!==String(documentId));writeDemoDatabase(db);}
export async function downloadPurchaseRequestDocument(requestId:number|string,documentId:number|string){return apiDownload(`/purchase-requests/${requestId}/documents/${documentId}/download`);}

export async function getPurchaseRequests(filters: { search?: string; status?: string } = {}) {
  if (!demoMode) return apiFetch<Paginated<PurchaseRequestRecord>>(`/purchase-requests${queryString(filters)}`);
  await pause();
  const needle = filters.search?.toLocaleLowerCase("fr");
  const rows = readDemoDatabase().purchaseRequests
    .filter((request) => (!needle || `${request.reference} ${request.title}`.toLocaleLowerCase("fr").includes(needle)) && (!filters.status || request.status === filters.status))
    .map((request) => ({ ...request, items_count: request.items?.length ?? 0 }));
  return paginated(rows);
}

export async function getPurchaseRequest(id: number | string) {
  if (!demoMode) return apiFetch<PurchaseRequestRecord>(`/purchase-requests/${id}`);
  await pause();
  const request = readDemoDatabase().purchaseRequests.find((entry) => String(entry.id) === String(id));
  if (!request) throw new Error("Demande d'achat introuvable.");
  return request;
}

export async function createPurchaseRequest(payload: Record<string, unknown>) {
  if (!demoMode) return apiFetch<PurchaseRequestRecord>("/purchase-requests", { method: "POST", body: JSON.stringify(payload) });
  await pause();
  const database = readDemoDatabase();
  const sourceId = Number(payload.acde_need_id) || null;
  const sourceNeed = sourceId ? database.acdeNeeds.find((need) => need.id === sourceId) ?? null : null;
  if (sourceId && (!sourceNeed || sourceNeed.status !== "draft" || database.purchaseRequests.some((row) => row.acde_need_id === sourceId))) throw new Error("Ce cahier des charges est invalide ou deja transforme.");
  const items = ((payload.items as PurchaseRequestItemRecord[]) ?? []).map((item, index) => ({ ...item, id: item.id ?? Date.now() + index }));
  const estimatedAmount = Math.round(items.reduce((total, item) => total + Number(item.quantity) * Number(item.estimated_unit_price || 0), 0));
  const id = Math.max(0, ...database.purchaseRequests.map((entry) => entry.id)) + 1;
  const submitted = payload.action === "submit";
  const matchingSteps = database.workflow.steps.filter((step) => estimatedAmount >= step.minimum_amount && (step.maximum_amount == null || estimatedAmount <= step.maximum_amount));
  const approvals: ApprovalRecord[] = submitted ? matchingSteps.map((step, index) => ({
    id: Date.now() + index,
    step_order: step.step_order,
    role: step.role,
    status: "pending"
  })) : [];
  const request: PurchaseRequestRecord = {
    id,
    acde_need_id: sourceId,
    source_need: sourceNeed,
    reference: `DA-${new Date().getFullYear()}-${String(id).padStart(6, "0")}`,
    title: String(payload.title),
    service: String(payload.service),
    cost_center: String(payload.cost_center || "") || null,
    project: String(payload.project || "") || null,
    priority: (payload.priority as PurchaseRequestRecord["priority"]) || "normal",
    reason: String(payload.reason),
    needed_at: String(payload.needed_at || "") || null,
    delivery_location: String(payload.delivery_location || "") || null,
    currency: String(payload.currency || "XAF"),
    estimated_amount: estimatedAmount,
    status: submitted ? "pending" : "draft",
    creator: readDemoProfile().user,
    items,
    approvals,
    documents: [],
    created_at: new Date().toISOString()
  };
  if (request.source_need) request.source_need.status = "converted";
  database.purchaseRequests.unshift(request);
  writeDemoDatabase(database);
  return request;
}

const defaultPolicy = defaultDemoDatabase.policy ?? [];
function demoRfqs(database: DemoDatabase): RfqRecord[] { return database.rfqs ?? (database.rfqs = []); }
function demoPolicy(database: DemoDatabase): ProcurementPolicyTierRecord[] { return database.policy ?? (database.policy = JSON.parse(JSON.stringify(defaultPolicy)) as ProcurementPolicyTierRecord[]); }
function portalUrl(token: string) { return `${typeof window === "undefined" ? "http://localhost:3000" : window.location.origin}/supplier-portal/rfqs/${token}`; }
function informationPortalUrl(token:string){return `${typeof window === "undefined"?"http://localhost:3000":window.location.origin}/supplier-portal/information-requests/${token}`;}
function portalToken(id: number) { return `pf-${Date.now().toString(36)}-${id}-${Math.random().toString(36).slice(2, 12)}`; }

export async function saveStockCheck(id: number | string, payload: { notes?: string; items: Array<{ purchase_request_item_id: number; available_quantity: number; is_stock_item: boolean; stock_location?: string }> }) {
  if (!demoMode) return apiFetch<StockCheckRecord>(`/purchase-requests/${id}/stock-check`, { method:"PUT", body:JSON.stringify(payload) });
  await pause(); const db=readDemoDatabase(); const request=db.purchaseRequests.find((row)=>String(row.id)===String(id)); if(!request)throw new Error("Demande introuvable.");
  const source=request.items??[]; const items=payload.items.map((row,index)=>{const item=source.find((entry)=>entry.id===row.purchase_request_item_id);if(!item)throw new Error("Ligne invalide.");const asked=Number(item.quantity),available=row.is_stock_item?Math.min(asked,row.available_quantity):0,buy=row.is_stock_item?Math.max(0,asked-available):asked;return {id:Date.now()+index,...row,requested_quantity:asked,available_quantity:available,procurement_quantity:buy,result:!row.is_stock_item?"not_applicable":buy===0?"available":available>0?"partially_available":"unavailable"} as StockCheckRecord["items"][number];});
  const buy=items.reduce((sum,row)=>sum+Number(row.procurement_quantity),0),hasStock=items.some((row)=>Number(row.available_quantity)>0);const result=buy===0?"available":hasStock?"partially_available":items.every((row)=>row.result==="not_applicable")?"not_applicable":"unavailable";const check:StockCheckRecord={id:request.stock_check?.id??Date.now(),result,notes:payload.notes??null,checked_at:new Date().toISOString(),checker:readDemoProfile().user,items};request.stock_check=check;writeDemoDatabase(db);return check;
}

export async function getProcurementPolicy(){if(!demoMode)return apiFetch<{tiers:ProcurementPolicyTierRecord[]}>("/procurement-policy");await pause();return {tiers:demoPolicy(readDemoDatabase())};}

export async function getRfqs(filters:{status?:string}={}){if(!demoMode)return apiFetch<Paginated<RfqRecord>>(`/rfqs${queryString(filters)}`);await pause();const rows=demoRfqs(readDemoDatabase()).filter((rfq)=>!filters.status||rfq.status===filters.status).map((rfq)=>({...rfq,invited_suppliers_count:rfq.invited_suppliers?.length??0,submitted_offers_count:rfq.invited_suppliers?.filter((i)=>i.status==="submitted").length??0}));return paginated(rows);}
export async function getRfq(id:number|string){if(!demoMode)return apiFetch<RfqRecord>(`/rfqs/${id}`);await pause();const rfq=demoRfqs(readDemoDatabase()).find((row)=>String(row.id)===String(id));if(!rfq)throw new Error("Consultation introuvable.");return rfq;}

type RfqResult=RfqRecord&{portal_links?:PortalLinkRecord[]};
export async function createRfq(payload:{purchase_request_id:number;title:string;description?:string;currency?:string;response_deadline:string;delivery_location?:string;payment_terms?:string;supplier_ids:number[]}):Promise<RfqResult>{
  if(!demoMode)return apiFetch<RfqResult>("/rfqs",{method:"POST",body:JSON.stringify(payload)});
  await pause();
  const db=readDemoDatabase(),request=db.purchaseRequests.find((row)=>row.id===payload.purchase_request_id);
  if(!request||request.status!=="approved")throw new Error("Selectionnez une demande approuvee.");
  if(!request.stock_check)throw new Error("Le controle de stock est obligatoire.");
  const rfqs=demoRfqs(db);
  if(rfqs.some((row)=>row.purchase_request_id===request.id&&row.status!=="cancelled"))throw new Error("Une consultation existe deja.");
  const stock=new Map(request.stock_check.items.map((row)=>[row.purchase_request_item_id,row]));
  const source=(request.items??[]).filter((item)=>Number(stock.get(Number(item.id))?.procurement_quantity??0)>0);
  if(!source.length)throw new Error("Tout est disponible en stock.");
  const amount=source.reduce((sum,item)=>sum+Number(stock.get(Number(item.id))?.procurement_quantity)*item.estimated_unit_price,0);
  const tier=demoPolicy(db).find((row)=>amount>=row.minimum_amount&&(row.maximum_amount==null||amount<=row.maximum_amount));
  if(!tier)throw new Error("Aucune regle ne couvre ce montant.");
  const suppliers=db.suppliers.filter((row)=>payload.supplier_ids.includes(row.id)&&row.status==="active");
  if(suppliers.length!==payload.supplier_ids.length)throw new Error("Tous les fournisseurs doivent etre actifs.");
  const id=Math.max(0,...rfqs.map((row)=>row.id))+1;
  const invitations:RfqInvitationRecord[]=suppliers.map((supplier,index)=>({id:Date.now()+index,supplier_id:supplier.id,contact_email:supplier.email??"",status:"invited",supplier,portal_token:portalToken(supplier.id)}));
  const rfq:RfqRecord={
    id,reference:`RFQ-${new Date().getFullYear()}-${String(id).padStart(6,"0")}`,purchase_request_id:request.id,purchase_request:request,title:payload.title,description:payload.description??null,currency:payload.currency??request.currency,response_deadline:payload.response_deadline,delivery_location:payload.delivery_location??null,payment_terms:payload.payment_terms??null,status:"draft",required_quote_count:tier.required_quotes,competition_method:tier.competition_method,
    items:source.map((item,index)=>({id:Date.now()+100+index,purchase_request_item_id:Number(item.id),description:item.description,quantity:Number(stock.get(Number(item.id))?.procurement_quantity),unit:item.unit,specifications:item.specifications,position:index})),
    requirements:(request.source_need?.items??[]).map((item,index)=>({id:Date.now()+500+index,acde_item_id:item.id,kind:item.kind,priority_level:item.priority_level,content:item.content,criterion:item.criterion,target_value:item.target_value,unit:item.unit,tolerance:item.tolerance,verification_method:item.verification_method,position:index})),
    invited_suppliers:invitations,exception:null,messages:[],created_at:new Date().toISOString()
  };
  rfqs.unshift(rfq);request.rfq={id:rfq.id,reference:rfq.reference,status:rfq.status};writeDemoDatabase(db);return rfq;
}

export async function publishRfq(id:number|string):Promise<RfqResult>{if(!demoMode)return apiFetch<RfqResult>(`/rfqs/${id}/publish`,{method:"POST"});await pause();const db=readDemoDatabase(),rfq=demoRfqs(db).find((row)=>String(row.id)===String(id));if(!rfq||rfq.status!=="draft")throw new Error("Brouillon introuvable.");const invites=rfq.invited_suppliers??[];if(invites.length<rfq.required_quote_count&&rfq.exception?.status!=="approved")throw new Error("Invitez le minimum requis ou approuvez une derogation.");rfq.status="published";rfq.published_at=new Date().toISOString();const links=invites.map((i)=>{i.portal_token=portalToken(i.supplier_id);i.status="invited";i.invited_at=new Date().toISOString();return {supplier_id:i.supplier_id,email:i.contact_email,url:portalUrl(i.portal_token)}});const request=db.purchaseRequests.find((row)=>row.id===rfq.purchase_request_id);if(request){request.status="in_consultation";request.rfq={id:rfq.id,reference:rfq.reference,status:rfq.status}}writeDemoDatabase(db);return {...rfq,portal_links:links};}
export async function closeRfq(id:number|string){if(!demoMode)return apiFetch<RfqRecord>(`/rfqs/${id}/close`,{method:"POST"});await pause();const db=readDemoDatabase(),rfq=demoRfqs(db).find((row)=>String(row.id)===String(id));if(!rfq)throw new Error("Consultation introuvable.");const count=rfq.invited_suppliers?.filter((i)=>i.status==="submitted").length??0;if(count<rfq.required_quote_count&&rfq.exception?.status!=="approved")throw new Error(`${rfq.required_quote_count} offres sont requises.`);rfq.status="closed";rfq.closed_at=new Date().toISOString();writeDemoDatabase(db);return rfq;}
export async function regenerateRfqLink(rfqId:number|string,invitationId:number|string){if(!demoMode)return apiFetch<{url:string;email:string}>(`/rfqs/${rfqId}/suppliers/${invitationId}/regenerate-link`,{method:"POST"});await pause();const db=readDemoDatabase(),rfq=demoRfqs(db).find((row)=>String(row.id)===String(rfqId)),invite=rfq?.invited_suppliers?.find((row)=>String(row.id)===String(invitationId));if(!invite)throw new Error("Invitation introuvable.");invite.portal_token=portalToken(invite.supplier_id);writeDemoDatabase(db);return {url:portalUrl(invite.portal_token),email:invite.contact_email};}
export async function requestRfqException(id:number|string,payload:{type:"urgency"|"sole_source"|"recent_contract";justification:string}){if(!demoMode)return apiFetch(`/rfqs/${id}/exception`,{method:"POST",body:JSON.stringify(payload)});await pause();const db=readDemoDatabase(),rfq=demoRfqs(db).find((row)=>String(row.id)===String(id));if(!rfq)throw new Error("Consultation introuvable.");rfq.exception={id:Date.now(),...payload,status:"pending"};writeDemoDatabase(db);return rfq.exception;}
export async function decideRfqException(id:number|string,decision:"approved"|"rejected"){if(!demoMode)return apiFetch(`/rfqs/${id}/exception/decision`,{method:"POST",body:JSON.stringify({decision})});await pause();const db=readDemoDatabase(),rfq=demoRfqs(db).find((row)=>String(row.id)===String(id));if(!rfq?.exception)throw new Error("Derogation introuvable.");rfq.exception.status=decision;writeDemoDatabase(db);return rfq.exception;}
export async function sendRfqMessage(id:number|string,body:string){if(!demoMode)return apiFetch(`/rfqs/${id}/messages`,{method:"POST",body:JSON.stringify({body})});await pause();const db=readDemoDatabase(),rfq=demoRfqs(db).find((row)=>String(row.id)===String(id));if(!rfq)throw new Error("Consultation introuvable.");const message={id:Date.now(),sender_type:"buyer" as const,body,created_at:new Date().toISOString()};rfq.messages=[...(rfq.messages??[]),message];writeDemoDatabase(db);return message;}

export async function getSupplierPortal(token:string):Promise<PortalRfqData>{if(!demoMode)return apiFetch<PortalRfqData>(`/supplier-portal/rfqs/${token}`);await pause();const db=readDemoDatabase(),rfq=demoRfqs(db).find((row)=>row.invited_suppliers?.some((i)=>i.portal_token===token)),invite=rfq?.invited_suppliers?.find((i)=>i.portal_token===token);if(!rfq||!invite||!["published","closed"].includes(rfq.status))throw new Error("Lien invalide.");if(!invite.viewed_at){invite.viewed_at=new Date().toISOString();invite.status=invite.offer?"offer_draft":"viewed";writeDemoDatabase(db)}return {invitation:invite,supplier:invite.supplier as SupplierRecord,rfq,offer:invite.offer,is_open:rfq.status==="published"&&new Date(rfq.response_deadline).getTime()>=Date.now()};}
export async function saveSupplierOffer(token:string,payload:{currency:string;transport_cost:number;insurance_cost:number;lead_time_days:number;validity_days:number;payment_terms?:string;warranty?:string;incoterm?:string;notes?:string;items:SupplierOfferItemRecord[];requirements:OfferRequirementResponseRecord[]}):Promise<PortalRfqData>{
  if(!demoMode)return apiFetch<PortalRfqData>(`/supplier-portal/rfqs/${token}/offer`,{method:"PUT",body:JSON.stringify(payload)});
  await pause();
  const db=readDemoDatabase(),rfq=demoRfqs(db).find((row)=>row.invited_suppliers?.some((i)=>i.portal_token===token)),invite=rfq?.invited_suppliers?.find((i)=>i.portal_token===token);
  if(!rfq||!invite)throw new Error("Invitation invalide.");
  if(payload.requirements.length!==(rfq.requirements?.length??0))throw new Error("Repondez a chaque exigence.");
  const subtotal=payload.items.reduce((sum,i)=>sum+Number(i.quantity)*i.unit_price,0);
  const discount=payload.items.reduce((sum,i)=>sum+Number(i.quantity)*i.unit_price*Number(i.discount_percent)/100,0);
  const tax=payload.items.reduce((sum,i)=>{const base=Number(i.quantity)*i.unit_price*(1-Number(i.discount_percent)/100);return sum+base*Number(i.tax_percent)/100},0);
  const version=(invite.offer?.current_version??0)+1,levelWeight={mandatory:3,desired:2,comfort:1},statusScore={compliant:100,partial:50,non_compliant:0,not_applicable:0};
  const maximum=(rfq.requirements??[]).reduce((sum,r)=>sum+levelWeight[r.priority_level]*100,0);
  const earned=(rfq.requirements??[]).reduce((sum,r)=>sum+levelWeight[r.priority_level]*statusScore[payload.requirements.find(x=>x.rfq_requirement_id===r.id)?.status??"non_compliant"],0);
  const mandatory=(rfq.requirements??[]).filter(r=>r.priority_level==="mandatory").every(r=>payload.requirements.find(x=>x.rfq_requirement_id===r.id)?.status==="compliant");
  const offer:SupplierOfferRecord={id:invite.offer?.id??Date.now(),status:"draft",...payload,requirement_responses:payload.requirements,subtotal:Math.round(subtotal),discount_amount:Math.round(discount),tax_amount:Math.round(tax),total_amount:Math.round(subtotal-discount+tax+payload.transport_cost+payload.insurance_cost),compliance_score:maximum?Math.round(earned/maximum*10000)/100:100,mandatory_compliant:mandatory,current_version:version,versions:[{id:Date.now(),version,status:"draft"}]};
  invite.offer=offer;invite.status="offer_draft";writeDemoDatabase(db);return {invitation:invite,supplier:invite.supplier as SupplierRecord,rfq,offer,is_open:true};
}
export async function submitSupplierOffer(token:string):Promise<PortalRfqData>{if(!demoMode)return apiFetch<PortalRfqData>(`/supplier-portal/rfqs/${token}/offer/submit`,{method:"POST"});await pause();const db=readDemoDatabase(),rfq=demoRfqs(db).find((row)=>row.invited_suppliers?.some((i)=>i.portal_token===token)),invite=rfq?.invited_suppliers?.find((i)=>i.portal_token===token);if(!rfq||!invite?.offer)throw new Error("Enregistrez votre offre.");invite.offer.status="submitted";invite.offer.current_version++;invite.offer.submitted_at=new Date().toISOString();invite.status="submitted";invite.submitted_at=invite.offer.submitted_at;writeDemoDatabase(db);return {invitation:invite,supplier:invite.supplier as SupplierRecord,rfq,offer:invite.offer,is_open:true};}

function demoInformationRequests(database:DemoDatabase){return database.informationRequests??(database.informationRequests=[]);}
export async function getInformationRequests(filters:{status?:string;search?:string}={}){if(!demoMode)return apiFetch<Paginated<InformationRequestRecord>>(`/information-requests${queryString(filters)}`);await pause();const needle=filters.search?.toLowerCase();return paginated(demoInformationRequests(readDemoDatabase()).filter(row=>(!filters.status||row.status===filters.status)&&(!needle||`${row.reference} ${row.subject}`.toLowerCase().includes(needle))).map(row=>({...row,suppliers_count:row.suppliers?.length??0,responses_count:row.suppliers?.filter(s=>s.status==="submitted").length??0})));}
export async function getInformationRequest(id:number|string){if(!demoMode)return apiFetch<InformationRequestRecord>(`/information-requests/${id}`);await pause();const row=demoInformationRequests(readDemoDatabase()).find(item=>String(item.id)===String(id));if(!row)throw new Error("Demande d'information introuvable.");return row;}
export async function createInformationRequest(payload:{subject:string;description:string;category?:string;response_deadline:string;supplier_ids:number[]}){if(!demoMode)return apiFetch<InformationRequestRecord>("/information-requests",{method:"POST",body:JSON.stringify(payload)});await pause();const db=readDemoDatabase(),rows=demoInformationRequests(db),id=Math.max(0,...rows.map(row=>row.id))+1,suppliers=db.suppliers.filter(s=>payload.supplier_ids.includes(s.id)&&s.status==="active"&&Boolean(s.email));if(suppliers.length!==payload.supplier_ids.length)throw new Error("Tous les fournisseurs doivent etre actifs et disposer d une adresse e-mail.");const row:InformationRequestRecord={id,reference:`RFI-${new Date().getFullYear()}-${String(id).padStart(6,"0")}`,subject:payload.subject,description:payload.description,category:payload.category??null,response_deadline:payload.response_deadline,status:"draft",documents:[],suppliers:suppliers.map((supplier,index)=>({id:Date.now()+index,supplier_id:supplier.id,contact_email:supplier.email??"",status:"invited",supplier,portal_token:portalToken(supplier.id)})),created_at:new Date().toISOString()};rows.unshift(row);writeDemoDatabase(db);return row;}
export async function uploadInformationRequestDocument(id:number|string,file:File){if(!demoMode){const body=new FormData();body.append("file",file);return apiFetch(`/information-requests/${id}/documents`,{method:"POST",body});}await pause();const db=readDemoDatabase(),row=demoInformationRequests(db).find(item=>String(item.id)===String(id));if(!row||row.status!=="draft")throw new Error("Seul un brouillon accepte des documents.");const document={id:Date.now(),original_name:file.name,mime_type:file.type,size_bytes:file.size,created_at:new Date().toISOString()};row.documents=[document,...(row.documents??[])];writeDemoDatabase(db);return document;}
export async function publishInformationRequest(id:number|string){if(!demoMode)return apiFetch<InformationRequestRecord>(`/information-requests/${id}/publish`,{method:"POST"});await pause();const db=readDemoDatabase(),row=demoInformationRequests(db).find(item=>String(item.id)===String(id));if(!row||row.status!=="draft")throw new Error("Brouillon introuvable.");if(new Date(row.response_deadline).getTime()<=Date.now())throw new Error("La date limite est depassee.");row.status="published";row.published_at=new Date().toISOString();row.portal_links=(row.suppliers??[]).map(invite=>{invite.portal_token=portalToken(invite.supplier_id);invite.invited_at=new Date().toISOString();return {supplier_id:invite.supplier_id,email:invite.contact_email,url:informationPortalUrl(invite.portal_token)}});writeDemoDatabase(db);return row;}
export async function regenerateInformationRequestLink(id:number|string,invitationId:number|string){if(!demoMode)return apiFetch<{url:string;email:string}>(`/information-requests/${id}/suppliers/${invitationId}/regenerate-link`,{method:"POST"});await pause();const db=readDemoDatabase(),row=demoInformationRequests(db).find(item=>String(item.id)===String(id)),invite=row?.suppliers?.find(item=>String(item.id)===String(invitationId));if(!invite)throw new Error("Invitation introuvable.");invite.portal_token=portalToken(invite.supplier_id);writeDemoDatabase(db);return {url:informationPortalUrl(invite.portal_token),email:invite.contact_email};}
export async function closeInformationRequest(id:number|string){if(!demoMode)return apiFetch<InformationRequestRecord>(`/information-requests/${id}/close`,{method:"POST"});await pause();const db=readDemoDatabase(),row=demoInformationRequests(db).find(item=>String(item.id)===String(id));if(!row||row.status!=="published")throw new Error("Seule une demande en cours peut etre cloturee.");row.status="closed";row.closed_at=new Date().toISOString();writeDemoDatabase(db);return row;}
export async function archiveInformationRequest(id:number|string){if(!demoMode)return apiFetch<InformationRequestRecord>(`/information-requests/${id}/archive`,{method:"POST"});await pause();const db=readDemoDatabase(),row=demoInformationRequests(db).find(item=>String(item.id)===String(id));if(!row||!["published","closed"].includes(row.status))throw new Error("Cette demande ne peut pas etre archivee.");row.status="archived";row.archived_at=new Date().toISOString();row.closed_at??=new Date().toISOString();writeDemoDatabase(db);return row;}
function demoDownload(filename:string,content:string){return {blob:new Blob([content],{type:"text/plain;charset=utf-8"}),filename};}
export async function downloadInformationRequestDocument(id:number|string,documentId:number|string){if(!demoMode)return apiDownload(`/information-requests/${id}/documents/${documentId}/download`);const row=demoInformationRequests(readDemoDatabase()).find(item=>String(item.id)===String(id)),document=row?.documents?.find(item=>String(item.id)===String(documentId));if(!document)throw new Error("Document introuvable.");return demoDownload(document.original_name,`Document de demonstration ${document.original_name}`);}
export async function downloadInformationResponse(id:number|string,invitationId:number|string){if(!demoMode)return apiDownload(`/information-requests/${id}/suppliers/${invitationId}/response/download`);const row=demoInformationRequests(readDemoDatabase()).find(item=>String(item.id)===String(id)),invite=row?.suppliers?.find(item=>String(item.id)===String(invitationId));if(!invite?.response_original_name)throw new Error("Piece jointe introuvable.");return demoDownload(invite.response_original_name,invite.response??"Reponse fournisseur de demonstration");}
export async function downloadInformationRequestPortalDocument(token:string,documentId:number|string){if(!demoMode)return apiDownload(`/supplier-portal/information-requests/${token}/documents/${documentId}/download`);const row=demoInformationRequests(readDemoDatabase()).find(item=>item.suppliers?.some(invite=>invite.portal_token===token)),document=row?.documents?.find(item=>String(item.id)===String(documentId));if(!document)throw new Error("Document introuvable.");return demoDownload(document.original_name,`Document de demonstration ${document.original_name}`);}
export async function getInformationRequestPortal(token:string):Promise<PortalInformationRequestData>{if(!demoMode)return apiFetch<PortalInformationRequestData>(`/supplier-portal/information-requests/${token}`);await pause();const db=readDemoDatabase(),request=demoInformationRequests(db).find(row=>row.suppliers?.some(invite=>invite.portal_token===token)),invitation=request?.suppliers?.find(invite=>invite.portal_token===token);if(!request||!invitation||!["published","closed","archived"].includes(request.status))throw new Error("Lien invalide.");if(!invitation.viewed_at&&request.status==="published"){invitation.viewed_at=new Date().toISOString();invitation.status="viewed";writeDemoDatabase(db)}return {invitation,supplier:invitation.supplier as SupplierRecord,request,is_open:request.status==="published"&&new Date(request.response_deadline).getTime()>=Date.now()};}
export async function submitInformationResponse(token:string,response:string,file?:File){if(!demoMode){const body=new FormData();body.append("response",response);if(file)body.append("file",file);return apiFetch<PortalInformationRequestData>(`/supplier-portal/information-requests/${token}/response`,{method:"POST",body});}await pause();const db=readDemoDatabase(),request=demoInformationRequests(db).find(row=>row.suppliers?.some(invite=>invite.portal_token===token)),invitation=request?.suppliers?.find(invite=>invite.portal_token===token);if(!request||!invitation)throw new Error("Lien invalide.");if(request.status!=="published"||new Date(request.response_deadline).getTime()<Date.now())throw new Error("Cette demande est fermee.");invitation.response=response;invitation.status="submitted";invitation.submitted_at=new Date().toISOString();if(file){invitation.response_original_name=file.name;invitation.response_size_bytes=file.size}writeDemoDatabase(db);return {invitation,supplier:invitation.supplier as SupplierRecord,request,is_open:true};}

export async function getApprovalWorkflow() {
  if (!demoMode) return apiFetch<ApprovalWorkflowRecord>("/approval-workflow");
  await pause();
  return readDemoDatabase().workflow;
}

export async function updateApprovalWorkflow(payload: { name: string; steps: Array<{ role: string; minimum_amount: number; maximum_amount?: number | null }> }) {
  if (!demoMode) return apiFetch<ApprovalWorkflowRecord>("/approval-workflow", { method: "PUT", body: JSON.stringify(payload) });
  await pause();
  const database = readDemoDatabase();
  database.workflow = {
    ...database.workflow,
    name: payload.name,
    steps: payload.steps.map((step, index) => ({ ...step, id: index + 1, step_order: index + 1 }))
  };
  writeDemoDatabase(database);
  return database.workflow;
}

function actionableApprovals(requests: PurchaseRequestRecord[]): ApprovalInboxRecord[] {
  return requests.flatMap((request) => {
    const current = request.approvals?.filter((approval) => approval.status === "pending").sort((a, b) => a.step_order - b.step_order)[0];
    return current ? [{ ...current, purchase_request: request }] : [];
  });
}

export async function getApprovalInbox() {
  if (!demoMode) return apiFetch<Paginated<ApprovalInboxRecord>>("/approvals/inbox");
  await pause();
  return paginated(actionableApprovals(readDemoDatabase().purchaseRequests));
}

export async function approvePurchaseRequest(id: number | string, comment?: string) {
  if (!demoMode) return apiFetch<PurchaseRequestRecord>(`/purchase-requests/${id}/approve`, { method: "POST", body: JSON.stringify({ comment }) });
  await pause();
  return decideDemoPurchaseRequest(id, "approved", comment);
}

export async function submitPurchaseRequest(id: number | string) {
  if (!demoMode) return apiFetch<PurchaseRequestRecord>(`/purchase-requests/${id}/submit`, { method: "POST" });
  await pause();
  const database = readDemoDatabase();
  const request = database.purchaseRequests.find((entry) => String(entry.id) === String(id));
  if (!request) throw new Error("Demande d'achat introuvable.");
  if (request.status !== "draft") throw new Error("Seul un brouillon peut etre envoye en validation.");
  const matchingSteps = database.workflow.steps.filter((step) => request.estimated_amount >= step.minimum_amount && (step.maximum_amount == null || request.estimated_amount <= step.maximum_amount));
  if (matchingSteps.length === 0) throw new Error("Aucune etape de validation ne correspond a ce montant.");
  request.approvals = matchingSteps.map((step, index) => ({ id: Date.now() + index, step_order: step.step_order, role: step.role, status: "pending" }));
  request.status = "pending";
  writeDemoDatabase(database);
  return request;
}

export async function rejectPurchaseRequest(id: number | string, comment: string) {
  if (!demoMode) return apiFetch<PurchaseRequestRecord>(`/purchase-requests/${id}/reject`, { method: "POST", body: JSON.stringify({ comment }) });
  await pause();
  return decideDemoPurchaseRequest(id, "rejected", comment);
}

function decideDemoPurchaseRequest(id: number | string, decision: "approved" | "rejected", comment?: string) {
  const database = readDemoDatabase();
  const request = database.purchaseRequests.find((entry) => String(entry.id) === String(id));
  if (!request) throw new Error("Demande d'achat introuvable.");
  const approval = request.approvals?.filter((entry) => entry.status === "pending").sort((a, b) => a.step_order - b.step_order)[0];
  if (!approval) throw new Error("Aucune validation n'est en attente.");
  approval.status = decision;
  approval.comment = comment || null;
  approval.decided_at = new Date().toISOString();
  approval.approver = readDemoProfile().user;
  if (decision === "rejected") request.status = "rejected";
  else if (!request.approvals?.some((entry) => entry.status === "pending")) request.status = "approved";
  writeDemoDatabase(database);
  return request;
}

const comparisonWeights: ComparisonWeights = { price:35, delivery:15, technical:15, payment:10, warranty:10, supplier_performance:10, proximity:5 };

function recalculateDemoComparison(comparison: RfqComparisonRecord): RfqComparisonRecord {
  const prices=comparison.assessments.map((a)=>Math.max(1,a.offer.total_amount)),leads=comparison.assessments.map((a)=>Math.max(1,a.offer.lead_time_days??3650)),lowest=Math.min(...prices),fastest=Math.min(...leads);
  comparison.assessments.forEach((a)=>{const supplier=a.offer.invitation?.supplier;const raw={price:lowest/Math.max(1,a.offer.total_amount)*100,delivery:fastest/Math.max(1,a.offer.lead_time_days??3650)*100,technical:a.technical_score,payment:a.payment_score,warranty:a.warranty_score,supplier_performance:Math.min(5,Number(supplier?.score??2.5))*20,proximity:a.proximity_score};let total=0;const breakdown={} as NonNullable<OfferAssessmentRecord["score_breakdown"]>;Object.entries(comparison.weights).forEach(([key,weight])=>{const criterion=key as keyof ComparisonWeights,points=raw[criterion]*weight/100;breakdown[criterion]={score:Math.round(raw[criterion]*100)/100,weight,points:Math.round(points*100)/100};total+=points});const penalty=a.risk_level==="high"?10:a.risk_level==="medium"?4:0;breakdown.risk_penalty=penalty;a.score_breakdown=breakdown;a.final_score=Math.max(0,Math.round((total-penalty)*100)/100)});comparison.assessments.sort((a,b)=>Number(b.final_score)-Number(a.final_score)).forEach((a,i)=>a.rank=i+1);comparison.updated_at=new Date().toISOString();return comparison;
}

export async function getRfqComparison(rfqId:number|string){if(!demoMode)return apiFetch<RfqComparisonRecord>(`/rfqs/${rfqId}/comparison`);await pause();const rfq=demoRfqs(readDemoDatabase()).find((row)=>String(row.id)===String(rfqId));if(!rfq?.comparison)throw new Error("Le comparatif n'a pas encore ete genere.");return rfq.comparison;}

export async function generateRfqComparison(rfqId:number|string){if(!demoMode)return apiFetch<RfqComparisonRecord>(`/rfqs/${rfqId}/comparison/generate`,{method:"POST"});await pause();const db=readDemoDatabase(),rfq=demoRfqs(db).find((row)=>String(row.id)===String(rfqId));if(!rfq||rfq.status!=="closed")throw new Error("La consultation doit etre cloturee.");const offers=(rfq.invited_suppliers??[]).filter((i)=>i.status==="submitted"&&i.offer).map((i)=>({...i.offer!,invitation:i}));if(!offers.length)throw new Error("Aucune offre soumise.");if(!rfq.comparison){rfq.comparison={id:Date.now(),rfq_id:rfq.id,weights:{...comparisonWeights},status:"draft",version:1,creator:readDemoProfile().user,assessments:offers.map((offer,index)=>({id:Date.now()+index,supplier_offer_id:offer.id,technical_score:offer.mandatory_compliant?Math.max(70,Math.round(offer.compliance_score)):Math.min(49,Math.round(offer.compliance_score)),payment_score:offer.payment_terms?75:55,warranty_score:offer.warranty?80:45,proximity_score:offer.invitation?.supplier?.city?75:55,risk_level:offer.mandatory_compliant?"low":"high",final_score:0,offer}))}}recalculateDemoComparison(rfq.comparison);writeDemoDatabase(db);return rfq.comparison;}

export async function updateComparisonWeights(rfqId:number|string,weights:ComparisonWeights){if(!demoMode)return apiFetch<RfqComparisonRecord>(`/rfqs/${rfqId}/comparison/weights`,{method:"PUT",body:JSON.stringify({weights})});await pause();if(Object.values(weights).reduce((a,b)=>a+b,0)!==100)throw new Error("La somme doit etre egale a 100 %.");const db=readDemoDatabase(),rfq=demoRfqs(db).find((row)=>String(row.id)===String(rfqId));if(!rfq?.comparison)throw new Error("Comparatif introuvable.");rfq.comparison.weights=weights;rfq.comparison.version++;recalculateDemoComparison(rfq.comparison);writeDemoDatabase(db);return rfq.comparison;}

export async function updateOfferAssessment(rfqId:number|string,assessmentId:number,payload:{technical_score:number;payment_score:number;warranty_score:number;proximity_score:number;risk_level:"low"|"medium"|"high";assessor_notes?:string}){if(!demoMode)return apiFetch<RfqComparisonRecord>(`/rfqs/${rfqId}/comparison/assessments/${assessmentId}`,{method:"PUT",body:JSON.stringify(payload)});await pause();const db=readDemoDatabase(),rfq=demoRfqs(db).find((row)=>String(row.id)===String(rfqId)),assessment=rfq?.comparison?.assessments.find((row)=>row.id===assessmentId);if(!rfq?.comparison||!assessment)throw new Error("Evaluation introuvable.");Object.assign(assessment,payload);rfq.comparison.version++;recalculateDemoComparison(rfq.comparison);writeDemoDatabase(db);return rfq.comparison;}

export async function updateComparisonSynthesis(rfqId:number|string,payload:{executive_summary:string;analysis:string;risks:string;recommended_offer_id:number;recommendation_reason:string}){if(!demoMode)return apiFetch<RfqComparisonRecord>(`/rfqs/${rfqId}/comparison/synthesis`,{method:"PUT",body:JSON.stringify(payload)});await pause();const db=readDemoDatabase(),rfq=demoRfqs(db).find((row)=>String(row.id)===String(rfqId));if(!rfq?.comparison)throw new Error("Comparatif introuvable.");const selected=rfq.comparison.assessments.find((a)=>a.supplier_offer_id===payload.recommended_offer_id)?.offer;if(!selected?.mandatory_compliant)throw new Error("Une offre non conforme a une exigence obligatoire ne peut pas etre recommandee.");Object.assign(rfq.comparison,payload,{version:rfq.comparison.version+1});rfq.comparison.recommended_offer=selected;writeDemoDatabase(db);return rfq.comparison;}

export async function submitComparison(rfqId:number|string){if(!demoMode)return apiFetch<RfqComparisonRecord>(`/rfqs/${rfqId}/comparison/submit`,{method:"POST"});await pause();const db=readDemoDatabase(),rfq=demoRfqs(db).find((row)=>String(row.id)===String(rfqId));if(!rfq?.comparison?.recommended_offer_id)throw new Error("Completez la recommandation.");rfq.comparison.status="pending_approval";rfq.comparison.submitted_at=new Date().toISOString();writeDemoDatabase(db);return rfq.comparison;}

export async function decideComparison(rfqId:number|string,decision:"approved"|"rejected",comment?:string){if(!demoMode)return apiFetch<RfqComparisonRecord>(`/rfqs/${rfqId}/comparison/decision`,{method:"POST",body:JSON.stringify({decision,comment})});await pause();const db=readDemoDatabase(),rfq=demoRfqs(db).find((row)=>String(row.id)===String(rfqId));if(!rfq?.comparison)throw new Error("Comparatif introuvable.");rfq.comparison.status=decision;rfq.comparison.decision_comment=comment;rfq.comparison.decided_at=new Date().toISOString();rfq.comparison.decision_maker=readDemoProfile().user;if(decision==="approved"){const request=db.purchaseRequests.find((row)=>row.id===rfq.purchase_request_id);if(request)request.status="supplier_selected"}writeDemoDatabase(db);return rfq.comparison;}

function demoOrders(db:DemoDatabase){return db.purchaseOrders??(db.purchaseOrders=[]);}
export async function getPurchaseOrders(filters:{status?:string}={}){if(!demoMode)return apiFetch<Paginated<PurchaseOrderRecord>>(`/purchase-orders${queryString(filters)}`);await pause();const rows=demoOrders(readDemoDatabase()).filter((row)=>!filters.status||row.status===filters.status).map((row)=>({...row,items_count:row.items.length}));return paginated(rows);}
export async function getPurchaseOrder(id:number|string){if(!demoMode)return apiFetch<PurchaseOrderRecord>(`/purchase-orders/${id}`);await pause();const row=demoOrders(readDemoDatabase()).find((item)=>String(item.id)===String(id));if(!row)throw new Error("Bon de commande introuvable.");return row;}
export async function createPurchaseOrder(payload:{rfq_comparison_id:number;delivery_location?:string;expected_delivery_at?:string;notes?:string}){if(!demoMode)return apiFetch<PurchaseOrderRecord>("/purchase-orders",{method:"POST",body:JSON.stringify(payload)});await pause();const db=readDemoDatabase(),rfq=demoRfqs(db).find((row)=>row.comparison?.id===payload.rfq_comparison_id),comparison=rfq?.comparison;if(!rfq||comparison?.status!=="approved"||!comparison.recommended_offer)throw new Error("Une recommandation approuvee est requise.");if(demoOrders(db).some((row)=>row.rfq_comparison_id===comparison.id))throw new Error("Un bon de commande existe deja.");const offer=comparison.recommended_offer,supplier=offer.invitation?.supplier;if(!supplier)throw new Error("Fournisseur introuvable.");const id=Math.max(0,...demoOrders(db).map((row)=>row.id))+1,items=offer.items.map((item,index)=>{const source=rfq.items?.find((row)=>row.id===item.rfq_item_id);const base=Number(item.quantity)*item.unit_price*(1-Number(item.discount_percent)/100);return {id:Date.now()+index,description:source?.description??`Article ${index+1}`,quantity:item.quantity,unit:source?.unit??"unite",unit_price:item.unit_price,discount_percent:item.discount_percent,tax_percent:item.tax_percent,line_total:Math.round(base*(1+Number(item.tax_percent)/100)),specifications:source?.specifications,position:index}});const order:PurchaseOrderRecord={id,reference:`BC-${new Date().getFullYear()}-${String(id).padStart(6,"0")}`,purchase_request_id:rfq.purchase_request_id,rfq_comparison_id:comparison.id,supplier_id:supplier.id,supplier_offer_id:offer.id,status:"created",currency:offer.currency,subtotal:offer.subtotal,discount_amount:offer.discount_amount,tax_amount:offer.tax_amount,transport_cost:offer.transport_cost,insurance_cost:offer.insurance_cost,total_amount:offer.total_amount,payment_terms:offer.payment_terms,incoterm:offer.incoterm,delivery_location:payload.delivery_location??rfq.delivery_location,expected_delivery_at:payload.expected_delivery_at,notes:payload.notes,supplier,purchase_request:rfq.purchase_request,creator:readDemoProfile().user,items,approvals:["buyer","manager","finance","controller","director"].map((role,index)=>({id:Date.now()+100+index,step_order:index+1,role:role as PurchaseOrderRecord["approvals"][number]["role"],status:"pending"})),created_at:new Date().toISOString()};demoOrders(db).unshift(order);writeDemoDatabase(db);return order;}
export async function updatePurchaseOrder(id:number|string,payload:{payment_terms?:string;incoterm?:string;delivery_location:string;expected_delivery_at:string;notes?:string}){if(!demoMode)return apiFetch<PurchaseOrderRecord>(`/purchase-orders/${id}`,{method:"PUT",body:JSON.stringify(payload)});await pause();const db=readDemoDatabase(),order=demoOrders(db).find((row)=>String(row.id)===String(id));if(!order||order.status!=="created")throw new Error("Brouillon introuvable.");Object.assign(order,payload);writeDemoDatabase(db);return order;}
export async function submitPurchaseOrder(id:number|string){if(!demoMode)return apiFetch<PurchaseOrderRecord>(`/purchase-orders/${id}/submit`,{method:"POST"});await pause();const db=readDemoDatabase(),order=demoOrders(db).find((row)=>String(row.id)===String(id));if(!order?.delivery_location||!order.expected_delivery_at)throw new Error("Renseignez la livraison.");order.approvals.filter(row=>row.status==="rejected").forEach(row=>{row.status="pending";row.comment=null;row.decided_at=null;row.decision_maker=undefined});order.status="in_validation";order.submitted_at=new Date().toISOString();writeDemoDatabase(db);return order;}
export async function decidePurchaseOrder(id:number|string,decision:"approved"|"rejected",comment?:string){if(!demoMode)return apiFetch<PurchaseOrderRecord>(`/purchase-orders/${id}/decision`,{method:"POST",body:JSON.stringify({decision,comment})});await pause();const db=readDemoDatabase(),order=demoOrders(db).find((row)=>String(row.id)===String(id)),step=order?.approvals.find((row)=>row.status==="pending");if(!order||!step)throw new Error("Aucune validation en attente.");step.status=decision;step.comment=comment;step.decided_at=new Date().toISOString();step.decision_maker=readDemoProfile().user;if(decision==="rejected")order.status="created";else if(!order.approvals.some((row)=>row.status==="pending"))order.status="validated";writeDemoDatabase(db);return order;}
export async function sendPurchaseOrder(id:number|string){if(!demoMode)return apiFetch<{purchase_order:PurchaseOrderRecord;supplier_portal_url:string}>(`/purchase-orders/${id}/send`,{method:"POST"});await pause();const db=readDemoDatabase(),order=demoOrders(db).find((row)=>String(row.id)===String(id));if(!order||order.status!=="validated")throw new Error("Le BC doit etre valide.");order.status="sent";order.sent_at=new Date().toISOString();order.portal_token=`po-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;const request=db.purchaseRequests.find((row)=>row.id===order.purchase_request_id);if(request)request.status="ordered";writeDemoDatabase(db);return {purchase_order:order,supplier_portal_url:`${window.location.origin}/supplier-portal/purchase-orders/${order.portal_token}`};}
export async function getPurchaseOrderPortal(token:string){if(!demoMode)return apiFetch<PurchaseOrderRecord>(`/supplier-portal/purchase-orders/${token}`);await pause();const order=demoOrders(readDemoDatabase()).find((row)=>row.portal_token===token);if(!order)throw new Error("Lien de commande invalide.");return order;}
export async function respondPurchaseOrder(token:string,decision:"accepted"|"refused",comment?:string){if(!demoMode)return apiFetch<PurchaseOrderRecord>(`/supplier-portal/purchase-orders/${token}/respond`,{method:"POST",body:JSON.stringify({decision,comment})});await pause();const db=readDemoDatabase(),order=demoOrders(db).find((row)=>row.portal_token===token);if(!order||order.status!=="sent")throw new Error("Cette commande a deja recu une reponse.");order.status=decision;order.notes=`${order.notes??""}\nReponse fournisseur: ${comment??"Aucun commentaire"}`.trim();order.supplier_responded_at=new Date().toISOString();if(decision==="accepted"){const deliveries=db.deliveries??(db.deliveries=[]);deliveries.push({id:Date.now(),purchase_order_id:order.id,status:"pending_confirmation",planned_at:order.expected_delivery_at,purchase_order:order,items:order.items.map((item,index)=>({id:Date.now()+index,purchase_order_item_id:Number(item.id),ordered_quantity:item.quantity,received_quantity:0,remaining_quantity:item.quantity,purchase_order_item:item})),receipts:[]})}writeDemoDatabase(db);return order;}
export async function confirmOrderDelivery(token:string,planned_at:string,comment?:string){if(!demoMode)return apiFetch<DeliveryRecord>(`/supplier-portal/purchase-orders/${token}/confirm-delivery`,{method:"POST",body:JSON.stringify({planned_at,comment})});await pause();const db=readDemoDatabase(),order=demoOrders(db).find(row=>row.portal_token===token),delivery=db.deliveries?.find(row=>row.purchase_order_id===order?.id);if(!delivery)throw new Error("Livraison introuvable.");delivery.status="confirmed";delivery.planned_at=planned_at;delivery.confirmed_at=new Date().toISOString();delivery.supplier_comment=comment;writeDemoDatabase(db);return delivery;}
export async function getDeliveries(filters:{status?:string}={}){if(!demoMode)return apiFetch<Paginated<DeliveryRecord>>(`/deliveries${queryString(filters)}`);await pause();return paginated((readDemoDatabase().deliveries??[]).filter(row=>!filters.status||row.status===filters.status));}
export async function getDelivery(id:number|string){if(!demoMode)return apiFetch<DeliveryRecord>(`/deliveries/${id}`);await pause();const row=(readDemoDatabase().deliveries??[]).find(item=>String(item.id)===String(id));if(!row)throw new Error("Livraison introuvable.");return row;}
export async function receiveDelivery(id:number|string,payload:{received_at:string;observations?:string;bl:File;pv:File;items:Array<{delivery_item_id:number;quantity_received:number;observations?:string}>}){if(!demoMode){const form=new FormData();form.append("received_at",payload.received_at);form.append("observations",payload.observations??"");form.append("bl",payload.bl);form.append("pv",payload.pv);payload.items.forEach((row,index)=>{form.append(`items[${index}][delivery_item_id]`,String(row.delivery_item_id));form.append(`items[${index}][quantity_received]`,String(row.quantity_received));form.append(`items[${index}][observations]`,row.observations??"")});return apiFetch<DeliveryRecord>(`/deliveries/${id}/receipts`,{method:"POST",body:form})}await pause();const db=readDemoDatabase(),delivery=db.deliveries?.find(row=>String(row.id)===String(id));if(!delivery)throw new Error("Livraison introuvable.");payload.items.filter(row=>row.quantity_received>0).forEach(row=>{const item=delivery.items.find(entry=>entry.id===row.delivery_item_id);if(!item||row.quantity_received>Number(item.remaining_quantity))throw new Error("Quantite superieure au reliquat.");item.received_quantity=Number(item.received_quantity)+row.quantity_received;item.remaining_quantity=Number(item.remaining_quantity)-row.quantity_received});const complete=delivery.items.every(row=>Number(row.remaining_quantity)===0);delivery.status=complete?"complete":"partial";delivery.receipts.unshift({id:Date.now(),reference:`REC-${Date.now()}`,received_at:payload.received_at,type:complete?"total":"partial",observations:payload.observations,bl_original_name:payload.bl.name,pv_original_name:payload.pv.name,receiver:readDemoProfile().user,items:payload.items.filter(row=>row.quantity_received>0).map((row,index)=>({id:Date.now()+index,...row}))});writeDemoDatabase(db);return delivery;}

export async function uploadSupplierInvoice(token:string,payload:{invoice_number:string;currency:string;subtotal:number;tax_amount:number;total_amount:number;issued_at:string;due_at:string;file:File}){if(!demoMode){const form=new FormData();Object.entries(payload).forEach(([key,value])=>form.append(key,value instanceof File?value:String(value)));return apiFetch<InvoiceRecord>(`/supplier-portal/purchase-orders/${token}/invoices`,{method:"POST",body:form})}await pause();const db=readDemoDatabase(),order=demoOrders(db).find(row=>row.portal_token===token);if(!order)throw new Error("Commande introuvable.");const invoices=db.invoices??(db.invoices=[]);if(invoices.some(row=>row.invoice_number===payload.invoice_number))throw new Error("Ce numero existe deja.");const invoice:InvoiceRecord={id:Date.now(),purchase_order_id:order.id,supplier_id:order.supplier_id,invoice_number:payload.invoice_number,status:"received",currency:payload.currency,subtotal:payload.subtotal,tax_amount:payload.tax_amount,total_amount:payload.total_amount,issued_at:payload.issued_at,due_at:payload.due_at,original_name:payload.file.name,match_status:"pending",supplier:order.supplier,purchase_order:order,created_at:new Date().toISOString()};invoices.unshift(invoice);writeDemoDatabase(db);return invoice;}
export async function getInvoices(filters:{status?:string}={}){if(!demoMode)return apiFetch<Paginated<InvoiceRecord>>(`/invoices${queryString(filters)}`);await pause();return paginated((readDemoDatabase().invoices??[]).filter(row=>!filters.status||row.status===filters.status));}
export async function getInvoice(id:number|string){if(!demoMode)return apiFetch<InvoiceRecord>(`/invoices/${id}`);await pause();const row=(readDemoDatabase().invoices??[]).find(item=>String(item.id)===String(id));if(!row)throw new Error("Facture introuvable.");return row;}
export async function controlInvoice(id:number|string,comment?:string){if(!demoMode)return apiFetch<InvoiceRecord>(`/invoices/${id}/control`,{method:"POST",body:JSON.stringify({comment})});await pause();const db=readDemoDatabase(),invoice=db.invoices?.find(row=>String(row.id)===String(id)),order=demoOrders(db).find(row=>row.id===invoice?.purchase_order_id),delivery=db.deliveries?.find(row=>row.purchase_order_id===order?.id);if(!invoice||!order)throw new Error("Facture introuvable.");const diff=invoice.total_amount-order.total_amount,tolerance=Math.max(1,Math.round(order.total_amount*.01)),amountOk=Math.abs(diff)<=tolerance,deliveryOk=delivery?.status==="complete",currencyOk=invoice.currency===order.currency;invoice.match_status=amountOk&&deliveryOk&&currencyOk?"matched":"mismatch";invoice.status=invoice.match_status==="matched"?"compliant":"controlled";invoice.match_details={purchase_order_total:order.total_amount,invoice_total:invoice.total_amount,difference:diff,tolerance,amount_ok:amountOk,delivery_complete:deliveryOk,currency_ok:currencyOk};invoice.control_comment=comment;invoice.controlled_at=new Date().toISOString();invoice.controller=readDemoProfile().user;writeDemoDatabase(db);return invoice;}
export async function transmitInvoice(id:number|string){if(!demoMode)return apiFetch<InvoiceRecord>(`/invoices/${id}/transmit`,{method:"POST"});await pause();const db=readDemoDatabase(),invoice=db.invoices?.find(row=>String(row.id)===String(id));if(!invoice||invoice.status!=="compliant")throw new Error("Facture non conforme.");invoice.status="in_payment";invoice.payment_transmitted_at=new Date().toISOString();writeDemoDatabase(db);return invoice;}
export async function markInvoicePaid(id:number|string,payment_reference:string){if(!demoMode)return apiFetch<InvoiceRecord>(`/invoices/${id}/paid`,{method:"POST",body:JSON.stringify({payment_reference})});await pause();const db=readDemoDatabase(),invoice=db.invoices?.find(row=>String(row.id)===String(id));if(!invoice||invoice.status!=="in_payment")throw new Error("Facture non transmise.");invoice.status="paid";invoice.payment_reference=payment_reference;invoice.paid_at=new Date().toISOString();writeDemoDatabase(db);return invoice;}

export async function getNotifications(){if(!demoMode)return apiFetch<Paginated<AppNotificationRecord>>("/notifications");await pause();return paginated(readDemoDatabase().notifications??[]);}
export async function readNotification(id:number){if(!demoMode)return apiFetch<AppNotificationRecord>(`/notifications/${id}/read`,{method:"POST"});const db=readDemoDatabase(),row=db.notifications?.find(item=>item.id===id);if(row)row.read_at=new Date().toISOString();writeDemoDatabase(db);return row;}
export async function readAllNotifications(){if(!demoMode)return apiFetch<void>("/notifications/read-all",{method:"POST"});const db=readDemoDatabase();db.notifications?.forEach(row=>row.read_at=new Date().toISOString());writeDemoDatabase(db);}
export async function getAutomationSettings(){if(!demoMode)return apiFetch<AutomationSettings>("/automation-settings");await pause();return readDemoDatabase().automationSettings!;}
export async function updateAutomationSettings(payload:AutomationSettings){if(!demoMode)return apiFetch<AutomationSettings>("/automation-settings",{method:"PUT",body:JSON.stringify(payload)});await pause();const db=readDemoDatabase();db.automationSettings=payload;writeDemoDatabase(db);return payload;}
export async function runAutomations(){if(!demoMode)return apiFetch<{events:number;recipients:number}>("/automations/run",{method:"POST"});await pause();const db=readDemoDatabase(),notifications=db.notifications??(db.notifications=[]),now=new Date().toISOString();(db.invoices??[]).filter(row=>row.status!=="paid"&&new Date(row.due_at).getTime()<=Date.now()+3*86400000).forEach(row=>{if(!notifications.some(n=>n.type==="invoice_due"&&n.action_url===`/invoices/${row.id}`))notifications.unshift({id:Date.now()+row.id,type:"invoice_due",title:`Facture ${row.invoice_number} proche de l echeance`,body:"Controlez ou finalisez son paiement.",action_url:`/invoices/${row.id}`,created_at:now})});writeDemoDatabase(db);return {events:notifications.length,recipients:notifications.length};}

export type ContractPayload={supplier_id:number;owner_user_id:number;reference:string;title:string;contract_type:string;starts_at:string;ends_at:string;value_amount:number;currency:string;auto_renew:boolean;notice_days:number;scope?:string;renewal_terms?:string};
function demoContracts(db:DemoDatabase):ContractRecord[]{if(!db.contracts)db.contracts=[{id:1,supplier_id:1,owner_user_id:1,reference:"CTR-2026-001",title:"Maintenance du parc informatique",contract_type:"maintenance",status:"expiring",starts_at:"2025-09-01",ends_at:"2026-09-30",value_amount:12500000,currency:"XAF",auto_renew:false,notice_days:90,scope:"Maintenance preventive et corrective.",supplier:db.suppliers[0],owner:readDemoProfile().user,documents_count:1,documents:[{id:1,document_type:"signed_contract",original_name:"contrat-maintenance-signe.pdf",size_bytes:680000,created_at:"2025-09-01T08:00:00Z"}],events:[{id:1,action:"activated",from_status:"draft",to_status:"active",created_at:"2025-09-01T08:10:00Z"}]}];return db.contracts;}
export async function getContracts(filters:{status?:string;search?:string}={}){if(!demoMode)return apiFetch<Paginated<ContractRecord>>(`/contracts${queryString(filters)}`);await pause();const rows=demoContracts(readDemoDatabase()).filter(row=>(!filters.status||row.status===filters.status)&&(!filters.search||`${row.reference} ${row.title}`.toLowerCase().includes(filters.search.toLowerCase())));return paginated(rows);}
export async function getContractSummary():Promise<ContractSummary>{if(!demoMode)return apiFetch<ContractSummary>("/contracts/summary");await pause();const rows=demoContracts(readDemoDatabase());return{active:rows.filter(r=>r.status==="active").length,expiring:rows.filter(r=>r.status==="expiring").length,expired:rows.filter(r=>r.status==="expired").length,total_value:rows.filter(r=>["active","expiring"].includes(r.status)).reduce((sum,r)=>sum+r.value_amount,0)};}
export async function getContractOptions():Promise<ContractOptions>{if(!demoMode)return apiFetch<ContractOptions>("/contracts/options");await pause();const db=readDemoDatabase();return{suppliers:db.suppliers.filter(row=>row.status==="active").map(({id,legal_name,category})=>({id,legal_name,category})),owners:demoTeam(db).members.map(({id,name,email})=>({id,name,email}))};}
export async function getContract(id:number|string){if(!demoMode)return apiFetch<ContractRecord>(`/contracts/${id}`);await pause();const row=demoContracts(readDemoDatabase()).find(item=>String(item.id)===String(id));if(!row)throw new Error("Contrat introuvable.");return row;}
export async function createContract(payload:ContractPayload){if(!demoMode)return apiFetch<ContractRecord>("/contracts",{method:"POST",body:JSON.stringify(payload)});await pause();const db=readDemoDatabase(),rows=demoContracts(db),supplier=db.suppliers.find(row=>row.id===payload.supplier_id);if(!supplier)throw new Error("Fournisseur invalide.");const row:ContractRecord={id:Math.max(0,...rows.map(item=>item.id))+1,...payload,status:"draft",supplier,owner:readDemoProfile().user,documents:[],documents_count:0,events:[{id:Date.now(),action:"created",to_status:"draft",created_at:new Date().toISOString()}],created_at:new Date().toISOString()};rows.unshift(row);writeDemoDatabase(db);return row;}
export async function activateContract(id:number|string){if(!demoMode)return apiFetch<ContractRecord>(`/contracts/${id}/activate`,{method:"POST"});await pause();const db=readDemoDatabase(),row=demoContracts(db).find(item=>String(item.id)===String(id));if(!row)throw new Error("Contrat introuvable.");if(!row.documents?.length)throw new Error("Ajoutez le contrat signe avant activation.");row.status=new Date(row.ends_at).getTime()<=Date.now()+row.notice_days*86400000?"expiring":"active";row.activated_at=new Date().toISOString();row.events?.unshift({id:Date.now(),action:"activated",from_status:"draft",to_status:row.status,created_at:new Date().toISOString()});writeDemoDatabase(db);return row;}
export async function renewContract(id:number|string,payload:{ends_at:string;value_amount?:number;comment?:string}){if(!demoMode)return apiFetch<ContractRecord>(`/contracts/${id}/renew`,{method:"POST",body:JSON.stringify(payload)});await pause();const db=readDemoDatabase(),row=demoContracts(db).find(item=>String(item.id)===String(id));if(!row)throw new Error("Contrat introuvable.");const from=row.status;row.ends_at=payload.ends_at;row.value_amount=payload.value_amount??row.value_amount;row.status="active";row.events?.unshift({id:Date.now(),action:"renewed",from_status:from,to_status:"active",comment:payload.comment,created_at:new Date().toISOString()});writeDemoDatabase(db);return row;}
export async function terminateContract(id:number|string,reason:string){if(!demoMode)return apiFetch<ContractRecord>(`/contracts/${id}/terminate`,{method:"POST",body:JSON.stringify({reason})});await pause();const db=readDemoDatabase(),row=demoContracts(db).find(item=>String(item.id)===String(id));if(!row)throw new Error("Contrat introuvable.");const from=row.status;row.status="terminated";row.termination_reason=reason;row.terminated_at=new Date().toISOString();row.events?.unshift({id:Date.now(),action:"terminated",from_status:from,to_status:"terminated",comment:reason,created_at:new Date().toISOString()});writeDemoDatabase(db);return row;}
export async function uploadContractDocument(id:number|string,document_type:string,file:File){if(!demoMode){const form=new FormData();form.append("document_type",document_type);form.append("file",file);return apiFetch(`/contracts/${id}/documents`,{method:"POST",body:form});}await pause();const db=readDemoDatabase(),row=demoContracts(db).find(item=>String(item.id)===String(id));if(!row)throw new Error("Contrat introuvable.");const doc={id:Date.now(),document_type,original_name:file.name,size_bytes:file.size,created_at:new Date().toISOString()};row.documents=[doc,...(row.documents??[])];row.documents_count=row.documents.length;writeDemoDatabase(db);return doc;}

function demoSubscription(db:DemoDatabase):SubscriptionDetail{if(!db.subscription){const plans=[{code:"starter",name:"Essentiel",description:"Pour structurer les premiers achats.",monthly_price:25000,yearly_price:250000,limits:{users:3,suppliers:50,storage_gb:2}},{code:"growth",name:"Performance",description:"Pour les equipes achats en croissance.",monthly_price:75000,yearly_price:750000,limits:{users:15,suppliers:500,storage_gb:20}},{code:"enterprise",name:"Entreprise",description:"Pour les organisations multi-equipes.",monthly_price:200000,yearly_price:2000000,limits:{users:null,suppliers:null,storage_gb:100}}] as SubscriptionDetail["plans"];db.subscription={subscription:{id:1,plan_code:"growth",status:"trial",billing_cycle:"monthly",trial_ends_at:new Date(Date.now()+12*86400000).toISOString(),current_period_starts_at:new Date().toISOString(),current_period_ends_at:new Date(Date.now()+12*86400000).toISOString(),cancel_at_period_end:false},plan:plans[1],usage:{users:demoTeam(db).members.length,suppliers:db.suppliers.length,storage_bytes:1705000},plans};}return db.subscription;}
export async function getSubscription(){if(!demoMode)return apiFetch<SubscriptionDetail>("/subscription");await pause();const db=readDemoDatabase(),result=demoSubscription(db);writeDemoDatabase(db);return result;}
export async function getSubscriptionPayments(){if(!demoMode)return apiFetch<SubscriptionPaymentRecord[]>("/subscription/payments");await pause();return readDemoDatabase().subscriptionPayments??[];}
export async function checkoutSubscription(payload:{plan_code:string;billing_cycle:"monthly"|"yearly";phone:string;name?:string;email?:string}):Promise<SubscriptionCheckout>{if(!demoMode)return apiFetch<SubscriptionCheckout>("/subscription/checkout",{method:"POST",body:JSON.stringify(payload)});await pause();const db=readDemoDatabase(),detail=demoSubscription(db),plan=detail.plans.find(row=>row.code===payload.plan_code);if(!plan)throw new Error("Forfait inconnu.");const payment={id:Date.now(),reference:`SUB-DEMO-${Date.now()}`,plan_code:plan.code,billing_cycle:payload.billing_cycle,amount:payload.billing_cycle==="yearly"?plan.yearly_price:plan.monthly_price,currency:"XAF",status:"pending",created_at:new Date().toISOString()};db.subscriptionPayments=[payment,...(db.subscriptionPayments??[])];writeDemoDatabase(db);return{payment,payment_url:"",payload:{}};}
export async function cancelSubscription(){if(!demoMode)return apiFetch("/subscription/cancel",{method:"POST"});await pause();const db=readDemoDatabase(),detail=demoSubscription(db);detail.subscription.cancel_at_period_end=true;writeDemoDatabase(db);return detail.subscription;}
export async function resumeSubscription(){if(!demoMode)return apiFetch("/subscription/resume",{method:"POST"});await pause();const db=readDemoDatabase(),detail=demoSubscription(db);detail.subscription.cancel_at_period_end=false;writeDemoDatabase(db);return detail.subscription;}
