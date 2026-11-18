import { AlertTriangle, BarChart3, Package, TrendingUp } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const money = (value: number) => `${new Intl.NumberFormat("fa-IR").format(value)} تومان`;

export default function SalesAnalytics() {
  const [days, setDays] = useState<7 | 30>(30);
  const report = trpc.reports.sales.useQuery({ days });
  if (report.isLoading) return <div className="admin-panel-state">در حال محاسبه گزارش‌ها…</div>;
  if (report.isError || !report.data) return <div className="admin-panel-state error">گزارش فروش در دسترس نیست.</div>;
  const { data } = report;
  const maxSales = Math.max(...data.dailySales.map((item) => item.sales), 1);
  return (
    <div className="analytics-stack">
      <section className="analytics-kpis">
        <article><div><span>فروش {days} روز اخیر</span><TrendingUp size={18} /></div><strong>{money(data.totalSales)}</strong><small>{data.orderCount} سفارش پرداخت‌شده</small></article>
        <article><div><span>میانگین ارزش سفارش</span><BarChart3 size={18} /></div><strong>{money(data.averageOrder)}</strong><small>بر اساس سفارش‌های موفق</small></article>
        <article><div><span>واحد موجودی</span><Package size={18} /></div><strong>{new Intl.NumberFormat("fa-IR").format(data.inventory.unitsInStock)}</strong><small>{data.inventory.totalProducts} محصول فعال</small></article>
        <article className={data.inventory.lowStockCount > 0 ? "attention" : ""}><div><span>هشدار موجودی</span><AlertTriangle size={18} /></div><strong>{data.inventory.lowStockCount}</strong><small>{data.inventory.outOfStockCount} محصول تمام‌شده</small></article>
      </section>
      <section className="admin-panel analytics-chart">
        <div className="panel-heading"><div><h3>روند فروش</h3><p>فروش روزانه سفارش‌های پرداخت‌شده</p></div><div className="period-toggle"><button className={days === 7 ? "active" : ""} onClick={() => setDays(7)}>۷ روز</button><button className={days === 30 ? "active" : ""} onClick={() => setDays(30)}>۳۰ روز</button></div></div>
        <div className="sales-bars">{data.dailySales.map((item) => <div className="sales-bar-item" key={item.date}><div className="sales-bar-track"><div className="sales-bar-fill" style={{ height: `${Math.max(4, (item.sales / maxSales) * 100)}%` }} title={money(item.sales)}></div></div><small>{item.label}</small></div>)}</div>
      </section>
      <section className="analytics-columns">
        <div className="admin-panel"><div className="panel-heading"><div><h3>پرفروش‌ترین محصولات</h3><p>بر اساس مبلغ فروش در بازه انتخاب‌شده</p></div></div><div className="analytics-list">{data.topProducts.length ? data.topProducts.map((item, index) => <div key={item.productId}><b>۰{index + 1}</b><span>{item.productName}<small>{item.quantity} عدد</small></span><strong>{money(item.revenue)}</strong></div>) : <div className="admin-panel-state">هنوز سفارش پرداخت‌شده‌ای ثبت نشده است.</div>}</div></div>
        <div className="admin-panel"><div className="panel-heading"><div><h3>تحلیل موجودی</h3><p>محصولات نزدیک به اتمام</p></div></div><div className="analytics-list">{data.inventory.lowStock.length ? data.inventory.lowStock.map((item) => <div key={item.productId}><AlertTriangle size={15} className="low-icon" /><span>{item.productName}<small>موجودی {item.stock} / آستانه {item.lowStockThreshold}</small></span><strong className={item.stock === 0 ? "out-of-stock" : ""}>{item.stock === 0 ? "تمام شده" : "نیاز به تامین"}</strong></div>) : <div className="admin-panel-state">همه محصولات موجودی مناسبی دارند.</div>}</div></div>
      </section>
    </div>
  );
}
