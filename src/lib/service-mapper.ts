import type { Facility, Prisma, Service } from "@prisma/client";
import { toNumber } from "./utils";
import type { ServiceOption } from "@/types";

type ServiceWithFacilities = Service & { facilities: Facility[] };

export function toServiceOption(service: ServiceWithFacilities): ServiceOption {
  return {
    id: service.id,
    slug: service.slug,
    name: service.name,
    category: service.category,
    shortDesc: service.shortDesc,
    requiresApproval: service.requiresApproval,
    isVirtual: service.isVirtual,
    minDuration: service.minDuration,
    slotMinutes: service.slotMinutes,
    operatingStart: service.operatingStart,
    operatingEnd: service.operatingEnd,
    basePrice: toNumber(service.basePrice),
    currency: service.currency,
    priceUnit: service.priceUnit,
    facilities: service.facilities
      .filter((f) => f.published)
      .map((f) => ({ id: f.id, name: f.name, capacity: f.capacity })),
  };
}

export type { ServiceWithFacilities, Prisma };
