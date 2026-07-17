export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type UserSummary = {
  id: number;
  name: string;
  email: string;
};

export type TeamMemberRecord = UserSummary & {
  role: string;
  job_title?: string | null;
  joined_at?: string | null;
};

export type TeamInvitationRecord = {
  id: number;
  email: string;
  role: string;
  expires_at: string;
  created_at?: string;
};

export type TeamData = {
  members: TeamMemberRecord[];
  invitations: TeamInvitationRecord[];
  roles: string[];
};

export type InvitationPreview = {
  email: string;
  role: string;
  tenant: { id: number; name: string };
  expires_at: string;
  existing_user: boolean;
};

export type SupplierStatus = "draft" | "pending" | "active" | "inactive" | "suspended";

export type SupplierDocumentRecord = {
  id: number;
  document_type: string;
  original_name: string;
  mime_type?: string | null;
  size_bytes: number;
  expires_at?: string | null;
  status: string;
  created_at?: string;
};

export type SupplierEvaluationRecord = {
  id: number;
  credit_score: number;
  payment_terms_score: number;
  proximity_score: number;
  support_score: number;
  warranty_score: number;
  value_score: number;
  score: string | number;
  comment?: string | null;
  evaluator?: UserSummary;
  created_at?: string;
};

export type SupplierStatusHistoryRecord = {
  id: number;
  from_status?: string | null;
  to_status: string;
  comment?: string | null;
  user?: UserSummary;
  created_at?: string;
};

export type SupplierRecord = {
  id: number;
  legal_name: string;
  rccm?: string | null;
  niu?: string | null;
  email?: string | null;
  phone?: string | null;
  contact_name?: string | null;
  category?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  bank_name?: string | null;
  iban?: string | null;
  swift?: string | null;
  products?: string[] | null;
  services?: string[] | null;
  payment_terms_days: number;
  status: SupplierStatus;
  score?: string | number | null;
  documents_count?: number;
  documents?: SupplierDocumentRecord[];
  evaluations?: SupplierEvaluationRecord[];
  status_history?: SupplierStatusHistoryRecord[];
  created_at?: string;
};

export type AcdeKind = "expectation" | "constraint" | "data" | "requirement";

export type AcdeItemRecord = {
  id?: number;
  kind: AcdeKind;
  priority_level: "mandatory" | "desired" | "comfort";
  content: string;
  criterion?: string | null;
  target_value?: string | null;
  unit?: string | null;
  tolerance?: string | null;
  verification_method?: string | null;
  position?: number;
};

export type DocumentAttachmentRecord={id:number;original_name:string;mime_type?:string|null;size_bytes:number;created_at?:string;uploader?:UserSummary};

export type AcdeNeedRecord = {
  id: number;
  title: string;
  context?: string | null;
  service?: string | null;
  needed_at?: string | null;
  status: "draft" | "ready" | "converted";
  priority?: "low" | "normal" | "high" | "urgent" | null;
  budget_amount?: number | null;
  currency?: string;
  delivery_location?: string | null;
  items: AcdeItemRecord[];
  documents?: DocumentAttachmentRecord[];
  creator?: UserSummary;
  created_at?: string;
};

export type PurchaseRequestStatus = "draft" | "pending" | "approved" | "rejected" | "in_consultation" | "supplier_selected" | "ordered";

export type PurchaseRequestItemRecord = {
  id?: number;
  description: string;
  quantity: string | number;
  unit: string;
  estimated_unit_price: number;
  specifications?: string | null;
};

export type ApprovalRecord = {
  id: number;
  step_order: number;
  role: string;
  status: "pending" | "approved" | "rejected";
  comment?: string | null;
  decided_at?: string | null;
  approver?: UserSummary | null;
};

