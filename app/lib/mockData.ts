export const fmtCurrency = (n: number, c = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: c,
    maximumFractionDigits: 0,
  }).format(n);

export const fmtWeight = (g: number) =>
  g >= 1000 ? `${(g / 1000).toFixed(2)} kg` : `${g.toFixed(1)} g`;

export const KPIS = {
  totalSales: 248_400,
  totalExpenses: 162_800,
  netProfit: 85_600,
  stockWeight: 4218.5,
  stockValue: 312_540,
  cashPosition: 178_220,
  pendingInvoices: { count: 7, value: 42_300 },
  activeQuotations: 5,
};

export const SALES_VS_EXPENSES = [
  { day: "Mon", sales: 38400, expenses: 22100 },
  { day: "Tue", sales: 41200, expenses: 19800 },
  { day: "Wed", sales: 28900, expenses: 24600 },
  { day: "Thu", sales: 52100, expenses: 26200 },
  { day: "Fri", sales: 47800, expenses: 28700 },
  { day: "Sat", sales: 22000, expenses: 14400 },
  { day: "Sun", sales: 18000, expenses: 11500 },
];

export const PROFIT_TREND = Array.from({ length: 30 }).map((_, i) => ({
  day: i + 1,
  profit: 30000 + Math.sin(i / 3) * 12000 + i * 800 + (i % 5 === 0 ? 4000 : 0),
  forecast: i > 22 ? 38000 + i * 900 : null,
}));

export const STOCK_BY_PURITY = [
  { name: "24K", value: 1820, color: "#b8893d" },
  { name: "22K", value: 980, color: "#dcb35a" },
  { name: "18K", value: 760, color: "#c89b62" },
  { name: "Raw", value: 658.5, color: "#8a6d3a" },
];

export const RECENT_TX = [
  { ref: "TX-018342", date: "May 04", type: "Gold Sale", party: "Mwanza Refinery Ltd.", amount: 18_400, status: "confirmed" },
  { ref: "TX-018341", date: "May 04", type: "Op. Expense", party: "Vault Security — May", amount: -1_240, status: "confirmed" },
  { ref: "TX-018340", date: "May 03", type: "Gold Purchase", party: "Geita Cooperative", amount: -22_800, status: "pending" },
  { ref: "TX-018339", date: "May 03", type: "Logistics", party: "Armoured Transit · Mwanza→DSM", amount: -940, status: "confirmed" },
  { ref: "TX-018338", date: "May 02", type: "Gold Sale", party: "Patel Jewellers", amount: 9_650, status: "confirmed" },
  { ref: "TX-018337", date: "May 02", type: "Processing", party: "Refining Batch #224", amount: -1_800, status: "confirmed" },
];

export const PENDING_INVOICES = [
  { no: "INV-2026-000482", customer: "Mwanza Refinery Ltd.", due: "May 09", amount: 18_400, status: "sent" },
  { no: "INV-2026-000478", customer: "Patel Jewellers", due: "May 12", amount: 9_650, status: "sent" },
  { no: "INV-2026-000471", customer: "Lake Zone Traders", due: "Apr 28", amount: 6_200, status: "overdue" },
  { no: "INV-2026-000466", customer: "Sukuma Gold Co.", due: "May 06", amount: 4_840, status: "sent" },
  { no: "INV-2026-000459", customer: "Bulyanhulu Buyers", due: "Apr 22", amount: 3_210, status: "overdue" },
];

export const ALERTS = [
  { kind: "stock", severity: "warning", title: "Low stock — 18K grade", body: "Below 750g threshold (current 612g)", time: "12 min ago" },
  { kind: "anomaly", severity: "info", title: "Unusual purchase amount", body: "TX-018340 is 2.8σ above category mean", time: "1 hr ago" },
  { kind: "invoice", severity: "danger", title: "Invoice overdue", body: "INV-2026-000471 — Lake Zone Traders, 7 days", time: "today" },
  { kind: "price", severity: "info", title: "Price deviation", body: "Manual entry +6.2% vs 30-day avg", time: "today" },
  { kind: "expense", severity: "warning", title: "Weekly expense ceiling", body: "98% of weekly budget used", time: "yesterday" },
];

