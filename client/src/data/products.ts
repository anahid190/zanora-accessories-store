export type Category = "همه" | "گوشواره" | "گردنبند" | "دستبند" | "کیف";
export type Product = { id: number; name: string; category: Exclude<Category, "همه">; price: string; priceValue: number; image: string; badge?: string; description: string };

const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1100&q=90`;

export const products: Product[] = [
  { id: 1, name: "گوشواره هلال طلایی", category: "گوشواره", price: "۱٬۲۸۰٬۰۰۰ تومان", priceValue: 1280000, image: photo("photo-1535632066927-ab7c9ab60908"), badge: "تازه رسیده", description: "خطوط نرم و فرم هلالی این گوشواره، درخشش آرامی به استایل روزمره‌ات می‌دهد. یک قطعه سبک و بی‌زمان برای تمام ساعت‌های روز." },
  { id: 2, name: "گردنبند مروارید ساتین", category: "گردنبند", price: "۱٬۸۹۰٬۰۰۰ تومان", priceValue: 1890000, image: photo("photo-1599643478518-a784e5dc4c8f"), description: "مرواریدهای طبیعی با زنجیری ظریف و درخشش ساتین؛ انتخابی که با هر یقه و هر حال‌وهوایی همراه می‌شود." },
  { id: 3, name: "کیف دستی لونا", category: "کیف", price: "۳٬۴۵۰٬۰۰۰ تومان", priceValue: 3450000, image: photo("photo-1584917865442-de89df76afd3"), badge: "پرفروش", description: "کیفی جمع‌وجور با ساختاری دقیق، برای روزهایی که می‌خواهی همه‌چیز را ساده و شیک با خودت داشته باشی." },
  { id: 4, name: "دستبند مروارید و طلا", category: "دستبند", price: "۹۸۰٬۰۰۰ تومان", priceValue: 980000, image: photo("photo-1611652022419-a9419f74343d"), description: "ترکیبی ظریف از مرواریدهای کوچک و جزئیات طلایی که به‌تنهایی زیباست و کنار ساعت هم به‌خوبی می‌نشیند." },
  { id: 5, name: "گوشواره قطره نور", category: "گوشواره", price: "۱٬۴۵۰٬۰۰۰ تومان", priceValue: 1450000, image: photo("photo-1635767798638-3e25273a8236"), description: "فرم قطره‌ای و بازی نور روی سطح صیقلی، این گوشواره را به انتخابی چشمگیر برای شب‌های خاص تبدیل کرده است." },
  { id: 6, name: "کیف شانه‌ای نوا", category: "کیف", price: "۲٬۸۵۰٬۰۰۰ تومان", priceValue: 2850000, image: photo("photo-1566150905458-1bf1fc113f0d"), description: "کیف شانه‌ای نوا با فرم نرم و بند قابل تنظیم، همراهی کاربردی برای روزهای پررفت‌وآمد توست." },
  { id: 7, name: "گوشواره مروارید کلاسیک", category: "گوشواره", price: "۱٬۱۲۰٬۰۰۰ تومان", priceValue: 1120000, image: photo("photo-1535632066927-ab7c9ab60908"), badge: "کلاسیک", description: "مرواریدهای روشن و قاب طلایی ظریف برای استایلی آرام، تمیز و همیشه قابل اعتماد." },
  { id: 8, name: "گردنبند زنجیر آفتاب", category: "گردنبند", price: "۲٬۲۵۰٬۰۰۰ تومان", priceValue: 2250000, image: photo("photo-1515562141207-7a88fb7ce338"), badge: "محبوب", description: "زنجیری براق با ریتمی مدرن که به‌تنهایی یا در کنار گردنبندهای ظریف دیگر چشمگیر است." },
  { id: 9, name: "دستبند زنجیری شامپاین", category: "دستبند", price: "۱٬۳۵۰٬۰۰۰ تومان", priceValue: 1350000, image: photo("photo-1611652022419-a9419f74343d"), description: "رنگ شامپاین و قفل ظریف، برای اضافه‌کردن یک خط درخشان به استایل روزانه." },
  { id: 10, name: "کیف مینیمال آریا", category: "کیف", price: "۳٬۹۰۰٬۰۰۰ تومان", priceValue: 3900000, image: photo("photo-1594223274512-ad4803739b7c"), badge: "انتخاب سردبیر", description: "فرمی مینیمال با فضای کافی برای ضروریات روزانه و ظاهری که از صبح تا شب همراهت می‌ماند." },
  { id: 11, name: "گوشواره حلقه‌ای نوا", category: "گوشواره", price: "۸۹۰٬۰۰۰ تومان", priceValue: 890000, image: photo("photo-1617038220319-276d3cfab638"), description: "حلقه‌ای سبک و روزمره با پرداخت طلایی، مناسب استایل‌های ساده و چندلایه." },
  { id: 12, name: "گردنبند پلاک مروارید", category: "گردنبند", price: "۱٬۶۸۰٬۰۰۰ تومان", priceValue: 1680000, image: photo("photo-1602173574767-37ac01994b2a"), description: "پلاک مرواریدی کوچک روی زنجیری ظریف؛ جزئیاتی زنانه برای یقه‌های باز و بسته." },
  { id: 13, name: "دستبند مهره‌ای رزگلد", category: "دستبند", price: "۷۸۰٬۰۰۰ تومان", priceValue: 780000, image: photo("photo-1573408301185-9146fe634ad0"), badge: "هدیه محبوب", description: "مهره‌های صیقلی و جزئیات رزگلد در ترکیبی لطیف که برای هدیه‌دادن هم انتخابی دوست‌داشتنی است." },
  { id: 14, name: "کیف کراس‌بادی مارال", category: "کیف", price: "۲٬۶۵۰٬۰۰۰ تومان", priceValue: 2650000, image: photo("photo-1591561954557-26941169b49e"), description: "کراس‌بادی سبک با بند قابل تنظیم برای روزهایی که آزادی حرکت و ظرافت را هم‌زمان می‌خواهی." },
  { id: 15, name: "گوشواره برگ طلایی", category: "گوشواره", price: "۱٬۵۹۰٬۰۰۰ تومان", priceValue: 1590000, image: photo("photo-1599643478518-a784e5dc4c8f"), badge: "جدید", description: "الهام‌گرفته از فرم برگ، با سطحی نرم و درخشان برای کامل‌کردن استایل‌های زنانه." },
  { id: 16, name: "گردنبند دو لایه مهتاب", category: "گردنبند", price: "۲٬۴۸۰٬۰۰۰ تومان", priceValue: 2480000, image: photo("photo-1599643478518-a784e5dc4c8f"), description: "دو زنجیر هماهنگ برای ساختن یک لایه‌بندی آماده و بی‌دردسر در استایل روزانه." },
  { id: 17, name: "دستبند بافت طلایی", category: "دستبند", price: "۱٬۷۲۰٬۰۰۰ تومان", priceValue: 1720000, image: photo("photo-1611652022419-a9419f74343d"), description: "بافت نرم و درخشش گرم طلایی؛ قطعه‌ای ظریف با حضور کافی برای مناسبت‌های خاص." },
  { id: 18, name: "کیف دستی سلین", category: "کیف", price: "۴٬۲۰۰٬۰۰۰ تومان", priceValue: 4200000, image: photo("photo-1584917865442-de89df76afd3"), badge: "آخرین موجودی", description: "کیف دستی ساختارمند با حال‌وهوای مجلسی و دسته‌ای راحت برای قرارها و مهمانی‌های شبانه." },
];

export const categories: { label: string; count: string; image: string; filter?: Category }[] = [
  { label: "گردنبند", count: "۴ محصول", image: products[1].image.replace("w=1100", "w=700"), filter: "گردنبند" },
  { label: "گوشواره", count: "۵ محصول", image: products[0].image.replace("w=1100", "w=700"), filter: "گوشواره" },
  { label: "دستبند", count: "۴ محصول", image: products[3].image.replace("w=1100", "w=700"), filter: "دستبند" },
  { label: "حلقه و ست جواهر", count: "کالکشن ویژه", image: products[4].image.replace("w=1100", "w=700") },
  { label: "کش و اسکرانچی", count: "کالکشن مو", image: products[5].image.replace("w=1100", "w=700") },
  { label: "گیره و کلیپس", count: "کالکشن مو", image: products[0].image.replace("w=1100", "w=700") },
  { label: "هدبند", count: "کالکشن مو", image: products[1].image.replace("w=1100", "w=700") },
  { label: "کیف زنانه", count: "۴ محصول", image: products[2].image.replace("w=1100", "w=700"), filter: "کیف" },
  { label: "کیف پول", count: "انتخاب روزمره", image: products[3].image.replace("w=1100", "w=700") },
  { label: "مینی‌بگ", count: "انتخاب ترند", image: products[2].image.replace("w=1100", "w=700") },
  { label: "ست‌های هدیه", count: "بسته‌بندی اختصاصی", image: products[4].image.replace("w=1100", "w=700") },
];
