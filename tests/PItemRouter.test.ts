/* eslint-disable @typescript-eslint/no-unused-vars */
import { PItemRouter } from "@/PItemRouter";
import { Item, PriKey, UUID } from "@fjell/core";
import { Primary } from "@fjell/lib";
import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@fjell/logging', () => ({
  default: {
    get: vi.fn().mockReturnThis(),
    getLogger: vi.fn().mockReturnThis(),
    default: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    emergency: vi.fn(),
    alert: vi.fn(),
    critical: vi.fn(),
    notice: vi.fn(),
    time: vi.fn().mockReturnThis(),
    end: vi.fn(),
    log: vi.fn(),
  }
}));

type TestItem = Item<"test">;

const priKey: PriKey<"test"> = { kt: "test", pk: "1-1-1-1-1" as UUID };

const testItem: TestItem = {
  key: priKey,
  stuff: true,
  events: {
    created: { at: new Date() },
    updated: { at: new Date() },
    deleted: { at: null }
  }
};

describe("PItemFSRouter", () => {
  let router: PItemRouter<TestItem, "test">;
  let mockLib: any;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    mockLib = {
      create: vi.fn(),
      all: vi.fn(),
      find: vi.fn()
    };
    router = new PItemRouter(mockLib, "test");
    req = {
      params: {},
      body: {},
      query: {}
    };
    res = {
      locals: {},
      // @ts-ignore
      json: vi.fn(),
      // @ts-ignore
      status: vi.fn().mockReturnThis()
    };
  });

  it("should create an item", async () => {
    mockLib.create.mockResolvedValue(testItem);
    const response = await router.createItem(req as Request, res as Response);
    expect(res.json).toHaveBeenCalledWith(testItem);
  });

  it("should find items", async () => {
    mockLib.all.mockResolvedValue([testItem]);
    const response = await router['findItems'](req as Request, res as Response);
    expect(res.json).toHaveBeenCalledWith([testItem]);
  });

  it("should return the correct primary key", () => {
    res.locals = { testPk: "1-1-1-1-1" };
    const pk = router.getIk(res as Response);
    expect(pk).toEqual(priKey);
  });

  describe('findItems', () => {
    it('should find items using finder when finder param exists', async () => {
      const mockItems = [{
        id: '123',
        key: {
          kt: 'test',
          pk: '123'
        }
      }];

      // @ts-ignore
      mockLib.find.mockResolvedValue(mockItems);
      req.query = {
        finder: 'testFinder',
        finderParams: JSON.stringify({ param: 'value' })
      };

      await router['findItems'](req as Request, res as Response);

      expect(mockLib.find).toHaveBeenCalledWith('testFinder', { param: 'value' });
      expect(res.json).toHaveBeenCalledWith(mockItems);
    });

    it('should find items using query when no finder exists', async () => {
      const mockItems = [{
        id: '123',
        key: {
          kt: 'test',
          pk: '123'
        }
      }];

      // @ts-ignore
      mockLib.all.mockResolvedValue(mockItems);
      req.query = {
        limit: '10'
      };

      await router['findItems'](req as Request, res as Response);

      expect(mockLib.all).toHaveBeenCalledWith(expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(mockItems);
    });
  });
});