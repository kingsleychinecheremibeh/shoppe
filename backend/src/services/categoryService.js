import slugify from "slugify";
import { categoryRepository } from "../repositories/categoryRepository.js";
import { AppError } from "../utils/AppError.js";

const createUniqueCategorySlug = async (
  name,
  categoryIdToIgnore
) => {
  const baseSlug =
    slugify(name, {
      lower: true,
      strict: true,
      trim: true,
    }) || "category";

  let slug = baseSlug;
  let count = 1;

  while (true) {
    const existingCategory =
      await categoryRepository.findBySlug(slug);

    if (
      !existingCategory ||
      existingCategory.id === categoryIdToIgnore
    ) {
      return slug;
    }

    slug = `${baseSlug}-${count}`;
    count++;
  }
};

export const categoryService = {
  async getCategories() {
    return categoryRepository.findAll();
  },

  async createCategory(data) {
    const name = typeof data === "string" ? data : data?.name;
    const image = typeof data === "string" ? null : data?.image;

    if (!name) {
      throw new AppError("Name is required", 400);
    }

    const slug = await createUniqueCategorySlug(name);

    return categoryRepository.create({
      name,
      slug,
      image: image || null,
    });
  },

  async updateCategory(id, data) {
    const name = typeof data === "string" ? data : data?.name;
    const image = typeof data === "string" ? null : data?.image;

    if (!name) {
      throw new AppError("Name is required", 400);
    }

    const existingCategory =
      await categoryRepository.findById(id);

    if (!existingCategory) {
      throw new AppError("Category not found", 404);
    }

    const slug = await createUniqueCategorySlug(
      name,
      id
    );

    return categoryRepository.update(id, {
      name,
      slug,
      image: image || null,
    });
  },

  async deleteCategory(id) {
    const existingCategory =
      await categoryRepository.findById(id);

    if (!existingCategory) {
      throw new AppError("Category not found", 404);
    }

    const activeProducts = existingCategory.products.filter(product => !product.deletedAt);
    if (activeProducts.length > 0) {
      throw new AppError(
        "Cannot delete category with products", 400
      );
    }

    return categoryRepository.delete(id);
  },
};
