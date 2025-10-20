
import { CItemRouter, PItemRouter } from '../src';
import { ComKey, Item, PriKey } from '@fjell/core';
import express from 'express';

// Define data models
interface User extends Item<'user'> {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

interface Post extends Item<'post', 'user'> {
  id: string;
  title: string;
  content: string;
  authorId: string;
  publishedAt?: Date;
}

// Mock operations for demonstration
const userOperations = {
  create: async (item: User) => ({ ...item, id: `user_${Date.now()}` }),
  get: async (ik: PriKey<'user'>) => ({ id: ik.pk, name: 'John Doe', email: 'john@example.com', role: 'user' as const }),
  update: async (ik: PriKey<'user'>, item: Partial<User>) => ({ id: ik.pk, name: 'John Doe', email: 'john@example.com', role: 'user' as const, ...item }),
  remove: async (ik: PriKey<'user'>) => ({ id: ik.pk, name: 'John Doe', email: 'john@example.com', role: 'user' as const }),
  all: async () => [
    { id: 'user_1', name: 'John Doe', email: 'john@example.com', role: 'user' as const },
    { id: 'user_2', name: 'Jane Smith', email: 'jane@example.com', role: 'admin' as const }
  ],
  find: async () => [
    { id: 'user_1', name: 'John Doe', email: 'john@example.com', role: 'user' as const }
  ],
  action: async (ik: PriKey<'user'>, action: string, body: any) => ({ message: `Library action: ${action}`, userId: ik.pk, body }),
  facet: async (ik: PriKey<'user'>, facet: string, params: any) => ({ message: `Library facet: ${facet}`, userId: ik.pk, params }),
  allAction: async (action: string, body: any) => ({ message: `Library all action: ${action}`, body }),
  allFacet: async (facet: string, params: any) => ({ message: `Library all facet: ${facet}`, params })
};

const postOperations = {
  create: async (item: Post) => ({ ...item, id: `post_${Date.now()}` }),
  get: async (ik: ComKey<'post', 'user'>) => ({ id: ik.pk, title: 'Sample Post', content: 'Sample content', authorId: 'user_1' }),
  update: async (ik: ComKey<'post', 'user'>, item: Partial<Post>) => ({ id: ik.pk, title: 'Sample Post', content: 'Sample content', authorId: 'user_1', ...item }),
  remove: async (ik: ComKey<'post', 'user'>) => ({ id: ik.pk, title: 'Sample Post', content: 'Sample content', authorId: 'user_1' }),
  all: async () => [
    { id: 'post_1', title: 'Sample Post 1', content: 'Sample content 1', authorId: 'user_1' },
    { id: 'post_2', title: 'Sample Post 2', content: 'Sample content 2', authorId: 'user_1' }
  ],
  find: async () => [
    { id: 'post_1', title: 'Sample Post 1', content: 'Sample content 1', authorId: 'user_1' }
  ],
  action: async (ik: ComKey<'post', 'user'>, action: string, body: any) => ({ message: `Library action: ${action}`, postId: ik.pk, body }),
  facet: async (ik: ComKey<'post', 'user'>, facet: string, params: any) => ({ message: `Library facet: ${facet}`, postId: ik.pk, params }),
  allAction: async (action: string, body: any) => ({ message: `Library all action: ${action}`, body }),
  allFacet: async (facet: string, params: any) => ({ message: `Library all facet: ${facet}`, params })
};

// Create Express app and registry
const app = express();
app.use(express.json());

// Create instances
const userInstance = {
  operations: userOperations,
  options: {
    actions: {
      activate: { description: 'Activate user account' },
      deactivate: { description: 'Deactivate user account' }
    },
    facets: {
      profile: { description: 'Get user profile' },
      stats: { description: 'Get user statistics' }
    },
    allActions: {
      bulkActivate: { description: 'Activate multiple users' },
      bulkDeactivate: { description: 'Deactivate multiple users' }
    },
    allFacets: {
      userStats: { description: 'Get overall user statistics' },
      userCount: { description: 'Get user count' }
    }
  }
} as any;

const postInstance = {
  operations: postOperations,
  options: {
    actions: {
      publish: { description: 'Publish post' },
      unpublish: { description: 'Unpublish post' }
    },
    facets: {
      analytics: { description: 'Get post analytics' },
      comments: { description: 'Get post comments' }
    },
    allActions: {
      bulkPublish: { description: 'Publish multiple posts' },
      bulkUnpublish: { description: 'Unpublish multiple posts' }
    },
    allFacets: {
      postStats: { description: 'Get overall post statistics' },
      postCount: { description: 'Get post count' }
    }
  }
} as any;

// Create routers with router-level handlers
const userRouter = new PItemRouter(userInstance, 'user', {
  // Router-level action handlers - aligned with library operation signatures
  actions: {
    activate: async (ik: PriKey<'user'>, actionParams: any) => {
      console.log('Router-level activate action called for user:', ik.pk);
      console.log('Action params:', actionParams);
      // Custom logic: send activation email, update status, etc.
      const result = {
        message: 'User activated via router handler',
        userId: ik.pk,
        timestamp: new Date().toISOString(),
        emailSent: true
      };
      return result;
    },
    deactivate: async (ik: PriKey<'user'>, actionParams: any) => {
      console.log('Router-level deactivate action called for user:', ik.pk);
      console.log('Action params:', actionParams);
      // Custom logic: send deactivation notification, update status, etc.
      const result = {
        message: 'User deactivated via router handler',
        userId: ik.pk,
        timestamp: new Date().toISOString(),
        notificationSent: true
      };
      return result;
    }
  },

  // Router-level facet handlers - aligned with library operation signatures
  facets: {
    profile: async (ik: PriKey<'user'>, facetParams: any) => {
      console.log('Router-level profile facet called for user:', ik.pk);
      console.log('Facet params:', facetParams);
      // Custom logic: aggregate data from multiple sources
      return {
        userId: ik.pk,
        basicInfo: { name: 'John Doe', email: 'john@example.com' },
        extendedInfo: { lastLogin: new Date(), preferences: { theme: 'dark' } },
        socialInfo: { followers: 150, following: 75 }
      };
    },
    stats: async (ik: PriKey<'user'>, facetParams: any) => {
      console.log('Router-level stats facet called for user:', ik.pk);
      console.log('Facet params:', facetParams);
      // Custom logic: calculate statistics from multiple data sources
      return {
        userId: ik.pk,
        postsCount: 25,
        commentsCount: 150,
        likesReceived: 500,
        lastActivity: new Date()
      };
    }
  },

  // Router-level all action handlers - aligned with library operation signatures
  allActions: {
    bulkActivate: async (allActionParams: any, locations: any) => {
      console.log('Router-level bulk activate action called');
      console.log('All action params:', allActionParams);
      console.log('Locations:', locations);
      // Custom logic: batch processing, external service integration
      const { userIds } = allActionParams;
      return {
        message: 'Bulk activation via router handler',
        processedUsers: userIds?.length || 0,
        timestamp: new Date().toISOString(),
        externalServiceCalled: true
      };
    },
    bulkDeactivate: async (allActionParams: any, locations: any) => {
      console.log('Router-level bulk deactivate action called');
      console.log('All action params:', allActionParams);
      console.log('Locations:', locations);
      // Custom logic: batch processing, audit logging
      const { userIds } = allActionParams;
      return {
        message: 'Bulk deactivation via router handler',
        processedUsers: userIds?.length || 0,
        timestamp: new Date().toISOString(),
        auditLogged: true
      };
    }
  },

  // Router-level all facet handlers - aligned with library operation signatures
  allFacets: {
    userStats: async (allFacetParams: any, locations: any) => {
      console.log('Router-level user stats facet called');
      console.log('All facet params:', allFacetParams);
      console.log('Locations:', locations);
      // Custom logic: aggregate statistics from multiple systems
      return {
        totalUsers: 1250,
        activeUsers: 890,
        newUsersThisMonth: 45,
        topRoles: { admin: 15, user: 1200, guest: 35 },
        systemHealth: 'excellent'
      };
    },
    userCount: async () => {
      console.log('Router-level user count facet called');
      // Custom logic: real-time count from cache
      return {
        count: 1250,
        lastUpdated: new Date().toISOString(),
        source: 'cache'
      };
    }
  }
} as any);

const postRouter = new CItemRouter(postInstance, 'post', userRouter, {
  // Router-level action handlers for posts - aligned with library operation signatures
  actions: {
    publish: async (ik: ComKey<'post', 'user'>, actionParams: any) => {
      console.log('Router-level publish action called for post:', ik.pk);
      console.log('Action params:', actionParams);
      // Custom logic: publish to social media, send notifications
      return {
        message: 'Post published via router handler',
        postId: ik.pk,
        authorId: ik.loc[0].lk,
        publishedAt: new Date().toISOString(),
        socialMediaPosted: true,
        notificationsSent: true
      };
    },
    unpublish: async (ik: ComKey<'post', 'user'>, actionParams: any) => {
      console.log('Router-level unpublish action called for post:', ik.pk);
      console.log('Action params:', actionParams);
      // Custom logic: remove from social media, send notifications
      return {
        message: 'Post unpublished via router handler',
        postId: ik.pk,
        authorId: ik.loc[0].lk,
        unpublishedAt: new Date().toISOString(),
        socialMediaRemoved: true,
        notificationsSent: true
      };
    }
  },

  // Router-level facet handlers for posts - aligned with library operation signatures
  facets: {
    analytics: async (ik: ComKey<'post', 'user'>, facetParams: any) => {
      console.log('Router-level analytics facet called for post:', ik.pk);
      console.log('Facet params:', facetParams);
      // Custom logic: aggregate analytics from multiple sources
      return {
        postId: ik.pk,
        views: 1250,
        likes: 89,
        shares: 23,
        comments: 15,
        engagementRate: 0.12,
        topReferrers: ['twitter.com', 'facebook.com', 'linkedin.com']
      };
    },
    comments: async (ik: ComKey<'post', 'user'>, facetParams: any) => {
      console.log('Router-level comments facet called for post:', ik.pk);
      console.log('Facet params:', facetParams);
      // Custom logic: fetch comments from external service
      return {
        postId: ik.pk,
        comments: [
          { id: 'comment_1', text: 'Great post!', author: 'user_2', timestamp: new Date() },
          { id: 'comment_2', text: 'Very informative', author: 'user_3', timestamp: new Date() }
        ],
        totalComments: 2
      };
    }
  },

  // Router-level all action handlers for posts - aligned with library operation signatures
  allActions: {
    bulkPublish: async (allActionParams: any, locations: any) => {
      console.log('Router-level bulk publish action called');
      console.log('All action params:', allActionParams);
      console.log('Locations:', locations);
      // Custom logic: batch publishing to multiple platforms
      const { postIds } = allActionParams;
      return {
        message: 'Bulk publish via router handler',
        processedPosts: postIds?.length || 0,
        timestamp: new Date().toISOString(),
        platformsUpdated: ['twitter', 'facebook', 'linkedin']
      };
    },
    bulkUnpublish: async (allActionParams: any, locations: any) => {
      console.log('Router-level bulk unpublish action called');
      console.log('All action params:', allActionParams);
      console.log('Locations:', locations);
      // Custom logic: batch unpublishing from multiple platforms
      const { postIds } = allActionParams;
      return {
        message: 'Bulk unpublish via router handler',
        processedPosts: postIds?.length || 0,
        timestamp: new Date().toISOString(),
        platformsUpdated: ['twitter', 'facebook', 'linkedin']
      };
    }
  },

  // Router-level all facet handlers for posts - aligned with library operation signatures
  allFacets: {
    postStats: async (allFacetParams: any, locations: any) => {
      console.log('Router-level post stats facet called');
      console.log('All facet params:', allFacetParams);
      console.log('Locations:', locations);
      // Custom logic: aggregate post statistics
      return {
        totalPosts: 450,
        publishedPosts: 380,
        draftPosts: 70,
        averageViews: 850,
        averageLikes: 45,
        topCategories: ['technology', 'business', 'lifestyle']
      };
    },
    postCount: async (allFacetParams: any, locations: any) => {
      console.log('Router-level post count facet called');
      console.log('All facet params:', allFacetParams);
      console.log('Locations:', locations);
      // Custom logic: real-time count with filtering
      return {
        count: 450,
        published: 380,
        draft: 70,
        lastUpdated: new Date().toISOString(),
        source: 'database'
      };
    }
  }
} as any);

// Mount routers
app.use('/api/users', userRouter.getRouter());
app.use('/api/posts', postRouter.getRouter());

// Example usage endpoints
app.get('/examples', (req, res) => {
  res.json({
    message: 'Router Handlers Example',
    endpoints: {
      // User endpoints with router handlers
      'POST /api/users/user_1/activate': 'Router-level activate action',
      'POST /api/users/user_1/deactivate': 'Router-level deactivate action',
      'GET /api/users/user_1/profile': 'Router-level profile facet',
      'GET /api/users/user_1/stats': 'Router-level stats facet',
      'POST /api/users/bulkActivate': 'Router-level bulk activate action',
      'POST /api/users/bulkDeactivate': 'Router-level bulk deactivate action',
      'GET /api/users/userStats': 'Router-level user stats facet',
      'GET /api/users/userCount': 'Router-level user count facet',

      // Post endpoints with router handlers
      'POST /api/posts/post_1/publish': 'Router-level publish action',
      'POST /api/posts/post_1/unpublish': 'Router-level unpublish action',
      'GET /api/posts/post_1/analytics': 'Router-level analytics facet',
      'GET /api/posts/post_1/comments': 'Router-level comments facet',
      'POST /api/posts/bulkPublish': 'Router-level bulk publish action',
      'POST /api/posts/bulkUnpublish': 'Router-level bulk unpublish action',
      'GET /api/posts/postStats': 'Router-level post stats facet',
      'GET /api/posts/postCount': 'Router-level post count facet',

      // Library fallback endpoints (these will use library handlers)
      'POST /api/users/user_1/someOtherAction': 'Library action (fallback)',
      'GET /api/users/user_1/someOtherFacet': 'Library facet (fallback)',
      'POST /api/users/someOtherAllAction': 'Library all action (fallback)',
      'GET /api/users/someOtherAllFacet': 'Library all facet (fallback)'
    }
  });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Router Handlers Example server running on http://localhost:${PORT}`);
  console.log('Visit http://localhost:3000/examples for endpoint documentation');
});

export { app, userRouter, postRouter };
