import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { PriorityOption } from "@prisma/client";

export const TaskRouter = createTRPCRouter({
  findAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.task.findMany({
      where: {
        completed: false,
      },
      orderBy: {
        order: "asc",
      },
    });
  }),
  create: publicProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().nullable(),
        dueDate: z.date().nullable(),
        priority: z.nativeEnum(PriorityOption).nullable(),
        collectionId: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.task.create({
        data: {
          title: input.title,
          description: input.description,
          order: 9999,
          dueDate: input.dueDate,
          priority: input.priority,
          collectionId: input.collectionId,
        },
      });
    }),
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().nullable(),
        completed: z.boolean(),
        dueDate: z.date().nullable(),
        priority: z.nativeEnum(PriorityOption).nullable(),
        collectionId: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.task.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
          completed: input.completed,
          dueDate: input.dueDate,
          priority: input.priority,
          collectionId: input.collectionId,
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
        for (const task of input) {
          await tx.task.update({
            where: {
              id: task.id,
            },
            data: {
              order: task.order,
            },
          });
        }
      });
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.task.delete({
        where: { id: input.id },
      });
    }),
});
