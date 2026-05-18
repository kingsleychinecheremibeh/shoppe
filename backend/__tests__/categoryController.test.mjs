import { jest } from "@jest/globals";

const categoryService = {
  getCategories: jest.fn(),
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
};

await jest.unstable_mockModule('../src/services/categoryService.js', () => ({ categoryService }));

const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = await import('../src/controllers/categoryController.js');

const makeRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

describe('categoryController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('gets categories', async () => {
    const res = makeRes();
    categoryService.getCategories.mockResolvedValue([{ id: 'cat-1' }]);

    await getCategories({}, res);

    expect(res.json).toHaveBeenCalledWith([{ id: 'cat-1' }]);
  });

  test('creates a category', async () => {
    const req = { body: { name: 'Shoes' } };
    const res = makeRes();
    categoryService.createCategory.mockResolvedValue({ id: 'cat-1', name: 'Shoes' });

    await createCategory(req, res);

    expect(categoryService.createCategory).toHaveBeenCalledWith({ name: 'Shoes' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 'cat-1', name: 'Shoes' });
  });

  test('updates a category', async () => {
    const req = { params: { id: 'cat-1' }, body: { name: 'Bags' } };
    const res = makeRes();
    categoryService.updateCategory.mockResolvedValue({ id: 'cat-1', name: 'Bags' });

    await updateCategory(req, res);

    expect(categoryService.updateCategory).toHaveBeenCalledWith('cat-1', { name: 'Bags' });
    expect(res.json).toHaveBeenCalledWith({ id: 'cat-1', name: 'Bags' });
  });

  test('deletes a category', async () => {
    const req = { params: { id: 'cat-1' } };
    const res = makeRes();
    categoryService.deleteCategory.mockResolvedValue({ id: 'cat-1' });

    await deleteCategory(req, res);

    expect(categoryService.deleteCategory).toHaveBeenCalledWith('cat-1');
    expect(res.json).toHaveBeenCalledWith({ message: 'Category deleted successfully' });
  });

  test('forwards errors to next when service fails', async () => {
    const res = makeRes();
    const next = jest.fn();
    const error = new Error('boom');
    categoryService.getCategories.mockRejectedValue(error);

    await getCategories({}, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});
