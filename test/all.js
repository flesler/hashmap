// TODO: Use an actual test framework, this is just a first draft version
// TODO: Make a test version that works on browsers 
// TODO: Test HashMap.has() and HashMap.remove()

var HashMap = require('../hashmap').HashMap;
var test = require('./lib/util.js');

var map = new HashMap();

test.suite('Testing HashMap.type()', function(){
	function assertType(data, expected) {
		test.assert(data, map.type(data), expected);
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
		test.assert(data, map.hash(data), expected);
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
	assertHash(new Date(1986, 7, 15, 12, 5, 0, 0), ':524502300000');
	// Unrecognized Objects
	assertHash([], '{1');
	assertHash({}, '{2');
	assertHash(HashMap, '{3');
	assertHash(new HashMap, '{4');
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
	}

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
	}

	assertSameHash(null, null);
	assertSameHash(undefined, undefined);
	assertSameHash(false, false);
	assertSameHash(NaN, NaN);
	assertSameHash(1, 1);
	assertSameHash("Test", "Test");
	assertSameHash(/test/, /test/);
	assertSameHash(new Date(1986, 7, 15, 12, 5, 0, 0), new Date(1986, 7, 15, 12, 5, 0, 0));
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
	}

	assertDifferentHash(null, undefined);
	assertDifferentHash(null, false);
	assertDifferentHash(false, 0);
	assertDifferentHash(false, '');
	assertDifferentHash(1, "1");
	assertDifferentHash(/test/, /test2/);
	assertDifferentHash(/test/, "/test/");
	assertDifferentHash(new Date(123456789), new Date(987654321));
	assertDifferentHash({}, {});
	assertDifferentHash([], []);
});


test.suite('Testing hashing an object doesn\'t add enumerable keys (no logs for OK)', function(){

	var obj = {};
	var preset = [];

	for (var key in obj) {
		preset.push(key);
		test.warn('Key', key, 'was already enumerable');
	}

	map.hash(obj);

	// Uncomment to generate an error
	//Object.defineProperty(obj, '_hmuid_', {enumerable:true});

	for (key in obj) {
		if (!~preset.indexOf(key)) {
			test.error('Key', key, 'became enumerable after hashing');
		}
	}
});

test.results();
