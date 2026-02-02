# Communication Inter-Service Sécurisée

Ce guide explique comment utiliser les utilitaires de communication inter-service de ZenBilling avec sécurité et propagation du contexte utilisateur.

## Architecture de Sécurité

### 1. API Gateway
- Vérifie le JWT de l'utilisateur
- Injecte automatiquement le header `x-internal-secret`
- Injecte les headers utilisateur (`x-user-id`, `x-user-email`, etc.)

### 2. Middleware de Sécurité (`authMiddleware`)
- **Vérifie le secret partagé** (`x-internal-secret`) pour bloquer les appels non autorisés
- Valide la présence des headers utilisateur
- Attache les infos utilisateur à `req.gatewayUser`

### 3. Client Axios Sécurisé (`ServiceClients`)
- **Injecte automatiquement** le `x-internal-secret`
- **Propage le contexte utilisateur** entre services
- Inclut circuit breaker, retry logic et logging

---

## 1. Middleware de Sécurité

### Utilisation dans un service

```typescript
import { Router } from "express";
import { authMiddleware } from "@zenbilling/shared";
import { InvoiceController } from "./controllers/invoice.controller";

const router = Router();

// Applique le middleware d'authentification à toutes les routes
router.use(authMiddleware);

router.post("/", InvoiceController.createInvoice);
router.get("/:id", InvoiceController.getInvoice);

export default router;
```

### Ce que fait le middleware

1. **Vérifie le secret interne** : Compare `x-internal-secret` avec `INTERNAL_SHARED_SECRET`
2. **Bloque les requêtes non autorisées** : Retourne 403 si le secret est invalide
3. **Valide les headers utilisateur** : Vérifie `x-user-id` et `x-session-id`
4. **Attache le contexte** : Rend disponible `req.gatewayUser`

```typescript
// Dans votre contrôleur, accédez au contexte utilisateur :
const userId = (req as GatewayAuthRequest).gatewayUser?.id;
const organizationId = (req as GatewayAuthRequest).gatewayUser?.organizationId;
```

---

## 2. Utilitaire d'Appel Inter-Service

### Option A : Sans propagation du contexte utilisateur

Utilisez `ServiceClients.getClient()` pour des appels système qui ne nécessitent pas le contexte utilisateur.

```typescript
import { ServiceClients } from "@zenbilling/shared";

// Appel simple sans contexte utilisateur
const response = await ServiceClients.pdf.post("/api/pdf/invoice", {
    invoice: invoiceData,
    organization: organizationData,
});
```

### Option B : Avec propagation du contexte utilisateur

Utilisez `ServiceClients.getClientWithContext()` pour propager le contexte utilisateur.

```typescript
import {
    ServiceClients,
    extractUserContextFromRequest,
    GatewayAuthRequest
} from "@zenbilling/shared";

// Extraire le contexte depuis la requête
const userContext = extractUserContextFromRequest(req);

// Créer un client avec contexte
const customerClient = ServiceClients.getClientWithContext(
    "customer_service",
    userContext
);

// Faire l'appel - le contexte est automatiquement propagé
const response = await customerClient.get(`/api/customers/${customerId}`);
```

### Ce qui est automatiquement injecté

Chaque appel inter-service inclut automatiquement :

```
Headers injectés :
├── x-internal-secret: <INTERNAL_SHARED_SECRET>
├── x-request-id: <UUID généré>
└── Contexte utilisateur (si fourni) :
    ├── x-user-id
    ├── x-session-id
    ├── x-organization-id
    ├── x-user-email
    └── x-user-name
```

---

## 3. Exemple Complet : Invoice Service → Customer Service

### Scénario
Le service Invoice doit récupérer les détails d'un client avant de créer une facture.

### Code : Invoice Service

```typescript
// packages/invoice_service/src/services/invoice.service.ts
import {
    ServiceClients,
    extractUserContextFromRequest,
    GatewayAuthRequest,
    CustomError,
    logger,
} from "@zenbilling/shared";
import { Request } from "express";

export class InvoiceService {
    /**
     * Récupère les détails d'un client depuis le Customer Service
     */
    private static async getCustomerDetails(
        customerId: string,
        req: Request
    ): Promise<any> {
        try {
            // 1. Extraire le contexte utilisateur depuis la requête
            const userContext = extractUserContextFromRequest(req);

            // 2. Créer un client avec contexte pour le Customer Service
            const customerClient = ServiceClients.getClientWithContext(
                "customer_service",
                userContext
            );

            // 3. Appeler l'API Customer - Le secret et le contexte sont automatiquement injectés
            const response = await customerClient.get(
                `/api/customers/${customerId}`
            );

            logger.info(
                { customerId, userId: userContext.userId },
                "Détails du client récupérés depuis Customer Service"
            );

            return response.data.data;
        } catch (error: any) {
            logger.error(
                { error, customerId },
                "Erreur lors de la récupération du client"
            );

            if (error.response?.status === 404) {
                throw new CustomError("Client non trouvé", 404);
            }

            throw new CustomError(
                "Erreur lors de la récupération des détails du client",
                500
            );
        }
    }

    /**
     * Crée une facture après validation du client
     */
    public static async createInvoice(
        req: Request,
        invoiceData: any
    ): Promise<any> {
        const userId = (req as GatewayAuthRequest).gatewayUser?.id!;
        const organizationId = (req as GatewayAuthRequest).gatewayUser
            ?.organizationId!;

        logger.info(
            { userId, organizationId, customerId: invoiceData.customer_id },
            "Début de création de facture"
        );

        // 1. Vérifier que le client existe et récupérer ses détails
        const customer = await this.getCustomerDetails(
            invoiceData.customer_id,
            req
        );

        // 2. Valider que le client a une adresse email
        if (!customer.email) {
            throw new CustomError(
                "Le client doit avoir une adresse email",
                400
            );
        }

        // 3. Créer la facture avec les détails du client
        logger.info(
            {
                customerId: customer.customer_id,
                customerName: customer.business?.name ||
                    `${customer.individual?.first_name} ${customer.individual?.last_name}`,
            },
            "Client validé, création de la facture"
        );

        // ... suite de la logique de création de facture
    }
}
```

