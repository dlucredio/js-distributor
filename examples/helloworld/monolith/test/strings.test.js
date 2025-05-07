import { toLowerCase, toUpperCase, split, join } from '../src/util/strings.js';

// examples/helloworld/monolith/src/util/strings.test.js
describe('toLowerCase', () => {
    test('converts uppercase letters to lowercase', () => {
        expect(toLowerCase('HELLO')).toBe('hello');
    });

    test('keeps lowercase letters unchanged', () => {
        expect(toLowerCase('hello')).toBe('hello');
    });

    test('handles mixed case strings', () => {
        expect(toLowerCase('HeLLo')).toBe('hello');
    });

    test('handles non-alphabetic characters', () => {
        expect(toLowerCase('123!@#')).toBe('123!@#');
    });
});

describe('toUpperCase', () => {
    test('converts lowercase letters to uppercase', () => {
        expect(toUpperCase('hello')).toBe('HELLO');
    });

    test('keeps uppercase letters unchanged', () => {
        expect(toUpperCase('HELLO')).toBe('HELLO');
    });

    test('handles mixed case strings', () => {
        expect(toUpperCase('HeLLo')).toBe('HELLO');
    });

    test('handles non-alphabetic characters', () => {
        expect(toUpperCase('123!@#')).toBe('123!@#');
    });
});

describe('split', () => {
    test('splits a string by the default separator (comma)', () => {
        expect(split('a,b,c')).toEqual(['a', 'b', 'c']);
    });

    test('splits a string by a custom separator', () => {
        expect(split('a|b|c', '|')).toEqual(['a', 'b', 'c']);
    });

    test('handles strings without the separator', () => {
        expect(split('abc')).toEqual(['abc']);
    });

    test('handles empty strings', () => {
        expect(split('')).toEqual(['']);
    });
});

describe('join', () => {
    test('joins an array into a string with the default separator (comma)', () => {
        expect(join(['a', 'b', 'c'])).toBe('a,b,c');
    });

    test('joins an array into a string with a custom separator', () => {
        expect(join(['a', 'b', 'c'], '|')).toBe('a|b|c');
    });

    test('handles an array with a single element', () => {
        expect(join(['a'])).toBe('a');
    });

    test('handles an empty array', () => {
        expect(join([])).toBe('');
    });
});