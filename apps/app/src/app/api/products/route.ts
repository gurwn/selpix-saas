import { auth } from "@clerk/nextjs/server";
import { prisma } from "@myapp/prisma";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const productCreateSchema = z.object({
    name: z.string().min(1),
    wholesalePrice: z.number().min(0),
    recommendedPrice: z.number().min(0),
    margin: z.number().optional(), // Margin rate
    category: z.string().optional(),
    imageUrl: z.string().optional(),
    sourceUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const { userId } = auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const json = await req.json();
        const body = productCreateSchema.parse(json);

        // Create the product in the database
        // Providing defaults for required fields not in form
        const product = await prisma.product.create({
            data: {
                name: body.name,
                wholesalePrice: body.wholesalePrice,
                recommendedPrice: body.recommendedPrice,
                margin: body.margin || 0,
                category: body.category || "Uncategorized",
                image: body.imageUrl || "",
                source: body.sourceUrl || "Manual",

                // Defaults for required fields missing in form
                competition: "N/A",
                searchVolume: 0,
                trend: "N/A",
                score: 0,

                // Note: Owner relationship is not in strict Product schema shown, 
                // relying on internal logic or assuming it's fine for now as per schema view.
                // If we needed to link to User, we'd need to modify schema or use a different model.
                // Given 'Product' seems to be a catalogue item, maybe 'Registration' is the user link?
                // Let's create a Registration too if needed. Schema has 'registrations'.
            },
        });

        // Also create a Registration record to link to User/Status? 
        // Schema 'Registration' has 'productId'.
        // Use dummy values for now to ensure data integrity if needed.
        await prisma.registration.create({
            data: {
                productId: product.id,
                productName: product.name,
                category: product.category,
                recommendedTitle: product.name,
                price: product.recommendedPrice,
                wholesalePrice: product.wholesalePrice,
                status: "PENDING",
                platform: "COUPANG" // Default
            }
        });

        return NextResponse.json({ success: true, product });
    } catch (error) {
        console.error("[PRODUCTS_POST]", error);
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid request data", { status: 422 });
        }
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
