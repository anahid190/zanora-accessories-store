export type Category = "همه" | "گوشواره" | "گردنبند" | "دستبند" | "کیف";
export type Product = { id: number; name: string; category: Exclude<Category, "همه">; price: string; priceValue: number; image: string; badge?: string; description: string };

export const products: Product[] = [
  { id: 1, name: "گوشواره هلال طلایی", category: "گوشواره", price: "۱٬۲۸۰٬۰۰۰ تومان", priceValue: 1280000, image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1100&q=90", badge: "تازه رسیده", description: "خطوط نرم و فرم هلالی این گوشواره، درخشش آرامی به استایل روزمره‌ات می‌دهد. یک قطعه سبک و بی‌زمان برای تمام ساعت‌های روز." },
  { id: 2, name: "گردنبند مروارید ساتین", category: "گردنبند", price: "۱٬۸۹۰٬۰۰۰ تومان", priceValue: 1890000, image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1100&q=90", description: "مرواریدهای طبیعی با زنجیری ظریف و درخشش ساتین؛ انتخابی که با هر یقه و هر حال‌وهوایی همراه می‌شود." },
  { id: 3, name: "کیف دستی لونا", category: "کیف", price: "۳٬۴۵۰٬۰۰۰ تومان", priceValue: 3450000, image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1100&q=90", badge: "پرفروش", description: "کیفی جمع‌وجور با ساختاری دقیق، برای روزهایی که می‌خواهی همه‌چیز را ساده و شیک با خودت داشته باشی." },
  { id: 4, name: "دستبند مروارید و طلا", category: "دستبند", price: "۹۸۰٬۰۰۰ تومان", priceValue: 980000, image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1100&q=90", description: "ترکیبی ظریف از مرواریدهای کوچک و جزئیات طلایی که به‌تنهایی زیباست و کنار ساعت هم به‌خوبی می‌نشیند." },
  { id: 5, name: "گوشواره قطره نور", category: "گوشواره", price: "۱٬۴۵۰٬۰۰۰ تومان", priceValue: 1450000, image: "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=1100&q=90", description: "فرم قطره‌ای و بازی نور روی سطح صیقلی، این گوشواره را به انتخابی چشمگیر برای شب‌های خاص تبدیل کرده است." },
  { id: 6, name: "کیف شانه‌ای نوا", category: "کیف", price: "۲٬۸۵۰٬۰۰۰ تومان", priceValue: 2850000, image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=1100&q=90", description: "کیف شانه‌ای نوا با فرم نرم و بند قابل تنظیم، همراهی کاربردی برای روزهای پررفت‌وآمد توست." },
];

export const categories: { label: string; count: string; image: string; filter?: Category }[] = [
  { label: "گردنبند", count: "۱۸ محصول", image: products[1].image.replace("w=1100", "w=700"), filter: "گردنبند" },
  { label: "گوشواره", count: "۲۴ محصول", image: products[0].image.replace("w=1100", "w=700"), filter: "گوشواره" },
  { label: "دستبند", count: "۱۶ محصول", image: products[3].image.replace("w=1100", "w=700"), filter: "دستبند" },
  { label: "حلقه و ست جواهر", count: "کالکشن ویژه", image: products[4].image.replace("w=1100", "w=700") },
  { label: "کش و اسکرانچی", count: "کالکشن مو", image: products[5].image.replace("w=1100", "w=700") },
  { label: "گیره و کلیپس", count: "کالکشن مو", image: products[0].image.replace("w=1100", "w=700") },
  { label: "هدبند", count: "کالکشن مو", image: products[1].image.replace("w=1100", "w=700") },
  { label: "کیف زنانه", count: "۱۲ محصول", image: products[2].image.replace("w=1100", "w=700"), filter: "کیف" },
  { label: "کیف پول", count: "انتخاب روزمره", image: products[3].image.replace("w=1100", "w=700") },
  { label: "مینی‌بگ", count: "انتخاب ترند", image: products[2].image.replace("w=1100", "w=700") },
  { label: "ست‌های هدیه", count: "بسته‌بندی اختصاصی", image: products[4].image.replace("w=1100", "w=700") },
];
