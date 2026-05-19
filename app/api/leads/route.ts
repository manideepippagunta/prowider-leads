import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assignProviders } from '@/lib/allocate';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, city, serviceId, description } = body;

    // Validate required fields
    if (!name || !phone || !city || !serviceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check duplicate explicitly (though P2002 constraint will also catch it)
    const existing = await prisma.lead.findUnique({
      where: {
        phone_serviceId: {
          phone,
          serviceId: Number(serviceId),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Lead with this phone and service already exists' },
        { status: 409 }
      );
    }

    // Save lead to DB
    const lead = await prisma.lead.create({
      data: {
        customerName: name,
        phone,
        city,
        serviceId: Number(serviceId),
        description,
      },
    });

    try {
      // Call allocateProviders
      await assignProviders(lead.id.toString(), serviceId.toString());
    } catch (allocErr) {
      // If allocation fails (e.g. quota insufficient), delete the orphaned lead and abort
      await prisma.lead.delete({ where: { id: lead.id } });
      throw allocErr;
    }

    // Returns created lead with assignments
    const leadWithAssignments = await prisma.lead.findUnique({
      where: { id: lead.id },
      include: {
        assignments: {
          include: {
            provider: true,
          },
        },
      },
    });

    return NextResponse.json(leadWithAssignments, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating lead:', error);
    
    // Handle Prisma unique constraint violation safely
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'Lead with this phone and service already exists' },
        { status: 409 }
      );
    }
    
    // Handle our custom allocation abort message
    if (error instanceof Error && error.message.includes('Insufficient provider quota')) {
      return NextResponse.json(
        { error: error.message },
        { status: 422 }
      );
    }
    
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
