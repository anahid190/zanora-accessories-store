import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { listOrdersForUser } from "./db";
import { createCheckoutSession } from "./stripe";
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
