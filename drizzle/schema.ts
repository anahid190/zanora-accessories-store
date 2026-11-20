import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "failed", "canceled"]).default("pending").notNull(),
  fulfillmentStatus: mysqlEnum("fulfillmentStatus", ["unfulfilled", "processing", "shipped", "delivered", "returned"]).default("unfulfilled").notNull(),
  trackingCode: varchar("trackingCode", { length: 120 }),
  shippingCarrier: varchar("shippingCarrier", { length: 120 }),
  shippingLabelUrl: text("shippingLabelUrl"),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 255 }).unique(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  subtotalAmount: int("subtotalAmount").notNull().default(0),
  discountAmount: int("discountAmount").notNull().default(0),
  shippingAmount: int("shippingAmount").notNull().default(0),
  discountCode: varchar("discountCode", { length: 64 }),
  amountTotal: int("amountTotal").notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("usd"),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerName: text("customerName"),
  shippingRecipient: varchar("shippingRecipient", { length: 160 }),
  shippingPhone: varchar("shippingPhone", { length: 32 }),
  shippingProvince: varchar("shippingProvince", { length: 80 }),
  shippingCity: varchar("shippingCity", { length: 80 }),
  shippingAddress: text("shippingAddress"),
  shippingPostalCode: varchar("shippingPostalCode", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  reservationExpiresAt: timestamp("reservationExpiresAt"),
  refundStatus: mysqlEnum("refundStatus", ["none", "pending", "partial", "refunded", "failed"]).default("none").notNull(),
  refundedAmount: int("refundedAmount").notNull().default(0),
  stripeRefundId: varchar("stripeRefundId", { length: 255 }),
});

export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  unitAmount: int("unitAmount").notNull(),
  quantity: int("quantity").notNull(),
});

export const processedStripeEvents = mysqlTable("processedStripeEvents", {
  eventId: varchar("eventId", { length: 255 }).primaryKey(),
  eventType: varchar("eventType", { length: 120 }).notNull(),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
});

export const inventory = mysqlTable("inventory", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().unique(),
  productName: varchar("productName", { length: 255 }).notNull(),
  stock: int("stock").notNull().default(0),
  reservedStock: int("reservedStock").notNull().default(0),
  lowStockThreshold: int("lowStockThreshold").notNull().default(5),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const discounts = mysqlTable("discounts", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  type: mysqlEnum("type", ["percentage", "fixed"]).notNull(),
  value: int("value").notNull(),
  minOrderAmount: int("minOrderAmount").notNull().default(0),
  isActive: int("isActive").notNull().default(1),
  startsAt: timestamp("startsAt").defaultNow().notNull(),
  endsAt: timestamp("endsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const productReviews = mysqlTable("productReviews", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(),
  title: varchar("title", { length: 160 }),
  body: text("body").notNull(),
  isApproved: int("isApproved").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const customerAddresses = mysqlTable("customerAddresses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  recipient: varchar("recipient", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  province: varchar("province", { length: 80 }).notNull(),
  city: varchar("city", { length: 80 }).notNull(),
  address: text("address").notNull(),
  postalCode: varchar("postalCode", { length: 32 }).notNull(),
  isDefault: int("isDefault").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const mobileAuthCodes = mysqlTable("mobileAuthCodes", {
  codeHash: varchar("codeHash", { length: 64 }).primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const authSessions = mysqlTable("authSessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(),
  openId: varchar("openId", { length: 64 }).notNull(),
  refreshTokenHash: varchar("refreshTokenHash", { length: 64 }).notNull().unique(),
  userAgent: varchar("userAgent", { length: 500 }),
  expiresAt: timestamp("expiresAt").notNull(),
  revokedAt: timestamp("revokedAt"),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const orderNotifications = mysqlTable("orderNotifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  orderId: int("orderId"),
  type: varchar("type", { length: 40 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const catalogProducts = mysqlTable("catalogProducts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  priceValue: int("priceValue").notNull(),
  image: text("image").notNull(),
  gallery: text("gallery"),
  badge: varchar("badge", { length: 80 }),
  description: text("description").notNull(),
  isActive: int("isActive").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Inventory = typeof inventory.$inferSelect;
export type Discount = typeof discounts.$inferSelect;
export type ProductReview = typeof productReviews.$inferSelect;
export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type CatalogProduct = typeof catalogProducts.$inferSelect;
export type AuthSession = typeof authSessions.$inferSelect;
export type OrderNotification = typeof orderNotifications.$inferSelect;
