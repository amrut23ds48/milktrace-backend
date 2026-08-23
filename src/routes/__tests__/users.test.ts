import request from 'supertest';
import app from '../../app';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import {
  seedOrgAndRole,
  cleanupOrgs,
  disconnectTestPrisma,
} from '../../__tests__/helpers/testPrisma';

// ─── POST /api/v1/users ───────────────────────────────────────────────────────
// Integration tests for user creation. Written BEFORE implementation (TDD Red phase).
// These tests hit the real Express app with the real local database.

describe('POST /api/v1/users', () => {
  let orgId: string;
  let roleId: string;
  const createdOrgIds: string[] = [];

  beforeAll(async () => {
    const seed = await seedOrgAndRole();
    orgId = seed.orgId;
    roleId = seed.roleId;
    createdOrgIds.push(orgId);
  });

  afterAll(async () => {
    await cleanupOrgs(createdOrgIds);
    await disconnectTestPrisma();
  });

  it('should create a user and return 201 with safe user data', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .send({
        name: 'Priya Sharma',
        email: 'priya.sharma@test.com',
        password: 'SecurePass123!',
        organizationId: orgId,
        roleId: roleId,
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: expect.any(String),
      name: 'Priya Sharma',
      email: 'priya.sharma@test.com',
      organization_id: orgId,
      role_id: roleId,
      status: 'ACTIVE',
    });
    // CRITICAL: password_hash must NEVER be returned
    expect(res.body).not.toHaveProperty('password_hash');
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .send({
        // missing name, password, organizationId, roleId
        email: 'incomplete@test.com',
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: true,
      code: 'VALIDATION_ERROR',
    });
    expect(res.body.message).toBeDefined();
  });

  it('should return 400 when password is too short', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .send({
        name: 'Test User',
        email: 'short.password@test.com',
        password: '123', // too short
        organizationId: orgId,
        roleId: roleId,
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: true,
      code: 'VALIDATION_ERROR',
    });
  });

  it('should return 409 when email already exists', async () => {
    const email = 'duplicate.email@test.com';

    // First creation (should succeed)
    await request(app)
      .post('/api/v1/users')
      .send({
        name: 'User One',
        email,
        password: 'SecurePass123!',
        organizationId: orgId,
        roleId: roleId,
      });

    // Second creation with same email (should conflict)
    const res = await request(app)
      .post('/api/v1/users')
      .send({
        name: 'User Two',
        email,
        password: 'SecurePass123!',
        organizationId: orgId,
        roleId: roleId,
      });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({
      error: true,
      code: 'CONFLICT',
    });
  });
});
