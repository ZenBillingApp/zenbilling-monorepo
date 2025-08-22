# Configuration Coolify pour ZenBilling

## URLs de base
- Coolify Dashboard: http://93.127.162.78:8000
- Webhook Prefix: http://93.127.162.78:8000/api/v1/webhooks/

## Services et leurs configurations

### api_gateway
- Port: 8080
- Image: ghcr.io/zenbillingapp/zenbilling-monorepo/zenbilling-api_gateway:latest
- Webhook: http://93.127.162.78:8000/api/v1/webhooks/api_gateway

### auth_service
- Port: 3001
- Image: ghcr.io/zenbillingapp/zenbilling-monorepo/zenbilling-auth_service:latest
- Webhook: http://93.127.162.78:8000/api/v1/webhooks/auth_service

### ai_service
- Port: 3011
- Image: ghcr.io/zenbillingapp/zenbilling-monorepo/zenbilling-ai_service:latest
- Webhook: http://93.127.162.78:8000/api/v1/webhooks/ai_service

### company_service
- Port: 3002
- Image: ghcr.io/zenbillingapp/zenbilling-monorepo/zenbilling-company_service:latest
- Webhook: http://93.127.162.78:8000/api/v1/webhooks/company_service

### customer_service
- Port: 3009
- Image: ghcr.io/zenbillingapp/zenbilling-monorepo/zenbilling-customer_service:latest
- Webhook: http://93.127.162.78:8000/api/v1/webhooks/customer_service

### dashboard_service
- Port: 3004
- Image: ghcr.io/zenbillingapp/zenbilling-monorepo/zenbilling-dashboard_service:latest
- Webhook: http://93.127.162.78:8000/api/v1/webhooks/dashboard_service

### email_service
- Port: 3007
- Image: ghcr.io/zenbillingapp/zenbilling-monorepo/zenbilling-email_service:latest
- Webhook: http://93.127.162.78:8000/api/v1/webhooks/email_service

### invoice_service
- Port: 3005
- Image: ghcr.io/zenbillingapp/zenbilling-monorepo/zenbilling-invoice_service:latest
- Webhook: http://93.127.162.78:8000/api/v1/webhooks/invoice_service

### pdf_service
- Port: 3010
- Image: ghcr.io/zenbillingapp/zenbilling-monorepo/zenbilling-pdf_service:latest
- Webhook: http://93.127.162.78:8000/api/v1/webhooks/pdf_service

### product_service
- Port: 3008
- Image: ghcr.io/zenbillingapp/zenbilling-monorepo/zenbilling-product_service:latest
- Webhook: http://93.127.162.78:8000/api/v1/webhooks/product_service

### quote_service
- Port: 3006
- Image: ghcr.io/zenbillingapp/zenbilling-monorepo/zenbilling-quote_service:latest
- Webhook: http://93.127.162.78:8000/api/v1/webhooks/quote_service

### stripe_service
- Port: 3003
- Image: ghcr.io/zenbillingapp/zenbilling-monorepo/zenbilling-stripe_service:latest
- Webhook: http://93.127.162.78:8000/api/v1/webhooks/stripe_service

## Variables d'environnement requises
Consultez les fichiers coolify.json de chaque service pour les variables spécifiques.
