# HashMap Class for JavaScript

## Description

This scripts provides you with a HashMap class that works both on NodeJS and the browser.
The HashMap accepts any type of key and won't stringify it.

Numbers and strings won't be mixed. You can pass Date objects, RegExps, DOM Elements, anything!

## TODO's

* Use a real test framework
* Make tests work on the browser
* Allow extending the hashing function in a AOP way or by passing a service
* Fix: The hashmap will expose an enumerable expando when `Object.defineProperty` doesn't exist maybe use a different hashing approach for this case like `Array.indexOf`