export const INVENTORY_BATCHES = [
  { batch: "BATCH-20260503-0042", weight: 1240.5, karat: 24, fine: 1240.5, location: "Vault A", status: "Available", value: 91_870, source: "Geita Coop." },
  { batch: "BATCH-20260502-0041", weight: 880.0, karat: 22, fine: 806.6, location: "Vault A", status: "Reserved", value: 59_768, source: "Bulyanhulu" },
  { batch: "BATCH-20260501-0040", weight: 612.2, karat: 18, fine: 459.1, location: "Vault B", status: "Available", value: 34_010, source: "Refining #224" },
  { batch: "BATCH-20260430-0039", weight: 658.5, karat: 0, fine: 0, location: "Processing", status: "Processing", value: 0, source: "North Mara" },
  { batch: "BATCH-20260428-0038", weight: 422.3, karat: 24, fine: 422.3, location: "In Transit", status: "In Transit", value: 31_290, source: "Mwanza→DSM" },
];

export const QUOTATIONS = [
  { no: "QUO-2026-000091", customer: "Patel Jewellers", expires: "May 11", amount: 14_200, status: "ACCEPTED" },
  { no: "QUO-2026-000090", customer: "Mwanza Refinery Ltd.", expires: "May 09", amount: 26_500, status: "PENDING" },
  { no: "QUO-2026-000089", customer: "Sukuma Gold Co.", expires: "May 06", amount: 8_900, status: "APPROVED" },
  { no: "QUO-2026-000088", customer: "Lake Zone Traders", expires: "Apr 30", amount: 5_600, status: "EXPIRED" },
  { no: "QUO-2026-000087", customer: "Coastal Buyers", expires: "—", amount: 11_300, status: "DRAFT" },
];

export const CASH_FLOW = [
  { week: "W1", inflow: 92_000, outflow: 64_000 },
  { week: "W2", inflow: 84_000, outflow: 71_500 },
  { week: "W3", inflow: 110_500, outflow: 58_900 },
  { week: "W4", inflow: 78_400, outflow: 82_400 },
];

export const GOLD_PRICE = {
  current: 74.05,
  currency: "USD",
  unit: "per gram",
  source: "Manual entry · Admin",
  asOf: "May 4, 2026 · 09:14",
  delta: +0.42,
  history: [73.1, 73.4, 73.2, 73.8, 74.0, 73.6, 74.05],
};

export const GOLD_FLOW = {
  sold: {
    weight_g: 1842.5,
    value_usd: 136_339,
    count: 14,
    spark: [120, 280, 220, 340, 410, 220, 250],
    avgPricePerGram: 74.0,
  },
  purchased: {
    weight_g: 2410.0,
    value_usd: 168_700,
    count: 9,
    spark: [200, 280, 320, 280, 410, 360, 560],
    avgPricePerGram: 70.0,
  },
};

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  totalPurchases: number;
  outstanding: number;
  status: "active" | "inactive";
  joined: string;
  lastTx: string;
  notes?: string;
}

