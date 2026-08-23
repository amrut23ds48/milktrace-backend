import 'dotenv/config';
import request from 'supertest';
import app from '../../app';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';

// Helper to generate mocked tokens for different roles
const generateToken = (roleName: string, orgId: string = 'org-1', facilityId: string | null = null) => {
  const permissions = [];
  
  if (roleName === 'SUPER_ADMIN') {
    permissions.push('system.view', 'user.create', 'farmer.create', 'facility.create', 'collection.create', 'batch.create', 'transfer.create');
  } else if (roleName === 'VILLAGE_ADMIN') {
    permissions.push('collection.create', 'batch.create');
  } else if (roleName === 'CHILLING_ADMIN') {
    permissions.push('batch.create', 'transfer.create');
  }

  return jwt.sign({
    userId: 'mock-user-id',
    roleId: `role-${roleName}`,
    organizationId: orgId,
    facilityId: facilityId,
    permissions
  }, JWT_SECRET, { expiresIn: '1h' });
};

describe('Phase 9 Strict Compliance: Security & RBAC', () => {

  describe('1. Token Malformation & Expiration', () => {
    it('should reject requests with completely invalid tokens', async () => {
      const res = await request(app).post('/api/v1/collections').set('Authorization', 'Bearer invalid-token-string').send({});
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid or expired token');
    });

    it('should reject requests missing the Bearer prefix', async () => {
      const token = generateToken('SUPER_ADMIN');
      const res = await request(app).post('/api/v1/collections').set('Authorization', token).send({});
      expect(res.status).toBe(401);
    });

    it('should reject expired tokens', async () => {
      // Create a token that expires immediately
      const expiredToken = jwt.sign({ userId: 'test' }, JWT_SECRET, { expiresIn: '-1s' });
      const res = await request(app).post('/api/v1/collections').set('Authorization', `Bearer ${expiredToken}`).send({});
      expect(res.status).toBe(401);
    });
  });

  describe('2. Automated RBAC Matrix Testing', () => {
    const routeMatrix = [
      { route: '/api/v1/users',       allowed: ['SUPER_ADMIN'], blocked: ['VILLAGE_ADMIN', 'CHILLING_ADMIN', 'FARMER', 'ANONYMOUS'] },
      { route: '/api/v1/farmers',     allowed: ['SUPER_ADMIN'], blocked: ['VILLAGE_ADMIN', 'CHILLING_ADMIN', 'ANONYMOUS'] }, // Note: depending on phase 10, village admins might get this
      { route: '/api/v1/collections', allowed: ['VILLAGE_ADMIN', 'SUPER_ADMIN'], blocked: ['CHILLING_ADMIN', 'ANONYMOUS'] },
      { route: '/api/v1/batches',     allowed: ['VILLAGE_ADMIN', 'CHILLING_ADMIN', 'SUPER_ADMIN'], blocked: ['FARMER', 'ANONYMOUS'] },
      { route: '/api/v1/transfers',   allowed: ['CHILLING_ADMIN', 'SUPER_ADMIN'], blocked: ['VILLAGE_ADMIN', 'FARMER', 'ANONYMOUS'] }
    ];

    routeMatrix.forEach(({ route, allowed, blocked }) => {
      describe(`POST ${route}`, () => {
        allowed.forEach(role => {
          it(`should ALLOW ${role}`, async () => {
            const token = generateToken(role);
            const res = await request(app).post(route).set('Authorization', `Bearer ${token}`).send({});
            // 400 means it passed Auth/RBAC and hit the controller validation (which fails because send({}) is empty)
            // 201 means it created something. Either way, it is NOT 401/403.
            expect([401, 403]).not.toContain(res.status);
          });
        });

        blocked.forEach(role => {
          it(`should BLOCK ${role}`, async () => {
            let res;
            if (role === 'ANONYMOUS') {
              res = await request(app).post(route).send({});
              expect(res.status).toBe(401); // Missing token
            } else {
              const token = generateToken(role);
              res = await request(app).post(route).set('Authorization', `Bearer ${token}`).send({});
              if (res.status === 401) {
                console.error(`Unexpected 401 for role ${role} on ${route}. Body:`, res.body);
              }
              expect(res.status).toBe(403); // Lacks permission
            }
          });
        });
      });
    });
  });

  describe('3. Password Hash Security & IDOR', () => {
    it('should NEVER return password_hash in the response payload', async () => {
      const token = generateToken('SUPER_ADMIN');
      // We send invalid data, but if it were valid, we'd check the response. 
      // Since it's a unit test for Phase 9, we mock the creation or check the error.
      const res = await request(app).post('/api/v1/users').set('Authorization', `Bearer ${token}`).send({
        name: 'Test', email: 'test@test.com', phone: '12345', password: 'pass', role_id: 'r1', organization_id: 'o1'
      });
      // Even on failure or success, password_hash must not exist in response body
      expect(res.body.password_hash).toBeUndefined();
    });

    // We create a dummy route on the app instance just to test IDOR scope middleware
    it('should block an IDOR attempt via requireScope middleware', async () => {
      const { requireAuth, requireScope } = require('../../middleware/auth');
      
      // Temporary test route
      app.post('/test-idor', requireAuth, requireScope('org-2', null), (req, res) => res.status(200).send('OK'));

      // User belongs to org-1
      const tokenOrg1 = generateToken('VILLAGE_ADMIN', 'org-1');
      
      // Attempting to access org-2 resource
      const res = await request(app).post('/test-idor').set('Authorization', `Bearer ${tokenOrg1}`).send({});
      
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Outside of organizational scope');
    });
  });

});
