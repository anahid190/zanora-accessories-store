import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { createDiscount, createProductReview, deleteDiscount, getSalesReport, hasPurchasedProduct, listDiscounts, listInventory, listOrdersForUser, listProductReviews, toggleDiscount, updateInventory } from "./db";
import { createCheckoutSession } from "./stripe";
import { products } from "../client/src/data/products";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  admin: router({
    dashboard: adminProcedure.query(({ ctx }) => ({
      user: { id: ctx.user.id, name: ctx.user.name, email: ctx.user.email, role: ctx.user.role },
      message: "Admin access verified",
    })),
  }),
  inventory: router({
    list: adminProcedure.query(() => listInventory(products.map(({ id, name }) => ({ id, name })))),
    update: adminProcedure.input(z.object({ productId: z.number().int().positive(), stock: z.number().int().min(0).max(100000), lowStockThreshold: z.number().int().min(0).max(100000) })).mutation(({ input }) => updateInventory(input.productId, input.stock, input.lowStockThreshold)),
  }),
  discounts: router({
    list: adminProcedure.query(() => listDiscounts()),
    create: adminProcedure.input(z.object({ code: z.string().min(3).max(64), type: z.enum(["percentage", "fixed"]), value: z.number().int().positive(), minOrderAmount: z.number().int().min(0), endsAt: z.string().optional().nullable() })).mutation(({ input }) => createDiscount({ ...input, endsAt: input.endsAt ? new Date(input.endsAt) : null })),
    toggle: adminProcedure.input(z.object({ id: z.number().int().positive(), isActive: z.boolean() })).mutation(({ input }) => toggleDiscount(input.id, input.isActive)),
    remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteDiscount(input.id)),
  }),
  reports: router({
    sales: adminProcedure.input(z.object({ days: z.number().int().min(7).max(90).default(30) }).optional()).query(async ({ input }) => { await listInventory(products.map(({ id, name }) => ({ id, name }))); return getSalesReport(input?.days ?? 30); }),
  }),
  reviews: router({
    list: publicProcedure.input(z.object({ productId: z.number().int().positive() })).query(({ input }) => listProductReviews(input.productId)),
    create: protectedProcedure.input(z.object({ productId: z.number().int().positive(), rating: z.number().int().min(1).max(5), title: z.string().max(160).optional().nullable(), body: z.string().min(10).max(2000) })).mutation(async ({ ctx, input }) => { if (!(await hasPurchasedProduct(ctx.user.id, input.productId))) throw new Error("ثبت نظر فقط پس از خرید و پرداخت محصول امکان‌پذیر است"); return createProductReview({ ...input, userId: ctx.user.id }); }),
  }),
  checkout: router({
    createSession: protectedProcedure.input(z.object({
      origin: z.string().url(),
      items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().positive().max(10) })).min(1),
    })).mutation(async ({ ctx, input }) => createCheckoutSession(input, ctx.user, ctx.req)),
  }),
  orders: router({
    mine: protectedProcedure.query(({ ctx }) => listOrdersForUser(ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;
