import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CItemRouter, PItemRouter } from '../src';
import { ComKey, Item, PriKey } from '@fjell/core';
import { Request, Response } from 'express';

// Test helper classes to access protected members
class TestPItemRouter<T extends Item<S>, S extends string> extends PItemRouter<T, S> {
  public getOptions() {
    return this.options;
  }
}

class TestCItemRouter<
  T extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> extends CItemRouter<T, S, L1, L2, L3, L4, L5> {
  public getOptions() {
    return this.options;
  }
}

// Mock data models
interface User extends Item<'user'> {
  id: string;
  name: string;
  email: string;
}

interface Post extends Item<'post', 'user'> {
  id: string;
  title: string;
  content: string;
  authorId: string;
}

// Mock operations
const mockUserOperations = {
  create: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  all: vi.fn(),
  find: vi.fn(),
  action: vi.fn(),
  facet: vi.fn(),
  allAction: vi.fn(),
  allFacet: vi.fn()
};

const mockPostOperations = {
  create: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  all: vi.fn(),
  find: vi.fn(),
  action: vi.fn(),
  facet: vi.fn(),
  allAction: vi.fn(),
  allFacet: vi.fn()
};

// Mock instances
const mockUserInstance = {
  operations: mockUserOperations,
  options: {
    actions: {
      activate: { description: 'Activate user' },
      deactivate: { description: 'Deactivate user' },
      someOtherAction: { description: 'Some other action' }
    },
    facets: {
      profile: { description: 'Get user profile' },
      stats: { description: 'Get user stats' },
      someOtherFacet: { description: 'Some other facet' }
    },
    allActions: {
      bulkActivate: { description: 'Bulk activate users' },
      bulkDeactivate: { description: 'Bulk deactivate users' },
      someOtherAllAction: { description: 'Some other all action' }
    },
    allFacets: {
      userStats: { description: 'Get user statistics' },
      userCount: { description: 'Get user count' },
      someOtherAllFacet: { description: 'Some other all facet' }
    }
  }
} as any;

const mockPostInstance = {
  operations: mockPostOperations,
  options: {
    actions: {
      publish: { description: 'Publish post' },
      unpublish: { description: 'Unpublish post' },
      someOtherAction: { description: 'Some other action' }
    },
    facets: {
      analytics: { description: 'Get post analytics' },
      comments: { description: 'Get post comments' },
      someOtherFacet: { description: 'Some other facet' }
    },
    allActions: {
      bulkPublish: { description: 'Bulk publish posts' },
      bulkUnpublish: { description: 'Bulk unpublish posts' },
      someOtherAllAction: { description: 'Some other all action' }
    },
    allFacets: {
      postStats: { description: 'Get post statistics' },
      postCount: { description: 'Get post count' },
      someOtherAllFacet: { description: 'Some other all facet' }
    }
  }
} as any;

