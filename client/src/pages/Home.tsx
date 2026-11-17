import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpLeft,
  ChevronDown,
  Heart,
  Instagram,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

type Category = "همه" | "گوشواره" | "گردنبند" | "دستبند" | "کیف";

type Product = {
  id: number;
  name: string;
  category: Exclude<Category, "همه">;
  price: string;
  image: string;
  badge?: string;
};

const products: Product[] = [
  { id: 1, name: "گوشواره هلال طلایی", category: "گوشواره", price: "۱٬۲۸۰٬۰۰۰ تومان", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85", badge: "تازه رسیده" },
  { id: 2, name: "گردنبند مروارید ساتین", category: "گردنبند", price: "۱٬۸۹۰٬۰۰۰ تومان", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85" },
  { id: 3, name: "کیف دستی لونا", category: "کیف", price: "۳٬۴۵۰٬۰۰۰ تومان", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85", badge: "پرفروش" },
  { id: 4, name: "دستبند مروارید و طلا", category: "دستبند", price: "۹۸۰٬۰۰۰ تومان", image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=85" },
  { id: 5, name: "گوشواره قطره نور", category: "گوشواره", price: "۱٬۴۵۰٬۰۰۰ تومان", image: "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=900&q=85" },
  { id: 6, name: "کیف شانه‌ای نوا", category: "کیف", price: "۲٬۸۵۰٬۰۰۰ تومان", image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=900&q=85" },
];

const categories: { label: Category; count: string; image: string }[] = [
  { label: "گوشواره", count: "۲۴ محصول", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=700&q=85" },
  { label: "گردنبند", count: "۱۸ محصول", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=700&q=85" },
  { label: "دستبند", count: "۱۶ محصول", image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=700&q=85" },
  { label: "کیف", count: "۱۲ محصول", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=85" },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<Category>("همه");
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [newsletter, setNewsletter] = useState("");
  const [liked, setLiked] = useState<number[]>([]);

  const filteredProducts = useMemo(
    () => activeCategory === "همه" ? products : products.filter((product) => product.category === activeCategory),
    [activeCategory],
  );

  const addToCart = (product: Product) => {
    setCartCount((count) => count + 1);
    toast.success(`${product.name} به سبد اضافه شد`, { description: "برای تکمیل خرید، سبد خرید را باز کنید." });
  };

  const submitNewsletter = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newsletter.trim()) return;
    toast.success("عضویت شما ثبت شد", { description: "به جمع دوستداران Zanora خوش آمدید." });
    setNewsletter("");
  };

  return (
    <div className="site-shell" dir="rtl">
      <div className="announcement"><Sparkles size={14} /> ارسال رایگان برای سفارش‌های بالای ۲ میلیون تومان <span>•</span> پرداخت امن و ضمانت اصالت</div>
      <header className="site-header container">
        <button className="icon-button mobile-only" aria-label="باز کردن منو" onClick={() => setMobileMenu(true)}><Menu size={22} /></button>
        <nav className={`main-nav ${mobileMenu ? "is-open" : ""}`}>
          <button className="icon-button close-menu mobile-only" onClick={() => setMobileMenu(false)} aria-label="بستن منو"><X size={22} /></button>
          <a href="#new" onClick={() => setMobileMenu(false)}>تازه‌ها</a>
          <a href="#categories" onClick={() => setMobileMenu(false)}>دسته‌بندی‌ها</a>
          <a href="#story" onClick={() => setMobileMenu(false)}>داستان ما</a>
          <a href="#journal" onClick={() => setMobileMenu(false)}>مجله Zanora</a>
        </nav>
        <a className="wordmark" href="#top" aria-label="Zanora"><span>Z</span>anora</a>
        <div className="header-actions">
          <button className="icon-button desktop-only" aria-label="جستجو"><Search size={20} /></button>
          <button className="bag-button" aria-label="سبد خرید"><ShoppingBag size={20} /><span>{cartCount}</span></button>
        </div>
      </header>

      <main id="top">
        <section className="hero container" id="new">
          <div className="hero-copy">
            <p className="eyebrow"><span></span> کالکشن پاییز / زمستان ۱۴۰۵</p>
            <h1>جزئیات کوچک،<br /><em>تأثیر بزرگ.</em></h1>
            <p className="hero-text">اکسسوری‌هایی برای لحظه‌هایی که می‌خواهی خودت باشی؛ آرام، درخشان و بی‌تکرار.</p>
            <div className="hero-cta"><a href="#products" className="primary-button">دیدن کالکشن <ArrowLeft size={18} /></a><a href="#story" className="text-link">چرا Zanora؟ <ArrowUpLeft size={16} /></a></div>
            <div className="hero-note"><strong>01</strong><span></span><p>طراحی‌شده برای<br />هر روز تو</p></div>
          </div>
          <div className="hero-visual">
            <div className="hero-image" role="img" aria-label="اکسسوری‌های طلایی و مرواریدی Zanora" />
            <div className="hero-stamp"><span>EST.</span><strong>۱۴۰۲</strong><span>TEHRAN</span></div>
          </div>
        </section>

        <section className="category-section container" id="categories">
          <div className="section-heading"><div><p className="eyebrow"><span></span> انتخاب تو</p><h2>برای هر <em>استایل</em>، یک جزئیات</h2></div><a className="text-link" href="#products">همه محصولات <ArrowLeft size={16} /></a></div>
          <div className="category-grid">{categories.map((category, index) => <button className="category-card" key={category.label} onClick={() => { setActiveCategory(category.label); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }}><img src={category.image} alt={category.label} /><div className="category-overlay"><span>0{index + 1}</span><div><h3>{category.label}</h3><small>{category.count}</small></div><ArrowUpLeft size={20} /></div></button>)}</div>
        </section>

        <section className="products-section container" id="products">
          <div className="section-heading products-heading"><div><p className="eyebrow"><span></span> انتخاب سردبیر</p><h2>محبوب‌های <em>Zanora</em></h2></div><div className="filter-row"><button className={activeCategory === "همه" ? "active" : ""} onClick={() => setActiveCategory("همه")}>همه</button>{categories.map((category) => <button key={category.label} className={activeCategory === category.label ? "active" : ""} onClick={() => setActiveCategory(category.label)}>{category.label}</button>)}</div></div>
          <div className="product-grid">{filteredProducts.map((product) => <article className="product-card" key={product.id}><div className="product-image"><img src={product.image} alt={product.name} />{product.badge && <span className="product-badge">{product.badge}</span>}<button className={`heart-button ${liked.includes(product.id) ? "liked" : ""}`} onClick={() => setLiked((items) => items.includes(product.id) ? items.filter((id) => id !== product.id) : [...items, product.id])} aria-label="افزودن به علاقه‌مندی‌ها"><Heart size={18} fill={liked.includes(product.id) ? "currentColor" : "none"} /></button></div><div className="product-info"><div><h3>{product.name}</h3><p>{product.category}</p></div><strong>{product.price}</strong></div><button className="add-button" onClick={() => addToCart(product)}>افزودن به سبد <ArrowLeft size={16} /></button></article>)}</div>
        </section>

        <section className="story-section" id="story"><div className="story-inner container"><div className="story-mark">Z</div><div className="story-content"><p className="eyebrow light"><span></span> فلسفه Zanora</p><h2>زیبایی، وقتی معنا دارد<br /><em>که شبیه تو باشد.</em></h2><p>ما باور داریم اکسسوری قرار نیست تو را تغییر دهد؛ قرار است آن بخش از تو را که از قبل درخشان است، قاب بگیرد. هر قطعه Zanora با دقت انتخاب شده تا سال‌ها کنار تو بماند.</p><a href="#footer" className="outline-button">بیشتر درباره ما <ArrowLeft size={17} /></a></div><div className="story-stats"><div><strong>۰۱</strong><span>ساخت<br />با دقت</span></div><div><strong>۰۲</strong><span>استایل<br />بی‌زمان</span></div><div><strong>۰۳</strong><span>برای<br />تو</span></div></div></div></section>

        <section className="newsletter-section container" id="journal"><div><p className="eyebrow"><span></span> نامه‌های Zanora</p><h2>چیزهای زیبا را<br /><em>زودتر بشنو.</em></h2></div><div className="newsletter-copy"><p>برای دریافت تازه‌ترین کالکشن‌ها، داستان‌های پشت هر قطعه و پیشنهادهای اختصاصی ایمیلت را وارد کن.</p><form onSubmit={submitNewsletter}><input value={newsletter} onChange={(event) => setNewsletter(event.target.value)} type="email" placeholder="ایمیل تو" aria-label="ایمیل تو" required /><button type="submit"><ArrowLeft size={19} /></button></form><small>با عضویت، با سیاست حریم خصوصی ما موافقت می‌کنی.</small></div></section>
      </main>

      <footer className="site-footer" id="footer"><div className="footer-top container"><div className="footer-brand"><a className="wordmark" href="#top"><span>Z</span>anora</a><p>جزئیات کوچک برای<br />روزهای بزرگ تو.</p><div className="socials"><a href="#instagram" aria-label="اینستاگرام"><Instagram size={17} /></a><a href="#pinterest" aria-label="پینترست">P</a><a href="#telegram" aria-label="تلگرام">ت</a></div></div><div className="footer-col"><h4>خرید</h4><a href="#products">تازه‌ها</a><a href="#products">پرفروش‌ها</a><a href="#categories">همه اکسسوری‌ها</a><a href="#products">هدیه‌ها</a></div><div className="footer-col"><h4>کمک</h4><a href="#shipping">راهنمای ارسال</a><a href="#returns">تعویض و مرجوعی</a><a href="#faq">سوالات متداول</a><a href="#contact">تماس با ما</a></div><div className="footer-contact"><h4>در تماس باشیم</h4><p>شنبه تا پنجشنبه، ۹ تا ۱۸</p><a href="mailto:hello@zanora.ir">hello@zanora.ir</a><a href="tel:+982112345678">۰۲۱ ۱۲۳۴ ۵۶۷۸</a></div></div><div className="footer-bottom container"><span>© ۱۴۰۵ Zanora. تمام حقوق محفوظ است.</span><span>ساخته‌شده با عشق در تهران <span className="gold-dot">●</span></span><button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>بازگشت به بالا ↑</button></div></footer>
    </div>
  );
}
