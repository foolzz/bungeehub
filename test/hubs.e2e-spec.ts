/**
 * Hub Management E2E Tests
 * Tests for Phase 2: Hub Management
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Hub Management (e2e)', () => {
  let app: INestApplication;
  let hubHostToken: string;
  let hubHostUserId: string;
  let adminToken: string;
  let hubId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Create hub host user
    const hubHostRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `hubhost-${Date.now()}@example.com`,
        password: 'HubHost123!',
        name: 'Test Hub Host',
        role: 'HUB_HOST',
      });

    hubHostToken = hubHostRes.body.access_token;
    hubHostUserId = hubHostRes.body.user.id;

    // Create admin user
    const adminRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `admin-${Date.now()}@example.com`,
        password: 'Admin123!',
        name: 'Test Admin',
        role: 'ADMIN',
      });

    adminToken = adminRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/hubs (POST)', () => {
    it('should create a new hub as hub host', () => {
      return request(app.getHttpServer())
        .post('/hubs')
        .set('Authorization', `Bearer ${hubHostToken}`)
        .send({
          name: 'Test Hub',
          address: '123 Test St, Test City, TC 12345',
          latitude: 37.7749,
          longitude: -122.4194,
          capacity: 100,
          operatingHours: '9:00 AM - 6:00 PM',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Test Hub');
          expect(res.body.ownerId).toBe(hubHostUserId);
          expect(res.body.tier).toBe('NEW_HUB');
          expect(res.body.status).toBe('PENDING');
          hubId = res.body.id;
        });
    });

    it('should fail to create hub without authentication', () => {
      return request(app.getHttpServer())
        .post('/hubs')
        .send({
          name: 'Unauthorized Hub',
          address: '456 Test St',
          latitude: 37.7749,
          longitude: -122.4194,
        })
        .expect(401);
    });

    it('should fail with invalid coordinates', () => {
      return request(app.getHttpServer())
        .post('/hubs')
        .set('Authorization', `Bearer ${hubHostToken}`)
        .send({
          name: 'Invalid Coords Hub',
          address: '789 Test St',
          latitude: 200, // Invalid
          longitude: -122.4194,
        })
        .expect(400);
    });

    it('should fail without required fields', () => {
      return request(app.getHttpServer())
        .post('/hubs')
        .set('Authorization', `Bearer ${hubHostToken}`)
        .send({
          name: 'Incomplete Hub',
        })
        .expect(400);
    });
  });

  describe('/hubs (GET)', () => {
    it('should get all hubs', () => {
      return request(app.getHttpServer())
        .get('/hubs')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should filter hubs by status', () => {
      return request(app.getHttpServer())
        .get('/hubs?status=PENDING')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((hub: any) => {
            expect(hub.status).toBe('PENDING');
          });
        });
    });

    it('should filter hubs by tier', () => {
      return request(app.getHttpServer())
        .get('/hubs?tier=NEW_HUB')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((hub: any) => {
            expect(hub.tier).toBe('NEW_HUB');
          });
        });
    });

    it('should paginate hubs', () => {
      return request(app.getHttpServer())
        .get('/hubs?page=1&limit=5')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(5);
        });
    });
  });

  describe('/hubs/:id (GET)', () => {
    it('should get hub by id', () => {
      return request(app.getHttpServer())
        .get(`/hubs/${hubId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(hubId);
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('address');
          expect(res.body).toHaveProperty('tier');
        });
    });

    it('should fail with non-existent hub id', () => {
      return request(app.getHttpServer())
        .get('/hubs/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('should fail with invalid hub id format', () => {
      return request(app.getHttpServer())
        .get('/hubs/invalid-id')
        .expect(400);
    });
  });

  describe('/hubs/:id (PUT)', () => {
    it('should update hub as owner', () => {
      return request(app.getHttpServer())
        .put(`/hubs/${hubId}`)
        .set('Authorization', `Bearer ${hubHostToken}`)
        .send({
          name: 'Updated Test Hub',
          operatingHours: '8:00 AM - 8:00 PM',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Test Hub');
          expect(res.body.operatingHours).toBe('8:00 AM - 8:00 PM');
        });
    });

    it('should fail to update without authentication', () => {
      return request(app.getHttpServer())
        .put(`/hubs/${hubId}`)
        .send({
          name: 'Unauthorized Update',
        })
        .expect(401);
    });
  });

  describe('/hubs/:id/activate (POST)', () => {
    it('should activate hub as admin', () => {
      return request(app.getHttpServer())
        .post(`/hubs/${hubId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ACTIVE');
        });
    });
  });

  describe('/hubs/:id/deactivate (POST)', () => {
    it('should deactivate hub as admin', () => {
      return request(app.getHttpServer())
        .post(`/hubs/${hubId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Testing deactivation',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('INACTIVE');
        });
    });
  });

  describe('/hubs/my-hub (GET)', () => {
    beforeAll(async () => {
      // Reactivate hub for this test
      await request(app.getHttpServer())
        .post(`/hubs/${hubId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    it('should get hub for logged-in host', () => {
      return request(app.getHttpServer())
        .get('/hubs/my-hub')
        .set('Authorization', `Bearer ${hubHostToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(hubId);
          expect(res.body.ownerId).toBe(hubHostUserId);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/hubs/my-hub')
        .expect(401);
    });
  });

  describe('/hubs/nearby (GET)', () => {
    it('should get nearby hubs', () => {
      return request(app.getHttpServer())
        .get('/hubs/nearby?latitude=37.7749&longitude=-122.4194&radius=50')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should fail without required coordinates', () => {
      return request(app.getHttpServer())
        .get('/hubs/nearby')
        .expect(400);
    });

    it('should fail with invalid coordinates', () => {
      return request(app.getHttpServer())
        .get('/hubs/nearby?latitude=200&longitude=-122.4194')
        .expect(400);
    });
  });
});
