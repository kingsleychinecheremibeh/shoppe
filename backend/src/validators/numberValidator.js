import { z } from 'zod';

const positiveNumberSchema = z.number().positive();
const nonNegativeIntegerSchema = z.number().int().nonnegative();
const positiveIntegerSchema = z.number().int().positive();

export const parsePositiveNumber = (value) => {
    const result = positiveNumberSchema.safeParse(Number(value));
    return result.success ? result.data : null;
};

export const parseNonNegativeInteger = (value) => {
    const result = nonNegativeIntegerSchema.safeParse(Number(value));
    return result.success ? result.data : null;
};

export const parsePositiveInteger = (value) => {
    const result = positiveIntegerSchema.safeParse(Number(value));
    return result.success ? result.data : null;
};
