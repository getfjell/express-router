 
import { describe, expect, it } from 'vitest';
import { clean, stringifyJSON } from '../../src/util/general';

describe('general utilities', () => {
  describe('clean', () => {
    it('should remove undefined properties from object', () => {
      const input = {
        a: 1,
        b: undefined,
        c: 'hello',
        d: undefined
      };

      const result = clean(input);

      expect(result).toEqual({
        a: 1,
        c: 'hello'
      });
    });

    it('should keep null properties', () => {
      const input = {
        a: 1,
        b: null,
        c: undefined,
        d: 'test'
      };

      const result = clean(input);

      expect(result).toEqual({
        a: 1,
        b: null,
        d: 'test'
      });
    });

    it('should keep zero values', () => {
      const input = {
        a: 0,
        b: undefined,
        c: false,
        d: ''
      };

      const result = clean(input);

      expect(result).toEqual({
        a: 0,
        c: false,
        d: ''
      });
    });

    it('should handle empty objects', () => {
      const input = {};
      const result = clean(input);

      expect(result).toEqual({});
    });

    it('should handle objects with only undefined values', () => {
      const input = {
        a: undefined,
        b: undefined
      };

      const result = clean(input);

      expect(result).toEqual({});
    });

    it('should not modify the original object', () => {
      const input = {
        a: 1,
        b: undefined,
        c: 'test'
      };

      const originalInput = { ...input };
      const result = clean(input);

      expect(input).toEqual(originalInput);
      expect(result).not.toBe(input);
    });
  });

  describe('stringifyJSON', () => {
    describe('primitive types', () => {
      it('should stringify numbers', () => {
        expect(stringifyJSON(42)).toBe('42');
        expect(stringifyJSON(0)).toBe('0');
        expect(stringifyJSON(-1)).toBe('-1');
        expect(stringifyJSON(3.14)).toBe('3.14');
      });

      it('should stringify booleans', () => {
        expect(stringifyJSON(true)).toBe('true');
        expect(stringifyJSON(false)).toBe('false');
      });

      it('should stringify null', () => {
        expect(stringifyJSON(null)).toBe('null');
      });

      it('should stringify strings', () => {
        expect(stringifyJSON('hello')).toBe('"hello"');
        expect(stringifyJSON('')).toBe('""');
        expect(stringifyJSON('with spaces')).toBe('"with spaces"');
      });
    });

    describe('arrays', () => {
      it('should stringify empty arrays', () => {
        expect(stringifyJSON([])).toBe('[]');
      });

      it('should stringify arrays with primitives', () => {
        expect(stringifyJSON([1, 2, 3])).toBe('[1,2,3]');
        expect(stringifyJSON(['a', 'b', 'c'])).toBe('["a","b","c"]');
        expect(stringifyJSON([true, false, null])).toBe('[true,false,null]');
      });

      it('should stringify mixed arrays', () => {
        expect(stringifyJSON([1, 'hello', true, null])).toBe('[1,"hello",true,null]');
      });

      it('should stringify nested arrays', () => {
        expect(stringifyJSON([[1, 2], [3, 4]])).toBe('[[1,2],[3,4]]');
      });
    });

    describe('objects', () => {
      it('should stringify empty objects', () => {
        expect(stringifyJSON({})).toBe('{}');
      });

      it('should stringify simple objects', () => {
        const obj = { a: 1, b: 'hello', c: true };
        const result = stringifyJSON(obj);
        expect(result).toBe('{"a":1,"b":"hello","c":true}');
      });

      it('should skip undefined properties', () => {
        const obj = { a: 1, b: undefined, c: 'hello' };
        const result = stringifyJSON(obj);
        expect(result).toBe('{"a":1,"c":"hello"}');
      });

      it('should skip function properties', () => {
        const obj = { a: 1, b: () => { }, c: 'hello' };
        const result = stringifyJSON(obj);
        expect(result).toBe('{"a":1,"c":"hello"}');
      });

      it('should include null properties', () => {
        const obj = { a: 1, b: null, c: 'hello' };
        const result = stringifyJSON(obj);
        expect(result).toBe('{"a":1,"b":null,"c":"hello"}');
      });

      it('should stringify nested objects', () => {
        const obj = { a: { b: { c: 1 } } };
        const result = stringifyJSON(obj);
        expect(result).toBe('{"a":{"b":{"c":1}}}');
      });
    });

    describe('circular references', () => {
      it('should handle circular references in objects', () => {
        const obj: any = { a: 1 };
        obj.self = obj;

        const result = stringifyJSON(obj);
        expect(result).toBe('{"a":1,"self":"(circular)"}');
      });

      it('should handle circular references in arrays', () => {
        const arr: any = [1, 2];
        arr.push(arr);

        const result = stringifyJSON(arr);
        expect(result).toBe('[1,2,"(circular)"]');
      });

      it('should handle nested circular references', () => {
        const obj1: any = { name: 'obj1' };
        const obj2: any = { name: 'obj2', ref: obj1 };
        obj1.ref = obj2;

        const result = stringifyJSON(obj1);
        expect(result).toBe('{"name":"obj1","ref":{"name":"obj2","ref":"(circular)"}}');
      });
    });

    describe('complex nested structures', () => {
      it('should handle objects with arrays', () => {
        const obj = {
          numbers: [1, 2, 3],
          strings: ['a', 'b'],
          mixed: [1, 'hello', true]
        };
        const result = stringifyJSON(obj);
        expect(result).toBe('{"numbers":[1,2,3],"strings":["a","b"],"mixed":[1,"hello",true]}');
      });

      it('should handle arrays with objects', () => {
        const arr = [
          { a: 1, b: 'hello' },
          { c: true, d: null }
        ];
        const result = stringifyJSON(arr);
        expect(result).toBe('[{"a":1,"b":"hello"},{"c":true,"d":null}]');
      });

      it('should handle deeply nested structures', () => {
        const obj = {
          level1: {
            level2: {
              level3: {
                data: [1, 2, { nested: 'value' }]
              }
            }
          }
        };
        const result = stringifyJSON(obj);
        expect(result).toBe('{"level1":{"level2":{"level3":{"data":[1,2,{"nested":"value"}]}}}}');
      });
    });

    describe('edge cases', () => {
      it('should handle objects with special string values', () => {
        const obj = {
          empty: '',
          space: ' ',
          quote: '"',
          newline: '\n'
        };
        const result = stringifyJSON(obj);
        // The stringifyJSON function doesn't escape quotes and newlines like JSON.stringify
        expect(result).toContain('"empty":""');
        expect(result).toContain('"space":" "');
        expect(result).toContain('"quote"');
        expect(result).toContain('"newline"');
      });

      it('should handle Date objects', () => {
        const date = new Date('2023-01-01T00:00:00.000Z');
        const obj = { date };
        const result = stringifyJSON(obj);
        expect(result).toContain('"date":{');
      });

      it('should handle objects with numeric keys', () => {
        const obj = { 1: 'one', 2: 'two', abc: 'three' };
        const result = stringifyJSON(obj);
        expect(result).toBe('{"1":"one","2":"two","abc":"three"}');
      });

      it('should return empty string for unknown types', () => {
        const symbol = Symbol('test');
        const result = stringifyJSON(symbol);
        expect(result).toBe('');
      });
    });

    describe('comparison with JSON.stringify', () => {
      it('should handle similar cases as JSON.stringify for simple objects', () => {
        const obj = { a: 1, b: 'hello', c: true, d: null };
        const ourResult = stringifyJSON(obj);
        const nativeResult = JSON.stringify(obj);

        // Remove spaces from native result for comparison
        expect(ourResult).toBe(nativeResult);
      });

      it('should skip functions like JSON.stringify', () => {
        const obj = { a: 1, fn: () => { }, b: 'hello' };
        const ourResult = stringifyJSON(obj);
        const nativeResult = JSON.stringify(obj);

        expect(ourResult).toBe(nativeResult);
      });

      it('should skip undefined like JSON.stringify', () => {
        const obj = { a: 1, b: undefined, c: 'hello' };
        const ourResult = stringifyJSON(obj);
        const nativeResult = JSON.stringify(obj);

        expect(ourResult).toBe(nativeResult);
      });
    });
  });
});
