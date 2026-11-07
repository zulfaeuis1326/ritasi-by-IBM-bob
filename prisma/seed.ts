import { PrismaClient, Role, Shift, Material } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Clean up ──────────────────────────────────────────────────────────────
  await prisma.auditLog.deleteMany();
  await prisma.ritasi.deleteMany();
  await prisma.session.deleteMany();
  await prisma.hauler.deleteMany();
  await prisma.fleet.deleteMany();
  await prisma.user.deleteMany();
  await prisma.pit.deleteMany();

  // ─── PIT ───────────────────────────────────────────────────────────────────
  const pitA = await prisma.pit.create({
    data: { name: "PIT Alpha", code: "PA", description: "Area tambang barat" },
  });
  const pitB = await prisma.pit.create({
    data: { name: "PIT Bravo", code: "PB", description: "Area tambang timur" },
  });

  // ─── Fleet ─────────────────────────────────────────────────────────────────
  const fleetsA = await Promise.all([
    prisma.fleet.create({ data: { name: "Fleet 1", code: "F1", pitId: pitA.id } }),
    prisma.fleet.create({ data: { name: "Fleet 2", code: "F2", pitId: pitA.id } }),
    prisma.fleet.create({ data: { name: "Fleet 3", code: "F3", pitId: pitA.id } }),
  ]);
  const fleetsB = await Promise.all([
    prisma.fleet.create({ data: { name: "Fleet 4", code: "F4", pitId: pitB.id } }),
    prisma.fleet.create({ data: { name: "Fleet 5", code: "F5", pitId: pitB.id } }),
    prisma.fleet.create({ data: { name: "Fleet 6", code: "F6", pitId: pitB.id } }),
  ]);

  // ─── Hauler ────────────────────────────────────────────────────────────────
  const haulerData = [
    // Fleet 1
    { unitNumber: "DT-001", type: "CAT 777G", capacity: 90, fleetId: fleetsA[0].id },
    { unitNumber: "DT-002", type: "CAT 777G", capacity: 90, fleetId: fleetsA[0].id },
    // Fleet 2
    { unitNumber: "DT-003", type: "Komatsu HD785", capacity: 91, fleetId: fleetsA[1].id },
    { unitNumber: "DT-004", type: "Komatsu HD785", capacity: 91, fleetId: fleetsA[1].id },
    // Fleet 3
    { unitNumber: "DT-005", type: "CAT 785C", capacity: 136, fleetId: fleetsA[2].id },
    { unitNumber: "DT-006", type: "CAT 785C", capacity: 136, fleetId: fleetsA[2].id },
    // Fleet 4
    { unitNumber: "DT-007", type: "Hitachi EH3500", capacity: 181, fleetId: fleetsB[0].id },
    { unitNumber: "DT-008", type: "Hitachi EH3500", capacity: 181, fleetId: fleetsB[0].id },
    // Fleet 5
    { unitNumber: "DT-009", type: "Komatsu 930E", capacity: 290, fleetId: fleetsB[1].id },
    { unitNumber: "DT-010", type: "Komatsu 930E", capacity: 290, fleetId: fleetsB[1].id },
    // Fleet 6
    { unitNumber: "DT-011", type: "CAT 793F", capacity: 227, fleetId: fleetsB[2].id },
    { unitNumber: "DT-012", type: "CAT 793F", capacity: 227, fleetId: fleetsB[2].id },
  ];
  const haulers = await Promise.all(
    haulerData.map((h) => prisma.hauler.create({ data: h }))
  );

  // ─── Users ─────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      passwordHash: adminHash,
      name: "Administrator",
      role: Role.ADMIN,
    },
  });

  const pinHash1 = await bcrypt.hash("1234", 12);
  const pinHash2 = await bcrypt.hash("2345", 12);
  const pinHash3 = await bcrypt.hash("3456", 12);

  const [p1, p2, p3] = await Promise.all([
    prisma.user.create({
      data: {
        username: "budi",
        passwordHash: pinHash1,
        name: "Budi Santoso",
        role: Role.PENGAWAS,
        pitId: pitA.id,
      },
    }),
    prisma.user.create({
      data: {
        username: "sari",
        passwordHash: pinHash2,
        name: "Sari Dewi",
        role: Role.PENGAWAS,
        pitId: pitA.id,
      },
    }),
    prisma.user.create({
      data: {
        username: "andi",
        passwordHash: pinHash3,
        name: "Andi Wijaya",
        role: Role.PENGAWAS,
        pitId: pitB.id,
      },
    }),
  ]);

  // ─── Sample Ritasi (today) ─────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const materials: Material[] = [Material.OB, Material.COAL, Material.SOIL];
  const shifts: Shift[] = [Shift.PAGI, Shift.SIANG];

  for (let i = 0; i < 6; i++) {
    const hauler = haulers[i];
    await prisma.ritasi.create({
      data: {
        haulerId: hauler.id,
        fleetId: hauler.fleetId,
        pitId: pitA.id,
        userId: i % 2 === 0 ? p1.id : p2.id,
        date: today,
        shift: shifts[i % 2],
        material: materials[i % 3],
        trips: Math.floor(Math.random() * 10) + 5,
        keterangan: null,
      },
    });
  }

  for (let i = 6; i < 12; i++) {
    const hauler = haulers[i];
    await prisma.ritasi.create({
      data: {
        haulerId: hauler.id,
        fleetId: hauler.fleetId,
        pitId: pitB.id,
        userId: p3.id,
        date: today,
        shift: shifts[i % 2],
        material: materials[i % 3],
        trips: Math.floor(Math.random() * 10) + 5,
        keterangan: null,
      },
    });
  }

  console.log("✅ Seed complete!");
  console.log("   Admin   → username: admin    | password: admin123");
  console.log("   Budi    → username: budi     | PIN: 1234  | PIT Alpha");
  console.log("   Sari    → username: sari     | PIN: 2345  | PIT Alpha");
  console.log("   Andi    → username: andi     | PIN: 3456  | PIT Bravo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
