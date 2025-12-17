import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const productRouter = createTRPCRouter({
    getAll: protectedProcedure.query(({ ctx }) => {
        return ctx.prisma.product.findMany({
            orderBy: { createdAt: "desc" },
            take: 50,
        });
    }),

    getById: protectedProcedure
        .input(z.object({ id: z.number() }))
        .query(({ ctx, input }) => {
            return ctx.prisma.product.findUnique({
                where: { id: input.id },
                include: {
                    margins: true,
                    detailPages: true,
                    registrations: true,
                },
            });
        }),

    create: protectedProcedure
        .input(
            z.object({
                name: z.string(),
                wholesalePrice: z.number(),
                recommendedPrice: z.number(),
                margin: z.number(),
                competition: z.string(),
                searchVolume: z.number(),
                category: z.string(),
                image: z.string(),
                source: z.string(),
                trend: z.string(),
                score: z.number(),
            })
        )
        .mutation(({ ctx, input }) => {
            return ctx.prisma.product.create({
                data: input,
            });
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(({ ctx, input }) => {
            return ctx.prisma.product.delete({
                where: { id: input.id },
            });
        }),
});