export const CUSTOMERS: Customer[] = [
  { id: "CUST-2026-000091", name: "Mwanza Refinery Ltd.", email: "acct@mwanzarefinery.tz", phone: "+255 754 102 884", location: "Mwanza · HQ", totalPurchases: 184_300, outstanding: 18_400, status: "active", joined: "Jan 12, 2024", lastTx: "May 04, 2026" },
  { id: "CUST-2026-000087", name: "Patel Jewellers", email: "sales@patel.tz", phone: "+255 712 488 219", location: "Dar es Salaam", totalPurchases: 96_400, outstanding: 0, status: "active", joined: "Mar 18, 2024", lastTx: "May 03, 2026" },
  { id: "CUST-2026-000074", name: "Sukuma Gold Co.", email: "ops@sukumagold.tz", phone: "+255 768 332 117", location: "Mwanza · Lake Zone", totalPurchases: 64_120, outstanding: 4_840, status: "active", joined: "Jul 04, 2024", lastTx: "May 03, 2026" },
  { id: "CUST-2026-000068", name: "Lake Zone Traders", email: "info@lakezone.tz", phone: "+255 754 991 220", location: "Mwanza", totalPurchases: 42_800, outstanding: 14_320, status: "active", joined: "Aug 22, 2024", lastTx: "May 02, 2026" },
  { id: "CUST-2026-000061", name: "Coastal Buyers", email: "buy@coastal.tz", phone: "+255 712 877 663", location: "Tanga", totalPurchases: 28_100, outstanding: 0, status: "active", joined: "Sep 09, 2024", lastTx: "Apr 30, 2026" },
  { id: "CUST-2026-000054", name: "Bulyanhulu Buyers", email: "ops@bulyanhulu.tz", phone: "+255 768 401 002", location: "Shinyanga", totalPurchases: 19_440, outstanding: 3_210, status: "active", joined: "Nov 14, 2024", lastTx: "Apr 25, 2026" },
  { id: "CUST-2026-000048", name: "Northern Crafts", email: "hello@northerncrafts.tz", phone: "+255 754 220 991", location: "Arusha", totalPurchases: 11_240, outstanding: 1_540, status: "active", joined: "Dec 02, 2024", lastTx: "Apr 23, 2026" },
  { id: "CUST-2026-000041", name: "Zanzibar Goldsmith", email: "office@zgsmith.tz", phone: "+255 778 102 412", location: "Zanzibar", totalPurchases: 6_200, outstanding: 0, status: "inactive", joined: "Feb 10, 2025", lastTx: "Mar 12, 2026" },
];

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  location: string;
  totalSupplied_g: number;
  totalPaid: number;
  outstanding: number;
  status: "active" | "inactive";
  joined: string;
  lastDelivery: string;
}

export const SUPPLIERS: Supplier[] = [
  { id: "SUPP-2026-000042", name: "Geita Cooperative", contact: "+255 754 882 110", email: "coop@geita.tz", location: "Geita Region", totalSupplied_g: 18_420, totalPaid: 1_312_400, outstanding: 22_800, status: "active", joined: "Feb 14, 2024", lastDelivery: "May 04, 2026" },
  { id: "SUPP-2026-000038", name: "North Mara Mining", contact: "+255 712 553 290", email: "supply@nmaramining.tz", location: "Mara Region", totalSupplied_g: 22_800, totalPaid: 1_624_300, outstanding: 0, status: "active", joined: "Apr 09, 2024", lastDelivery: "Apr 28, 2026" },
  { id: "SUPP-2026-000031", name: "Kahama Cooperative", contact: "+255 768 220 110", email: "ops@kahamacoop.tz", location: "Shinyanga · Kahama", totalSupplied_g: 9_640, totalPaid: 686_440, outstanding: 4_400, status: "active", joined: "May 21, 2024", lastDelivery: "Apr 22, 2026" },
  { id: "SUPP-2026-000027", name: "Bulyanhulu Mining", contact: "+255 754 110 882", email: "logistics@bulyanhulu.tz", location: "Shinyanga", totalSupplied_g: 14_220, totalPaid: 1_012_400, outstanding: 0, status: "active", joined: "Jun 30, 2024", lastDelivery: "Apr 18, 2026" },
  { id: "SUPP-2026-000019", name: "Geita Independent Miners", contact: "+255 712 220 419", email: "geita.indi@gmail.com", location: "Geita Region", totalSupplied_g: 4_120, totalPaid: 292_120, outstanding: 1_900, status: "active", joined: "Sep 14, 2024", lastDelivery: "Apr 12, 2026" },
  { id: "SUPP-2026-000014", name: "Lake Victoria Refiners", contact: "+255 754 882 014", email: "info@lvrefiners.tz", location: "Mwanza", totalSupplied_g: 1_840, totalPaid: 130_900, outstanding: 0, status: "inactive", joined: "Dec 02, 2024", lastDelivery: "Feb 18, 2026" },
];

export const ANOMALIES = [
  { id: "AN-2218", txn: "TX-018340", reason: "Amount 2.8σ above category mean", severity: "info", time: "1 hr ago" },
  { id: "AN-2217", txn: "TX-018299", reason: "Possible duplicate within 24h", severity: "warning", time: "yesterday" },
  { id: "AN-2216", txn: "TX-018287", reason: "Single tx > $20k threshold", severity: "warning", time: "2 days ago" },
];
