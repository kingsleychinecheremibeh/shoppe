import { jest } from "@jest/globals";

const del = jest.fn();
let scanBatches = [];

await jest.unstable_mockModule("../src/config/redis.js", () => ({
  isRedisReady: () => true,
  redisClient: {
    del,
    scanIterator: async function* () {
      for (const batch of scanBatches) yield batch;
    },
  },
}));

const { invalidateCache } = await import("../src/middleware/cacheMiddleware.js");

describe("invalidateCache", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("deletes every key when redis yields keys in batches (node-redis v5)", async () => {
    scanBatches = [
      ["cache:response:/api/v1/products", "cache:response:/api/v1/products?page=2"],
      ["cache:response:/api/v1/products/abc"],
    ];

    await invalidateCache("/products");

    expect(del).toHaveBeenCalledWith([
      "cache:response:/api/v1/products",
      "cache:response:/api/v1/products?page=2",
      "cache:response:/api/v1/products/abc",
    ]);
  });

  test("still handles single keys per iteration", async () => {
    scanBatches = ["cache:response:/api/v1/categories"];

    await invalidateCache("/categories");

    expect(del).toHaveBeenCalledWith(["cache:response:/api/v1/categories"]);
  });

  test("skips the delete call when nothing matches", async () => {
    scanBatches = [[]];

    await invalidateCache("/nothing");

    expect(del).not.toHaveBeenCalled();
  });
});
