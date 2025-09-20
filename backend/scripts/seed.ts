
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
        firstName: "Admin",
        lastName: "User",
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
        firstName: "Sarah",
        lastName: "Johnson",
        gender: 'FEMALE',
        birthDate: new Date("1990-05-15"),
        phoneVerifiedAt: new Date(),
      },
    }),
  ]);

  // Create brands
  const brands = await Promise.all([
    prisma.brand.create({ data: { name: "Luxe Beauty", slug: "luxe-beauty" } }),
    prisma.brand.create({ data: { name: "Natural Glow", slug: "natural-glow" } }),
    prisma.brand.create({ data: { name: "Urban Chic", slug: "urban-chic" } }),
    prisma.brand.create({ data: { name: "Pure Essence", slug: "pure-essence" } }),
  ]);

  // Create color themes
  const colorThemes = await Promise.all([
    prisma.colorTheme.create({ data: { name: "Nude Collection", slug: "nude-collection", hexCode: "#F5DEB3" } }),
    prisma.colorTheme.create({ data: { name: "Berry Tones", slug: "berry-tones", hexCode: "#8B0051" } }),
    prisma.colorTheme.create({ data: { name: "Coral Dreams", slug: "coral-dreams", hexCode: "#FF7F50" } }),
    prisma.colorTheme.create({ data: { name: "Classic Reds", slug: "classic-reds", hexCode: "#DC143C" } }),
  ]);

  // Create collections
  const collections = await Promise.all([
    prisma.collection.create({
      data: {
        slug: "valentines-special",
        title: "Valentine's Special",
        description: "Romance your beauty routine with our curated Valentine's collection",
        isActive: true,
      },
    }),
    prisma.collection.create({
      data: {
        slug: "summer-essentials",
        title: "Summer Essentials",
        description: "Stay fresh and glowing all summer long",
        isActive: true,
      },
    }),
  ]);

  // Create products with images and variants
  const products = await Promise.all([
    prisma.product.create({
      data: {
        brandId: brands[0].id,
        colorThemeId: colorThemes[0].id,
        category: 'MAKEUP',
        title: "Velvet Matte Lipstick",
        subtitle: "Long-lasting comfort",
        slug: "velvet-matte-lipstick",
        description: "A revolutionary matte lipstick that doesn't dry your lips",
        ingredients: "Vitamin E, Shea Butter, Jojoba Oil",
        howToUse: "Apply directly to lips starting from the center",
        price: 450000,
        compareAtPrice: 550000,
        ratingAvg: 4.5,
        ratingCount: 125,
        isBestseller: true,
        isFeatured: true,
        heroImageUrl: "/images/products/lipstick-hero.jpg",
        images: {
          create: [
            { url: "/images/products/lipstick-1.jpg", alt: "Lipstick front view", position: 0 },
            { url: "/images/products/lipstick-2.jpg", alt: "Lipstick swatches", position: 1 },
          ],
        },
        variants: {
          create: [
            { variantName: "Ruby Red", sku: "LIP-001-RR", colorName: "Ruby Red", colorHexCode: "#E0115F", stock: 50 },
            { variantName: "Pink Rose", sku: "LIP-001-PR", colorName: "Pink Rose", colorHexCode: "#FF69B4", stock: 30 },
            { variantName: "Nude Beige", sku: "LIP-001-NB", colorName: "Nude Beige", colorHexCode: "#F5DEB3", stock: 45 },
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
        title: "Vitamin C Brightening Serum",
        subtitle: "Radiance in a bottle",
        slug: "vitamin-c-brightening-serum",
        description: "Powerful antioxidant serum for glowing skin",
        ingredients: "20% Vitamin C, Hyaluronic Acid, Vitamin E",
        howToUse: "Apply 2-3 drops to clean face morning and evening",
        price: 850000,
        ratingAvg: 4.8,
        ratingCount: 89,
        isFeatured: true,
        heroImageUrl: "/images/products/serum-hero.jpg",
        variants: {
          create: [
            { variantName: "30ml", sku: "SER-001-30", stock: 25 },
            { variantName: "50ml", sku: "SER-001-50", price: 1200000, stock: 15 },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        brandId: brands[2].id,
        colorThemeId: colorThemes[1].id,
        category: 'MAKEUP',
        title: "Eyeshadow Palette - Berry Sunset",
        slug: "eyeshadow-palette-berry-sunset",
        description: "12 stunning shades inspired by sunset colors",
        price: 980000,
        compareAtPrice: 1200000,
        ratingAvg: 4.6,
        ratingCount: 56,
        isSpecialProduct: true,
        variants: {
          create: [
            { variantName: "Default", sku: "EYE-001", stock: 40 },
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
        title: "Perfect matte finish!",
        body: "This lipstick is amazing! It stays on all day without drying my lips.",
        status: "APPROVED",
      },
    }),
    prisma.productReview.create({
      data: {
        productId: products[1].id,
        guestName: "Anonymous",
        rating: 4,
        body: "Great serum, saw results in 2 weeks",
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
        name: "Dr. Emma Watson",
        slug: "dr-emma-watson",
        bio: "Board-certified dermatologist with 15 years of experience in skincare",
        avatarUrl: "/images/authors/emma-watson.jpg",
      },
    }),
    prisma.magazineAuthor.create({
      data: {
        name: "Sophia Chen",
        slug: "sophia-chen",
        bio: "Professional makeup artist and beauty influencer",
        avatarUrl: "/images/authors/sophia-chen.jpg",
      },
    }),
    prisma.magazineAuthor.create({
      data: {
        name: "Beauty Team",
        slug: "beauty-team",
        bio: "Our expert team of beauty professionals",
      },
    }),
  ]);

  // Create magazine tags
  const tags = await Promise.all([
    prisma.magazineTag.create({ data: { name: "Skincare Routine", slug: "skincare-routine" } }),
    prisma.magazineTag.create({ data: { name: "Makeup Tips", slug: "makeup-tips" } }),
    prisma.magazineTag.create({ data: { name: "Anti-Aging", slug: "anti-aging" } }),
    prisma.magazineTag.create({ data: { name: "Natural Beauty", slug: "natural-beauty" } }),
    prisma.magazineTag.create({ data: { name: "Summer Beauty", slug: "summer-beauty" } }),
    prisma.magazineTag.create({ data: { name: "K-Beauty", slug: "k-beauty" } }),
  ]);

  // Create magazine posts
  const posts = await Promise.all([
    prisma.magazinePost.create({
      data: {
        authorId: authors[0].id,
        category: 'GUIDE',
        title: "The Ultimate 10-Step Korean Skincare Routine",
        slug: "ultimate-10-step-korean-skincare-routine",
        excerpt: "Discover the secrets behind flawless Korean skin with our comprehensive guide",
        content: `
# The Ultimate 10-Step Korean Skincare Routine

Korean skincare has taken the beauty world by storm, and for good reason. The meticulous attention to hydration, gentle ingredients, and layering techniques can transform your skin...

## Step 1: Oil Cleanser
Start your routine with an oil-based cleanser to remove makeup and sunscreen...

## Step 2: Water-Based Cleanser
Follow up with a gentle foam or gel cleanser...

[Content continues...]
        `,
        heroImageUrl: "/images/magazine/korean-skincare-hero.jpg",
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
        title: "5 Minute Makeup: Get Ready Fast Without Compromising Style",
        slug: "5-minute-makeup-tutorial",
        excerpt: "Master the art of quick makeup application with these time-saving techniques",
        content: `
# 5 Minute Makeup Tutorial

We all have those mornings when time is not on our side. Here's how to look polished in just 5 minutes...

## The Essential Products
- Tinted moisturizer or BB cream
- Cream blush
- Mascara
- Tinted lip balm
- Setting spray

[Tutorial steps...]
        `,
        heroImageUrl: "/images/magazine/quick-makeup-hero.jpg",
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
        title: "2024 Beauty Trends: What's Hot This Year",
        slug: "2024-beauty-trends",
        excerpt: "From glossy skin to bold lips, discover the beauty trends dominating 2024",
        content: `
# 2024 Beauty Trends

This year is all about embracing natural beauty with a twist. Here are the top trends...

## 1. Glass Skin
The Korean beauty trend continues to influence global beauty...

## 2. Berry-Stained Lips
Move over nude lips, berry tones are having a moment...

[More trends...]
        `,
        heroImageUrl: "/images/magazine/2024-trends-hero.jpg",
        readTimeMinutes: 8,
        publishedAt: new Date("2024-01-10"),
      },
    }),
    prisma.magazinePost.create({
      data: {
        authorId: authors[2].id,
        category: 'LIFESTYLE',
        title: "Self-Care Sunday: Creating Your Perfect Pamper Routine",
        slug: "self-care-sunday-pamper-routine",
        excerpt: "Transform your Sunday into a luxurious spa day at home",
        content: `
# Self-Care Sunday Routine

Taking time for yourself isn't selfish—it's essential. Here's how to create the perfect Sunday pamper session...

## Morning Ritual
Start with a gentle yoga session or meditation...

## The Perfect Bath
Add epsom salts, essential oils, and light some candles...

[Content continues...]
        `,
        heroImageUrl: "/images/magazine/self-care-hero.jpg",
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
          standard: { price: 50000, days: "3-5" },
          express: { price: 100000, days: "1-2" },
        },
        description: "Shipping rates and delivery times",
      },
    }),
    prisma.siteSetting.create({
      data: {
        key: "homepage_banners",
        value: {
          hero: {
            title: "New Year, New Beauty",
            subtitle: "Discover our latest collection",
            imageUrl: "/images/banners/hero-banner.jpg",
            ctaText: "Shop Now",
            ctaUrl: "/shop",
          },
        },
        description: "Homepage banner configuration",
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