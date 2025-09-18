-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enums
CREATE TYPE gender_enum            AS ENUM ('male','female','other','undisclosed');
CREATE TYPE product_category_enum  AS ENUM ('skincare','makeup','fragrance','haircare','body-bath');
CREATE TYPE order_status_enum      AS ENUM ('draft','awaiting_payment','paid','processing','shipped','delivered','cancelled','returned');
CREATE TYPE payment_method_enum    AS ENUM ('gateway','cod');
CREATE TYPE payment_status_enum    AS ENUM ('pending','paid','failed','refunded');
CREATE TYPE shipping_method_enum   AS ENUM ('standard','express');
CREATE TYPE coupon_type_enum       AS ENUM ('percent','amount','free_shipping');
CREATE TYPE review_status_enum     AS ENUM ('pending','approved','rejected');
CREATE TYPE magazine_category_enum AS ENUM ('guide','tutorial','trends','lifestyle');
CREATE TYPE customer_tier_enum     AS ENUM ('standard','vip');
CREATE TYPE cart_status_enum       AS ENUM ('active','converted','abandoned');
CREATE TYPE otp_purpose_enum       AS ENUM ('login','verify','reset');

-- Users
CREATE TABLE users (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone             varchar(20) NOT NULL UNIQUE,
  email             citext UNIQUE,
  first_name        varchar(100),
  last_name         varchar(100),
  birth_date        date,
  gender            gender_enum NOT NULL DEFAULT 'undisclosed',
  customer_tier     customer_tier_enum NOT NULL DEFAULT 'standard',
  phone_verified_at timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- User notification preferences
CREATE TABLE user_notification_prefs (
  user_id          uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  order_updates    boolean NOT NULL DEFAULT true,
  promotions       boolean NOT NULL DEFAULT true,
  new_products     boolean NOT NULL DEFAULT true,
  marketing        boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- OTP codes (phone login)
CREATE TABLE otp_codes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         varchar(20) NOT NULL,
  purpose       otp_purpose_enum NOT NULL,
  code          varchar(10) NOT NULL,
  attempts      smallint NOT NULL DEFAULT 0,
  max_attempts  smallint NOT NULL DEFAULT 5,
  expires_at    timestamptz NOT NULL,
  consumed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (phone, purpose, code)
);

-- Brands
CREATE TABLE brands (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  slug        text NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Products
CREATE TABLE products (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id             uuid NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  category             product_category_enum NOT NULL,
  title                text NOT NULL,
  subtitle             text,
  slug                 text NOT NULL UNIQUE,
  description          text,
  ingredients          text,
  how_to_use           text,
  price                integer NOT NULL,
  compare_at_price     integer,
  currency_code        char(3) NOT NULL DEFAULT 'IRR',
  rating_avg           numeric(3,2) NOT NULL DEFAULT 0.00,
  rating_count         integer NOT NULL DEFAULT 0,
  is_bestseller        boolean NOT NULL DEFAULT false,
  is_featured          boolean NOT NULL DEFAULT false,
  is_special_product   boolean NOT NULL DEFAULT false,
  is_active            boolean NOT NULL DEFAULT true,
  hero_image_url       text,
  internal_notes       text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_category_price ON products(category, price);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_title_trgm ON products USING gin (title gin_trgm_ops);

-- Product images
CREATE TABLE product_images (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        text NOT NULL,
  alt        text,
  position   integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, position)
);

-- Product variants (simple)
CREATE TABLE product_variants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name    text NOT NULL,
  sku             text UNIQUE,
  price           integer,
  currency_code   char(3) NOT NULL DEFAULT 'IRR',
  stock           integer NOT NULL DEFAULT 0,
  color_name      text,
  color_hex_code  char(7),
  is_active       boolean NOT NULL DEFAULT true,
  position        integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, variant_name)
);

-- Product reviews
CREATE TABLE product_reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  rating      smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title       text,
  body        text NOT NULL,
  guest_name  text,
  status      review_status_enum NOT NULL DEFAULT 'pending',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR guest_name IS NOT NULL)
);
CREATE INDEX idx_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_reviews_status ON product_reviews(status);

-- Collections
CREATE TABLE collections (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text NOT NULL UNIQUE,
  title          text NOT NULL,
  description    text,
  hero_image_url text,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Junction table: products <-> collections
CREATE TABLE collection_products (
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position      integer NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, product_id)
);

-- Related products (self-relation)
CREATE TABLE related_products (
  product_id         uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  related_product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position           integer NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, related_product_id),
  CHECK (product_id <> related_product_id)
);
CREATE INDEX idx_related_products_product_id ON related_products(product_id);

-- Carts
CREATE TABLE carts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES users(id) ON DELETE SET NULL,
  anonymous_id   uuid UNIQUE,
  status         cart_status_enum NOT NULL DEFAULT 'active',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_carts_one_active_per_user ON carts(user_id) WHERE status = 'active';

CREATE TABLE cart_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id       uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id    uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  title         text NOT NULL,
  variant_name  text,
  unit_price    integer NOT NULL,
  quantity      integer NOT NULL CHECK (quantity >= 1),
  line_total    integer NOT NULL,
  currency_code char(3) NOT NULL DEFAULT 'IRR',
  image_url     text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

