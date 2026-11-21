import { useMemo, useState } from "react";
import { ArrowLeft, ArrowUpLeft, ChevronDown, Eye, Filter, Heart, Instagram, Menu, Search, ShoppingBag, Sparkles, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { categories, products, type Category, type Product } from "@/data/products";
import { useStore } from "@/contexts/StoreContext";
import { trpc } from "@/lib/trpc";

type PriceBand = "همه" | "تا ۱ میلیون" | "۱ تا ۲ میلیون" | "۲ تا ۳ میلیون" | "۳ میلیون به بالا";
type SortOption = "جدیدترین" | "ارزان‌ترین" | "گران‌ترین";

type StoreProduct = Product & { gallery?: string[]; isActive?: number };

function ProductCard({ product, onQuickView }: { product: StoreProduct; onQuickView: (product: StoreProduct) => void }) {
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const liked = wishlist.includes(product.id);
  return <article className="product-card">
    <div className="product-image">
      <a href={`/product/${product.id}`} aria-label={`مشاهده ${product.name}`}><img src={product.image} alt={product.name} loading="lazy" /></a>
      {product.badge && <span className="product-badge">{product.badge}</span>}
      <div className="product-card-tools"><button className={`heart-button ${liked ? "liked" : ""}`} onClick={() => toggleWishlist(product.id)} aria-label="افزودن به علاقه‌مندی‌ها"><Heart size={17} fill={liked ? "currentColor" : "none"} /></button><button className="quick-view-button" onClick={() => onQuickView(product)} aria-label="مشاهده سریع"><Eye size={16} /></button></div>
    </div>
    <a className="product-info product-info-link" href={`/product/${product.id}`}><div><h3>{product.name}</h3><p>{product.category}</p></div><strong>{product.price}</strong></a>
    <button className="add-button" onClick={() => { addToCart(product); toast.success(`${product.name} به سبد اضافه شد`); }}>افزودن به سبد <ArrowLeft size={16} /></button>
  </article>;
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<Category>("همه");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [megaMenu, setMegaMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newsletter, setNewsletter] = useState("");
  const [priceBand, setPriceBand] = useState<PriceBand>("همه");
  const [sortOption, setSortOption] = useState<SortOption>("جدیدترین");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quickView, setQuickView] = useState<StoreProduct | null>(null);
  const { cartCount, addToCart, wishlist } = useStore();
  const catalog = trpc.catalog.list.useQuery();
  const catalogProducts = useMemo<StoreProduct[]>(() => catalog.data?.length ? catalog.data.map((product) => ({ ...product, category: product.category as Exclude<Category, "همه">, badge: product.badge ?? undefined })) : products, [catalog.data]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    const matches = catalogProducts.filter((product) => {
      const categoryMatch = activeCategory === "همه" || product.category === activeCategory;
      const priceMatch = priceBand === "همه" || (priceBand === "تا ۱ میلیون" && product.priceValue <= 1000000) || (priceBand === "۱ تا ۲ میلیون" && product.priceValue > 1000000 && product.priceValue <= 2000000) || (priceBand === "۲ تا ۳ میلیون" && product.priceValue > 2000000 && product.priceValue <= 3000000) || (priceBand === "۳ میلیون به بالا" && product.priceValue > 3000000);
      const searchMatch = !query || product.name.toLocaleLowerCase().includes(query) || product.category.toLocaleLowerCase().includes(query);
      return categoryMatch && priceMatch && searchMatch;
    });
    return [...matches].sort((a, b) => sortOption === "ارزان‌ترین" ? a.priceValue - b.priceValue : sortOption === "گران‌ترین" ? b.priceValue - a.priceValue : a.id - b.id);
  }, [activeCategory, priceBand, sortOption, searchQuery, catalogProducts]);

  const addProduct = (product: StoreProduct) => { addToCart(product); toast.success(`${product.name} به سبد اضافه شد`, { description: "برای تکمیل خرید، سبد خرید را باز کنید." }); };
  const chooseCategory = (filter?: Category) => { setActiveCategory(filter || "همه"); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); setMegaMenu(false); setMobileMenu(false); };
  const submitNewsletter = (event: React.FormEvent) => { event.preventDefault(); if (!newsletter.trim()) return; toast.success("عضویت شما ثبت شد", { description: "به جمع دوستداران Zanora خوش آمدید." }); setNewsletter(""); };

  return <div className="site-shell" dir="rtl">
    <div className="announcement"><Sparkles size={14} /> ارسال رایگان برای سفارش‌های بالای ۲ میلیون تومان <span>•</span> پرداخت امن و ضمانت اصالت <span>•</span> بسته‌بندی هدیه برای هر سفارش</div>
    <header className="site-header container">
      <button className="icon-button mobile-only" aria-label="باز کردن منو" onClick={() => setMobileMenu(true)}><Menu size={22} /></button>
      <nav className={`main-nav ${mobileMenu ? "is-open" : ""}`}>
        <button className="icon-button close-menu mobile-only" onClick={() => setMobileMenu(false)} aria-label="بستن منو"><X size={22} /></button>
        <a href="#top" onClick={() => setMobileMenu(false)}>خانه</a>
        <button className={`nav-menu-trigger ${megaMenu ? "active" : ""}`} onClick={() => setMegaMenu((value) => !value)}>فروشگاه <ChevronDown size={13} /></button>
        <a href="#new-arrivals" onClick={() => setMobileMenu(false)}>تازه‌ها</a><a href="#best-sellers" onClick={() => setMobileMenu(false)}>پرفروش‌ها</a><a href="#categories" onClick={() => setMobileMenu(false)}>دسته‌بندی‌ها</a><a href="#gift-sets" onClick={() => setMobileMenu(false)}>ست‌های هدیه</a><a href="#sale" onClick={() => setMobileMenu(false)}>فروش ویژه</a>
      </nav>
      <a className="wordmark" href="#top" aria-label="Zanora"><span>Z</span>anora</a>
      <div className="header-actions"><button className="icon-button" onClick={() => setSearchOpen((value) => !value)} aria-label="جستجو"><Search size={20} /></button><a className="icon-button desktop-only" href="/account" aria-label="حساب کاربری"><UserRound size={19} /></a><a className="icon-button desktop-only" href="#wishlist" aria-label="علاقه‌مندی‌ها"><Heart size={19} fill={wishlist.length ? "currentColor" : "none"} /></a><a className="bag-button" href="/cart" aria-label="سبد خرید"><ShoppingBag size={20} /><span>{cartCount}</span></a></div>
      {megaMenu && <div className="mega-menu"><div><b>جواهرات</b><button onClick={() => chooseCategory("گردنبند")}>گردنبندها</button><button onClick={() => chooseCategory("گوشواره")}>گوشواره‌ها</button><button onClick={() => chooseCategory("دستبند")}>دستبندها</button><button onClick={() => chooseCategory()}>حلقه و ست جواهر</button></div><div><b>اکسسوری مو</b><button onClick={() => chooseCategory()}>کش و اسکرانچی</button><button onClick={() => chooseCategory()}>گیره و کلیپس</button><button onClick={() => chooseCategory()}>هدبندها</button><button onClick={() => chooseCategory()}>پاپیون و سنجاق</button></div><div><b>کیف و هدیه</b><button onClick={() => chooseCategory("کیف")}>کیف‌های زنانه</button><button onClick={() => chooseCategory()}>کیف پول و جاکارتی</button><button onClick={() => chooseCategory()}>مینی‌بگ</button><button onClick={() => chooseCategory()}>ست‌های هدیه</button></div><div className="mega-menu-note"><span>CURATED FOR YOU</span><strong>جزئیات کوچک،<br />تأثیر بزرگ.</strong><a href="#products">مشاهده کالکشن <ArrowLeft size={14} /></a></div></div>}
    </header>
    {searchOpen && <div className="search-drawer container"><Search size={18} /><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="جست‌وجوی گردنبند، کیف یا هدیه..." /><button onClick={() => { setSearchQuery(""); setSearchOpen(false); }} aria-label="بستن جستجو"><X size={18} /></button>{searchQuery && <div className="search-suggestions">{filteredProducts.slice(0, 5).map((product) => <a key={product.id} href={`/product/${product.id}`}><img src={product.image} alt="" /><span>{product.name}<small>{product.price}</small></span><ArrowLeft size={14} /></a>)}{!filteredProducts.length && <p>محصولی با این عبارت پیدا نشد.</p>}</div>}</div>}

    <main id="top">
      <section className="hero container" id="new"><div className="hero-copy"><p className="eyebrow"><span /> کالکشن پاییز / زمستان ۱۴۰۵</p><h1>جزئیات کوچک،<br /><em>تأثیر بزرگ.</em></h1><p className="hero-text">اکسسوری‌هایی برای لحظه‌هایی که می‌خواهی خودت باشی؛ آرام، درخشان و بی‌تکرار.</p><div className="hero-cta"><a href="#new-arrivals" className="primary-button">دیدن کالکشن <ArrowLeft size={18} /></a><a href="#story" className="text-link">چرا Zanora؟ <ArrowUpLeft size={16} /></a></div><div className="hero-note"><strong>01</strong><span /><p>طراحی‌شده برای<br />هر روز تو</p></div></div><div className="hero-visual"><div className="hero-image" role="img" aria-label="اکسسوری‌های طلایی و مرواریدی Zanora" /><div className="hero-stamp"><span>EST.</span><strong>۱۴۰۲</strong><span>TEHRAN</span></div></div></section>
      <section className="category-section container" id="categories"><div className="section-heading"><div><p className="eyebrow"><span /> انتخاب تو</p><h2>برای هر <em>استایل</em>، یک جزئیات</h2></div><a className="text-link" href="#products">همه محصولات <ArrowLeft size={16} /></a></div><div className="category-grid expanded-categories">{categories.map((category, index) => <button className="category-card" key={category.label} onClick={() => chooseCategory(category.filter)}><img src={category.image} alt={category.label} loading="lazy" /><div className="category-overlay"><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{category.label}</h3><small>{category.count}</small></div><ArrowUpLeft size={20} /></div></button>)}</div></section>
      <section className="collection-section container" id="new-arrivals"><div className="section-heading"><div><p className="eyebrow"><span /> تازه از Zanora</p><h2>تازه‌رسیده‌های <em>این فصل</em></h2></div><a className="text-link" href="#products">مشاهده همه <ArrowLeft size={16} /></a></div><div className="product-grid collection-grid">{catalogProducts.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} onQuickView={setQuickView} />)}</div></section>
      <section className="products-section container" id="products"><div className="section-heading products-heading"><div><p className="eyebrow"><span /> انتخاب سردبیر</p><h2>محبوب‌های <em>Zanora</em></h2></div><div className="filter-actions"><button className="advanced-filter-trigger" onClick={() => setFiltersOpen((value) => !value)}><Filter size={15} /> فیلتر و مرتب‌سازی <ChevronDown size={14} className={filtersOpen ? "rotated" : ""} /></button><span className="result-count">{filteredProducts.length} محصول</span></div></div><div className={`advanced-filter-panel ${filtersOpen ? "open" : ""}`}><div className="filter-group"><span>دسته‌بندی</span><div className="filter-pills"><button className={activeCategory === "همه" ? "active" : ""} onClick={() => setActiveCategory("همه")}>همه <small>{catalogProducts.length}</small></button>{(["گوشواره", "گردنبند", "دستبند", "کیف"] as Category[]).map((category) => <button key={category} className={activeCategory === category ? "active" : ""} onClick={() => setActiveCategory(category)}>{category} <small>{catalogProducts.filter((product) => product.category === category).length}</small></button>)}</div></div><div className="filter-group"><span>بازه قیمت</span><div className="filter-pills">{(["همه", "تا ۱ میلیون", "۱ تا ۲ میلیون", "۲ تا ۳ میلیون", "۳ میلیون به بالا"] as PriceBand[]).map((band) => <button key={band} className={priceBand === band ? "active" : ""} onClick={() => setPriceBand(band)}>{band}</button>)}</div></div><label className="sort-control">مرتب‌سازی <select value={sortOption} onChange={(event) => setSortOption(event.target.value as SortOption)}><option>جدیدترین</option><option>ارزان‌ترین</option><option>گران‌ترین</option></select><ChevronDown size={13} /></label></div><div className="product-grid">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} onQuickView={setQuickView} />)}</div></section>
      <section className="editorial-collections container" id="best-sellers"><div className="editorial-card editorial-jewelry"><span>01 / JEWELRY</span><h3>درخشش آرام<br /><em>هر روز تو</em></h3><a href="#products">دیدن جواهرات <ArrowLeft size={15} /></a></div><div className="editorial-card editorial-hair"><span>02 / HAIR ACCESSORIES</span><h3>موهایت را<br /><em>قاب بگیر</em></h3><a href="#categories">اکسسوری مو <ArrowLeft size={15} /></a></div><div className="editorial-card editorial-gift" id="gift-sets"><span>03 / GIFT EDIT</span><h3>هدیه‌ای با<br /><em>حس خوب</em></h3><a href="#newsletter">انتخاب هدیه <ArrowLeft size={15} /></a></div></section>
      <section className="story-section" id="story"><div className="story-inner container"><div className="story-mark">Z</div><div className="story-content"><p className="eyebrow light"><span /> فلسفه Zanora</p><h2>زیبایی، وقتی معنا دارد<br /><em>که شبیه تو باشد.</em></h2><p>ما باور داریم اکسسوری قرار نیست تو را تغییر دهد؛ قرار است آن بخش از تو را که از قبل درخشان است، قاب بگیرد.</p><a href="#footer" className="outline-button">بیشتر درباره ما <ArrowLeft size={17} /></a></div><div className="story-stats"><div><strong>۰۱</strong><span>ساخت<br />با دقت</span></div><div><strong>۰۲</strong><span>استایل<br />بی‌زمان</span></div><div><strong>۰۳</strong><span>برای<br />تو</span></div></div></div></section>
      <section className="newsletter-section container" id="newsletter"><div><p className="eyebrow"><span /> نامه‌های Zanora</p><h2>چیزهای زیبا را<br /><em>زودتر بشنو.</em></h2></div><div className="newsletter-copy"><p>برای دریافت تازه‌ترین کالکشن‌ها، داستان‌های پشت هر قطعه و پیشنهادهای اختصاصی ایمیلت را وارد کن.</p><form onSubmit={submitNewsletter}><input value={newsletter} onChange={(event) => setNewsletter(event.target.value)} type="email" placeholder="ایمیل تو" aria-label="ایمیل تو" required /><button type="submit"><ArrowLeft size={19} /></button></form><small>با عضویت، با سیاست حریم خصوصی ما موافقت می‌کنی.</small></div></section>
    </main>
    <footer className="site-footer" id="footer"><div className="footer-top container"><div className="footer-brand"><a className="wordmark" href="#top"><span>Z</span>anora</a><p>جزئیات کوچک برای<br />روزهای بزرگ تو.</p><div className="socials"><a href="#instagram" aria-label="اینستاگرام"><Instagram size={17} /></a><a href="#pinterest" aria-label="پینترست">P</a><a href="#telegram" aria-label="تلگرام">ت</a></div></div><div className="footer-col"><h4>خرید</h4><a href="#new-arrivals">تازه‌ها</a><a href="#best-sellers">پرفروش‌ها</a><a href="#categories">همه اکسسوری‌ها</a><a href="#gift-sets">هدیه‌ها</a></div><div className="footer-col"><h4>کمک</h4><a href="#shipping">راهنمای ارسال</a><a href="#returns">تعویض و مرجوعی</a><a href="#faq">سوالات متداول</a><a href="#contact">تماس با ما</a></div><div className="footer-contact"><h4>در تماس باشیم</h4><p>شنبه تا پنجشنبه، ۹ تا ۱۸</p><a href="mailto:hello@zanora.ir">hello@zanora.ir</a><a href="tel:+982112345678">۰۲۱ ۱۲۳۴ ۵۶۷۸</a><a href="/admin">ورود مدیر فروشگاه</a></div></div><div className="footer-bottom container"><span>© ۱۴۰۵ Zanora. تمام حقوق محفوظ است.</span><span>ساخته‌شده با عشق در تهران <span className="gold-dot">●</span></span><button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>بازگشت به بالا ↑</button></div></footer>
    {quickView && <div className="quick-view-backdrop" role="dialog" aria-modal="true" onClick={() => setQuickView(null)}><div className="quick-view-modal" onClick={(event) => event.stopPropagation()}><button className="quick-view-close" onClick={() => setQuickView(null)} aria-label="بستن"><X size={18} /></button><img src={quickView.image} alt={quickView.name} /><div><p className="eyebrow"><span /> {quickView.category}</p><h2>{quickView.name}</h2><strong className="quick-view-price">{quickView.price}</strong><p>{quickView.description}</p><div className="quick-view-actions"><button className="primary-button" onClick={() => { addProduct(quickView); setQuickView(null); }}>افزودن به سبد <ShoppingBag size={16} /></button><a className="text-link" href={`/product/${quickView.id}`}>جزئیات محصول <ArrowLeft size={15} /></a></div></div></div></div>}
  </div>;
}
