import { PrismaClient } from "@prisma/client";
import path from "path";
import dotenv from "dotenv";
import { logger } from "../src/config/logger";

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();
async function main() {
  logger.info("Starting database seeding...");

  // Clear existing data in correct order (respecting foreign key constraints)
  await prisma.magazinePostTag.deleteMany();
  await prisma.magazineRelatedPost.deleteMany();
  await prisma.magazinePost.deleteMany();
  await prisma.magazineTag.deleteMany();
  await prisma.magazineAuthor.deleteMany();
  await prisma.couponRedemption.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.relatedProduct.deleteMany();
  await prisma.collectionProduct.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.productReview.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.colorTheme.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.userAddress.deleteMany();
  await prisma.userNotificationPrefs.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.user.deleteMany();
  await prisma.newsletterSubscription.deleteMany();
  await prisma.siteSetting.deleteMany();

  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        phone: "+989123456789",
        email: "admin@beauty.com",
        firstName: "ادمین",
        lastName: "کاربر",
        gender: 'FEMALE',
        customerTier: 'VIP',
        phoneVerifiedAt: new Date(),
        notificationPrefs: {
          create: {
            orderUpdates: true,
            promotions: true,
            newProducts: true,
            marketing: true,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        phone: "+989123456788",
        email: "customer@example.com",
        firstName: "سارا",
        lastName: "رضایی",
        gender: 'FEMALE',
        birthDate: new Date("1990-05-15"),
        phoneVerifiedAt: new Date(),
      },
    }),
  ]);

  // Create brands
  const brands = await Promise.all([
    prisma.brand.create({ data: { name: "لوکس بیوتی", slug: "luxe-beauty" } }),
    prisma.brand.create({ data: { name: "درخشش طبیعی", slug: "natural-glow" } }),
    prisma.brand.create({ data: { name: "شیک شهری", slug: "urban-chic" } }),
    prisma.brand.create({ data: { name: "اسانس خالص", slug: "pure-essence" } }),
  ]);

  // Create color themes
  const colorThemes = await Promise.all([
    // Original Pastel Colors
    prisma.colorTheme.create({ data: { name: "نعنای تازه", slug: "fresh-mint", hexCode: "#c5f4e5" } }),
    prisma.colorTheme.create({ data: { name: "اسطوخودوس ملایم", slug: "soft-lavender", hexCode: "#e0d9fe" } }),
    prisma.colorTheme.create({ data: { name: "زرد کره‌ای", slug: "buttercream-yellow", hexCode: "#fef9e3" } }),
    prisma.colorTheme.create({ data: { name: "صورتی رژگونه‌ای", slug: "blush-pink", hexCode: "#ffeef5" } }),
    prisma.colorTheme.create({ data: { name: "هلویی ملایم", slug: "soft-peach", hexCode: "#FFDAB9" } }),
    prisma.colorTheme.create({ data: { name: "آبی پودری", slug: "powder-blue", hexCode: "#D1E8FF" } }),
    prisma.colorTheme.create({ data: { name: "سبز مریم‌گلی", slug: "sage-green", hexCode: "#C3E6CB" } }),
    prisma.colorTheme.create({ data: { name: "جو دوسر گرم", slug: "warm-oat", hexCode: "#F3EAD3" } }),
    prisma.colorTheme.create({ data: { name: "سنگ روشن", slug: "light-stone", hexCode: "#E5E4E2" } }),
  ]);

  // Create collections
  const collections = await Promise.all([
    prisma.collection.create({
      data: {
        slug: "valentines-special",
        title: "ویژه ولنتاین",
        description: "روتین زیبایی خود را با کالکشن منتخب ولنتاین ما رمانتیک کنید",
        isActive: true,
      },
    }),
    prisma.collection.create({
      data: {
        slug: "summer-essentials",
        title: "ضروریات تابستان",
        description: "در تمام طول تابستان شاداب و درخشان بمانید",
        isActive: true,
      },
    }),
  ]);

  // Create products with images and variants
  const products = await Promise.all([
    prisma.product.create({
      data: {
        brandId: brands[0].id,
        colorThemeId: colorThemes[3].id,
        category: 'MAKEUP',
        title: "رژ لب مات مخملی",
        subtitle: "ماندگاری بالا و احساس راحتی",
        slug: "velvet-matte-lipstick",
        description: "یک رژ لب مات انقلابی که لب‌های شما را خشک نمی‌کند و پوششی کامل و مخملی ارائه می‌دهد.",
        ingredients: "ویتامین E، شی باتر، روغن جوجوبا",
        howToUse: "مستقیماً از مرکز لب شروع کرده و به سمت گوشه‌ها بکشید.",
        price: 450000,
        compareAtPrice: 550000,
        ratingAvg: 4.5,
        ratingCount: 125,
        isBestseller: true,
        isFeatured: true,
        heroImageUrl: "/assets/images/products/lipstick-hero.jpg",
        images: {
          create: [
            { url: "/assets/images/products/lipstick-1.jpg", alt: "نمای جلوی رژ لب", position: 0 },
            { url: "/assets/images/products/lipstick-2.jpg", alt: "سوآچ‌های رژ لب", position: 1 },
          ],
        },
        variants: {
          create: [
            { variantName: "قرمز یاقوتی", sku: "LIP-001-RR", colorName: "قرمز یاقوتی", colorHexCode: "#E0115F", stock: 50 },
            { variantName: "رز صورتی", sku: "LIP-001-PR", colorName: "رز صورتی", colorHexCode: "#FF69B4", stock: 30 },
            { variantName: "بژ نود", sku: "LIP-001-NB", colorName: "بژ نود", colorHexCode: "#F5DEB3", stock: 45 },
          ],
        },
        collections: {
          create: [
            { collectionId: collections[0].id, position: 0 },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        brandId: brands[1].id,
        category: 'SKINCARE',
        title: "سرم روشن‌کننده ویتامین C",
        subtitle: "درخشندگی در یک بطری",
        slug: "vitamin-c-brightening-serum",
        description: "سرم آنتی‌اکسیدان قوی برای پوستی درخشان و یکدست. به کاهش لک‌های تیره کمک می‌کند.",
        ingredients: "۲۰٪ ویتامین C، هیالورونیک اسید، ویتامین E",
        howToUse: "۲ تا ۳ قطره را صبح و شب روی پوست تمیز صورت بمالید.",
        price: 850000,
        ratingAvg: 4.8,
        ratingCount: 89,
        isFeatured: true,
        heroImageUrl: "/assets/images/products/serum-hero.jpg",
        variants: {
          create: [
            { variantName: "۳۰ میل", sku: "SER-001-30", stock: 25 },
            { variantName: "۵۰ میل", sku: "SER-001-50", price: 1200000, stock: 15 },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        brandId: brands[2].id,
        colorThemeId: colorThemes[1].id,
        category: 'MAKEUP',
        title: "پالت سایه چشم - غروب توت",
        slug: "eyeshadow-palette-berry-sunset",
        description: "۱۲ رنگ خیره‌کننده با الهام از رنگ‌های غروب آفتاب",
        price: 980000,
        compareAtPrice: 1200000,
        ratingAvg: 4.6,
        ratingCount: 56,
        isSpecialProduct: true,
        variants: {
          create: [
            { variantName: "پیش‌فرض", sku: "EYE-001", stock: 40 },
          ],
        },
      },
    }),
  ]);

  // Create product reviews
  await Promise.all([
    prisma.productReview.create({
      data: {
        productId: products[0].id,
        userId: users[1].id,
        rating: 5,
        title: "فینیش مات بی‌نقص!",
        body: "این رژ لب فوق‌العاده است! تمام روز بدون خشک کردن لب‌هایم باقی می‌ماند.",
        status: "APPROVED",
      },
    }),
    prisma.productReview.create({
      data: {
        productId: products[1].id,
        guestName: "ناشناس",
        rating: 4,
        body: "سرم عالی بود، در ۲ هفته نتیجه را دیدم.",
        status: "APPROVED",
      },
    }),
  ]);

  // Create coupons
  await Promise.all([
    prisma.coupon.create({
      data: {
        code: "WELCOME20",
        type: "PERCENT",
        percentValue: 20,
        minSubtotal: 500000,
        maxUsesPerUser: 1,
        isActive: true,
      },
    }),
    prisma.coupon.create({
      data: {
        code: "FREESHIP",
        type: "FREE_SHIPPING",
        minSubtotal: 1000000,
        isActive: true,
      },
    }),
  ]);

  // Create magazine authors
  const authors = await Promise.all([
    prisma.magazineAuthor.create({
      data: {
        name: "دکتر سارا احمدی",
        slug: "dr-sara-ahmadi",
        bio: "متخصص پوست دارای بورد تخصصی با ۱۵ سال تجربه در زمینه مراقبت از پوست",
        avatarUrl: "/assets/images/authors/sara-ahmadi.jpg",
      },
    }),
    prisma.magazineAuthor.create({
      data: {
        name: "مریم رضایی",
        slug: "maryam-rezaei",
        bio: "میکاپ آرتیست حرفه‌ای و اینفلوئنسر زیبایی",
        avatarUrl: "/assets/images/authors/maryam-rezaei.jpg",
      },
    }),
    prisma.magazineAuthor.create({
      data: {
        name: "تیم بیوتی",
        slug: "beauty-team",
        bio: "تیم متخصصان زیبایی ما",
        avatarUrl: "/assets/images/authors/sara-ahmadi.jpg",
      },
    }),
  ]);

  // Create magazine tags
  const tags = await Promise.all([
    prisma.magazineTag.create({ data: { name: "روتین مراقبت از پوست", slug: "skincare-routine" } }),
    prisma.magazineTag.create({ data: { name: "نکات آرایشی", slug: "makeup-tips" } }),
    prisma.magazineTag.create({ data: { name: "ضد پیری", slug: "anti-aging" } }),
    prisma.magazineTag.create({ data: { name: "زیبایی طبیعی", slug: "natural-beauty" } }),
    prisma.magazineTag.create({ data: { name: "زیبایی در تابستان", slug: "summer-beauty" } }),
    prisma.magazineTag.create({ data: { name: "کی-بیوتی (K-Beauty)", slug: "k-beauty" } }),
  ]);

  // Create magazine posts
  const posts = await Promise.all([
    prisma.magazinePost.create({
      data: {
        authorId: authors[0].id,
        category: 'GUIDE',
        title: "روتین کامل ۱۰ مرحله‌ای مراقبت از پوست کره‌ای",
        slug: "ultimate-10-step-korean-skincare-routine",
        excerpt: "با راهنمای جامع ما، رازهای پوست بی‌نقص کره‌ای را کشف کنید",
        content: `
# روتین کامل ۱۰ مرحله‌ای مراقبت از پوست کره‌ای

مراقبت از پوست کره‌ای دنیای زیبایی را متحول کرده است، و دلیل خوبی هم دارد. توجه دقیق به آبرسانی، ترکیبات ملایم و تکنیک‌های لایه‌لایه می‌تواند پوست شما را دگرگون کند...

## مرحله ۱: پاک‌کننده بر پایه‌ی روغن
روتین خود را با یک پاک‌کننده‌ی بر پایه‌ی روغن شروع کنید تا آرایش و ضدآفتاب را پاک کنید...

## مرحله ۲: پاک‌کننده بر پایه‌ی آب
سپس از یک شوینده‌ی ملایم فومی یا ژلی استفاده کنید...

[ادامه‌ی مطلب...]
        `,
        heroImageUrl: "/assets/images/magazine/article1.jpg",
        readTimeMinutes: 12,
        publishedAt: new Date("2024-01-15"),
        tags: {
          create: [
            { tagId: tags[0].id },
            { tagId: tags[5].id },
          ],
        },
      },
    }),
    prisma.magazinePost.create({
      data: {
        authorId: authors[1].id,
        category: 'TUTORIAL',
        title: "آرایش ۵ دقیقه‌ای: بدون فدا کردن استایل، سریع آماده شوید",
        slug: "5-minute-makeup-tutorial",
        excerpt: "با این تکنیک‌های صرفه‌جویی در زمان، در هنر آرایش سریع استاد شوید",
        content: `
# آموزش آرایش ۵ دقیقه‌ای

برای همه‌ی ما صبح‌هایی پیش می‌آید که زمان کافی نداریم. در اینجا یاد می‌گیرید که چطور فقط در ۵ دقیقه آراسته به نظر برسید...

## محصولات ضروری
- مرطوب‌کننده‌ی رنگی یا بی‌بی کرم
- رژگونه کرمی
- ریمل
- بالم لب رنگی
- اسپری تثبیت‌کننده آرایش (فیکساتور)

[مراحل آموزش...]
        `,
        heroImageUrl: "/assets/images/magazine/article2.jpg",
        readTimeMinutes: 5,
        publishedAt: new Date("2024-01-20"),
        tags: {
          create: [
            { tagId: tags[1].id },
          ],
        },
      },
    }),
    prisma.magazinePost.create({
      data: {
        authorId: authors[0].id,
        category: 'TRENDS',
        title: "ترندهای زیبایی سال ۲۰۲۴: امسال چه چیزهایی مد است؟",
        slug: "2024-beauty-trends",
        excerpt: "از پوست درخشان تا لب‌های پررنگ، با ترندهای زیبایی برتر سال ۲۰۲۴ آشنا شوید",
        content: `
# ترندهای زیبایی سال ۲۰۲۴

امسال همه چیز درباره‌ی پذیرش زیبایی طبیعی با کمی خلاقیت است. در اینجا برترین ترندها را معرفی می‌کنیم...

## ۱. پوست شیشه‌ای
ترند زیبایی کره‌ای همچنان بر زیبایی جهانی تأثیر می‌گذارد...

## ۲. لب‌هایی به رنگ توت
رژ لب‌های نود را کنار بگذارید، نوبت به رنگ‌های خانواده توت رسیده است...

[ترندهای بیشتر...]
        `,
        heroImageUrl: "/assets/images/magazine/article2.jpg",
        readTimeMinutes: 8,
        publishedAt: new Date("2024-01-10"),
      },
    }),
    prisma.magazinePost.create({
      data: {
        authorId: authors[2].id,
        category: 'GENERAL',
        title: "یکشنبه‌ی مراقبت از خود: ساختن روتین ایده‌آل برای آرامش",
        slug: "self-care-sunday-pamper-routine",
        excerpt: "یکشنبه‌ی خود را به یک روز اسپای لوکس در خانه تبدیل کنید",
        content: `
# روتین یکشنبه برای مراقبت از خود

وقت گذاشتن برای خودتان خودخواهی نیست، بلکه ضروری است. در اینجا روش ایجاد یک روز عالی برای رسیدگی به خودتان در یکشنبه آمده است...

## آداب صبحگاهی
روز را با یک جلسه یوگای آرام یا مدیتیشن شروع کنید...

## یک حمام بی‌نقص
نمک اپسوم، روغن‌های اسانسی (عطری) اضافه کنید و چند شمع روشن کنید...

[ادامه‌ی مطلب...]
        `,
        heroImageUrl: "/assets/images/magazine/article3.jpg",
        readTimeMinutes: 6,
        publishedAt: new Date("2024-01-25"),
        tags: {
          create: [
            { tagId: tags[3].id },
          ],
        },
      },
    }),
  ]);

  // Create related posts
  await Promise.all([
    prisma.magazineRelatedPost.create({
      data: {
        postId: posts[0].id,
        relatedPostId: posts[2].id,
      },
    }),
    prisma.magazineRelatedPost.create({
      data: {
        postId: posts[1].id,
        relatedPostId: posts[3].id,
      },
    }),
  ]);

  // Create site settings
  await Promise.all([
    prisma.siteSetting.create({
      data: {
        key: "shipping_rates",
        value: {
          standard: { price: 50000, days: "۳-۵" },
          express: { price: 100000, days: "۱-۲" },
        },
        description: "نرخ‌های ارسال و زمان تحویل",
      },
    }),
    prisma.siteSetting.create({
      data: {
        key: "homepage_banners",
        value: {
          hero: {
            title: "سال نو، زیبایی نو",
            subtitle: "جدیدترین کالکشن ما را کشف کنید",
            imageUrl: "/assets/images/banners/hero-banner.jpg",
            ctaText: "اکنون خرید کنید",
            ctaUrl: "/shop",
          },
        },
        description: "پیکربندی بنرهای صفحه اصلی",
      },
    }),
  ]);

  logger.info("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    logger.error({ err: e }, "Seeding failed");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });