/**
 * HashMap
 * @author Ariel Flesler <aflesler@gmail.com>
 * @version 0.9.0
 * Date: 6/1/2012
 * Homepage: https://github.com/flesler/hashmap
 */

;(function(exports){
	
	function HashMap() {
		this._data = {}; // TODO: Would Object.create(null) make any difference
	};

	HashMap.prototype = {
		constructor:HashMap,
		
		// TODO: Implement a way to iterate (.each()?)

		get:function(key) {
			return this._data[this.hash(key)];
		},
		
		set:function(key, value) {
			this._data[this.hash(key)] = value;
		},
		
		has:function(key) {
			return this.hash(key) in this._data;
		},
		
		remove:function(key) {
			delete this._data[this.hash(key)];
		},

		type:function(key) {
			var str = Object.prototype.toString.call(key);
			var type = str.slice(8, -1).toLowerCase();
			// Some browsers yield DOMWindow for null and undefined, works fine on Node
			if (type === 'domwindow' && !key) {
				return key + '';
			}
			return type;
		},

		hash:function(key) {
			switch (this.type(key)) {
				case 'undefined':
				case 'null':
				case 'boolean':
				case 'number':
				case 'regexp':
					return key + '';

				case 'date':
					return ':' + key.getTime();

				case 'string':
					return '"' + key;

				case 'array':
					var hashes = [];
					for (var i = 0; i < key.length; i++)
						hashes[i] = this.hash(key[i]);
					return '[' + hashes.join('|');

				case 'object':
				default:
					// TODO: Don't use expandos when Object.defineProperty is not available?
					if (!key._hmuid_) {
						key._hmuid_ = ++HashMap.uid;
						hide(key, '_hmuid_');
					}

					return '{' + key._hmuid_;
			}
		}
	};

	HashMap.uid = 0;

	
	function hide(obj, prop) {
		// Make non iterable if supported
		if (Object.defineProperty) {
			Object.defineProperty(obj, prop, {enumerable:false});
		}
	};

	exports.HashMap = HashMap;

})(this.exports || this);