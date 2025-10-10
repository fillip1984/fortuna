import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { PriorityOption } from "@prisma/client";

export const TaskRouter = createTRPCRouter({
  findAll: publicProcedure
    .input(z.object({ showCompleted: z.boolean() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.task.findMany({
        where: {
          ...(input.showCompleted === true ? {} : { completed: false }),
        },
        include: {
          checklist: true,
          comments: true,
        },
        orderBy: [{ order: "asc" }, { dueDate: "asc" }, { title: "asc" }],
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
        order: z.number(),
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
          order: input.order,
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
          id: z.string(),
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
  addChecklistItem: publicProcedure
    .input(
      z.object({
        taskId: z.string(),
        text: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.checklist.create({
        data: {
          taskId: input.taskId,
          text: input.text,
          completed: false,
        },
      });
    }),
  toggleChecklistItem: publicProcedure
    .input(
      z.object({
        id: z.string(),
        completed: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.checklist.update({
        where: { id: input.id },
        data: { completed: input.completed },
      });
    }),
  deleteChecklistItem: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.checklist.delete({
        where: { id: input.id },
      });
    }),
  addComment: publicProcedure
    .input(
      z.object({
        taskId: z.string(),
        text: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.comment.create({
        data: {
          taskId: input.taskId,
          text: input.text,
        },
      });
    }),
  deleteComment: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.comment.delete({
        where: { id: input.id },
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
