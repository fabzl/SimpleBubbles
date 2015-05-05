// This next line references a grunt task to include the file below
// so we concatenate these two files
/* Begin: bannersSrc/lib/plugins.min.js */
(function() {
    function require(path, parent, orig) {
        var resolved = require.resolve(path);
        if (null == resolved) {
            orig = orig || path;
            parent = parent || "root";
            var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
            err.path = orig;
            err.parent = parent;
            err.require = true;
            throw err;
        }
        var module = require.modules[resolved];
        if (!module._resolving && !module.exports) {
            var mod = {};
            mod.exports = {};
            mod.client = mod.component = true;
            module._resolving = true;
            module.call(this, mod.exports, require.relative(resolved), mod);
            delete module._resolving;
            module.exports = mod.exports;
        }
        return module.exports;
    }
    require.modules = {};
    require.aliases = {};
    require.resolve = function(path) {
        if (path.charAt(0) === "/") path = path.slice(1);
        var paths = [ path, path + ".js", path + ".json", path + "/index.js", path + "/index.json" ];
        for (var i = 0; i < paths.length; i++) {
            var path = paths[i];
            if (require.modules.hasOwnProperty(path)) return path;
            if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
        }
    };
    require.normalize = function(curr, path) {
        var segs = [];
        if ("." != path.charAt(0)) return path;
        curr = curr.split("/");
        path = path.split("/");
        for (var i = 0; i < path.length; ++i) {
            if (".." == path[i]) {
                curr.pop();
            } else if ("." != path[i] && "" != path[i]) {
                segs.push(path[i]);
            }
        }
        return curr.concat(segs).join("/");
    };
    require.register = function(path, definition) {
        require.modules[path] = definition;
    };
    require.alias = function(from, to) {
        if (!require.modules.hasOwnProperty(from)) {
            throw new Error('Failed to alias "' + from + '", it does not exist');
        }
        require.aliases[to] = from;
    };
    require.relative = function(parent) {
        var p = require.normalize(parent, "..");
        function lastIndexOf(arr, obj) {
            var i = arr.length;
            while (i--) {
                if (arr[i] === obj) return i;
            }
            return -1;
        }
        function localRequire(path) {
            var resolved = localRequire.resolve(path);
            return require(resolved, parent, path);
        }
        localRequire.resolve = function(path) {
            var c = path.charAt(0);
            if ("/" == c) return path.slice(1);
            if ("." == c) return require.normalize(p, path);
            var segs = parent.split("/");
            var i = lastIndexOf(segs, "deps") + 1;
            if (!i) i = 0;
            path = segs.slice(0, i + 1).join("/") + "/deps/" + path;
            return path;
        };
        localRequire.exists = function(path) {
            return require.modules.hasOwnProperty(localRequire.resolve(path));
        };
        return localRequire;
    };
    require.register("component-transform-property/index.js", function(exports, require, module) {
        var styles = [ "webkitTransform", "MozTransform", "msTransform", "OTransform", "transform" ];
        var el = document.createElement("p");
        var style;
        for (var i = 0; i < styles.length; i++) {
            style = styles[i];
            if (null != el.style[style]) {
                module.exports = style;
                break;
            }
        }
    });
    require.register("component-has-translate3d/index.js", function(exports, require, module) {
        var prop = require("transform-property");
        if (!prop || !window.getComputedStyle) return module.exports = false;
        var map = {
            webkitTransform: "-webkit-transform",
            OTransform: "-o-transform",
            msTransform: "-ms-transform",
            MozTransform: "-moz-transform",
            transform: "transform"
        };
        var el = document.createElement("div");
        el.style[prop] = "translate3d(1px,1px,1px)";
        document.body.insertBefore(el, null);
        var val = getComputedStyle(el).getPropertyValue(map[prop]);
        document.body.removeChild(el);
        module.exports = null != val && val.length && "none" != val;
    });
    require.register("yields-has-transitions/index.js", function(exports, require, module) {
        exports = module.exports = function(el) {
            switch (arguments.length) {
              case 0:
                return bool;

              case 1:
                return bool ? transitions(el) : bool;
            }
        };
        function transitions(el, styl) {
            if (el.transition) return true;
            styl = window.getComputedStyle(el);
            return !!parseFloat(styl.transitionDuration, 10);
        }
        var styl = document.body.style;
        var bool = "transition" in styl || "webkitTransition" in styl || "MozTransition" in styl || "msTransition" in styl;
    });
    require.register("component-event/index.js", function(exports, require, module) {
        exports.bind = function(el, type, fn, capture) {
            if (el.addEventListener) {
                el.addEventListener(type, fn, capture || false);
            } else {
                el.attachEvent("on" + type, fn);
            }
            return fn;
        };
        exports.unbind = function(el, type, fn, capture) {
            if (el.removeEventListener) {
                el.removeEventListener(type, fn, capture || false);
            } else {
                el.detachEvent("on" + type, fn);
            }
            return fn;
        };
    });
    require.register("ecarter-css-emitter/index.js", function(exports, require, module) {
        var events = require("event");
        var watch = [ "transitionend", "webkitTransitionEnd", "oTransitionEnd", "MSTransitionEnd", "animationend", "webkitAnimationEnd", "oAnimationEnd", "MSAnimationEnd" ];
        module.exports = CssEmitter;
        function CssEmitter(element) {
            if (!(this instanceof CssEmitter)) return new CssEmitter(element);
            this.el = element;
        }
        CssEmitter.prototype.bind = function(fn) {
            for (var i = 0; i < watch.length; i++) {
                events.bind(this.el, watch[i], fn);
            }
        };
        CssEmitter.prototype.unbind = function(fn) {
            for (var i = 0; i < watch.length; i++) {
                events.unbind(this.el, watch[i], fn);
            }
        };
    });
    require.register("component-once/index.js", function(exports, require, module) {
        var n = 0;
        var global = function() {
            return this;
        }();
        module.exports = function(fn) {
            var id = n++;
            var called;
            function once() {
                if (this == global) {
                    if (called) return;
                    called = true;
                    return fn.apply(this, arguments);
                }
                var key = "__called_" + id + "__";
                if (this[key]) return;
                this[key] = true;
                return fn.apply(this, arguments);
            }
            return once;
        };
    });
    require.register("yields-after-transition/index.js", function(exports, require, module) {
        var has = require("has-transitions"), emitter = require("css-emitter"), once = require("once");
        var supported = has();
        module.exports = after;
        function after(el, fn) {
            if (!supported || !has(el)) return fn();
            emitter(el).bind(fn);
            return fn;
        }
        after.once = function(el, fn) {
            var callback = once(fn);
            after(el, fn = function() {
                emitter(el).unbind(fn);
                callback();
            });
        };
    });
    require.register("component-indexof/index.js", function(exports, require, module) {
        module.exports = function(arr, obj) {
            if (arr.indexOf) return arr.indexOf(obj);
            for (var i = 0; i < arr.length; ++i) {
                if (arr[i] === obj) return i;
            }
            return -1;
        };
    });
    require.register("component-emitter/index.js", function(exports, require, module) {
        var index = require("indexof");
        module.exports = Emitter;
        function Emitter(obj) {
            if (obj) return mixin(obj);
        }
        function mixin(obj) {
            for (var key in Emitter.prototype) {
                obj[key] = Emitter.prototype[key];
            }
            return obj;
        }
        Emitter.prototype.on = Emitter.prototype.addEventListener = function(event, fn) {
            this._callbacks = this._callbacks || {};
            (this._callbacks[event] = this._callbacks[event] || []).push(fn);
            return this;
        };
        Emitter.prototype.once = function(event, fn) {
            var self = this;
            this._callbacks = this._callbacks || {};
            function on() {
                self.off(event, on);
                fn.apply(this, arguments);
            }
            fn._off = on;
            this.on(event, on);
            return this;
        };
        Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function(event, fn) {
            this._callbacks = this._callbacks || {};
            if (0 == arguments.length) {
                this._callbacks = {};
                return this;
            }
            var callbacks = this._callbacks[event];
            if (!callbacks) return this;
            if (1 == arguments.length) {
                delete this._callbacks[event];
                return this;
            }
            var i = index(callbacks, fn._off || fn);
            if (~i) callbacks.splice(i, 1);
            return this;
        };
        Emitter.prototype.emit = function(event) {
            this._callbacks = this._callbacks || {};
            var args = [].slice.call(arguments, 1), callbacks = this._callbacks[event];
            if (callbacks) {
                callbacks = callbacks.slice(0);
                for (var i = 0, len = callbacks.length; i < len; ++i) {
                    callbacks[i].apply(this, args);
                }
            }
            return this;
        };
        Emitter.prototype.listeners = function(event) {
            this._callbacks = this._callbacks || {};
            return this._callbacks[event] || [];
        };
        Emitter.prototype.hasListeners = function(event) {
            return !!this.listeners(event).length;
        };
    });
    require.register("yields-css-ease/index.js", function(exports, require, module) {
        module.exports = {
            "in": "ease-in",
            out: "ease-out",
            "in-out": "ease-in-out",
            snap: "cubic-bezier(0,1,.5,1)",
            linear: "cubic-bezier(0.250, 0.250, 0.750, 0.750)",
            "ease-in-quad": "cubic-bezier(0.550, 0.085, 0.680, 0.530)",
            "ease-in-cubic": "cubic-bezier(0.550, 0.055, 0.675, 0.190)",
            "ease-in-quart": "cubic-bezier(0.895, 0.030, 0.685, 0.220)",
            "ease-in-quint": "cubic-bezier(0.755, 0.050, 0.855, 0.060)",
            "ease-in-sine": "cubic-bezier(0.470, 0.000, 0.745, 0.715)",
            "ease-in-expo": "cubic-bezier(0.950, 0.050, 0.795, 0.035)",
            "ease-in-circ": "cubic-bezier(0.600, 0.040, 0.980, 0.335)",
            "ease-in-back": "cubic-bezier(0.600, -0.280, 0.735, 0.045)",
            "ease-out-quad": "cubic-bezier(0.250, 0.460, 0.450, 0.940)",
            "ease-out-cubic": "cubic-bezier(0.215, 0.610, 0.355, 1.000)",
            "ease-out-quart": "cubic-bezier(0.165, 0.840, 0.440, 1.000)",
            "ease-out-quint": "cubic-bezier(0.230, 1.000, 0.320, 1.000)",
            "ease-out-sine": "cubic-bezier(0.390, 0.575, 0.565, 1.000)",
            "ease-out-expo": "cubic-bezier(0.190, 1.000, 0.220, 1.000)",
            "ease-out-circ": "cubic-bezier(0.075, 0.820, 0.165, 1.000)",
            "ease-out-back": "cubic-bezier(0.175, 0.885, 0.320, 1.275)",
            "ease-out-quad": "cubic-bezier(0.455, 0.030, 0.515, 0.955)",
            "ease-out-cubic": "cubic-bezier(0.645, 0.045, 0.355, 1.000)",
            "ease-in-out-quart": "cubic-bezier(0.770, 0.000, 0.175, 1.000)",
            "ease-in-out-quint": "cubic-bezier(0.860, 0.000, 0.070, 1.000)",
            "ease-in-out-sine": "cubic-bezier(0.445, 0.050, 0.550, 0.950)",
            "ease-in-out-expo": "cubic-bezier(1.000, 0.000, 0.000, 1.000)",
            "ease-in-out-circ": "cubic-bezier(0.785, 0.135, 0.150, 0.860)",
            "ease-in-out-back": "cubic-bezier(0.680, -0.550, 0.265, 1.550)"
        };
    });
    require.register("component-query/index.js", function(exports, require, module) {
        function one(selector, el) {
            return el.querySelector(selector);
        }
        exports = module.exports = function(selector, el) {
            el = el || document;
            return one(selector, el);
        };
        exports.all = function(selector, el) {
            el = el || document;
            return el.querySelectorAll(selector);
        };
        exports.engine = function(obj) {
            if (!obj.one) throw new Error(".one callback required");
            if (!obj.all) throw new Error(".all callback required");
            one = obj.one;
            exports.all = obj.all;
            return exports;
        };
    });
    require.register("move/index.js", function(exports, require, module) {
        var after = require("after-transition");
        var has3d = require("has-translate3d");
        var Emitter = require("emitter");
        var ease = require("css-ease");
        var query = require("query");
        var translate = has3d ? [ "translate3d(", ", 0)" ] : [ "translate(", ")" ];
        module.exports = Move;
        var style = window.getComputedStyle || window.currentStyle;
        Move.version = "0.3.2";
        Move.ease = ease;
        Move.defaults = {
            duration: 500
        };
        Move.select = function(selector) {
            if ("string" != typeof selector) return selector;
            return query(selector);
        };
        function Move(el) {
            if (!(this instanceof Move)) return new Move(el);
            if ("string" == typeof el) el = query(el);
            if (!el) throw new TypeError("Move must be initialized with element or selector");
            this.el = el;
            this._props = {};
            this._rotate = 0;
            this._transitionProps = [];
            this._transforms = [];
            this.duration(Move.defaults.duration);
        }
        Emitter(Move.prototype);
        Move.prototype.transform = function(transform) {
            this._transforms.push(transform);
            return this;
        };
        Move.prototype.skew = function(x, y) {
            return this.transform("skew(" + x + "deg, " + (y || 0) + "deg)");
        };
        Move.prototype.skewX = function(n) {
            return this.transform("skewX(" + n + "deg)");
        };
        Move.prototype.skewY = function(n) {
            return this.transform("skewY(" + n + "deg)");
        };
        Move.prototype.translate = Move.prototype.to = function(x, y) {
            return this.transform(translate.join("" + x + "px, " + (y || 0) + "px"));
        };
        Move.prototype.translateX = Move.prototype.x = function(n) {
            return this.transform("translateX(" + n + "px)");
        };
        Move.prototype.translateY = Move.prototype.y = function(n) {
            return this.transform("translateY(" + n + "px)");
        };
        Move.prototype.scale = function(x, y) {
            return this.transform("scale(" + x + ", " + (y || x) + ")");
        };
        Move.prototype.scaleX = function(n) {
            return this.transform("scaleX(" + n + ")");
        };
        Move.prototype.scaleY = function(n) {
            return this.transform("scaleY(" + n + ")");
        };
        Move.prototype.rotate = function(n) {
            return this.transform("rotate(" + n + "deg)");
        };
        Move.prototype.ease = function(fn) {
            fn = ease[fn] || fn || "ease";
            return this.setVendorProperty("transition-timing-function", fn);
        };
        Move.prototype.animate = function(name, props) {
            for (var i in props) {
                if (props.hasOwnProperty(i)) {
                    this.setVendorProperty("animation-" + i, props[i]);
                }
            }
            return this.setVendorProperty("animation-name", name);
        };
        Move.prototype.duration = function(n) {
            n = this._duration = "string" == typeof n ? parseFloat(n) * 1e3 : n;
            return this.setVendorProperty("transition-duration", n + "ms");
        };
        Move.prototype.delay = function(n) {
            n = "string" == typeof n ? parseFloat(n) * 1e3 : n;
            return this.setVendorProperty("transition-delay", n + "ms");
        };
        Move.prototype.setProperty = function(prop, val) {
            this._props[prop] = val;
            return this;
        };
        Move.prototype.setVendorProperty = function(prop, val) {
            this.setProperty("-webkit-" + prop, val);
            this.setProperty("-moz-" + prop, val);
            this.setProperty("-ms-" + prop, val);
            this.setProperty("-o-" + prop, val);
            return this;
        };
        Move.prototype.set = function(prop, val) {
            this.transition(prop);
            this._props[prop] = val;
            return this;
        };
        Move.prototype.add = function(prop, val) {
            if (!style) return;
            var self = this;
            return this.on("start", function() {
                var curr = parseInt(self.current(prop), 10);
                self.set(prop, curr + val + "px");
            });
        };
        Move.prototype.sub = function(prop, val) {
            if (!style) return;
            var self = this;
            return this.on("start", function() {
                var curr = parseInt(self.current(prop), 10);
                self.set(prop, curr - val + "px");
            });
        };
        Move.prototype.current = function(prop) {
            return style(this.el).getPropertyValue(prop);
        };
        Move.prototype.transition = function(prop) {
            if (!this._transitionProps.indexOf(prop)) return this;
            this._transitionProps.push(prop);
            return this;
        };
        Move.prototype.applyProperties = function() {
            for (var prop in this._props) {
                this.el.style.setProperty(prop, this._props[prop]);
            }
            return this;
        };
        Move.prototype.move = Move.prototype.select = function(selector) {
            this.el = Move.select(selector);
            return this;
        };
        Move.prototype.then = function(fn) {
            if (fn instanceof Move) {
                this.on("end", function() {
                    fn.end();
                });
            } else if ("function" == typeof fn) {
                this.on("end", fn);
            } else {
                var clone = new Move(this.el);
                clone._transforms = this._transforms.slice(0);
                this.then(clone);
                clone.parent = this;
                return clone;
            }
            return this;
        };
        Move.prototype.pop = function() {
            return this.parent;
        };
        Move.prototype.reset = function() {
            this.el.style.webkitTransitionDuration = this.el.style.mozTransitionDuration = this.el.style.msTransitionDuration = this.el.style.oTransitionDuration = 0;
            return this;
        };
        Move.prototype.end = function(fn) {
            var self = this;
            this.emit("start");
            if (this._transforms.length) {
                this.setVendorProperty("transform", this._transforms.join(" "));
            }
            this.setVendorProperty("transition-properties", this._transitionProps.join(", "));
            this.applyProperties();
            if (fn) this.then(fn);
            after.once(this.el, function() {
                self.reset();
                self.emit("end");
            });
            return this;
        };
    });
    require.alias("component-has-translate3d/index.js", "move/deps/has-translate3d/index.js");
    require.alias("component-has-translate3d/index.js", "has-translate3d/index.js");
    require.alias("component-transform-property/index.js", "component-has-translate3d/deps/transform-property/index.js");
    require.alias("yields-after-transition/index.js", "move/deps/after-transition/index.js");
    require.alias("yields-after-transition/index.js", "move/deps/after-transition/index.js");
    require.alias("yields-after-transition/index.js", "after-transition/index.js");
    require.alias("yields-has-transitions/index.js", "yields-after-transition/deps/has-transitions/index.js");
    require.alias("yields-has-transitions/index.js", "yields-after-transition/deps/has-transitions/index.js");
    require.alias("yields-has-transitions/index.js", "yields-has-transitions/index.js");
    require.alias("ecarter-css-emitter/index.js", "yields-after-transition/deps/css-emitter/index.js");
    require.alias("component-emitter/index.js", "ecarter-css-emitter/deps/emitter/index.js");
    require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");
    require.alias("component-event/index.js", "ecarter-css-emitter/deps/event/index.js");
    require.alias("component-once/index.js", "yields-after-transition/deps/once/index.js");
    require.alias("yields-after-transition/index.js", "yields-after-transition/index.js");
    require.alias("component-emitter/index.js", "move/deps/emitter/index.js");
    require.alias("component-emitter/index.js", "emitter/index.js");
    require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");
    require.alias("yields-css-ease/index.js", "move/deps/css-ease/index.js");
    require.alias("yields-css-ease/index.js", "move/deps/css-ease/index.js");
    require.alias("yields-css-ease/index.js", "css-ease/index.js");
    require.alias("yields-css-ease/index.js", "yields-css-ease/index.js");
    require.alias("component-query/index.js", "move/deps/query/index.js");
    require.alias("component-query/index.js", "query/index.js");
    if (typeof exports == "object") {
        module.exports = require("move");
    } else if (typeof define == "function" && define.amd) {
        define(function() {
            return require("move");
        });
    } else {
        this["move"] = require("move");
    }
})();/* End: bannersSrc/lib/plugins.min.js */