describe('Router Handlers', () => {
  let userRouter: TestPItemRouter<User, 'user'>;
  let postRouter: TestCItemRouter<Post, 'post', 'user'>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create routers with router-level handlers
    userRouter = new TestPItemRouter(mockUserInstance, 'user', {
      actions: {
        activate: vi.fn(async (req: Request, res: Response, ik: PriKey<'user'>) => {
          res.json({ message: 'Router activate', userId: ik.pk });
        }),
        deactivate: vi.fn(async (req: Request, res: Response, ik: PriKey<'user'>) => {
          res.json({ message: 'Router deactivate', userId: ik.pk });
        })
      },
      facets: {
        profile: vi.fn(async (req: Request, res: Response, ik: PriKey<'user'>) => {
          res.json({ message: 'Router profile', userId: ik.pk });
        }),
        stats: vi.fn(async (req: Request, res: Response, ik: PriKey<'user'>) => {
          res.json({ message: 'Router stats', userId: ik.pk });
        })
      },
      allActions: {
        bulkActivate: vi.fn(async (req: Request, res: Response) => {
          res.json({ message: 'Router bulk activate' });
        }),
        bulkDeactivate: vi.fn(async (req: Request, res: Response) => {
          res.json({ message: 'Router bulk deactivate' });
        })
      },
      allFacets: {
        userStats: vi.fn(async (req: Request, res: Response) => {
          res.json({ message: 'Router user stats' });
        }),
        userCount: vi.fn(async (req: Request, res: Response) => {
          res.json({ message: 'Router user count' });
        })
      }
    } as any);

    postRouter = new TestCItemRouter(mockPostInstance, 'post', userRouter, {
      actions: {
        publish: vi.fn(async (req: Request, res: Response, ik: ComKey<'post', 'user'>) => {
          res.json({ message: 'Router publish', postId: ik.pk });
        }),
        unpublish: vi.fn(async (req: Request, res: Response, ik: ComKey<'post', 'user'>) => {
          res.json({ message: 'Router unpublish', postId: ik.pk });
        })
      },
      facets: {
        analytics: vi.fn(async (req: Request, res: Response, ik: ComKey<'post', 'user'>) => {
          res.json({ message: 'Router analytics', postId: ik.pk });
        }),
        comments: vi.fn(async (req: Request, res: Response, ik: ComKey<'post', 'user'>) => {
          res.json({ message: 'Router comments', postId: ik.pk });
        })
      },
      allActions: {
        bulkPublish: vi.fn(async (req: Request, res: Response) => {
          res.json({ message: 'Router bulk publish' });
        }),
        bulkUnpublish: vi.fn(async (req: Request, res: Response) => {
          res.json({ message: 'Router bulk unpublish' });
        })
      },
      allFacets: {
        postStats: vi.fn(async (req: Request, res: Response) => {
          res.json({ message: 'Router post stats' });
        }),
        postCount: vi.fn(async (req: Request, res: Response) => {
          res.json({ message: 'Router post count' });
        })
      }
    } as any);

    // Mock request and response
    mockReq = {
      path: '/test',
      query: {},
      params: {},
      body: {},
      originalUrl: '/test'
    } as any;

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      locals: {}
    };
  });

  describe('PItemRouter Handlers', () => {
    it('should use router-level action handler when available', async () => {
      const req = { ...mockReq, path: '/activate' } as Request;
      mockRes.locals = { userPk: 'user_123' };

      await userRouter['postItemAction'](req, mockRes as Response);

      expect(userRouter.getOptions().actions?.activate).toHaveBeenCalledWith(
        req,
        mockRes,
        { kt: 'user', pk: 'user_123' }
      );
      expect(mockUserOperations.action).not.toHaveBeenCalled();
    });

    it('should fallback to library action handler when router handler not available', async () => {
      const req = { ...mockReq, path: '/someOtherAction' } as Request;
      mockRes.locals = { userPk: 'user_123' };
      mockUserOperations.action.mockResolvedValue({ message: 'Library action' });

      await userRouter['postItemAction'](req, mockRes as Response);

      expect(mockUserOperations.action).toHaveBeenCalledWith(
        { kt: 'user', pk: 'user_123' },
        'someOtherAction',
        {}
      );
    });

    it('should use router-level facet handler when available', async () => {
      const req = { ...mockReq, path: '/profile' } as Request;
      mockRes.locals = { userPk: 'user_123' };

      await userRouter['getItemFacet'](req, mockRes as Response);

      expect(userRouter.getOptions().facets?.profile).toHaveBeenCalledWith(
        req,
        mockRes,
        { kt: 'user', pk: 'user_123' }
      );
      expect(mockUserOperations.facet).not.toHaveBeenCalled();
    });

    it('should fallback to library facet handler when router handler not available', async () => {
      const req = { ...mockReq, path: '/someOtherFacet' } as Request;
      mockRes.locals = { userPk: 'user_123' };
      mockUserOperations.facet.mockResolvedValue({ message: 'Library facet' });

      await userRouter['getItemFacet'](req, mockRes as Response);

      expect(mockUserOperations.facet).toHaveBeenCalledWith(
        { kt: 'user', pk: 'user_123' },
        'someOtherFacet',
        {}
      );
    });

    it('should use router-level all action handler when available', async () => {
      const req = { ...mockReq, path: '/bulkActivate' } as Request;

      await userRouter['postAllAction'](req, mockRes as Response);

      expect(userRouter.getOptions().allActions?.bulkActivate).toHaveBeenCalledWith(
        req,
        mockRes
      );
      expect(mockUserOperations.allAction).not.toHaveBeenCalled();
    });

    it('should fallback to library all action handler when router handler not available', async () => {
      const req = { ...mockReq, path: '/someOtherAllAction' } as Request;
      mockUserOperations.allAction.mockResolvedValue({ message: 'Library all action' });

      await userRouter['postAllAction'](req, mockRes as Response);

      expect(mockUserOperations.allAction).toHaveBeenCalledWith(
        'someOtherAllAction',
        {}
      );
    });

    it('should use router-level all facet handler when available', async () => {
      const req = { ...mockReq, path: '/userStats' } as Request;

      await userRouter['getAllFacet'](req, mockRes as Response);

      expect(userRouter.getOptions().allFacets?.userStats).toHaveBeenCalledWith(
        req,
        mockRes
      );
      expect(mockUserOperations.allFacet).not.toHaveBeenCalled();
    });

    it('should fallback to library all facet handler when router handler not available', async () => {
      const req = { ...mockReq, path: '/someOtherAllFacet' } as Request;
      mockUserOperations.allFacet.mockResolvedValue({ message: 'Library all facet' });

      await userRouter['getAllFacet'](req, mockRes as Response);

      expect(mockUserOperations.allFacet).toHaveBeenCalledWith(
        'someOtherAllFacet',
        {}
      );
    });
  });

  describe('CItemRouter Handlers', () => {
    beforeEach(() => {
      mockRes.locals = { userPk: 'user_123', postPk: 'post_456' };
    });

    it('should use router-level action handler when available', async () => {
      const req = { ...mockReq, path: '/publish' } as Request;

      await postRouter['postItemAction'](req, mockRes as Response);

      expect(postRouter.getOptions().actions?.publish).toHaveBeenCalledWith(
        req,
        mockRes,
        { kt: 'post', pk: 'post_456', loc: [{ kt: 'user', lk: 'user_123' }] }
      );
      expect(mockPostOperations.action).not.toHaveBeenCalled();
    });

    it('should fallback to library action handler when router handler not available', async () => {
      const req = { ...mockReq, path: '/someOtherAction' } as Request;
      mockPostOperations.action.mockResolvedValue({ message: 'Library action' });

      await postRouter['postItemAction'](req, mockRes as Response);

      expect(mockPostOperations.action).toHaveBeenCalledWith(
        { kt: 'post', pk: 'post_456', loc: [{ kt: 'user', lk: 'user_123' }] },
        'someOtherAction',
        {}
      );
    });

    it('should use router-level facet handler when available', async () => {
      const req = { ...mockReq, path: '/analytics' } as Request;

      await postRouter['getItemFacet'](req, mockRes as Response);

      expect(postRouter.getOptions().facets?.analytics).toHaveBeenCalledWith(
        req,
        mockRes,
        { kt: 'post', pk: 'post_456', loc: [{ kt: 'user', lk: 'user_123' }] }
      );
      expect(mockPostOperations.facet).not.toHaveBeenCalled();
    });

    it('should fallback to library facet handler when router handler not available', async () => {
      const req = { ...mockReq, path: '/someOtherFacet' } as Request;
      mockPostOperations.facet.mockResolvedValue({ message: 'Library facet' });

      await postRouter['getItemFacet'](req, mockRes as Response);

      expect(mockPostOperations.facet).toHaveBeenCalledWith(
        { kt: 'post', pk: 'post_456', loc: [{ kt: 'user', lk: 'user_123' }] },
        'someOtherFacet',
        {}
      );
    });

    it('should use router-level all action handler when available', async () => {
      const req = { ...mockReq, path: '/bulkPublish' } as Request;

      await postRouter['postAllAction'](req, mockRes as Response);

      expect(postRouter.getOptions().allActions?.bulkPublish).toHaveBeenCalledWith(
        req,
        mockRes
      );
      expect(mockPostOperations.allAction).not.toHaveBeenCalled();
    });

    it('should fallback to library all action handler when router handler not available', async () => {
      const req = { ...mockReq, path: '/someOtherAllAction' } as Request;
      mockPostOperations.allAction.mockResolvedValue({ message: 'Library all action' });

      await postRouter['postAllAction'](req, mockRes as Response);

      expect(mockPostOperations.allAction).toHaveBeenCalledWith(
        'someOtherAllAction',
        {}
      );
    });

    it('should use router-level all facet handler when available', async () => {
      const req = { ...mockReq, path: '/postStats' } as Request;

      await postRouter['getAllFacet'](req, mockRes as Response);

      expect(postRouter.getOptions().allFacets?.postStats).toHaveBeenCalledWith(
        req,
        mockRes
      );
      expect(mockPostOperations.allFacet).not.toHaveBeenCalled();
    });

    it('should fallback to library all facet handler when router handler not available', async () => {
      const req = { ...mockReq, path: '/someOtherAllFacet' } as Request;
      mockPostOperations.allFacet.mockResolvedValue({ message: 'Library all facet' });

      await postRouter['getAllFacet'](req, mockRes as Response);

      expect(mockPostOperations.allFacet).toHaveBeenCalledWith(
        'someOtherAllFacet',
        {}
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in router-level action handlers', async () => {
      const error = new Error('Router action error');
      userRouter.getOptions().actions!.activate = vi.fn().mockRejectedValue(error);
      const req = { ...mockReq, path: '/activate' } as Request;
      mockRes.locals = { userPk: 'user_123' };

      await userRouter['postItemAction'](req, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(error);
    });

    it('should handle errors in router-level facet handlers', async () => {
      const error = new Error('Router facet error');
      userRouter.getOptions().facets!.profile = vi.fn().mockRejectedValue(error);
      const req = { ...mockReq, path: '/profile' } as Request;
      mockRes.locals = { userPk: 'user_123' };

      await userRouter['getItemFacet'](req, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(error);
    });

    it('should handle errors in router-level all action handlers', async () => {
      const error = new Error('Router all action error');
      userRouter.getOptions().allActions!.bulkActivate = vi.fn().mockRejectedValue(error);
      const req = { ...mockReq, path: '/bulkActivate' } as Request;

      await userRouter['postAllAction'](req, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(error);
    });

    it('should handle errors in router-level all facet handlers', async () => {
      const error = new Error('Router all facet error');
      userRouter.getOptions().allFacets!.userStats = vi.fn().mockRejectedValue(error);
      const req = { ...mockReq, path: '/userStats' } as Request;

      await userRouter['getAllFacet'](req, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(error);
    });
  });
});
