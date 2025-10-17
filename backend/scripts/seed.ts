import { Prisma, PrismaClient } from "@prisma/client";
import path from "path";
import dotenv from "dotenv";
import { logger } from "../src/config/logger.js";

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

async function main() {
  logger.info("Starting database seeding...");

  // Non-destructive by default. Set RESET_SEED=true to wipe and reseed.
  const RESET = process.env.RESET_SEED === "true";
  if (RESET) {
    logger.warn("RESET_SEED=true -> Clearing existing data...");

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
    await prisma.product.deleteMany(); // products before collections (FK on product)
    await prisma.collection.deleteMany();
    await prisma.badge.deleteMany();
    await prisma.colorTheme.deleteMany();
    await prisma.brand.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.userAddress.deleteMany();
    await prisma.userNotificationPrefs.deleteMany();
    await prisma.user.deleteMany();
    await prisma.newsletterSubscription.deleteMany();
    await prisma.siteSetting.deleteMany();
    // Keep MagazineCategory and Category tables; they may be referenced by other data
  } else {
    logger.info("Incremental seed mode (no deletes)");
  }

  // 1) Seed badges (idempotent by title)
  logger.info("Seeding badges (idempotent)...");
  const badgeInputs = [
    { title: "۱۰۰% طبیعی", icon: "feather" },
    { title: "تایید شده", icon: "award" },
    { title: "ارسال رایگان", icon: "truck" },
    { title: "ضمانت بازگشت", icon: "refresh-cw" },
  ];
  const badges = [];
  for (const b of badgeInputs) {
    const existing = await prisma.badge.findFirst({ where: { title: b.title } });
    badges.push(existing ?? (await prisma.badge.create({ data: b })));
  }

  // 2) Static color themes (upsert by slug)
  logger.info("Seeding color themes (idempotent)...");
  const colorThemeInputs = [
    { name: "نعنای تازه", slug: "fresh-mint", hexCode: "#c5f4e5" },
    { name: "اسطوخودوس ملایم", slug: "soft-lavender", hexCode: "#e0d9fe" },
    { name: "صورتی رژگونه‌ای", slug: "blush-pink", hexCode: "#ffeef5" },
    { name: "هلویی ملایم", slug: "soft-peach", hexCode: "#FFDAB9" },
    { name: "آبی پودری", slug: "powder-blue", hexCode: "#D1E8FF" },
    { name: "جو دوسر گرم", slug: "warm-oat", hexCode: "#F3EAD3" },
    { name: "سنگ روشن", slug: "light-stone", hexCode: "#E5E4E2" },
  ];
  const colorThemes = await Promise.all(
    colorThemeInputs.map((d) =>
      prisma.colorTheme.upsert({
        where: { slug: d.slug },
        update: { name: d.name, hexCode: d.hexCode ?? null },
        create: d,
      })
    )
  );

  // 3) Users (idempotent by email)
  logger.info("Seeding users (idempotent)...");
  // Hash for "password123" (testing only)
  const testPasswordHash = "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW";

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "alimahmoodi7094@gmail.com" },
      update: {},
      create: {
        phone: "+989100000001",
        email: "alimahmoodi7094@gmail.com",
        passwordHash: testPasswordHash,
        firstName: "ادمین",
        lastName: "کاربر",
        gender: "MALE",
        customerTier: "VIP",
        role: "ADMIN",
        phoneVerifiedAt: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: "customer1@example.com" },
      update: {},
      create: {
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
    prisma.user.upsert({
      where: { email: "customer2@example.com" },
      update: {},
      create: {
        phone: "+989100000003",
        email: "customer2@example.com",
        passwordHash: testPasswordHash,
        firstName: "علی",
        lastName: "مرادی",
        gender: "MALE",
      },
    }),
    prisma.user.upsert({
      where: { email: "customer3@example.com" },
      update: {},
      create: {
        phone: "+989100000004",
        email: "customer3@example.com",
        passwordHash: testPasswordHash,
        firstName: "فاطمه",
        lastName: "کاظمی",
        gender: "FEMALE",
      },
    }),
    prisma.user.upsert({
      where: { email: "customer4@example.com" },
      update: {},
      create: {
        phone: "+989100000005",
        email: "customer4@example.com",
        passwordHash: testPasswordHash,
        firstName: "حسین",
        lastName: "اکبری",
        gender: "MALE",
      },
    }),
  ]);

  // Ensure notificationPrefs exist for all users
  await Promise.all(
    users.map((u) =>
      prisma.userNotificationPrefs.upsert({
        where: { userId: u.id },
        update: {},
        create: {
          userId: u.id,
          orderUpdates: true,
          promotions: true,
          newProducts: true,
          marketing: true,
        },
      })
    )
  );

  // 4) Brands (upsert by slug)
  logger.info("Seeding brands (idempotent)...");
  const brandInputs = [
    { name: "لوکس بیوتی", slug: "luxe-beauty" },
    { name: "درخشش طبیعی", slug: "natural-glow" },
    { name: "شیک شهری", slug: "urban-chic" },
    { name: "اسانس خالص", slug: "pure-essence" },
    { name: "رویای گل‌ها", slug: "floral-dreams" },
  ];
  const brands = await Promise.all(
    brandInputs.map((b) =>
      prisma.brand.upsert({
        where: { slug: b.slug },
        update: { name: b.name },
        create: b,
      })
    )
  );

  // 5) Collections (idempotent by name)
  logger.info("Seeding collections (idempotent)...");
  const collectionNames = [
    "کالکشن بهاری",
    "کالکشن تابستانی",
    "کالکشن پاییزی",
    "کالکشن زمستانی",
    "کالکشن ویژه",
  ];
  const collections = [];
  for (const name of collectionNames) {
    const existing = await prisma.collection.findFirst({ where: { name } });
    collections.push(existing ?? (await prisma.collection.create({ data: { name } })));
  }

  // 5.1) DB Categories (idempotent by value) for Product.categoryId
  logger.info("Seeding product categories (idempotent)...");
  const dbCategoryInputs = [
    {
      value: "skincare",
      label: "مراقبت از پوست",
      icon: "shield",
      heroImageUrl: "/assets/images/products/skin.png",
    },
    {
      value: "makeup",
      label: "آرایش",
      icon: "pen-tool",
      heroImageUrl: "/assets/images/products/cosmetic.png",
    },
    {
      value: "fragrance",
      label: "عطر",
      icon: "wind",
      heroImageUrl: "/assets/images/products/perfume.png",
    },
    {
      value: "haircare",
      label: "مراقبت از مو",
      icon: "git-branch",
      heroImageUrl: "/assets/images/products/hair.png",
    },
    {
      value: "body-bath",
      label: "بدن و حمام",
      icon: "droplet",
      heroImageUrl: "/assets/images/products/body.png",
    },
  ];
  const dbCategories = await Promise.all(
    dbCategoryInputs.map((c) =>
      prisma.category.upsert({
        where: { value: c.value },
        update: { label: c.label, icon: c.icon, heroImageUrl: c.heroImageUrl ?? null },
        create: c,
      })
    )
  );
  const catByValue = Object.fromEntries(dbCategories.map((c) => [c.value, c]));

  // 6) Products (upsert by slug; use categoryId per schema)
  logger.info("Seeding products (idempotent, schema-aligned)...");
  const products = await Promise.all([
    prisma.product.upsert({
      where: { slug: "velvet-matte-lipstick" },
      update: {},
      create: {
        brandId: brands[0].id,
        colorThemeId: colorThemes[3].id, // soft-peach
        collectionId: collections[4].id, // کالکشن ویژه
        categoryId: catByValue["makeup"].id,
        title: "رژ لب مات مخملی",
        subtitle: "ماندگاری بالا و احساس راحتی",
        slug: "velvet-matte-lipstick",
        description:
          "یک رژ لب مات انقلابی که لب‌ها را خشک نمی‌کند و پوششی کامل و مخملی ارائه می‌دهد.",
        ingredients: "ویتامین E، شی باتر، روغن جوجوبا",
        howToUse: "از مرکز لب شروع کرده و به سمت گوشه‌ها بکشید.",
        price: 450000,
        compareAtPrice: 550000,
        ratingAvg: "4.5",
        ratingCount: 125,
        isBestseller: true,
        isFeatured: true,
        isSpecialProduct: true,
        heroImageUrl: "/assets/images/products/cosmetic.png",
        images: {
          create: [
            {
              url: "/assets/images/products/cosmetic.png",
              alt: "نمای جلوی رژ لب",
              position: 0,
            },
            {
              url: "/assets/images/products/cosmetic.png",
              alt: "سوآچ‌های رژ لب",
              position: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              variantName: "قرمز یاقوتی",
              sku: "LIP-001-RR",
              colorName: "قرمز یاقوتی",
              colorHexCode: "#E0115F",
              stock: 50,
            },
            {
              variantName: "رز صورتی",
              sku: "LIP-001-PR",
              colorName: "رز صورتی",
              colorHexCode: "#FF69B4",
              stock: 30,
            },
            {
              variantName: "بژ نود",
              sku: "LIP-001-NB",
              colorName: "بژ نود",
              colorHexCode: "#F5DEB3",
              stock: 45,
            },
          ],
        },
        badges: { connect: [{ id: badges[1].id }, { id: badges[2].id }] },
      },
    }),
    prisma.product.upsert({
      where: { slug: "vitamin-c-brightening-serum" },
      update: {},
      create: {
        brandId: brands[1].id,
        colorThemeId: colorThemes[0].id, // fresh-mint
        collectionId: collections[0].id, // کالکشن بهاری
        categoryId: catByValue["skincare"].id,
        title: "سرم روشن‌کننده ویتامین C",
        subtitle: "درخشندگی در یک بطری",
        slug: "vitamin-c-brightening-serum",
        description:
          "سرم آنتی‌اکسیدان قوی برای پوستی درخشان و یکدست. به کاهش لک‌های تیره کمک می‌کند.",
        ingredients: "۲۰٪ ویتامین C، هیالورونیک اسید، ویتامین E",
        howToUse: "۲ تا ۳ قطره را صبح و شب روی پوست تمیز صورت بمالید.",
        price: 850000,
        ratingAvg: "4.8",
        ratingCount: 89,
        isFeatured: true,
        isSpecialProduct: true,
        heroImageUrl: "/assets/images/products/body.png",
        variants: {
          create: [
            { variantName: "۳۰ میل", sku: "SER-001-30", stock: 25 },
            { variantName: "۵۰ میل", sku: "SER-001-50", price: 1200000, stock: 15 },
          ],
        },
        badges: {
          connect: [{ id: badges[0].id }, { id: badges[1].id }, { id: badges[2].id }],
        },
      },
    }),
    prisma.product.upsert({
      where: { slug: "eyeshadow-palette-berry-sunset" },
      update: {},
      create: {
        brandId: brands[2].id,
        colorThemeId: colorThemes[1].id, // soft-lavender
        collectionId: collections[2].id, // کالکشن پاییزی
        categoryId: catByValue["makeup"].id,
        title: "پالت سایه چشم - غروب توت",
        slug: "eyeshadow-palette-berry-sunset",
        description: "۱۲ رنگ خیره‌کننده با الهام از رنگ‌های غروب آفتاب.",
        price: 980000,
        compareAtPrice: 1200000,
        ratingAvg: "4.6",
        ratingCount: 56,
        isSpecialProduct: true,
        images: {
          create: [
            { url: "/assets/images/products/skin.png", alt: "پالت سایه چشم", position: 0 },
          ],
        },
        variants: { create: [{ variantName: "پیش‌فرض", sku: "EYE-001", stock: 40 }] },
        badges: { connect: [{ id: badges[3].id }, { id: badges[2].id }] },
      },
    }),
    prisma.product.upsert({
      where: { slug: "pure-essence-eau-de-parfum" },
      update: {},
      create: {
        brandId: brands[3].id,
        colorThemeId: colorThemes[6].id, // light-stone
        collectionId: null,
        categoryId: catByValue["fragrance"].id,
        title: "ادو پارفوم اسانس خالص",
        subtitle: "رایحه‌ای عمیق و ماندگار",
        slug: "pure-essence-eau-de-parfum",
        description: "رایحه‌ای شیک و مدرن با نُت‌های چوبی و گلی.",
        price: 2500000,
        ratingAvg: "4.2",
        ratingCount: 21,
        isSpecialProduct: true,
        heroImageUrl: "/assets/images/products/perfume.png",
        images: {
          create: [{ url: "/assets/images/products/perfume.png", alt: "ادو پارفوم", position: 0 }],
        },
        variants: {
          create: [
            { variantName: "۵۰ میل", sku: "PER-001-50", stock: 20 },
            { variantName: "۱۰۰ میل", sku: "PER-001-100", price: 3800000, stock: 12 },
          ],
        },
        badges: { connect: [{ id: badges[1].id }, { id: badges[3].id }] },
      },
    }),
    prisma.product.upsert({
      where: { slug: "botanical-shampoo-nourish" },
      update: {},
      create: {
        brandId: brands[4].id,
        colorThemeId: colorThemes[2].id, // blush-pink
        collectionId: collections[1].id, // کالکشن تابستانی
        categoryId: catByValue["haircare"].id,
        title: "شامپوی گیاهی تقویت‌کننده",
        subtitle: "مغذی و بدون سولفات",
        slug: "botanical-shampoo-nourish",
        description: "تقویت موها با فرمولاسیون گیاهی و ملایم.",
        price: 600000,
        ratingAvg: "4.3",
        ratingCount: 34,
        heroImageUrl: "/assets/images/products/product.png",
        images: {
          create: [{ url: "/assets/images/products/product.png", alt: "شامپو گیاهی", position: 0 }],
        },
        variants: {
          create: [
            { variantName: "۳۰۰ میل", sku: "SHA-001-300", stock: 40 },
            { variantName: "۵۰۰ میل", sku: "SHA-001-500", price: 780000, stock: 25 },
          ],
        },
        badges: { connect: [{ id: badges[0].id }, { id: badges[3].id }] },
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
      { productId: products[1].id, relatedProductId: products[4].id, position: 1 },
      { productId: products[1].id, relatedProductId: products[0].id, position: 0 },
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
    skipDuplicates: true,
  });

  // 7) Product reviews (seed only once)
  logger.info("Seeding product reviews (only if empty)...");
  const existingReviews = await prisma.productReview.count();
  if (existingReviews === 0) {
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
  } else {
    logger.info("Skipping product reviews (already present)");
  }

  // 8) Coupons (upsert by code)
  logger.info("Seeding coupons (idempotent)...");
  await Promise.all([
    prisma.coupon.upsert({
      where: { code: "WELCOME20" },
      update: {},
      create: {
        code: "WELCOME20",
        type: "PERCENT",
        percentValue: 20,
        minSubtotal: 500000,
        maxUsesPerUser: 1,
        isActive: true,
      },
    }),
    prisma.coupon.upsert({
      where: { code: "FREESHIP" },
      update: {},
      create: {
        code: "FREESHIP",
        type: "FREE_SHIPPING",
        minSubtotal: 1000000,
        isActive: true,
      },
    }),
    prisma.coupon.upsert({
      where: { code: "SALE10" },
      update: {},
      create: {
        code: "SALE10",
        type: "PERCENT",
        percentValue: 10,
        minSubtotal: 300000,
        isActive: true,
      },
    }),
    prisma.coupon.upsert({
      where: { code: "FLAT50K" },
      update: {},
      create: {
        code: "FLAT50K",
        type: "AMOUNT",
        amountValue: 50000,
        minSubtotal: 250000,
        isActive: true,
      },
    }),
    prisma.coupon.upsert({
      where: { code: "VIP30" },
      update: {},
      create: {
        code: "VIP30",
        type: "PERCENT",
        percentValue: 30,
        minSubtotal: 2000000,
        maxUsesPerUser: 2,
        isActive: true,
      },
    }),
  ]);

  // 9) Magazine authors (upsert by slug)
  logger.info("Seeding magazine authors (idempotent)...");
  const authors = await Promise.all([
    prisma.magazineAuthor.upsert({
      where: { slug: "dr-sara-ahmadi" },
      update: {},
      create: {
        name: "دکتر سارا احمدی",
        slug: "dr-sara-ahmadi",
        bio: "متخصص پوست با ۱۵ سال تجربه در مراقبت از پوست",
        avatarUrl: "/assets/images/authors/sara-ahmadi.jpg",
      },
    }),
    prisma.magazineAuthor.upsert({
      where: { slug: "maryam-rezaei" },
      update: {},
      create: {
        name: "مریم رضایی",
        slug: "maryam-rezaei",
        bio: "میکاپ آرتیست حرفه‌ای",
        avatarUrl: "/assets/images/authors/maryam-rezaei.jpg",
      },
    }),
    prisma.magazineAuthor.upsert({
      where: { slug: "beauty-team" },
      update: {},
      create: {
        name: "تیم بیوتی",
        slug: "beauty-team",
        bio: "تیم متخصصان زیبایی",
        avatarUrl: "/assets/images/authors/sara-ahmadi.jpg",
      },
    }),
    prisma.magazineAuthor.upsert({
      where: { slug: "ali-moradi" },
      update: {},
      create: {
        name: "علی مرادی",
        slug: "ali-moradi",
        bio: "نویسنده و پژوهشگر حوزه زیبایی",
        avatarUrl: "/assets/images/authors/maryam-rezaei.jpg",
      },
    }),
    prisma.magazineAuthor.upsert({
      where: { slug: "niloofar-rahimi" },
      update: {},
      create: {
        name: "نیلوفر رحیمی",
        slug: "niloofar-rahimi",
        bio: "کارشناس مراقبت مو",
        avatarUrl: "/assets/images/authors/maryam-rezaei.jpg",
      },
    }),
  ]);

  // 10) Magazine tags (upsert by slug)
  logger.info("Seeding magazine tags (idempotent)...");
  const tags = await Promise.all([
    prisma.magazineTag.upsert({
      where: { slug: "skincare-routine" },
      update: { name: "روتین مراقبت از پوست" },
      create: { name: "روتین مراقبت از پوست", slug: "skincare-routine" },
    }),
    prisma.magazineTag.upsert({
      where: { slug: "makeup-tips" },
      update: { name: "نکات آرایشی" },
      create: { name: "نکات آرایشی", slug: "makeup-tips" },
    }),
    prisma.magazineTag.upsert({
      where: { slug: "anti-aging" },
      update: { name: "ضد پیری" },
      create: { name: "ضد پیری", slug: "anti-aging" },
    }),
    prisma.magazineTag.upsert({
      where: { slug: "natural-beauty" },
      update: { name: "زیبایی طبیعی" },
      create: { name: "زیبایی طبیعی", slug: "natural-beauty" },
    }),
    prisma.magazineTag.upsert({
      where: { slug: "summer-beauty" },
      update: { name: "زیبایی در تابستان" },
      create: { name: "زیبایی در تابستان", slug: "summer-beauty" },
    }),
  ]);

  // 10.1) Magazine categories (MODEL) - upsert by code
  logger.info("Seeding magazine categories (idempotent)...");
  const magCatInputs = [
    { code: "GUIDE", name: "راهنما", slug: "guide" },
    { code: "TUTORIAL", name: "آموزش", slug: "tutorial" },
    { code: "TRENDS", name: "ترندها", slug: "trends" },
    { code: "LIFESTYLE", name: "لایف‌استایل", slug: "lifestyle" },
    { code: "GENERAL", name: "عمومی", slug: "general" },
  ];
  const magCategories = await Promise.all(
    magCatInputs.map((c) =>
      prisma.magazineCategory.upsert({
        where: { code: c.code },
        update: { name: c.name, slug: c.slug },
        create: c,
      })
    )
  );
  const catByCode = Object.fromEntries(magCategories.map((c) => [c.code, c]));

  // 11) Magazine posts (upsert by slug; use categoryId)
  logger.info("Seeding magazine posts (idempotent)...");
  const posts = await Promise.all([
    prisma.magazinePost.upsert({
      where: { slug: "ultimate-10-step-korean-skincare-routine" },
      update: {},
      create: {
        authorId: authors[0].id,
        categoryId: catByCode["GUIDE"].id,
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
    prisma.magazinePost.upsert({
      where: { slug: "5-minute-makeup-tutorial" },
      update: {},
      create: {
        authorId: authors[1].id,
        categoryId: catByCode["TUTORIAL"].id,
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
    prisma.magazinePost.upsert({
      where: { slug: "2024-beauty-trends" },
      update: {},
      create: {
        authorId: authors[0].id,
        categoryId: catByCode["TRENDS"].id,
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
    prisma.magazinePost.upsert({
      where: { slug: "self-care-sunday-pamper-routine" },
      update: {},
      create: {
        authorId: authors[2].id,
        categoryId: catByCode["GENERAL"].id,
        title: "یکشنبه‌ی مراقبت از خود",
        slug: "self-care-sunday-pamper-routine",
        excerpt: "یکشنبه‌ی خود را به یک روز اسپای لوکس تبدیل کنید",
        content: `
# روتین یکشنبه
...`,
        heroImageUrl: "/assets/images/magazine/article4.png",
        readTimeMinutes: 6,
        publishedAt: new Date("2024-01-25"),
        tags: { create: [{ tagId: tags[3].id }] },
      },
    }),
    prisma.magazinePost.upsert({
      where: { slug: "summer-haircare-guide" },
      update: {},
      create: {
        authorId: authors[4].id,
        categoryId: catByCode["GUIDE"].id,
        title: "راهنمای مراقبت از مو در تابستان",
        slug: "summer-haircare-guide",
        excerpt: "چطور موها را در تابستان سالم نگه داریم",
        content: `
# مراقبت از مو در تابستان
...`,
        heroImageUrl: "/assets/images/magazine/article4.png",
        readTimeMinutes: 7,
        publishedAt: new Date("2024-01-30"),
        tags: { create: [{ tagId: tags[4].id }] },
      },
    }),
  ]);

  // 12) Related posts (skip duplicates)
  logger.info("Seeding related magazine posts...");
  await prisma.magazineRelatedPost.createMany({
    data: [
      { postId: posts[0].id, relatedPostId: posts[2].id },
      { postId: posts[1].id, relatedPostId: posts[3].id },
      { postId: posts[2].id, relatedPostId: posts[4].id },
    ],
    skipDuplicates: true,
  });

  // 13) Site settings (upsert by key)
  logger.info("Seeding site settings (idempotent)...");
  await Promise.all([
    prisma.siteSetting.upsert({
      where: { key: "shipping_rates" },
      update: {
        value: {
          standard: { price: 50000, days: "۳-۵" },
          express: { price: 100000, days: "۱-۲" },
        },
        description: "نرخ‌های ارسال و زمان تحویل",
      },
      create: {
        key: "shipping_rates",
        value: {
          standard: { price: 50000, days: "۳-۵" },
          express: { price: 100000, days: "۱-۲" },
        },
        description: "نرخ‌های ارسال و زمان تحویل",
      },
    }),
    prisma.siteSetting.upsert({
      where: { key: "homepage_banners" },
      update: {
        value: {
          hero: {
            title: "سال نو، زیبایی نو",
            subtitle: "جدیدترین کالکشن ما را کشف کنید",
            imageUrl: "/assets/images/hero.png",
            ctaText: "اکنون خرید کنید",
            ctaUrl: "/shop",
          },
        },
        description: "پیکربندی بنرهای صفحه اصلی",
      },
      create: {
        key: "homepage_banners",
        value: {
          hero: {
            title: "سال نو، زیبایی نو",
            subtitle: "جدیدترین کالکشن ما را کشف کنید",
            imageUrl: "/assets/images/hero.png",
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