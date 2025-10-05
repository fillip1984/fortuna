import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { PriorityOption } from "@prisma/client";

export const TaskRouter = createTRPCRouter({
  findAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.task.findMany({
      orderBy: {
        title: "asc",
      },
    });
  }),
  create: publicProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        dueDate: z.date().nullable(),
        priority: z.nativeEnum(PriorityOption).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.task.create({
        data: {
          title: input.title,
          description: input.description,
          dueDate: input.dueDate,
          priority: input.priority,
        },
      });
    }),
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        completed: z.boolean().optional(),
        dueDate: z.date().nullable(),
        priority: z.nativeEnum(PriorityOption).nullable(),
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
        },
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
