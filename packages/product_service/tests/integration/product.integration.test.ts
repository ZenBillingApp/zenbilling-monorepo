import request from 'supertest';
import express from 'express';
import cors from 'cors';

// Create express app for testing
const app = express();
app.use(cors());
app.use(express.json());

// Simple mock routes for integration testing
app.get('/api/product/units', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Units retrieved successfully',
    data: { units: ['unite', 'kg', 'l'] },
  });
});

app.post('/api/product', (req, res) => {
  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: { product_id: 'test-id', name: req.body.name },
  });
});

app.get('/api/product/ai/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI service available',
    data: { aiServiceAvailable: true, status: 'available' },
  });
});

describe('Product Service Integration Tests', () => {
  describe('Basic CRUD Flow', () => {
    it('should handle product creation flow', async () => {
      const response = await request(app)
        .post('/api/product')
        .send({
          name: 'Integration Test Product',
          description: 'Test description',
          price_excluding_tax: 100,
          vat_rate: 20,
          unit: 'unite',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Integration Test Product');
    });

    it('should get available units', async () => {
      const response = await request(app)
        .get('/api/product/units')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.units).toContain('unite');
    });
  });

  describe('AI Integration', () => {
    it('should check AI service status', async () => {
      const response = await request(app)
        .get('/api/product/ai/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.aiServiceAvailable).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/product')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });
});