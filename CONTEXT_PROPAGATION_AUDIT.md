# 🔍 Audit de Propagation du Contexte Utilisateur

**Date**: 2026-01-31
**Objectif**: Vérifier que tous les appels inter-services propagent correctement le contexte utilisateur quand nécessaire.

---

## 📋 Règles de Propagation du Contexte

### ✅ Quand utiliser `getClientWithContext()` :
- L'appel est fait **dans le contexte d'une requête utilisateur** (dans un controller/service avec `req`)
- L'utilisateur doit être identifié pour l'audit, la sécurité ou la logique métier
- Les endpoints appelés nécessitent `x-user-id`, `x-organization-id`, etc.

### ❌ Quand utiliser `getClient()` :
- L'appel est **système/automatique** (webhooks, cron jobs, background tasks)
- Aucun contexte utilisateur n'est disponible
- L'appel ne dépend pas d'un utilisateur spécifique

---

## ❌ Problèmes Détectés

### 1. 🚨 Invoice Service

**Fichier**: `packages/invoice_service/src/services/invoice.service.ts`

#### Violation 1 : `sendInvoiceByEmail()` (ligne 702)

**Problème** :
```typescript
// ❌ MAUVAIS - Pas de contexte utilisateur
public static async sendInvoiceByEmail(
    invoiceId: string,
    organizationId: string,
    userId: string
): Promise<void> {
    const authClient = ServiceClients.getClient("auth_service");  // ❌
    const userResponse = await authClient.get(`/api/users/${userId}`);
    // ...
}
```

**Solution** :
```typescript
// ✅ BON - Avec contexte utilisateur
public static async sendInvoiceByEmail(
    req: any,  // Ajouter req en premier paramètre
    invoiceId: string,
    organizationId: string,
    userId: string
): Promise<void> {
    const userContext = extractUserContextFromRequest(req);
    const authClient = ServiceClients.getClientWithContext("auth_service", userContext);
    const userResponse = await authClient.get(`/api/users/${userId}`);
    // ...
}
```

**Appel dans controller à modifier** :
```typescript
// Dans invoice.controller.ts ligne 306
// ❌ Avant
await InvoiceService.sendInvoiceByEmail(
    req.params.id,
    req.gatewayUser?.organizationId!,
    req.gatewayUser?.id!,
);

// ✅ Après
await InvoiceService.sendInvoiceByEmail(
    req,  // Ajouter req
    req.params.id,
    req.gatewayUser?.organizationId!,
    req.gatewayUser?.id!,
);
```

---

#### Violation 2 : `sendInvoiceByEmailWithPaymentLink()` (ligne 840)

**Problème** :
```typescript
// ❌ MAUVAIS - Pas de contexte utilisateur
const authClient = ServiceClients.getClient("auth_service");  // ligne 840
const userResponse = await authClient.get(`/api/users/${userId}`);
```

**Solution** : Même correction que sendInvoiceByEmail - ajouter `req` comme premier paramètre et utiliser `getClientWithContext()`.

---

### 2. 🚨 Dashboard Service

**Fichier**: `packages/dashboard_service/src/services/dashboard.service.ts`

**Problème Global** : Toutes les méthodes utilisent `getClient()` sans contexte utilisateur.

#### Violations (16 occurrences) :

**Méthodes affectées** :
1. `getMonthlyRevenue()` - ligne 19
2. `getYearlyRevenue()` - ligne 41
3. `getPendingInvoices()` - ligne 63
4. `getOverdueInvoices()` - ligne 85
5. `getTopCustomers()` - ligne 110
6. `getInvoiceStatusDistribution()` - ligne 137
7. `getMonthlyQuotes()` - ligne 159
8. `getYearlyQuotes()` - ligne 181
9. `getPendingQuotes()` - ligne 203
10. `getAcceptedQuotes()` - ligne 225
11. `getQuoteStatusDistribution()` - ligne 249
12. `getQuoteToInvoiceRatio()` - lignes 272-273 (2x)
13. `getAllMetrics()` - lignes 310-312 (3x)

**Problème** :
```typescript
// ❌ MAUVAIS - Aucune méthode ne reçoit req
async getMonthlyRevenue(organizationId: string): Promise<number> {
    const invoiceClient = ServiceClients.getClient("invoice_service");  // ❌
    // ...
}
```

