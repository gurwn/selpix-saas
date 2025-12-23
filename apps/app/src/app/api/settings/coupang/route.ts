import { NextResponse } from 'next/server';
import { prisma } from '@myapp/prisma';
import { auth } from '@clerk/nextjs/server';

// LIST credentials
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const creds = await prisma.coupangCredential.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        const safeCreds = creds.map(c => ({
            id: c.id,
            alias: c.alias, // Now supported
            isActive: c.isActive, // Now supported
            accessKey: c.accessKey.slice(0, 5) + '*****',
            vendorId: c.vendorId,
            vendorUserId: c.vendorUserId,
            createdAt: c.createdAt
        }));

        return NextResponse.json({ credentials: safeCreds });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ADD new credential
export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { alias, accessKey, secretKey, vendorId, vendorUserId, isActive } = body;

        if (!accessKey || !secretKey || !vendorId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // If setting as active, deactivate others first
        if (isActive) {
            await prisma.coupangCredential.updateMany({
                where: { userId },
                data: { isActive: false }
            });
        }

        const cred = await prisma.coupangCredential.create({
            data: {
                userId,
                alias: alias || 'My Store',
                isActive: isActive || false,
                accessKey,
                secretKey,
                vendorId,
                vendorUserId,
            },
        });

        // If this is the FIRST credential, force it to be active
        const count = await prisma.coupangCredential.count({ where: { userId } });
        if (count === 1) {
            await prisma.coupangCredential.update({
                where: { id: cred.id },
                data: { isActive: true }
            });
        }

        return NextResponse.json({ success: true, id: cred.id });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// UPDATE (Set Active, Edit Alias)
export async function PUT(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, isActive, alias } = body;

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        // Verify ownership
        const existing = await prisma.coupangCredential.findFirst({
            where: { id, userId }
        });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (isActive === true) {
            // Deactivate others
            await prisma.coupangCredential.updateMany({
                where: { userId, id: { not: id } },
                data: { isActive: false }
            });
        }

        const updated = await prisma.coupangCredential.update({
            where: { id },
            data: {
                isActive: isActive !== undefined ? isActive : existing.isActive,
                alias: alias !== undefined ? alias : existing.alias
            }
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE credential
export async function DELETE(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        // Verify ownership
        const existing = await prisma.coupangCredential.findFirst({
            where: { id, userId }
        });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await prisma.coupangCredential.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
