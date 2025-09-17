import { describe, it, expect } from "@jest/globals";
import { CompanyService } from "../../services/company.service";

describe("CompanyService", () => {
    describe("getAvailableLegalForms", () => {
        it("devrait retourner toutes les formes légales disponibles", () => {
            const result = CompanyService.getAvailableLegalForms();

            expect(result).toBeDefined();
            expect(result.legalForms).toBeDefined();
            expect(Array.isArray(result.legalForms)).toBe(true);
            expect(result.legalForms.length).toBeGreaterThan(0);
            expect(result.legalForms).toContain("SAS");
            expect(result.legalForms).toContain("SARL");
            expect(result.legalForms).toContain("EURL");
            expect(result.legalForms).toContain("SASU");
        });

        it("devrait contenir exactement 8 formes légales", () => {
            const result = CompanyService.getAvailableLegalForms();
            expect(result.legalForms).toHaveLength(8);
        });

        it("devrait contenir toutes les formes légales attendues", () => {
            const result = CompanyService.getAvailableLegalForms();
            const expectedForms = [
                "SAS",
                "SARL",
                "EURL",
                "SASU",
                "SA",
                "SNC",
                "SOCIETE_CIVILE",
                "ENTREPRISE_INDIVIDUELLE",
            ];

            expectedForms.forEach(form => {
                expect(result.legalForms).toContain(form);
            });
        });
    });
});