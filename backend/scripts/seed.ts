import { PrismaClient } from "@prisma/client";
import path from "path";
import dotenv from "dotenv";
import { logger } from "../src/config/logger.js";

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
  await prisma.productReview.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();      // products before collections (FK on product)
  await prisma.collection.deleteMany();
  await prisma.badge.deleteMany();        // new
  await prisma.colorTheme.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.userAddress.deleteMany();
  await prisma.userNotificationPrefs.deleteMany();
  await prisma.user.deleteMany();
  await prisma.newsletterSubscription.deleteMany();
  await prisma.siteSetting.deleteMany();

  // 1) Seed badges (4 only)
  logger.info("Seeding badges...");
  const badges = await Promise.all([
    prisma.badge.create({ data: { title: "۱۰۰% طبیعی", icon: "feather" } }),
    prisma.badge.create({ data: { title: "تایید شده", icon: "award" } }),
    prisma.badge.create({ data: { title: "ارسال رایگان", icon: "truck" } }),
    prisma.badge.create({ data: { title: "ضمانت بازگشت", icon: "refresh-cw" } }),
  ]);

  // 2) Static color themes
  logger.info("Seeding color themes (static)...");
  const colorThemes = await Promise.all([
    prisma.colorTheme.create({ data: { name: "نعنای تازه", slug: "fresh-mint", hexCode: "#c5f4e5" } }),
    prisma.colorTheme.create({ data: { name: "اسطوخودوس ملایم", slug: "soft-lavender", hexCode: "#e0d9fe" } }),
    prisma.colorTheme.create({ data: { name: "صورتی رژگونه‌ای", slug: "blush-pink", hexCode: "#ffeef5" } }),
    prisma.colorTheme.create({ data: { name: "هلویی ملایم", slug: "soft-peach", hexCode: "#FFDAB9" } }),
    prisma.colorTheme.create({ data: { name: "آبی پودری", slug: "powder-blue", hexCode: "#D1E8FF" } }),
    prisma.colorTheme.create({ data: { name: "جو دوسر گرم", slug: "warm-oat", hexCode: "#F3EAD3" } }),
    prisma.colorTheme.create({ data: { name: "سنگ روشن", slug: "light-stone", hexCode: "#E5E4E2" } }),
  ]);

  // 3) Users (5)
  logger.info("Seeding users...");
  
  // For seed data, using bcrypt hash of "password123" (for testing only)
  // Hash generated with: bcrypt.hash("password123", 10)
  const testPasswordHash = "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW";

  const users = await Promise.all([
    prisma.user.create({
      data: {
        phone: "+989100000001",
        email: "admin@beauty.com",
        passwordHash: testPasswordHash,
        firstName: "ادمین",
        lastName: "کاربر",
        gender: "FEMALE",
        customerTier: "VIP",
        phoneVerifiedAt: new Date(),
        notificationPrefs: {
          create: { orderUpdates: true, promotions: true, newProducts: true, marketing: true },
        },
      },
    }),
    prisma.user.create({
      data: {
        phone: "+989100000002",
        email: "customer1@example.com",
        passwordHash: testPasswordHash,
        firstName: "سارا",
        lastName: "رضایی",
        gender: "FEMALE",
        birthDate: new Date("1990-05-15"),
        phoneVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        phone: "+989100000003",
        email: "customer2@example.com",
        passwordHash: testPasswordHash,
        firstName: "علی",
        lastName: "مرادی",
        gender: "MALE",
      },
    }),
    prisma.user.create({
      data: {
        phone: "+989100000004",
        email: "customer3@example.com",
        passwordHash: testPasswordHash,
        firstName: "فاطمه",
        lastName: "کاظمی",
        gender: "FEMALE",
      },
    }),
    prisma.user.create({
      data: {
        phone: "+989100000005",
        email: "customer4@example.com",
        passwordHash: testPasswordHash,
        firstName: "حسین",
        lastName: "اکبری",
        gender: "MALE",
      },
    }),
  ]);

  // 4) Brands (5)
  logger.info("Seeding brands...");
  const brands = await Promise.all([
    prisma.brand.create({ data: { name: "لوکس بیوتی", slug: "luxe-beauty" } }),
    prisma.brand.create({ data: { name: "درخشش طبیعی", slug: "natural-glow" } }),
    prisma.brand.create({ data: { name: "شیک شهری", slug: "urban-chic" } }),
    prisma.brand.create({ data: { name: "اسانس خالص", slug: "pure-essence" } }),
    prisma.brand.create({ data: { name: "رویای گل‌ها", slug: "floral-dreams" } }),
  ]);

  // 5) Collections (5) — simple now (name only)
  logger.info("Seeding collections...");
  const collections = await Promise.all([
    prisma.collection.create({ data: { name: "کالکشن بهاری" } }),
    prisma.collection.create({ data: { name: "کالکشن تابستانی" } }),
    prisma.collection.create({ data: { name: "کالکشن پاییزی" } }),
    prisma.collection.create({ data: { name: "کالکشن زمستانی" } }),
    prisma.collection.create({ data: { name: "کالکشن ویژه" } }),
  ]);

  // 6) Products (5) with images, variants, and badges (m:n); collectionId is optional
  logger.info("Seeding products...");
  const products = await Promise.all([
    prisma.product.create({
      data: {
        brandId: brands[0].id,
        colorThemeId: colorThemes[3].id, // soft-peach
        collectionId: collections[4].id, // کالکشن ویژه
        category: "MAKEUP",
        title: "رژ لب مات مخملی",
        subtitle: "ماندگاری بالا و احساس راحتی",
        slug: "velvet-matte-lipstick",
        description: "یک رژ لب مات انقلابی که لب‌ها را خشک نمی‌کند و پوششی کامل و مخملی ارائه می‌دهد.",
        ingredients: "ویتامین E، شی باتر، روغن جوجوبا",
        howToUse: "از مرکز لب شروع کرده و به سمت گوشه‌ها بکشید.",
        price: 450000,
        compareAtPrice: 550000,
        ratingAvg: 4.5,
        ratingCount: 125,
        isBestseller: true,
        isFeatured: true,
        isSpecialProduct: true,
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
        badges: { connect: [{ id: badges[1].id }, { id: badges[2].id }] }, // تایید شده + ارسال رایگان
      },
    }),
    prisma.product.create({
      data: {
        brandId: brands[1].id,
        colorThemeId: colorThemes[0].id, // fresh-mint
        collectionId: collections[0].id, // کالکشن بهاری
        category: "SKINCARE",
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
        isSpecialProduct: true,
        heroImageUrl: "/assets/images/products/serum-hero.jpg",
        variants: {
          create: [
            { variantName: "۳۰ میل", sku: "SER-001-30", stock: 25 },
            { variantName: "۵۰ میل", sku: "SER-001-50", price: 1200000, stock: 15 },
          ],
        },
        badges: { connect: [{ id: badges[0].id }, { id: badges[1].id }, { id: badges[2].id }] }, // طبیعی + تایید شده + ارسال رایگان
      },
    }),
    prisma.product.create({
      data: {
        brandId: brands[2].id,
        colorThemeId: colorThemes[1].id, // soft-lavender
        collectionId: collections[2].id, // کالکشن پاییزی
        category: "MAKEUP",
        title: "پالت سایه چشم - غروب توت",
        slug: "eyeshadow-palette-berry-sunset",
        description: "۱۲ رنگ خیره‌کننده با الهام از رنگ‌های غروب آفتاب.",
        price: 980000,
        compareAtPrice: 1200000,
        ratingAvg: 4.6,
        ratingCount: 56,
        isSpecialProduct: true,
        images: {
          create: [{ url: "/assets/images/products/eyeshadow-1.jpg", alt: "پالت سایه چشم", position: 0 }],
        },
        variants: { create: [{ variantName: "پیش‌فرض", sku: "EYE-001", stock: 40 }] },
        badges: { connect: [{ id: badges[3].id }, { id: badges[2].id }] }, // ضمانت بازگشت + ارسال رایگان
      },
    }),
    prisma.product.create({
      data: {
        brandId: brands[3].id,
        colorThemeId: colorThemes[6].id, // light-stone
        collectionId: null,
        category: "FRAGRANCE",
        title: "ادو پارفوم اسانس خالص",
        subtitle: "رایحه‌ای عمیق و ماندگار",
        slug: "pure-essence-eau-de-parfum",
        description: "رایحه‌ای شیک و مدرن با نُت‌های چوبی و گلی.",
        price: 2500000,
        ratingAvg: 4.2,
        ratingCount: 21,
        isSpecialProduct: true,
        heroImageUrl: "/assets/images/products/perfume-hero.jpg",
        images: { create: [{ url: "/assets/images/products/perfume-1.jpg", alt: "ادو پارفوم", position: 0 }] },
        variants: {
          create: [
            { variantName: "۵۰ میل", sku: "PER-001-50", stock: 20 },
            { variantName: "۱۰۰ میل", sku: "PER-001-100", price: 3800000, stock: 12 },
          ],
        },
        badges: { connect: [{ id: badges[1].id }, { id: badges[3].id }] }, // تایید شده + ضمانت بازگشت
      },
    }),
    prisma.product.create({
      data: {
        brandId: brands[4].id,
        colorThemeId: colorThemes[2].id, // blush-pink
        collectionId: collections[1].id, // کالکشن تابستانی
        category: "HAIRCARE",
        title: "شامپوی گیاهی تقویت‌کننده",
        subtitle: "مغذی و بدون سولفات",
        slug: "botanical-shampoo-nourish",
        description: "تقویت موها با فرمولاسیون گیاهی و ملایم.",
        price: 600000,
        ratingAvg: 4.3,
        ratingCount: 34,
        heroImageUrl: "/assets/images/products/shampoo-hero.jpg",
        images: { create: [{ url: "/assets/images/products/shampoo-1.jpg", alt: "شامپو گیاهی", position: 0 }] },
        variants: {
          create: [
            { variantName: "۳۰۰ میل", sku: "SHA-001-300", stock: 40 },
            { variantName: "۵۰۰ میل", sku: "SHA-001-500", price: 780000, stock: 25 },
          ],
        },
        badges: { connect: [{ id: badges[0].id }, { id: badges[3].id }] }, // طبیعی + ضمانت بازگشت
      },
    }),
  ]);

  // 6.1) Related products
  logger.info("Seeding related products...");
  await prisma.relatedProduct.createMany({
    data: [
      // Lipstick -> Eyeshadow, Serum, Perfume
      { productId: products[0].id, relatedProductId: products[2].id, position: 0 },
      { productId: products[0].id, relatedProductId: products[1].id, position: 1 },
      { productId: products[0].id, relatedProductId: products[3].id, position: 2 },

      // Serum -> Lipstick, Shampoo, Eyeshadow
      { productId: products[1].id, relatedProductId: products[0].id, position: 0 },
      { productId: products[1].id, relatedProductId: products[4].id, position: 1 },
      { productId: products[1].id, relatedProductId: products[2].id, position: 2 },

      // Eyeshadow -> Lipstick, Serum, Perfume
      { productId: products[2].id, relatedProductId: products[0].id, position: 0 },
      { productId: products[2].id, relatedProductId: products[1].id, position: 1 },
      { productId: products[2].id, relatedProductId: products[3].id, position: 2 },

      // Perfume -> Lipstick, Eyeshadow, Serum
      { productId: products[3].id, relatedProductId: products[0].id, position: 0 },
      { productId: products[3].id, relatedProductId: products[2].id, position: 1 },
      { productId: products[3].id, relatedProductId: products[1].id, position: 2 },

      // Shampoo -> Serum, Perfume, Lipstick
      { productId: products[4].id, relatedProductId: products[1].id, position: 0 },
      { productId: products[4].id, relatedProductId: products[3].id, position: 1 },
      { productId: products[4].id, relatedProductId: products[0].id, position: 2 },
    ],
  });

  // 7) Product reviews (5)
  logger.info("Seeding product reviews...");
  await Promise.all([
    prisma.productReview.create({
      data: {
        productId: products[0].id,
        userId: users[1].id,
        rating: 5,
        title: "فینیش مات بی‌نقص!",
        body: "این رژ لب فوق‌العاده است! تمام روز بدون خشکی باقی می‌ماند.",
        status: "APPROVED",
      },
    }),
    prisma.productReview.create({
      data: {
        productId: products[1].id,
        guestName: "ناشناس",
        rating: 4,
        body: "سرم عالی بود، در دو هفته نتیجه گرفتم.",
        status: "APPROVED",
      },
    }),
    prisma.productReview.create({
      data: {
        productId: products[2].id,
        userId: users[2].id,
        rating: 5,
        title: "رنگ‌های جذاب",
        body: "پیگمنت عالی و ماندگاری خوب.",
        status: "APPROVED",
      },
    }),
    prisma.productReview.create({
      data: {
        productId: products[3].id,
        userId: users[3].id,
        rating: 4,
        title: "رایحه‌ی شیک",
        body: "برای استفاده روزانه عالیه.",
        status: "APPROVED",
      },
    }),
    prisma.productReview.create({
      data: {
        productId: products[4].id,
        userId: users[4].id,
        rating: 5,
        title: "احساس سبکی مو",
        body: "بدون سولفات و خیلی ملایم.",
        status: "APPROVED",
      },
    }),
  ]);

  // 8) Coupons (5)
  logger.info("Seeding coupons...");
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
    prisma.coupon.create({
      data: {
        code: "SALE10",
        type: "PERCENT",
        percentValue: 10,
        minSubtotal: 300000,
        isActive: true,
      },
    }),
    prisma.coupon.create({
      data: {
        code: "FLAT50K",
        type: "AMOUNT",
        amountValue: 50000,
        minSubtotal: 250000,
        isActive: true,
      },
    }),
    prisma.coupon.create({
      data: {
        code: "VIP30",
        type: "PERCENT",
        percentValue: 30,
        minSubtotal: 2000000,
        maxUsesPerUser: 2,
        isActive: true,
      },
    }),
  ]);

  // 9) Magazine authors (5)
  logger.info("Seeding magazine authors...");
  const authors = await Promise.all([
    prisma.magazineAuthor.create({
      data: {
        name: "دکتر سارا احمدی",
        slug: "dr-sara-ahmadi",
        bio: "متخصص پوست با ۱۵ سال تجربه در مراقبت از پوست",
        avatarUrl: "/assets/images/authors/sara-ahmadi.jpg",
      },
    }),
    prisma.magazineAuthor.create({
      data: {
        name: "مریم رضایی",
        slug: "maryam-rezaei",
        bio: "میکاپ آرتیست حرفه‌ای",
        avatarUrl: "/assets/images/authors/maryam-rezaei.jpg",
      },
    }),
    prisma.magazineAuthor.create({
      data: {
        name: "تیم بیوتی",
        slug: "beauty-team",
        bio: "تیم متخصصان زیبایی",
        avatarUrl: "/assets/images/authors/beauty-team.jpg",
      },
    }),
    prisma.magazineAuthor.create({
      data: {
        name: "علی مرادی",
        slug: "ali-moradi",
        bio: "نویسنده و پژوهشگر حوزه زیبایی",
        avatarUrl: "/assets/images/authors/ali-moradi.jpg",
      },
    }),
    prisma.magazineAuthor.create({
      data: {
        name: "نیلوفر رحیمی",
        slug: "niloofar-rahimi",
        bio: "کارشناس مراقبت مو",
        avatarUrl: "/assets/images/authors/niloofar-rahimi.jpg",
      },
    }),
  ]);

  // 10) Magazine tags (5)
  logger.info("Seeding magazine tags...");
  const tags = await Promise.all([
    prisma.magazineTag.create({ data: { name: "روتین مراقبت از پوست", slug: "skincare-routine" } }),
    prisma.magazineTag.create({ data: { name: "نکات آرایشی", slug: "makeup-tips" } }),
    prisma.magazineTag.create({ data: { name: "ضد پیری", slug: "anti-aging" } }),
    prisma.magazineTag.create({ data: { name: "زیبایی طبیعی", slug: "natural-beauty" } }),
    prisma.magazineTag.create({ data: { name: "زیبایی در تابستان", slug: "summer-beauty" } }),
  ]);

  // 11) Magazine posts (5)
  logger.info("Seeding magazine posts...");
  const posts = await Promise.all([
    prisma.magazinePost.create({
      data: {
        authorId: authors[0].id,
        category: "GUIDE",
        title: "روتین کامل ۱۰ مرحله‌ای مراقبت از پوست کره‌ای",
        slug: "ultimate-10-step-korean-skincare-routine",
        excerpt: "با راهنمای جامع ما، رازهای پوست بی‌نقص کره‌ای را کشف کنید",
        content: `
# روتین کامل ۱۰ مرحله‌ای مراقبت از پوست کره‌ای
...`,
        heroImageUrl: "/assets/images/magazine/article1.jpg",
        readTimeMinutes: 12,
        publishedAt: new Date("2024-01-15"),
        tags: { create: [{ tagId: tags[0].id }] },
      },
    }),
    prisma.magazinePost.create({
      data: {
        authorId: authors[1].id,
        category: "TUTORIAL",
        title: "آرایش ۵ دقیقه‌ای: سریع و شیک",
        slug: "5-minute-makeup-tutorial",
        excerpt: "با این تکنیک‌ها در هنر آرایش سریع استاد شوید",
        content: `
# آموزش آرایش ۵ دقیقه‌ای
...`,
        heroImageUrl: "/assets/images/magazine/article2.jpg",
        readTimeMinutes: 5,
        publishedAt: new Date("2024-01-20"),
        tags: { create: [{ tagId: tags[1].id }] },
      },
    }),
    prisma.magazinePost.create({
      data: {
        authorId: authors[0].id,
        category: "TRENDS",
        title: "ترندهای زیبایی سال ۲۰۲۴",
        slug: "2024-beauty-trends",
        excerpt: "امسال چه چیزهایی مد است؟",
        content: `
# ترندهای زیبایی ۲۰۲۴
...`,
        heroImageUrl: "/assets/images/magazine/article3.jpg",
        readTimeMinutes: 8,
        publishedAt: new Date("2024-01-10"),
        tags: { create: [{ tagId: tags[2].id }] },
      },
    }),
    prisma.magazinePost.create({
      data: {
        authorId: authors[2].id,
        category: "GENERAL",
        title: "یکشنبه‌ی مراقبت از خود",
        slug: "self-care-sunday-pamper-routine",
        excerpt: "یکشنبه‌ی خود را به یک روز اسپای لوکس تبدیل کنید",
        content: `
# روتین یکشنبه
...`,
        heroImageUrl: "/assets/images/magazine/article4.jpg",
        readTimeMinutes: 6,
        publishedAt: new Date("2024-01-25"),
        tags: { create: [{ tagId: tags[3].id }] },
      },
    }),
    prisma.magazinePost.create({
      data: {
        authorId: authors[4].id,
        category: "GUIDE",
        title: "راهنمای مراقبت از مو در تابستان",
        slug: "summer-haircare-guide",
        excerpt: "چطور موها را در تابستان سالم نگه داریم",
        content: `
# مراقبت از مو در تابستان
...`,
        heroImageUrl: "/assets/images/magazine/article5.jpg",
        readTimeMinutes: 7,
        publishedAt: new Date("2024-01-30"),
        tags: { create: [{ tagId: tags[4].id }] },
      },
    }),
  ]);

  // 12) Related posts
  logger.info("Seeding related magazine posts...");
  await Promise.all([
    prisma.magazineRelatedPost.create({ data: { postId: posts[0].id, relatedPostId: posts[2].id } }),
    prisma.magazineRelatedPost.create({ data: { postId: posts[1].id, relatedPostId: posts[3].id } }),
    prisma.magazineRelatedPost.create({ data: { postId: posts[2].id, relatedPostId: posts[4].id } }),
  ]);

  // 13) Site settings (static samples)
  logger.info("Seeding site settings...");
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