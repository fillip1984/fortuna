import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const CollectionRouter = createTRPCRouter({
  findAll: protectedProcedure
    .input(z.object({ showCompleted: z.boolean() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.collection.findMany({
        where: { userId: ctx.session.user.id },
        select: {
          id: true,
          name: true,
          tasks: {
            where: {
              ...(input.showCompleted === true ? {} : { completed: false }),
            },
            include: {
              checklist: { orderBy: { order: "asc" } },
              comments: { orderBy: { postedDate: "asc" } },
            },
            orderBy: [{ order: "asc" }, { dueDate: "asc" }, { title: "asc" }],
          },
        },
        orderBy: {
          order: "asc",
        },
      });
    }),
  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.collection.create({
        data: {
          name: input.name,
          order: 9999,
          userId: ctx.session.user.id,
        },
      });
    }),
  update: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.collection.update({
        where: { id: input.id },
        data: {
          name: input.name,
        },
      });
    }),
  reorder: protectedProcedure
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
  delete: protectedProcedure
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