export type PurchaseRequestRecord = {
  id: number;
  reference: string;
  title: string;
  service: string;
  cost_center?: string | null;
  project?: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  reason: string;
  needed_at?: string | null;
  delivery_location?: string | null;
  currency: string;
  estimated_amount: number;
  status: PurchaseRequestStatus;
  creator?: UserSummary;
  items?: PurchaseRequestItemRecord[];
  approvals?: ApprovalRecord[];
  stock_check?: StockCheckRecord | null;
  rfq?: Pick<RfqRecord, "id" | "reference" | "status"> | null;
  items_count?: number;
  created_at?: string;
  acde_need_id?: number|null;
  source_need?: AcdeNeedRecord|null;
  documents?: DocumentAttachmentRecord[];
};

export type ApprovalWorkflowStepRecord = {
  id?: number;
  step_order: number;
  role: string;
  minimum_amount: number;
  maximum_amount?: number | null;
};

export type ApprovalWorkflowRecord = {
  id: number;
  name: string;
  document_type: "purchase_request";
  is_active: boolean;
  steps: ApprovalWorkflowStepRecord[];
};

export type ApprovalInboxRecord = ApprovalRecord & {
  purchase_request: PurchaseRequestRecord;
};

export type DashboardData = {
  pending_purchase_requests: number;
  pending_approvals: number;
  committed_amount_xaf: number;
  active_suppliers: number;
  draft_purchase_requests: number;
  approved_purchase_requests: number;
  recent_purchase_requests: PurchaseRequestRecord[];
  generated_at: string;
};

export type StockCheckResult = "available" | "partially_available" | "unavailable" | "not_applicable";
export type StockCheckItemRecord = { id?: number; purchase_request_item_id: number; requested_quantity: string | number; available_quantity: string | number; procurement_quantity: string | number; result: StockCheckResult; stock_location?: string | null; comment?: string | null; purchase_request_item?: PurchaseRequestItemRecord };
export type StockCheckRecord = { id: number; result: StockCheckResult; notes?: string | null; checked_at: string; checker?: UserSummary; items: StockCheckItemRecord[] };
export type ProcurementPolicyTierRecord = { id?: number; name: string; minimum_amount: number; maximum_amount?: number | null; required_quotes: number; competition_method: "direct_purchase" | "simplified_rfq" | "competitive_rfq" | "restricted_tender" | "formal_tender"; validator_roles: string[]; position?: number };
export type RfqStatus = "draft" | "published" | "closed" | "cancelled";
export type RfqItemRecord = { id: number; purchase_request_item_id?: number | null; description: string; quantity: string | number; unit: string; specifications?: string | null; position: number };
export type SupplierOfferItemRecord = { id?: number; rfq_item_id: number; quantity: string | number; unit_price: number; discount_percent: string | number; tax_percent: string | number; is_compliant: boolean; comment?: string | null };
export type RfqRequirementRecord = { id:number; acde_item_id?:number|null; kind:AcdeKind; priority_level:"mandatory"|"desired"|"comfort"; content:string; criterion?:string|null; target_value?:string|null; unit?:string|null; tolerance?:string|null; verification_method?:string|null; position:number };
export type OfferRequirementResponseRecord = { id?:number; rfq_requirement_id:number; status:"compliant"|"partial"|"non_compliant"|"not_applicable"; response?:string|null; evidence_reference?:string|null; requirement?:RfqRequirementRecord };
export type SupplierOfferVersionRecord = { id: number; version: number; status: "draft" | "submitted"; created_at?: string; submitted_at?: string | null };
export type SupplierOfferRecord = { id: number; status: "draft" | "submitted"; currency: string; subtotal: number; discount_amount: number; tax_amount: number; transport_cost: number; insurance_cost: number; total_amount: number; compliance_score:number; mandatory_compliant:boolean; lead_time_days?: number | null; validity_days: number; payment_terms?: string | null; warranty?: string | null; incoterm?: string | null; notes?: string | null; current_version: number; submitted_at?: string | null; items: SupplierOfferItemRecord[]; requirement_responses?:OfferRequirementResponseRecord[]; versions?: SupplierOfferVersionRecord[] };
export type RfqInvitationRecord = { id: number; supplier_id: number; contact_email: string; status: "invited" | "viewed" | "offer_draft" | "submitted" | "declined"; invited_at?: string | null; viewed_at?: string | null; declined_at?: string | null; submitted_at?: string | null; supplier?: SupplierRecord; offer?: SupplierOfferRecord | null; portal_token?: string };
export type ProcurementExceptionRecord = { id: number; type: "urgency" | "sole_source" | "recent_contract"; justification: string; evidence_reference?: string | null; status: "pending" | "approved" | "rejected"; decision_comment?: string | null };
export type RfqMessageRecord = { id: number; rfq_supplier_id?: number | null; sender_type: "buyer" | "supplier"; body: string; created_at?: string };
export type RfqRecord = { id: number; reference: string; purchase_request_id: number; title: string; description?: string | null; currency: string; response_deadline: string; delivery_location?: string | null; payment_terms?: string | null; status: RfqStatus; required_quote_count: number; competition_method: string; published_at?: string | null; closed_at?: string | null; purchase_request?: PurchaseRequestRecord; items?: RfqItemRecord[]; requirements?:RfqRequirementRecord[]; invited_suppliers?: RfqInvitationRecord[]; invited_suppliers_count?: number; submitted_offers_count?: number; exception?: ProcurementExceptionRecord | null; comparison?: RfqComparisonRecord | null; messages?: RfqMessageRecord[]; created_at?: string };
export type PortalRfqData = { invitation: Pick<RfqInvitationRecord,"id"|"status"|"invited_at"|"viewed_at"|"declined_at"|"submitted_at">; supplier: SupplierRecord; rfq: RfqRecord; offer?: SupplierOfferRecord | null; is_open: boolean };
export type InformationRequestSupplierRecord={id:number;supplier_id:number;contact_email:string;status:"invited"|"viewed"|"submitted";invited_at?:string|null;viewed_at?:string|null;submitted_at?:string|null;response?:string|null;response_original_name?:string|null;response_size_bytes?:number;supplier?:SupplierRecord;portal_token?:string};
export type InformationRequestRecord={id:number;reference:string;subject:string;description:string;category?:string|null;response_deadline:string;status:"draft"|"published"|"closed"|"archived";published_at?:string|null;closed_at?:string|null;archived_at?:string|null;suppliers?:InformationRequestSupplierRecord[];suppliers_count?:number;responses_count?:number;documents?:DocumentAttachmentRecord[];portal_links?:PortalLinkRecord[];creator?:UserSummary;created_at?:string};
export type PortalInformationRequestData={invitation:InformationRequestSupplierRecord;supplier:SupplierRecord;request:InformationRequestRecord;is_open:boolean};
export type PortalLinkRecord = { supplier_id: number; email: string; url: string };

