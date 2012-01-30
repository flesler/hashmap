# HashMap Class for JavaScript

## Description

This script provides `HashMap` class that works both on NodeJS and the browser.
HashMap instances __store key/value pairs__ allowing __keys of any type__.

Unlike regular objects, keys __won't not be stringified__. Numbers and strings won't be mixed, you can pass `Date`'s, `RegExp`'s, DOM Elements, anything! (even `null` and `undefined`)

If you want to understand better how it works and how are different keys treated, check the (precarious) [tests](https://github.com/flesler/hashmap/blob/master/test/all.js).

## TODO's

* Use a real test framework
* Make tests work on the browser
* Allow extending the hashing function in a AOP way or by passing a service
* Decide whether arrays with the same elements are considered the same (currently not).
* Fix: The hashmap will expose an enumerable expando when `Object.defineProperty` doesn't exist maybe use a different hashing approach for this case like `Array.indexOf`