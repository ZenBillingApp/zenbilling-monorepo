import { PrismaClient, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

export { PrismaClient, Prisma, Decimal };

export default prisma;
