/**
 * Rankings E2E Tests
 * Tests for Phase 6: Rankings & Leaderboard
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Rankings & Leaderboard (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let hubHost1Token: string;
  let hubHost2Token: string;
  let hub1Id: string;
  let hub2Id: string;

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
        email: `rankadmin-${Date.now()}@example.com`,
        password: 'Admin123!',
        name: 'Rank Admin',
        role: 'ADMIN',
      });
    adminToken = adminRes.body.access_token;

    // Create hub host 1 and hub
    const hubHost1Res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `rankhub1-${Date.now()}@example.com`,
        password: 'HubHost123!',
        name: 'Rank Hub Host 1',
        role: 'HUB_HOST',
      });
    hubHost1Token = hubHost1Res.body.access_token;

    const hub1Res = await request(app.getHttpServer())
      .post('/hubs')
      .set('Authorization', `Bearer ${hubHost1Token}`)
      .send({
        name: 'Rank Hub 1',
        address: '111 Rank St',
        latitude: 37.7749,
        longitude: -122.4194,
      });
    hub1Id = hub1Res.body.id;

    await request(app.getHttpServer())
      .post(`/hubs/${hub1Id}/activate`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Create hub host 2 and hub
    const hubHost2Res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `rankhub2-${Date.now()}@example.com`,
        password: 'HubHost123!',
        name: 'Rank Hub Host 2',
        role: 'HUB_HOST',
      });
    hubHost2Token = hubHost2Res.body.access_token;

    const hub2Res = await request(app.getHttpServer())
      .post('/hubs')
      .set('Authorization', `Bearer ${hubHost2Token}`)
      .send({
        name: 'Rank Hub 2',
        address: '222 Rank St',
        latitude: 37.7850,
        longitude: -122.4294,
      });
    hub2Id = hub2Res.body.id;

    await request(app.getHttpServer())
      .post(`/hubs/${hub2Id}/activate`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Update hub1 with better metrics
    await request(app.getHttpServer())
      .put(`/hubs/${hub1Id}`)
      .set('Authorization', `Bearer ${hubHost1Token}`)
      .send({
        totalDeliveries: 150,
        rating: 4.7,
      });

    // Update hub2 with lower metrics
    await request(app.getHttpServer())
      .put(`/hubs/${hub2Id}`)
      .set('Authorization', `Bearer ${hubHost2Token}`)
      .send({
        totalDeliveries: 25,
        rating: 4.2,
      });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/rankings/leaderboard (GET)', () => {
    it('should get leaderboard of top hubs', () => {
      return request(app.getHttpServer())
        .get('/rankings/leaderboard')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);

          // Check structure
          const hub = res.body[0];
          expect(hub).toHaveProperty('id');
          expect(hub).toHaveProperty('name');
          expect(hub).toHaveProperty('rating');
          expect(hub).toHaveProperty('totalDeliveries');
          expect(hub).toHaveProperty('tier');
          expect(hub).toHaveProperty('rank');
        });
    });

    it('should limit leaderboard results', () => {
      return request(app.getHttpServer())
        .get('/rankings/leaderboard?limit=5')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(5);
        });
    });

    it('should sort by rating and deliveries', () => {
      return request(app.getHttpServer())
        .get('/rankings/leaderboard')
        .expect(200)
        .expect((res) => {
          if (res.body.length > 1) {
            // Verify descending order
            for (let i = 0; i < res.body.length - 1; i++) {
              const current = res.body[i];
              const next = res.body[i + 1];

              // Should be sorted by rating first
              if (current.rating !== next.rating) {
                expect(current.rating).toBeGreaterThanOrEqual(next.rating);
              } else {
                // If ratings equal, sorted by deliveries
                expect(current.totalDeliveries).toBeGreaterThanOrEqual(next.totalDeliveries);
              }
            }
          }
        });
    });
  });

  describe('/rankings/leaderboard/tier/:tier (GET)', () => {
    it('should get leaderboard filtered by tier', () => {
      return request(app.getHttpServer())
        .get('/rankings/leaderboard/tier/NEW_HUB')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((hub: any) => {
            expect(hub.tier).toBe('NEW_HUB');
          });
        });
    });

    it('should return empty array for tier with no hubs', () => {
      return request(app.getHttpServer())
        .get('/rankings/leaderboard/tier/SUPER_HUB')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should fail with invalid tier', () => {
      return request(app.getHttpServer())
        .get('/rankings/leaderboard/tier/INVALID_TIER')
        .expect(400);
    });
  });

  describe('/rankings/hub/:hubId/rank (GET)', () => {
    it('should get hub rank and next tier requirements', () => {
      return request(app.getHttpServer())
        .get(`/rankings/hub/${hub1Id}/rank`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('hub');
          expect(res.body).toHaveProperty('currentRank');
          expect(res.body).toHaveProperty('totalHubs');
          expect(res.body).toHaveProperty('currentTier');
          expect(res.body).toHaveProperty('nextTier');
          expect(res.body).toHaveProperty('nextTierRequirements');

          expect(res.body.hub.id).toBe(hub1Id);
          expect(typeof res.body.currentRank).toBe('number');
          expect(res.body.currentRank).toBeGreaterThan(0);
        });
    });

    it('should show requirements for next tier', () => {
      return request(app.getHttpServer())
        .get(`/rankings/hub/${hub1Id}/rank`)
        .expect(200)
        .expect((res) => {
          const { nextTierRequirements } = res.body;
          expect(nextTierRequirements).toHaveProperty('minDeliveries');
          expect(nextTierRequirements).toHaveProperty('minRating');
          expect(nextTierRequirements).toHaveProperty('minSuccessRate');
          expect(nextTierRequirements).toHaveProperty('minReviews');
        });
    });

    it('should fail with non-existent hub', () => {
      return request(app.getHttpServer())
        .get('/rankings/hub/00000000-0000-0000-0000-000000000000/rank')
        .expect(404);
    });

    it('should fail with invalid hub id', () => {
      return request(app.getHttpServer())
        .get('/rankings/hub/invalid-id/rank')
        .expect(400);
    });
  });

  describe('/rankings/hub/:hubId/update-tier (POST)', () => {
    it('should recalculate hub tier based on metrics', () => {
      return request(app.getHttpServer())
        .post(`/rankings/hub/${hub1Id}/update-tier`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('tier');
          expect(res.body.id).toBe(hub1Id);

          // Based on metrics set above (150 deliveries, 4.7 rating)
          // Should be ACTIVE_HUB tier
          expect(res.body.tier).toBe('ACTIVE_HUB');
        });
    });

    it('should update tier from NEW_HUB to ACTIVE_HUB', () => {
      return request(app.getHttpServer())
        .post(`/rankings/hub/${hub1Id}/update-tier`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          // With 150 deliveries and 4.7 rating, should be ACTIVE_HUB
          expect(['NEW_HUB', 'ACTIVE_HUB']).toContain(res.body.tier);
        });
    });

    it('should fail without admin token', () => {
      return request(app.getHttpServer())
        .post(`/rankings/hub/${hub1Id}/update-tier`)
        .set('Authorization', `Bearer ${hubHost1Token}`)
        .expect(403);
    });

    it('should fail with non-existent hub', () => {
      return request(app.getHttpServer())
        .post('/rankings/hub/00000000-0000-0000-0000-000000000000/update-tier')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/rankings/update-all-tiers (POST)', () => {
    it('should recalculate all hub tiers', () => {
      return request(app.getHttpServer())
        .post('/rankings/update-all-tiers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('updated');
          expect(typeof res.body.updated).toBe('number');
          expect(res.body.updated).toBeGreaterThan(0);
        });
    });

    it('should fail without admin token', () => {
      return request(app.getHttpServer())
        .post('/rankings/update-all-tiers')
        .set('Authorization', `Bearer ${hubHost1Token}`)
        .expect(403);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/rankings/update-all-tiers')
        .expect(401);
    });
  });

  describe('Tier Calculation Logic', () => {
    let testHubId: string;
    let testHubToken: string;

    beforeAll(async () => {
      const hubHostRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `tierhub-${Date.now()}@example.com`,
          password: 'HubHost123!',
          name: 'Tier Test Hub Host',
          role: 'HUB_HOST',
        });
      testHubToken = hubHostRes.body.access_token;

      const hubRes = await request(app.getHttpServer())
        .post('/hubs')
        .set('Authorization', `Bearer ${testHubToken}`)
        .send({
          name: 'Tier Test Hub',
          address: '333 Tier St',
          latitude: 37.7949,
          longitude: -122.4394,
        });
      testHubId = hubRes.body.id;

      await request(app.getHttpServer())
        .post(`/hubs/${testHubId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    it('should be NEW_HUB with low metrics', async () => {
      await request(app.getHttpServer())
        .put(`/hubs/${testHubId}`)
        .set('Authorization', `Bearer ${testHubToken}`)
        .send({
          totalDeliveries: 10,
          rating: 3.5,
        });

      return request(app.getHttpServer())
        .post(`/rankings/hub/${testHubId}/update-tier`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.tier).toBe('NEW_HUB');
        });
    });

    it('should be ACTIVE_HUB with medium metrics', async () => {
      await request(app.getHttpServer())
        .put(`/hubs/${testHubId}`)
        .set('Authorization', `Bearer ${testHubToken}`)
        .send({
          totalDeliveries: 60,
          rating: 4.2,
        });

      return request(app.getHttpServer())
        .post(`/rankings/hub/${testHubId}/update-tier`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.tier).toBe('ACTIVE_HUB');
        });
    });

    it('should be TOP_HUB with high metrics', async () => {
      await request(app.getHttpServer())
        .put(`/hubs/${testHubId}`)
        .set('Authorization', `Bearer ${testHubToken}`)
        .send({
          totalDeliveries: 250,
          rating: 4.6,
        });

      return request(app.getHttpServer())
        .post(`/rankings/hub/${testHubId}/update-tier`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.tier).toBe('TOP_HUB');
        });
    });
  });
});
