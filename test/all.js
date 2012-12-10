// TODO: Use an actual test framework, this is just a first draft version
// TODO: Make a test version that works on browsers

var HashMap = require('../hashmap').HashMap;
var test = require('./lib/util.js');
var proto = HashMap.prototype;

test.suite('Testing HashMap.type()', function(){
	function assertType(data, expected) {
		test.assert(data, proto.type(data), expected);
	}

	assertType(null, 'null');
	assertType(undefined, 'undefined');
	assertType(true, 'boolean');
	assertType(false, 'boolean');
	assertType(NaN, 'number');
	assertType(1, 'number');
	assertType(1.1, 'number');
	assertType("1.1", 'string');
	assertType("Test", 'string');
	assertType(/test/, 'regexp');
	assertType(new Date, 'date');
	assertType([], 'array');
	assertType({}, 'object');
	assertType(HashMap, 'function');
	assertType(new HashMap, 'object');
});

test.suite('Testing HashMap.hash()', function(){
	function assertHash(data, expected) {
		test.assert(data, proto.hash(data), expected);
	}

	// Primitives
	assertHash(null, 'null');
	assertHash(undefined, 'undefined');
	assertHash(true, 'true');
	assertHash(false, 'false');
	assertHash(NaN, 'NaN');
	assertHash(1, '1');
	assertHash(1.1, '1.1');
	assertHash("1.1", '"1.1');
	assertHash("Test", '"Test');
	// Recognized Objects
	assertHash(/test/, '/test/');
	assertHash(new Date(Date.parse("Fri, 15 Aug 1986 15:05:00 GMT")), ':524502300000');
	// Arrays
	assertHash([], '[');
	assertHash([1, 2, 3], '[1|2|3');

	// Unrecognized Objects
	assertHash({}, '{1');
	assertHash(HashMap, '{2');
	assertHash(new HashMap, '{3');
});

test.suite('Testing HashMap.has()', function(){
    var map = new HashMap();
    map.set('key1', 'value1');
    test.assert("key1 exists", map.has('key1'), true);
    test.assert("key2 does not exist", map.has('key2'), false);
});

test.suite('Testing HashMap.remove()', function(){
    var map = new HashMap();
    map.set('key1', 'value1');
    test.assert("key1 exists", map.has('key1'), true);
    map.remove('key1');
    test.assert("key1 no longer exists", map.has('key1'), false);
});

test.suite('Testing same key remains mapped to same hash', function(){
	function assertKey(data) {
		var someValue = test.uid();
		map.set(data, someValue);

		if (map.get(data) === someValue) {
			test.ok(data, 'was reused as key successfully');
		} else {
			test.error(data, 'cannot be reused as key');
		}
	};

	var map = new HashMap();

	assertKey(null);
	assertKey(undefined);
	assertKey(false);
	assertKey(NaN);
	assertKey(1);
	assertKey("Test");
	assertKey(/test/);
	assertKey(new Date(1986, 7, 15, 12, 5, 0, 0));
	assertKey([]);
	assertKey({});
	assertKey(HashMap);
	assertKey(new HashMap);
});

test.suite('Testing pair of keys are mapped to the same hash', function(){
	function assertSameHash(data, data2) {
		var someValue = test.uid();
		map.set(data, someValue);

		if (map.get(data2) === someValue) {
			test.ok(data, 'and', data2, 'got mapped to the same value');
		} else {
			test.error(data, 'and', data2, 'were not mapped to the same key');
		}
	};

	var map = new HashMap();

	assertSameHash(null, null);
	assertSameHash(undefined, undefined);
	assertSameHash(false, false);
	assertSameHash(NaN, NaN);
	assertSameHash(1, 1);
	assertSameHash("Test", "Test");
	assertSameHash(/test/, /test/);
	assertSameHash(new Date(1986, 7, 15, 12, 5, 0, 0), new Date(1986, 7, 15, 12, 5, 0, 0));
	assertSameHash([], []);
	assertSameHash([1, 2, 'Q'], [1, 2, 'Q']);
	assertSameHash([null, /a/, NaN], [null, /a/, NaN]);
});

test.suite('Testing pair of keys are not mapped to the same hash', function(){
	function assertDifferentHash(data, data2) {
		var someValue = test.uid();

		map.set(data, someValue);

		if (map.get(data2) !== someValue) {
			test.ok(data, 'and', data2, 'were not mapped to the same value');
		} else {
			test.error(data, 'and', data2, 'got mapped to the same key');
		}
	};

	var map = new HashMap();

	assertDifferentHash(null, undefined);
	assertDifferentHash(null, false);
	assertDifferentHash(false, 0);
	assertDifferentHash(false, '');
	assertDifferentHash(1, "1");
	assertDifferentHash(/test/, /test2/);
	assertDifferentHash(/test/, "/test/");
	assertDifferentHash(new Date(123456789), new Date(987654321));
	assertDifferentHash({}, {});
});

test.suite('Testing hashing an object doesn\'t add enumerable keys (no logs for OK)', function(){
	var obj = {};
	var preset = [];

	for (var key in obj) {
		preset.push(key);
		test.warn('Key', key, 'was already enumerable');
	}

	proto.hash(obj);

	// Uncomment to generate an error
	//Object.defineProperty(obj, '_hmuid_', {enumerable:true});

	for (key in obj) {
		if (!~preset.indexOf(key)) {
			test.error('Key', key, 'became enumerable after hashing');
		}
	}
});

test.suite('Testing HashMap.count() method', function(){
	var map = new HashMap();
	
	test.assert("0 entries", map.count(), 0);
	
	map.set(1, "test");
	test.assert("1 entry", map.count(), 1);
	
	map.set("1", "test");
	test.assert("2 entries", map.count(), 2);
	
	map.set("1", "another_value");
	test.assert("same entries after update", map.count(), 2);

	map.remove(1);
	test.assert("1 entry after remove()", map.count(), 1);

	map.remove("1");
	test.assert("0 entries after remove()", map.count(), 0);
});

test.suite('Testing HashMap.clear() method', function(){
	var map = new HashMap();

	map.clear();
	test.assert("0 entries after empty clear()", map.count(), 0);

	test.assert("0 entries", map.count(), 0);
	
	map.set(1, "test");
	map.set(2, "test2");
	test.assert("2 entries", map.count(), 2);
	
	map.clear();
	test.assert("0 entries after clear()", map.count(), 0);
});

test.suite('Testing HashMap.forEach()', function(){
    var map = new HashMap();
    var keys = [];
    var values = [];
    
    map.set(1, "1");
    map.set(2, "2");
    map.set(3, "3");
    
    map.forEach(function(value, key) {
        keys.push(key);
        values.push(value);

        test.assert("Correct pair", key.toString(), value);
    });
    
    test.assert("Correct keys", keys.length, 3);
    test.assert("Correct values", values.length, 3);
});

test.results();
