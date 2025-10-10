import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const CollectionRouter = createTRPCRouter({
  findAll: publicProcedure
    .input(z.object({ showCompleted: z.boolean() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.collection.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              tasks: {
                where: {
                  ...(input.showCompleted === true ? {} : { completed: false }),
                },
              },
            },
          },
        },
        orderBy: {
          order: "asc",
        },
      });
    }),
  create: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.collection.create({
        data: {
          name: input.name,
          order: 9999,
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
  reorder: publicProcedure
    .input(
      z.array(
        z.object({
          id: z.string().min(1),
          order: z.number(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(async (tx) => {
        for (const collection of input) {
          await tx.collection.update({
            where: {
              id: collection.id,
            },
            data: {
              order: collection.order,
            },
          });
        }
      });
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.$transaction(async (tx) => {
        await tx.task.updateMany({
          where: { collectionId: input.id },
          data: { collectionId: null },
        });
        await tx.collection.delete({
          where: { id: input.id },
        });
      });
    }),
});
