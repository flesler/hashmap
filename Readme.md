# HashMap Class for JavaScript

## Description

This project provides a `HashMap` class that works both on __NodeJS__ and the __browser__.
HashMap instances __store key/value pairs__ allowing __keys of any type__.

Unlike regular objects, __keys won't not be stringified__. For example numbers and strings won't be mixed, you can pass `Date`'s, `RegExp`'s, DOM Elements, anything! (even `null` and `undefined`)

## Examples

Assume this for all examples below

	var map = new HashMap();

If you're using this within Node, you first need to import the class

	var HashMap = require('hashmap').HashMap;
 
### Basic use case

	map.set("some_key", "some value");
	map.get("some_key"); // --> "some value"
 
### No stringification

	map.set("1", "string one");
	map.set(1, "number one");
	map.get("1"); // --> "string one"

A regular `Object` used as a map would yield `"number one"`

###  Objects as keys

	var key = {};
	var key2 = {};
	map.set(key, 123);
	map.set(key2, 321);
	map.get(key); // --> 123

A regular `Object` used as a map would yield `321`

###  Iterating

    map.set(1, "test 1");
    map.set(2, "test 2");
    map.set(3, "test 3");
    
    map.forEach(function(value, key) {
        console.log(key + " : " + value);
    });

[Check the tests](https://github.com/flesler/hashmap/blob/master/test/all.js) for some more real code.

## TODO's

This project is in early development, so any feedback/changes are specially appreciated.

* (?) Allow extending the hashing function in a AOP way or by passing a service
* Fix: The hashmap will expose an enumerable expando when `Object.defineProperty` doesn't exist maybe use a different hashing approach for this case like `Array.indexOf`
* Use a real test framework
* Make tests work on the browser
* Document the public API of HashMap's