# Service AI - Zenbilling

Service AI générique utilisant OpenAI pour fournir des fonctionnalités d'intelligence artificielle à tous les autres services du monorepo Zenbilling.

## 🚀 Démarrage

### Installation des dépendances
```bash
npm install
```

### Configuration
1. Copiez le fichier `.env.example` vers `.env`
2. Configurez votre clé API OpenAI dans le fichier `.env`
```bash
cp .env.example .env
```

### Démarrage du service
```bash
# Mode développement avec hot reload
npm run dev

# Mode production
npm run build
npm start
```

Le service sera disponible sur `http://localhost:3011`

## 📖 API Documentation

### Endpoints disponibles

#### GET `/` - Statut du service
Retourne les informations de base du service.

#### GET `/api/ai/health` - Health Check
Vérifie la connectivité avec OpenAI.

#### POST `/api/ai/generate-text` - Génération de texte
Génère du texte à partir d'un prompt.
```json
{
  "prompt": "Votre prompt ici",
  "systemMessage": "Instructions système optionnelles",
  "model": "gpt-3.5-turbo",
  "maxTokens": 500,
  "temperature": 0.7
}
```

#### POST `/api/ai/chat` - Chat Completion
Chat avec historique de messages.
```json
{
  "messages": [
    {"role": "system", "content": "Vous êtes un assistant utile"},
    {"role": "user", "content": "Bonjour!"}
  ],
  "model": "gpt-3.5-turbo",
  "maxTokens": 500,
  "temperature": 0.7
}
```

#### POST `/api/ai/suggestions` - Génération de suggestions
Génère plusieurs suggestions pour un prompt.
```json
{
  "prompt": "Suggérez des noms pour mon produit",
  "count": 3,
  "systemMessage": "Vous êtes spécialisé en marketing"
}
```

#### POST `/api/ai/improve-text` - Amélioration de texte
Améliore un texte existant.
```json
{
  "text": "Texte à améliorer",
  "instructions": "Rendez ce texte plus professionnel"
}
```

#### POST `/api/ai/translate` - Traduction
Traduit un texte.
```json
{
  "text": "Hello world",
  "targetLanguage": "français"
}
```

#### POST `/api/ai/summarize` - Résumé
Résume un texte.
```json
{
  "text": "Long texte à résumer...",
  "maxWords": 100
}
```

## 🔧 Configuration

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT` | Port du service | `3011` |
| `OPENAI_API_KEY` | Clé API OpenAI | *Requis* |
| `OPENAI_MODEL` | Modèle OpenAI à utiliser | `gpt-3.5-turbo` |
| `OPENAI_MAX_TOKENS` | Nombre maximum de tokens | `500` |
| `OPENAI_TEMPERATURE` | Température (créativité) | `0.7` |
| `NODE_ENV` | Environnement | `development` |

## 🛡️ Sécurité et limites

### Rate Limiting
- **Standard**: 100 requêtes/15 minutes par IP
- **Strict** (chat): 20 requêtes/15 minutes par IP

### Sécurité
- Helmet.js pour la sécurité HTTP
- CORS configuré pour les domaines autorisés
- Validation des entrées
- Gestion d'erreurs sécurisée

## 🔗 Intégration avec les autres services

Ce service est conçu pour être utilisé par tous les autres services du monorepo. Exemples d'utilisation :

### Service Invoice
```javascript
// Générer une description de produit
const response = await fetch('http://localhost:3011/api/ai/generate-text', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: `Génère une description pour: ${productName}`,
    systemMessage: 'Tu es spécialisé dans les descriptions de produits pour factures'
  })
});
```

### Service Email
```javascript
// Améliorer un email
const response = await fetch('http://localhost:3011/api/ai/improve-text', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: emailContent,
    instructions: 'Rends cet email plus professionnel et poli'
  })
});
```

## 🚦 Via API Gateway

Le service est accessible via l'API Gateway sur `http://localhost:8080/api/ai/*`

## 🧪 Tests

```bash
# Test de connectivité
curl http://localhost:3011/api/ai/health

# Test de génération de texte
curl -X POST http://localhost:3011/api/ai/generate-text \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Dis bonjour"}'
```

## 📝 Logs

Les logs sont gérés par Pino et incluent :
- Requêtes HTTP
- Erreurs OpenAI
- Statut des opérations
- Métriques d'utilisation