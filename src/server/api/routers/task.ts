import z from "zod";

import {
  PriorityOption,
  TaskStatusOption,
} from "~/generated/prisma/client/enums";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const TaskRouter = createTRPCRouter({
  findAll: protectedProcedure
    .input(z.object({ showCompleted: z.boolean() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.task.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.showCompleted === true ? {} : { completed: false }),
        },
        include: {
          checklist: { orderBy: { order: "asc" } },
          comments: { orderBy: { postedDate: "asc" } },
        },
        orderBy: [{ order: "asc" }, { dueDate: "asc" }, { title: "asc" }],
      });
    }),
  findById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.task.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          checklist: { orderBy: { order: "asc" } },
          comments: { orderBy: { postedDate: "asc" } },
        },
      });
    }),
  search: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.task.findMany({
        where: {
          userId: ctx.session.user.id,
          title: {
            contains: input.query,
            mode: "insensitive",
          },
        },
        include: {
          checklist: { orderBy: { order: "asc" } },
          comments: { orderBy: { postedDate: "asc" } },
        },
        orderBy: [{ order: "asc" }, { dueDate: "asc" }, { title: "asc" }],
      });
    }),
  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().nullable(),
        dueDate: z.date().nullable(),
        priority: z.enum(PriorityOption).nullable(),
        source: z.string().nullish(),
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
          source: input.source,
          collectionId: input.collectionId,
          userId: ctx.session.user.id,
        },
      });
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().nullable(),
        completed: z.boolean(),
        order: z.number(),
        dueDate: z.date().nullable(),
        priority: z.enum(PriorityOption).nullable(),
        status: z.enum(TaskStatusOption).nullable(),
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
          order: input.order,
          dueDate: input.dueDate,
          priority: input.priority,
          status: input.status,
          collectionId: input.collectionId,
        },
      });
    }),
  reorder: protectedProcedure
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
  addChecklistItem: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        text: z.string(),
        order: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.checklist.create({
        data: {
          taskId: input.taskId,
          text: input.text,
          completed: false,
          order: input.order,
        },
      });
    }),
  toggleChecklistItem: protectedProcedure
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
  updateChecklistItem: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        text: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.checklist.update({
        where: { id: input.id },
        data: { text: input.text },
      });
    }),
  deleteChecklistItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.checklist.delete({
        where: { id: input.id },
      });
    }),
  reorderChecklist: protectedProcedure
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
        for (const item of input) {
          await tx.checklist.update({
            where: {
              id: item.id,
            },
            data: {
              order: item.order,
            },
          });
        }
      });
    }),
  addComment: protectedProcedure
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
  deleteComment: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.comment.delete({
        where: { id: input.id },
      });
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.task.delete({
        where: { id: input.id },
      });
    }),
});