var creative = window.creative || {};

//timeout interval
creative.timeOut = 15;
creative.time = 0;
creative.timer = setTimeout(bannerTimeOut, creative.timeOut * 1000);
creative.particleNumber = 10;
creative.particleAreaWidth = 300;
creative.particleAreaHeight = 250;
creative.particleLife = 6;
creative.maxSubParticleNumber = 5;

// triggered when time finish
function bannerTimeOut() {

	creative.adCompleted = true;
}

// starts everything
function startBannerAnimation()
{
	// write your code animations here
	createParticleSystem();
}

function createParticleSystem() {

//	console.log(creative.domEl.particleContainer);

	for (var i = 0 ; i < creative.particleNumber ; i ++ ) {

	//console.log(i);
		var particleGroup = document.createElement("div");
		var particle = document.createElement("div");
		var initialParticlePostionW = Math.random()*(creative.particleAreaWidth-50);
		var initialParticlePostionH = creative.particleAreaHeight;
		var particleScaleFactor  = Math.random()*.7 + .3;
		var particleSpeed = particleScaleFactor*creative.particleLife;
		var delayFactor  = Math.random()*(creative.particleLife*.5);
		var transformBubbleGroup  = "bubbleGroupMove "+particleSpeed+"s linear infinite";
		var transformBubble  = "bubbleMove "+particleSpeed*particleScaleFactor+"s ease-in-out alternate infinite ";


		particleGroup.className += "bubble-group";
		particle.className += "bubble";

		particleGroup.style.top = initialParticlePostionH+"px";
		particleGroup.style.left = initialParticlePostionW+"px";

		setVendor(particleGroup,"animation",transformBubbleGroup);
		setVendor(particleGroup,"animation-delay",delayFactor+"s");
		setVendor(particleGroup,"transform","scale("+particleScaleFactor+")");

		setVendor(particle,"animation",transformBubble);

		particleGroup.addEventListener('animationend webkitAnimationEnd oAnimationEnd oanimationend MSAnimationEnd', particleRespawn, false );
		creative.domEl.particleContainer.appendChild(particleGroup);
		particleGroup.appendChild(particle);



	}
}

