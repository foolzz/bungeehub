/**
 * Scanning and Deliveries E2E Tests
 * Tests for Phase 4 (Scanning) and Phase 5 (Proof of Delivery)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Scanning and Deliveries (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let hubHostToken: string;
  let hubId: string;
  let packageId: string;
  let barcode: string;
  let deliveryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Setup: Create admin, hub host, hub, and package
    const adminRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `scanadmin-${Date.now()}@example.com`,
        password: 'Admin123!',
        name: 'Scan Admin',
        role: 'ADMIN',
      });
    adminToken = adminRes.body.access_token;

    const hubHostRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `scanhub-${Date.now()}@example.com`,
        password: 'HubHost123!',
        name: 'Scan Hub Host',
        role: 'HUB_HOST',
      });
    hubHostToken = hubHostRes.body.access_token;

    const hubRes = await request(app.getHttpServer())
      .post('/hubs')
      .set('Authorization', `Bearer ${hubHostToken}`)
      .send({
        name: 'Scan Test Hub',
        address: '789 Scan St',
        latitude: 37.7749,
        longitude: -122.4194,
      });
    hubId = hubRes.body.id;

    await request(app.getHttpServer())
      .post(`/hubs/${hubId}/activate`)
      .set('Authorization', `Bearer ${adminToken}`);

    barcode = `SCAN-${Date.now()}`;
    const pkgRes = await request(app.getHttpServer())
      .post('/packages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        trackingNumber: `SCNTRK-${Date.now()}`,
        barcode,
        assignedHubId: hubId,
        recipientName: 'Scan Test User',
        deliveryAddress: '999 Delivery Lane',
      });
    packageId = pkgRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Package Scanning', () => {
    describe('/scanning/package (POST)', () => {
      it('should scan package and update status', () => {
        return request(app.getHttpServer())
          .post('/scanning/package')
          .set('Authorization', `Bearer ${hubHostToken}`)
          .send({
            barcode,
            latitude: 37.7749,
            longitude: -122.4194,
          })
          .expect(201)
          .expect((res) => {
            expect(res.body.id).toBe(packageId);
            expect(res.body.barcode).toBe(barcode);
            expect(res.body.status).toBe('AT_HUB');
          });
      });

      it('should fail with non-existent barcode', () => {
        return request(app.getHttpServer())
          .post('/scanning/package')
          .set('Authorization', `Bearer ${hubHostToken}`)
          .send({
            barcode: 'NON-EXISTENT-BARCODE',
            latitude: 37.7749,
            longitude: -122.4194,
          })
          .expect(404);
      });

      it('should fail without barcode', () => {
        return request(app.getHttpServer())
          .post('/scanning/package')
          .set('Authorization', `Bearer ${hubHostToken}`)
          .send({
            latitude: 37.7749,
            longitude: -122.4194,
          })
          .expect(400);
      });

      it('should fail without authentication', () => {
        return request(app.getHttpServer())
          .post('/scanning/package')
          .send({
            barcode,
            latitude: 37.7749,
            longitude: -122.4194,
          })
          .expect(401);
      });

      it('should transition package status on subsequent scans', () => {
        return request(app.getHttpServer())
          .post('/scanning/package')
          .set('Authorization', `Bearer ${hubHostToken}`)
          .send({
            barcode,
            latitude: 37.7750,
            longitude: -122.4195,
          })
          .expect(201)
          .expect((res) => {
            expect(res.body.status).toBe('OUT_FOR_DELIVERY');
          });
      });
    });

    describe('/scanning/package/:packageId/history (GET)', () => {
      it('should get package scan history', () => {
        return request(app.getHttpServer())
          .get(`/scanning/package/${packageId}/history`)
          .set('Authorization', `Bearer ${hubHostToken}`)
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body[0]).toHaveProperty('eventType');
            expect(res.body[0]).toHaveProperty('packageId');
            expect(res.body[0]).toHaveProperty('createdAt');
          });
      });

      it('should fail with non-existent package id', () => {
        return request(app.getHttpServer())
          .get('/scanning/package/00000000-0000-0000-0000-000000000000/history')
          .set('Authorization', `Bearer ${hubHostToken}`)
          .expect(404);
      });
    });
  });

  describe('Deliveries', () => {
    describe('/deliveries (POST)', () => {
      it('should create a delivery', () => {
        return request(app.getHttpServer())
          .post('/deliveries')
          .set('Authorization', `Bearer ${hubHostToken}`)
          .send({
            packageId,
            hubId,
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('id');
            expect(res.body.packageId).toBe(packageId);
            expect(res.body.hubId).toBe(hubId);
            expect(res.body.status).toBe('PENDING');
            deliveryId = res.body.id;
          });
      });

      it('should fail with non-existent package', () => {
        return request(app.getHttpServer())
          .post('/deliveries')
          .set('Authorization', `Bearer ${hubHostToken}`)
          .send({
            packageId: '00000000-0000-0000-0000-000000000000',
            hubId,
          })
          .expect(404);
      });

      it('should fail without required fields', () => {
        return request(app.getHttpServer())
          .post('/deliveries')
          .set('Authorization', `Bearer ${hubHostToken}`)
          .send({
            packageId,
          })
          .expect(400);
      });
    });

    describe('/deliveries/:id (GET)', () => {
      it('should get delivery details', () => {
        return request(app.getHttpServer())
          .get(`/deliveries/${deliveryId}`)
          .set('Authorization', `Bearer ${hubHostToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.id).toBe(deliveryId);
            expect(res.body).toHaveProperty('package');
            expect(res.body).toHaveProperty('hub');
          });
      });

      it('should fail with non-existent delivery', () => {
        return request(app.getHttpServer())
          .get('/deliveries/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${hubHostToken}`)
          .expect(404);
      });
    });

    describe('/deliveries/hub/:hubId (GET)', () => {
      it('should get all deliveries for a hub', () => {
        return request(app.getHttpServer())
          .get(`/deliveries/hub/${hubId}`)
          .set('Authorization', `Bearer ${hubHostToken}`)
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
            res.body.forEach((delivery: any) => {
              expect(delivery.hubId).toBe(hubId);
            });
          });
      });

      it('should fail with non-existent hub', () => {
        return request(app.getHttpServer())
          .get('/deliveries/hub/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${hubHostToken}`)
          .expect(404);
      });
    });

    describe('/deliveries/:id/proof-of-delivery (POST)', () => {
      it('should submit proof of delivery', () => {
        return request(app.getHttpServer())
          .post(`/deliveries/${deliveryId}/proof-of-delivery`)
          .set('Authorization', `Bearer ${hubHostToken}`)
          .send({
            proofOfDeliveryUrl: 'https://example.com/pod-photo.jpg',
            latitude: 37.7760,
            longitude: -122.4200,
            recipientName: 'John Receiver',
            notes: 'Delivered to front door',
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.status).toBe('COMPLETED');
            expect(res.body.proofOfDeliveryUrl).toBe('https://example.com/pod-photo.jpg');
            expect(res.body.recipientName).toBe('John Receiver');
            expect(res.body).toHaveProperty('deliveredAt');
          });
      });

      it('should fail without proof of delivery URL', () => {
        // Create another delivery for this test
        return request(app.getHttpServer())
          .post('/deliveries')
          .set('Authorization', `Bearer ${hubHostToken}`)
          .send({
            packageId: packageId,
            hubId,
          })
          .then((res) => {
            const newDeliveryId = res.body.id;
            return request(app.getHttpServer())
              .post(`/deliveries/${newDeliveryId}/proof-of-delivery`)
              .set('Authorization', `Bearer ${hubHostToken}`)
              .send({
                recipientName: 'Test',
              })
              .expect(400);
          });
      });

      it('should fail with non-existent delivery', () => {
        return request(app.getHttpServer())
          .post('/deliveries/00000000-0000-0000-0000-000000000000/proof-of-delivery')
          .set('Authorization', `Bearer ${hubHostToken}`)
          .send({
            proofOfDeliveryUrl: 'https://example.com/pod.jpg',
          })
          .expect(404);
      });
    });

    describe('/deliveries/:id/mark-failed (POST)', () => {
      let failDeliveryId: string;

      beforeAll(async () => {
        // Create another package and delivery for fail test
        const pkgRes = await request(app.getHttpServer())
          .post('/packages')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            trackingNumber: `FAIL-${Date.now()}`,
            barcode: `FAILBAR-${Date.now()}`,
            assignedHubId: hubId,
          });

        const delRes = await request(app.getHttpServer())
          .post('/deliveries')
          .set('Authorization', `Bearer ${hubHostToken}`)
          .send({
            packageId: pkgRes.body.id,
            hubId,
          });
        failDeliveryId = delRes.body.id;
      });

      it('should mark delivery as failed', () => {
        return request(app.getHttpServer())
          .post(`/deliveries/${failDeliveryId}/mark-failed`)
          .set('Authorization', `Bearer ${hubHostToken}`)
          .send({
            reason: 'Recipient not available',
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.status).toBe('FAILED');
            expect(res.body.notes).toContain('Recipient not available');
          });
      });

      it('should fail without reason', () => {
        return request(app.getHttpServer())
          .post(`/deliveries/${failDeliveryId}/mark-failed`)
          .set('Authorization', `Bearer ${hubHostToken}`)
          .send({})
          .expect(400);
      });
    });

    describe('/deliveries/:id (PUT)', () => {
      let updateDeliveryId: string;

      beforeAll(async () => {
        const pkgRes = await request(app.getHttpServer())
          .post('/packages')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            trackingNumber: `UPD-${Date.now()}`,
            barcode: `UPDBAR-${Date.now()}`,
            assignedHubId: hubId,
          });

        const delRes = await request(app.getHttpServer())
          .post('/deliveries')
          .set('Authorization', `Bearer ${hubHostToken}`)
          .send({
            packageId: pkgRes.body.id,
            hubId,
          });
        updateDeliveryId = delRes.body.id;
      });

      it('should update delivery', () => {
        return request(app.getHttpServer())
          .put(`/deliveries/${updateDeliveryId}`)
          .set('Authorization', `Bearer ${hubHostToken}`)
          .send({
            status: 'IN_PROGRESS',
            notes: 'On the way',
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.status).toBe('IN_PROGRESS');
            expect(res.body.notes).toBe('On the way');
          });
      });
    });
  });
});
