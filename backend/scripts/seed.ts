// scripts/seed.ts
// Seeds sample data: brands, color themes, products (with images/variants),
// coupons, and a couple of collections.
// Usage:
//  - ts-node scripts/seed.ts
//  - or add to package.json: "seed": "ts-node scripts/seed.ts"

import path from "path";
import dotenv from "dotenv";
import { prisma } from "../src/infrastructure/db/prismaClient";
import { logger } from "../src/config/logger";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

type BrandSeed = { name: string; slug: string };
type ThemeSeed = { name: string; slug: string; hexCode?: string | null };
type ProductSeed = {
  title: string;
  slug: string;
  brandSlug: string;
  category: "skincare" | "makeup" | "fragrance" | "haircare" | "body-bath";
  price: number;
  compareAtPrice?: number | null;
  isBestseller?: boolean;
  isFeatured?: boolean;
  isSpecialProduct?: boolean;
  heroImageUrl?: string | null;
  colorThemeSlug?: string | null;
  images?: Array<{ url: string; alt?: string | null }>;
  variants?: Array<{ variantName: string; price?: number | null; sku?: string | null; stock?: number }>;
};

const brands: BrandSeed[] = [
  { name: "LuxeElixir", slug: "luxeelixir" },
  { name: "Aetheria", slug: "aetheria" },
  { name: "Celeste", slug: "celeste" },
  { name: "Solstice Glow", slug: "solstice-glow" },
];

const themes: ThemeSeed[] = [
  { name: "Pastels", slug: "pastels", hexCode: "#e9d5ff" },
  { name: "Warm Tones", slug: "warm-tones", hexCode: "#fbbf24" },
];

const products: ProductSeed[] = [
  {
    title: "اکسیر درخشش طلایی",
    slug: "golden-glow-serum",
    brandSlug: "luxeelixir",
    category: "skincare",
    price: 480_000,
    compareAtPrice: 560_000,
    isBestseller: true,
    isFeatured: true,
    isSpecialProduct: true,
    heroImageUrl: "/assets/images/product.png",
    colorThemeSlug: "pastels",
    images: [
      { url: "/assets/images/product.png", alt: "serum main" },
      { url: "/assets/images/skin.png", alt: "serum detail" },
    ],
    variants: [
      { variantName: "30ml", price: 480_000, sku: "GLW-30", stock: 25 },
      { variantName: "50ml", price: 640_000, sku: "GLW-50", stock: 18 },
    ],
  },
  {
    title: "بوسه مخملی مات",
    slug: "velvet-matte-lipstick",
    brandSlug: "celeste",
    category: "makeup",
    price: 320_000,
    heroImageUrl: "/assets/images/cosmetic.png",
    images: [
      { url: "/assets/images/cosmetic.png", alt: "lipstick" },
    ],
    variants: [
      { variantName: "Shade 03", price: 320_000, sku: "VLM-03", stock: 60 },
      { variantName: "Shade 07", price: 320_000, sku: "VLM-07", stock: 40 },
    ],
  },
  {
    title: "راز نیمه‌شب",
    slug: "midnight-secret-perfume",
    brandSlug: "solstice-glow",
    category: "fragrance",
    price: 780_000,
    isFeatured: true,
    heroImageUrl: "/assets/images/perfume.png",
    colorThemeSlug: "warm-tones",
    images: [
      { url: "/assets/images/perfume.png", alt: "perfume" },
    ],
    variants: [
      { variantName: "30ml", price: 520_000, sku: "MID-30", stock: 30 },
      { variantName: "50ml", price: 780_000, sku: "MID-50", stock: 20 },
    ],
  },
  {
    title: "ماسک موی کراتینه",
    slug: "keratin-hair-mask",
    brandSlug: "solstice-glow",
    category: "haircare",
    price: 380_000,
    heroImageUrl: "/assets/images/hair.png",
    images: [{ url: "/assets/images/hair.png", alt: "hair mask" }],
    variants: [{ variantName: "200ml", price: 380_000, sku: "KHM-200", stock: 45 }],
  },
];

const coupons = [
  {
    code: "KOALAW10",
    type: "percent" as const,
    percentValue: 10,
    minSubtotal: 0,
    isActive: true,
  },
  {
    code: "WELCOME15",
    type: "percent" as const,
    percentValue: 15,
    minSubtotal: 400_000,
    isActive: true,
  },
  {
    code: "FREESHIP",
    type: "free_shipping" as const,
    minSubtotal: 0,
    isActive: true,
  },
];

const collections = [
  { slug: "spring", title: "کالکشن بهاری", description: "طراوت بهاری در محصولات منتخب" },
  { slug: "valentine", title: "کالکشن ولنتاین", description: "هدیه‌های عاشقانه" },
];

async function upsertBrands() {
  for (const b of brands) {
    await prisma.brand.upsert({
      where: { slug: b.slug },
      create: { name: b.name, slug: b.slug },
      update: { name: b.name },
    });
  }
  const count = await prisma.brand.count();
  logger.info({ count }, "Brands upserted");
}

async function upsertThemes() {
  for (const t of themes) {
    await prisma.colorTheme.upsert({
      where: { slug: t.slug },
      create: { name: t.name, slug: t.slug, hexCode: t.hexCode || null },
      update: { name: t.name, hexCode: t.hexCode || null },
    });
  }
  const count = await prisma.colorTheme.count();
  logger.info({ count }, "Color themes upserted");
}

