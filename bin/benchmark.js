#!/usr/bin/env node
'use strict';

var fs = require('fs');
var path = require('path');
var { performance } = require('perf_hooks');
var HashMap = require('../hashmap').HashMap;
var pkg = require('../package.json');

var outputPath = './tmp/benchmark.json';
var args = process.argv.slice(2);

for (var i = 0; i < args.length; i++) {
	if (args[i] === '-o' && args[i + 1]) {
		outputPath = args[++i];
	}
}

var MIN_MS = 250;
var CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function makeid(length) {
	var result = '';
	for (var i = 0; i < length; i++) {
		result += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
	}
	return result;
}

function measure(name, fn, cycle) {
	if (cycle) {
		cycle();
	}

	var start = performance.now();
	var ops = 0;

	while (performance.now() - start < MIN_MS) {
		fn();
		ops++;
		if (cycle) {
			cycle();
		}
	}

	var elapsedMs = performance.now() - start;

	return {
		name: name,
		ops: ops,
		elapsedMs: elapsedMs,
		opsPerSec: ops / (elapsedMs / 1000),
		msPerOp: elapsedMs / ops
	};
}

function buildPrefilled(size) {
	var map = new HashMap();
	for (var i = 0; i < size; i++) {
		map.set(makeid(16), makeid(128));
	}
	return map;
}

function runBenchmarks() {
	var key = makeid(16);
	var value = makeid(128);
	var hashmap = new HashMap();
	var hashmap1024 = buildPrefilled(1024);
	var hashmap131072 = buildPrefilled(131072);
	var objectKey = {};
	var objectValue = makeid(128);
	var results = [];

	results.push(measure('create', function() {
		new HashMap();
	}));

	results.push(measure('singleSet', function() {
		hashmap.set(key, value);
	}, function() {
		key = makeid(16);
		value = makeid(128);
		hashmap.clear();
	}));

	var keys20 = [];
	var values20 = [];
	for (var i = 0; i < 20; i++) {
		keys20.push(makeid(16));
		values20.push(makeid(128));
	}

	results.push(measure('singleSet20', function() {
		for (var k = 0; k < 20; k++) {
			hashmap.set(keys20[k], values20[k]);
		}
	}, function() {
		hashmap.clear();
		keys20 = [];
		values20 = [];
		for (var j = 0; j < 20; j++) {
			keys20.push(makeid(16));
			values20.push(makeid(128));
		}
	}));

	results.push(measure('singleReplace', function() {
		hashmap.set(key, value);
	}, function() {
		key = makeid(16);
		value = makeid(128);
		hashmap.clear();
		hashmap.set(key, makeid(128));
	}));

	results.push(measure('singleGet', function() {
		hashmap.get(key);
	}, function() {
		key = makeid(16);
		value = makeid(128);
		hashmap.clear();
		hashmap.set(key, value);
	}));

	results.push(measure('has', function() {
		hashmap.has(key);
	}, function() {
		key = makeid(16);
		hashmap.clear();
		hashmap.set(key, makeid(128));
	}));

	results.push(measure('delete', function() {
		hashmap.delete(key);
	}, function() {
		key = makeid(16);
		hashmap.clear();
		hashmap.set(key, makeid(128));
	}));

	results.push(measure('search', function() {
		hashmap.search(value);
	}, function() {
		key = makeid(16);
		value = makeid(128);
		hashmap.clear();
		hashmap.set(key, value);
	}));

	results.push(measure('objectKeySet', function() {
		hashmap.set(objectKey, objectValue);
	}, function() {
		objectKey = {};
		objectValue = makeid(128);
		hashmap.clear();
	}));

	results.push(measure('setAfter1024', function() {
		hashmap1024.set(key, value);
	}, function() {
		hashmap1024.delete(key);
		key = makeid(16);
		value = makeid(128);
	}));

	var keys20b = [];
	var values20b = [];
	for (var n = 0; n < 20; n++) {
		keys20b.push(makeid(16));
		values20b.push(makeid(128));
	}

	results.push(measure('set20After1024', function() {
		for (var m = 0; m < 20; m++) {
			hashmap1024.set(keys20b[m], values20b[m]);
		}
	}, function() {
		if (keys20b.length) {
			for (var p = 0; p < 20; p++) {
				hashmap1024.delete(keys20b[p]);
			}
		}
		keys20b = [];
		values20b = [];
		for (var q = 0; q < 20; q++) {
			keys20b.push(makeid(16));
			values20b.push(makeid(128));
		}
	}));

	results.push(measure('getAfter1024', function() {
		hashmap1024.get(key);
	}, function() {
		hashmap1024.delete(key);
		key = makeid(16);
		value = makeid(128);
		hashmap1024.set(key, value);
	}));

	results.push(measure('forEach1024', function() {
		hashmap1024.forEach(function() {});
	}));

	results.push(measure('keys1024', function() {
		hashmap1024.keys();
	}));

	results.push(measure('values1024', function() {
		hashmap1024.values();
	}));

	results.push(measure('entries1024', function() {
		hashmap1024.entries();
	}));

	results.push(measure('clone1024', function() {
		hashmap1024.clone();
	}));

	results.push(measure('copy1024', function() {
		var target = new HashMap();
		target.copy(hashmap1024);
	}));

	results.push(measure('clear1024', function() {
		hashmap1024.clear();
		hashmap1024 = buildPrefilled(1024);
	}));

	results.push(measure('setAfter131072', function() {
		hashmap131072.set(key, value);
	}, function() {
		hashmap131072.delete(key);
		key = makeid(16);
		value = makeid(128);
	}));

	var keys20c = [];
	var values20c = [];
	for (var r = 0; r < 20; r++) {
		keys20c.push(makeid(16));
		values20c.push(makeid(128));
	}

	results.push(measure('set20After131072', function() {
		for (var s = 0; s < 20; s++) {
			hashmap131072.set(keys20c[s], values20c[s]);
		}
	}, function() {
		if (keys20c.length) {
			for (var t = 0; t < 20; t++) {
				hashmap131072.delete(keys20c[t]);
			}
		}
		keys20c = [];
		values20c = [];
		for (var u = 0; u < 20; u++) {
			keys20c.push(makeid(16));
			values20c.push(makeid(128));
		}
	}));

	return results;
}

var benchmarks = runBenchmarks();
var report = {
	version: pkg.version,
	node: process.version,
	timestamp: new Date().toISOString(),
	minMs: MIN_MS,
	benchmarks: {}
};

benchmarks.forEach(function(result) {
	report.benchmarks[result.name] = {
		ops: result.ops,
		elapsedMs: result.elapsedMs,
		opsPerSec: result.opsPerSec,
		msPerOp: result.msPerOp
	};
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n');

console.log('Wrote benchmark report to ' + outputPath);
Object.keys(report.benchmarks).forEach(function(name) {
	var bench = report.benchmarks[name];
	console.log(name + ': ' + bench.opsPerSec.toFixed(0) + ' ops/sec');
});
