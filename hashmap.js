/**
 * HashMap - HashMap Class for JavaScript
 * @author Ariel Flesler <aflesler@gmail.com>
 * @version 2.4.0
 * Homepage: https://github.com/flesler/hashmap
 */

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object') {
        // Node js environment
        var HashMap = module.exports = factory();
        // Keep it backwards compatible
        HashMap.HashMap = HashMap;
    } else {
        // Browser globals (this is window)
        this.HashMap = factory();
    }
}(function () {


    function HashMap(other) {
        this.clear();
        switch (arguments.length) {
            case 0:
                break;
            case 1: {
                if ('length' in other) {
                    // Flatten 2D array to alternating key-value array
                    multi(this, Array.prototype.concat.apply([], other));
                } else { // Assumed to be a HashMap instance
                    this.copy(other);
                }
                break;
            }
            default:
                multi(this, arguments);
                break;
        }
    }

    function HashBucket(safeKey, key, value) {
        this._safeKey = safeKey;
        this._key = key;
        this._value = value;
        this._next = null;
        this._size = 1;
    }

    HashBucket.prototype = {
        constructor: HashBucket,
        get: function (hash, key) {
            var bucket = this;
            // avoid recursion
            do {
                if (bucket._safeKey === key) {
                    return bucket._value;
                }
                bucket = bucket._next;
            }
            while (bucket != null);
            return null;
        },
        set: function (hash, safeKey, key, value) {
            var bucket = this;
            // avoid recursion
            while (true) {
                if (bucket._safeKey === safeKey) {
                    bucket._value = value;
                    return false;
                }
                if (bucket._next) {
                    bucket = bucket._next;
                } else {
                    bucket._next = new HashBucket(safeKey, key, value);
                    this._size++;
                    return true;
                }
            }
        },

        has: function (hash, key) {
            var bucket = this;
            // avoid recursion
            do {
                if (bucket._safeKey === key) {
                    return true;
                }
                bucket = bucket._next;
            }
            while (bucket != null);
            return false;
        },

        search: function (value) {
            var bucket = this;
            // avoid recursion
            do {
                if (bucket._value === value) {
                    return bucket._key;
                }
                bucket = bucket._next;
            }
            while (bucket != null);
            return null;
        },

        delete: function (hash, key) {
            var bucket = this;
            var prev = null;
            // avoid recursion
            do {
                if (bucket._safeKey === key) {
                    var next = bucket._next;
                    if (bucket._next) {
                        bucket._key = next._key;
                        bucket._safeKey = next._safeKey;
                        bucket._value = next._value;
                        bucket._next = next._next;
                    } else if (prev) {
                        delete prev._next;
                    }
                    this._size--;
                    return true;
                }
                prev = bucket;
                bucket = bucket._next;
            }
            while (bucket != null);
            return false;
        },

        forEach: function (func, ctx) {
            var bucket = this;
            // avoid recursion
            do {
                func.call(ctx, bucket._value, bucket._key);
                bucket = bucket._next;
            }
            while (bucket != null);
        }
    };

    function HashBuckets(options, depth) {
        this._options = options;
        this._buckets = new Array(this._options.width);
        this._size = 0;
        switch (arguments.length) {
            case 0:
                this._depth = 0;
                break;
            case 1:
                this._depth = options.depth;
                break;
            case 2:
            default:
                this._depth = depth;
                break;
        }
    }

    HashBuckets.prototype = {
        constructor: HashBuckets,
        get: function (hash, key) {
            var bucket = this._buckets[hash & this._options.mask];
            if (bucket) {
                return bucket.get(hash >>> this._options.widthB, key);
            }
            return null;
        },
        set: function (hash, safeKey, key, value) {
            var idx = hash & this._options.mask;
            var bucket = this._buckets[idx];
            if (bucket) {
                return bucket.set(hash >>> this._options.widthB, safeKey, key, value);
            } else {
                if (this._depth > 0) {
                    bucket = new HashBuckets(this._options, this._depth - 1);
                    bucket.set(hash >>> this._options.widthB, safeKey, key, value);
                    this._buckets[idx] = bucket;
                } else {
                    this._buckets[idx] = new HashBucket(safeKey, key, value);
                }
                this._size++;
                return true;
            }
        },

        has: function (hash, key) {
            var bucket = this._buckets[hash & this._options.mask];
            if (bucket) {
                return bucket.has(hash >>> this._options.widthB, key);
            }
            return false;
        },
        search: function (value) {
            for (var idx in this._buckets) {
                var data = this._buckets[idx];
                var key = data.search(value);
                if (key) {
                    return key;
                }
            }
            return null;
        },

        delete: function (hash, key) {
            var idx = hash & this._options.mask;
            var bucket = this._buckets[idx];
            if (bucket) {
                if (bucket.delete(hash >>> this._options.widthB, key)) {
                    if (bucket._size === 0) {
                        delete this._buckets[idx];
                        this._size--;
                    }
                    return true;
                }
            }
            return false;
        },

        forEach: function (func, ctx) {
            for (var idx in this._buckets) {
                var data = this._buckets[idx];
                data.forEach(func, ctx);
            }
        }
    };


    var proto = HashMap.prototype = {
        constructor: HashMap,

        get: function (key) {
            var safeKey = this.safeKey(key);
            var hash = hashCode(safeKey);
            return this._buckets.get(hash, safeKey);
        },

        set: function (key, value) {
            var safeKey = this.safeKey(key);
            var hash = hashCode(safeKey);
            // Store original key as well (for iteration)
            if (this._buckets.set(hash, safeKey, key, value)) {
                this.size++;
            }
        },

        multi: function () {
            multi(this, arguments);
        },

        copy: function (other) {
            var map = this;
            other.forEach(function (value, key) {
                map.set(key, value);
            });
        },

        has: function (key) {
            var safeKey = this.safeKey(key);
            var hash = hashCode(safeKey);
            return this._buckets.has(hash, safeKey);
        },

        search: function (value) {
            return this._buckets.search(value);
        },

        delete: function (key) {
            var safeKey = this.safeKey(key);
            var hash = hashCode(safeKey);
            if (this._buckets.delete(hash, safeKey)) {
                this.size--;
            }
        },

        type: function (key) {
            var str = Object.prototype.toString.call(key);
            var type = str.slice(8, -1).toLowerCase();
            // Some browsers yield DOMWindow or Window for null and undefined, works fine on Node
            if (!key && (type === 'domwindow' || type === 'window')) {
                return key + '';
            }
            return type;
        },

        keys: function () {
            var keys = [];
            this.forEach(function (_, key) {
                keys.push(key);
            });
            return keys;
        },

        values: function () {
            var values = [];
            this.forEach(function (value) {
                values.push(value);
            });
            return values;
        },

        entries: function () {
            var entries = [];
            this.forEach(function (value, key) {
                entries.push([key, value]);
            });
            return entries;
        },

        // TODO: This is deprecated and will be deleted in a future version
        count: function () {
            return this.size;
        },
        // how many layers of hashmap do we want, and to the power of 2 how many buckets do we want.
        setOptions: function (_depth, _widthB) {

            var widthB;
            var depth;
            switch (arguments.length) {
                case 0:
                    widthB = 4; // 16 buckets
                    depth = 4;
                    break;
                case 1:
                    widthB = 4;
                    depth = _depth;
                    break;
                default:
                    widthB = _widthB;
                    depth = _depth;
                    break;
            }
            var width = 1 << widthB; // 2 ^ widthB
            var mask = width - 1;
            this.options = {widthB, width, mask, depth};
        },

        clear: function () {
            if (!this.options) {
                this.setOptions();
            }
            // we clone the options as its dangerous to modify mid execution.
            this._buckets = new HashBuckets({
                widthB: this.options.widthB,
                width: this.options.width,
                mask: this.options.mask,
                depth: this.options.depth
            });
            this.size = 0;
        },

        clone: function () {
            return new HashMap(this);
        },
        hash: function (key) {
            return hashCode(this.safeKey(key));
        },
        safeKey: function (key) {
            switch (this.type(key)) {
                case 'undefined':
                case 'null':
                case 'boolean':
                case 'number':
                case 'regexp':
                    return key + '';

                case 'date':
                    return '♣' + key.getTime();

                case 'string':
                    return '♠' + key;

                case 'array':
                    var hashes = [];
                    for (var i = 0; i < key.length; i++) {
                        hashes[i] = this.hash(key[i]);
                    }
                    return '♥' + hashes.join('⁞');

                default:
                    // TODO: Don't use expandos when Object.defineProperty is not available?
                    if (!key.hasOwnProperty('_hmuid_')) {
                        key._hmuid_ = ++HashMap.uid;
                        hide(key, '_hmuid_');
                    }

                    return '♦' + key._hmuid_;
            }
        },

        forEach: function (func, ctx) {
            this._buckets.forEach(func, ctx || this);
        }
    };

    HashMap.uid = 0;

    // Iterator protocol for ES6
    if (typeof Symbol !== 'undefined' && typeof Symbol.iterator !== 'undefined') {
        proto[Symbol.iterator] = function () {
            var entries = this.entries();
            var i = 0;
            return {
                next: function () {
                    if (i === entries.length) {
                        return {done: true};
                    }
                    var currentEntry = entries[i++];
                    return {
                        value: {key: currentEntry[0], value: currentEntry[1]},
                        done: false
                    };
                }
            };
        };
    }

    //- Add chaining to all methods that don't return something

    ['set', 'multi', 'copy', 'delete', 'clear', 'forEach'].forEach(function (method) {
        var fn = proto[method];
        proto[method] = function () {
            fn.apply(this, arguments);
            return this;
        };
    });

    //- Backwards compatibility

    // TODO: remove() is deprecated and will be deleted in a future version
    HashMap.prototype.remove = HashMap.prototype.delete;

    //- Utils

    function multi(map, args) {
        for (var i = 0; i < args.length; i += 2) {
            map.set(args[i], args[i + 1]);
        }
    }

    function hashCode(str) {
        var hash = 0, i, chr;
        for (i = 0; i < str.length; i++) {
            chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    function hide(obj, prop) {
        // Make non iterable if supported
        if (Object.defineProperty) {
            Object.defineProperty(obj, prop, {enumerable: false});
        }
    }

    return HashMap;
}));
