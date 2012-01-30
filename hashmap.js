/**
 * HashMap
 * @author Ariel Flesler <aflesler@gmail.com>
 * @version 0.1.2
 * Date: 1/30/2012
 * Homepage: https://github.com/flesler/hashmap
 */

;(function(exports){
	
	function HashMap() {
		this._data = {};
		hide(this, '_data');
	};

	HashMap.prototype = {
		constructor:HashMap,
		
		get:function(key) {
			return this._data[this.hash(key)];
		},
		
		set:function(key, value) {
			this._data[this.hash(key)] = value;
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
				case 'object':
				default:
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