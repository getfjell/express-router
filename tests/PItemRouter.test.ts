/* eslint-disable @typescript-eslint/no-unused-vars */
import { PItemRouter } from "@/PItemRouter";
import { Item, PriKey, UUID } from "@fjell/core";
import { Primary } from "@fjell/lib";
import { Request, Response } from "express";
import { jest } from "@jest/globals";

jest.mock('@fjell/logging', () => {
  return {
    get: jest.fn().mockReturnThis(),
    getLogger: jest.fn().mockReturnThis(),
    default: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    emergency: jest.fn(),
    alert: jest.fn(),
    critical: jest.fn(),
    notice: jest.fn(),
    time: jest.fn().mockReturnThis(),
    end: jest.fn(),
    log: jest.fn(),
  }
});

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
  let mockLib: jest.Mocked<Primary.Operations<TestItem, "test">>;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    mockLib = {
      create: jest.fn(),
      all: jest.fn(),
      find: jest.fn()
    } as unknown as jest.Mocked<Primary.Operations<TestItem, "test">>;
    router = new PItemRouter(mockLib, "test");
    req = {
      params: {},
      body: {},
      query: {}
    };
    res = {
      locals: {},
      // @ts-ignore
      json: jest.fn(),
      // @ts-ignore
      status: jest.fn().mockReturnThis()
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
        finderParams: JSON.stringify({param: 'value'})
      };

      await router['findItems'](req as Request, res as Response);

      expect(mockLib.find).toHaveBeenCalledWith('testFinder', {param: 'value'});
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