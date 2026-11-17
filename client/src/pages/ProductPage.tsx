import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, Heart, Instagram, Minus, Plus, ShoppingBag, Truck } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

const products = [
  { id: 1, name: "گوشواره هلال طلایی", category: "گوشواره", price: "۱٬۲۸۰٬۰۰۰ تومان", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1100&q=90", badge: "تازه رسیده", description: "خطوط نرم و فرم هلالی این گوشواره، درخشش آرامی به استایل روزمره‌ات می‌دهد. یک قطعه سبک و بی‌زمان برای تمام ساعت‌های روز." },
  { id: 2, name: "گردنبند مروارید ساتین", category: "گردنبند", price: "۱٬۸۹۰٬۰۰۰ تومان", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1100&q=90", description: "مرواریدهای طبیعی با زنجیری ظریف و درخشش ساتین؛ انتخابی که با هر یقه و هر حال‌وهوایی همراه می‌شود." },
  { id: 3, name: "کیف دستی لونا", category: "کیف", price: "۳٬۴۵۰٬۰۰۰ تومان", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1100&q=90", badge: "پرفروش", description: "کیفی جمع‌وجور با ساختاری دقیق، برای روزهایی که می‌خواهی همه‌چیز را ساده و شیک با خودت داشته باشی." },
  { id: 4, name: "دستبند مروارید و طلا", category: "دستبند", price: "۹۸۰٬۰۰۰ تومان", image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1100&q=90", description: "ترکیبی ظریف از مرواریدهای کوچک و جزئیات طلایی که به‌تنهایی زیباست و کنار ساعت هم به‌خوبی می‌نشیند." },
  { id: 5, name: "گوشواره قطره نور", category: "گوشواره", price: "۱٬۴۵۰٬۰۰۰ تومان", image: "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=1100&q=90", description: "فرم قطره‌ای و بازی نور روی سطح صیقلی، این گوشواره را به انتخابی چشمگیر برای شب‌های خاص تبدیل کرده است." },
  { id: 6, name: "کیف شانه‌ای نوا", category: "کیف", price: "۲٬۸۵۰٬۰۰۰ تومان", image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=1100&q=90", description: "کیف شانه‌ای نوا با فرم نرم و بند قابل تنظیم، همراهی کاربردی برای روزهای پررفت‌وآمد توست." },
];

export default function ProductPage() {
  const [, params] = useRoute("/product/:id");
  const [, setLocation] = useLocation();
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);
  const [activeThumb, setActiveThumb] = useState(0);
  const [openInfo, setOpenInfo] = useState<string | null>("جزئیات محصول");
  const product = useMemo(() => products.find((item) => item.id === Number(params?.id)), [params?.id]);

  useEffect(() => {
    if (!product) setLocation("/404");
  }, [product, setLocation]);

  if (!product) {
    return null;
  }

  const thumbs = [product.image, product.image.replace("w=1100", "w=700"), product.image.replace("w=1100", "w=900")];
  const addToCart = () => toast.success(`${quantity} عدد ${product.name} به سبد اضافه شد`, { description: "برای تکمیل خرید، سبد خرید را باز کنید." });

  return (
    <div className="site-shell product-page" dir="rtl">
      <div className="announcement"><span>✦</span> ارسال رایگان برای سفارش‌های بالای ۲ میلیون تومان <span>•</span> پرداخت امن و ضمانت اصالت</div>
      <header className="site-header container product-header">
        <a className="back-link" href="/" aria-label="بازگشت به فروشگاه"><ArrowRight size={18} /> بازگشت به فروشگاه</a>
        <a className="wordmark" href="/" aria-label="Zanora"><span>Z</span>anora</a>
        <button className="bag-button" aria-label="سبد خرید"><ShoppingBag size={20} /><span>۰</span></button>
      </header>

      <main className="container product-main">
        <div className="breadcrumbs"><a href="/">خانه</a><span>/</span><a href={`/?category=${encodeURIComponent(product.category)}`}>{product.category}</a><span>/</span><strong>{product.name}</strong></div>
        <div className="product-detail-grid">
          <section className="detail-gallery"><div className="detail-main-image"><img src={thumbs[activeThumb]} alt={product.name} />{product.badge && <span className="product-badge">{product.badge}</span>}<button className={`detail-heart ${liked ? "liked" : ""}`} onClick={() => setLiked((value) => !value)} aria-label="افزودن به علاقه‌مندی‌ها"><Heart size={20} fill={liked ? "currentColor" : "none"} /></button></div><div className="thumb-row">{thumbs.map((thumb, index) => <button key={`${thumb}-${index}`} className={activeThumb === index ? "active" : ""} onClick={() => setActiveThumb(index)}><img src={thumb} alt={`${product.name} نمای ${index + 1}`} /></button>)}</div></section>
          <section className="detail-copy"><p className="eyebrow"><span></span> {product.category} / کالکشن ۱۴۰۵</p><h1>{product.name}</h1><div className="detail-rating"><span>★★★★★</span><small>۴.۹ / ۵ (۱۲ نظر)</small></div><div className="detail-price">{product.price}</div><p className="detail-description">{product.description}</p><div className="detail-divider" />
            <div className="option-row"><span>رنگ</span><div className="color-options"><button className="color-swatch gold active" aria-label="طلایی" /><button className="color-swatch silver" aria-label="نقره‌ای" /></div></div>
            <div className="purchase-row"><div className="quantity-control"><button onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="کم کردن"><Minus size={15} /></button><span>{quantity}</span><button onClick={() => setQuantity((value) => value + 1)} aria-label="زیاد کردن"><Plus size={15} /></button></div><button className="detail-add-button" onClick={addToCart}>افزودن به سبد <ShoppingBag size={17} /></button></div>
            <div className="delivery-note"><Truck size={19} /><div><strong>ارسال رایگان و سریع</strong><span>تحویل در تهران ۱ تا ۲ روز کاری · سایر شهرها ۲ تا ۴ روز کاری</span></div></div>
            <div className="info-accordions">{["جزئیات محصول", "ارسال و مرجوعی", "بسته‌بندی هدیه"].map((title) => <div className="info-item" key={title}><button onClick={() => setOpenInfo(openInfo === title ? null : title)}><span>{title}</span><ChevronDown size={16} className={openInfo === title ? "rotated" : ""} /></button>{openInfo === title && <p>{title === "جزئیات محصول" ? "ساخته‌شده از آلیاژ ضدحساسیت با آبکاری طلای ۱۸ عیار. مناسب استفاده روزانه و بدون نیکل." : title === "ارسال و مرجوعی" ? "تا ۷ روز پس از تحویل، امکان تعویض کالاهای استفاده‌نشده وجود دارد." : "سفارش تو در جعبه اختصاصی Zanora و با کارت دست‌نویس بسته‌بندی می‌شود."}</p>}</div>)}</div>
          </section>
        </div>
      </main>
      <footer className="site-footer compact-footer"><div className="footer-bottom container"><span>© ۱۴۰۵ Zanora. تمام حقوق محفوظ است.</span><span>ساخته‌شده با عشق در تهران <span className="gold-dot">●</span></span><a href="/">بازگشت به فروشگاه <ArrowLeft size={13} /></a></div></footer>
    </div>
  );
}
