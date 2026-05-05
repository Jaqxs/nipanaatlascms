"use client";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
  ReferenceArea, Legend, ComposedChart,
} from "recharts";
import { SALES_VS_EXPENSES, PROFIT_TREND, STOCK_BY_PURITY, CASH_FLOW } from "../lib/mockData";

const tickStyle = { fontSize: 11, fill: "#8a7e6c" };
const gridStroke = "#ece2cf";

const tooltipStyle = {
  contentStyle: {
    background: "#fffdf6",
    border: "1px solid #e8dfcf",
    borderRadius: 10,
    boxShadow: "0 12px 32px -18px rgba(58,49,39,0.22)",
    fontFamily: "Inter",
    fontSize: 12,
    color: "#1f1a14",
    padding: "10px 12px",
  },
  cursor: { fill: "rgba(220, 179, 90, 0.08)" },
  labelStyle: { color: "#8a7e6c", fontWeight: 600, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 },
  itemStyle: { padding: "2px 0" },
};

const tip$ = (v: number) => `$${v.toLocaleString()}`;

export function SalesVsExpensesChart() {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer>
        <BarChart data={SALES_VS_EXPENSES} barCategoryGap={18} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid stroke={gridStroke} strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="day" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} width={48} />
          <Tooltip {...tooltipStyle} formatter={(v: number) => tip$(v)} />
          <Bar dataKey="sales" fill="#b8893d" radius={[6, 6, 0, 0]} name="Sales" animationDuration={700} />
          <Bar dataKey="expenses" fill="#c89b62" fillOpacity={0.55} radius={[6, 6, 0, 0]} name="Expenses" animationDuration={900} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProfitTrendChart({ className = "h-[200px]" }: { className?: string } = {}) {
  const forecastStart = PROFIT_TREND.findIndex((p) => p.forecast !== null);
  const todayDay = forecastStart > 0 ? PROFIT_TREND[forecastStart - 1].day : null;
  const peak = PROFIT_TREND.reduce((a, b) => (b.profit > a.profit ? b : a), PROFIT_TREND[0]);
  const last = PROFIT_TREND[PROFIT_TREND.length - 1];

  return (
    <div className={`${className} w-full relative`}>
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2 text-[11px]">
        <div className="surface-flat px-2.5 py-1 inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
          <span className="text-ink-muted">Confirmed</span>
        </div>
        <div className="surface-flat px-2.5 py-1 inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#dcb35a", outline: "1px dashed #b8893d" }} />
          <span className="text-ink-muted">AI Forecast</span>
        </div>
      </div>

      <ResponsiveContainer>
        <ComposedChart data={PROFIT_TREND} margin={{ top: 28, right: 16, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="profitArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b8893d" stopOpacity={0.42} />
              <stop offset="100%" stopColor="#b8893d" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dcb35a" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#dcb35a" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke={gridStroke} strokeDasharray="2 4" vertical={false} />

          {todayDay !== null && (
            <ReferenceArea x1={todayDay} x2={last.day} fill="#fdf6e4" fillOpacity={0.55} stroke="#f4e2b3" strokeDasharray="3 3" />
          )}

          <XAxis dataKey="day" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} width={48} />

          <Tooltip {...tooltipStyle} formatter={(v: number, n: string) => [tip$(v), n]} />

          <Area type="monotone" dataKey="profit" stroke="none" fill="url(#profitArea)" name="Confirmed" animationDuration={800} />
          <Line type="monotone" dataKey="profit" stroke="#7a571c" strokeWidth={2.4} dot={false}
            activeDot={{ r: 5, fill: "#7a571c", stroke: "#fff", strokeWidth: 2 }}
            name="Confirmed" animationDuration={800} />

          <Area type="monotone" dataKey="forecast" stroke="none" fill="url(#forecastArea)" name="AI Forecast" animationDuration={1100} />
          <Line type="monotone" dataKey="forecast" stroke="#b8893d" strokeDasharray="5 4" strokeWidth={2.2} dot={false}
            activeDot={{ r: 5, fill: "#b8893d", stroke: "#fff", strokeWidth: 2 }}
            name="AI Forecast" animationDuration={1100} />

          <ReferenceLine
            x={peak.day}
            stroke="#7a8c6b"
            strokeDasharray="3 3"
          />

          {todayDay !== null && (
            <ReferenceLine
              x={todayDay}
              stroke="#b8893d"
              strokeWidth={1.5}
              label={{ value: "TODAY", position: "top", fill: "#7a571c", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em" }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StockByPurityChart({ size = "default" }: { size?: "default" | "large" } = {}) {
  const total = STOCK_BY_PURITY.reduce((a, b) => a + b.value, 0);
  const isLarge = size === "large";
  return (
    <div className={`${isLarge ? "h-[300px]" : "h-[220px]"} w-full relative`}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={STOCK_BY_PURITY}
            innerRadius={isLarge ? 78 : 56}
            outerRadius={isLarge ? 124 : 88}
            paddingAngle={3}
            dataKey="value"
            stroke="#ffffff"
            strokeWidth={2}
            animationDuration={700}
          >
            {STOCK_BY_PURITY.map((s, i) => <Cell key={i} fill={s.color} />)}
          </Pie>
          <Tooltip {...tooltipStyle} formatter={(v: number, n: string) => [`${v.toFixed(1)} g`, n]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className={`font-numeric ${isLarge ? "text-[32px]" : "text-[24px]"} text-ink leading-none`}>{total.toFixed(0)}g</div>
        <div className="text-[10px] text-ink-muted uppercase tracking-wider mt-1">total stock</div>
      </div>
    </div>
  );
}

export function CashFlowWaterfall() {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer>
        <BarChart data={CASH_FLOW} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid stroke={gridStroke} strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="week" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} width={48} />
          <Tooltip {...tooltipStyle} formatter={(v: number) => tip$(v)} />
          <Legend wrapperStyle={{ fontSize: 11, color: "#8a7e6c", paddingTop: 6 }} iconType="circle" />
          <Bar dataKey="inflow" name="Inflow" fill="#7a8c6b" radius={[6, 6, 0, 0]} animationDuration={700} />
          <Bar dataKey="outflow" name="Outflow" fill="#b56b4a" fillOpacity={0.85} radius={[6, 6, 0, 0]} animationDuration={900} />
          <ReferenceLine y={0} stroke="#d8cdb6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyRevenueProfitChart() {
  const data = [
    { m: "Jun", revenue: 142_800, profit: 38_400 },
    { m: "Jul", revenue: 165_300, profit: 44_900 },
    { m: "Aug", revenue: 178_600, profit: 49_200 },
    { m: "Sep", revenue: 156_400, profit: 42_700 },
    { m: "Oct", revenue: 184_900, profit: 56_100 },
    { m: "Nov", revenue: 211_300, profit: 64_800 },
    { m: "Dec", revenue: 198_400, profit: 58_200 },
    { m: "Jan", revenue: 224_100, profit: 71_400 },
    { m: "Feb", revenue: 241_800, profit: 79_900 },
    { m: "Mar", revenue: 268_300, profit: 84_500 },
    { m: "Apr", revenue: 312_600, profit: 102_300 },
    { m: "May", revenue: 248_400, profit: 85_600 },
  ];
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer>
        <BarChart data={data} barCategoryGap={14} margin={{ top: 12, right: 16, left: 4, bottom: 6 }}>
          <CartesianGrid stroke={gridStroke} strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="m" tick={tickStyle} axisLine={false} tickLine={false} interval={0} />
          <YAxis tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} width={48} />
          <Tooltip {...tooltipStyle} formatter={(v: number) => tip$(v)} />
          <Legend wrapperStyle={{ fontSize: 11, color: "#8a7e6c", paddingTop: 8 }} iconType="circle" />
          <Bar dataKey="revenue" name="Revenue" fill="#b8893d" radius={[5, 5, 0, 0]} animationDuration={700} />
          <Bar dataKey="profit" name="Net profit" fill="#7a8c6b" radius={[5, 5, 0, 0]} animationDuration={900} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReportRunsDonut() {
  const data = [
    { name: "Financial", value: 24, color: "#b8893d" },
    { name: "Operations", value: 12, color: "#dcb35a" },
    { name: "Inventory", value: 8, color: "#c89b62" },
    { name: "Audit", value: 6, color: "#7a8c6b" },
    { name: "Customers", value: 4, color: "#a85944" },
  ];
  const total = data.reduce((a, b) => a + b.value, 0);
  return (
    <div className="h-[260px] w-full relative">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            innerRadius={68}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            stroke="#ffffff"
            strokeWidth={2}
            animationDuration={700}
          >
            {data.map((s, i) => <Cell key={i} fill={s.color} />)}
          </Pie>
          <Tooltip {...tooltipStyle} formatter={(v: number, n: string) => [`${v} runs`, n]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="font-numeric text-[28px] text-ink leading-none">{total}</div>
        <div className="text-[11px] text-ink-muted uppercase tracking-wider mt-1">runs · 30d</div>
      </div>
    </div>
  );
}

export function InventoryAreaChart() {
  const data = Array.from({ length: 24 }).map((_, i) => ({
    t: `${i}h`,
    weight: 3800 + Math.sin(i / 2) * 400 + i * 12,
  }));
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dcb35a" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#dcb35a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={gridStroke} strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="t" tick={tickStyle} axisLine={false} tickLine={false} interval={3} />
          <YAxis tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}g`} width={44} />
          <Tooltip {...tooltipStyle} formatter={(v: number) => `${v.toFixed(1)} g`} />
          <Area type="monotone" dataKey="weight" stroke="#b8893d" strokeWidth={2} fill="url(#invGrad)" name="Stock weight"
            activeDot={{ r: 5, fill: "#b8893d", stroke: "#fff", strokeWidth: 2 }}
            animationDuration={700} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Mini sparkline for the gold price card
export function GoldPriceSparkline({ data }: { data: number[] }) {
  const arr = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-[60px] w-full">
      <ResponsiveContainer>
        <AreaChart data={arr} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b8893d" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#b8893d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            {...tooltipStyle}
            formatter={(v: number) => [`$${(v as number).toFixed(2)}`, "Price"]}
            labelFormatter={() => ""}
          />
          <Area type="monotone" dataKey="v" stroke="#b8893d" strokeWidth={2} fill="url(#sparkGrad)"
            activeDot={{ r: 4, fill: "#b8893d", stroke: "#fff", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