### Code : Contrôleur Invoice

```typescript
// packages/invoice_service/src/controllers/invoice.controller.ts
import { Request, Response } from "express";
import { InvoiceService } from "../services/invoice.service";
import { ApiResponse, GatewayAuthRequest } from "@zenbilling/shared";

export class InvoiceController {
    static async createInvoice(req: Request, res: Response): Promise<void> {
        try {
            const invoice = await InvoiceService.createInvoice(
                req,
                req.body
            );

            ApiResponse.success(
                res,
                201,
                "Facture créée avec succès",
                invoice
            );
        } catch (error: any) {
            ApiResponse.error(res, error.statusCode || 500, error.message);
        }
    }
}
```

---

## 4. Variables d'Environnement Requises

Assurez-vous que chaque service a ces variables :

```bash
# Secret partagé pour sécuriser les appels inter-services
INTERNAL_SHARED_SECRET=votre-secret-tres-securise-minimum-32-caracteres

# URLs des services (pour ServiceClients)
CUSTOMER_SERVICE_URL=http://customer-service:3009
INVOICE_SERVICE_URL=http://invoice-service:3005
PDF_SERVICE_URL=http://pdf-service:3010
EMAIL_SERVICE_URL=http://email-service:3007
# ... autres services
```

**⚠️ IMPORTANT** : En production, utilisez un secret fort et différent de l'exemple.

---

## 5. Flux Complet

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/invoices
       │ Authorization: Bearer <JWT>
       ▼
┌─────────────────────┐
│   API Gateway       │
│                     │
│ 1. Vérifie JWT      │
│ 2. Injecte headers: │
│    - x-internal-secret
│    - x-user-id      │
│    - x-session-id   │
│    - x-organization-id
└──────┬──────────────┘
       │
       ▼
┌──────────────────────────┐
│  Invoice Service         │
│                          │
│ 1. authMiddleware        │
│    ✓ Vérifie secret      │
│    ✓ Valide headers      │
│    ✓ Attache context     │
│                          │
│ 2. InvoiceController     │
│    → createInvoice       │
│                          │
│ 3. InvoiceService        │
│    → getCustomerDetails  │
└──────┬───────────────────┘
       │ GET /api/customers/:id
       │ Headers:
       │   x-internal-secret: <secret>
       │   x-user-id: <id>
       │   x-session-id: <session>
       │   x-organization-id: <org>
       ▼
┌──────────────────────────┐
│  Customer Service        │
│                          │
│ 1. authMiddleware        │
│    ✓ Vérifie secret      │
│    ✓ Valide headers      │
│    ✓ Attache context     │
│                          │
│ 2. CustomerController    │
│    → getCustomer         │
│                          │
│ 3. Retourne données      │
└──────┬───────────────────┘
       │
       │ Response: Customer data
       ▼
┌──────────────────────────┐
│  Invoice Service         │
│                          │
│ 4. Continue création     │
│    facture avec données  │
│    client validées       │
└──────────────────────────┘
```

---

## 6. Avantages de cette Architecture

✅ **Sécurité** : Seuls les appels avec le bon secret peuvent accéder aux services
✅ **Traçabilité** : Le contexte utilisateur est propagé automatiquement
✅ **Simplicité** : Une seule ligne pour créer un client avec contexte
✅ **Résilience** : Circuit breaker et retry automatiques
✅ **Logging** : Tous les appels sont loggés avec contexte
✅ **DRY** : Code réutilisable dans tous les services

---

## 7. Bonnes Pratiques

### ✅ À FAIRE

- Toujours utiliser `authMiddleware` sur toutes les routes
- Propager le contexte utilisateur pour les opérations utilisateur
- Logger les erreurs d'appel inter-service
- Utiliser les clients `ServiceClients` au lieu de créer des instances axios manuelles

### ❌ À ÉVITER

- Ne jamais désactiver la vérification du secret en production
- Ne jamais logger le `INTERNAL_SHARED_SECRET`
- Ne pas créer de nouveaux clients axios sans utiliser `createServiceClient`
- Ne pas ignorer les erreurs d'appel inter-service

---

## 8. Tests

### Mock des appels inter-service

```typescript
import { ServiceClients } from "@zenbilling/shared";

jest.mock("@zenbilling/shared", () => ({
    ...jest.requireActual("@zenbilling/shared"),
    ServiceClients: {
        getClientWithContext: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
                data: {
                    data: {
                        customer_id: "123",
                        email: "test@example.com",
                    },
                },
            }),
        }),
    },
}));
```

---

## Support

Pour toute question sur la communication inter-service, consultez :
- `packages/shared/src/middlewares/auth.middleware.ts` - Middleware de sécurité
- `packages/shared/src/utils/axios.util.ts` - Utilitaires de communication
- Ce document - Guide complet d'utilisation
