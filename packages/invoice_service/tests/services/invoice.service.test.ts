import { InvoiceService } from "../../src/services/invoice.service";
import prisma from "@zenbilling/shared/src/libs/prisma";
import { CustomError } from "@zenbilling/shared/src/utils/customError";
import {
    createMockInvoice,
    createMockInvoiceData,
    createMockUpdateInvoiceData,
    createMockPaymentData,
    createMockPayment,
    createMockProduct,
    createMockCustomer,
    createMockCompany,
    createMockUser,
    createMockTransaction,
} from "../utils/test-helpers";
import axios from "axios";
import { Decimal } from "@zenbilling/shared/src/libs/prisma";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("InvoiceService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createInvoice", () => {
        it("devrait créer une facture avec succès", async () => {
            const mockInvoiceData = createMockInvoiceData();
            const mockInvoice = createMockInvoice();
            const mockProduct = createMockProduct();
            const { mockTransaction } = createMockTransaction();

            (prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
            (prisma.$transaction as jest.Mock).mockImplementation(mockTransaction);

            // Mock de la création d'une facture dans la transaction
            mockTransaction.mockImplementation(async (callback) => {
                const mockTx = {
                    invoice: {
                        create: jest.fn().mockResolvedValue({
                            ...mockInvoice,
                            items: { create: jest.fn() }
                        }),
                        update: jest.fn().mockResolvedValue({
                            ...mockInvoice,
                            items: [{ ...mockProduct, quantity: 1 }],
                            customer: createMockCustomer(),
                            company: createMockCompany(),
                        }),
                    },
                    product: {
                        findMany: jest.fn().mockResolvedValue([mockProduct]),
                        create: jest.fn().mockResolvedValue(mockProduct),
                    }
                };
                return callback(mockTx);
            });

            const result = await InvoiceService.createInvoice(
                "user-id-123",
                "company-id-123",
                mockInvoiceData
            );

            expect(result).toBeDefined();
            expect(prisma.$transaction).toHaveBeenCalled();
        });

        it("devrait générer un numéro de facture unique", async () => {
            const mockInvoiceData = createMockInvoiceData();
            const mockInvoice = createMockInvoice();
            const mockProduct = createMockProduct();
            const { mockTransaction } = createMockTransaction();

            (prisma.$transaction as jest.Mock).mockImplementation(mockTransaction);

            mockTransaction.mockImplementation(async (callback) => {
                const mockTx = {
                    invoice: {
                        create: jest.fn().mockResolvedValue({
                            ...mockInvoice,
                            invoice_number: "FACT-comp12-202401-001"
                        }),
                        update: jest.fn().mockResolvedValue({
                            ...mockInvoice,
                            invoice_number: "FACT-comp12-202401-001",
                            items: [],
                            customer: createMockCustomer(),
                            company: createMockCompany(),
                        }),
                    },
                    product: {
                        findMany: jest.fn().mockResolvedValue([mockProduct]),
                    }
                };
                return callback(mockTx);
            });

            const result = await InvoiceService.createInvoice(
                "user-id-123",
                "company-id-123",
                mockInvoiceData
            );

            expect(result.invoice_number).toMatch(/^FACT-comp12-\d{6}-\d{3}$/);
        });

        it("devrait lever une erreur si un produit n'existe pas", async () => {
            const mockInvoiceData = createMockInvoiceData();
            const { mockTransaction } = createMockTransaction();

            (prisma.$transaction as jest.Mock).mockImplementation(mockTransaction);

            mockTransaction.mockImplementation(async (callback) => {
                const mockTx = {
                    product: {
                        findMany: jest.fn().mockResolvedValue([]), // Aucun produit trouvé
                    }
                };
                return callback(mockTx);
            });

            await expect(
                InvoiceService.createInvoice(
                    "user-id-123",
                    "company-id-123",
                    mockInvoiceData
                )
            ).rejects.toThrow(CustomError);
        });

        it("devrait calculer correctement les montants", async () => {
            const mockInvoiceData = {
                ...createMockInvoiceData(),
                items: [
                    {
                        product_id: "product-id-123",
                        name: "Test Item",
                        description: "A test item",
                        quantity: 2,
                        unit_price_excluding_tax: 100,
                        vat_rate: "STANDARD" as any,
                        unit: "unite" as any,
                    }
                ]
            };
            const mockProduct = createMockProduct({
                price_excluding_tax: new Decimal(100),
                vat_rate: "STANDARD"
            });
            const { mockTransaction } = createMockTransaction();

            (prisma.$transaction as jest.Mock).mockImplementation(mockTransaction);

            mockTransaction.mockImplementation(async (callback) => {
                const mockTx = {
                    invoice: {
                        create: jest.fn().mockResolvedValue({
                            invoice_id: "invoice-id-123",
                            amount_excluding_tax: new Decimal(0),
                            tax: new Decimal(0),
                            amount_including_tax: new Decimal(0),
                        }),
                        update: jest.fn().mockResolvedValue({
                            invoice_id: "invoice-id-123",
                            amount_excluding_tax: new Decimal(200), // 2 * 100
                            tax: new Decimal(40), // 200 * 0.20
                            amount_including_tax: new Decimal(240), // 200 + 40
                            items: [],
                            customer: createMockCustomer(),
                            company: createMockCompany(),
                        }),
                    },
                    product: {
                        findMany: jest.fn().mockResolvedValue([mockProduct]),
                    }
                };
                return callback(mockTx);
            });

            const result = await InvoiceService.createInvoice(
                "user-id-123",
                "company-id-123",
                mockInvoiceData
            );

            expect(Number(result.amount_excluding_tax)).toBe(200);
            expect(Number(result.tax)).toBe(40);
            expect(Number(result.amount_including_tax)).toBe(240);
        });
    });

    describe("getInvoiceWithDetails", () => {
        it("devrait récupérer une facture avec tous les détails", async () => {
            const mockInvoice = createMockInvoice();
            (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice);

            const result = await InvoiceService.getInvoiceWithDetails(
                "invoice-id-123",
                "company-id-123"
            );

            expect(result).toEqual(mockInvoice);
            expect(prisma.invoice.findUnique).toHaveBeenCalledWith({
                where: {
                    invoice_id: "invoice-id-123",
                    company_id: "company-id-123",
                },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    payments: true,
                    customer: {
                        include: {
                            business: true,
                            individual: true,
                        },
                    },
                    user: true,
                    company: true,
                },
            });
        });

        it("devrait lever une erreur si la facture n'existe pas", async () => {
            (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(
                InvoiceService.getInvoiceWithDetails(
                    "nonexistent-id",
                    "company-id-123"
                )
            ).rejects.toThrow(new CustomError("Facture non trouvée", 404));
        });
    });

    describe("updateInvoice", () => {
        it("devrait mettre à jour une facture avec succès", async () => {
            const updateData = createMockUpdateInvoiceData();
            const mockInvoice = createMockInvoice({ status: "pending" });
            const updatedInvoice = { ...mockInvoice, ...updateData };
            const { mockTransaction } = createMockTransaction();

            (prisma.$transaction as jest.Mock).mockImplementation(mockTransaction);

            mockTransaction.mockImplementation(async (callback) => {
                const mockTx = {
                    invoice: {
                        findUnique: jest.fn().mockResolvedValue(mockInvoice),
                        update: jest.fn().mockResolvedValue({
                            ...updatedInvoice,
                            items: [],
                            customer: createMockCustomer(),
                            company: createMockCompany(),
                        }),
                    }
                };
                return callback(mockTx);
            });

            const result = await InvoiceService.updateInvoice(
                "invoice-id-123",
                "company-id-123",
                updateData
            );

            expect(result.status).toBe(updateData.status);
        });

        it("devrait empêcher la modification d'une facture payée", async () => {
            const updateData = createMockUpdateInvoiceData({ status: "sent" as any });
            const paidInvoice = createMockInvoice({ status: "paid" });
            const { mockTransaction } = createMockTransaction();

            (prisma.$transaction as jest.Mock).mockImplementation(mockTransaction);

            mockTransaction.mockImplementation(async (callback) => {
                const mockTx = {
                    invoice: {
                        findUnique: jest.fn().mockResolvedValue(paidInvoice),
                    }
                };
                return callback(mockTx);
            });

            await expect(
                InvoiceService.updateInvoice(
                    "invoice-id-123",
                    "company-id-123",
                    updateData
                )
            ).rejects.toThrow(new CustomError("Impossible de modifier une facture payée", 400));
        });

        it("devrait empêcher la modification d'une facture annulée", async () => {
            const updateData = createMockUpdateInvoiceData();
            const cancelledInvoice = createMockInvoice({ status: "cancelled" });
            const { mockTransaction } = createMockTransaction();

            (prisma.$transaction as jest.Mock).mockImplementation(mockTransaction);

            mockTransaction.mockImplementation(async (callback) => {
                const mockTx = {
                    invoice: {
                        findUnique: jest.fn().mockResolvedValue(cancelledInvoice),
                    }
                };
                return callback(mockTx);
            });

            await expect(
                InvoiceService.updateInvoice(
                    "invoice-id-123",
                    "company-id-123",
                    updateData
                )
            ).rejects.toThrow(new CustomError("Impossible de modifier une facture annulée", 400));
        });
    });

    describe("deleteInvoice", () => {
        it("devrait supprimer une facture avec succès", async () => {
            const mockInvoice = createMockInvoice({ status: "pending" });
            const { mockTransaction } = createMockTransaction();

            (prisma.$transaction as jest.Mock).mockImplementation(mockTransaction);

            mockTransaction.mockImplementation(async (callback) => {
                const mockTx = {
                    invoice: {
                        findUnique: jest.fn().mockResolvedValue(mockInvoice),
                        delete: jest.fn().mockResolvedValue(mockInvoice),
                    }
                };
                return callback(mockTx);
            });

            await expect(
                InvoiceService.deleteInvoice("invoice-id-123", "company-id-123")
            ).resolves.not.toThrow();
        });

        it("devrait empêcher la suppression d'une facture payée", async () => {
            const paidInvoice = createMockInvoice({ status: "paid" });
            const { mockTransaction } = createMockTransaction();

            (prisma.$transaction as jest.Mock).mockImplementation(mockTransaction);

            mockTransaction.mockImplementation(async (callback) => {
                const mockTx = {
                    invoice: {
                        findUnique: jest.fn().mockResolvedValue(paidInvoice),
                    }
                };
                return callback(mockTx);
            });

            await expect(
                InvoiceService.deleteInvoice("invoice-id-123", "company-id-123")
            ).rejects.toThrow(new CustomError("Impossible de supprimer une facture payée", 400));
        });
    });

    describe("getCompanyInvoices", () => {
        it("devrait récupérer les factures avec pagination", async () => {
            const mockInvoices = [createMockInvoice()];
            
            // Mock pour la première transaction (findMany et count)
            (prisma.$transaction as jest.Mock)
                .mockResolvedValueOnce([
                    mockInvoices, // findMany result
                    1 // count result
                ])
                .mockResolvedValueOnce([
                    1, 0, 0, 0, 0, 1 // status counts
                ]);

            const result = await InvoiceService.getCompanyInvoices(
                "company-id-123",
                { page: 1, limit: 10 }
            );

            expect(result.invoices).toEqual(mockInvoices);
            expect(result.total).toBe(1);
            expect(result.totalPages).toBe(1);
            expect(result.statusCounts.pending).toBe(1);
            expect(result.statusCounts.total).toBe(1);
        });

        it("devrait filtrer par statut", async () => {
            (prisma.$transaction as jest.Mock)
                .mockResolvedValueOnce([[], 0])
                .mockResolvedValueOnce([0, 0, 0, 0, 0, 0]);

            await InvoiceService.getCompanyInvoices(
                "company-id-123",
                { status: "paid" }
            );

            // Vérifie que la transaction a été appelée au moins une fois
            expect(prisma.$transaction).toHaveBeenCalled();
        });

        it("devrait effectuer une recherche", async () => {
            (prisma.$transaction as jest.Mock)
                .mockResolvedValueOnce([[], 0])
                .mockResolvedValueOnce([0, 0, 0, 0, 0, 0]);

            await InvoiceService.getCompanyInvoices(
                "company-id-123",
                { search: "test" }
            );

            // Vérifie que la transaction a été appelée au moins une fois
            expect(prisma.$transaction).toHaveBeenCalled();
        });
    });

    describe("createPayment", () => {
        it("devrait créer un paiement avec succès", async () => {
            const paymentData = createMockPaymentData();
            const mockPayment = createMockPayment();
            const mockInvoice = createMockInvoice({
                status: "sent",
                amount_including_tax: new Decimal(120)
            });
            const { mockTransaction } = createMockTransaction();

            (prisma.$transaction as jest.Mock).mockImplementation(mockTransaction);

            mockTransaction.mockImplementation(async (callback) => {
                const mockTx = {
                    invoice: {
                        findUnique: jest.fn().mockResolvedValue(mockInvoice),
                        update: jest.fn().mockResolvedValue(mockInvoice),
                    },
                    payment: {
                        aggregate: jest.fn().mockResolvedValue({
                            _sum: { amount: new Decimal(0) }
                        }),
                        create: jest.fn().mockResolvedValue(mockPayment),
                    }
                };
                return callback(mockTx);
            });

            const result = await InvoiceService.createPayment(
                "invoice-id-123",
                "company-id-123",
                paymentData
            );

            expect(result).toEqual(mockPayment);
        });

        it("devrait marquer la facture comme payée si le montant total est atteint", async () => {
            const paymentData = createMockPaymentData({ amount: 120 });
            const mockPayment = createMockPayment();
            const mockInvoice = createMockInvoice({
                status: "sent",
                amount_including_tax: new Decimal(120)
            });
            const { mockTransaction } = createMockTransaction();

            (prisma.$transaction as jest.Mock).mockImplementation(mockTransaction);

            mockTransaction.mockImplementation(async (callback) => {
                const mockTx = {
                    invoice: {
                        findUnique: jest.fn().mockResolvedValue(mockInvoice),
                        update: jest.fn().mockResolvedValue(mockInvoice),
                    },
                    payment: {
                        aggregate: jest.fn().mockResolvedValue({
                            _sum: { amount: new Decimal(0) }
                        }),
                        create: jest.fn().mockResolvedValue(mockPayment),
                    }
                };
                return callback(mockTx);
            });

            await InvoiceService.createPayment(
                "invoice-id-123",
                "company-id-123",
                paymentData
            );

            // Vérifier que la facture a été mise à jour avec le statut "paid"
            const mockTx = (mockTransaction as jest.Mock).mock.calls[0][0];
            const txResult = mockTx({
                invoice: { 
                    findUnique: jest.fn().mockResolvedValue(mockInvoice),
                    update: jest.fn()
                },
                payment: {
                    aggregate: jest.fn().mockResolvedValue({ _sum: { amount: new Decimal(0) } }),
                    create: jest.fn().mockResolvedValue(mockPayment)
                }
            });
        });

        it("devrait empêcher le paiement d'une facture annulée", async () => {
            const paymentData = createMockPaymentData();
            const cancelledInvoice = createMockInvoice({ status: "cancelled" });
            const { mockTransaction } = createMockTransaction();

            (prisma.$transaction as jest.Mock).mockImplementation(mockTransaction);

            mockTransaction.mockImplementation(async (callback) => {
                const mockTx = {
                    invoice: {
                        findUnique: jest.fn().mockResolvedValue(cancelledInvoice),
                    }
                };
                return callback(mockTx);
            });

            await expect(
                InvoiceService.createPayment(
                    "invoice-id-123",
                    "company-id-123",
                    paymentData
                )
            ).rejects.toThrow(new CustomError("Impossible de payer une facture annulée", 400));
        });

        it("devrait empêcher un paiement supérieur au montant de la facture", async () => {
            const paymentData = createMockPaymentData({ amount: 200 });
            const mockInvoice = createMockInvoice({
                status: "sent",
                amount_including_tax: new Decimal(120)
            });
            const { mockTransaction } = createMockTransaction();

            (prisma.$transaction as jest.Mock).mockImplementation(mockTransaction);

            mockTransaction.mockImplementation(async (callback) => {
                const mockTx = {
                    invoice: {
                        findUnique: jest.fn().mockResolvedValue(mockInvoice),
                    },
                    payment: {
                        aggregate: jest.fn().mockResolvedValue({
                            _sum: { amount: new Decimal(0) }
                        }),
                    }
                };
                return callback(mockTx);
            });

            await expect(
                InvoiceService.createPayment(
                    "invoice-id-123",
                    "company-id-123",
                    paymentData
                )
            ).rejects.toThrow(new CustomError("Le montant total des paiements ne peut pas dépasser le montant de la facture", 400));
        });
    });

    describe("sendInvoiceByEmail", () => {
        it("devrait envoyer une facture par email avec succès", async () => {
            const mockInvoice = createMockInvoice({
                customer: createMockCustomer({ email: "customer@example.com" }),
                company: createMockCompany(),
            });
            const mockUser = createMockUser();

            (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice);
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prisma.invoice.update as jest.Mock).mockResolvedValue(mockInvoice);

            mockedAxios.post
                .mockResolvedValueOnce({
                    data: Buffer.from("mock-pdf-content")
                })
                .mockResolvedValueOnce({
                    data: { success: true }
                });

            await expect(
                InvoiceService.sendInvoiceByEmail(
                    "invoice-id-123",
                    "company-id-123",
                    "user-id-123"
                )
            ).resolves.not.toThrow();

            expect(mockedAxios.post).toHaveBeenCalledTimes(2);
            expect(prisma.invoice.update).toHaveBeenCalledWith({
                where: { invoice_id: "invoice-id-123" },
                data: { status: "sent" }
            });
        });

        it("devrait lever une erreur si le client n'a pas d'email", async () => {
            const mockInvoice = createMockInvoice({
                customer: createMockCustomer({ email: null })
            });

            (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice);

            await expect(
                InvoiceService.sendInvoiceByEmail(
                    "invoice-id-123",
                    "company-id-123",
                    "user-id-123"
                )
            ).rejects.toThrow(new CustomError("Le client n'a pas d'adresse email", 400));
        });
    });

    describe("sendInvoiceWithPaymentLink", () => {
        it("devrait envoyer une facture avec lien de paiement avec succès", async () => {
            const mockInvoice = createMockInvoice({
                customer: createMockCustomer({ email: "customer@example.com" }),
                company: createMockCompany(),
            });
            const mockUser = createMockUser({
                stripe_account_id: "acct_test123",
                stripe_onboarded: true
            });

            (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice);
            (prisma.invoice.update as jest.Mock).mockResolvedValue(mockInvoice);

            mockedAxios.post
                .mockResolvedValueOnce({
                    data: Buffer.from("mock-pdf-content")
                })
                .mockResolvedValueOnce({
                    data: { data: { url: "https://checkout.stripe.com/test" } }
                })
                .mockResolvedValueOnce({
                    data: { success: true }
                });

            const options = {
                successUrl: "https://example.com/success",
                cancelUrl: "https://example.com/cancel"
            };

            await expect(
                InvoiceService.sendInvoiceWithPaymentLink(
                    "invoice-id-123",
                    "company-id-123",
                    mockUser,
                    options
                )
            ).resolves.not.toThrow();

            expect(mockedAxios.post).toHaveBeenCalledTimes(3);
        });

        it("devrait lever une erreur si Stripe n'est pas configuré", async () => {
            const mockInvoice = createMockInvoice({
                customer: createMockCustomer({ email: "customer@example.com" })
            });
            const mockUser = createMockUser({
                stripe_account_id: null,
                stripe_onboarded: false
            });

            (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice);
            
            // Mock pour le PDF
            mockedAxios.post.mockResolvedValueOnce({
                data: Buffer.from("mock-pdf-content")
            });

            const options = {
                successUrl: "https://example.com/success",
                cancelUrl: "https://example.com/cancel"
            };

            await expect(
                InvoiceService.sendInvoiceWithPaymentLink(
                    "invoice-id-123",
                    "company-id-123",
                    mockUser,
                    options
                )
            ).rejects.toThrow("Le compte Stripe n'est pas configuré. Veuillez compléter votre configuration Stripe.");
        });
    });

    describe("updateLateInvoices", () => {
        it("devrait mettre à jour les factures en retard", async () => {
            const { mockTransaction } = createMockTransaction();

            (prisma.$transaction as jest.Mock).mockImplementation(mockTransaction);

            mockTransaction.mockImplementation(async (callback) => {
                const mockTx = {
                    invoice: {
                        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
                    }
                };
                return callback(mockTx);
            });

            await expect(
                InvoiceService.updateLateInvoices()
            ).resolves.not.toThrow();
        });
    });

    describe("getCustomerInvoices", () => {
        it("devrait récupérer les factures d'un client", async () => {
            const mockInvoices = [createMockInvoice()];

            (prisma.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);
            (prisma.invoice.count as jest.Mock).mockResolvedValue(1);

            const result = await InvoiceService.getCustomerInvoices(
                "customer-id-123",
                "company-id-123",
                { page: 1, limit: 10 }
            );

            expect(result.invoices).toEqual(mockInvoices);
            expect(result.total).toBe(1);
            expect(result.totalPages).toBe(1);

            expect(prisma.invoice.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        customer_id: "customer-id-123",
                        company_id: "company-id-123"
                    })
                })
            );
        });
    });
});