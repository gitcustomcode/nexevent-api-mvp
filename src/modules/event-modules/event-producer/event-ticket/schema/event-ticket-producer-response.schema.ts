import { EventTicketLinkStatus, EventTicketStatus } from '@prisma/client';
import { z } from 'nestjs-zod/z';

export const EventTicketDashboardResponseSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    status: z.nativeEnum(EventTicketStatus),
    price: z.number(),
    guest: z.number(),
    participantsCount: z.number(),
    links: z.array(
      z.object({
        id: z.string(),
        status: z.nativeEnum(EventTicketLinkStatus),
      }),
    ),
  }),
);
