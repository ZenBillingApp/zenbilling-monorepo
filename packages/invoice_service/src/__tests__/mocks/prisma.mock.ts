// Re-export the mock prisma from the shared mock
import { mockPrisma, prisma } from "./shared.mock";

export { mockPrisma, prisma };
export default mockPrisma;
