/**
 * HashMap - HashMap Class for JavaScript
 * @author Ariel Flesler <aflesler@gmail.com>
 * @author Jack Moxley <https://github.com/jackmoxley>
 * @version 3.0.0
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

    function HashBucket(key, value) {
        this._key = key;
        this._value = value;
        this._next = null;
        this._size = 1;
    }

    HashBucket.prototype = {
        constructor: HashBucket,
        get: function (hash, equalTo, key) {
            var bucket = this;
            // avoid recursion
            do {
                if (equalTo(key, bucket._key)) {
                    return bucket._value;
                }
                bucket = bucket._next;
            }
            while (bucket != null);
            return null;
        },
        set: function (hash, equalTo, key, value) {
            var bucket = this;
            // avoid recursion
            while (true) {
                if (equalTo(key, bucket._key)) {
                    bucket._value = value;
                    return false;
                }
                if (bucket._next) {
                    bucket = bucket._next;
                } else {
                    bucket._next = new HashBucket(key, value);
                    this._size++;
                    return true;
                }
            }
        },

        has: function (hash, equalTo, key) {
            var bucket = this;
            // avoid recursion
            do {
                if (equalTo(key, bucket._key)) {
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

        delete: function (hash, equalTo, key) {
            var bucket = this;
            var prev = null;
            // avoid recursion
            do {
                if (equalTo(key, bucket._key)) {
                    var next = bucket._next;
                    if (bucket._next) {
                        bucket._key = next._key;
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
        get: function (hash, equalTo, key) {
            var bucket = this._buckets[hash & this._options.mask];
            if (bucket) {
                return bucket.get(hash >>> this._options.widthB, equalTo, key);
            }
            return null;
        },
        set: function (hash, equalTo, key, value) {
            var idx = hash & this._options.mask;
            var bucket = this._buckets[idx];
            if (bucket) {
                return bucket.set(hash >>> this._options.widthB, equalTo, key, value);
            } else {
                if (this._depth > 0) {
                    bucket = new HashBuckets(this._options, this._depth - 1);
                    bucket.set(hash >>> this._options.widthB, equalTo, key, value);
                    this._buckets[idx] = bucket;
                } else {
                    this._buckets[idx] = new HashBucket(key, value);
                }
                this._size++;
                return true;
            }
        },

        has: function (hash, equalTo, key) {
            var bucket = this._buckets[hash & this._options.mask];
            if (bucket) {
                return bucket.has(hash >>> this._options.widthB, equalTo, key);
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

        delete: function (hash, equalTo, key) {
            var idx = hash & this._options.mask;
            var bucket = this._buckets[idx];
            if (bucket) {
                if (bucket.delete(hash >>> this._options.widthB, equalTo, key)) {
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
            var hashEquals = this.hashEquals(key);
            return this._buckets.get(hashEquals.hash, hashEquals.equalTo, key);
        },

        set: function (key, value) {
            var hashEquals = this.hashEquals(key);
            if (this._buckets.set(hashEquals.hash, hashEquals.equalTo, key, value)) {
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
            var hashEquals = this.hashEquals(key);
            return this._buckets.has(hashEquals.hash, hashEquals.equalTo, key);
        },

        search: function (value) {
            return this._buckets.search(value);
        },

        delete: function (key) {
            var hashEquals = this.hashEquals(key);
            if (this._buckets.delete(hashEquals.hash, hashEquals.equalTo, key)) {
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
        hashEquals: function (key) {
            var typeFunction = this.type;
            switch (this.type(key)) {
                case 'undefined':
                case 'null':
                    return {
                        equalTo: defaultEquals, hash: 0
                    };
                case 'boolean':
                    return {
                        equalTo: defaultEquals, hash: key ? 0 : 1
                    };
                case 'number':
                    if (Number.isNaN(key)) {
                        return {
                            equalTo: function (me, them) {
                                return Number.isNaN(them);
                            },
                            hash: 0
                        };
                    }
                    if (!Number.isFinite(key)) {
                        return {
                            equalTo: defaultEquals, hash: 0
                        };
                    }
                    if (Number.isInteger(key)) {
                        return {
                            equalTo: defaultEquals, hash: key
                        };
                    }
                    return {
                        equalTo: defaultEquals, hash: compute_hash(key.toString())
                    };
                case 'regexp':
                    return {
                        equalTo: function (me, them) {
                            if (typeFunction(them) === 'regexp') {
                                return me + '' === them + '';
                            }
                            return false;
                        }, hash: compute_hash(key + '')
                    };

                case 'date':
                    return {
                        equalTo: function (me, them) {
                            if (typeFunction(them) === 'date') {
                                return me.toString() === them.toString();
                            }
                            return false;
                        }, hash: key.getTime() | 0
                    };

                case 'string':
                    return {
                        equalTo: defaultEquals, hash: compute_hash(key)
                    };
                case 'array':
                    var functions = [];
                    var hash_code = key.length;
                    for (var i = 0; i < key.length; i++) {
                        var hashEquals = this.hashEquals(key[i]);
                        functions.push(hashEquals.equalTo);
                        hash_code = hash_code + (hashEquals.hash * prime_powers[i & 0xFF]);
                    }
                    Object.freeze(functions);
                    return {
                        equalTo: function (me, them) {
                            if (Array.isArray(them) && me.length === them.length) {
                                for (var i = 0; i < me.length; i++) {
                                    if (!functions[i](me[i], them[i])) {
                                        return false;
                                    }
                                }
                                return true;
                            }
                            return false;
                        },
                        hash: hash_code | 0
                    };
                default:
                    // TODO: Don't use expandos when Object.defineProperty is not available?
                    if (!key.hasOwnProperty('_hmuid_')) {
                        key._hmuid_ = ++HashMap.uid;
                        hide(key, '_hmuid_');
                    }

                    return this.hashEquals(key._hmuid_);
            }
        },
        // Deprecated
        hash: function (key) {
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

    function defaultEquals(me, them) {
        return me === them;
    }

    function compute_hash(str) {
        var m = 2162722087;
        var len = Math.min(str.length, 1024); // lets not go above 1024, it does mean we reuse prime powers 4 times.
        var hash_value = len, i, chr;
        for (i = 0; i < len; i++) {
            chr = str.charCodeAt(i);
            hash_value = (hash_value + (chr * prime_powers[i & 0xFF])) % m;
        }
        return hash_value;
    }

    function hide(obj, prop) {
        // Make non iterable if supported
        if (Object.defineProperty) {
            Object.defineProperty(obj, prop, {enumerable: false});
        }
    }

    //256 prime_powers
    let prime_powers = Object.freeze(
        [1, 127, 16129, 2048383, 260144641, 597538102, 192065909, 602427486, 813017677, 1605306890,
            578098852, 2048725333, 661466851, 1822850771, 90784608, 716034781, 102089533, 2151760256, 770569550, 539838935,
            1515160048, 2105782440, 1419553179, 777320512, 1397211109, 102599709, 53830521, 348309906, 980916322,
            1301213935, 887291133, 224425367, 386634478, 1522692792, 899718841, 1802744283, 1862704806, 826802879,
            1193305457, 159246949, 759863740, 1342923152, 1858917518, 345817303, 664355741, 27017714, 1268527591,
            1061569619, 730572219, 1948344159, 889390275, 491016401, 1802864491, 1877971222, 602915624, 875011203,
            827596344, 1294075512, 2143433499, 1875793498, 326344676, 354054199, 1710441533, 953865991, 28543985,
            1462364008, 1888851621, 1984726297, 1184477627, 1200834626, 1115451412, 1085393669, 1593504482, 1241915123,
            2007230357, 1879771160, 831507750, 1790824074, 348838263, 1048017661, 1172195640, 1803744364, 1989715093,
            1818054719, 1644408091, 1218507205, 1197146858, 647104876, 2161602033, 2020475229, 1399147817, 348561625,
            1012884635, 1035745512, 1776354804, 673963060, 1247147227, 508985478, 1922215183, 1896454497, 787569462,
            536105672, 1041035647, 285479862, 1652389082, 69370975, 159225477, 757136796, 996601264, 1130479482, 831236472,
            1756371768, 298839575, 1186350546, 1438695339, 1045652745, 871851308, 426289679, 70737058, 332718018,
            1163468633, 695414475, 1808754845, 463324093, 448663462, 749485412, 24875496, 996465905, 1113288889, 810753248,
            1317724407, 821398990, 507011554, 1671526835, 337143519, 1725507260, 704491233, 798781024, 1959974046,
            203663837, 2075364342, 1881898907, 1101731619, 1505702045, 904616059, 261968882, 829216709, 1499861867,
            162913453, 1225509748, 2086469819, 1129572399, 716036931, 102362583, 23715519, 849148826, 1868518639,
            1565159670, 1967568173, 1168117966, 1285879766, 1102573757, 1612653571, 1511127339, 1593628397, 1257652328,
            1843133305, 503944339, 1281990530, 608640785, 1602106650, 171668372, 174662374, 554900628, 1265272972,
            648233006, 142152456, 751585216, 291550604, 260651229, 661874778, 1874657500, 182072930, 1496041240,
            1840415911, 158835301, 707584444, 1191618821, 2107766264, 1671498827, 333586503, 1273766228, 1726876518,
            878386999, 1256322436, 1674237021, 681337141, 20933427, 495823142, 250598511, 1547901679, 1938525403,
            1805130350, 3013228, 382679956, 1020468498, 1998896113, 821322172, 497255668, 432529313, 863170576,
            1486558802, 636146285, 769860976, 449850037, 900180437, 1861366975, 656898342, 1242650128, 2100575992,
            758334283, 1148682113, 980248522, 1216403335, 929955368, 1317339038, 772457127, 779561214, 1681780263,
            1639328875, 573446773, 1457911300, 1323357705, 1536827836, 532147342, 538327737, 1323237902, 1521612855,
            762566842, 1686217106, 40085849, 765458649, 2053476595, 1264877125, 597960437, 245702454, 926102440, 828017182,
            1347521938, 280241253, 987085739, 2084729894, 908601924, 768173737, 235570684, 1802089737]);

    return HashMap;
}));