async function seedProducts() {
  for (const p of products) {
    const brand = await prisma.brand.findUnique({ where: { slug: p.brandSlug } });
    if (!brand) {
      logger.warn({ brandSlug: p.brandSlug }, "Brand missing for product; skipping");
      continue;
    }
    const theme = p.colorThemeSlug
      ? await prisma.colorTheme.findUnique({ where: { slug: p.colorThemeSlug } })
      : null;

    const created = await prisma.product.upsert({
      where: { slug: p.slug },
      create: {
        title: p.title,
        subtitle: null,
        slug: p.slug,
        category: p.category,
        brand: { connect: { id: brand.id } },
        colorTheme: theme ? { connect: { id: theme.id } } : undefined,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        currencyCode: "IRR",
        isBestseller: !!p.isBestseller,
        isFeatured: !!p.isFeatured,
        isSpecialProduct: !!p.isSpecialProduct,
        isActive: true,
        ratingAvg: 0,
        ratingCount: 0,
        heroImageUrl: p.heroImageUrl ?? null,
      },
      update: {
        title: p.title,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        category: p.category,
        heroImageUrl: p.heroImageUrl ?? null,
        brand: { connect: { id: brand.id } },
        colorTheme: theme ? { connect: { id: theme.id } } : { disconnect: true },
        isBestseller: !!p.isBestseller,
        isFeatured: !!p.isFeatured,
        isSpecialProduct: !!p.isSpecialProduct,
        isActive: true,
      },
    });

    // Replace images
    if (p.images && p.images.length) {
      await prisma.$transaction(async (tx) => {
        await tx.productImage.deleteMany({ where: { productId: created.id } });
        await tx.productImage.createMany({
          data: p.images.map((img, idx) => ({
            productId: created.id,
            url: img.url,
            alt: img.alt || null,
            position: idx,
          })),
        });
      });
    }

    // Replace variants
    if (p.variants && p.variants.length) {
      await prisma.$transaction(async (tx) => {
        await tx.productVariant.deleteMany({ where: { productId: created.id } });
        await tx.productVariant.createMany({
          data: p.variants.map((v, idx) => ({
            productId: created.id,
            variantName: v.variantName,
            sku: v.sku || null,
            price: typeof v.price === "number" ? v.price : null,
            currencyCode: "IRR",
            stock: typeof v.stock === "number" ? v.stock : 0,
            isActive: true,
            position: idx,
          })),
        });
      });
    }
  }

  const count = await prisma.product.count();
  const vcount = await prisma.productVariant.count();
  const icount = await prisma.productImage.count();
  logger.info({ products: count, variants: vcount, images: icount }, "Products seeded");
}

async function upsertCoupons() {
  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      create: {
        code: c.code,
        type: c.type as any,
        percentValue: (c as any).percentValue ?? null,
        amountValue: (c as any).amountValue ?? null,
        minSubtotal: c.minSubtotal,
        isActive: c.isActive,
      },
      update: {
        type: c.type as any,
        percentValue: (c as any).percentValue ?? null,
        amountValue: (c as any).amountValue ?? null,
        minSubtotal: c.minSubtotal,
        isActive: c.isActive,
      },
    });
  }
  const count = await prisma.coupon.count();
  logger.info({ count }, "Coupons upserted");
}

async function seedCollections() {
  for (const c of collections) {
    await prisma.collection.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, title: c.title, description: c.description || null, isActive: true },
      update: { title: c.title, description: c.description || null, isActive: true },
    });
  }

  // Link some products to collections
  const spring = await prisma.collection.findUnique({ where: { slug: "spring" } });
  const val = await prisma.collection.findUnique({ where: { slug: "valentine" } });
  const serum = await prisma.product.findUnique({ where: { slug: "golden-glow-serum" } });
  const lipstick = await prisma.product.findUnique({ where: { slug: "velvet-matte-lipstick" } });
  const perfume = await prisma.product.findUnique({ where: { slug: "midnight-secret-perfume" } });

  if (spring && serum && lipstick) {
    await prisma.collectionProducts.upsert({
      where: { collectionId_productId: { collectionId: spring.id, productId: serum.id } } as any,
      create: { collectionId: spring.id, productId: serum.id, position: 0 },
      update: {},
    });
    await prisma.collectionProducts.upsert({
      where: { collectionId_productId: { collectionId: spring.id, productId: lipstick.id } } as any,
      create: { collectionId: spring.id, productId: lipstick.id, position: 1 },
      update: {},
    });
  }
  if (val && perfume) {
    await prisma.collectionProducts.upsert({
      where: { collectionId_productId: { collectionId: val.id, productId: perfume.id } } as any,
      create: { collectionId: val.id, productId: perfume.id, position: 0 },
      update: {},
    });
  }

  const ccount = await prisma.collection.count();
  const lcount = await prisma.collectionProducts.count();
  logger.info({ collections: ccount, links: lcount }, "Collections seeded");
}

async function main() {
  logger.info("Seeding database…");
  await upsertBrands();
  await upsertThemes();
  await seedProducts();
  await upsertCoupons();
  await seedCollections();
  logger.info("Seeding completed.");
}

main()
  .catch((e) => {
    logger.error({ err: e }, "Seed failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });