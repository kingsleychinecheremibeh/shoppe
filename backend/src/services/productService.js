import slugify from "slugify";
import { productRepository } from "../repositories/productRepository.js";
import { AppError } from "../utils/AppError.js";

const createSlug = (name) => {
  return slugify(name, { lower: true, strict: true });
};

const createUniqueProductSlug = async (name, productIdToIgnore) => {
  const baseSlug = createSlug(name) || "product";
  let slug = baseSlug;
  let count = 1;

  while (true) {
    const existingProduct = await productRepository.findBySlug(slug);

    if (!existingProduct || existingProduct.id === productIdToIgnore) {
      return slug;
    }

    slug = `${baseSlug}-${count}`;
    count++;
  }
};

export const productService = {
  async create(data) {
    if (!data.name || !data.description || !data.categoryId) {
      throw new AppError("Name, description, and category are required", 400);
    }

    const category = await productRepository.findCategoryById(data.categoryId);
    if (!category) {
      throw new AppError("Category not found", 400);
    }

    const price = Number(data.price);
    const stock = Number(data.stock || 0);

    if (!Number.isFinite(price) || price <= 0) {
      throw new AppError("Price must be a positive number", 400);
    }

    if (!Number.isInteger(stock) || stock < 0) {
      throw new AppError("Stock must be a non-negative whole number", 400);
    }

    const slug = await createUniqueProductSlug(data.name);

    return productRepository.create({
      name: data.name,
      slug,
      description: data.description,
      price,
      image: data.image,
      stock,
      categoryId: data.categoryId,
    });
  },

  async update(id, data) {
    const existingProduct = await productRepository.findById(id);
    if (!existingProduct) {
      throw new AppError("Product not found", 404);
    }

    const updateData = { ...data };

    if (data.name !== undefined) {
      updateData.slug = await createUniqueProductSlug(data.name, id);
    }

    if (data.categoryId !== undefined) {
      const category = await productRepository.findCategoryById(data.categoryId);
      if (!category) {
        throw new AppError("Category not found", 400);
      }
    }

    if (data.price !== undefined) {
      const price = Number(data.price);
      if (!Number.isFinite(price) || price <= 0) {
        throw new AppError("Price must be a positive number", 400);
      }
      updateData.price = price;
    }

    if (data.stock !== undefined) {
      const stock = Number(data.stock);
      if (!Number.isInteger(stock) || stock < 0) {
        throw new AppError("Stock must be a non-negative whole number", 400);
      }
      updateData.stock = stock;
    }

    return productRepository.update(id, updateData);
  },

  async getAll() {
    return productRepository.findAll();
  },

  async getById(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new AppError("Product not found", 404);
    }
    return product;
  },

  async delete(id) {
    const existingProduct = await productRepository.findById(id);
    if (!existingProduct) {
      throw new AppError("Product not found", 404);
    }

    return productRepository.delete(id);
  },
};
