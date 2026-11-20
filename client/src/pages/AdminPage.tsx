import { BarChart3, Bell, ChevronLeft, LayoutDashboard, LogIn, LogOut, Package, Settings, ShoppingBag, Tag, Users, Warehouse } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import InventoryManagement from "@/components/InventoryManagement";
import DiscountManagement from "@/components/DiscountManagement";
import SalesAnalytics from "@/components/SalesAnalytics";
import AdminOverview from "@/components/AdminOverview";
import AdminOrders from "@/components/AdminOrders";
import AdminProducts from "@/components/AdminProducts";

const navItems = [{ icon: LayoutDashboard, label: "نمای کلی" }, { icon: ShoppingBag, label: "سفارش‌ها" }, { icon: Package, label: "محصولات" }, { icon: Warehouse, label: "موجودی" }, { icon: Tag, label: "تخفیف‌ها" }, { icon: Users, label: "مشتری‌ها" }, { icon: BarChart3, label: "گزارش‌ها" }];
function AuthGate({ denied = false }: { denied?: boolean }) { return <div className="admin-auth-gate" dir="rtl"><div className="admin-auth-mark">Z</div><p className="eyebrow"><span /> فضای مدیریت Zanora</p><h1>{denied ? "دسترسی محدود است" : "ورود مدیر فروشگاه"}</h1><p>{denied ? "این حساب دسترسی مدیر ندارد. با حساب مالک پروژه وارد شوید یا از مدیر درخواست دسترسی کنید." : "برای مشاهده سفارش‌ها، فروش و موجودی، با حساب Manus خود وارد شوید."}</p>{!denied && <button className="admin-primary" onClick={startLogin}><LogIn size={17} /> ورود امن با Manus</button>}<a href="/">بازگشت به فروشگاه</a></div>; }

export default function AdminPage() {
  const me = trpc.auth.me.useQuery(); const access = trpc.admin.dashboard.useQuery(undefined, { enabled: me.data?.role === "admin" }); const logout = trpc.auth.logout.useMutation({ onSuccess: () => { window.location.href = "/"; } }); const [active, setActive] = useState("نمای کلی");
  if (me.isLoading || access.isLoading) return <div className="admin-loading" dir="rtl">در حال بررسی دسترسی مدیر…</div>; if (!me.data) return <AuthGate />; if (me.data.role !== "admin" || access.isError) return <AuthGate denied />;
  const content = active === "سفارش‌ها" ? <AdminOrders /> : active === "محصولات" ? <AdminProducts /> : active === "موجودی" ? <InventoryManagement /> : active === "تخفیف‌ها" ? <DiscountManagement /> : active === "گزارش‌ها" ? <SalesAnalytics /> : <AdminOverview />;
  return <div className="admin-shell" dir="rtl"><aside className="admin-sidebar"><a className="wordmark admin-logo" href="/"><span>Z</span>anora</a><div className="admin-profile"><div>{me.data.name?.slice(0, 1) || "م"}</div><span><b>{me.data.name || "مدیر فروشگاه"}</b><small>{me.data.email || "حساب Manus"}</small></span></div><nav>{navItems.map(({ icon: Icon, label }) => <button key={label} className={active === label ? "active" : ""} onClick={() => setActive(label)}><Icon size={18} />{label}</button>)}</nav><div className="admin-nav-bottom"><button><Settings size={18} /> تنظیمات</button><button onClick={() => logout.mutate()}><LogOut size={18} /> خروج</button></div></aside><main className="admin-main"><header className="admin-topbar"><div><p>{new Intl.DateTimeFormat("fa-IR", { dateStyle: "full" }).format(new Date())}</p><h1>سلام، {me.data.name || "مدیر"} <span>✦</span></h1></div><div className="admin-top-actions"><button><Bell size={19} /></button><a href="/" className="view-store">مشاهده فروشگاه <ChevronLeft size={15} /></a></div></header><div className="admin-content"><div className="admin-heading"><div><h2>{active}</h2><p>{active === "محصولات" ? "افزودن، ویرایش، آرشیو و مدیریت گالری کاتالوگ." : active === "موجودی" ? "کنترل موجودی، رزرو، آستانه هشدار و تامین کالا." : active === "تخفیف‌ها" ? "کدهای تخفیف و پیشنهادهای فروش را مدیریت کنید." : active === "گزارش‌ها" ? "تحلیل فروش و سلامت موجودی بر اساس داده‌های واقعی." : "داده‌های واقعی فروشگاه و عملکرد ماه جاری."}</p></div>{active === "نمای کلی" && <a className="admin-primary" href="/admin?tab=products"><Package size={16} /> مدیریت کاتالوگ</a>}</div>{content}</div></main></div>;
}
