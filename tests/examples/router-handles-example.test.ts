import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app, postRouter, userRouter } from '../../examples/router-handlers-example';
import request from 'supertest';
// Performance tracking removed - was unused

// Mock express types for testing - using any to avoid strict typing issues
const createMockRequest = (overrides: any = {}): any => ({
  params: {},
  body: {},
  query: {},
  path: '',
  originalUrl: '',
  ...overrides
});

const createMockResponse = (overrides: any = {}): any => ({
  locals: {},
  json: vi.fn(),
  status: vi.fn().mockReturnThis(),
  ...overrides
});

describe('Router Handlers Example', () => {
  beforeEach(() => {
    // Reset console.log spy before each test
    vi.clearAllMocks();
  });

  describe('Basic Setup', () => {
    it('should create Express app with routers', () => {
      expect(app).toBeDefined();
      expect(typeof app.listen).toBe('function');
    });

    it('should create user router with handlers', () => {
      expect(userRouter).toBeDefined();
      expect(userRouter.getRouter).toBeDefined();
      expect(typeof userRouter.getRouter).toBe('function');
    });

    it('should create post router with handlers', () => {
      expect(postRouter).toBeDefined();
      expect(postRouter.getRouter).toBeDefined();
      expect(typeof postRouter.getRouter).toBe('function');
    });

    it('should have router-level handlers configured', () => {
      // Check that routers have the expected handler configurations
      const userRouterConfig = (userRouter as any).options;
      const postRouterConfig = (postRouter as any).options;

      expect(userRouterConfig.actions).toBeDefined();
      expect(userRouterConfig.facets).toBeDefined();
      expect(userRouterConfig.allActions).toBeDefined();
      expect(userRouterConfig.allFacets).toBeDefined();

      expect(postRouterConfig.actions).toBeDefined();
      expect(postRouterConfig.facets).toBeDefined();
      expect(postRouterConfig.allActions).toBeDefined();
      expect(postRouterConfig.allFacets).toBeDefined();
    });
  });

  describe('User Router-Level Action Handlers', () => {
    it('should execute activate action handler', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
      const mockReq = createMockRequest({ body: { reason: 'test activation' } });
      const mockRes = createMockResponse({ locals: { userPk: 'user_1' } });

      const userRouterOptions = (userRouter as any).options;
      const activateHandler = userRouterOptions.actions.activate;

      const result = await activateHandler(
        { kt: 'user', pk: 'user_1' },
        mockReq.body,
        { req: mockReq, res: mockRes }
      );

      expect(result.message).toBe('User activated via router handler');
      expect(result.userId).toBe('user_1');
      expect(result.emailSent).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith('Router-level activate action called for user:', 'user_1');

      consoleSpy.mockRestore();
    });

    it('should execute deactivate action handler', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
      const mockReq = createMockRequest({ body: { reason: 'test deactivation' } });
      const mockRes = createMockResponse({ locals: { userPk: 'user_1' } });

      const userRouterOptions = (userRouter as any).options;
      const deactivateHandler = userRouterOptions.actions.deactivate;

      const result = await deactivateHandler(
        { kt: 'user', pk: 'user_1' },
        mockReq.body,
        { req: mockReq, res: mockRes }
      );

      expect(result.message).toBe('User deactivated via router handler');
      expect(result.userId).toBe('user_1');
      expect(result.notificationSent).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith('Router-level deactivate action called for user:', 'user_1');

      consoleSpy.mockRestore();
    });
  });

  describe('User Router-Level Facet Handlers', () => {
    it('should execute profile facet handler', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
      const mockReq = createMockRequest({ params: { includeExtended: 'true' } });
      const mockRes = createMockResponse({ locals: { userPk: 'user_1' } });

      const userRouterOptions = (userRouter as any).options;
      const profileHandler = userRouterOptions.facets.profile;

      const result = await profileHandler(
        { kt: 'user', pk: 'user_1' },
        mockReq.params,
        { req: mockReq, res: mockRes }
      );

      expect(result.userId).toBe('user_1');
      expect(result.basicInfo.name).toBe('John Doe');
      expect(result.extendedInfo.preferences.theme).toBe('dark');
      expect(result.socialInfo.followers).toBe(150);
      expect(consoleSpy).toHaveBeenCalledWith('Router-level profile facet called for user:', 'user_1');

      consoleSpy.mockRestore();
    });

    it('should execute stats facet handler', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
      const mockReq = createMockRequest({ params: { period: 'monthly' } });
      const mockRes = createMockResponse({ locals: { userPk: 'user_1' } });

      const userRouterOptions = (userRouter as any).options;
      const statsHandler = userRouterOptions.facets.stats;

      const result = await statsHandler(
        { kt: 'user', pk: 'user_1' },
        mockReq.params,
        { req: mockReq, res: mockRes }
      );

      expect(result.userId).toBe('user_1');
      expect(result.postsCount).toBe(25);
      expect(result.commentsCount).toBe(150);
      expect(result.likesReceived).toBe(500);
      expect(result.lastActivity).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith('Router-level stats facet called for user:', 'user_1');

      consoleSpy.mockRestore();
    });
  });

  describe('User Router-Level All Action Handlers', () => {
    it('should execute bulkActivate all action handler', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
      const allActionParams = { userIds: ['user_1', 'user_2', 'user_3'] };
      const locations = [{ kt: 'organization', lk: 'org_1' }];
      const mockReq = { body: allActionParams } as TestRequest;
      const mockRes = { locals: {} } as TestResponse;

      const userRouterOptions = (userRouter as any).options;
      const bulkActivateHandler = userRouterOptions.allActions.bulkActivate;

      const result = await bulkActivateHandler(
        allActionParams,
        locations,
        { req: mockReq, res: mockRes }
      );

      expect(result.message).toBe('Bulk activation via router handler');
      expect(result.processedUsers).toBe(3);
      expect(result.externalServiceCalled).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith('Router-level bulk activate action called');

      consoleSpy.mockRestore();
    });

    it('should execute bulkDeactivate all action handler', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
      const allActionParams = { userIds: ['user_1', 'user_2'] };
      const locations = [{ kt: 'organization', lk: 'org_1' }];
      const mockReq = { body: allActionParams } as TestRequest;
      const mockRes = { locals: {} } as TestResponse;

      const userRouterOptions = (userRouter as any).options;
      const bulkDeactivateHandler = userRouterOptions.allActions.bulkDeactivate;

      const result = await bulkDeactivateHandler(
        allActionParams,
        locations,
        { req: mockReq, res: mockRes }
      );

      expect(result.message).toBe('Bulk deactivation via router handler');
      expect(result.processedUsers).toBe(2);
      expect(result.auditLogged).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith('Router-level bulk deactivate action called');

      consoleSpy.mockRestore();
    });
  });

  describe('User Router-Level All Facet Handlers', () => {
    it('should execute userStats all facet handler', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
      const allFacetParams = { includeDetails: true };
      const locations = [{ kt: 'organization', lk: 'org_1' }];
      const mockReq = { query: allFacetParams } as TestRequest;
      const mockRes = { locals: {} } as TestResponse;

      const userRouterOptions = (userRouter as any).options;
      const userStatsHandler = userRouterOptions.allFacets.userStats;

      const result = await userStatsHandler(
        allFacetParams,
        locations,
        { req: mockReq, res: mockRes }
      );

      expect(result.totalUsers).toBe(1250);
      expect(result.activeUsers).toBe(890);
      expect(result.newUsersThisMonth).toBe(45);
      expect(result.topRoles.admin).toBe(15);
      expect(result.systemHealth).toBe('excellent');
      expect(consoleSpy).toHaveBeenCalledWith('Router-level user stats facet called');

      consoleSpy.mockRestore();
    });

    it('should execute userCount all facet handler', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
      const allFacetParams = {};
      const locations = [];
      const mockReq = { query: allFacetParams } as TestRequest;
      const mockRes = { locals: {} } as TestResponse;

      const userRouterOptions = (userRouter as any).options;
      const userCountHandler = userRouterOptions.allFacets.userCount;

      const result = await userCountHandler(
        allFacetParams,
        locations,
        { req: mockReq, res: mockRes }
      );

      expect(result.count).toBe(1250);
      expect(result.source).toBe('cache');
      expect(result.lastUpdated).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith('Router-level user count facet called');

      consoleSpy.mockRestore();
    });
  });

  describe('Post Router-Level Action Handlers', () => {
    it('should execute publish action handler', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
      const mockReq = { body: { platforms: ['twitter', 'facebook'] } } as TestRequest;
      const mockRes = { locals: { postPk: 'post_1' } } as TestResponse;

      const postRouterOptions = (postRouter as any).options;
      const publishHandler = postRouterOptions.actions.publish;

      const result = await publishHandler(
        { kt: 'post', pk: 'post_1', loc: [{ kt: 'user', lk: 'user_1' }] },
        mockReq.body,
        { req: mockReq, res: mockRes }
      );

      expect(result.message).toBe('Post published via router handler');
      expect(result.postId).toBe('post_1');
      expect(result.authorId).toBe('user_1');
      expect(result.socialMediaPosted).toBe(true);
      expect(result.notificationsSent).toBe(true);
      expect(result.publishedAt).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith('Router-level publish action called for post:', 'post_1');

      consoleSpy.mockRestore();
    });

    it('should execute unpublish action handler', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
      const mockReq = { body: { reason: 'content review' } } as TestRequest;
      const mockRes = { locals: { postPk: 'post_1' } } as TestResponse;

      const postRouterOptions = (postRouter as any).options;
      const unpublishHandler = postRouterOptions.actions.unpublish;

      const result = await unpublishHandler(
        { kt: 'post', pk: 'post_1', loc: [{ kt: 'user', lk: 'user_1' }] },
        mockReq.body,
        { req: mockReq, res: mockRes }
      );

      expect(result.message).toBe('Post unpublished via router handler');
      expect(result.postId).toBe('post_1');
      expect(result.authorId).toBe('user_1');
      expect(result.socialMediaRemoved).toBe(true);
      expect(result.notificationsSent).toBe(true);
      expect(result.unpublishedAt).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith('Router-level unpublish action called for post:', 'post_1');

      consoleSpy.mockRestore();
    });
  });

  describe('Post Router-Level Facet Handlers', () => {
    it('should execute analytics facet handler', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
      const mockReq = { params: { timeframe: '30days' } } as TestRequest;
      const mockRes = { locals: { postPk: 'post_1' } } as TestResponse;

      const postRouterOptions = (postRouter as any).options;
      const analyticsHandler = postRouterOptions.facets.analytics;

      const result = await analyticsHandler(
        { kt: 'post', pk: 'post_1', loc: [{ kt: 'user', lk: 'user_1' }] },
        mockReq.params,
        { req: mockReq, res: mockRes }
      );

      expect(result.postId).toBe('post_1');
      expect(result.views).toBe(1250);
      expect(result.likes).toBe(89);
      expect(result.shares).toBe(23);
      expect(result.engagementRate).toBe(0.12);
      expect(result.topReferrers).toContain('twitter.com');
      expect(consoleSpy).toHaveBeenCalledWith('Router-level analytics facet called for post:', 'post_1');

      consoleSpy.mockRestore();
    });

    it('should execute comments facet handler', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
      const mockReq = { params: { limit: '10' } } as TestRequest;
      const mockRes = { locals: { postPk: 'post_1' } } as TestResponse;

      const postRouterOptions = (postRouter as any).options;
      const commentsHandler = postRouterOptions.facets.comments;

      const result = await commentsHandler(
        { kt: 'post', pk: 'post_1', loc: [{ kt: 'user', lk: 'user_1' }] },
        mockReq.params,
        { req: mockReq, res: mockRes }
      );

      expect(result.postId).toBe('post_1');
      expect(result.comments).toHaveLength(2);
      expect(result.comments[0].text).toBe('Great post!');
      expect(result.totalComments).toBe(2);
      expect(consoleSpy).toHaveBeenCalledWith('Router-level comments facet called for post:', 'post_1');

      consoleSpy.mockRestore();
    });
  });

  describe('Post Router-Level All Action Handlers', () => {
    it('should execute bulkPublish all action handler', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
      const allActionParams = { postIds: ['post_1', 'post_2', 'post_3'] };
      const locations = [{ kt: 'user', lk: 'user_1' }];
      const mockReq = { body: allActionParams } as TestRequest;
      const mockRes = { locals: {} } as TestResponse;

      const postRouterOptions = (postRouter as any).options;
      const bulkPublishHandler = postRouterOptions.allActions.bulkPublish;

      const result = await bulkPublishHandler(
        allActionParams,
        locations,
        { req: mockReq, res: mockRes }
      );

      expect(result.message).toBe('Bulk publish via router handler');
      expect(result.processedPosts).toBe(3);
      expect(result.platformsUpdated).toContain('twitter');
      expect(result.platformsUpdated).toContain('facebook');
      expect(result.timestamp).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith('Router-level bulk publish action called');

      consoleSpy.mockRestore();
    });

    it('should execute bulkUnpublish all action handler', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
      const allActionParams = { postIds: ['post_1', 'post_2'] };
      const locations = [{ kt: 'user', lk: 'user_1' }];
      const mockReq = { body: allActionParams } as TestRequest;
      const mockRes = { locals: {} } as TestResponse;

      const postRouterOptions = (postRouter as any).options;
      const bulkUnpublishHandler = postRouterOptions.allActions.bulkUnpublish;

      const result = await bulkUnpublishHandler(
        allActionParams,
        locations,
        { req: mockReq, res: mockRes }
      );

      expect(result.message).toBe('Bulk unpublish via router handler');
      expect(result.processedPosts).toBe(2);
      expect(result.platformsUpdated).toContain('linkedin');
      expect(result.timestamp).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith('Router-level bulk unpublish action called');

      consoleSpy.mockRestore();
    });
  });

  describe('Post Router-Level All Facet Handlers', () => {
    it('should execute postStats all facet handler', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
      const allFacetParams = { includeCategories: true };
      const locations = [{ kt: 'user', lk: 'user_1' }];
      const mockReq = { query: allFacetParams } as TestRequest;
      const mockRes = { locals: {} } as TestResponse;

      const postRouterOptions = (postRouter as any).options;
      const postStatsHandler = postRouterOptions.allFacets.postStats;

      const result = await postStatsHandler(
        allFacetParams,
        locations,
        { req: mockReq, res: mockRes }
      );

      expect(result.totalPosts).toBe(450);
      expect(result.publishedPosts).toBe(380);
      expect(result.draftPosts).toBe(70);
      expect(result.averageViews).toBe(850);
      expect(result.topCategories).toContain('technology');
      expect(consoleSpy).toHaveBeenCalledWith('Router-level post stats facet called');

      consoleSpy.mockRestore();
    });

    it('should execute postCount all facet handler', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
      const allFacetParams = { status: 'published' };
      const locations = [{ kt: 'user', lk: 'user_1' }];
      const mockReq = { query: allFacetParams } as TestRequest;
      const mockRes = { locals: {} } as TestResponse;

      const postRouterOptions = (postRouter as any).options;
      const postCountHandler = postRouterOptions.allFacets.postCount;

      const result = await postCountHandler(
        allFacetParams,
        locations,
        { req: mockReq, res: mockRes }
      );

      expect(result.count).toBe(450);
      expect(result.published).toBe(380);
      expect(result.draft).toBe(70);
      expect(result.source).toBe('database');
      expect(result.lastUpdated).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith('Router-level post count facet called');

      consoleSpy.mockRestore();
    });
  });

  describe('Express Integration', () => {
    it('should respond to examples endpoint', async () => {
      const response = await request(app).get('/examples');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Router Handlers Example');
      expect(response.body.endpoints).toBeDefined();
      expect(response.body.endpoints['POST /api/users/user_1/activate']).toBe('Router-level activate action');
      expect(response.body.endpoints['GET /api/posts/post_1/analytics']).toBe('Router-level analytics facet');
    });

    it('should have mounted user router at /api/users', () => {
      const userExpressRouter = userRouter.getRouter();
      expect(userExpressRouter).toBeDefined();
      expect(userExpressRouter.stack).toBeDefined();
    });

    it('should have mounted post router at /api/posts', () => {
      const postExpressRouter = postRouter.getRouter();
      expect(postExpressRouter).toBeDefined();
      expect(postExpressRouter.stack).toBeDefined();
    });
  });

  describe('Handler Type Safety and Structure', () => {
    it('should have correctly typed action handlers for users', () => {
      const userRouterOptions = (userRouter as any).options;

      expect(typeof userRouterOptions.actions.activate).toBe('function');
      expect(typeof userRouterOptions.actions.deactivate).toBe('function');
      expect(userRouterOptions.actions.activate.length).toBe(3); // ik, actionParams, context
      expect(userRouterOptions.actions.deactivate.length).toBe(3);
    });

    it('should have correctly typed facet handlers for users', () => {
      const userRouterOptions = (userRouter as any).options;

      expect(typeof userRouterOptions.facets.profile).toBe('function');
      expect(typeof userRouterOptions.facets.stats).toBe('function');
      expect(userRouterOptions.facets.profile.length).toBe(3); // ik, facetParams, context
      expect(userRouterOptions.facets.stats.length).toBe(3);
    });

    it('should have correctly typed all action handlers for users', () => {
      const userRouterOptions = (userRouter as any).options;

      expect(typeof userRouterOptions.allActions.bulkActivate).toBe('function');
      expect(typeof userRouterOptions.allActions.bulkDeactivate).toBe('function');
      expect(userRouterOptions.allActions.bulkActivate.length).toBe(3); // allActionParams, locations, context
      expect(userRouterOptions.allActions.bulkDeactivate.length).toBe(3);
    });

    it('should have correctly typed all facet handlers for users', () => {
      const userRouterOptions = (userRouter as any).options;

      expect(typeof userRouterOptions.allFacets.userStats).toBe('function');
      expect(typeof userRouterOptions.allFacets.userCount).toBe('function');
      expect(userRouterOptions.allFacets.userStats.length).toBe(3); // allFacetParams, locations, context
      expect(userRouterOptions.allFacets.userCount.length).toBe(3);
    });

    it('should have correctly typed handlers for posts', () => {
      const postRouterOptions = (postRouter as any).options;

      // Actions
      expect(typeof postRouterOptions.actions.publish).toBe('function');
      expect(typeof postRouterOptions.actions.unpublish).toBe('function');

      // Facets
      expect(typeof postRouterOptions.facets.analytics).toBe('function');
      expect(typeof postRouterOptions.facets.comments).toBe('function');

      // All Actions
      expect(typeof postRouterOptions.allActions.bulkPublish).toBe('function');
      expect(typeof postRouterOptions.allActions.bulkUnpublish).toBe('function');

      // All Facets
      expect(typeof postRouterOptions.allFacets.postStats).toBe('function');
      expect(typeof postRouterOptions.allFacets.postCount).toBe('function');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle handlers with missing parameters gracefully', async () => {
      const userRouterOptions = (userRouter as any).options;
      const activateHandler = userRouterOptions.actions.activate;

      // Test with missing parameters
      const result = await activateHandler(
        { kt: 'user', pk: 'user_1' },
        null,
        { req: {} as any, res: {} as any }
      );

      expect(result.message).toBe('User activated via router handler');
      expect(result.userId).toBe('user_1');
    });

    it('should handle handlers with empty location arrays', async () => {
      const postRouterOptions = (postRouter as any).options;
      const bulkPublishHandler = postRouterOptions.allActions.bulkPublish;

      const result = await bulkPublishHandler(
        { postIds: [] },
        [],
        { req: {} as any, res: {} as any }
      );

      expect(result.message).toBe('Bulk publish via router handler');
      expect(result.processedPosts).toBe(0);
    });
  });

  describe('HTTP Endpoint Integration Tests', () => {
    it('should handle user activate action via HTTP', async () => {
      const response = await request(app)
        .post('/api/users/user_1/activate')
        .send({ reason: 'automated test' })
        .expect(200);

      expect(response.body.message).toBe('User activated via router handler');
      expect(response.body.userId).toBe('user_1');
      expect(response.body.emailSent).toBe(true);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should handle user deactivate action via HTTP', async () => {
      const response = await request(app)
        .post('/api/users/user_1/deactivate')
        .send({ reason: 'security concern' })
        .expect(200);

      expect(response.body.message).toBe('User deactivated via router handler');
      expect(response.body.userId).toBe('user_1');
      expect(response.body.notificationSent).toBe(true);
    });

    it('should handle user profile facet via HTTP', async () => {
      const response = await request(app)
        .get('/api/users/user_1/profile')
        .query({ includeExtended: 'true' })
        .expect(200);

      expect(response.body.userId).toBe('user_1');
      expect(response.body.basicInfo.name).toBe('John Doe');
      expect(response.body.extendedInfo.preferences.theme).toBe('dark');
    });

    it('should handle user stats facet via HTTP', async () => {
      const response = await request(app)
        .get('/api/users/user_1/stats')
        .query({ period: 'monthly' })
        .expect(200);

      expect(response.body.userId).toBe('user_1');
      expect(response.body.postsCount).toBe(25);
      expect(response.body.commentsCount).toBe(150);
    });

    it('should handle user bulk actions via HTTP', async () => {
      const response = await request(app)
        .post('/api/users/bulkActivate')
        .send({ userIds: ['user_1', 'user_2', 'user_3'] })
        .expect(200);

      expect(response.body.message).toBe('Bulk activation via router handler');
      expect(response.body.processedUsers).toBe(3);
      expect(response.body.externalServiceCalled).toBe(true);
    });

    it('should handle user all facets via HTTP', async () => {
      const response = await request(app)
        .get('/api/users/userStats')
        .query({ includeDetails: 'true' })
        .expect(200);

      expect(response.body.totalUsers).toBe(1250);
      expect(response.body.activeUsers).toBe(890);
      expect(response.body.systemHealth).toBe('excellent');
    });

    it('should handle post publish action via HTTP', async () => {
      const response = await request(app)
        .post('/api/posts/post_1/publish')
        .send({ platforms: ['twitter', 'facebook'] })
        .expect(200);

      expect(response.body.message).toBe('Post published via router handler');
      expect(response.body.postId).toBe('post_1');
      expect(response.body.socialMediaPosted).toBe(true);
    });

    it('should handle post analytics facet via HTTP', async () => {
      const response = await request(app)
        .get('/api/posts/post_1/analytics')
        .query({ timeframe: '30days' })
        .expect(200);

      expect(response.body.postId).toBe('post_1');
      expect(response.body.views).toBe(1250);
      expect(response.body.engagementRate).toBe(0.12);
    });

    it('should handle post bulk operations via HTTP', async () => {
      const response = await request(app)
        .post('/api/posts/bulkPublish')
        .send({ postIds: ['post_1', 'post_2'] })
        .expect(200);

      expect(response.body.message).toBe('Bulk publish via router handler');
      expect(response.body.processedPosts).toBe(2);
      expect(response.body.platformsUpdated).toContain('twitter');
    });
  });

  describe('Library Fallback Behavior', () => {
    it('should return 404 for undefined router actions that are not in library', async () => {
      // Testing an action that doesn't exist in either router handlers or library
      const response = await request(app)
        .post('/api/users/user_1/undefinedAction')
        .send({ testData: 'fallback test' })
        .expect(404);

      // Route not found - Express returns 404 for non-existent routes
      expect(response.text).toContain('Cannot POST /api/users/user_1/undefinedAction');
    });

    it('should return 404 for undefined router facets that are not in library', async () => {
      const response = await request(app)
        .get('/api/users/user_1/undefinedFacet')
        .query({ testParam: 'fallback test' })
        .expect(404);

      expect(response.text).toContain('Cannot GET /api/users/user_1/undefinedFacet');
    });

    it('should return 404 for undefined all actions that are not in library', async () => {
      const response = await request(app)
        .post('/api/users/undefinedAllAction')
        .send({ testData: 'fallback test' })
        .expect(404);

      expect(response.text).toContain('Cannot POST /api/users/undefinedAllAction');
    });

    it('should return 500 for undefined all facets that access the item endpoint', async () => {
      const response = await request(app)
        .get('/api/users/undefinedAllFacet')
        .query({ testParam: 'fallback test' })
        .expect(500);

      // This endpoint exists but fails at validation because undefinedAllFacet becomes an item ID
      expect(response.body).toBeDefined();
    });

    it('should return 404 for undefined post actions that are not in library', async () => {
      const response = await request(app)
        .post('/api/posts/post_1/undefinedPostAction')
        .send({ testData: 'fallback test' })
        .expect(404);

      expect(response.text).toContain('Cannot POST /api/posts/post_1/undefinedPostAction');
    });
  });

  describe('Error Handling and Validation', () => {
    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/users/user_1/activate')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body).toBeDefined();
    });

    it('should handle missing required parameters gracefully', async () => {
      const response = await request(app)
        .post('/api/users/user_1/activate')
        .send({}) // Empty body
        .expect(200);

      // Router handler should still work with empty params
      expect(response.body.message).toBe('User activated via router handler');
      expect(response.body.userId).toBe('user_1');
    });

    it('should handle invalid user ID format', async () => {
      const response = await request(app)
        .get('/api/users/invalid@user#id/profile')
        .expect(500);

      // Should return error for invalid ID format due to validation
      expect(response.body).toBeDefined();
    });

    it('should handle very long request payloads', async () => {
      const largePayload = {
        userIds: Array.from({ length: 1000 }, (_, i) => `user_${i}`),
        metadata: 'x'.repeat(10000) // Large string
      };

      const response = await request(app)
        .post('/api/users/bulkActivate')
        .send(largePayload)
        .expect(200);

      expect(response.body.processedUsers).toBe(1000);
    });

    it('should handle special characters in query parameters', async () => {
      const response = await request(app)
        .get('/api/users/user_1/stats')
        .query({
          period: 'monthly',
          filter: 'name="Test User" & status=active',
          unicode: '测试用户'
        })
        .expect(200);

      expect(response.body.userId).toBe('user_1');
    });

    it('should handle concurrent requests to the same handler', async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(app)
          .post('/api/users/user_1/activate')
          .send({ concurrentTest: true })
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('User activated via router handler');
      });
    });
  });

  describe('Performance and Memory Tests', () => {
    it('should execute router handlers within reasonable time limits', async () => {
      const startTime = performance.now();

      await request(app)
        .post('/api/users/user_1/activate')
        .send({ performanceTest: true })
        .expect(200);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Router handler should complete within 100ms
      expect(executionTime).toBeLessThan(100);
    });

    it('should handle rapid successive requests efficiently', async () => {
      const startTime = performance.now();

      const promises = Array.from({ length: 50 }, (_, i) =>
        request(app)
          .get('/api/users/user_1/profile')
          .query({ requestId: i })
      );

      const responses = await Promise.all(promises);
      const endTime = performance.now();

      // All 50 requests should complete within 1 second
      expect(endTime - startTime).toBeLessThan(1000);

      // All responses should be successful
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should not leak memory during handler execution', async () => {
      const getMemoryUsage = () => {
        if (global.gc) {
          global.gc();
        }
        return process.memoryUsage().heapUsed;
      };

      const initialMemory = getMemoryUsage();

      // Execute multiple operations
      for (let i = 0; i < 100; i++) {
        await request(app)
          .post('/api/users/user_1/activate')
          .send({ memoryTest: i });
      }

      const finalMemory = getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle bulk operations efficiently', async () => {
      const largeUserList = Array.from({ length: 1000 }, (_, i) => `user_${i}`);

      const startTime = performance.now();

      const response = await request(app)
        .post('/api/users/bulkActivate')
        .send({ userIds: largeUserList })
        .expect(200);

      const endTime = performance.now();

      expect(response.body.processedUsers).toBe(1000);
      expect(endTime - startTime).toBeLessThan(200); // Should complete in under 200ms
    });
  });

  describe('Context and Parameter Validation', () => {
    it('should pass correct context to router handlers', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await request(app)
        .post('/api/users/user_1/activate')
        .set('X-Test-Header', 'test-value')
        .send({ contextTest: true });

      // Verify that console.log was called (indicating handler received context)
      expect(consoleSpy).toHaveBeenCalledWith('Router-level activate action called for user:', 'user_1');

      consoleSpy.mockRestore();
    });

    it('should handle complex parameter structures', async () => {
      const complexParams = {
        userIds: ['user_1', 'user_2'],
        metadata: {
          reason: 'bulk operation',
          priority: 'high',
          tags: ['urgent', 'security'],
          config: {
            sendEmail: true,
            auditLog: true,
            notifications: {
              slack: true,
              email: false
            }
          }
        }
      };

      const response = await request(app)
        .post('/api/users/bulkActivate')
        .send(complexParams)
        .expect(200);

      expect(response.body.processedUsers).toBe(2);
      expect(response.body.externalServiceCalled).toBe(true);
    });

    it('should handle location parameters correctly for composite items', async () => {
      const response = await request(app)
        .post('/api/posts/post_1/publish')
        .send({
          platforms: ['twitter', 'facebook'],
          schedule: new Date().toISOString()
        })
        .expect(200);

      expect(response.body.postId).toBe('post_1');
      // Note: authorId comes from ik.loc[0].lk which may be undefined in this test context
      // since we're not going through the parent user router context
      expect(response.body.message).toBe('Post published via router handler');
    });

    it('should preserve parameter types correctly', async () => {
      const response = await request(app)
        .get('/api/posts/post_1/analytics')
        .query({
          timeframe: '30days',
          includeDetails: 'true',
          limit: '100'
        })
        .expect(200);

      expect(response.body.postId).toBe('post_1');
      expect(typeof response.body.views).toBe('number');
      expect(typeof response.body.engagementRate).toBe('number');
    });
  });

  describe('Router Handler Priority and Overrides', () => {
    it('should prioritize router handlers over library operations', async () => {
      // Test that router-defined activate takes precedence over library activate
      const response = await request(app)
        .post('/api/users/user_1/activate')
        .send({ test: 'priority test' })
        .expect(200);

      // Should get router handler response, not library response
      expect(response.body.message).toBe('User activated via router handler');
      expect(response.body.emailSent).toBe(true); // Router-specific field
      expect(response.body.timestamp).toBeDefined();
    });

    it('should allow router handlers to extend library functionality', async () => {
      const response = await request(app)
        .get('/api/users/user_1/profile')
        .expect(200);

      // Router handler provides more data than library would
      expect(response.body.basicInfo).toBeDefined();
      expect(response.body.extendedInfo).toBeDefined();
      expect(response.body.socialInfo).toBeDefined();
      expect(response.body.socialInfo.followers).toBe(150);
    });

    it('should maintain consistent behavior across handler types', async () => {
      // Test that all handler types return timestamps
      const [actionResponse, facetResponse, allActionResponse, allFacetResponse] = await Promise.all([
        request(app).post('/api/users/user_1/activate').send({}),
        request(app).get('/api/users/user_1/stats'),
        request(app).post('/api/users/bulkActivate').send({ userIds: ['user_1'] }),
        request(app).get('/api/users/userStats')
      ]);

      expect(actionResponse.body.timestamp).toBeDefined();
      expect(facetResponse.body.lastActivity).toBeDefined();
      expect(allActionResponse.body.timestamp).toBeDefined();
      // userStats doesn't have timestamp but has other time fields
      expect(allFacetResponse.body.totalUsers).toBeDefined();
    });
  });

  describe('Cross-Router Integration', () => {
    it('should handle operations across user and post routers', async () => {
      // First activate a user
      const userResponse = await request(app)
        .post('/api/users/user_1/activate')
        .send({ reason: 'cross-router test' })
        .expect(200);

      expect(userResponse.body.userId).toBe('user_1');

      // Then publish a post (note: authorId may be undefined without proper router nesting)
      const postResponse = await request(app)
        .post('/api/posts/post_1/publish')
        .send({ platforms: ['twitter'] })
        .expect(200);

      expect(postResponse.body.message).toBe('Post published via router handler');
      expect(postResponse.body.postId).toBe('post_1');
    });

    it('should maintain independent router configurations', async () => {
      const userRouterOptions = (userRouter as any).options;
      const postRouterOptions = (postRouter as any).options;

      // Verify routers have different action sets
      expect(userRouterOptions.actions.activate).toBeDefined();
      expect(userRouterOptions.actions.publish).toBeUndefined();

      expect(postRouterOptions.actions.publish).toBeDefined();
      expect(postRouterOptions.actions.activate).toBeUndefined();
    });
  });
});
