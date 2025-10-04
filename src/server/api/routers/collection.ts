import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const CollectionRouter = createTRPCRouter({
  findAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.collection.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }),
  create: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.collection.create({
        data: {
          name: input.name,
        },
      });
    }),
  update: publicProcedure
    .input(z.object({ id: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.collection.update({
        where: { id: input.id },
        data: {
          name: input.name,
        },
      });
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.collection.delete({
        where: { id: input.id },
      });
    }),
});