function particleRespawn () { 


	console.log("particle respawn");

}

function setVendor(element, property, value) {
  element.style["-webkit-" + property] = value;
  element.style["-moz-" + property] = value;
  element.style["-ms-" + property] = value;
  element.style["-o-" + property] = value;
}




// (function(){
// 		var canvas = document.getElementById('canvas'),
// 		/** @type {CanvasRenderingContext2D} */
// 		ctx = canvas.getContext('2d'),
// 		width = 300,
// 		height = 250,
// 		half_width = width >> 1,
// 		half_height = height >> 1,
// 		size = width * (height + 2) * 2,
// 		delay = 30,
// 		oldind = width,
// 		newind = width * (height + 3),
// 		riprad = 3,
// 		ripplemap = [],
// 		last_map = [],
// 		ripple,
// 		texture,
// 		line_width = 20,
// 		step = line_width * 2, 
// 		count = height / line_width;

// 		canvas.width = width;
// 		canvas.height = height;
// 	/*
//      * Water ripple demo can work with any bitmap image
//      * (see example here: http://media.chikuyonok.ru/ripple/)
//      * But I need to draw simple artwork to bypass 1k limitation
//      */

//     with (ctx) {
//         fillStyle = '#a2ddf8';
//         fillRect(0, 0, width, height);
        
