/**
 * Package Management E2E Tests
 * Tests for Phase 3: Package Management
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Package Management (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let hubHostToken: string;
  let hubId: string;
  let packageId: string;
  let batchId: string;
  let trackingNumber: string;
  let barcode: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Create admin
    const adminRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `pkgadmin-${Date.now()}@example.com`,
        password: 'Admin123!',
        name: 'Package Admin',
        role: 'ADMIN',
      });
    adminToken = adminRes.body.access_token;

    // Create hub host and hub
    const hubHostRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `pkghub-${Date.now()}@example.com`,
        password: 'HubHost123!',
        name: 'Package Hub Host',
        role: 'HUB_HOST',
      });
    hubHostToken = hubHostRes.body.access_token;

    const hubRes = await request(app.getHttpServer())
      .post('/hubs')
      .set('Authorization', `Bearer ${hubHostToken}`)
      .send({
        name: 'Package Test Hub',
        address: '123 Package St',
        latitude: 37.7749,
        longitude: -122.4194,
      });
    hubId = hubRes.body.id;

    // Activate hub
    await request(app.getHttpServer())
      .post(`/hubs/${hubId}/activate`)
      .set('Authorization', `Bearer ${adminToken}`);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/packages (POST)', () => {
    it('should create a new package', () => {
      const timestamp = Date.now();
      trackingNumber = `TRK-${timestamp}`;
      barcode = `BAR-${timestamp}`;

      return request(app.getHttpServer())
        .post('/packages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trackingNumber,
          barcode,
          assignedHubId: hubId,
          recipientName: 'John Doe',
          deliveryAddress: '456 Delivery Ave',
          weight: 2.5,
          dimensions: '12x8x6',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.trackingNumber).toBe(trackingNumber);
          expect(res.body.barcode).toBe(barcode);
          expect(res.body.status).toBe('PENDING');
          packageId = res.body.id;
        });
    });

    it('should fail with duplicate tracking number', () => {
      return request(app.getHttpServer())
        .post('/packages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trackingNumber, // Same as above
          barcode: `BAR-${Date.now()}`,
          assignedHubId: hubId,
        })
        .expect(400);
    });

    it('should fail with duplicate barcode', () => {
      return request(app.getHttpServer())
        .post('/packages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trackingNumber: `TRK-${Date.now()}`,
          barcode, // Same as above
          assignedHubId: hubId,
        })
        .expect(400);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/packages')
        .send({
          trackingNumber: `TRK-${Date.now()}`,
          barcode: `BAR-${Date.now()}`,
        })
        .expect(401);
    });
  });

  describe('/packages (GET)', () => {
    it('should get all packages', () => {
      return request(app.getHttpServer())
        .get('/packages')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should filter by status', () => {
      return request(app.getHttpServer())
        .get('/packages?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((pkg: any) => {
            expect(pkg.status).toBe('PENDING');
          });
        });
    });

    it('should filter by hub', () => {
      return request(app.getHttpServer())
        .get(`/packages?hubId=${hubId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should paginate results', () => {
      return request(app.getHttpServer())
        .get('/packages?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(10);
        });
    });
  });

  describe('/packages/tracking/:trackingNumber (GET)', () => {
    it('should get package by tracking number', () => {
      return request(app.getHttpServer())
        .get(`/packages/tracking/${trackingNumber}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.trackingNumber).toBe(trackingNumber);
          expect(res.body.id).toBe(packageId);
        });
    });

    it('should fail with non-existent tracking number', () => {
      return request(app.getHttpServer())
        .get('/packages/tracking/NON-EXISTENT')
        .expect(404);
    });
  });

  describe('/packages/barcode/:barcode (GET)', () => {
    it('should get package by barcode', () => {
      return request(app.getHttpServer())
        .get(`/packages/barcode/${barcode}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.barcode).toBe(barcode);
          expect(res.body.id).toBe(packageId);
        });
    });

    it('should fail with non-existent barcode', () => {
      return request(app.getHttpServer())
        .get('/packages/barcode/NON-EXISTENT')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/packages/:id (PUT)', () => {
    it('should update package', () => {
      return request(app.getHttpServer())
        .put(`/packages/${packageId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          recipientName: 'Jane Doe Updated',
          notes: 'Handle with care',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.recipientName).toBe('Jane Doe Updated');
          expect(res.body.notes).toBe('Handle with care');
        });
    });

    it('should fail to update non-existent package', () => {
      return request(app.getHttpServer())
        .put('/packages/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'Test',
        })
        .expect(404);
    });
  });

  describe('/packages/batches (POST)', () => {
    it('should create a batch', () => {
      return request(app.getHttpServer())
        .post('/packages/batches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          hubId,
          name: `Batch-${Date.now()}`,
          expectedDeliveryDate: new Date(Date.now() + 86400000).toISOString(),
          notes: 'Test batch',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.hubId).toBe(hubId);
          expect(res.body.status).toBe('PENDING');
          batchId = res.body.id;
        });
    });

    it('should fail without hub id', () => {
      return request(app.getHttpServer())
        .post('/packages/batches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Batch-${Date.now()}`,
        })
        .expect(400);
    });
  });

  describe('/packages/batches/:id/assign-packages (POST)', () => {
    it('should assign packages to batch', () => {
      return request(app.getHttpServer())
        .post(`/packages/batches/${batchId}/assign-packages`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          packageIds: [packageId],
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.assigned).toBe(1);
        });
    });

    it('should fail with non-existent batch', () => {
      return request(app.getHttpServer())
        .post('/packages/batches/00000000-0000-0000-0000-000000000000/assign-packages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          packageIds: [packageId],
        })
        .expect(404);
    });

    it('should fail with empty package list', () => {
      return request(app.getHttpServer())
        .post(`/packages/batches/${batchId}/assign-packages`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          packageIds: [],
        })
        .expect(400);
    });
  });

  describe('/packages/batches (GET)', () => {
    it('should get all batches', () => {
      return request(app.getHttpServer())
        .get('/packages/batches')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should filter batches by hub', () => {
      return request(app.getHttpServer())
        .get(`/packages/batches?hubId=${hubId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('/packages/batches/:id (GET)', () => {
    it('should get batch details', () => {
      return request(app.getHttpServer())
        .get(`/packages/batches/${batchId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(batchId);
          expect(res.body).toHaveProperty('packages');
          expect(Array.isArray(res.body.packages)).toBe(true);
        });
    });

    it('should fail with non-existent batch', () => {
      return request(app.getHttpServer())
        .get('/packages/batches/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/packages/:id (DELETE)', () => {
    let deletePackageId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/packages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trackingNumber: `DEL-${Date.now()}`,
          barcode: `DELBAR-${Date.now()}`,
          assignedHubId: hubId,
        });
      deletePackageId = res.body.id;
    });

    it('should delete package', () => {
      return request(app.getHttpServer())
        .delete(`/packages/${deletePackageId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should fail to delete non-existent package', () => {
      return request(app.getHttpServer())
        .delete('/packages/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
