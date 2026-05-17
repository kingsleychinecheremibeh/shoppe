
import { jest } from "@jest/globals";
import request from "supertest";
import { parsePositiveNumber, parseNonNegativeInteger, parsePositiveInteger } from '../src/validators/numberValidator.js';

describe('parsePositiveNumber', () => {
  test('returns number for positive values', () => {
    expect(parsePositiveNumber(5)).toBe(5);
    expect(parsePositiveNumber('10')).toBe(10);
    expect(parsePositiveNumber(0.5)).toBe(0.5);
  });

  test('returns null for non-positive values', () => {
    expect(parsePositiveNumber(0)).toBe(null);
    expect(parsePositiveNumber(-1)).toBe(null);
    expect(parsePositiveNumber('abc')).toBe(null);
  });
});

describe('parseNonNegativeInteger', () => {
  test('returns integer for non-negative integers', () => {
    expect(parseNonNegativeInteger(0)).toBe(0);
    expect(parseNonNegativeInteger(5)).toBe(5);
    expect(parseNonNegativeInteger('10')).toBe(10);
  });

  test('returns null for negative or non-integer values', () => {
    expect(parseNonNegativeInteger(-1)).toBe(null);
    expect(parseNonNegativeInteger(0.5)).toBe(null);
    expect(parseNonNegativeInteger('abc')).toBe(null);
  });
});

describe('parsePositiveInteger', () => {
  test('returns integer for positive whole numbers', () => {
    expect(parsePositiveInteger(1)).toBe(1);
    expect(parsePositiveInteger('3')).toBe(3);
    expect(parsePositiveInteger(10)).toBe(10);
  });

  test('returns null for zero, floats, negatives, and non-numbers', () => {
    expect(parsePositiveInteger(0)).toBe(null);
    expect(parsePositiveInteger(1.5)).toBe(null);
    expect(parsePositiveInteger(-1)).toBe(null);
    expect(parsePositiveInteger('abc')).toBe(null);
  });
});