//         fillStyle = '#07b';
//         save();
//         rotate(-0.785);
//         for (var i = 0; i < count; i++) {
//             fillRect(-width, i * step, width * 3, line_width);
//         }
        
//         restore();
//     }
    
//     texture = ctx.getImageData(0, 0, width, height);
//     ripple = ctx.getImageData(0, 0, width, height);
    
//     for (var i = 0; i < size; i++) {
//         last_map[i] = ripplemap[i] = 0;
//     }
    
//     /**
//      * Main loop
//      */
//     function run() {
//         newframe();
//         ctx.putImageData(ripple, 0, 0);
//     }
    
//     /**
//      * Disturb water at specified point
//      */
//     function disturb(dx, dy) {
//         dx <<= 0;
//         dy <<= 0;
        
//         for (var j = dy - riprad; j < dy + riprad; j++) {
//             for (var k = dx - riprad; k < dx + riprad; k++) {
//                 ripplemap[oldind + (j * width) + k] += 128;
//             }
//         }
//     }
    
//     /**
//      * Generates new ripples
//      */
//     function newframe() {
//         var a, b, data, cur_pixel, new_pixel, old_data;
        
//         var t = oldind; oldind = newind; newind = t;
//         var i = 0;
        
//         // create local copies of variables to decrease
//         // scope lookup time in Firefox
//         var _width = width,
//             _height = height,
//             _ripplemap = ripplemap,
//             _last_map = last_map,
//             _rd = ripple.data,
//             _td = texture.data,
//             _half_width = half_width,
//             _half_height = half_height;
        
