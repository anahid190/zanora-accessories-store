import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpLeft,
  ChevronDown,
  Filter,
  Heart,
  Instagram,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { categories, products, type Category, type Product } from "@/data/products";
import { useStore } from "@/contexts/StoreContext";

type PriceBand = "همه" | "تا ۱ میلیون" | "۱ تا ۲ میلیون" | "۲ تا ۳ میلیون" | "۳ میلیون به بالا";
type SortOption = "جدیدترین" | "ارزان‌ترین" | "گران‌ترین";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<Category>("همه");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [newsletter, setNewsletter] = useState("");
  const [liked, setLiked] = useState<number[]>([]);
  const [priceBand, setPriceBand] = useState<PriceBand>("همه");
  const [sortOption, setSortOption] = useState<SortOption>("جدیدترین");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { cartCount, addToCart: addProductToCart } = useStore();

  const filteredProducts = useMemo(
    () => {
      const matches = products.filter((product) => {
        const categoryMatch = activeCategory === "همه" || product.category === activeCategory;
        const priceMatch = priceBand === "همه" || (priceBand === "تا ۱ میلیون" && product.priceValue <= 1000000) || (priceBand === "۱ تا ۲ میلیون" && product.priceValue > 1000000 && product.priceValue <= 2000000) || (priceBand === "۲ تا ۳ میلیون" && product.priceValue > 2000000 && product.priceValue <= 3000000) || (priceBand === "۳ میلیون به بالا" && product.priceValue > 3000000);
        return categoryMatch && priceMatch;
      });
      return [...matches].sort((a, b) => sortOption === "ارزان‌ترین" ? a.priceValue - b.priceValue : sortOption === "گران‌ترین" ? b.priceValue - a.priceValue : a.id - b.id);
    },
    [activeCategory, priceBand, sortOption],
  );

  const addToCart = (product: Product) => {
    addProductToCart(product);
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
          <a className="bag-button" href="/cart" aria-label="سبد خرید"><ShoppingBag size={20} /><span>{cartCount}</span></a>
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
          <div className="section-heading products-heading"><div><p className="eyebrow"><span></span> انتخاب سردبیر</p><h2>محبوب‌های <em>Zanora</em></h2></div><div className="filter-actions"><button className="advanced-filter-trigger" onClick={() => setFiltersOpen((value) => !value)}><Filter size={15} /> فیلتر پیشرفته <ChevronDown size={14} className={filtersOpen ? "rotated" : ""} /></button><span className="result-count">{filteredProducts.length} محصول</span></div></div>
          <div className={`advanced-filter-panel ${filtersOpen ? "open" : ""}`}><div className="filter-group"><span>دسته‌بندی</span><div className="filter-pills"><button className={activeCategory === "همه" ? "active" : ""} onClick={() => setActiveCategory("همه")}>همه <small>{products.length}</small></button>{categories.map((category) => <button key={category.label} className={activeCategory === category.label ? "active" : ""} onClick={() => setActiveCategory(category.label)}>{category.label} <small>{products.filter((product) => product.category === category.label).length}</small></button>)}</div></div><div className="filter-group"><span>بازه قیمت</span><div className="filter-pills">{(["همه", "تا ۱ میلیون", "۱ تا ۲ میلیون", "۲ تا ۳ میلیون", "۳ میلیون به بالا"] as PriceBand[]).map((band) => <button key={band} className={priceBand === band ? "active" : ""} onClick={() => setPriceBand(band)}>{band}</button>)}</div></div><label className="sort-control">مرتب‌سازی <select value={sortOption} onChange={(event) => setSortOption(event.target.value as SortOption)}><option>جدیدترین</option><option>ارزان‌ترین</option><option>گران‌ترین</option></select><ChevronDown size={13} /></label></div>
          <div className="product-grid">{filteredProducts.map((product) => <article className="product-card" key={product.id}><div className="product-image"><a href={`/product/${product.id}`} aria-label={`مشاهده ${product.name}`}><img src={product.image} alt={product.name} /></a>{product.badge && <span className="product-badge">{product.badge}</span>}<button className={`heart-button ${liked.includes(product.id) ? "liked" : ""}`} onClick={() => setLiked((items) => items.includes(product.id) ? items.filter((id) => id !== product.id) : [...items, product.id])} aria-label="افزودن به علاقه‌مندی‌ها"><Heart size={18} fill={liked.includes(product.id) ? "currentColor" : "none"} /></button></div><a className="product-info product-info-link" href={`/product/${product.id}`}><div><h3>{product.name}</h3><p>{product.category}</p></div><strong>{product.price}</strong></a><button className="add-button" onClick={() => addToCart(product)}>افزودن به سبد <ArrowLeft size={16} /></button></article>)}</div>
        </section>

        <section className="story-section" id="story"><div className="story-inner container"><div className="story-mark">Z</div><div className="story-content"><p className="eyebrow light"><span></span> فلسفه Zanora</p><h2>زیبایی، وقتی معنا دارد<br /><em>که شبیه تو باشد.</em></h2><p>ما باور داریم اکسسوری قرار نیست تو را تغییر دهد؛ قرار است آن بخش از تو را که از قبل درخشان است، قاب بگیرد. هر قطعه Zanora با دقت انتخاب شده تا سال‌ها کنار تو بماند.</p><a href="#footer" className="outline-button">بیشتر درباره ما <ArrowLeft size={17} /></a></div><div className="story-stats"><div><strong>۰۱</strong><span>ساخت<br />با دقت</span></div><div><strong>۰۲</strong><span>استایل<br />بی‌زمان</span></div><div><strong>۰۳</strong><span>برای<br />تو</span></div></div></div></section>

        <section className="newsletter-section container" id="journal"><div><p className="eyebrow"><span></span> نامه‌های Zanora</p><h2>چیزهای زیبا را<br /><em>زودتر بشنو.</em></h2></div><div className="newsletter-copy"><p>برای دریافت تازه‌ترین کالکشن‌ها، داستان‌های پشت هر قطعه و پیشنهادهای اختصاصی ایمیلت را وارد کن.</p><form onSubmit={submitNewsletter}><input value={newsletter} onChange={(event) => setNewsletter(event.target.value)} type="email" placeholder="ایمیل تو" aria-label="ایمیل تو" required /><button type="submit"><ArrowLeft size={19} /></button></form><small>با عضویت، با سیاست حریم خصوصی ما موافقت می‌کنی.</small></div></section>
      </main>

      <footer className="site-footer" id="footer"><div className="footer-top container"><div className="footer-brand"><a className="wordmark" href="#top"><span>Z</span>anora</a><p>جزئیات کوچک برای<br />روزهای بزرگ تو.</p><div className="socials"><a href="#instagram" aria-label="اینستاگرام"><Instagram size={17} /></a><a href="#pinterest" aria-label="پینترست">P</a><a href="#telegram" aria-label="تلگرام">ت</a></div></div><div className="footer-col"><h4>خرید</h4><a href="#products">تازه‌ها</a><a href="#products">پرفروش‌ها</a><a href="#categories">همه اکسسوری‌ها</a><a href="#products">هدیه‌ها</a></div><div className="footer-col"><h4>کمک</h4><a href="#shipping">راهنمای ارسال</a><a href="#returns">تعویض و مرجوعی</a><a href="#faq">سوالات متداول</a><a href="#contact">تماس با ما</a></div><div className="footer-contact"><h4>در تماس باشیم</h4><p>شنبه تا پنجشنبه، ۹ تا ۱۸</p><a href="mailto:hello@zanora.ir">hello@zanora.ir</a><a href="tel:+982112345678">۰۲۱ ۱۲۳۴ ۵۶۷۸</a><a href="/admin">ورود مدیر فروشگاه</a></div></div><div className="footer-bottom container"><span>© ۱۴۰۵ Zanora. تمام حقوق محفوظ است.</span><span>ساخته‌شده با عشق در تهران <span className="gold-dot">●</span></span><button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>بازگشت به بالا ↑</button></div></footer>
    </div>
  );
}