**Solution** :
```typescript
// ✅ BON - Toutes les méthodes doivent recevoir req
async getMonthlyRevenue(req: any, organizationId: string): Promise<number> {
    const userContext = extractUserContextFromRequest(req);
    const invoiceClient = ServiceClients.getClientWithContext("invoice_service", userContext);
    // ...
}
```

**Imports à ajouter** :
```typescript
import {
    ServiceClients,
    extractUserContextFromRequest,  // Ajouter cet import
    logger,
    DashboardMetrics,
    TopCustomer,
    InvoiceStatusCount,
    QuoteStatusCount,
} from "@zenbilling/shared";
```

**Controller à modifier** (dashboard.controller.ts ligne 15) :
```typescript
// ❌ Avant
const metrics = await dashboardService.getAllMetrics(
    req.gatewayUser?.organizationId!,
);

// ✅ Après
const metrics = await dashboardService.getAllMetrics(
    req,
    req.gatewayUser?.organizationId!,
);
```

---

### 3. ✅ Stripe Service - Webhook Controller

**Fichier**: `packages/stripe_service/src/controllers/stripe-webhook.controller.ts`

**Statut** : ✅ CORRECT - Utilise `getClient()` car c'est un webhook système

```typescript
// ✅ BON - Webhook système, pas de contexte utilisateur
async function handleAccountUpdated(account: Stripe.Account) {
    const authClient = ServiceClients.getClient("auth_service");  // ✅ Correct
    // ...
}
```

**Raison** : Les webhooks Stripe sont des appels système déclenchés par Stripe, pas par un utilisateur. Il n'y a pas de contexte utilisateur à propager.

---

## 📊 Résumé des Violations

| Service | Fichier | Violations | Statut |
|---------|---------|-----------|--------|
| **invoice_service** | invoice.service.ts | 2 méthodes | ❌ À corriger |
| **dashboard_service** | dashboard.service.ts | 13 méthodes (16 appels) | ❌ À corriger |
| **stripe_service** | stripe-webhook.controller.ts | 0 (correct) | ✅ OK |

**Total** : **18 appels** sans contexte qui devraient en avoir un

---

## 🔧 Plan de Correction

### Phase 1 : Invoice Service
1. Modifier `sendInvoiceByEmail(req, ...)` pour accepter `req`
2. Modifier `sendInvoiceByEmailWithPaymentLink(req, ...)` pour accepter `req`
3. Utiliser `getClientWithContext()` dans les deux méthodes
4. Mettre à jour les appels dans `invoice.controller.ts`

### Phase 2 : Dashboard Service
1. Ajouter import `extractUserContextFromRequest`
2. Modifier TOUTES les méthodes pour accepter `req` comme premier paramètre
3. Remplacer TOUS les `getClient()` par `getClientWithContext()`
4. Mettre à jour l'appel dans `dashboard.controller.ts`

---

## 💡 Bonnes Pratiques

### ✅ Pattern Recommandé

**Dans le Service** :
```typescript
public static async myMethod(
    req: any,  // TOUJOURS en premier paramètre si contexte nécessaire
    otherId: string,
    data: any
): Promise<Result> {
    // Extraire le contexte une seule fois
    const userContext = extractUserContextFromRequest(req);

    // Utiliser pour tous les appels inter-services
    const serviceClient = ServiceClients.getClientWithContext(
        "target_service",
        userContext
    );

    const response = await serviceClient.get("/api/endpoint");
    return response.data.data;
}
```

**Dans le Controller** :
```typescript
public static async myController(req: AuthRequest, res: Response) {
    // Toujours passer req en premier
    const result = await MyService.myMethod(
        req,  // ✅ Passer req
        req.params.id,
        req.body
    );

    return ApiResponse.success(res, 200, "Success", result);
}
```

---

## 🎯 Impact de la Correction

Après correction, tous les appels inter-services :
- ✅ Propageront automatiquement `x-user-id`, `x-session-id`, `x-organization-id`
- ✅ Permettront un audit complet (qui a fait quoi)
- ✅ Respecteront les permissions au niveau utilisateur
- ✅ Fourniront un contexte pour les logs et le debugging

---

## 🚀 Prochaines Étapes

1. Corriger Invoice Service (2 méthodes)
2. Corriger Dashboard Service (13 méthodes)
3. Tester les appels inter-services
4. Vérifier les logs pour confirmer la propagation du contexte