export type ComparisonCriterion = "price" | "delivery" | "technical" | "payment" | "warranty" | "supplier_performance" | "proximity";
export type ComparisonWeights = Record<ComparisonCriterion, number>;
export type ScoreBreakdown = Record<ComparisonCriterion, { score: number; weight: number; points: number }> & { risk_penalty?: number };
export type OfferAssessmentRecord = { id: number; supplier_offer_id: number; technical_score: number; payment_score: number; warranty_score: number; proximity_score: number; risk_level: "low" | "medium" | "high"; assessor_notes?: string | null; score_breakdown?: ScoreBreakdown | null; final_score: string | number; rank?: number | null; offer: SupplierOfferRecord & { invitation?: RfqInvitationRecord } };
export type RfqComparisonRecord = { id: number; rfq_id: number; weights: ComparisonWeights; status: "draft" | "pending_approval" | "approved" | "rejected"; executive_summary?: string | null; analysis?: string | null; risks?: string | null; recommended_offer_id?: number | null; recommendation_reason?: string | null; decision_comment?: string | null; version: number; submitted_at?: string | null; decided_at?: string | null; creator?: UserSummary; decision_maker?: UserSummary; recommended_offer?: SupplierOfferRecord & { invitation?: RfqInvitationRecord }; assessments: OfferAssessmentRecord[]; created_at?: string; updated_at?: string };