//         for (var y = 0; y < _height; y++) {
//             for (var x = 0; x < _width; x++) {
//                 var _newind = newind + i, _mapind = oldind + i;
//                 data = (
//                     _ripplemap[_mapind - _width] + 
//                     _ripplemap[_mapind + _width] + 
//                     _ripplemap[_mapind - 1] + 
//                     _ripplemap[_mapind + 1]) >> 1;
                    
//                 data -= _ripplemap[_newind];
//                 data -= data >> 5;
                
//                 _ripplemap[_newind] = data;

//                 //where data=0 then still, where data>0 then wave
//                 data = 1024 - data;
                
//                 old_data = _last_map[i];
//                 _last_map[i] = data;
                
//                 if (old_data != data) {
//                     //offsets
//                     a = (((x - _half_width) * data / 1024) << 0) + _half_width;
//                     b = (((y - _half_height) * data / 1024) << 0) + _half_height;
    
//                     //bounds check
//                     if (a >= _width) a = _width - 1;
//                     if (a < 0) a = 0;
//                     if (b >= _height) b = _height - 1;
//                     if (b < 0) b = 0;
    
//                     new_pixel = (a + (b * _width)) * 4;
//                     cur_pixel = i * 4;
                    
//                     _rd[cur_pixel] = _td[new_pixel];
//                     _rd[cur_pixel + 1] = _td[new_pixel + 1];
//                     _rd[cur_pixel + 2] = _td[new_pixel + 2];
//                 }
                
//                 ++i;
//             }
//         }
//     }
    
// 	    // canvas.onmousemove = function(/* Event */ evt) {
// 	    //     disturb(evt.offsetX || evt.layerX, evt.offsetY || evt.layerY);
// 	    // };
    
// 	setInterval(run, delay);
    
//     // generate random ripples
//     var rnd = Math.random;
//     setInterval(function() {
//         disturb(150,125);
//     }, 700);
    
// })();



