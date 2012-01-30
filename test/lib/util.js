exports.stringify = function(data) {
	var strData = JSON.stringify(data) || data+'';
	strData = strData.replace(/[\r\n\t]+/g, '');
	if (strData.length > 50) {
		return strData.slice(0, 47) + '...';
	}
	return strData;
};

exports.assert = function(data, result, expected) {
	if (result === expected) {
		exports.ok(data, '-->', expected);
	} else {
		exports.error(data, 'expected to be "'+expected+'" but found "'+result+'"');
	}
};

function dump(key, args) {
	args = Array.prototype.slice.call(args);
	for (var i = 0; i < args.length; i++) {
		if (typeof args[i] !== 'string') {
			args[i] = exports.stringify(args[i]);
		}
	}

	args.unshift(key+':');
	console.log.apply(console, args);
};

var ok = 0;
var errors = 0;
var suites = 0;

exports.suite = function(title, fn) {
	suites++;
	console.log('\n>>>', title, '\n');
	fn();
};

exports.ok = function() {
	ok++;
	dump('OK', arguments);
};

exports.error = function() {
	errors++;
	dump('ERROR', arguments);
};

exports.warn = function() {
	dump('WARN', arguments);
};

exports.results = function() {
	console.log('\nResults:\n')

	var data = {Tests:ok + errors, Ok:ok, Errors:errors, Status: errors ? 'FAIL!' : 'OK!'};
	for (var key in data) {
		console.log('\t' + key + ':', data[key]);
	}

	console.log();
};

var uid = 0;

exports.uid = function() {
	return ++uid;	
};