export type PurchaseOrderStatus = "created" | "in_validation" | "validated" | "sent" | "accepted" | "refused" | "cancelled";
export type PurchaseOrderItemRecord = { id?: number; description: string; quantity: string | number; unit: string; unit_price: number; discount_percent: string | number; tax_percent: string | number; line_total: number; specifications?: string | null; position: number };
export type PurchaseOrderApprovalRecord = { id: number; step_order: number; role: "buyer" | "manager" | "finance" | "controller" | "director"; status: "pending" | "approved" | "rejected"; comment?: string | null; decided_at?: string | null; decision_maker?: UserSummary };
export type PurchaseOrderRecord = { id: number; reference: string; purchase_request_id: number; rfq_comparison_id: number; supplier_id: number; supplier_offer_id: number; status: PurchaseOrderStatus; currency: string; subtotal: number; discount_amount: number; tax_amount: number; transport_cost: number; insurance_cost: number; total_amount: number; payment_terms?: string | null; incoterm?: string | null; delivery_location?: string | null; expected_delivery_at?: string | null; notes?: string | null; signature_hash?: string | null; signed_at?: string | null; submitted_at?: string | null; validated_at?: string | null; sent_at?: string | null; supplier_responded_at?: string | null; supplier?: SupplierRecord; purchase_request?: Pick<PurchaseRequestRecord,"id"|"reference"|"title"|"service"|"cost_center">; creator?: UserSummary; items: PurchaseOrderItemRecord[]; approvals: PurchaseOrderApprovalRecord[]; items_count?: number; portal_token?: string; created_at?: string };
export type DeliveryStatus = "pending_confirmation"|"confirmed"|"partial"|"complete"|"disputed";
export type DeliveryItemRecord = {id:number;purchase_order_item_id:number;ordered_quantity:string|number;received_quantity:string|number;remaining_quantity:string|number;purchase_order_item?:PurchaseOrderItemRecord};
export type DeliveryReceiptRecord = {id:number;reference:string;received_at:string;type:"partial"|"total";observations?:string|null;bl_original_name:string;pv_original_name:string;receiver?:UserSummary;items:Array<{id:number;delivery_item_id:number;quantity_received:string|number;observations?:string|null}>};
export type DeliveryRecord = {id:number;purchase_order_id:number;status:DeliveryStatus;planned_at?:string|null;confirmed_at?:string|null;supplier_comment?:string|null;purchase_order:PurchaseOrderRecord;items:DeliveryItemRecord[];receipts:DeliveryReceiptRecord[];created_at?:string};
export type InvoiceStatus="received"|"controlled"|"compliant"|"in_payment"|"paid";
export type InvoiceRecord={id:number;purchase_order_id:number;supplier_id:number;invoice_number:string;status:InvoiceStatus;currency:string;subtotal:number;tax_amount:number;total_amount:number;issued_at:string;due_at:string;original_name:string;match_status:"pending"|"matched"|"mismatch";match_details?:{purchase_order_total:number;invoice_total:number;difference:number;tolerance:number;amount_ok:boolean;delivery_complete:boolean;currency_ok:boolean}|null;control_comment?:string|null;controlled_at?:string|null;payment_reference?:string|null;payment_transmitted_at?:string|null;paid_at?:string|null;supplier?:SupplierRecord;purchase_order?:PurchaseOrderRecord;controller?:UserSummary;created_at?:string};
export type AppNotificationRecord={id:number;type:string;title:string;body:string;action_url?:string|null;read_at?:string|null;created_at:string};
export type AutomationSettings={id?:number;email_enabled:boolean;in_app_enabled:boolean;rfq_reminder_days:number;approval_reminder_hours:number;delivery_reminder_days:number;invoice_reminder_days:number;document_expiry_days:number;contract_expiry_days:number};

