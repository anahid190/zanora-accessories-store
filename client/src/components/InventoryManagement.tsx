import { AlertTriangle, Check, Package, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { products } from "@/data/products";
import { trpc } from "@/lib/trpc";

export default function InventoryManagement() {
  const utils = trpc.useUtils();
  const inventory = trpc.inventory.list.useQuery();
  const update = trpc.inventory.update.useMutation({ onSuccess: () => { toast.success("موجودی ذخیره شد"); utils.inventory.list.invalidate(); }, onError: (error) => toast.error(error.message) });
  const [drafts, setDrafts] = useState<Record<number, { stock: number; threshold: number }>>({});
  useEffect(() => { if (inventory.data) setDrafts(Object.fromEntries(inventory.data.map((item) => [item.productId, { stock: item.stock, threshold: item.lowStockThreshold }]))); }, [inventory.data]);
  if (inventory.isLoading) return <div className="admin-panel-state">در حال دریافت موجودی…</div>;
  if (inventory.isError) return <div className="admin-panel-state error">دریافت موجودی ممکن نشد. دوباره تلاش کنید.</div>;
  const items = inventory.data ?? [];
  return <section className="admin-panel management-wide"><div className="panel-heading"><div><h3>مدیریت موجودی انبار</h3><p>موجودی و آستانه هشدار هر محصول را مدیریت کنید.</p></div><button className="admin-refresh" onClick={() => inventory.refetch()}><RefreshCw size={15} /> بروزرسانی</button></div><div className="inventory-summary"><div><Package size={18} /><span>کل کالاها<strong>{items.length}</strong></span></div><div className="warning"><AlertTriangle size={18} /><span>نیازمند سفارش<strong>{items.filter((item) => item.stock <= item.lowStockThreshold).length}</strong></span></div></div><div className="inventory-management-list">{items.map((item) => { const product = products.find((candidate) => candidate.id === item.productId); const draft = drafts[item.productId] || { stock: item.stock, threshold: item.lowStockThreshold }; const isLow = draft.stock <= draft.threshold; return <div className="inventory-management-row" key={item.productId}><img src={product?.image} alt={item.productName} /><div className="inventory-product-name"><b>{item.productName}</b><small>{isLow ? "موجودی کم" : "موجودی مناسب"}</small></div><label>موجودی<input type="number" min="0" value={draft.stock} onChange={(event) => setDrafts((current) => ({ ...current, [item.productId]: { ...draft, stock: Number(event.target.value) } }))} /></label><label>آستانه هشدار<input type="number" min="0" value={draft.threshold} onChange={(event) => setDrafts((current) => ({ ...current, [item.productId]: { ...draft, threshold: Number(event.target.value) } }))} /></label><span className={`stock-state ${isLow ? "low" : "ok"}`}>{isLow ? <AlertTriangle size={14} /> : <Check size={14} />}{isLow ? "نیاز به تامین" : "مناسب"}</span><button className="save-small" disabled={update.isPending} onClick={() => update.mutate({ productId: item.productId, stock: Math.max(0, draft.stock), lowStockThreshold: Math.max(0, draft.threshold) })}>ذخیره</button></div>; })}</div></section>;
}
