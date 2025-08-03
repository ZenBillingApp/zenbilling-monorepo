import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export { PrismaClient, Prisma };

export default prisma;
