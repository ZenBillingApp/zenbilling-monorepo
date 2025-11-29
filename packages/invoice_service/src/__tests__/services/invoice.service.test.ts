import {
    jest,
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
} from "@jest/globals";
import { InvoiceService } from "../../services/invoice.service";
import { CustomError, Decimal } from "@zenbilling/shared";
import { mockPrisma } from "../mocks/prisma.mock";
import { mockAxios } from "../mocks/axios.mock";
import {
    mockInvoice,
    mockProduct,
    mockUser,
    mockCreateInvoiceRequest,
    mockUpdateInvoiceRequest,
    mockCreatePaymentRequest,
    mockPdfResponse,
    mockEmailResponse,
    mockStripeResponse,
} from "../mocks/test-data";

// Les mocks sont définis dans les fichiers séparés

describe("InvoiceService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("createInvoice", () => {
        it("devrait créer une facture avec succès", async () => {
            // Arrange
            const userId = "user-123";
            const organizationId = "organization-123";

            // Mock the transaction to return the expected result
            mockPrisma.$transaction.mockResolvedValue(mockInvoice);

            // Act
            const result = await InvoiceService.createInvoice(
                userId,
                organizationId,
                mockCreateInvoiceRequest
            );

            // Assert
            expect(result).toEqual(mockInvoice);
            expect(mockPrisma.$transaction).toHaveBeenCalled();
        });

        it("devrait lever une erreur si le produit n'existe pas", async () => {
            // Arrange
            const userId = "user-123";
            const organizationId = "organization-123";

            mockPrisma.$transaction.mockImplementation((callback: any) =>
                callback(mockPrisma)
            );
            mockPrisma.product.findMany.mockResolvedValue([]);

            // Act & Assert
            await expect(
                InvoiceService.createInvoice(
                    userId,
                    organizationId,
                    mockCreateInvoiceRequest
                )
            ).rejects.toThrow(CustomError);
        });

        it("devrait créer un nouveau produit si save_as_product est true", async () => {
            // Arrange
            const userId = "user-123";
            const organizationId = "organization-123";
            const requestWithNewProduct = {
                ...mockCreateInvoiceRequest,
                items: [
                    {
                        ...mockCreateInvoiceRequest.items[0],
                        product_id: undefined,
                        save_as_product: true,
                    },
                ],
            };

            // Mock the transaction to return the expected result
            mockPrisma.$transaction.mockResolvedValue(mockInvoice);

            // Act
            const result = await InvoiceService.createInvoice(
                userId,
                organizationId,
                requestWithNewProduct
            );

            // Assert
            expect(result).toEqual(mockInvoice);
            expect(mockPrisma.$transaction).toHaveBeenCalled();
        });

        it("devrait gérer les erreurs de transaction", async () => {
            // Arrange
            const userId = "user-123";
            const organizationId = "organization-123";

            mockPrisma.$transaction.mockRejectedValue(
                new Error("Erreur de base de données")
            );

            // Act & Assert
            await expect(
                InvoiceService.createInvoice(
                    userId,
                    organizationId,
                    mockCreateInvoiceRequest
                )
            ).rejects.toThrow(CustomError);
        });
    });

    describe("updateInvoice", () => {
        it("devrait mettre à jour une facture avec succès", async () => {
            // Arrange
            const invoiceId = "invoice-123";
            const organizationId = "organization-123";

            mockPrisma.$transaction.mockImplementation((callback: any) =>
                callback(mockPrisma)
            );
            mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
            mockPrisma.invoice.update.mockResolvedValue({
                ...mockInvoice,
                ...mockUpdateInvoiceRequest,
            });

            // Act
            const result = await InvoiceService.updateInvoice(
                invoiceId,
                organizationId,
                mockUpdateInvoiceRequest
            );

            // Assert
            expect(result).toEqual({
                ...mockInvoice,
                ...mockUpdateInvoiceRequest,
            });
            expect(mockPrisma.invoice.findUnique).toHaveBeenCalledWith({
                where: {
                    invoice_id: invoiceId,
                    organization_id: organizationId,
                },
            });
            expect(mockPrisma.invoice.update).toHaveBeenCalled();
        });

        it("devrait lever une erreur si la facture n'existe pas", async () => {
            // Arrange
            const invoiceId = "invoice-123";
            const organizationId = "organization-123";

            mockPrisma.$transaction.mockImplementation((callback: any) =>
                callback(mockPrisma)
            );
            mockPrisma.invoice.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(
                InvoiceService.updateInvoice(
                    invoiceId,
                    organizationId,
                    mockUpdateInvoiceRequest
                )
            ).rejects.toThrow(CustomError);
        });

        it("devrait lever une erreur si on essaie de modifier une facture payée", async () => {
            // Arrange
            const invoiceId = "invoice-123";
            const organizationId = "organization-123";
            const paidInvoice = { ...mockInvoice, status: "paid" as const };

            mockPrisma.$transaction.mockImplementation((callback: any) =>
                callback(mockPrisma)
            );
            mockPrisma.invoice.findUnique.mockResolvedValue(paidInvoice);

            // Act & Assert
            await expect(
                InvoiceService.updateInvoice(
                    invoiceId,
                    organizationId,
                    mockUpdateInvoiceRequest
                )
            ).rejects.toThrow("Impossible de modifier une facture payée");
        });

        it("devrait lever une erreur si on essaie de modifier une facture annulée", async () => {
            // Arrange
            const invoiceId = "invoice-123";
            const organizationId = "organization-123";
            const cancelledInvoice = {
                ...mockInvoice,
                status: "cancelled" as const,
            };

            mockPrisma.$transaction.mockImplementation((callback: any) =>
                callback(mockPrisma)
            );
            mockPrisma.invoice.findUnique.mockResolvedValue(cancelledInvoice);

            // Act & Assert
            await expect(
                InvoiceService.updateInvoice(
                    invoiceId,
                    organizationId,
                    mockUpdateInvoiceRequest
                )
            ).rejects.toThrow("Impossible de modifier une facture annulée");
        });
    });

    describe("getInvoiceWithDetails", () => {
        it("devrait récupérer une facture avec tous ses détails", async () => {
            // Arrange
            const invoiceId = "invoice-123";
            const organizationId = "organization-123";

            mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);

            // Act
            const result = await InvoiceService.getInvoiceWithDetails(
                invoiceId,
                organizationId
            );

            // Assert
            expect(result).toEqual(mockInvoice);
            expect(mockPrisma.invoice.findUnique).toHaveBeenCalledWith({
                where: {
                    invoice_id: invoiceId,
                    organization_id: organizationId,
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
            // Arrange
            const invoiceId = "invoice-123";
            const organizationId = "organization-123";

            mockPrisma.invoice.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(
                InvoiceService.getInvoiceWithDetails(invoiceId, organizationId)
            ).rejects.toThrow("Facture non trouvée");
        });
    });

    describe("deleteInvoice", () => {
        it("devrait supprimer une facture avec succès", async () => {
            // Arrange
            const invoiceId = "invoice-123";
            const organizationId = "organization-123";

            mockPrisma.$transaction.mockImplementation((callback: any) =>
                callback(mockPrisma)
            );
            mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
            mockPrisma.invoice.delete.mockResolvedValue(mockInvoice);

            // Act
            await InvoiceService.deleteInvoice(invoiceId, organizationId);

            // Assert
            expect(mockPrisma.invoice.findUnique).toHaveBeenCalled();
            expect(mockPrisma.invoice.delete).toHaveBeenCalledWith({
                where: { invoice_id: invoiceId },
            });
        });

        it("devrait lever une erreur si on essaie de supprimer une facture payée", async () => {
            // Arrange
            const invoiceId = "invoice-123";
            const organizationId = "organization-123";
            const paidInvoice = { ...mockInvoice, status: "paid" as const };

            mockPrisma.$transaction.mockImplementation((callback: any) =>
                callback(mockPrisma)
            );
            mockPrisma.invoice.findUnique.mockResolvedValue(paidInvoice);

            // Act & Assert
            await expect(
                InvoiceService.deleteInvoice(invoiceId, organizationId)
            ).rejects.toThrow("Impossible de supprimer une facture payée");
        });

        it("devrait lever une erreur si la facture n'existe pas", async () => {
            // Arrange
            const invoiceId = "invoice-123";
            const organizationId = "organization-123";

            mockPrisma.$transaction.mockImplementation((callback: any) =>
                callback(mockPrisma)
            );
            mockPrisma.invoice.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(
                InvoiceService.deleteInvoice(invoiceId, organizationId)
            ).rejects.toThrow("Facture non trouvée");
        });
    });

    describe("getCompanyInvoices", () => {
        it("devrait récupérer les factures d'une entreprise avec pagination", async () => {
            // Arrange
            const organizationId = "organization-123";
            const queryParams = { page: 1, limit: 10 };

            // Mock the first transaction (invoices + total)
            mockPrisma.$transaction
                .mockResolvedValueOnce([[mockInvoice], 1]) // First call: [invoices, total]
                .mockResolvedValueOnce([1, 0, 0, 0, 0, 1]); // Second call: [pending, paid, cancelled, sent, late, total]

            // Act
            const result = await InvoiceService.getCompanyInvoices(
                organizationId,
                queryParams
            );

            // Assert
            expect(result).toEqual({
                invoices: [mockInvoice],
                total: 1,
                totalPages: 1,
                statusCounts: {
                    pending: 1,
                    paid: 0,
                    cancelled: 0,
                    sent: 0,
                    late: 0,
                    total: 1,
                },
            });
        });

        it("devrait appliquer les filtres de recherche", async () => {
            // Arrange
            const organizationId = "organization-123";
            const queryParams = { search: "test", status: "pending" as const };

            mockPrisma.$transaction.mockResolvedValue([
                [mockInvoice],
                1,
                1,
                0,
                0,
                0,
                0,
                1,
            ]);

            // Act
            await InvoiceService.getCompanyInvoices(
                organizationId,
                queryParams
            );

            // Assert
            expect(mockPrisma.$transaction).toHaveBeenCalled();
        });
    });

    describe("createPayment", () => {
        it("devrait créer un paiement avec succès", async () => {
            // Arrange
            const invoiceId = "invoice-123";
            const organizationId = "organization-123";

            mockPrisma.$transaction.mockImplementation((callback: any) =>
                callback(mockPrisma)
            );
            mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
            mockPrisma.payment.aggregate.mockResolvedValue({
                _sum: { amount: 0 },
            });
            mockPrisma.payment.create.mockResolvedValue({
                payment_id: "payment-123",
                invoice_id: invoiceId,
                ...mockCreatePaymentRequest,
            });

            // Act
            const result = await InvoiceService.createPayment(
                invoiceId,
                organizationId,
                mockCreatePaymentRequest
            );

            // Assert
            expect(result).toBeDefined();
            expect(mockPrisma.payment.create).toHaveBeenCalled();
        });

        it("devrait mettre à jour le statut de la facture si elle est entièrement payée", async () => {
            // Arrange
            const invoiceId = "invoice-123";
            const organizationId = "organization-123";
            const fullPaymentRequest = {
                ...mockCreatePaymentRequest,
                amount: new Decimal("120.00"),
            };

            mockPrisma.$transaction.mockImplementation((callback: any) =>
                callback(mockPrisma)
            );
            mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
            mockPrisma.payment.aggregate.mockResolvedValue({
                _sum: { amount: 0 },
            });
            mockPrisma.payment.create.mockResolvedValue({
                payment_id: "payment-123",
                invoice_id: invoiceId,
                ...fullPaymentRequest,
            });
            mockPrisma.invoice.update.mockResolvedValue({
                ...mockInvoice,
                status: "paid",
            });

            // Act
            await InvoiceService.createPayment(
                invoiceId,
                organizationId,
                fullPaymentRequest
            );

            // Assert
            expect(mockPrisma.invoice.update).toHaveBeenCalledWith({
                where: { invoice_id: invoiceId },
                data: { status: "paid" },
            });
        });

        it("devrait lever une erreur si on essaie de payer une facture annulée", async () => {
            // Arrange
            const invoiceId = "invoice-123";
            const organizationId = "organization-123";
            const cancelledInvoice = {
                ...mockInvoice,
                status: "cancelled" as const,
            };

            mockPrisma.$transaction.mockImplementation((callback: any) =>
                callback(mockPrisma)
            );
            mockPrisma.invoice.findUnique.mockResolvedValue(cancelledInvoice);

            // Act & Assert
            await expect(
                InvoiceService.createPayment(
                    invoiceId,
                    organizationId,
                    mockCreatePaymentRequest
                )
            ).rejects.toThrow("Impossible de payer une facture annulée");
        });

        it("devrait lever une erreur si on essaie de payer une facture déjà payée", async () => {
            // Arrange
            const invoiceId = "invoice-123";
            const organizationId = "organization-123";
            const paidInvoice = { ...mockInvoice, status: "paid" as const };

            mockPrisma.$transaction.mockImplementation((callback: any) =>
                callback(mockPrisma)
            );
            mockPrisma.invoice.findUnique.mockResolvedValue(paidInvoice);

            // Act & Assert
            await expect(
                InvoiceService.createPayment(
                    invoiceId,
                    organizationId,
                    mockCreatePaymentRequest
                )
            ).rejects.toThrow("Cette facture est déjà payée");
        });

        it("devrait lever une erreur si le montant du paiement dépasse le montant de la facture", async () => {
            // Arrange
            const invoiceId = "invoice-123";
            const organizationId = "organization-123";
            const excessivePaymentRequest = {
                ...mockCreatePaymentRequest,
                amount: new Decimal("200.00"),
            };

            mockPrisma.$transaction.mockImplementation((callback: any) =>
                callback(mockPrisma)
            );
            mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
            mockPrisma.payment.aggregate.mockResolvedValue({
                _sum: { amount: 0 },
            });

            // Act & Assert
            await expect(
                InvoiceService.createPayment(
                    invoiceId,
                    organizationId,
                    excessivePaymentRequest
                )
            ).rejects.toThrow(
                "Le montant total des paiements ne peut pas dépasser le montant de la facture"
            );
        });
    });

    describe("sendInvoiceByEmail", () => {
        it("devrait envoyer une facture par email avec succès", async () => {
            // Arrange
            const invoiceId = "invoice-123";
            const organizationId = "organization-123";
            const userId = "user-123";

            mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.invoice.update.mockResolvedValue({
                ...mockInvoice,
                status: "sent",
            });

            mockAxios.post
                .mockResolvedValueOnce(mockPdfResponse) // PDF generation
                .mockResolvedValueOnce(mockEmailResponse); // Email sending

            // Act
            await InvoiceService.sendInvoiceByEmail(
                invoiceId,
                organizationId,
                userId
            );

            // Assert
            expect(mockAxios.post).toHaveBeenCalledTimes(2);
            expect(mockPrisma.invoice.update).toHaveBeenCalledWith({
                where: { invoice_id: invoiceId },
                data: { status: "sent" },
            });
        });

        it("devrait lever une erreur si le client n'a pas d'email", async () => {
            // Arrange
            const invoiceId = "invoice-123";
            const organizationId = "organization-123";
            const userId = "user-123";
            const invoiceWithoutEmail = {
                ...mockInvoice,
                customer: { ...mockInvoice.customer, email: null },
            };

            mockPrisma.invoice.findUnique.mockResolvedValue(
                invoiceWithoutEmail
            );

            // Act & Assert
            await expect(
                InvoiceService.sendInvoiceByEmail(
                    invoiceId,
                    organizationId,
                    userId
                )
            ).rejects.toThrow("Le client n'a pas d'adresse email");
        });

        it("devrait lever une erreur si l'utilisateur n'existe pas", async () => {
            // Arrange
            const invoiceId = "invoice-123";
            const organizationId = "organization-123";
            const userId = "user-123";

            mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
            mockPrisma.user.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(
                InvoiceService.sendInvoiceByEmail(
                    invoiceId,
                    organizationId,
                    userId
                )
            ).rejects.toThrow("Utilisateur non trouvé");
        });

        it("devrait lever une erreur si la génération du PDF échoue", async () => {
            // Arrange
            const invoiceId = "invoice-123";
            const organizationId = "organization-123";
            const userId = "user-123";

            mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockAxios.post.mockResolvedValueOnce({ data: null }); // PDF generation fails

            // Act & Assert
            await expect(
                InvoiceService.sendInvoiceByEmail(
                    invoiceId,
                    organizationId,
                    userId
                )
            ).rejects.toThrow("Erreur lors de la génération du PDF");
        });
    });

    describe("sendInvoiceWithPaymentLink", () => {
        it("devrait envoyer une facture avec lien de paiement avec succès", async () => {
            // Arrange
            const invoiceId = "invoice-123";
            const organizationId = "organization-123";
            const options = {
                successUrl: "https://example.com/success",
                cancelUrl: "https://example.com/cancel",
            };

            mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
            mockPrisma.invoice.update.mockResolvedValue({
                ...mockInvoice,
                status: "sent",
            });

            mockAxios.post
                .mockResolvedValueOnce(mockPdfResponse) // PDF generation
                .mockResolvedValueOnce(mockStripeResponse) // Stripe session
                .mockResolvedValueOnce(mockEmailResponse); // Email sending

            // Act
            await InvoiceService.sendInvoiceWithPaymentLink(
                invoiceId,
                organizationId,
                mockUser,
                options
            );

            // Assert
            expect(mockAxios.post).toHaveBeenCalledTimes(3);
            expect(mockPrisma.invoice.update).toHaveBeenCalledWith({
                where: { invoice_id: invoiceId },
                data: { status: "sent" },
            });
        });

        it("devrait lever une erreur si Stripe n'est pas configuré", async () => {
            // Arrange
            const invoiceId = "invoice-123";
            const organizationId = "organization-123";
            const organizationWithoutStripe = {
                ...mockOrganization,
                stripe_account_id: null,
                stripe_onboarded: false,
            } as IOrganization;
            const options = {
                successUrl: "https://example.com/success",
                cancelUrl: "https://example.com/cancel",
            };

            mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
            mockAxios.post.mockResolvedValueOnce(mockPdfResponse); // PDF generation

            // Act & Assert
            await expect(
                InvoiceService.sendInvoiceWithPaymentLink(
                    invoiceId,
                    organizationId,
                    organizationWithoutStripe,
                    options
                )
            ).rejects.toThrow("Le compte Stripe n'est pas configuré");
        });

        it("devrait envoyer une facture sans lien de paiement si les URLs ne sont pas fournies", async () => {
            // Arrange
            const invoiceId = "invoice-123";
            const organizationId = "organization-123";
            const options = {
                successUrl: "https://example.com/success",
                cancelUrl: "https://example.com/cancel",
            };

            mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
            mockPrisma.invoice.update.mockResolvedValue({
                ...mockInvoice,
                status: "sent",
            });

            mockAxios.post
                .mockResolvedValueOnce(mockPdfResponse) // PDF generation
                .mockResolvedValueOnce(mockEmailResponse); // Email sending

            // Act
            await InvoiceService.sendInvoiceWithPaymentLink(
                invoiceId,
                organizationId,
                mockUser,
                options
            );

            // Assert
            expect(mockAxios.post).toHaveBeenCalledTimes(2); // Pas d'appel Stripe
        });
    });

    describe("getCustomerInvoices", () => {
        it("devrait récupérer les factures d'un client avec pagination", async () => {
            // Arrange
            const customerId = "customer-123";
            const organizationId = "organization-123";
            const queryParams = { page: 1, limit: 10 };

            mockPrisma.invoice.findMany.mockResolvedValue([mockInvoice]);
            mockPrisma.invoice.count.mockResolvedValue(1);

            // Act
            const result = await InvoiceService.getCustomerInvoices(
                customerId,
                organizationId,
                queryParams
            );

            // Assert
            expect(result).toEqual({
                invoices: [mockInvoice],
                total: 1,
                totalPages: 1,
            });
            expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith({
                where: {
                    customer_id: customerId,
                    organization_id: organizationId,
                },
                include: {
                    customer: true,
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    payments: true,
                },
                orderBy: {
                    invoice_date: "desc",
                },
                take: 10,
                skip: 0,
            });
        });

        it("devrait appliquer les filtres de recherche", async () => {
            // Arrange
            const customerId = "customer-123";
            const organizationId = "organization-123";
            const queryParams = { search: "test", status: "pending" as const };

            mockPrisma.invoice.findMany.mockResolvedValue([mockInvoice]);
            mockPrisma.invoice.count.mockResolvedValue(1);

            // Act
            await InvoiceService.getCustomerInvoices(
                customerId,
                organizationId,
                queryParams
            );

            // Assert
            expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        customer_id: customerId,
                        organization_id: organizationId,
                        status: "pending",
                        OR: expect.any(Array),
                    }),
                })
            );
        });
    });

    describe("updateLateInvoices", () => {
        it("devrait mettre à jour les factures en retard", async () => {
            // Arrange
            mockPrisma.$transaction.mockImplementation((callback: any) =>
                callback(mockPrisma)
            );
            mockPrisma.invoice.updateMany.mockResolvedValue({ count: 5 });

            // Act
            await InvoiceService.updateLateInvoices();

            // Assert
            expect(mockPrisma.invoice.updateMany).toHaveBeenCalledWith({
                data: { status: "late" },
                where: {
                    due_date: {
                        lt: expect.any(Date),
                    },
                    status: {
                        in: ["pending", "sent"],
                    },
                },
            });
        });

        it("devrait gérer les erreurs lors de la mise à jour", async () => {
            // Arrange
            mockPrisma.$transaction.mockRejectedValue(
                new Error("Erreur de base de données")
            );

            // Act & Assert
            await expect(InvoiceService.updateLateInvoices()).rejects.toThrow(
                CustomError
            );
        });
    });
});