-- Orders
CREATE TABLE orders (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number             text NOT NULL UNIQUE,
  user_id                  uuid REFERENCES users(id) ON DELETE SET NULL,
  status                   order_status_enum NOT NULL DEFAULT 'awaiting_payment',
  shipping_method          shipping_method_enum NOT NULL DEFAULT 'standard',
  payment_method           payment_method_enum NOT NULL DEFAULT 'gateway',
  coupon_code              text,
  gift_wrap                boolean NOT NULL DEFAULT false,
  note                     text,
  subtotal                 integer NOT NULL DEFAULT 0,
  discount_total           integer NOT NULL DEFAULT 0,
  shipping_total           integer NOT NULL DEFAULT 0,
  gift_wrap_total          integer NOT NULL DEFAULT 0,
  total                    integer NOT NULL DEFAULT 0,
  currency_code            char(3) NOT NULL DEFAULT 'IRR',
  shipping_first_name      text NOT NULL,
  shipping_last_name       text NOT NULL,
  shipping_phone           text NOT NULL,
  shipping_postal_code     text,
  shipping_province        text NOT NULL,
  shipping_city            text NOT NULL,
  shipping_address_line1   text NOT NULL,
  shipping_address_line2   text,
  shipping_country         char(2) NOT NULL DEFAULT 'IR',
  placed_at                timestamptz NOT NULL DEFAULT now(),
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders(status);

CREATE TABLE order_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    uuid REFERENCES products(id) ON DELETE SET NULL,
  variant_id    uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  title         text NOT NULL,
  variant_name  text,
  unit_price    integer NOT NULL,
  quantity      integer NOT NULL CHECK (quantity >= 1),
  line_total    integer NOT NULL,
  currency_code char(3) NOT NULL DEFAULT 'IRR',
  image_url     text,
  position      integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

CREATE TABLE payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method          payment_method_enum NOT NULL,
  status          payment_status_enum NOT NULL DEFAULT 'pending',
  amount          integer NOT NULL,
  currency_code   char(3) NOT NULL DEFAULT 'IRR',
  authority       text,
  transaction_ref text,
  paid_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE UNIQUE INDEX ux_one_paid_payment_per_order ON payments(order_id) WHERE status = 'paid';

-- Coupons
CREATE TABLE coupons (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code              text NOT NULL UNIQUE,
  type              coupon_type_enum NOT NULL,
  percent_value     integer CHECK (percent_value BETWEEN 1 AND 100),
  amount_value      integer,
  min_subtotal      integer NOT NULL DEFAULT 0,
  max_uses          integer,
  max_uses_per_user integer,
  starts_at         timestamptz,
  ends_at           timestamptz,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (type = 'percent'::coupon_type_enum AND percent_value IS NOT NULL AND amount_value IS NULL) OR
    (type = 'amount'::coupon_type_enum AND amount_value IS NOT NULL AND percent_value IS NULL) OR
    (type = 'free_shipping'::coupon_type_enum AND percent_value IS NULL AND amount_value IS NULL)
  )
);
CREATE INDEX idx_coupons_window ON coupons(starts_at, ends_at);

CREATE TABLE coupon_redemptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id   uuid NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  order_id    uuid REFERENCES orders(id) ON DELETE SET NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, order_id)
);
CREATE INDEX idx_coupon_redemptions_user ON coupon_redemptions(coupon_id, user_id);

-- User addresses
CREATE TABLE user_addresses (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label          text,
  first_name     text NOT NULL,
  last_name      text NOT NULL,
  phone          text NOT NULL,
  postal_code    text,
  province       text NOT NULL,
  city           text NOT NULL,
  address_line1  text NOT NULL,
  address_line2  text,
  country        char(2) NOT NULL DEFAULT 'IR',
  is_default     boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_user_addresses_default ON user_addresses(user_id) WHERE is_default;

-- Newsletter subscriptions
CREATE TABLE newsletter_subscriptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           citext NOT NULL UNIQUE,
  source          text,
  consent         boolean NOT NULL DEFAULT true,
  unsubscribed_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Magazine / Blog
CREATE TABLE magazine_authors (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text UNIQUE,
  bio        text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE magazine_posts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id         uuid REFERENCES magazine_authors(id) ON DELETE SET NULL,
  category          magazine_category_enum NOT NULL,
  title             text NOT NULL,
  slug              text NOT NULL UNIQUE,
  excerpt           text,
  content           text NOT NULL,
  hero_image_url    text,
  read_time_minutes integer,
  published_at      timestamptz,
  is_published      boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mag_posts_category_pub ON magazine_posts(category, published_at DESC);
CREATE INDEX idx_mag_posts_title_trgm ON magazine_posts USING gin (title gin_trgm_ops);

CREATE TABLE magazine_tags (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE
);

CREATE TABLE magazine_post_tags (
  post_id uuid NOT NULL REFERENCES magazine_posts(id) ON DELETE CASCADE,
  tag_id  uuid NOT NULL REFERENCES magazine_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE magazine_related_posts (
  post_id          uuid NOT NULL REFERENCES magazine_posts(id) ON DELETE CASCADE,
  related_post_id  uuid NOT NULL REFERENCES magazine_posts(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, related_post_id),
  CHECK (post_id <> related_post_id)
);

-- Site-wide settings (JSONB key/value)
CREATE TABLE site_settings (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  description text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);