export type ContractStatus="draft"|"active"|"expiring"|"expired"|"terminated";
export type ContractDocumentRecord={id:number;document_type:string;original_name:string;mime_type?:string|null;size_bytes:number;created_at?:string;uploader?:UserSummary};
export type ContractEventRecord={id:number;action:string;from_status?:string|null;to_status?:string|null;comment?:string|null;created_at?:string;user?:UserSummary|null};
export type ContractRecord={id:number;supplier_id:number;owner_user_id:number;reference:string;title:string;contract_type:string;status:ContractStatus;starts_at:string;ends_at:string;value_amount:number;currency:string;auto_renew:boolean;notice_days:number;scope?:string|null;renewal_terms?:string|null;activated_at?:string|null;terminated_at?:string|null;termination_reason?:string|null;supplier?:SupplierRecord;owner?:UserSummary;documents_count?:number;documents?:ContractDocumentRecord[];events?:ContractEventRecord[];created_at?:string};
export type ContractSummary={active:number;expiring:number;expired:number;total_value:number};
export type ContractOptions={suppliers:Array<Pick<SupplierRecord,"id"|"legal_name"|"category">>;owners:UserSummary[]};

export type SubscriptionPlan={code:string;name:string;description:string;monthly_price:number;yearly_price:number;limits:{users:number|null;suppliers:number|null;storage_gb:number}};
export type TenantSubscriptionRecord={id:number;plan_code:string;status:"trial"|"active"|"expired"|"cancelled";billing_cycle:"monthly"|"yearly";trial_ends_at?:string|null;current_period_starts_at?:string|null;current_period_ends_at?:string|null;cancel_at_period_end:boolean;cancelled_at?:string|null};
export type SubscriptionDetail={subscription:TenantSubscriptionRecord;plan:SubscriptionPlan;usage:{users:number;suppliers:number;storage_bytes:number};plans:SubscriptionPlan[]};
export type SubscriptionPaymentRecord={id:number;reference:string;plan_code:string;billing_cycle:string;amount:number;currency:string;status:string;paid_at?:string|null;created_at:string};
export type SubscriptionCheckout={payment:SubscriptionPaymentRecord;payment_url:string;payload:Record<string,string|number>};

export type ReportPeriod = { from: string; to: string };
export type ReportOverviewData = {
  period: ReportPeriod;
  currency: string;
  metrics: {
    order_count: number; purchase_volume: number; committed_amount: number; realized_amount: number;
    savings: number; budget_variance: number; average_request_processing_days: number;
    average_order_processing_days: number; validation_rate: number; on_time_delivery_rate: number;
    unreceived_orders: number; cancelled_orders: number;
  };
  monthly_spend: Array<{ month: string; label: string; amount: number }>;
  request_statuses: Array<{ status: string; count: number }>;
  generated_at: string;
};
export type BudgetVarianceRow = {
  purchase_order_id: number; reference: string; request_reference?: string | null; title?: string | null;
  service?: string | null; cost_center?: string | null; supplier?: string | null; currency: string;
  budget_amount: number; actual_amount: number; variance_amount: number; variance_percent: number;
  severity: "high" | "medium" | "positive";
};
export type BudgetVarianceReport = {
  period: ReportPeriod;
  currency: string;
  summary: { budget_total: number; actual_total: number; variance_total: number; over_budget_count: number };
  rows: BudgetVarianceRow[];
  generated_at: string;
};
export type SupplierPerformanceRow = {
  supplier_id: number; supplier: string; category?: string | null; score: number; revenue: number;
  order_count: number; late_orders: number; cancelled_orders: number; average_lead_time_days: number;
  on_time_rate: number; conformity_rate: number; disputes: number; risk_level: "high" | "medium" | "low";
};
export type SupplierPerformanceReport = {
  period: ReportPeriod;
  currency: string;
  summary: { supplier_count: number; watched_count: number; high_risk_count: number; average_score: number };
  rows: SupplierPerformanceRow[];
  generated_at: string;
};
export type ReportSnapshotRecord = {
  id: number; report_type: "overview" | "budget" | "suppliers"; frequency: "monthly" | "quarterly";
  period_start: string; period_end: string; generated_at: string;
};
