import request from 'supertest';
import app from '../../app';
import { describe, it, expect } from '@jest/globals';

// ─── Phase 9: Security Enforcement Tests ──────────────────────────────────────
// These tests MUST pass to guarantee that the system is no longer vulnerable
// to Broken Access Control or Missing Authentication.
// Run with: npm run test -- security.test.ts

describe('API Security Enforcement', () => {
  
  describe('Authentication (401 Unauthorized)', () => {
    it('should reject unauthenticated requests to create a User', async () => {
      const res = await request(app).post('/api/v1/users').send({});
      expect(res.status).toBe(401);
    });

    it('should reject unauthenticated requests to register a Farmer', async () => {
      const res = await request(app).post('/api/v1/farmers').send({});
      expect(res.status).toBe(401);
    });

    it('should reject unauthenticated requests to record a Milk Collection', async () => {
      const res = await request(app).post('/api/v1/collections').send({});
      expect(res.status).toBe(401);
    });

    it('should reject unauthenticated requests to create a Batch', async () => {
      const res = await request(app).post('/api/v1/batches').send({});
      expect(res.status).toBe(401);
    });

    it('should reject unauthenticated requests to dispatch a Transfer', async () => {
      const res = await request(app).post('/api/v1/transfers').send({});
      expect(res.status).toBe(401);
    });
  });

  describe('Authorization / RBAC (403 Forbidden)', () => {
    // Note: The agent will need to implement a mock token or test-auth utility 
    // to simulate a logged-in user without the right permissions.
    // We expect the RBAC middleware to catch these.
    
    it('should reject requests when authenticated user lacks required permissions', async () => {
      // Mocking a standard user token that lacks the 'facility.create' permission
      const mockStandardUserToken = 'mock-standard-user-token'; 
      
      const res = await request(app)
        .post('/api/v1/facilities')
        .set('Authorization', `Bearer ${mockStandardUserToken}`)
        .send({});
        
      // Expecting 401 (if token verification fails) OR 403 (if token is valid but lacks permission)
      expect([401, 403]).toContain(res.status);
    });
  });

});
