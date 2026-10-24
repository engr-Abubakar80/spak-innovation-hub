import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_SETTINGS } from "../src/lib/settings";

const prisma = new PrismaClient();

function weekdayAvailability() {
  return [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    dayOfWeek: day,
    openMinute: 8 * 60,
    closeMinute: 18 * 60,
    isClosed: day === 0 || day === 6,
  }));
}

async function main() {
  console.log("Seeding SPAK Innovation Hub…");

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.organizationSetting.upsert({
      where: { key },
      update: {},
      create: { key, value, category: key.split(".")[0] },
    });
  }

  const socials = [
    { platform: "linkedin", label: "LinkedIn", displayOrder: 1 },
    { platform: "x", label: "X", displayOrder: 2 },
    { platform: "facebook", label: "Facebook", displayOrder: 3 },
    { platform: "tiktok", label: "TikTok", displayOrder: 4 },
    { platform: "whatsapp", label: "WhatsApp Channel", displayOrder: 5 },
  ];
  for (const s of socials) {
    await prisma.socialMediaLink.upsert({
      where: { platform: s.platform },
      update: {},
      create: { ...s, url: null, published: false },
    });
  }

  const services = [
    {
      slug: "co-working-space",
      name: "Co-working Space Booking",
      category: "Coworking",
      icon: "Users",
      shortDesc: "A conducive, collaborative environment where creativity develops and talents connect, collaborate and create.",
      description:
        "SPAK Innovation Hub provides a conducive co-working environment for entrepreneurs, freelancers, remote workers, students and organisations. Our collaborative workspace is designed to support creativity, productivity and enterprise development.",
      priceUnit: "per day",
      requiresApproval: true,
      isVirtual: false,
      operatingStart: 8 * 60,
      operatingEnd: 18 * 60,
      facilities: [
        { name: "Open Co-working Desks", description: "Shared workspace in the open co-working area." },
      ],
    },
    {
      slug: "virtual-office",
      name: "Virtual Office Services",
      category: "Virtual Office",
      icon: "Building2",
      shortDesc: "Professional business address and support services for individuals and organisations working remotely.",
      description: "Our Virtual Office service gives entrepreneurs and organisations a professional presence without the overhead of a full-time physical office.",
      priceUnit: "per month",
      requiresApproval: true,
      isVirtual: true,
      operatingStart: 8 * 60,
      operatingEnd: 18 * 60,
      facilities: [],
    },
    {
      slug: "conference-event-hall",
      name: "Conference / Event Hall Booking",
      category: "Events",
      icon: "Presentation",
      shortDesc: "Host conferences, launches, workshops and community events in a professional event space.",
      description: "SPAK Innovation Hub offers an event hall suitable for conferences, corporate events, product launches, community meetups and training sessions.",
      priceUnit: "per day",
      requiresApproval: true,
      isVirtual: false,
      operatingStart: 8 * 60,
      operatingEnd: 20 * 60,
      facilities: [
        { name: "Event / Conference Hall", description: "Main hall for conferences and events." },
      ],
    },
    {
      slug: "meeting-room",
      name: "Meeting Room Booking",
      category: "Meeting Rooms",
      icon: "Video",
      shortDesc: "Book a private meeting room for team meetings, interviews, client presentations and workshops.",
      description: "Reserve a private, professional meeting room for your team meetings, interviews, client presentations and strategy sessions.",
      priceUnit: "per hour",
      requiresApproval: true,
      isVirtual: false,
      operatingStart: 8 * 60,
      operatingEnd: 18 * 60,
      facilities: [{ name: "Meeting Room A", description: "Private meeting room." }],
    },
    {
      slug: "training-workshop",
      name: "Training / Workshop Facilities",
      category: "Training",
      icon: "GraduationCap",
      shortDesc: "Facilities and support for practical training, capacity-building and entrepreneurship programmes.",
      description: "SPAK Innovation Hub provides practical training, consulting and capacity-building in entrepreneurship, business development, innovation, digital skills and organisational development.",
      priceUnit: "per day",
      requiresApproval: true,
      isVirtual: false,
      operatingStart: 8 * 60,
      operatingEnd: 18 * 60,
      facilities: [{ name: "Training Room", description: "Flexible room for workshops and training." }],
    },
  ];

  for (const s of services) {
    const { facilities, ...serviceData } = s;
    const service = await prisma.service.upsert({
      where: { slug: serviceData.slug },
      update: serviceData,
      create: serviceData,
    });
    for (let idx = 0; idx < facilities.length; idx++) {
      const f = facilities[idx];
      const existing = await prisma.facility.findFirst({ where: { serviceId: service.id, name: f.name } });
      const facility = existing
        ? await prisma.facility.update({ where: { id: existing.id }, data: { description: f.description, displayOrder: idx } })
        : await prisma.facility.create({
            data: { serviceId: service.id, name: f.name, description: f.description, capacity: null, capacityUnit: "people", displayOrder: idx },
          });
      for (const window of weekdayAvailability()) {
        await prisma.facilityAvailability.upsert({
          where: { facilityId_dayOfWeek: { facilityId: facility.id, dayOfWeek: window.dayOfWeek } },
          update: {},
          create: { facilityId: facility.id, ...window },
        });
      }
    }
  }

  const team = [
    { name: "Dr. Shukrat Bello", role: "Team Lead", phone: "08037222034" },
    { name: "Ahmad Abubakar Fana", role: "Manager", phone: "09160103097" },
    { name: "Aliyu Abubakar Ibrahim Fana", role: "Office Manager", phone: "07060670647" },
    { name: "Abubakar Ibrahim Abdullahi", role: "Program Team Lead", phone: "07085817280" },
    { name: "Mubarak Ahmad", role: "Partnership & Ecosystem Lead", phone: "08062282089" },
  ];
  for (let idx = 0; idx < team.length; idx++) {
    const m = team[idx];
    const existing = await prisma.teamMember.findFirst({ where: { name: m.name } });
    if (existing) {
      await prisma.teamMember.update({ where: { id: existing.id }, data: { role: m.role, phone: m.phone, displayOrder: idx } });
    } else {
      await prisma.teamMember.create({ data: { ...m, displayOrder: idx, published: true } });
    }
  }

  const projects = [
    { slug: "spakcare", title: "SpakCare", summary: "Social-impact initiative focused on improving access to healthcare.", focusAreas: ["Child healthcare", "Health access"], category: "Health", status: "ONGOING" as const, displayOrder: 0 },
    { slug: "spakrecycle", title: "SpakRecycle", summary: "Promotes responsible waste management, recycling and sustainable practices.", focusAreas: ["Recycling", "Circular economy"], category: "Environment", status: "ONGOING" as const, displayOrder: 1 },
    { slug: "talynq", title: "Talynq", summary: "AI-enabled campus talent and micro-work platform connecting emerging talents with opportunities.", focusAreas: ["Talent discovery", "Micro-work"], category: "Technology", status: "ONGOING" as const, displayOrder: 2 },
  ];
  for (const p of projects) {
    await prisma.project.upsert({ where: { slug: p.slug }, update: p, create: p });
  }

  if ((await prisma.coreValue.count()) === 0) {
    await prisma.coreValue.createMany({
      data: [
        { title: "Inclusion", description: "Promoting equal access to opportunities and prioritising underserved people and communities." },
        { title: "Innovation", description: "Encouraging creative thinking and practical solutions to real-world problems." },
        { title: "Integrity", description: "Acting with honesty, accountability and transparency." },
        { title: "Sustainability", description: "Pursuing solutions that create lasting social, environmental and economic value." },
        { title: "Collaboration", description: "Achieving meaningful impact through partnerships and collective action." },
        { title: "Impact", description: "Focusing on measurable improvements in lives, livelihoods and communities." },
      ].map((v, i) => ({ ...v, displayOrder: i })),
    });
  }

  if ((await prisma.objective.count()) === 0) {
    await prisma.objective.createMany({
      data: [
        "Develop and support innovative solutions to pressing health, environmental and community challenges.",
        "Identify, nurture and accelerate startups, entrepreneurs and emerging talents, particularly among underserved populations.",
        "Provide accessible entrepreneurship training, consulting, mentoring and capacity-building opportunities.",
        "Create a collaborative coworking environment where individuals and organisations can connect, collaborate and create.",
        "Promote environmental sustainability through recycling, waste reduction and circular-economy initiatives.",
        "Improve access to opportunities, skills, resources and networks for people who are excluded or underserved.",
        "Leverage technology and innovation to create economic opportunities and improve quality of life.",
        "Build partnerships with institutions, communities, businesses and development organisations to scale impactful solutions.",
      ].map((text, i) => ({ text, displayOrder: i })),
    });
  }

  if ((await prisma.keyActivity.count()) === 0) {
    await prisma.keyActivity.createMany({
      data: [
        { title: "Startup Support and Incubation", description: "Supporting aspiring and existing entrepreneurs through idea development, business modelling, mentoring.", icon: "Rocket" },
        { title: "Consulting and Training", description: "Providing practical training and consulting in entrepreneurship, business development, innovation, digital skills.", icon: "BookOpen" },
        { title: "Coworking and Collaborative Workspace", description: "Providing a conducive environment for creativity, productivity and enterprise development.", icon: "Users" },
        { title: "Social and Environmental Innovation", description: "Identifying community challenges, developing practical interventions and promoting inclusive solutions.", icon: "Leaf" },
        { title: "Talent Development and Opportunity Creation", description: "Nurturing emerging talents, strengthening employability and entrepreneurial capabilities.", icon: "GraduationCap" },
        { title: "Partnerships and Ecosystem Development", description: "Collaborating with institutions, businesses, communities, development organisations and other stakeholders.", icon: "Handshake" },
      ].map((a, i) => ({ ...a, displayOrder: i })),
    });
  }

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@spakhub.ng").toLowerCase().trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe!2024";
  const adminName = process.env.SEED_ADMIN_NAME || "SPAK Administrator";
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "SUPER_ADMIN", status: "ACTIVE", passwordHash },
    create: { email: adminEmail, name: adminName, passwordHash, role: "SUPER_ADMIN", status: "ACTIVE", emailVerified: new Date() },
  });

  console.log("Seed complete.");
  console.log(`Super admin: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
