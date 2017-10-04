/*jshint -W030,-W121 */
var expect = require('chai').expect,
	HashMap = require('../hashmap').HashMap,
	hashmap;

describe('hashmap', function() {
	beforeEach(function() {
		hashmap = new HashMap();
	});

	describe('hashmap.type()', function() {
		function check(data, type) {
			expect(hashmap.type(data)).to.equal(type);
		}
		it('should detect types accurately', function() {
			check(null, 'null');
			check(undefined, 'undefined');
			check(true, 'boolean');
			check(false, 'boolean');
			check(NaN, 'number');
			check(1, 'number');
			check(1.1, 'number');
			check('1.1', 'string');
			check('Test', 'string');
			check(/test/, 'regexp');
			check(new Date(), 'date');
			check([], 'array');
			check({}, 'object');
			check(HashMap, 'function');
			check(hashmap, 'object');
		});

		it('should cast type for browsers that don\'t conform to ECMA 5 spec', function() {
			var originalToString = Object.prototype.toString;
			var type = 'DOMWindow';

			Object.prototype.toString = function() {
				return '[object ' + type + ']';
			};

			check(null, 'null');
			check(undefined, 'undefined');

			type = "Window";
			check(null, 'null');
			check(undefined, 'undefined');

			Object.prototype.toString = originalToString;
		});
	});

	describe('hashmap.hash()', function() {
		function check(data, hash) {
			expect(hashmap.hash(data)).to.equal(hash);
		}

		it('should hash primitives accurately', function() {
			check(null, 'null');
			check(undefined, 'undefined');
			check(true, 'true');
			check(false, 'false');
			check(NaN, 'NaN');
			check(1, '1');
			check(1.1, '1.1');
			check('1.1', '♠1.1');
			check('Test', '♠Test');
		});

		it('should hash objects with primitive representation accurately', function() {
			check(/test/, '/test/');
			check(new Date(Date.parse('Fri, 15 Aug 1986 15:05:00 GMT')), '♣524502300000');
		});

		it('should hash arrays accurately', function() {
			check([], '♥');
			check([1, 2, 3], '♥1⁞2⁞3');
		});

		it('should hash unrecognized objects accurately', function() {
			check({}, '♦1');
			check(HashMap, '♦2');
			check(hashmap, '♦3');
		});

		it('should not add any iterable property to objects', function() {
			var obj = {};
			hashmap.hash(obj);
			expect(obj).to.be.empty;
		});

		// TODO: expect two hashmaps to hash the same object to the same value
		// TODO: test hash(1) !== hash('1')
	});

	describe('method chaining', function() {
		it('should return the instance on some methods', function() {
			expect(hashmap.set('key', 'value')).to.equal(hashmap);
			expect(hashmap.multi()).to.equal(hashmap);
			expect(hashmap.delete('key')).to.equal(hashmap);
			expect(hashmap.remove('key')).to.equal(hashmap);
			expect(hashmap.copy(hashmap)).to.equal(hashmap);
			expect(hashmap.clear()).to.equal(hashmap);
			expect(hashmap.forEach(function(){})).to.equal(hashmap);
		});
	});

	describe('hashmap.has()', function() {
		it('should return false when it does not have an entry with a key', function() {
			expect(hashmap.has('key')).to.be.false;
		});

		it('should return true when it has an entry with a key', function() {
			hashmap.set('key', 'value');
			expect(hashmap.has('key')).to.be.true;
		});

		// TODO: Check other types?
	});

	describe('hashmap.search()', function() {
		it('should return null when it does not have an entry with a value', function() {
			expect(hashmap.search('value')).to.be.null;
		});

		it('should return key under which a value is stored', function() {
			hashmap.set('key', 'value');
			expect(hashmap.search('value')).to.equal('key');
		});
	});

	describe('hashmap.delete()', function() {
		it('should delete an entry by key', function() {
			hashmap.set('key', 'value1');
			hashmap.delete('key');
			expect(hashmap.has('key')).to.be.false;
		});

		it('should not fail when the key is not found', function() {
			hashmap.delete('key');
			expect(hashmap.has('key')).to.be.false;
		});
	});

	describe('hashmap.remove()', function() {
		it('should be the same function as delete', function() {
			expect(hashmap.remove).to.equal(hashmap.delete);
		});
	});

	describe('hashmap.get()', function() {
		var uid = 1;
		function val() { return 'value'+uid++; }

		it('should map the same key consistenly to the same hash', function() {
			function check(key) {
				var value = val();
				hashmap.set(key, value);
				expect(hashmap.get(key)).to.equal(value);
			}

			check(null);
			check(undefined);
			check(false);
			check(NaN);
			check(1);
			check('Test');
			check(/test/);
			check(new Date(1986, 7, 15, 12, 5, 0, 0));
			check([]);
			check({});
			check(HashMap);
			check(hashmap);
		});

		it('should map these pair of keys to the same hash', function() {
			function check(key, key2) {
				var value = val();
				hashmap.set(key, value);
				expect(hashmap.get(key2)).to.equal(value);
			}

			check(null, null);
			check(undefined, undefined);
			check(false, false);
			check(NaN, NaN);
			check(1, 1);
			check('Test', 'Test');
			check(/test/, /test/);
			check(new Date(1986, 7, 15, 12, 5, 0, 0), new Date(1986, 7, 15, 12, 5, 0, 0));
			check([], []);
			check([1, 2, 'Q'], [1, 2, 'Q']);
			check([null, /a/, NaN], [null, /a/, NaN]);
		});

		it('should NOT map these pair of keys to the same hash', function() {
			function check(key, key2) {
				var value = val();
				hashmap.set(key, value);
				expect(hashmap.get(key2)).not.to.equal(value);
			}

			check(null, undefined);
			check(null, false);
			check(false, 0);
			check(false, '');
			check(1, '1');
			check(/test/, /test2/);
			check(/test/, '/test/');
			check(new Date(123456789), new Date(987654321));
			check({}, {});
			check(hashmap, Object.create(hashmap));
		});
	});

	describe('hashmap.forEach()', function() {
		function collect() {
			var pairs = [];
			hashmap.forEach(function(value, key) {
				pairs.push({key:key, value:value});
			});
			return pairs;
		}

		it('should pass the basic test', function() {
			hashmap.set('key', 'value');
			var called = 0;
			hashmap.forEach(function(value, key) {
				called++;
				expect(value).to.equal('value');
				expect(key).to.equal('key');
				expect(this).to.equal(hashmap);
			});
			expect(called).to.equal(1);
		});

		it('should call the callback once per key', function() {
			hashmap.set('key', 'value');
			hashmap.set('key2', 'value2');
			hashmap.set('key2', 'value2a');
			expect(collect().length).to.equal(2);
		});

		it('should not call the callback on delete keys', function() {
			hashmap.set('key', 'value');
			hashmap.delete('key');
			expect(collect()).to.be.empty;
		});

		it('should remain consistent among calls', function() {
			hashmap.set('key', 'value');
			hashmap.set('key2', 'value2');
			expect(collect()).to.deep.equal(collect());
		});

		it('should respect forEach context', function() {
			hashmap.set('key', 'value');
			var ctx = {};
			hashmap.forEach(function(value, key) {
				expect(this).to.equal(ctx);
			}, ctx);
		});
	});

	describe('hashmap.keys()', function() {
		it('should return an empty array for an empty hashmap', function() {
			expect(hashmap.keys()).to.be.empty;
		});

		it('should return an array with one key once added', function() {
			hashmap.set('key', 'value');
			expect(hashmap.keys()).to.deep.equal(['key']);
		});

		it('should work for several keys', function() {
			hashmap.set('key', 'value');
			hashmap.set('key2', 'value2');
			expect(hashmap.keys()).to.deep.equal(['key', 'key2']);
		});
	});

	describe('hashmap.values()', function() {
		it('should return an empty array for an empty hashmap', function() {
			expect(hashmap.values()).to.be.empty;
		});

		it('should return an array with one value once added', function() {
			hashmap.set('key', 'value');
			expect(hashmap.values()).to.deep.equal(['value']);
		});

		it('should work for several values', function() {
			hashmap.set('key', 'value');
			hashmap.set('key2', 'value2');
			expect(hashmap.values()).to.deep.equal(['value', 'value2']);
		});
	});

	describe('hashmap.entries()', function() {
		it('should return an empty array for an empty hashmap', function() {
			expect(hashmap.entries()).to.be.empty;
		});

		it('should return an array with one value once added', function() {
			hashmap.set('key', 'value');
			expect(hashmap.entries()).to.deep.equal([['key','value']]);
		});

		it('should work for several values', function() {
			hashmap.set('key', 'value');
			hashmap.set('key2', 'value2');
			expect(hashmap.entries()).to.deep.equal([['key','value'], ['key2','value2']]);
		});
	});

	describe('ES6 Iterators', function() {
		it('should do nothing on an empty hashmap', function() {
			var called = false;
			for (var pair of hashmap) { // jshint ignore:line
				// (`pair` is not used)
				called = true;
			}
			expect(called).to.be.false;
		});

		it('should iterate over all entries exactly once', function() {
			// Since order of iteration is not guaranteed, we'll keep track of which key-value pair has been checked, and how many times.
			var numberOfTries = 10;
			var calls = new Array(numberOfTries).fill(0);
			// Populate hashmap with ['keyI': I] pairs
			for (var i = 0; i < numberOfTries; i++) {
				hashmap.set('key' + i, i);
			}
			// Perform ES6 iteration
			for (var pair of hashmap) {
				expect(pair.key).to.equal('key' + pair.value);
				calls[pair.value]++;
			}
			expect(calls).to.deep.equal(new Array(numberOfTries).fill(1));
		});
	});

	describe('hashmap.count() and hashmap.size', function() {
		// NOTE: count() is expected to return .size, this
		// will be checked only in this unit test!
		it('should return 0 when nothing was added', function() {
			expect(hashmap.count()).to.equal(0);
			expect(hashmap.size).to.equal(0);
		});

		it('should return 1 once an entry was added', function() {
			hashmap.set('key', 'value');
			expect(hashmap.count()).to.equal(1);
			expect(hashmap.size).to.equal(1);
		});

		it('should not increase when setting an existing key', function() {
			hashmap.set('key', 'value');
			hashmap.set('key', 'value2');
			expect(hashmap.count()).to.equal(1);
			expect(hashmap.size).to.equal(1);
		});

		it('should increase when setting different key', function() {
			hashmap.set('key', 'value');
			hashmap.set('key2', 'value2');
			expect(hashmap.count()).to.equal(2);
			expect(hashmap.size).to.equal(2);
		});

		it('should decrease when deleting a key', function() {
			hashmap.set('key', 'value');
			hashmap.set('key2', 'value');
			hashmap.delete('key');
			expect(hashmap.count()).to.equal(1);
			expect(hashmap.size).to.equal(1);

			hashmap.delete('key2');
			expect(hashmap.count()).to.equal(0);
			expect(hashmap.size).to.equal(0);
		});
	});

	describe('hashmap.clear()', function() {
		it('should do nothing when empty', function() {
			hashmap.clear();
			expect(hashmap.count()).to.equal(0);
		});

		it('should delete the only entry', function() {
			hashmap.set('key', 'value');
			hashmap.clear();
			expect(hashmap.count()).to.equal(0);
		});

		it('should delete multiple entries', function() {
			hashmap.set('key', 'value');
			hashmap.set('key2', 'value2');
			hashmap.clear();
			expect(hashmap.count()).to.equal(0);
		});
	});

	describe('hashmap.copy()', function() {
		it('should work on an empty hashmap', function() {
			var map = new HashMap();
			map.copy(hashmap);
			expect(map.count()).to.equal(0);
		});

		it('should copy all values', function() {
			hashmap.set('key', 'value');
			hashmap.set('key2', 'value2');

			var map = new HashMap();
			map.copy(hashmap);

			expect(map.count()).to.equal(2);
			expect(map.get('key')).to.equal('value');
			expect(map.get('key2')).to.equal('value2');
		});
	});

	describe('hashmap.clone()', function() {
		it('should return a new hashmap', function() {
			var clone = hashmap.clone();
			expect(clone).to.be.instanceOf(HashMap);
			expect(clone).not.to.equal(hashmap);
		});

		it('should work on an empty hashmap', function() {
			var clone = hashmap.clone();
			expect(clone.count()).to.equal(0);
		});

		it('should retain all values', function() {
			hashmap.set('key', 'value');
			hashmap.set('key2', 'value2');
			var clone = hashmap.clone();
			expect(clone.count()).to.equal(2);
			expect(clone.get('key')).to.equal('value');
			expect(clone.get('key2')).to.equal('value2');
			expect(hashmap.count()).to.equal(2);
			expect(hashmap.get('key')).to.equal('value');
			expect(hashmap.get('key2')).to.equal('value2');
		});
	});

	describe('hashmap.multi()', function() {
		it('should do nothing with no arguments', function() {
			hashmap.multi();
			expect(hashmap.count()).to.equal(0);
		});

		it('should work with one pair', function() {
			hashmap.multi('key', 'value');
			expect(hashmap.count()).to.equal(1);
			expect(hashmap.get('key')).to.equal('value');
		});

		it('should work with several pairs', function() {
			hashmap.multi(
				'key', 'value',
				'key2', 'value2'
			);
			expect(hashmap.count()).to.equal(2);
			expect(hashmap.get('key')).to.equal('value');
			expect(hashmap.get('key2')).to.equal('value2');
		});
	});

	describe('constructor', function() {
		it('should create an empty hashmap when no arguments', function() {
			expect(hashmap.count()).to.equal(0);
		});

		it('should clone a hashmap when one argument', function() {
			hashmap.set('key', 'value');
			hashmap.set('key2', 'value2');

			var map = new HashMap(hashmap);
			expect(map.count()).to.equal(2);
			expect(map.get('key')).to.equal('value');
			expect(map.get('key2')).to.equal('value2');
		});

		it('should initialize from a 2D array for a single Array argument', function() {
			var map = new HashMap(
				[['key', 'value'],
				 ['key2', 'value2']]
			);
			expect(map.count()).to.equal(2);
			expect(map.get('key')).to.equal('value');
			expect(map.get('key2')).to.equal('value2');
		});

		it('should initialize from a 2D array for a nested Array argument', function() {
			var map = new HashMap(
				[[[1, 'key'], ['value', 1]],
				 [[2, 'key2'], ['value2', 2]]]
			);
			expect(map.count()).to.equal(2);
			expect(map.get([1, 'key'])).to.deep.equal(['value', 1]);
			expect(map.get([2, 'key2'])).to.deep.equal(['value2', 2]);
		});

		it('should initialize with pairs when several arguments', function() {
			var map = new HashMap(
				'key', 'value',
				'key2', 'value2'
			);
			expect(map.count()).to.equal(2);
			expect(map.get('key')).to.equal('value');
			expect(map.get('key2')).to.equal('value2');
		});
	});
});
