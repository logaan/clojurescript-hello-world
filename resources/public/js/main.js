var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.evalWorksForGlobals_ = null;
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.require = function(rule) {
  if(!COMPILED) {
    if(goog.getObjectByName(rule)) {
      return
    }
    var path = goog.getPathFromDeps_(rule);
    if(path) {
      goog.included_[path] = true;
      goog.writeScripts_()
    }else {
      var errorMessage = "goog.require could not find: " + rule;
      if(goog.global.console) {
        goog.global.console["error"](errorMessage)
      }
      throw Error(errorMessage);
    }
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName])
          }else {
            if(!goog.getObjectByName(requireName)) {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs)
    }
  }else {
    return function() {
      return fn.apply(context, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = style
};
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global && !goog.string.contains(str, "<")) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var el = goog.global["document"]["createElement"]("div");
  el["innerHTML"] = "<pre>x" + str + "</pre>";
  if(el["firstChild"][goog.string.NORMALIZE_FN_]) {
    el["firstChild"][goog.string.NORMALIZE_FN_]()
  }
  str = el["firstChild"]["firstChild"]["nodeValue"].slice(1);
  el["innerHTML"] = "";
  return goog.string.canonicalizeNewlines(str)
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.NORMALIZE_FN_ = "normalize";
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\u000b":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
void 0;
void 0;
void 0;
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
void 0;
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  if(p[goog.typeOf.call(null, x)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error("No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
void 0;
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__267758__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__267758 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__267758__delegate.call(this, array, i, idxs)
    };
    G__267758.cljs$lang$maxFixedArity = 2;
    G__267758.cljs$lang$applyTo = function(arglist__267759) {
      var array = cljs.core.first(arglist__267759);
      var i = cljs.core.first(cljs.core.next(arglist__267759));
      var idxs = cljs.core.rest(cljs.core.next(arglist__267759));
      return G__267758__delegate(array, i, idxs)
    };
    G__267758.cljs$lang$arity$variadic = G__267758__delegate;
    return G__267758
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
void 0;
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
void 0;
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____267760 = this$;
      if(and__3822__auto____267760) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____267760
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      return function() {
        var or__3824__auto____267761 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____267761) {
          return or__3824__auto____267761
        }else {
          var or__3824__auto____267762 = cljs.core._invoke["_"];
          if(or__3824__auto____267762) {
            return or__3824__auto____267762
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____267763 = this$;
      if(and__3822__auto____267763) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____267763
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      return function() {
        var or__3824__auto____267764 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____267764) {
          return or__3824__auto____267764
        }else {
          var or__3824__auto____267765 = cljs.core._invoke["_"];
          if(or__3824__auto____267765) {
            return or__3824__auto____267765
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____267766 = this$;
      if(and__3822__auto____267766) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____267766
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      return function() {
        var or__3824__auto____267767 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____267767) {
          return or__3824__auto____267767
        }else {
          var or__3824__auto____267768 = cljs.core._invoke["_"];
          if(or__3824__auto____267768) {
            return or__3824__auto____267768
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____267769 = this$;
      if(and__3822__auto____267769) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____267769
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      return function() {
        var or__3824__auto____267770 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____267770) {
          return or__3824__auto____267770
        }else {
          var or__3824__auto____267771 = cljs.core._invoke["_"];
          if(or__3824__auto____267771) {
            return or__3824__auto____267771
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____267772 = this$;
      if(and__3822__auto____267772) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____267772
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      return function() {
        var or__3824__auto____267773 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____267773) {
          return or__3824__auto____267773
        }else {
          var or__3824__auto____267774 = cljs.core._invoke["_"];
          if(or__3824__auto____267774) {
            return or__3824__auto____267774
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____267775 = this$;
      if(and__3822__auto____267775) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____267775
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3824__auto____267776 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____267776) {
          return or__3824__auto____267776
        }else {
          var or__3824__auto____267777 = cljs.core._invoke["_"];
          if(or__3824__auto____267777) {
            return or__3824__auto____267777
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____267778 = this$;
      if(and__3822__auto____267778) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____267778
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3824__auto____267779 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____267779) {
          return or__3824__auto____267779
        }else {
          var or__3824__auto____267780 = cljs.core._invoke["_"];
          if(or__3824__auto____267780) {
            return or__3824__auto____267780
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____267781 = this$;
      if(and__3822__auto____267781) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____267781
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3824__auto____267782 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____267782) {
          return or__3824__auto____267782
        }else {
          var or__3824__auto____267783 = cljs.core._invoke["_"];
          if(or__3824__auto____267783) {
            return or__3824__auto____267783
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____267784 = this$;
      if(and__3822__auto____267784) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____267784
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3824__auto____267785 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____267785) {
          return or__3824__auto____267785
        }else {
          var or__3824__auto____267786 = cljs.core._invoke["_"];
          if(or__3824__auto____267786) {
            return or__3824__auto____267786
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____267787 = this$;
      if(and__3822__auto____267787) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____267787
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3824__auto____267788 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____267788) {
          return or__3824__auto____267788
        }else {
          var or__3824__auto____267789 = cljs.core._invoke["_"];
          if(or__3824__auto____267789) {
            return or__3824__auto____267789
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____267790 = this$;
      if(and__3822__auto____267790) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____267790
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3824__auto____267791 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____267791) {
          return or__3824__auto____267791
        }else {
          var or__3824__auto____267792 = cljs.core._invoke["_"];
          if(or__3824__auto____267792) {
            return or__3824__auto____267792
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____267793 = this$;
      if(and__3822__auto____267793) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____267793
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3824__auto____267794 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____267794) {
          return or__3824__auto____267794
        }else {
          var or__3824__auto____267795 = cljs.core._invoke["_"];
          if(or__3824__auto____267795) {
            return or__3824__auto____267795
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____267796 = this$;
      if(and__3822__auto____267796) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____267796
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3824__auto____267797 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____267797) {
          return or__3824__auto____267797
        }else {
          var or__3824__auto____267798 = cljs.core._invoke["_"];
          if(or__3824__auto____267798) {
            return or__3824__auto____267798
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____267799 = this$;
      if(and__3822__auto____267799) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____267799
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3824__auto____267800 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____267800) {
          return or__3824__auto____267800
        }else {
          var or__3824__auto____267801 = cljs.core._invoke["_"];
          if(or__3824__auto____267801) {
            return or__3824__auto____267801
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____267802 = this$;
      if(and__3822__auto____267802) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____267802
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3824__auto____267803 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____267803) {
          return or__3824__auto____267803
        }else {
          var or__3824__auto____267804 = cljs.core._invoke["_"];
          if(or__3824__auto____267804) {
            return or__3824__auto____267804
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____267805 = this$;
      if(and__3822__auto____267805) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____267805
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3824__auto____267806 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____267806) {
          return or__3824__auto____267806
        }else {
          var or__3824__auto____267807 = cljs.core._invoke["_"];
          if(or__3824__auto____267807) {
            return or__3824__auto____267807
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____267808 = this$;
      if(and__3822__auto____267808) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____267808
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3824__auto____267809 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____267809) {
          return or__3824__auto____267809
        }else {
          var or__3824__auto____267810 = cljs.core._invoke["_"];
          if(or__3824__auto____267810) {
            return or__3824__auto____267810
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____267811 = this$;
      if(and__3822__auto____267811) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____267811
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3824__auto____267812 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____267812) {
          return or__3824__auto____267812
        }else {
          var or__3824__auto____267813 = cljs.core._invoke["_"];
          if(or__3824__auto____267813) {
            return or__3824__auto____267813
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____267814 = this$;
      if(and__3822__auto____267814) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____267814
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3824__auto____267815 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____267815) {
          return or__3824__auto____267815
        }else {
          var or__3824__auto____267816 = cljs.core._invoke["_"];
          if(or__3824__auto____267816) {
            return or__3824__auto____267816
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____267817 = this$;
      if(and__3822__auto____267817) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____267817
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3824__auto____267818 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____267818) {
          return or__3824__auto____267818
        }else {
          var or__3824__auto____267819 = cljs.core._invoke["_"];
          if(or__3824__auto____267819) {
            return or__3824__auto____267819
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____267820 = this$;
      if(and__3822__auto____267820) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____267820
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3824__auto____267821 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____267821) {
          return or__3824__auto____267821
        }else {
          var or__3824__auto____267822 = cljs.core._invoke["_"];
          if(or__3824__auto____267822) {
            return or__3824__auto____267822
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
void 0;
void 0;
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____267823 = coll;
    if(and__3822__auto____267823) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____267823
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____267824 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(or__3824__auto____267824) {
        return or__3824__auto____267824
      }else {
        var or__3824__auto____267825 = cljs.core._count["_"];
        if(or__3824__auto____267825) {
          return or__3824__auto____267825
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____267826 = coll;
    if(and__3822__auto____267826) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____267826
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____267827 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(or__3824__auto____267827) {
        return or__3824__auto____267827
      }else {
        var or__3824__auto____267828 = cljs.core._empty["_"];
        if(or__3824__auto____267828) {
          return or__3824__auto____267828
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____267829 = coll;
    if(and__3822__auto____267829) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____267829
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3824__auto____267830 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(or__3824__auto____267830) {
        return or__3824__auto____267830
      }else {
        var or__3824__auto____267831 = cljs.core._conj["_"];
        if(or__3824__auto____267831) {
          return or__3824__auto____267831
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
void 0;
void 0;
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____267832 = coll;
      if(and__3822__auto____267832) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____267832
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3824__auto____267833 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____267833) {
          return or__3824__auto____267833
        }else {
          var or__3824__auto____267834 = cljs.core._nth["_"];
          if(or__3824__auto____267834) {
            return or__3824__auto____267834
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____267835 = coll;
      if(and__3822__auto____267835) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____267835
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3824__auto____267836 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____267836) {
          return or__3824__auto____267836
        }else {
          var or__3824__auto____267837 = cljs.core._nth["_"];
          if(or__3824__auto____267837) {
            return or__3824__auto____267837
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
void 0;
void 0;
cljs.core.ASeq = {};
void 0;
void 0;
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____267838 = coll;
    if(and__3822__auto____267838) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____267838
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____267839 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(or__3824__auto____267839) {
        return or__3824__auto____267839
      }else {
        var or__3824__auto____267840 = cljs.core._first["_"];
        if(or__3824__auto____267840) {
          return or__3824__auto____267840
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____267841 = coll;
    if(and__3822__auto____267841) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____267841
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____267842 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(or__3824__auto____267842) {
        return or__3824__auto____267842
      }else {
        var or__3824__auto____267843 = cljs.core._rest["_"];
        if(or__3824__auto____267843) {
          return or__3824__auto____267843
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____267844 = o;
      if(and__3822__auto____267844) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____267844
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3824__auto____267845 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____267845) {
          return or__3824__auto____267845
        }else {
          var or__3824__auto____267846 = cljs.core._lookup["_"];
          if(or__3824__auto____267846) {
            return or__3824__auto____267846
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____267847 = o;
      if(and__3822__auto____267847) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____267847
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3824__auto____267848 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____267848) {
          return or__3824__auto____267848
        }else {
          var or__3824__auto____267849 = cljs.core._lookup["_"];
          if(or__3824__auto____267849) {
            return or__3824__auto____267849
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
void 0;
void 0;
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____267850 = coll;
    if(and__3822__auto____267850) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____267850
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____267851 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(or__3824__auto____267851) {
        return or__3824__auto____267851
      }else {
        var or__3824__auto____267852 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____267852) {
          return or__3824__auto____267852
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____267853 = coll;
    if(and__3822__auto____267853) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____267853
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3824__auto____267854 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____267854) {
        return or__3824__auto____267854
      }else {
        var or__3824__auto____267855 = cljs.core._assoc["_"];
        if(or__3824__auto____267855) {
          return or__3824__auto____267855
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
void 0;
void 0;
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____267856 = coll;
    if(and__3822__auto____267856) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____267856
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____267857 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____267857) {
        return or__3824__auto____267857
      }else {
        var or__3824__auto____267858 = cljs.core._dissoc["_"];
        if(or__3824__auto____267858) {
          return or__3824__auto____267858
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
void 0;
void 0;
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____267859 = coll;
    if(and__3822__auto____267859) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____267859
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____267860 = cljs.core._key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____267860) {
        return or__3824__auto____267860
      }else {
        var or__3824__auto____267861 = cljs.core._key["_"];
        if(or__3824__auto____267861) {
          return or__3824__auto____267861
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____267862 = coll;
    if(and__3822__auto____267862) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____267862
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____267863 = cljs.core._val[goog.typeOf.call(null, coll)];
      if(or__3824__auto____267863) {
        return or__3824__auto____267863
      }else {
        var or__3824__auto____267864 = cljs.core._val["_"];
        if(or__3824__auto____267864) {
          return or__3824__auto____267864
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____267865 = coll;
    if(and__3822__auto____267865) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____267865
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3824__auto____267866 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(or__3824__auto____267866) {
        return or__3824__auto____267866
      }else {
        var or__3824__auto____267867 = cljs.core._disjoin["_"];
        if(or__3824__auto____267867) {
          return or__3824__auto____267867
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
void 0;
void 0;
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____267868 = coll;
    if(and__3822__auto____267868) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____267868
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____267869 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(or__3824__auto____267869) {
        return or__3824__auto____267869
      }else {
        var or__3824__auto____267870 = cljs.core._peek["_"];
        if(or__3824__auto____267870) {
          return or__3824__auto____267870
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____267871 = coll;
    if(and__3822__auto____267871) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____267871
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____267872 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(or__3824__auto____267872) {
        return or__3824__auto____267872
      }else {
        var or__3824__auto____267873 = cljs.core._pop["_"];
        if(or__3824__auto____267873) {
          return or__3824__auto____267873
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____267874 = coll;
    if(and__3822__auto____267874) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____267874
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3824__auto____267875 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(or__3824__auto____267875) {
        return or__3824__auto____267875
      }else {
        var or__3824__auto____267876 = cljs.core._assoc_n["_"];
        if(or__3824__auto____267876) {
          return or__3824__auto____267876
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
void 0;
void 0;
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____267877 = o;
    if(and__3822__auto____267877) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____267877
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____267878 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(or__3824__auto____267878) {
        return or__3824__auto____267878
      }else {
        var or__3824__auto____267879 = cljs.core._deref["_"];
        if(or__3824__auto____267879) {
          return or__3824__auto____267879
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____267880 = o;
    if(and__3822__auto____267880) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____267880
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3824__auto____267881 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(or__3824__auto____267881) {
        return or__3824__auto____267881
      }else {
        var or__3824__auto____267882 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____267882) {
          return or__3824__auto____267882
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
void 0;
void 0;
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____267883 = o;
    if(and__3822__auto____267883) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____267883
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____267884 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____267884) {
        return or__3824__auto____267884
      }else {
        var or__3824__auto____267885 = cljs.core._meta["_"];
        if(or__3824__auto____267885) {
          return or__3824__auto____267885
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____267886 = o;
    if(and__3822__auto____267886) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____267886
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3824__auto____267887 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____267887) {
        return or__3824__auto____267887
      }else {
        var or__3824__auto____267888 = cljs.core._with_meta["_"];
        if(or__3824__auto____267888) {
          return or__3824__auto____267888
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
void 0;
void 0;
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____267889 = coll;
      if(and__3822__auto____267889) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____267889
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3824__auto____267890 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____267890) {
          return or__3824__auto____267890
        }else {
          var or__3824__auto____267891 = cljs.core._reduce["_"];
          if(or__3824__auto____267891) {
            return or__3824__auto____267891
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____267892 = coll;
      if(and__3822__auto____267892) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____267892
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3824__auto____267893 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____267893) {
          return or__3824__auto____267893
        }else {
          var or__3824__auto____267894 = cljs.core._reduce["_"];
          if(or__3824__auto____267894) {
            return or__3824__auto____267894
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
void 0;
void 0;
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____267895 = coll;
    if(and__3822__auto____267895) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____267895
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3824__auto____267896 = cljs.core._kv_reduce[goog.typeOf.call(null, coll)];
      if(or__3824__auto____267896) {
        return or__3824__auto____267896
      }else {
        var or__3824__auto____267897 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____267897) {
          return or__3824__auto____267897
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
void 0;
void 0;
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____267898 = o;
    if(and__3822__auto____267898) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____267898
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3824__auto____267899 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(or__3824__auto____267899) {
        return or__3824__auto____267899
      }else {
        var or__3824__auto____267900 = cljs.core._equiv["_"];
        if(or__3824__auto____267900) {
          return or__3824__auto____267900
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
void 0;
void 0;
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____267901 = o;
    if(and__3822__auto____267901) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____267901
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____267902 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(or__3824__auto____267902) {
        return or__3824__auto____267902
      }else {
        var or__3824__auto____267903 = cljs.core._hash["_"];
        if(or__3824__auto____267903) {
          return or__3824__auto____267903
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____267904 = o;
    if(and__3822__auto____267904) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____267904
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____267905 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____267905) {
        return or__3824__auto____267905
      }else {
        var or__3824__auto____267906 = cljs.core._seq["_"];
        if(or__3824__auto____267906) {
          return or__3824__auto____267906
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISequential = {};
void 0;
void 0;
cljs.core.IList = {};
void 0;
void 0;
cljs.core.IRecord = {};
void 0;
void 0;
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____267907 = coll;
    if(and__3822__auto____267907) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____267907
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____267908 = cljs.core._rseq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____267908) {
        return or__3824__auto____267908
      }else {
        var or__3824__auto____267909 = cljs.core._rseq["_"];
        if(or__3824__auto____267909) {
          return or__3824__auto____267909
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____267910 = coll;
    if(and__3822__auto____267910) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____267910
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____267911 = cljs.core._sorted_seq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____267911) {
        return or__3824__auto____267911
      }else {
        var or__3824__auto____267912 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____267912) {
          return or__3824__auto____267912
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____267913 = coll;
    if(and__3822__auto____267913) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____267913
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____267914 = cljs.core._sorted_seq_from[goog.typeOf.call(null, coll)];
      if(or__3824__auto____267914) {
        return or__3824__auto____267914
      }else {
        var or__3824__auto____267915 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____267915) {
          return or__3824__auto____267915
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____267916 = coll;
    if(and__3822__auto____267916) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____267916
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3824__auto____267917 = cljs.core._entry_key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____267917) {
        return or__3824__auto____267917
      }else {
        var or__3824__auto____267918 = cljs.core._entry_key["_"];
        if(or__3824__auto____267918) {
          return or__3824__auto____267918
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____267919 = coll;
    if(and__3822__auto____267919) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____267919
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____267920 = cljs.core._comparator[goog.typeOf.call(null, coll)];
      if(or__3824__auto____267920) {
        return or__3824__auto____267920
      }else {
        var or__3824__auto____267921 = cljs.core._comparator["_"];
        if(or__3824__auto____267921) {
          return or__3824__auto____267921
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____267922 = o;
    if(and__3822__auto____267922) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____267922
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3824__auto____267923 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____267923) {
        return or__3824__auto____267923
      }else {
        var or__3824__auto____267924 = cljs.core._pr_seq["_"];
        if(or__3824__auto____267924) {
          return or__3824__auto____267924
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
void 0;
void 0;
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____267925 = d;
    if(and__3822__auto____267925) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____267925
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3824__auto____267926 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(or__3824__auto____267926) {
        return or__3824__auto____267926
      }else {
        var or__3824__auto____267927 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____267927) {
          return or__3824__auto____267927
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
void 0;
void 0;
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____267928 = this$;
    if(and__3822__auto____267928) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____267928
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3824__auto____267929 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(or__3824__auto____267929) {
        return or__3824__auto____267929
      }else {
        var or__3824__auto____267930 = cljs.core._notify_watches["_"];
        if(or__3824__auto____267930) {
          return or__3824__auto____267930
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____267931 = this$;
    if(and__3822__auto____267931) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____267931
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3824__auto____267932 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____267932) {
        return or__3824__auto____267932
      }else {
        var or__3824__auto____267933 = cljs.core._add_watch["_"];
        if(or__3824__auto____267933) {
          return or__3824__auto____267933
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____267934 = this$;
    if(and__3822__auto____267934) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____267934
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3824__auto____267935 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____267935) {
        return or__3824__auto____267935
      }else {
        var or__3824__auto____267936 = cljs.core._remove_watch["_"];
        if(or__3824__auto____267936) {
          return or__3824__auto____267936
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
void 0;
void 0;
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____267937 = coll;
    if(and__3822__auto____267937) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____267937
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____267938 = cljs.core._as_transient[goog.typeOf.call(null, coll)];
      if(or__3824__auto____267938) {
        return or__3824__auto____267938
      }else {
        var or__3824__auto____267939 = cljs.core._as_transient["_"];
        if(or__3824__auto____267939) {
          return or__3824__auto____267939
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____267940 = tcoll;
    if(and__3822__auto____267940) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____267940
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3824__auto____267941 = cljs.core._conj_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____267941) {
        return or__3824__auto____267941
      }else {
        var or__3824__auto____267942 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____267942) {
          return or__3824__auto____267942
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____267943 = tcoll;
    if(and__3822__auto____267943) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____267943
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____267944 = cljs.core._persistent_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____267944) {
        return or__3824__auto____267944
      }else {
        var or__3824__auto____267945 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____267945) {
          return or__3824__auto____267945
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____267946 = tcoll;
    if(and__3822__auto____267946) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____267946
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3824__auto____267947 = cljs.core._assoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____267947) {
        return or__3824__auto____267947
      }else {
        var or__3824__auto____267948 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____267948) {
          return or__3824__auto____267948
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
void 0;
void 0;
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____267949 = tcoll;
    if(and__3822__auto____267949) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____267949
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3824__auto____267950 = cljs.core._dissoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____267950) {
        return or__3824__auto____267950
      }else {
        var or__3824__auto____267951 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____267951) {
          return or__3824__auto____267951
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
void 0;
void 0;
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____267952 = tcoll;
    if(and__3822__auto____267952) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____267952
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3824__auto____267953 = cljs.core._assoc_n_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____267953) {
        return or__3824__auto____267953
      }else {
        var or__3824__auto____267954 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____267954) {
          return or__3824__auto____267954
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____267955 = tcoll;
    if(and__3822__auto____267955) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____267955
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____267956 = cljs.core._pop_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____267956) {
        return or__3824__auto____267956
      }else {
        var or__3824__auto____267957 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____267957) {
          return or__3824__auto____267957
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____267958 = tcoll;
    if(and__3822__auto____267958) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____267958
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3824__auto____267959 = cljs.core._disjoin_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____267959) {
        return or__3824__auto____267959
      }else {
        var or__3824__auto____267960 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____267960) {
          return or__3824__auto____267960
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
void 0;
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
void 0;
void 0;
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____267961 = x === y;
    if(or__3824__auto____267961) {
      return or__3824__auto____267961
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__267962__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__267963 = y;
            var G__267964 = cljs.core.first.call(null, more);
            var G__267965 = cljs.core.next.call(null, more);
            x = G__267963;
            y = G__267964;
            more = G__267965;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__267962 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__267962__delegate.call(this, x, y, more)
    };
    G__267962.cljs$lang$maxFixedArity = 2;
    G__267962.cljs$lang$applyTo = function(arglist__267966) {
      var x = cljs.core.first(arglist__267966);
      var y = cljs.core.first(cljs.core.next(arglist__267966));
      var more = cljs.core.rest(cljs.core.next(arglist__267966));
      return G__267962__delegate(x, y, more)
    };
    G__267962.cljs$lang$arity$variadic = G__267962__delegate;
    return G__267962
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(function() {
    var or__3824__auto____267967 = x == null;
    if(or__3824__auto____267967) {
      return or__3824__auto____267967
    }else {
      return void 0 === x
    }
  }()) {
    return null
  }else {
    return x.constructor
  }
};
void 0;
void 0;
void 0;
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__267968 = null;
  var G__267968__2 = function(o, k) {
    return null
  };
  var G__267968__3 = function(o, k, not_found) {
    return not_found
  };
  G__267968 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__267968__2.call(this, o, k);
      case 3:
        return G__267968__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__267968
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__267969 = null;
  var G__267969__2 = function(_, f) {
    return f.call(null)
  };
  var G__267969__3 = function(_, f, start) {
    return start
  };
  G__267969 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__267969__2.call(this, _, f);
      case 3:
        return G__267969__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__267969
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__267970 = null;
  var G__267970__2 = function(_, n) {
    return null
  };
  var G__267970__3 = function(_, n, not_found) {
    return not_found
  };
  G__267970 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__267970__2.call(this, _, n);
      case 3:
        return G__267970__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__267970
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  return o === true ? 1 : 0
};
cljs.core.IHash["function"] = true;
cljs.core._hash["function"] = function(o) {
  return goog.getUid.call(null, o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
void 0;
void 0;
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    if(cljs.core._count.call(null, cicoll) === 0) {
      return f.call(null)
    }else {
      var val__267971 = cljs.core._nth.call(null, cicoll, 0);
      var n__267972 = 1;
      while(true) {
        if(n__267972 < cljs.core._count.call(null, cicoll)) {
          var nval__267973 = f.call(null, val__267971, cljs.core._nth.call(null, cicoll, n__267972));
          if(cljs.core.reduced_QMARK_.call(null, nval__267973)) {
            return cljs.core.deref.call(null, nval__267973)
          }else {
            var G__267980 = nval__267973;
            var G__267981 = n__267972 + 1;
            val__267971 = G__267980;
            n__267972 = G__267981;
            continue
          }
        }else {
          return val__267971
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var val__267974 = val;
    var n__267975 = 0;
    while(true) {
      if(n__267975 < cljs.core._count.call(null, cicoll)) {
        var nval__267976 = f.call(null, val__267974, cljs.core._nth.call(null, cicoll, n__267975));
        if(cljs.core.reduced_QMARK_.call(null, nval__267976)) {
          return cljs.core.deref.call(null, nval__267976)
        }else {
          var G__267982 = nval__267976;
          var G__267983 = n__267975 + 1;
          val__267974 = G__267982;
          n__267975 = G__267983;
          continue
        }
      }else {
        return val__267974
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var val__267977 = val;
    var n__267978 = idx;
    while(true) {
      if(n__267978 < cljs.core._count.call(null, cicoll)) {
        var nval__267979 = f.call(null, val__267977, cljs.core._nth.call(null, cicoll, n__267978));
        if(cljs.core.reduced_QMARK_.call(null, nval__267979)) {
          return cljs.core.deref.call(null, nval__267979)
        }else {
          var G__267984 = nval__267979;
          var G__267985 = n__267978 + 1;
          val__267977 = G__267984;
          n__267978 = G__267985;
          continue
        }
      }else {
        return val__267977
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
void 0;
void 0;
void 0;
void 0;
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15990906
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__267986 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__267987 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ASeq$ = true;
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__267988 = this;
  var this$__267989 = this;
  return cljs.core.pr_str.call(null, this$__267989)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__267990 = this;
  if(cljs.core.counted_QMARK_.call(null, this__267990.a)) {
    return cljs.core.ci_reduce.call(null, this__267990.a, f, this__267990.a[this__267990.i], this__267990.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__267990.a[this__267990.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__267991 = this;
  if(cljs.core.counted_QMARK_.call(null, this__267991.a)) {
    return cljs.core.ci_reduce.call(null, this__267991.a, f, start, this__267991.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__267992 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__267993 = this;
  return this__267993.a.length - this__267993.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__267994 = this;
  return this__267994.a[this__267994.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__267995 = this;
  if(this__267995.i + 1 < this__267995.a.length) {
    return new cljs.core.IndexedSeq(this__267995.a, this__267995.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__267996 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__267997 = this;
  var i__267998 = n + this__267997.i;
  if(i__267998 < this__267997.a.length) {
    return this__267997.a[i__267998]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__267999 = this;
  var i__268000 = n + this__267999.i;
  if(i__268000 < this__267999.a.length) {
    return this__267999.a[i__268000]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function prim_seq(prim, i) {
  if(prim.length === 0) {
    return null
  }else {
    return new cljs.core.IndexedSeq(prim, i)
  }
};
cljs.core.array_seq = function array_seq(array, i) {
  return cljs.core.prim_seq.call(null, array, i)
};
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__268001 = null;
  var G__268001__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__268001__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__268001 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__268001__2.call(this, array, f);
      case 3:
        return G__268001__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__268001
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__268002 = null;
  var G__268002__2 = function(array, k) {
    return array[k]
  };
  var G__268002__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__268002 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__268002__2.call(this, array, k);
      case 3:
        return G__268002__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__268002
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__268003 = null;
  var G__268003__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__268003__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__268003 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__268003__2.call(this, array, n);
      case 3:
        return G__268003__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__268003
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.seq = function seq(coll) {
  if(coll != null) {
    if(function() {
      var G__268004__268005 = coll;
      if(G__268004__268005 != null) {
        if(function() {
          var or__3824__auto____268006 = G__268004__268005.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____268006) {
            return or__3824__auto____268006
          }else {
            return G__268004__268005.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__268004__268005.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__268004__268005)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__268004__268005)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  if(coll != null) {
    if(function() {
      var G__268007__268008 = coll;
      if(G__268007__268008 != null) {
        if(function() {
          var or__3824__auto____268009 = G__268007__268008.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____268009) {
            return or__3824__auto____268009
          }else {
            return G__268007__268008.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__268007__268008.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__268007__268008)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__268007__268008)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__268010 = cljs.core.seq.call(null, coll);
      if(s__268010 != null) {
        return cljs.core._first.call(null, s__268010)
      }else {
        return null
      }
    }
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  if(coll != null) {
    if(function() {
      var G__268011__268012 = coll;
      if(G__268011__268012 != null) {
        if(function() {
          var or__3824__auto____268013 = G__268011__268012.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____268013) {
            return or__3824__auto____268013
          }else {
            return G__268011__268012.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__268011__268012.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__268011__268012)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__268011__268012)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__268014 = cljs.core.seq.call(null, coll);
      if(s__268014 != null) {
        return cljs.core._rest.call(null, s__268014)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll != null) {
    if(function() {
      var G__268015__268016 = coll;
      if(G__268015__268016 != null) {
        if(function() {
          var or__3824__auto____268017 = G__268015__268016.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____268017) {
            return or__3824__auto____268017
          }else {
            return G__268015__268016.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__268015__268016.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__268015__268016)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__268015__268016)
      }
    }()) {
      var coll__268018 = cljs.core._rest.call(null, coll);
      if(coll__268018 != null) {
        if(function() {
          var G__268019__268020 = coll__268018;
          if(G__268019__268020 != null) {
            if(function() {
              var or__3824__auto____268021 = G__268019__268020.cljs$lang$protocol_mask$partition0$ & 32;
              if(or__3824__auto____268021) {
                return or__3824__auto____268021
              }else {
                return G__268019__268020.cljs$core$ASeq$
              }
            }()) {
              return true
            }else {
              if(!G__268019__268020.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__268019__268020)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__268019__268020)
          }
        }()) {
          return coll__268018
        }else {
          return cljs.core._seq.call(null, coll__268018)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }else {
    return null
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s))) {
      var G__268022 = cljs.core.next.call(null, s);
      s = G__268022;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__268023__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__268024 = conj.call(null, coll, x);
          var G__268025 = cljs.core.first.call(null, xs);
          var G__268026 = cljs.core.next.call(null, xs);
          coll = G__268024;
          x = G__268025;
          xs = G__268026;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__268023 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__268023__delegate.call(this, coll, x, xs)
    };
    G__268023.cljs$lang$maxFixedArity = 2;
    G__268023.cljs$lang$applyTo = function(arglist__268027) {
      var coll = cljs.core.first(arglist__268027);
      var x = cljs.core.first(cljs.core.next(arglist__268027));
      var xs = cljs.core.rest(cljs.core.next(arglist__268027));
      return G__268023__delegate(coll, x, xs)
    };
    G__268023.cljs$lang$arity$variadic = G__268023__delegate;
    return G__268023
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
void 0;
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll, acc) {
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, coll)) {
      return acc + cljs.core._count.call(null, coll)
    }else {
      var G__268028 = cljs.core.next.call(null, coll);
      var G__268029 = acc + 1;
      coll = G__268028;
      acc = G__268029;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll, 0)
  }
};
void 0;
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(n === 0) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        return cljs.core.first.call(null, coll)
      }else {
        throw new Error("Index out of bounds");
      }
    }else {
      if(cljs.core.indexed_QMARK_.call(null, coll)) {
        return cljs.core._nth.call(null, coll, n)
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
        }else {
          if("\ufdd0'else") {
            throw new Error("Index out of bounds");
          }else {
            return null
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(n === 0) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        return cljs.core.first.call(null, coll)
      }else {
        return not_found
      }
    }else {
      if(cljs.core.indexed_QMARK_.call(null, coll)) {
        return cljs.core._nth.call(null, coll, n, not_found)
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
        }else {
          if("\ufdd0'else") {
            return not_found
          }else {
            return null
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(function() {
      var G__268030__268031 = coll;
      if(G__268030__268031 != null) {
        if(function() {
          var or__3824__auto____268032 = G__268030__268031.cljs$lang$protocol_mask$partition0$ & 16;
          if(or__3824__auto____268032) {
            return or__3824__auto____268032
          }else {
            return G__268030__268031.cljs$core$IIndexed$
          }
        }()) {
          return true
        }else {
          if(!G__268030__268031.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__268030__268031)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__268030__268031)
      }
    }()) {
      return cljs.core._nth.call(null, coll, Math.floor(n))
    }else {
      return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(function() {
      var G__268033__268034 = coll;
      if(G__268033__268034 != null) {
        if(function() {
          var or__3824__auto____268035 = G__268033__268034.cljs$lang$protocol_mask$partition0$ & 16;
          if(or__3824__auto____268035) {
            return or__3824__auto____268035
          }else {
            return G__268033__268034.cljs$core$IIndexed$
          }
        }()) {
          return true
        }else {
          if(!G__268033__268034.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__268033__268034)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__268033__268034)
      }
    }()) {
      return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
    }else {
      return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__268037__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__268036 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__268038 = ret__268036;
          var G__268039 = cljs.core.first.call(null, kvs);
          var G__268040 = cljs.core.second.call(null, kvs);
          var G__268041 = cljs.core.nnext.call(null, kvs);
          coll = G__268038;
          k = G__268039;
          v = G__268040;
          kvs = G__268041;
          continue
        }else {
          return ret__268036
        }
        break
      }
    };
    var G__268037 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__268037__delegate.call(this, coll, k, v, kvs)
    };
    G__268037.cljs$lang$maxFixedArity = 3;
    G__268037.cljs$lang$applyTo = function(arglist__268042) {
      var coll = cljs.core.first(arglist__268042);
      var k = cljs.core.first(cljs.core.next(arglist__268042));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__268042)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__268042)));
      return G__268037__delegate(coll, k, v, kvs)
    };
    G__268037.cljs$lang$arity$variadic = G__268037__delegate;
    return G__268037
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__268044__delegate = function(coll, k, ks) {
      while(true) {
        var ret__268043 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__268045 = ret__268043;
          var G__268046 = cljs.core.first.call(null, ks);
          var G__268047 = cljs.core.next.call(null, ks);
          coll = G__268045;
          k = G__268046;
          ks = G__268047;
          continue
        }else {
          return ret__268043
        }
        break
      }
    };
    var G__268044 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__268044__delegate.call(this, coll, k, ks)
    };
    G__268044.cljs$lang$maxFixedArity = 2;
    G__268044.cljs$lang$applyTo = function(arglist__268048) {
      var coll = cljs.core.first(arglist__268048);
      var k = cljs.core.first(cljs.core.next(arglist__268048));
      var ks = cljs.core.rest(cljs.core.next(arglist__268048));
      return G__268044__delegate(coll, k, ks)
    };
    G__268044.cljs$lang$arity$variadic = G__268044__delegate;
    return G__268044
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__268049__268050 = o;
    if(G__268049__268050 != null) {
      if(function() {
        var or__3824__auto____268051 = G__268049__268050.cljs$lang$protocol_mask$partition0$ & 65536;
        if(or__3824__auto____268051) {
          return or__3824__auto____268051
        }else {
          return G__268049__268050.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__268049__268050.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__268049__268050)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__268049__268050)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__268053__delegate = function(coll, k, ks) {
      while(true) {
        var ret__268052 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__268054 = ret__268052;
          var G__268055 = cljs.core.first.call(null, ks);
          var G__268056 = cljs.core.next.call(null, ks);
          coll = G__268054;
          k = G__268055;
          ks = G__268056;
          continue
        }else {
          return ret__268052
        }
        break
      }
    };
    var G__268053 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__268053__delegate.call(this, coll, k, ks)
    };
    G__268053.cljs$lang$maxFixedArity = 2;
    G__268053.cljs$lang$applyTo = function(arglist__268057) {
      var coll = cljs.core.first(arglist__268057);
      var k = cljs.core.first(cljs.core.next(arglist__268057));
      var ks = cljs.core.rest(cljs.core.next(arglist__268057));
      return G__268053__delegate(coll, k, ks)
    };
    G__268053.cljs$lang$arity$variadic = G__268053__delegate;
    return G__268053
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__268058__268059 = x;
    if(G__268058__268059 != null) {
      if(function() {
        var or__3824__auto____268060 = G__268058__268059.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____268060) {
          return or__3824__auto____268060
        }else {
          return G__268058__268059.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__268058__268059.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__268058__268059)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__268058__268059)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__268061__268062 = x;
    if(G__268061__268062 != null) {
      if(function() {
        var or__3824__auto____268063 = G__268061__268062.cljs$lang$protocol_mask$partition0$ & 2048;
        if(or__3824__auto____268063) {
          return or__3824__auto____268063
        }else {
          return G__268061__268062.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__268061__268062.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__268061__268062)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__268061__268062)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__268064__268065 = x;
  if(G__268064__268065 != null) {
    if(function() {
      var or__3824__auto____268066 = G__268064__268065.cljs$lang$protocol_mask$partition0$ & 256;
      if(or__3824__auto____268066) {
        return or__3824__auto____268066
      }else {
        return G__268064__268065.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__268064__268065.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__268064__268065)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__268064__268065)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__268067__268068 = x;
  if(G__268067__268068 != null) {
    if(function() {
      var or__3824__auto____268069 = G__268067__268068.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____268069) {
        return or__3824__auto____268069
      }else {
        return G__268067__268068.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__268067__268068.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__268067__268068)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__268067__268068)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__268070__268071 = x;
  if(G__268070__268071 != null) {
    if(function() {
      var or__3824__auto____268072 = G__268070__268071.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____268072) {
        return or__3824__auto____268072
      }else {
        return G__268070__268071.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__268070__268071.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__268070__268071)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__268070__268071)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__268073__268074 = x;
  if(G__268073__268074 != null) {
    if(function() {
      var or__3824__auto____268075 = G__268073__268074.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____268075) {
        return or__3824__auto____268075
      }else {
        return G__268073__268074.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__268073__268074.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__268073__268074)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__268073__268074)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__268076__268077 = x;
  if(G__268076__268077 != null) {
    if(function() {
      var or__3824__auto____268078 = G__268076__268077.cljs$lang$protocol_mask$partition0$ & 262144;
      if(or__3824__auto____268078) {
        return or__3824__auto____268078
      }else {
        return G__268076__268077.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__268076__268077.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__268076__268077)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__268076__268077)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__268079__268080 = x;
    if(G__268079__268080 != null) {
      if(function() {
        var or__3824__auto____268081 = G__268079__268080.cljs$lang$protocol_mask$partition0$ & 512;
        if(or__3824__auto____268081) {
          return or__3824__auto____268081
        }else {
          return G__268079__268080.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__268079__268080.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__268079__268080)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__268079__268080)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__268082__268083 = x;
  if(G__268082__268083 != null) {
    if(function() {
      var or__3824__auto____268084 = G__268082__268083.cljs$lang$protocol_mask$partition0$ & 8192;
      if(or__3824__auto____268084) {
        return or__3824__auto____268084
      }else {
        return G__268082__268083.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__268082__268083.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__268082__268083)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__268082__268083)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__268085__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__268085 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__268085__delegate.call(this, keyvals)
    };
    G__268085.cljs$lang$maxFixedArity = 0;
    G__268085.cljs$lang$applyTo = function(arglist__268086) {
      var keyvals = cljs.core.seq(arglist__268086);
      return G__268085__delegate(keyvals)
    };
    G__268085.cljs$lang$arity$variadic = G__268085__delegate;
    return G__268085
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(falsecljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__268087 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__268087.push(key)
  });
  return keys__268087
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__268088 = i;
  var j__268089 = j;
  var len__268090 = len;
  while(true) {
    if(len__268090 === 0) {
      return to
    }else {
      to[j__268089] = from[i__268088];
      var G__268091 = i__268088 + 1;
      var G__268092 = j__268089 + 1;
      var G__268093 = len__268090 - 1;
      i__268088 = G__268091;
      j__268089 = G__268092;
      len__268090 = G__268093;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__268094 = i + (len - 1);
  var j__268095 = j + (len - 1);
  var len__268096 = len;
  while(true) {
    if(len__268096 === 0) {
      return to
    }else {
      to[j__268095] = from[i__268094];
      var G__268097 = i__268094 - 1;
      var G__268098 = j__268095 - 1;
      var G__268099 = len__268096 - 1;
      i__268094 = G__268097;
      j__268095 = G__268098;
      len__268096 = G__268099;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o != null && (o instanceof t || o.constructor === t || t === Object)
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__268100__268101 = s;
    if(G__268100__268101 != null) {
      if(function() {
        var or__3824__auto____268102 = G__268100__268101.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____268102) {
          return or__3824__auto____268102
        }else {
          return G__268100__268101.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__268100__268101.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__268100__268101)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__268100__268101)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__268103__268104 = s;
  if(G__268103__268104 != null) {
    if(function() {
      var or__3824__auto____268105 = G__268103__268104.cljs$lang$protocol_mask$partition0$ & 4194304;
      if(or__3824__auto____268105) {
        return or__3824__auto____268105
      }else {
        return G__268103__268104.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__268103__268104.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__268103__268104)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__268103__268104)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____268106 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____268106)) {
    return cljs.core.not.call(null, function() {
      var or__3824__auto____268107 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____268107) {
        return or__3824__auto____268107
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }())
  }else {
    return and__3822__auto____268106
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____268108 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____268108)) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____268108
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____268109 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____268109)) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____268109
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____268110 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____268110) {
    return or__3824__auto____268110
  }else {
    var G__268111__268112 = f;
    if(G__268111__268112 != null) {
      if(function() {
        var or__3824__auto____268113 = G__268111__268112.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____268113) {
          return or__3824__auto____268113
        }else {
          return G__268111__268112.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__268111__268112.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__268111__268112)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__268111__268112)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____268114 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____268114) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____268114
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____268115 = coll;
    if(cljs.core.truth_(and__3822__auto____268115)) {
      var and__3822__auto____268116 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____268116) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____268116
      }
    }else {
      return and__3822__auto____268115
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___3 = function() {
    var G__268121__delegate = function(x, y, more) {
      if(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))) {
        var s__268117 = cljs.core.set([y, x]);
        var xs__268118 = more;
        while(true) {
          var x__268119 = cljs.core.first.call(null, xs__268118);
          var etc__268120 = cljs.core.next.call(null, xs__268118);
          if(cljs.core.truth_(xs__268118)) {
            if(cljs.core.contains_QMARK_.call(null, s__268117, x__268119)) {
              return false
            }else {
              var G__268122 = cljs.core.conj.call(null, s__268117, x__268119);
              var G__268123 = etc__268120;
              s__268117 = G__268122;
              xs__268118 = G__268123;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__268121 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__268121__delegate.call(this, x, y, more)
    };
    G__268121.cljs$lang$maxFixedArity = 2;
    G__268121.cljs$lang$applyTo = function(arglist__268124) {
      var x = cljs.core.first(arglist__268124);
      var y = cljs.core.first(cljs.core.next(arglist__268124));
      var more = cljs.core.rest(cljs.core.next(arglist__268124));
      return G__268121__delegate(x, y, more)
    };
    G__268121.cljs$lang$arity$variadic = G__268121__delegate;
    return G__268121
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
    return goog.array.defaultCompare.call(null, x, y)
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if("\ufdd0'else") {
          throw new Error("compare on non-nil objects of different types");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__268125 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__268125)) {
        return r__268125
      }else {
        if(cljs.core.truth_(r__268125)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
void 0;
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__268126 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__268126, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__268126)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____268127 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3971__auto____268127)) {
      var s__268128 = temp__3971__auto____268127;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__268128), cljs.core.next.call(null, s__268128))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__268129 = val;
    var coll__268130 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__268130)) {
        var nval__268131 = f.call(null, val__268129, cljs.core.first.call(null, coll__268130));
        if(cljs.core.reduced_QMARK_.call(null, nval__268131)) {
          return cljs.core.deref.call(null, nval__268131)
        }else {
          var G__268132 = nval__268131;
          var G__268133 = cljs.core.next.call(null, coll__268130);
          val__268129 = G__268132;
          coll__268130 = G__268133;
          continue
        }
      }else {
        return val__268129
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__268134__268135 = coll;
      if(G__268134__268135 != null) {
        if(function() {
          var or__3824__auto____268136 = G__268134__268135.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3824__auto____268136) {
            return or__3824__auto____268136
          }else {
            return G__268134__268135.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__268134__268135.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__268134__268135)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__268134__268135)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__268137__268138 = coll;
      if(G__268137__268138 != null) {
        if(function() {
          var or__3824__auto____268139 = G__268137__268138.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3824__auto____268139) {
            return or__3824__auto____268139
          }else {
            return G__268137__268138.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__268137__268138.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__268137__268138)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__268137__268138)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16384
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$ = true;
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__268140 = this;
  return this__268140.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__268141__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__268141 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__268141__delegate.call(this, x, y, more)
    };
    G__268141.cljs$lang$maxFixedArity = 2;
    G__268141.cljs$lang$applyTo = function(arglist__268142) {
      var x = cljs.core.first(arglist__268142);
      var y = cljs.core.first(cljs.core.next(arglist__268142));
      var more = cljs.core.rest(cljs.core.next(arglist__268142));
      return G__268141__delegate(x, y, more)
    };
    G__268141.cljs$lang$arity$variadic = G__268141__delegate;
    return G__268141
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__268143__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__268143 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__268143__delegate.call(this, x, y, more)
    };
    G__268143.cljs$lang$maxFixedArity = 2;
    G__268143.cljs$lang$applyTo = function(arglist__268144) {
      var x = cljs.core.first(arglist__268144);
      var y = cljs.core.first(cljs.core.next(arglist__268144));
      var more = cljs.core.rest(cljs.core.next(arglist__268144));
      return G__268143__delegate(x, y, more)
    };
    G__268143.cljs$lang$arity$variadic = G__268143__delegate;
    return G__268143
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__268145__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__268145 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__268145__delegate.call(this, x, y, more)
    };
    G__268145.cljs$lang$maxFixedArity = 2;
    G__268145.cljs$lang$applyTo = function(arglist__268146) {
      var x = cljs.core.first(arglist__268146);
      var y = cljs.core.first(cljs.core.next(arglist__268146));
      var more = cljs.core.rest(cljs.core.next(arglist__268146));
      return G__268145__delegate(x, y, more)
    };
    G__268145.cljs$lang$arity$variadic = G__268145__delegate;
    return G__268145
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__268147__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__268147 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__268147__delegate.call(this, x, y, more)
    };
    G__268147.cljs$lang$maxFixedArity = 2;
    G__268147.cljs$lang$applyTo = function(arglist__268148) {
      var x = cljs.core.first(arglist__268148);
      var y = cljs.core.first(cljs.core.next(arglist__268148));
      var more = cljs.core.rest(cljs.core.next(arglist__268148));
      return G__268147__delegate(x, y, more)
    };
    G__268147.cljs$lang$arity$variadic = G__268147__delegate;
    return G__268147
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__268149__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__268150 = y;
            var G__268151 = cljs.core.first.call(null, more);
            var G__268152 = cljs.core.next.call(null, more);
            x = G__268150;
            y = G__268151;
            more = G__268152;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__268149 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__268149__delegate.call(this, x, y, more)
    };
    G__268149.cljs$lang$maxFixedArity = 2;
    G__268149.cljs$lang$applyTo = function(arglist__268153) {
      var x = cljs.core.first(arglist__268153);
      var y = cljs.core.first(cljs.core.next(arglist__268153));
      var more = cljs.core.rest(cljs.core.next(arglist__268153));
      return G__268149__delegate(x, y, more)
    };
    G__268149.cljs$lang$arity$variadic = G__268149__delegate;
    return G__268149
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__268154__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__268155 = y;
            var G__268156 = cljs.core.first.call(null, more);
            var G__268157 = cljs.core.next.call(null, more);
            x = G__268155;
            y = G__268156;
            more = G__268157;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__268154 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__268154__delegate.call(this, x, y, more)
    };
    G__268154.cljs$lang$maxFixedArity = 2;
    G__268154.cljs$lang$applyTo = function(arglist__268158) {
      var x = cljs.core.first(arglist__268158);
      var y = cljs.core.first(cljs.core.next(arglist__268158));
      var more = cljs.core.rest(cljs.core.next(arglist__268158));
      return G__268154__delegate(x, y, more)
    };
    G__268154.cljs$lang$arity$variadic = G__268154__delegate;
    return G__268154
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__268159__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__268160 = y;
            var G__268161 = cljs.core.first.call(null, more);
            var G__268162 = cljs.core.next.call(null, more);
            x = G__268160;
            y = G__268161;
            more = G__268162;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__268159 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__268159__delegate.call(this, x, y, more)
    };
    G__268159.cljs$lang$maxFixedArity = 2;
    G__268159.cljs$lang$applyTo = function(arglist__268163) {
      var x = cljs.core.first(arglist__268163);
      var y = cljs.core.first(cljs.core.next(arglist__268163));
      var more = cljs.core.rest(cljs.core.next(arglist__268163));
      return G__268159__delegate(x, y, more)
    };
    G__268159.cljs$lang$arity$variadic = G__268159__delegate;
    return G__268159
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__268164__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__268165 = y;
            var G__268166 = cljs.core.first.call(null, more);
            var G__268167 = cljs.core.next.call(null, more);
            x = G__268165;
            y = G__268166;
            more = G__268167;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__268164 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__268164__delegate.call(this, x, y, more)
    };
    G__268164.cljs$lang$maxFixedArity = 2;
    G__268164.cljs$lang$applyTo = function(arglist__268168) {
      var x = cljs.core.first(arglist__268168);
      var y = cljs.core.first(cljs.core.next(arglist__268168));
      var more = cljs.core.rest(cljs.core.next(arglist__268168));
      return G__268164__delegate(x, y, more)
    };
    G__268164.cljs$lang$arity$variadic = G__268164__delegate;
    return G__268164
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__268169__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__268169 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__268169__delegate.call(this, x, y, more)
    };
    G__268169.cljs$lang$maxFixedArity = 2;
    G__268169.cljs$lang$applyTo = function(arglist__268170) {
      var x = cljs.core.first(arglist__268170);
      var y = cljs.core.first(cljs.core.next(arglist__268170));
      var more = cljs.core.rest(cljs.core.next(arglist__268170));
      return G__268169__delegate(x, y, more)
    };
    G__268169.cljs$lang$arity$variadic = G__268169__delegate;
    return G__268169
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__268171__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__268171 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__268171__delegate.call(this, x, y, more)
    };
    G__268171.cljs$lang$maxFixedArity = 2;
    G__268171.cljs$lang$applyTo = function(arglist__268172) {
      var x = cljs.core.first(arglist__268172);
      var y = cljs.core.first(cljs.core.next(arglist__268172));
      var more = cljs.core.rest(cljs.core.next(arglist__268172));
      return G__268171__delegate(x, y, more)
    };
    G__268171.cljs$lang$arity$variadic = G__268171__delegate;
    return G__268171
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__268173 = n % d;
  return cljs.core.fix.call(null, (n - rem__268173) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__268174 = cljs.core.quot.call(null, n, d);
  return n - d * q__268174
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(n) {
  var c__268175 = 0;
  var n__268176 = n;
  while(true) {
    if(n__268176 === 0) {
      return c__268175
    }else {
      var G__268177 = c__268175 + 1;
      var G__268178 = n__268176 & n__268176 - 1;
      c__268175 = G__268177;
      n__268176 = G__268178;
      continue
    }
    break
  }
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__268179__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__268180 = y;
            var G__268181 = cljs.core.first.call(null, more);
            var G__268182 = cljs.core.next.call(null, more);
            x = G__268180;
            y = G__268181;
            more = G__268182;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__268179 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__268179__delegate.call(this, x, y, more)
    };
    G__268179.cljs$lang$maxFixedArity = 2;
    G__268179.cljs$lang$applyTo = function(arglist__268183) {
      var x = cljs.core.first(arglist__268183);
      var y = cljs.core.first(cljs.core.next(arglist__268183));
      var more = cljs.core.rest(cljs.core.next(arglist__268183));
      return G__268179__delegate(x, y, more)
    };
    G__268179.cljs$lang$arity$variadic = G__268179__delegate;
    return G__268179
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__268184 = n;
  var xs__268185 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____268186 = xs__268185;
      if(cljs.core.truth_(and__3822__auto____268186)) {
        return n__268184 > 0
      }else {
        return and__3822__auto____268186
      }
    }())) {
      var G__268187 = n__268184 - 1;
      var G__268188 = cljs.core.next.call(null, xs__268185);
      n__268184 = G__268187;
      xs__268185 = G__268188;
      continue
    }else {
      return xs__268185
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__268189__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__268190 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__268191 = cljs.core.next.call(null, more);
            sb = G__268190;
            more = G__268191;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__268189 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__268189__delegate.call(this, x, ys)
    };
    G__268189.cljs$lang$maxFixedArity = 1;
    G__268189.cljs$lang$applyTo = function(arglist__268192) {
      var x = cljs.core.first(arglist__268192);
      var ys = cljs.core.rest(arglist__268192);
      return G__268189__delegate(x, ys)
    };
    G__268189.cljs$lang$arity$variadic = G__268189__delegate;
    return G__268189
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__268193__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__268194 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__268195 = cljs.core.next.call(null, more);
            sb = G__268194;
            more = G__268195;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__268193 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__268193__delegate.call(this, x, ys)
    };
    G__268193.cljs$lang$maxFixedArity = 1;
    G__268193.cljs$lang$applyTo = function(arglist__268196) {
      var x = cljs.core.first(arglist__268196);
      var ys = cljs.core.rest(arglist__268196);
      return G__268193__delegate(x, ys)
    };
    G__268193.cljs$lang$arity$variadic = G__268193__delegate;
    return G__268193
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__268197 = cljs.core.seq.call(null, x);
    var ys__268198 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__268197 == null) {
        return ys__268198 == null
      }else {
        if(ys__268198 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__268197), cljs.core.first.call(null, ys__268198))) {
            var G__268199 = cljs.core.next.call(null, xs__268197);
            var G__268200 = cljs.core.next.call(null, ys__268198);
            xs__268197 = G__268199;
            ys__268198 = G__268200;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__268201_SHARP_, p2__268202_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__268201_SHARP_, cljs.core.hash.call(null, p2__268202_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__268203 = 0;
  var s__268204 = cljs.core.seq.call(null, m);
  while(true) {
    if(cljs.core.truth_(s__268204)) {
      var e__268205 = cljs.core.first.call(null, s__268204);
      var G__268206 = (h__268203 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__268205)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__268205)))) % 4503599627370496;
      var G__268207 = cljs.core.next.call(null, s__268204);
      h__268203 = G__268206;
      s__268204 = G__268207;
      continue
    }else {
      return h__268203
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__268208 = 0;
  var s__268209 = cljs.core.seq.call(null, s);
  while(true) {
    if(cljs.core.truth_(s__268209)) {
      var e__268210 = cljs.core.first.call(null, s__268209);
      var G__268211 = (h__268208 + cljs.core.hash.call(null, e__268210)) % 4503599627370496;
      var G__268212 = cljs.core.next.call(null, s__268209);
      h__268208 = G__268211;
      s__268209 = G__268212;
      continue
    }else {
      return h__268208
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__268213__268214 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__268213__268214)) {
    var G__268216__268218 = cljs.core.first.call(null, G__268213__268214);
    var vec__268217__268219 = G__268216__268218;
    var key_name__268220 = cljs.core.nth.call(null, vec__268217__268219, 0, null);
    var f__268221 = cljs.core.nth.call(null, vec__268217__268219, 1, null);
    var G__268213__268222 = G__268213__268214;
    var G__268216__268223 = G__268216__268218;
    var G__268213__268224 = G__268213__268222;
    while(true) {
      var vec__268225__268226 = G__268216__268223;
      var key_name__268227 = cljs.core.nth.call(null, vec__268225__268226, 0, null);
      var f__268228 = cljs.core.nth.call(null, vec__268225__268226, 1, null);
      var G__268213__268229 = G__268213__268224;
      var str_name__268230 = cljs.core.name.call(null, key_name__268227);
      obj[str_name__268230] = f__268228;
      var temp__3974__auto____268231 = cljs.core.next.call(null, G__268213__268229);
      if(cljs.core.truth_(temp__3974__auto____268231)) {
        var G__268213__268232 = temp__3974__auto____268231;
        var G__268233 = cljs.core.first.call(null, G__268213__268232);
        var G__268234 = G__268213__268232;
        G__268216__268223 = G__268233;
        G__268213__268224 = G__268234;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32706670
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__268235 = this;
  var h__364__auto____268236 = this__268235.__hash;
  if(h__364__auto____268236 != null) {
    return h__364__auto____268236
  }else {
    var h__364__auto____268237 = cljs.core.hash_coll.call(null, coll);
    this__268235.__hash = h__364__auto____268237;
    return h__364__auto____268237
  }
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__268238 = this;
  return new cljs.core.List(this__268238.meta, o, coll, this__268238.count + 1, null)
};
cljs.core.List.prototype.cljs$core$ASeq$ = true;
cljs.core.List.prototype.toString = function() {
  var this__268239 = this;
  var this$__268240 = this;
  return cljs.core.pr_str.call(null, this$__268240)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__268241 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__268242 = this;
  return this__268242.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__268243 = this;
  return this__268243.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__268244 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__268245 = this;
  return this__268245.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__268246 = this;
  return this__268246.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__268247 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__268248 = this;
  return new cljs.core.List(meta, this__268248.first, this__268248.rest, this__268248.count, this__268248.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__268249 = this;
  return this__268249.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__268250 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List.prototype.cljs$core$IList$ = true;
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32706638
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__268251 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__268252 = this;
  return new cljs.core.List(this__268252.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__268253 = this;
  var this$__268254 = this;
  return cljs.core.pr_str.call(null, this$__268254)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__268255 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__268256 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__268257 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__268258 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__268259 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__268260 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__268261 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__268262 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__268263 = this;
  return this__268263.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__268264 = this;
  return coll
};
cljs.core.EmptyList.prototype.cljs$core$IList$ = true;
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__268265__268266 = coll;
  if(G__268265__268266 != null) {
    if(function() {
      var or__3824__auto____268267 = G__268265__268266.cljs$lang$protocol_mask$partition0$ & 67108864;
      if(or__3824__auto____268267) {
        return or__3824__auto____268267
      }else {
        return G__268265__268266.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__268265__268266.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__268265__268266)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__268265__268266)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
cljs.core.list = function() {
  var list__delegate = function(items) {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items))
  };
  var list = function(var_args) {
    var items = null;
    if(goog.isDef(var_args)) {
      items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, items)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__268268) {
    var items = cljs.core.seq(arglist__268268);
    return list__delegate(items)
  };
  list.cljs$lang$arity$variadic = list__delegate;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32702572
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__268269 = this;
  var h__364__auto____268270 = this__268269.__hash;
  if(h__364__auto____268270 != null) {
    return h__364__auto____268270
  }else {
    var h__364__auto____268271 = cljs.core.hash_coll.call(null, coll);
    this__268269.__hash = h__364__auto____268271;
    return h__364__auto____268271
  }
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__268272 = this;
  return new cljs.core.Cons(null, o, coll, this__268272.__hash)
};
cljs.core.Cons.prototype.cljs$core$ASeq$ = true;
cljs.core.Cons.prototype.toString = function() {
  var this__268273 = this;
  var this$__268274 = this;
  return cljs.core.pr_str.call(null, this$__268274)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__268275 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__268276 = this;
  return this__268276.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__268277 = this;
  if(this__268277.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__268277.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__268278 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__268279 = this;
  return new cljs.core.Cons(meta, this__268279.first, this__268279.rest, this__268279.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__268280 = this;
  return this__268280.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__268281 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__268281.meta)
};
cljs.core.Cons.prototype.cljs$core$IList$ = true;
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____268282 = coll == null;
    if(or__3824__auto____268282) {
      return or__3824__auto____268282
    }else {
      var G__268283__268284 = coll;
      if(G__268283__268284 != null) {
        if(function() {
          var or__3824__auto____268285 = G__268283__268284.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____268285) {
            return or__3824__auto____268285
          }else {
            return G__268283__268284.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__268283__268284.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__268283__268284)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__268283__268284)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__268286__268287 = x;
  if(G__268286__268287 != null) {
    if(function() {
      var or__3824__auto____268288 = G__268286__268287.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____268288) {
        return or__3824__auto____268288
      }else {
        return G__268286__268287.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__268286__268287.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__268286__268287)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__268286__268287)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__268289 = null;
  var G__268289__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__268289__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__268289 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__268289__2.call(this, string, f);
      case 3:
        return G__268289__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__268289
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__268290 = null;
  var G__268290__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__268290__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__268290 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__268290__2.call(this, string, k);
      case 3:
        return G__268290__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__268290
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__268291 = null;
  var G__268291__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__268291__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__268291 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__268291__2.call(this, string, n);
      case 3:
        return G__268291__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__268291
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode.call(null, o)
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__268300 = null;
  var G__268300__2 = function(tsym268294, coll) {
    var tsym268294__268296 = this;
    var this$__268297 = tsym268294__268296;
    return cljs.core.get.call(null, coll, this$__268297.toString())
  };
  var G__268300__3 = function(tsym268295, coll, not_found) {
    var tsym268295__268298 = this;
    var this$__268299 = tsym268295__268298;
    return cljs.core.get.call(null, coll, this$__268299.toString(), not_found)
  };
  G__268300 = function(tsym268295, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__268300__2.call(this, tsym268295, coll);
      case 3:
        return G__268300__3.call(this, tsym268295, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__268300
}();
String.prototype.apply = function(tsym268292, args268293) {
  return tsym268292.call.apply(tsym268292, [tsym268292].concat(cljs.core.aclone.call(null, args268293)))
};
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__268301 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__268301
  }else {
    lazy_seq.x = x__268301.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__268302 = this;
  var h__364__auto____268303 = this__268302.__hash;
  if(h__364__auto____268303 != null) {
    return h__364__auto____268303
  }else {
    var h__364__auto____268304 = cljs.core.hash_coll.call(null, coll);
    this__268302.__hash = h__364__auto____268304;
    return h__364__auto____268304
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__268305 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__268306 = this;
  var this$__268307 = this;
  return cljs.core.pr_str.call(null, this$__268307)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__268308 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__268309 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__268310 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__268311 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__268312 = this;
  return new cljs.core.LazySeq(meta, this__268312.realized, this__268312.x, this__268312.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__268313 = this;
  return this__268313.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__268314 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__268314.meta)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__268315 = [];
  var s__268316 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__268316))) {
      ary__268315.push(cljs.core.first.call(null, s__268316));
      var G__268317 = cljs.core.next.call(null, s__268316);
      s__268316 = G__268317;
      continue
    }else {
      return ary__268315
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__268318 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__268319 = 0;
  var xs__268320 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(xs__268320)) {
      ret__268318[i__268319] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__268320));
      var G__268321 = i__268319 + 1;
      var G__268322 = cljs.core.next.call(null, xs__268320);
      i__268319 = G__268321;
      xs__268320 = G__268322;
      continue
    }else {
    }
    break
  }
  return ret__268318
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__268323 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__268324 = cljs.core.seq.call(null, init_val_or_seq);
      var i__268325 = 0;
      var s__268326 = s__268324;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____268327 = s__268326;
          if(cljs.core.truth_(and__3822__auto____268327)) {
            return i__268325 < size
          }else {
            return and__3822__auto____268327
          }
        }())) {
          a__268323[i__268325] = cljs.core.first.call(null, s__268326);
          var G__268330 = i__268325 + 1;
          var G__268331 = cljs.core.next.call(null, s__268326);
          i__268325 = G__268330;
          s__268326 = G__268331;
          continue
        }else {
          return a__268323
        }
        break
      }
    }else {
      var n__653__auto____268328 = size;
      var i__268329 = 0;
      while(true) {
        if(i__268329 < n__653__auto____268328) {
          a__268323[i__268329] = init_val_or_seq;
          var G__268332 = i__268329 + 1;
          i__268329 = G__268332;
          continue
        }else {
        }
        break
      }
      return a__268323
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__268333 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__268334 = cljs.core.seq.call(null, init_val_or_seq);
      var i__268335 = 0;
      var s__268336 = s__268334;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____268337 = s__268336;
          if(cljs.core.truth_(and__3822__auto____268337)) {
            return i__268335 < size
          }else {
            return and__3822__auto____268337
          }
        }())) {
          a__268333[i__268335] = cljs.core.first.call(null, s__268336);
          var G__268340 = i__268335 + 1;
          var G__268341 = cljs.core.next.call(null, s__268336);
          i__268335 = G__268340;
          s__268336 = G__268341;
          continue
        }else {
          return a__268333
        }
        break
      }
    }else {
      var n__653__auto____268338 = size;
      var i__268339 = 0;
      while(true) {
        if(i__268339 < n__653__auto____268338) {
          a__268333[i__268339] = init_val_or_seq;
          var G__268342 = i__268339 + 1;
          i__268339 = G__268342;
          continue
        }else {
        }
        break
      }
      return a__268333
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__268343 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__268344 = cljs.core.seq.call(null, init_val_or_seq);
      var i__268345 = 0;
      var s__268346 = s__268344;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____268347 = s__268346;
          if(cljs.core.truth_(and__3822__auto____268347)) {
            return i__268345 < size
          }else {
            return and__3822__auto____268347
          }
        }())) {
          a__268343[i__268345] = cljs.core.first.call(null, s__268346);
          var G__268350 = i__268345 + 1;
          var G__268351 = cljs.core.next.call(null, s__268346);
          i__268345 = G__268350;
          s__268346 = G__268351;
          continue
        }else {
          return a__268343
        }
        break
      }
    }else {
      var n__653__auto____268348 = size;
      var i__268349 = 0;
      while(true) {
        if(i__268349 < n__653__auto____268348) {
          a__268343[i__268349] = init_val_or_seq;
          var G__268352 = i__268349 + 1;
          i__268349 = G__268352;
          continue
        }else {
        }
        break
      }
      return a__268343
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__268353 = s;
    var i__268354 = n;
    var sum__268355 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____268356 = i__268354 > 0;
        if(and__3822__auto____268356) {
          return cljs.core.seq.call(null, s__268353)
        }else {
          return and__3822__auto____268356
        }
      }())) {
        var G__268357 = cljs.core.next.call(null, s__268353);
        var G__268358 = i__268354 - 1;
        var G__268359 = sum__268355 + 1;
        s__268353 = G__268357;
        i__268354 = G__268358;
        sum__268355 = G__268359;
        continue
      }else {
        return sum__268355
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__268360 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__268360)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__268360), concat.call(null, cljs.core.rest.call(null, s__268360), y))
      }else {
        return y
      }
    })
  };
  var concat__3 = function() {
    var G__268363__delegate = function(x, y, zs) {
      var cat__268362 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__268361 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__268361)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__268361), cat.call(null, cljs.core.rest.call(null, xys__268361), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__268362.call(null, concat.call(null, x, y), zs)
    };
    var G__268363 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__268363__delegate.call(this, x, y, zs)
    };
    G__268363.cljs$lang$maxFixedArity = 2;
    G__268363.cljs$lang$applyTo = function(arglist__268364) {
      var x = cljs.core.first(arglist__268364);
      var y = cljs.core.first(cljs.core.next(arglist__268364));
      var zs = cljs.core.rest(cljs.core.next(arglist__268364));
      return G__268363__delegate(x, y, zs)
    };
    G__268363.cljs$lang$arity$variadic = G__268363__delegate;
    return G__268363
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__268365__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__268365 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__268365__delegate.call(this, a, b, c, d, more)
    };
    G__268365.cljs$lang$maxFixedArity = 4;
    G__268365.cljs$lang$applyTo = function(arglist__268366) {
      var a = cljs.core.first(arglist__268366);
      var b = cljs.core.first(cljs.core.next(arglist__268366));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__268366)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__268366))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__268366))));
      return G__268365__delegate(a, b, c, d, more)
    };
    G__268365.cljs$lang$arity$variadic = G__268365__delegate;
    return G__268365
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
void 0;
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__268367 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__268368 = cljs.core._first.call(null, args__268367);
    var args__268369 = cljs.core._rest.call(null, args__268367);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__268368)
      }else {
        return f.call(null, a__268368)
      }
    }else {
      var b__268370 = cljs.core._first.call(null, args__268369);
      var args__268371 = cljs.core._rest.call(null, args__268369);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__268368, b__268370)
        }else {
          return f.call(null, a__268368, b__268370)
        }
      }else {
        var c__268372 = cljs.core._first.call(null, args__268371);
        var args__268373 = cljs.core._rest.call(null, args__268371);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__268368, b__268370, c__268372)
          }else {
            return f.call(null, a__268368, b__268370, c__268372)
          }
        }else {
          var d__268374 = cljs.core._first.call(null, args__268373);
          var args__268375 = cljs.core._rest.call(null, args__268373);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__268368, b__268370, c__268372, d__268374)
            }else {
              return f.call(null, a__268368, b__268370, c__268372, d__268374)
            }
          }else {
            var e__268376 = cljs.core._first.call(null, args__268375);
            var args__268377 = cljs.core._rest.call(null, args__268375);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__268368, b__268370, c__268372, d__268374, e__268376)
              }else {
                return f.call(null, a__268368, b__268370, c__268372, d__268374, e__268376)
              }
            }else {
              var f__268378 = cljs.core._first.call(null, args__268377);
              var args__268379 = cljs.core._rest.call(null, args__268377);
              if(argc === 6) {
                if(f__268378.cljs$lang$arity$6) {
                  return f__268378.cljs$lang$arity$6(a__268368, b__268370, c__268372, d__268374, e__268376, f__268378)
                }else {
                  return f__268378.call(null, a__268368, b__268370, c__268372, d__268374, e__268376, f__268378)
                }
              }else {
                var g__268380 = cljs.core._first.call(null, args__268379);
                var args__268381 = cljs.core._rest.call(null, args__268379);
                if(argc === 7) {
                  if(f__268378.cljs$lang$arity$7) {
                    return f__268378.cljs$lang$arity$7(a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380)
                  }else {
                    return f__268378.call(null, a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380)
                  }
                }else {
                  var h__268382 = cljs.core._first.call(null, args__268381);
                  var args__268383 = cljs.core._rest.call(null, args__268381);
                  if(argc === 8) {
                    if(f__268378.cljs$lang$arity$8) {
                      return f__268378.cljs$lang$arity$8(a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382)
                    }else {
                      return f__268378.call(null, a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382)
                    }
                  }else {
                    var i__268384 = cljs.core._first.call(null, args__268383);
                    var args__268385 = cljs.core._rest.call(null, args__268383);
                    if(argc === 9) {
                      if(f__268378.cljs$lang$arity$9) {
                        return f__268378.cljs$lang$arity$9(a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384)
                      }else {
                        return f__268378.call(null, a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384)
                      }
                    }else {
                      var j__268386 = cljs.core._first.call(null, args__268385);
                      var args__268387 = cljs.core._rest.call(null, args__268385);
                      if(argc === 10) {
                        if(f__268378.cljs$lang$arity$10) {
                          return f__268378.cljs$lang$arity$10(a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384, j__268386)
                        }else {
                          return f__268378.call(null, a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384, j__268386)
                        }
                      }else {
                        var k__268388 = cljs.core._first.call(null, args__268387);
                        var args__268389 = cljs.core._rest.call(null, args__268387);
                        if(argc === 11) {
                          if(f__268378.cljs$lang$arity$11) {
                            return f__268378.cljs$lang$arity$11(a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384, j__268386, k__268388)
                          }else {
                            return f__268378.call(null, a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384, j__268386, k__268388)
                          }
                        }else {
                          var l__268390 = cljs.core._first.call(null, args__268389);
                          var args__268391 = cljs.core._rest.call(null, args__268389);
                          if(argc === 12) {
                            if(f__268378.cljs$lang$arity$12) {
                              return f__268378.cljs$lang$arity$12(a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384, j__268386, k__268388, l__268390)
                            }else {
                              return f__268378.call(null, a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384, j__268386, k__268388, l__268390)
                            }
                          }else {
                            var m__268392 = cljs.core._first.call(null, args__268391);
                            var args__268393 = cljs.core._rest.call(null, args__268391);
                            if(argc === 13) {
                              if(f__268378.cljs$lang$arity$13) {
                                return f__268378.cljs$lang$arity$13(a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384, j__268386, k__268388, l__268390, m__268392)
                              }else {
                                return f__268378.call(null, a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384, j__268386, k__268388, l__268390, m__268392)
                              }
                            }else {
                              var n__268394 = cljs.core._first.call(null, args__268393);
                              var args__268395 = cljs.core._rest.call(null, args__268393);
                              if(argc === 14) {
                                if(f__268378.cljs$lang$arity$14) {
                                  return f__268378.cljs$lang$arity$14(a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384, j__268386, k__268388, l__268390, m__268392, n__268394)
                                }else {
                                  return f__268378.call(null, a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384, j__268386, k__268388, l__268390, m__268392, n__268394)
                                }
                              }else {
                                var o__268396 = cljs.core._first.call(null, args__268395);
                                var args__268397 = cljs.core._rest.call(null, args__268395);
                                if(argc === 15) {
                                  if(f__268378.cljs$lang$arity$15) {
                                    return f__268378.cljs$lang$arity$15(a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384, j__268386, k__268388, l__268390, m__268392, n__268394, o__268396)
                                  }else {
                                    return f__268378.call(null, a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384, j__268386, k__268388, l__268390, m__268392, n__268394, o__268396)
                                  }
                                }else {
                                  var p__268398 = cljs.core._first.call(null, args__268397);
                                  var args__268399 = cljs.core._rest.call(null, args__268397);
                                  if(argc === 16) {
                                    if(f__268378.cljs$lang$arity$16) {
                                      return f__268378.cljs$lang$arity$16(a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384, j__268386, k__268388, l__268390, m__268392, n__268394, o__268396, p__268398)
                                    }else {
                                      return f__268378.call(null, a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384, j__268386, k__268388, l__268390, m__268392, n__268394, o__268396, p__268398)
                                    }
                                  }else {
                                    var q__268400 = cljs.core._first.call(null, args__268399);
                                    var args__268401 = cljs.core._rest.call(null, args__268399);
                                    if(argc === 17) {
                                      if(f__268378.cljs$lang$arity$17) {
                                        return f__268378.cljs$lang$arity$17(a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384, j__268386, k__268388, l__268390, m__268392, n__268394, o__268396, p__268398, q__268400)
                                      }else {
                                        return f__268378.call(null, a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384, j__268386, k__268388, l__268390, m__268392, n__268394, o__268396, p__268398, q__268400)
                                      }
                                    }else {
                                      var r__268402 = cljs.core._first.call(null, args__268401);
                                      var args__268403 = cljs.core._rest.call(null, args__268401);
                                      if(argc === 18) {
                                        if(f__268378.cljs$lang$arity$18) {
                                          return f__268378.cljs$lang$arity$18(a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384, j__268386, k__268388, l__268390, m__268392, n__268394, o__268396, p__268398, q__268400, r__268402)
                                        }else {
                                          return f__268378.call(null, a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384, j__268386, k__268388, l__268390, m__268392, n__268394, o__268396, p__268398, q__268400, r__268402)
                                        }
                                      }else {
                                        var s__268404 = cljs.core._first.call(null, args__268403);
                                        var args__268405 = cljs.core._rest.call(null, args__268403);
                                        if(argc === 19) {
                                          if(f__268378.cljs$lang$arity$19) {
                                            return f__268378.cljs$lang$arity$19(a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384, j__268386, k__268388, l__268390, m__268392, n__268394, o__268396, p__268398, q__268400, r__268402, s__268404)
                                          }else {
                                            return f__268378.call(null, a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384, j__268386, k__268388, l__268390, m__268392, n__268394, o__268396, p__268398, q__268400, r__268402, s__268404)
                                          }
                                        }else {
                                          var t__268406 = cljs.core._first.call(null, args__268405);
                                          var args__268407 = cljs.core._rest.call(null, args__268405);
                                          if(argc === 20) {
                                            if(f__268378.cljs$lang$arity$20) {
                                              return f__268378.cljs$lang$arity$20(a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384, j__268386, k__268388, l__268390, m__268392, n__268394, o__268396, p__268398, q__268400, r__268402, s__268404, t__268406)
                                            }else {
                                              return f__268378.call(null, a__268368, b__268370, c__268372, d__268374, e__268376, f__268378, g__268380, h__268382, i__268384, j__268386, k__268388, l__268390, m__268392, n__268394, o__268396, p__268398, q__268400, r__268402, s__268404, t__268406)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
void 0;
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__268408 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__268409 = cljs.core.bounded_count.call(null, args, fixed_arity__268408 + 1);
      if(bc__268409 <= fixed_arity__268408) {
        return cljs.core.apply_to.call(null, f, bc__268409, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__268410 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__268411 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__268412 = cljs.core.bounded_count.call(null, arglist__268410, fixed_arity__268411 + 1);
      if(bc__268412 <= fixed_arity__268411) {
        return cljs.core.apply_to.call(null, f, bc__268412, arglist__268410)
      }else {
        return f.cljs$lang$applyTo(arglist__268410)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__268410))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__268413 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__268414 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__268415 = cljs.core.bounded_count.call(null, arglist__268413, fixed_arity__268414 + 1);
      if(bc__268415 <= fixed_arity__268414) {
        return cljs.core.apply_to.call(null, f, bc__268415, arglist__268413)
      }else {
        return f.cljs$lang$applyTo(arglist__268413)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__268413))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__268416 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__268417 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__268418 = cljs.core.bounded_count.call(null, arglist__268416, fixed_arity__268417 + 1);
      if(bc__268418 <= fixed_arity__268417) {
        return cljs.core.apply_to.call(null, f, bc__268418, arglist__268416)
      }else {
        return f.cljs$lang$applyTo(arglist__268416)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__268416))
    }
  };
  var apply__6 = function() {
    var G__268422__delegate = function(f, a, b, c, d, args) {
      var arglist__268419 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__268420 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__268421 = cljs.core.bounded_count.call(null, arglist__268419, fixed_arity__268420 + 1);
        if(bc__268421 <= fixed_arity__268420) {
          return cljs.core.apply_to.call(null, f, bc__268421, arglist__268419)
        }else {
          return f.cljs$lang$applyTo(arglist__268419)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__268419))
      }
    };
    var G__268422 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__268422__delegate.call(this, f, a, b, c, d, args)
    };
    G__268422.cljs$lang$maxFixedArity = 5;
    G__268422.cljs$lang$applyTo = function(arglist__268423) {
      var f = cljs.core.first(arglist__268423);
      var a = cljs.core.first(cljs.core.next(arglist__268423));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__268423)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__268423))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__268423)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__268423)))));
      return G__268422__delegate(f, a, b, c, d, args)
    };
    G__268422.cljs$lang$arity$variadic = G__268422__delegate;
    return G__268422
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__268424) {
    var obj = cljs.core.first(arglist__268424);
    var f = cljs.core.first(cljs.core.next(arglist__268424));
    var args = cljs.core.rest(cljs.core.next(arglist__268424));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___3 = function() {
    var G__268425__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__268425 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__268425__delegate.call(this, x, y, more)
    };
    G__268425.cljs$lang$maxFixedArity = 2;
    G__268425.cljs$lang$applyTo = function(arglist__268426) {
      var x = cljs.core.first(arglist__268426);
      var y = cljs.core.first(cljs.core.next(arglist__268426));
      var more = cljs.core.rest(cljs.core.next(arglist__268426));
      return G__268425__delegate(x, y, more)
    };
    G__268425.cljs$lang$arity$variadic = G__268425__delegate;
    return G__268425
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__268427 = pred;
        var G__268428 = cljs.core.next.call(null, coll);
        pred = G__268427;
        coll = G__268428;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.every_QMARK_.call(null, pred, coll))
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var or__3824__auto____268429 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____268429)) {
        return or__3824__auto____268429
      }else {
        var G__268430 = pred;
        var G__268431 = cljs.core.next.call(null, coll);
        pred = G__268430;
        coll = G__268431;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return cljs.core.not.call(null, cljs.core.even_QMARK_.call(null, n))
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__268432 = null;
    var G__268432__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__268432__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__268432__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__268432__3 = function() {
      var G__268433__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__268433 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__268433__delegate.call(this, x, y, zs)
      };
      G__268433.cljs$lang$maxFixedArity = 2;
      G__268433.cljs$lang$applyTo = function(arglist__268434) {
        var x = cljs.core.first(arglist__268434);
        var y = cljs.core.first(cljs.core.next(arglist__268434));
        var zs = cljs.core.rest(cljs.core.next(arglist__268434));
        return G__268433__delegate(x, y, zs)
      };
      G__268433.cljs$lang$arity$variadic = G__268433__delegate;
      return G__268433
    }();
    G__268432 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__268432__0.call(this);
        case 1:
          return G__268432__1.call(this, x);
        case 2:
          return G__268432__2.call(this, x, y);
        default:
          return G__268432__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__268432.cljs$lang$maxFixedArity = 2;
    G__268432.cljs$lang$applyTo = G__268432__3.cljs$lang$applyTo;
    return G__268432
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__268435__delegate = function(args) {
      return x
    };
    var G__268435 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__268435__delegate.call(this, args)
    };
    G__268435.cljs$lang$maxFixedArity = 0;
    G__268435.cljs$lang$applyTo = function(arglist__268436) {
      var args = cljs.core.seq(arglist__268436);
      return G__268435__delegate(args)
    };
    G__268435.cljs$lang$arity$variadic = G__268435__delegate;
    return G__268435
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__268440 = null;
      var G__268440__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__268440__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__268440__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__268440__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__268440__4 = function() {
        var G__268441__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__268441 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__268441__delegate.call(this, x, y, z, args)
        };
        G__268441.cljs$lang$maxFixedArity = 3;
        G__268441.cljs$lang$applyTo = function(arglist__268442) {
          var x = cljs.core.first(arglist__268442);
          var y = cljs.core.first(cljs.core.next(arglist__268442));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__268442)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__268442)));
          return G__268441__delegate(x, y, z, args)
        };
        G__268441.cljs$lang$arity$variadic = G__268441__delegate;
        return G__268441
      }();
      G__268440 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__268440__0.call(this);
          case 1:
            return G__268440__1.call(this, x);
          case 2:
            return G__268440__2.call(this, x, y);
          case 3:
            return G__268440__3.call(this, x, y, z);
          default:
            return G__268440__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__268440.cljs$lang$maxFixedArity = 3;
      G__268440.cljs$lang$applyTo = G__268440__4.cljs$lang$applyTo;
      return G__268440
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__268443 = null;
      var G__268443__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__268443__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__268443__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__268443__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__268443__4 = function() {
        var G__268444__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__268444 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__268444__delegate.call(this, x, y, z, args)
        };
        G__268444.cljs$lang$maxFixedArity = 3;
        G__268444.cljs$lang$applyTo = function(arglist__268445) {
          var x = cljs.core.first(arglist__268445);
          var y = cljs.core.first(cljs.core.next(arglist__268445));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__268445)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__268445)));
          return G__268444__delegate(x, y, z, args)
        };
        G__268444.cljs$lang$arity$variadic = G__268444__delegate;
        return G__268444
      }();
      G__268443 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__268443__0.call(this);
          case 1:
            return G__268443__1.call(this, x);
          case 2:
            return G__268443__2.call(this, x, y);
          case 3:
            return G__268443__3.call(this, x, y, z);
          default:
            return G__268443__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__268443.cljs$lang$maxFixedArity = 3;
      G__268443.cljs$lang$applyTo = G__268443__4.cljs$lang$applyTo;
      return G__268443
    }()
  };
  var comp__4 = function() {
    var G__268446__delegate = function(f1, f2, f3, fs) {
      var fs__268437 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__268447__delegate = function(args) {
          var ret__268438 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__268437), args);
          var fs__268439 = cljs.core.next.call(null, fs__268437);
          while(true) {
            if(cljs.core.truth_(fs__268439)) {
              var G__268448 = cljs.core.first.call(null, fs__268439).call(null, ret__268438);
              var G__268449 = cljs.core.next.call(null, fs__268439);
              ret__268438 = G__268448;
              fs__268439 = G__268449;
              continue
            }else {
              return ret__268438
            }
            break
          }
        };
        var G__268447 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__268447__delegate.call(this, args)
        };
        G__268447.cljs$lang$maxFixedArity = 0;
        G__268447.cljs$lang$applyTo = function(arglist__268450) {
          var args = cljs.core.seq(arglist__268450);
          return G__268447__delegate(args)
        };
        G__268447.cljs$lang$arity$variadic = G__268447__delegate;
        return G__268447
      }()
    };
    var G__268446 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__268446__delegate.call(this, f1, f2, f3, fs)
    };
    G__268446.cljs$lang$maxFixedArity = 3;
    G__268446.cljs$lang$applyTo = function(arglist__268451) {
      var f1 = cljs.core.first(arglist__268451);
      var f2 = cljs.core.first(cljs.core.next(arglist__268451));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__268451)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__268451)));
      return G__268446__delegate(f1, f2, f3, fs)
    };
    G__268446.cljs$lang$arity$variadic = G__268446__delegate;
    return G__268446
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__268452__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__268452 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__268452__delegate.call(this, args)
      };
      G__268452.cljs$lang$maxFixedArity = 0;
      G__268452.cljs$lang$applyTo = function(arglist__268453) {
        var args = cljs.core.seq(arglist__268453);
        return G__268452__delegate(args)
      };
      G__268452.cljs$lang$arity$variadic = G__268452__delegate;
      return G__268452
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__268454__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__268454 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__268454__delegate.call(this, args)
      };
      G__268454.cljs$lang$maxFixedArity = 0;
      G__268454.cljs$lang$applyTo = function(arglist__268455) {
        var args = cljs.core.seq(arglist__268455);
        return G__268454__delegate(args)
      };
      G__268454.cljs$lang$arity$variadic = G__268454__delegate;
      return G__268454
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__268456__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__268456 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__268456__delegate.call(this, args)
      };
      G__268456.cljs$lang$maxFixedArity = 0;
      G__268456.cljs$lang$applyTo = function(arglist__268457) {
        var args = cljs.core.seq(arglist__268457);
        return G__268456__delegate(args)
      };
      G__268456.cljs$lang$arity$variadic = G__268456__delegate;
      return G__268456
    }()
  };
  var partial__5 = function() {
    var G__268458__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__268459__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__268459 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__268459__delegate.call(this, args)
        };
        G__268459.cljs$lang$maxFixedArity = 0;
        G__268459.cljs$lang$applyTo = function(arglist__268460) {
          var args = cljs.core.seq(arglist__268460);
          return G__268459__delegate(args)
        };
        G__268459.cljs$lang$arity$variadic = G__268459__delegate;
        return G__268459
      }()
    };
    var G__268458 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__268458__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__268458.cljs$lang$maxFixedArity = 4;
    G__268458.cljs$lang$applyTo = function(arglist__268461) {
      var f = cljs.core.first(arglist__268461);
      var arg1 = cljs.core.first(cljs.core.next(arglist__268461));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__268461)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__268461))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__268461))));
      return G__268458__delegate(f, arg1, arg2, arg3, more)
    };
    G__268458.cljs$lang$arity$variadic = G__268458__delegate;
    return G__268458
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__268462 = null;
      var G__268462__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__268462__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__268462__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__268462__4 = function() {
        var G__268463__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__268463 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__268463__delegate.call(this, a, b, c, ds)
        };
        G__268463.cljs$lang$maxFixedArity = 3;
        G__268463.cljs$lang$applyTo = function(arglist__268464) {
          var a = cljs.core.first(arglist__268464);
          var b = cljs.core.first(cljs.core.next(arglist__268464));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__268464)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__268464)));
          return G__268463__delegate(a, b, c, ds)
        };
        G__268463.cljs$lang$arity$variadic = G__268463__delegate;
        return G__268463
      }();
      G__268462 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__268462__1.call(this, a);
          case 2:
            return G__268462__2.call(this, a, b);
          case 3:
            return G__268462__3.call(this, a, b, c);
          default:
            return G__268462__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__268462.cljs$lang$maxFixedArity = 3;
      G__268462.cljs$lang$applyTo = G__268462__4.cljs$lang$applyTo;
      return G__268462
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__268465 = null;
      var G__268465__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__268465__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__268465__4 = function() {
        var G__268466__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__268466 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__268466__delegate.call(this, a, b, c, ds)
        };
        G__268466.cljs$lang$maxFixedArity = 3;
        G__268466.cljs$lang$applyTo = function(arglist__268467) {
          var a = cljs.core.first(arglist__268467);
          var b = cljs.core.first(cljs.core.next(arglist__268467));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__268467)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__268467)));
          return G__268466__delegate(a, b, c, ds)
        };
        G__268466.cljs$lang$arity$variadic = G__268466__delegate;
        return G__268466
      }();
      G__268465 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__268465__2.call(this, a, b);
          case 3:
            return G__268465__3.call(this, a, b, c);
          default:
            return G__268465__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__268465.cljs$lang$maxFixedArity = 3;
      G__268465.cljs$lang$applyTo = G__268465__4.cljs$lang$applyTo;
      return G__268465
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__268468 = null;
      var G__268468__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__268468__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__268468__4 = function() {
        var G__268469__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__268469 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__268469__delegate.call(this, a, b, c, ds)
        };
        G__268469.cljs$lang$maxFixedArity = 3;
        G__268469.cljs$lang$applyTo = function(arglist__268470) {
          var a = cljs.core.first(arglist__268470);
          var b = cljs.core.first(cljs.core.next(arglist__268470));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__268470)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__268470)));
          return G__268469__delegate(a, b, c, ds)
        };
        G__268469.cljs$lang$arity$variadic = G__268469__delegate;
        return G__268469
      }();
      G__268468 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__268468__2.call(this, a, b);
          case 3:
            return G__268468__3.call(this, a, b, c);
          default:
            return G__268468__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__268468.cljs$lang$maxFixedArity = 3;
      G__268468.cljs$lang$applyTo = G__268468__4.cljs$lang$applyTo;
      return G__268468
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__268473 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____268471 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____268471)) {
        var s__268472 = temp__3974__auto____268471;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__268472)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__268472)))
      }else {
        return null
      }
    })
  };
  return mapi__268473.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____268474 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____268474)) {
      var s__268475 = temp__3974__auto____268474;
      var x__268476 = f.call(null, cljs.core.first.call(null, s__268475));
      if(x__268476 == null) {
        return keep.call(null, f, cljs.core.rest.call(null, s__268475))
      }else {
        return cljs.core.cons.call(null, x__268476, keep.call(null, f, cljs.core.rest.call(null, s__268475)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__268486 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____268483 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____268483)) {
        var s__268484 = temp__3974__auto____268483;
        var x__268485 = f.call(null, idx, cljs.core.first.call(null, s__268484));
        if(x__268485 == null) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__268484))
        }else {
          return cljs.core.cons.call(null, x__268485, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__268484)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__268486.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____268493 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____268493)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____268493
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____268494 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____268494)) {
            var and__3822__auto____268495 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____268495)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____268495
            }
          }else {
            return and__3822__auto____268494
          }
        }())
      };
      var ep1__4 = function() {
        var G__268531__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____268496 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____268496)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____268496
            }
          }())
        };
        var G__268531 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__268531__delegate.call(this, x, y, z, args)
        };
        G__268531.cljs$lang$maxFixedArity = 3;
        G__268531.cljs$lang$applyTo = function(arglist__268532) {
          var x = cljs.core.first(arglist__268532);
          var y = cljs.core.first(cljs.core.next(arglist__268532));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__268532)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__268532)));
          return G__268531__delegate(x, y, z, args)
        };
        G__268531.cljs$lang$arity$variadic = G__268531__delegate;
        return G__268531
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____268497 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____268497)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____268497
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____268498 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____268498)) {
            var and__3822__auto____268499 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____268499)) {
              var and__3822__auto____268500 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____268500)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____268500
              }
            }else {
              return and__3822__auto____268499
            }
          }else {
            return and__3822__auto____268498
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____268501 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____268501)) {
            var and__3822__auto____268502 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____268502)) {
              var and__3822__auto____268503 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____268503)) {
                var and__3822__auto____268504 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____268504)) {
                  var and__3822__auto____268505 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____268505)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____268505
                  }
                }else {
                  return and__3822__auto____268504
                }
              }else {
                return and__3822__auto____268503
              }
            }else {
              return and__3822__auto____268502
            }
          }else {
            return and__3822__auto____268501
          }
        }())
      };
      var ep2__4 = function() {
        var G__268533__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____268506 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____268506)) {
              return cljs.core.every_QMARK_.call(null, function(p1__268477_SHARP_) {
                var and__3822__auto____268507 = p1.call(null, p1__268477_SHARP_);
                if(cljs.core.truth_(and__3822__auto____268507)) {
                  return p2.call(null, p1__268477_SHARP_)
                }else {
                  return and__3822__auto____268507
                }
              }, args)
            }else {
              return and__3822__auto____268506
            }
          }())
        };
        var G__268533 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__268533__delegate.call(this, x, y, z, args)
        };
        G__268533.cljs$lang$maxFixedArity = 3;
        G__268533.cljs$lang$applyTo = function(arglist__268534) {
          var x = cljs.core.first(arglist__268534);
          var y = cljs.core.first(cljs.core.next(arglist__268534));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__268534)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__268534)));
          return G__268533__delegate(x, y, z, args)
        };
        G__268533.cljs$lang$arity$variadic = G__268533__delegate;
        return G__268533
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____268508 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____268508)) {
            var and__3822__auto____268509 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____268509)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____268509
            }
          }else {
            return and__3822__auto____268508
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____268510 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____268510)) {
            var and__3822__auto____268511 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____268511)) {
              var and__3822__auto____268512 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____268512)) {
                var and__3822__auto____268513 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____268513)) {
                  var and__3822__auto____268514 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____268514)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____268514
                  }
                }else {
                  return and__3822__auto____268513
                }
              }else {
                return and__3822__auto____268512
              }
            }else {
              return and__3822__auto____268511
            }
          }else {
            return and__3822__auto____268510
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____268515 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____268515)) {
            var and__3822__auto____268516 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____268516)) {
              var and__3822__auto____268517 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____268517)) {
                var and__3822__auto____268518 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____268518)) {
                  var and__3822__auto____268519 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____268519)) {
                    var and__3822__auto____268520 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____268520)) {
                      var and__3822__auto____268521 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____268521)) {
                        var and__3822__auto____268522 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____268522)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____268522
                        }
                      }else {
                        return and__3822__auto____268521
                      }
                    }else {
                      return and__3822__auto____268520
                    }
                  }else {
                    return and__3822__auto____268519
                  }
                }else {
                  return and__3822__auto____268518
                }
              }else {
                return and__3822__auto____268517
              }
            }else {
              return and__3822__auto____268516
            }
          }else {
            return and__3822__auto____268515
          }
        }())
      };
      var ep3__4 = function() {
        var G__268535__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____268523 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____268523)) {
              return cljs.core.every_QMARK_.call(null, function(p1__268478_SHARP_) {
                var and__3822__auto____268524 = p1.call(null, p1__268478_SHARP_);
                if(cljs.core.truth_(and__3822__auto____268524)) {
                  var and__3822__auto____268525 = p2.call(null, p1__268478_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____268525)) {
                    return p3.call(null, p1__268478_SHARP_)
                  }else {
                    return and__3822__auto____268525
                  }
                }else {
                  return and__3822__auto____268524
                }
              }, args)
            }else {
              return and__3822__auto____268523
            }
          }())
        };
        var G__268535 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__268535__delegate.call(this, x, y, z, args)
        };
        G__268535.cljs$lang$maxFixedArity = 3;
        G__268535.cljs$lang$applyTo = function(arglist__268536) {
          var x = cljs.core.first(arglist__268536);
          var y = cljs.core.first(cljs.core.next(arglist__268536));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__268536)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__268536)));
          return G__268535__delegate(x, y, z, args)
        };
        G__268535.cljs$lang$arity$variadic = G__268535__delegate;
        return G__268535
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__268537__delegate = function(p1, p2, p3, ps) {
      var ps__268526 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__268479_SHARP_) {
            return p1__268479_SHARP_.call(null, x)
          }, ps__268526)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__268480_SHARP_) {
            var and__3822__auto____268527 = p1__268480_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____268527)) {
              return p1__268480_SHARP_.call(null, y)
            }else {
              return and__3822__auto____268527
            }
          }, ps__268526)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__268481_SHARP_) {
            var and__3822__auto____268528 = p1__268481_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____268528)) {
              var and__3822__auto____268529 = p1__268481_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____268529)) {
                return p1__268481_SHARP_.call(null, z)
              }else {
                return and__3822__auto____268529
              }
            }else {
              return and__3822__auto____268528
            }
          }, ps__268526)
        };
        var epn__4 = function() {
          var G__268538__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____268530 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____268530)) {
                return cljs.core.every_QMARK_.call(null, function(p1__268482_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__268482_SHARP_, args)
                }, ps__268526)
              }else {
                return and__3822__auto____268530
              }
            }())
          };
          var G__268538 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__268538__delegate.call(this, x, y, z, args)
          };
          G__268538.cljs$lang$maxFixedArity = 3;
          G__268538.cljs$lang$applyTo = function(arglist__268539) {
            var x = cljs.core.first(arglist__268539);
            var y = cljs.core.first(cljs.core.next(arglist__268539));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__268539)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__268539)));
            return G__268538__delegate(x, y, z, args)
          };
          G__268538.cljs$lang$arity$variadic = G__268538__delegate;
          return G__268538
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__268537 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__268537__delegate.call(this, p1, p2, p3, ps)
    };
    G__268537.cljs$lang$maxFixedArity = 3;
    G__268537.cljs$lang$applyTo = function(arglist__268540) {
      var p1 = cljs.core.first(arglist__268540);
      var p2 = cljs.core.first(cljs.core.next(arglist__268540));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__268540)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__268540)));
      return G__268537__delegate(p1, p2, p3, ps)
    };
    G__268537.cljs$lang$arity$variadic = G__268537__delegate;
    return G__268537
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____268542 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____268542)) {
          return or__3824__auto____268542
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____268543 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____268543)) {
          return or__3824__auto____268543
        }else {
          var or__3824__auto____268544 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____268544)) {
            return or__3824__auto____268544
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__268580__delegate = function(x, y, z, args) {
          var or__3824__auto____268545 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____268545)) {
            return or__3824__auto____268545
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__268580 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__268580__delegate.call(this, x, y, z, args)
        };
        G__268580.cljs$lang$maxFixedArity = 3;
        G__268580.cljs$lang$applyTo = function(arglist__268581) {
          var x = cljs.core.first(arglist__268581);
          var y = cljs.core.first(cljs.core.next(arglist__268581));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__268581)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__268581)));
          return G__268580__delegate(x, y, z, args)
        };
        G__268580.cljs$lang$arity$variadic = G__268580__delegate;
        return G__268580
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____268546 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____268546)) {
          return or__3824__auto____268546
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____268547 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____268547)) {
          return or__3824__auto____268547
        }else {
          var or__3824__auto____268548 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____268548)) {
            return or__3824__auto____268548
          }else {
            var or__3824__auto____268549 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____268549)) {
              return or__3824__auto____268549
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____268550 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____268550)) {
          return or__3824__auto____268550
        }else {
          var or__3824__auto____268551 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____268551)) {
            return or__3824__auto____268551
          }else {
            var or__3824__auto____268552 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____268552)) {
              return or__3824__auto____268552
            }else {
              var or__3824__auto____268553 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____268553)) {
                return or__3824__auto____268553
              }else {
                var or__3824__auto____268554 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____268554)) {
                  return or__3824__auto____268554
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__268582__delegate = function(x, y, z, args) {
          var or__3824__auto____268555 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____268555)) {
            return or__3824__auto____268555
          }else {
            return cljs.core.some.call(null, function(p1__268487_SHARP_) {
              var or__3824__auto____268556 = p1.call(null, p1__268487_SHARP_);
              if(cljs.core.truth_(or__3824__auto____268556)) {
                return or__3824__auto____268556
              }else {
                return p2.call(null, p1__268487_SHARP_)
              }
            }, args)
          }
        };
        var G__268582 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__268582__delegate.call(this, x, y, z, args)
        };
        G__268582.cljs$lang$maxFixedArity = 3;
        G__268582.cljs$lang$applyTo = function(arglist__268583) {
          var x = cljs.core.first(arglist__268583);
          var y = cljs.core.first(cljs.core.next(arglist__268583));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__268583)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__268583)));
          return G__268582__delegate(x, y, z, args)
        };
        G__268582.cljs$lang$arity$variadic = G__268582__delegate;
        return G__268582
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____268557 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____268557)) {
          return or__3824__auto____268557
        }else {
          var or__3824__auto____268558 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____268558)) {
            return or__3824__auto____268558
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____268559 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____268559)) {
          return or__3824__auto____268559
        }else {
          var or__3824__auto____268560 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____268560)) {
            return or__3824__auto____268560
          }else {
            var or__3824__auto____268561 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____268561)) {
              return or__3824__auto____268561
            }else {
              var or__3824__auto____268562 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____268562)) {
                return or__3824__auto____268562
              }else {
                var or__3824__auto____268563 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____268563)) {
                  return or__3824__auto____268563
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____268564 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____268564)) {
          return or__3824__auto____268564
        }else {
          var or__3824__auto____268565 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____268565)) {
            return or__3824__auto____268565
          }else {
            var or__3824__auto____268566 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____268566)) {
              return or__3824__auto____268566
            }else {
              var or__3824__auto____268567 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____268567)) {
                return or__3824__auto____268567
              }else {
                var or__3824__auto____268568 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____268568)) {
                  return or__3824__auto____268568
                }else {
                  var or__3824__auto____268569 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____268569)) {
                    return or__3824__auto____268569
                  }else {
                    var or__3824__auto____268570 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____268570)) {
                      return or__3824__auto____268570
                    }else {
                      var or__3824__auto____268571 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____268571)) {
                        return or__3824__auto____268571
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__268584__delegate = function(x, y, z, args) {
          var or__3824__auto____268572 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____268572)) {
            return or__3824__auto____268572
          }else {
            return cljs.core.some.call(null, function(p1__268488_SHARP_) {
              var or__3824__auto____268573 = p1.call(null, p1__268488_SHARP_);
              if(cljs.core.truth_(or__3824__auto____268573)) {
                return or__3824__auto____268573
              }else {
                var or__3824__auto____268574 = p2.call(null, p1__268488_SHARP_);
                if(cljs.core.truth_(or__3824__auto____268574)) {
                  return or__3824__auto____268574
                }else {
                  return p3.call(null, p1__268488_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__268584 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__268584__delegate.call(this, x, y, z, args)
        };
        G__268584.cljs$lang$maxFixedArity = 3;
        G__268584.cljs$lang$applyTo = function(arglist__268585) {
          var x = cljs.core.first(arglist__268585);
          var y = cljs.core.first(cljs.core.next(arglist__268585));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__268585)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__268585)));
          return G__268584__delegate(x, y, z, args)
        };
        G__268584.cljs$lang$arity$variadic = G__268584__delegate;
        return G__268584
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__268586__delegate = function(p1, p2, p3, ps) {
      var ps__268575 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__268489_SHARP_) {
            return p1__268489_SHARP_.call(null, x)
          }, ps__268575)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__268490_SHARP_) {
            var or__3824__auto____268576 = p1__268490_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____268576)) {
              return or__3824__auto____268576
            }else {
              return p1__268490_SHARP_.call(null, y)
            }
          }, ps__268575)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__268491_SHARP_) {
            var or__3824__auto____268577 = p1__268491_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____268577)) {
              return or__3824__auto____268577
            }else {
              var or__3824__auto____268578 = p1__268491_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____268578)) {
                return or__3824__auto____268578
              }else {
                return p1__268491_SHARP_.call(null, z)
              }
            }
          }, ps__268575)
        };
        var spn__4 = function() {
          var G__268587__delegate = function(x, y, z, args) {
            var or__3824__auto____268579 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____268579)) {
              return or__3824__auto____268579
            }else {
              return cljs.core.some.call(null, function(p1__268492_SHARP_) {
                return cljs.core.some.call(null, p1__268492_SHARP_, args)
              }, ps__268575)
            }
          };
          var G__268587 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__268587__delegate.call(this, x, y, z, args)
          };
          G__268587.cljs$lang$maxFixedArity = 3;
          G__268587.cljs$lang$applyTo = function(arglist__268588) {
            var x = cljs.core.first(arglist__268588);
            var y = cljs.core.first(cljs.core.next(arglist__268588));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__268588)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__268588)));
            return G__268587__delegate(x, y, z, args)
          };
          G__268587.cljs$lang$arity$variadic = G__268587__delegate;
          return G__268587
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__268586 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__268586__delegate.call(this, p1, p2, p3, ps)
    };
    G__268586.cljs$lang$maxFixedArity = 3;
    G__268586.cljs$lang$applyTo = function(arglist__268589) {
      var p1 = cljs.core.first(arglist__268589);
      var p2 = cljs.core.first(cljs.core.next(arglist__268589));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__268589)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__268589)));
      return G__268586__delegate(p1, p2, p3, ps)
    };
    G__268586.cljs$lang$arity$variadic = G__268586__delegate;
    return G__268586
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____268590 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____268590)) {
        var s__268591 = temp__3974__auto____268590;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__268591)), map.call(null, f, cljs.core.rest.call(null, s__268591)))
      }else {
        return null
      }
    })
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__268592 = cljs.core.seq.call(null, c1);
      var s2__268593 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____268594 = s1__268592;
        if(cljs.core.truth_(and__3822__auto____268594)) {
          return s2__268593
        }else {
          return and__3822__auto____268594
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__268592), cljs.core.first.call(null, s2__268593)), map.call(null, f, cljs.core.rest.call(null, s1__268592), cljs.core.rest.call(null, s2__268593)))
      }else {
        return null
      }
    })
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__268595 = cljs.core.seq.call(null, c1);
      var s2__268596 = cljs.core.seq.call(null, c2);
      var s3__268597 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3822__auto____268598 = s1__268595;
        if(cljs.core.truth_(and__3822__auto____268598)) {
          var and__3822__auto____268599 = s2__268596;
          if(cljs.core.truth_(and__3822__auto____268599)) {
            return s3__268597
          }else {
            return and__3822__auto____268599
          }
        }else {
          return and__3822__auto____268598
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__268595), cljs.core.first.call(null, s2__268596), cljs.core.first.call(null, s3__268597)), map.call(null, f, cljs.core.rest.call(null, s1__268595), cljs.core.rest.call(null, s2__268596), cljs.core.rest.call(null, s3__268597)))
      }else {
        return null
      }
    })
  };
  var map__5 = function() {
    var G__268602__delegate = function(f, c1, c2, c3, colls) {
      var step__268601 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__268600 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__268600)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__268600), step.call(null, map.call(null, cljs.core.rest, ss__268600)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__268541_SHARP_) {
        return cljs.core.apply.call(null, f, p1__268541_SHARP_)
      }, step__268601.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__268602 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__268602__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__268602.cljs$lang$maxFixedArity = 4;
    G__268602.cljs$lang$applyTo = function(arglist__268603) {
      var f = cljs.core.first(arglist__268603);
      var c1 = cljs.core.first(cljs.core.next(arglist__268603));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__268603)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__268603))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__268603))));
      return G__268602__delegate(f, c1, c2, c3, colls)
    };
    G__268602.cljs$lang$arity$variadic = G__268602__delegate;
    return G__268602
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____268604 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____268604)) {
        var s__268605 = temp__3974__auto____268604;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__268605), take.call(null, n - 1, cljs.core.rest.call(null, s__268605)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__268608 = function(n, coll) {
    while(true) {
      var s__268606 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____268607 = n > 0;
        if(and__3822__auto____268607) {
          return s__268606
        }else {
          return and__3822__auto____268607
        }
      }())) {
        var G__268609 = n - 1;
        var G__268610 = cljs.core.rest.call(null, s__268606);
        n = G__268609;
        coll = G__268610;
        continue
      }else {
        return s__268606
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__268608.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__268611 = cljs.core.seq.call(null, coll);
  var lead__268612 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__268612)) {
      var G__268613 = cljs.core.next.call(null, s__268611);
      var G__268614 = cljs.core.next.call(null, lead__268612);
      s__268611 = G__268613;
      lead__268612 = G__268614;
      continue
    }else {
      return s__268611
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__268617 = function(pred, coll) {
    while(true) {
      var s__268615 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____268616 = s__268615;
        if(cljs.core.truth_(and__3822__auto____268616)) {
          return pred.call(null, cljs.core.first.call(null, s__268615))
        }else {
          return and__3822__auto____268616
        }
      }())) {
        var G__268618 = pred;
        var G__268619 = cljs.core.rest.call(null, s__268615);
        pred = G__268618;
        coll = G__268619;
        continue
      }else {
        return s__268615
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__268617.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____268620 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____268620)) {
      var s__268621 = temp__3974__auto____268620;
      return cljs.core.concat.call(null, s__268621, cycle.call(null, s__268621))
    }else {
      return null
    }
  })
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)])
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__268622 = cljs.core.seq.call(null, c1);
      var s2__268623 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____268624 = s1__268622;
        if(cljs.core.truth_(and__3822__auto____268624)) {
          return s2__268623
        }else {
          return and__3822__auto____268624
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__268622), cljs.core.cons.call(null, cljs.core.first.call(null, s2__268623), interleave.call(null, cljs.core.rest.call(null, s1__268622), cljs.core.rest.call(null, s2__268623))))
      }else {
        return null
      }
    })
  };
  var interleave__3 = function() {
    var G__268626__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__268625 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__268625)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__268625), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__268625)))
        }else {
          return null
        }
      })
    };
    var G__268626 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__268626__delegate.call(this, c1, c2, colls)
    };
    G__268626.cljs$lang$maxFixedArity = 2;
    G__268626.cljs$lang$applyTo = function(arglist__268627) {
      var c1 = cljs.core.first(arglist__268627);
      var c2 = cljs.core.first(cljs.core.next(arglist__268627));
      var colls = cljs.core.rest(cljs.core.next(arglist__268627));
      return G__268626__delegate(c1, c2, colls)
    };
    G__268626.cljs$lang$arity$variadic = G__268626__delegate;
    return G__268626
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__268630 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____268628 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____268628)) {
        var coll__268629 = temp__3971__auto____268628;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__268629), cat.call(null, cljs.core.rest.call(null, coll__268629), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__268630.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__268631__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__268631 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__268631__delegate.call(this, f, coll, colls)
    };
    G__268631.cljs$lang$maxFixedArity = 2;
    G__268631.cljs$lang$applyTo = function(arglist__268632) {
      var f = cljs.core.first(arglist__268632);
      var coll = cljs.core.first(cljs.core.next(arglist__268632));
      var colls = cljs.core.rest(cljs.core.next(arglist__268632));
      return G__268631__delegate(f, coll, colls)
    };
    G__268631.cljs$lang$arity$variadic = G__268631__delegate;
    return G__268631
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____268633 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____268633)) {
      var s__268634 = temp__3974__auto____268633;
      var f__268635 = cljs.core.first.call(null, s__268634);
      var r__268636 = cljs.core.rest.call(null, s__268634);
      if(cljs.core.truth_(pred.call(null, f__268635))) {
        return cljs.core.cons.call(null, f__268635, filter.call(null, pred, r__268636))
      }else {
        return filter.call(null, pred, r__268636)
      }
    }else {
      return null
    }
  })
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__268638 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__268638.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__268637_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__268637_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__268639__268640 = to;
    if(G__268639__268640 != null) {
      if(function() {
        var or__3824__auto____268641 = G__268639__268640.cljs$lang$protocol_mask$partition0$ & 2147483648;
        if(or__3824__auto____268641) {
          return or__3824__auto____268641
        }else {
          return G__268639__268640.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__268639__268640.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__268639__268640)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__268639__268640)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__268642__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__268642 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__268642__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__268642.cljs$lang$maxFixedArity = 4;
    G__268642.cljs$lang$applyTo = function(arglist__268643) {
      var f = cljs.core.first(arglist__268643);
      var c1 = cljs.core.first(cljs.core.next(arglist__268643));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__268643)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__268643))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__268643))));
      return G__268642__delegate(f, c1, c2, c3, colls)
    };
    G__268642.cljs$lang$arity$variadic = G__268642__delegate;
    return G__268642
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____268644 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____268644)) {
        var s__268645 = temp__3974__auto____268644;
        var p__268646 = cljs.core.take.call(null, n, s__268645);
        if(n === cljs.core.count.call(null, p__268646)) {
          return cljs.core.cons.call(null, p__268646, partition.call(null, n, step, cljs.core.drop.call(null, step, s__268645)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____268647 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____268647)) {
        var s__268648 = temp__3974__auto____268647;
        var p__268649 = cljs.core.take.call(null, n, s__268648);
        if(n === cljs.core.count.call(null, p__268649)) {
          return cljs.core.cons.call(null, p__268649, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__268648)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__268649, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__268650 = cljs.core.lookup_sentinel;
    var m__268651 = m;
    var ks__268652 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__268652)) {
        var m__268653 = cljs.core.get.call(null, m__268651, cljs.core.first.call(null, ks__268652), sentinel__268650);
        if(sentinel__268650 === m__268653) {
          return not_found
        }else {
          var G__268654 = sentinel__268650;
          var G__268655 = m__268653;
          var G__268656 = cljs.core.next.call(null, ks__268652);
          sentinel__268650 = G__268654;
          m__268651 = G__268655;
          ks__268652 = G__268656;
          continue
        }
      }else {
        return m__268651
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__268657, v) {
  var vec__268658__268659 = p__268657;
  var k__268660 = cljs.core.nth.call(null, vec__268658__268659, 0, null);
  var ks__268661 = cljs.core.nthnext.call(null, vec__268658__268659, 1);
  if(cljs.core.truth_(ks__268661)) {
    return cljs.core.assoc.call(null, m, k__268660, assoc_in.call(null, cljs.core.get.call(null, m, k__268660), ks__268661, v))
  }else {
    return cljs.core.assoc.call(null, m, k__268660, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__268662, f, args) {
    var vec__268663__268664 = p__268662;
    var k__268665 = cljs.core.nth.call(null, vec__268663__268664, 0, null);
    var ks__268666 = cljs.core.nthnext.call(null, vec__268663__268664, 1);
    if(cljs.core.truth_(ks__268666)) {
      return cljs.core.assoc.call(null, m, k__268665, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__268665), ks__268666, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__268665, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__268665), args))
    }
  };
  var update_in = function(m, p__268662, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__268662, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__268667) {
    var m = cljs.core.first(arglist__268667);
    var p__268662 = cljs.core.first(cljs.core.next(arglist__268667));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__268667)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__268667)));
    return update_in__delegate(m, p__268662, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__268672 = this;
  var h__364__auto____268673 = this__268672.__hash;
  if(h__364__auto____268673 != null) {
    return h__364__auto____268673
  }else {
    var h__364__auto____268674 = cljs.core.hash_coll.call(null, coll);
    this__268672.__hash = h__364__auto____268674;
    return h__364__auto____268674
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__268675 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__268676 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__268677 = this;
  var new_array__268678 = cljs.core.aclone.call(null, this__268677.array);
  new_array__268678[k] = v;
  return new cljs.core.Vector(this__268677.meta, new_array__268678, null)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__268707 = null;
  var G__268707__2 = function(tsym268670, k) {
    var this__268679 = this;
    var tsym268670__268680 = this;
    var coll__268681 = tsym268670__268680;
    return cljs.core._lookup.call(null, coll__268681, k)
  };
  var G__268707__3 = function(tsym268671, k, not_found) {
    var this__268682 = this;
    var tsym268671__268683 = this;
    var coll__268684 = tsym268671__268683;
    return cljs.core._lookup.call(null, coll__268684, k, not_found)
  };
  G__268707 = function(tsym268671, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__268707__2.call(this, tsym268671, k);
      case 3:
        return G__268707__3.call(this, tsym268671, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__268707
}();
cljs.core.Vector.prototype.apply = function(tsym268668, args268669) {
  return tsym268668.call.apply(tsym268668, [tsym268668].concat(cljs.core.aclone.call(null, args268669)))
};
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__268685 = this;
  var new_array__268686 = cljs.core.aclone.call(null, this__268685.array);
  new_array__268686.push(o);
  return new cljs.core.Vector(this__268685.meta, new_array__268686, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__268687 = this;
  var this$__268688 = this;
  return cljs.core.pr_str.call(null, this$__268688)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__268689 = this;
  return cljs.core.ci_reduce.call(null, this__268689.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__268690 = this;
  return cljs.core.ci_reduce.call(null, this__268690.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__268691 = this;
  if(this__268691.array.length > 0) {
    var vector_seq__268692 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__268691.array.length) {
          return cljs.core.cons.call(null, this__268691.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__268692.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__268693 = this;
  return this__268693.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__268694 = this;
  var count__268695 = this__268694.array.length;
  if(count__268695 > 0) {
    return this__268694.array[count__268695 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__268696 = this;
  if(this__268696.array.length > 0) {
    var new_array__268697 = cljs.core.aclone.call(null, this__268696.array);
    new_array__268697.pop();
    return new cljs.core.Vector(this__268696.meta, new_array__268697, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__268698 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__268699 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__268700 = this;
  return new cljs.core.Vector(meta, this__268700.array, this__268700.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__268701 = this;
  return this__268701.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__268703 = this;
  if(function() {
    var and__3822__auto____268704 = 0 <= n;
    if(and__3822__auto____268704) {
      return n < this__268703.array.length
    }else {
      return and__3822__auto____268704
    }
  }()) {
    return this__268703.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__268705 = this;
  if(function() {
    var and__3822__auto____268706 = 0 <= n;
    if(and__3822__auto____268706) {
      return n < this__268705.array.length
    }else {
      return and__3822__auto____268706
    }
  }()) {
    return this__268705.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__268702 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__268702.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__437__auto__) {
  return cljs.core.list.call(null, "cljs.core.VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__268708 = pv.cnt;
  if(cnt__268708 < 32) {
    return 0
  }else {
    return cnt__268708 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__268709 = level;
  var ret__268710 = node;
  while(true) {
    if(ll__268709 === 0) {
      return ret__268710
    }else {
      var embed__268711 = ret__268710;
      var r__268712 = cljs.core.pv_fresh_node.call(null, edit);
      var ___268713 = cljs.core.pv_aset.call(null, r__268712, 0, embed__268711);
      var G__268714 = ll__268709 - 5;
      var G__268715 = r__268712;
      ll__268709 = G__268714;
      ret__268710 = G__268715;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__268716 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__268717 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__268716, subidx__268717, tailnode);
    return ret__268716
  }else {
    var temp__3971__auto____268718 = cljs.core.pv_aget.call(null, parent, subidx__268717);
    if(cljs.core.truth_(temp__3971__auto____268718)) {
      var child__268719 = temp__3971__auto____268718;
      var node_to_insert__268720 = push_tail.call(null, pv, level - 5, child__268719, tailnode);
      cljs.core.pv_aset.call(null, ret__268716, subidx__268717, node_to_insert__268720);
      return ret__268716
    }else {
      var node_to_insert__268721 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__268716, subidx__268717, node_to_insert__268721);
      return ret__268716
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____268722 = 0 <= i;
    if(and__3822__auto____268722) {
      return i < pv.cnt
    }else {
      return and__3822__auto____268722
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__268723 = pv.root;
      var level__268724 = pv.shift;
      while(true) {
        if(level__268724 > 0) {
          var G__268725 = cljs.core.pv_aget.call(null, node__268723, i >>> level__268724 & 31);
          var G__268726 = level__268724 - 5;
          node__268723 = G__268725;
          level__268724 = G__268726;
          continue
        }else {
          return node__268723.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__268727 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__268727, i & 31, val);
    return ret__268727
  }else {
    var subidx__268728 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__268727, subidx__268728, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__268728), i, val));
    return ret__268727
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__268729 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__268730 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__268729));
    if(function() {
      var and__3822__auto____268731 = new_child__268730 == null;
      if(and__3822__auto____268731) {
        return subidx__268729 === 0
      }else {
        return and__3822__auto____268731
      }
    }()) {
      return null
    }else {
      var ret__268732 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__268732, subidx__268729, new_child__268730);
      return ret__268732
    }
  }else {
    if(subidx__268729 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__268733 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__268733, subidx__268729, null);
        return ret__268733
      }else {
        return null
      }
    }
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.vector_seq = function vector_seq(v, offset) {
  var c__268734 = cljs.core._count.call(null, v);
  if(c__268734 > 0) {
    if(void 0 === cljs.core.t268735) {
      cljs.core.t268735 = function(c, offset, v, vector_seq, __meta__371__auto__) {
        this.c = c;
        this.offset = offset;
        this.v = v;
        this.vector_seq = vector_seq;
        this.__meta__371__auto__ = __meta__371__auto__;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 282263648
      };
      cljs.core.t268735.cljs$lang$type = true;
      cljs.core.t268735.cljs$lang$ctorPrSeq = function(this__436__auto__) {
        return cljs.core.list.call(null, "cljs.core.t268735")
      };
      cljs.core.t268735.prototype.cljs$core$ISeqable$ = true;
      cljs.core.t268735.prototype.cljs$core$ISeqable$_seq$arity$1 = function(vseq) {
        var this__268736 = this;
        return vseq
      };
      cljs.core.t268735.prototype.cljs$core$ISeq$ = true;
      cljs.core.t268735.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
        var this__268737 = this;
        return cljs.core._nth.call(null, this__268737.v, this__268737.offset)
      };
      cljs.core.t268735.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
        var this__268738 = this;
        var offset__268739 = this__268738.offset + 1;
        if(offset__268739 < this__268738.c) {
          return this__268738.vector_seq.call(null, this__268738.v, offset__268739)
        }else {
          return cljs.core.List.EMPTY
        }
      };
      cljs.core.t268735.prototype.cljs$core$ASeq$ = true;
      cljs.core.t268735.prototype.cljs$core$IEquiv$ = true;
      cljs.core.t268735.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(vseq, other) {
        var this__268740 = this;
        return cljs.core.equiv_sequential.call(null, vseq, other)
      };
      cljs.core.t268735.prototype.cljs$core$ISequential$ = true;
      cljs.core.t268735.prototype.cljs$core$IPrintable$ = true;
      cljs.core.t268735.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(vseq, opts) {
        var this__268741 = this;
        return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, vseq)
      };
      cljs.core.t268735.prototype.cljs$core$IMeta$ = true;
      cljs.core.t268735.prototype.cljs$core$IMeta$_meta$arity$1 = function(___372__auto__) {
        var this__268742 = this;
        return this__268742.__meta__371__auto__
      };
      cljs.core.t268735.prototype.cljs$core$IWithMeta$ = true;
      cljs.core.t268735.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(___372__auto__, __meta__371__auto__) {
        var this__268743 = this;
        return new cljs.core.t268735(this__268743.c, this__268743.offset, this__268743.v, this__268743.vector_seq, __meta__371__auto__)
      };
      cljs.core.t268735
    }else {
    }
    return new cljs.core.t268735(c__268734, offset, v, vector_seq, null)
  }else {
    return null
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2164209055
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__268748 = this;
  return new cljs.core.TransientVector(this__268748.cnt, this__268748.shift, cljs.core.tv_editable_root.call(null, this__268748.root), cljs.core.tv_editable_tail.call(null, this__268748.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__268749 = this;
  var h__364__auto____268750 = this__268749.__hash;
  if(h__364__auto____268750 != null) {
    return h__364__auto____268750
  }else {
    var h__364__auto____268751 = cljs.core.hash_coll.call(null, coll);
    this__268749.__hash = h__364__auto____268751;
    return h__364__auto____268751
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__268752 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__268753 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__268754 = this;
  if(function() {
    var and__3822__auto____268755 = 0 <= k;
    if(and__3822__auto____268755) {
      return k < this__268754.cnt
    }else {
      return and__3822__auto____268755
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__268756 = cljs.core.aclone.call(null, this__268754.tail);
      new_tail__268756[k & 31] = v;
      return new cljs.core.PersistentVector(this__268754.meta, this__268754.cnt, this__268754.shift, this__268754.root, new_tail__268756, null)
    }else {
      return new cljs.core.PersistentVector(this__268754.meta, this__268754.cnt, this__268754.shift, cljs.core.do_assoc.call(null, coll, this__268754.shift, this__268754.root, k, v), this__268754.tail, null)
    }
  }else {
    if(k === this__268754.cnt) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__268754.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__268801 = null;
  var G__268801__2 = function(tsym268746, k) {
    var this__268757 = this;
    var tsym268746__268758 = this;
    var coll__268759 = tsym268746__268758;
    return cljs.core._lookup.call(null, coll__268759, k)
  };
  var G__268801__3 = function(tsym268747, k, not_found) {
    var this__268760 = this;
    var tsym268747__268761 = this;
    var coll__268762 = tsym268747__268761;
    return cljs.core._lookup.call(null, coll__268762, k, not_found)
  };
  G__268801 = function(tsym268747, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__268801__2.call(this, tsym268747, k);
      case 3:
        return G__268801__3.call(this, tsym268747, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__268801
}();
cljs.core.PersistentVector.prototype.apply = function(tsym268744, args268745) {
  return tsym268744.call.apply(tsym268744, [tsym268744].concat(cljs.core.aclone.call(null, args268745)))
};
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__268763 = this;
  var step_init__268764 = [0, init];
  var i__268765 = 0;
  while(true) {
    if(i__268765 < this__268763.cnt) {
      var arr__268766 = cljs.core.array_for.call(null, v, i__268765);
      var len__268767 = arr__268766.length;
      var init__268771 = function() {
        var j__268768 = 0;
        var init__268769 = step_init__268764[1];
        while(true) {
          if(j__268768 < len__268767) {
            var init__268770 = f.call(null, init__268769, j__268768 + i__268765, arr__268766[j__268768]);
            if(cljs.core.reduced_QMARK_.call(null, init__268770)) {
              return init__268770
            }else {
              var G__268802 = j__268768 + 1;
              var G__268803 = init__268770;
              j__268768 = G__268802;
              init__268769 = G__268803;
              continue
            }
          }else {
            step_init__268764[0] = len__268767;
            step_init__268764[1] = init__268769;
            return init__268769
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__268771)) {
        return cljs.core.deref.call(null, init__268771)
      }else {
        var G__268804 = i__268765 + step_init__268764[0];
        i__268765 = G__268804;
        continue
      }
    }else {
      return step_init__268764[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__268772 = this;
  if(this__268772.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__268773 = cljs.core.aclone.call(null, this__268772.tail);
    new_tail__268773.push(o);
    return new cljs.core.PersistentVector(this__268772.meta, this__268772.cnt + 1, this__268772.shift, this__268772.root, new_tail__268773, null)
  }else {
    var root_overflow_QMARK___268774 = this__268772.cnt >>> 5 > 1 << this__268772.shift;
    var new_shift__268775 = root_overflow_QMARK___268774 ? this__268772.shift + 5 : this__268772.shift;
    var new_root__268777 = root_overflow_QMARK___268774 ? function() {
      var n_r__268776 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__268776, 0, this__268772.root);
      cljs.core.pv_aset.call(null, n_r__268776, 1, cljs.core.new_path.call(null, null, this__268772.shift, new cljs.core.VectorNode(null, this__268772.tail)));
      return n_r__268776
    }() : cljs.core.push_tail.call(null, coll, this__268772.shift, this__268772.root, new cljs.core.VectorNode(null, this__268772.tail));
    return new cljs.core.PersistentVector(this__268772.meta, this__268772.cnt + 1, new_shift__268775, new_root__268777, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__268778 = this;
  return cljs.core._nth.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__268779 = this;
  return cljs.core._nth.call(null, coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__268780 = this;
  var this$__268781 = this;
  return cljs.core.pr_str.call(null, this$__268781)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__268782 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__268783 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__268784 = this;
  return cljs.core.vector_seq.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__268785 = this;
  return this__268785.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__268786 = this;
  if(this__268786.cnt > 0) {
    return cljs.core._nth.call(null, coll, this__268786.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__268787 = this;
  if(this__268787.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__268787.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__268787.meta)
    }else {
      if(1 < this__268787.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__268787.meta, this__268787.cnt - 1, this__268787.shift, this__268787.root, this__268787.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__268788 = cljs.core.array_for.call(null, coll, this__268787.cnt - 2);
          var nr__268789 = cljs.core.pop_tail.call(null, coll, this__268787.shift, this__268787.root);
          var new_root__268790 = nr__268789 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__268789;
          var cnt_1__268791 = this__268787.cnt - 1;
          if(function() {
            var and__3822__auto____268792 = 5 < this__268787.shift;
            if(and__3822__auto____268792) {
              return cljs.core.pv_aget.call(null, new_root__268790, 1) == null
            }else {
              return and__3822__auto____268792
            }
          }()) {
            return new cljs.core.PersistentVector(this__268787.meta, cnt_1__268791, this__268787.shift - 5, cljs.core.pv_aget.call(null, new_root__268790, 0), new_tail__268788, null)
          }else {
            return new cljs.core.PersistentVector(this__268787.meta, cnt_1__268791, this__268787.shift, new_root__268790, new_tail__268788, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__268794 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__268795 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__268796 = this;
  return new cljs.core.PersistentVector(meta, this__268796.cnt, this__268796.shift, this__268796.root, this__268796.tail, this__268796.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__268797 = this;
  return this__268797.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__268798 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__268799 = this;
  if(function() {
    var and__3822__auto____268800 = 0 <= n;
    if(and__3822__auto____268800) {
      return n < this__268799.cnt
    }else {
      return and__3822__auto____268800
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__268793 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__268793.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs) {
  var xs__268805 = cljs.core.seq.call(null, xs);
  var out__268806 = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    if(cljs.core.truth_(xs__268805)) {
      var G__268807 = cljs.core.next.call(null, xs__268805);
      var G__268808 = cljs.core.conj_BANG_.call(null, out__268806, cljs.core.first.call(null, xs__268805));
      xs__268805 = G__268807;
      out__268806 = G__268808;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__268806)
    }
    break
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.PersistentVector.EMPTY, coll)
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__268809) {
    var args = cljs.core.seq(arglist__268809);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__268814 = this;
  var h__364__auto____268815 = this__268814.__hash;
  if(h__364__auto____268815 != null) {
    return h__364__auto____268815
  }else {
    var h__364__auto____268816 = cljs.core.hash_coll.call(null, coll);
    this__268814.__hash = h__364__auto____268816;
    return h__364__auto____268816
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__268817 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__268818 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__268819 = this;
  var v_pos__268820 = this__268819.start + key;
  return new cljs.core.Subvec(this__268819.meta, cljs.core._assoc.call(null, this__268819.v, v_pos__268820, val), this__268819.start, this__268819.end > v_pos__268820 + 1 ? this__268819.end : v_pos__268820 + 1, null)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__268844 = null;
  var G__268844__2 = function(tsym268812, k) {
    var this__268821 = this;
    var tsym268812__268822 = this;
    var coll__268823 = tsym268812__268822;
    return cljs.core._lookup.call(null, coll__268823, k)
  };
  var G__268844__3 = function(tsym268813, k, not_found) {
    var this__268824 = this;
    var tsym268813__268825 = this;
    var coll__268826 = tsym268813__268825;
    return cljs.core._lookup.call(null, coll__268826, k, not_found)
  };
  G__268844 = function(tsym268813, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__268844__2.call(this, tsym268813, k);
      case 3:
        return G__268844__3.call(this, tsym268813, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__268844
}();
cljs.core.Subvec.prototype.apply = function(tsym268810, args268811) {
  return tsym268810.call.apply(tsym268810, [tsym268810].concat(cljs.core.aclone.call(null, args268811)))
};
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__268827 = this;
  return new cljs.core.Subvec(this__268827.meta, cljs.core._assoc_n.call(null, this__268827.v, this__268827.end, o), this__268827.start, this__268827.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__268828 = this;
  var this$__268829 = this;
  return cljs.core.pr_str.call(null, this$__268829)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__268830 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__268831 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__268832 = this;
  var subvec_seq__268833 = function subvec_seq(i) {
    if(i === this__268832.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__268832.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__268833.call(null, this__268832.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__268834 = this;
  return this__268834.end - this__268834.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__268835 = this;
  return cljs.core._nth.call(null, this__268835.v, this__268835.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__268836 = this;
  if(this__268836.start === this__268836.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__268836.meta, this__268836.v, this__268836.start, this__268836.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__268837 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__268838 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__268839 = this;
  return new cljs.core.Subvec(meta, this__268839.v, this__268839.start, this__268839.end, this__268839.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__268840 = this;
  return this__268840.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__268842 = this;
  return cljs.core._nth.call(null, this__268842.v, this__268842.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__268843 = this;
  return cljs.core._nth.call(null, this__268843.v, this__268843.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__268841 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__268841.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, cljs.core.aclone.call(null, node.arr))
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__268845 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__268845, 0, tl.length);
  return ret__268845
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__268846 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__268847 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__268846, subidx__268847, level === 5 ? tail_node : function() {
    var child__268848 = cljs.core.pv_aget.call(null, ret__268846, subidx__268847);
    if(child__268848 != null) {
      return tv_push_tail.call(null, tv, level - 5, child__268848, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__268846
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__268849 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__268850 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__268851 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__268849, subidx__268850));
    if(function() {
      var and__3822__auto____268852 = new_child__268851 == null;
      if(and__3822__auto____268852) {
        return subidx__268850 === 0
      }else {
        return and__3822__auto____268852
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__268849, subidx__268850, new_child__268851);
      return node__268849
    }
  }else {
    if(subidx__268850 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__268849, subidx__268850, null);
        return node__268849
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____268853 = 0 <= i;
    if(and__3822__auto____268853) {
      return i < tv.cnt
    }else {
      return and__3822__auto____268853
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__268854 = tv.root;
      var node__268855 = root__268854;
      var level__268856 = tv.shift;
      while(true) {
        if(level__268856 > 0) {
          var G__268857 = cljs.core.tv_ensure_editable.call(null, root__268854.edit, cljs.core.pv_aget.call(null, node__268855, i >>> level__268856 & 31));
          var G__268858 = level__268856 - 5;
          node__268855 = G__268857;
          level__268856 = G__268858;
          continue
        }else {
          return node__268855.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 147;
  this.cljs$lang$protocol_mask$partition1$ = 11
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientVector")
};
cljs.core.TransientVector.prototype.cljs$core$IFn$ = true;
cljs.core.TransientVector.prototype.call = function() {
  var G__268896 = null;
  var G__268896__2 = function(tsym268861, k) {
    var this__268863 = this;
    var tsym268861__268864 = this;
    var coll__268865 = tsym268861__268864;
    return cljs.core._lookup.call(null, coll__268865, k)
  };
  var G__268896__3 = function(tsym268862, k, not_found) {
    var this__268866 = this;
    var tsym268862__268867 = this;
    var coll__268868 = tsym268862__268867;
    return cljs.core._lookup.call(null, coll__268868, k, not_found)
  };
  G__268896 = function(tsym268862, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__268896__2.call(this, tsym268862, k);
      case 3:
        return G__268896__3.call(this, tsym268862, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__268896
}();
cljs.core.TransientVector.prototype.apply = function(tsym268859, args268860) {
  return tsym268859.call.apply(tsym268859, [tsym268859].concat(cljs.core.aclone.call(null, args268860)))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__268869 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__268870 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__268871 = this;
  if(cljs.core.truth_(this__268871.root.edit)) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__268872 = this;
  if(function() {
    var and__3822__auto____268873 = 0 <= n;
    if(and__3822__auto____268873) {
      return n < this__268872.cnt
    }else {
      return and__3822__auto____268873
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__268874 = this;
  if(cljs.core.truth_(this__268874.root.edit)) {
    return this__268874.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__268875 = this;
  if(cljs.core.truth_(this__268875.root.edit)) {
    if(function() {
      var and__3822__auto____268876 = 0 <= n;
      if(and__3822__auto____268876) {
        return n < this__268875.cnt
      }else {
        return and__3822__auto____268876
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__268875.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__268879 = function go(level, node) {
          var node__268877 = cljs.core.tv_ensure_editable.call(null, this__268875.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__268877, n & 31, val);
            return node__268877
          }else {
            var subidx__268878 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__268877, subidx__268878, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__268877, subidx__268878)));
            return node__268877
          }
        }.call(null, this__268875.shift, this__268875.root);
        this__268875.root = new_root__268879;
        return tcoll
      }
    }else {
      if(n === this__268875.cnt) {
        return cljs.core._conj_BANG_.call(null, tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__268875.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__268880 = this;
  if(cljs.core.truth_(this__268880.root.edit)) {
    if(this__268880.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__268880.cnt) {
        this__268880.cnt = 0;
        return tcoll
      }else {
        if((this__268880.cnt - 1 & 31) > 0) {
          this__268880.cnt = this__268880.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__268881 = cljs.core.editable_array_for.call(null, tcoll, this__268880.cnt - 2);
            var new_root__268883 = function() {
              var nr__268882 = cljs.core.tv_pop_tail.call(null, tcoll, this__268880.shift, this__268880.root);
              if(nr__268882 != null) {
                return nr__268882
              }else {
                return new cljs.core.VectorNode(this__268880.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____268884 = 5 < this__268880.shift;
              if(and__3822__auto____268884) {
                return cljs.core.pv_aget.call(null, new_root__268883, 1) == null
              }else {
                return and__3822__auto____268884
              }
            }()) {
              var new_root__268885 = cljs.core.tv_ensure_editable.call(null, this__268880.root.edit, cljs.core.pv_aget.call(null, new_root__268883, 0));
              this__268880.root = new_root__268885;
              this__268880.shift = this__268880.shift - 5;
              this__268880.cnt = this__268880.cnt - 1;
              this__268880.tail = new_tail__268881;
              return tcoll
            }else {
              this__268880.root = new_root__268883;
              this__268880.cnt = this__268880.cnt - 1;
              this__268880.tail = new_tail__268881;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__268886 = this;
  return cljs.core._assoc_n_BANG_.call(null, tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__268887 = this;
  if(cljs.core.truth_(this__268887.root.edit)) {
    if(this__268887.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__268887.tail[this__268887.cnt & 31] = o;
      this__268887.cnt = this__268887.cnt + 1;
      return tcoll
    }else {
      var tail_node__268888 = new cljs.core.VectorNode(this__268887.root.edit, this__268887.tail);
      var new_tail__268889 = cljs.core.make_array.call(null, 32);
      new_tail__268889[0] = o;
      this__268887.tail = new_tail__268889;
      if(this__268887.cnt >>> 5 > 1 << this__268887.shift) {
        var new_root_array__268890 = cljs.core.make_array.call(null, 32);
        var new_shift__268891 = this__268887.shift + 5;
        new_root_array__268890[0] = this__268887.root;
        new_root_array__268890[1] = cljs.core.new_path.call(null, this__268887.root.edit, this__268887.shift, tail_node__268888);
        this__268887.root = new cljs.core.VectorNode(this__268887.root.edit, new_root_array__268890);
        this__268887.shift = new_shift__268891;
        this__268887.cnt = this__268887.cnt + 1;
        return tcoll
      }else {
        var new_root__268892 = cljs.core.tv_push_tail.call(null, tcoll, this__268887.shift, this__268887.root, tail_node__268888);
        this__268887.root = new_root__268892;
        this__268887.cnt = this__268887.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__268893 = this;
  if(cljs.core.truth_(this__268893.root.edit)) {
    this__268893.root.edit = null;
    var len__268894 = this__268893.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__268895 = cljs.core.make_array.call(null, len__268894);
    cljs.core.array_copy.call(null, this__268893.tail, 0, trimmed_tail__268895, 0, len__268894);
    return new cljs.core.PersistentVector(null, this__268893.cnt, this__268893.shift, this__268893.root, trimmed_tail__268895, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__268897 = this;
  var h__364__auto____268898 = this__268897.__hash;
  if(h__364__auto____268898 != null) {
    return h__364__auto____268898
  }else {
    var h__364__auto____268899 = cljs.core.hash_coll.call(null, coll);
    this__268897.__hash = h__364__auto____268899;
    return h__364__auto____268899
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__268900 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__268901 = this;
  var this$__268902 = this;
  return cljs.core.pr_str.call(null, this$__268902)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__268903 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__268904 = this;
  return cljs.core._first.call(null, this__268904.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__268905 = this;
  var temp__3971__auto____268906 = cljs.core.next.call(null, this__268905.front);
  if(cljs.core.truth_(temp__3971__auto____268906)) {
    var f1__268907 = temp__3971__auto____268906;
    return new cljs.core.PersistentQueueSeq(this__268905.meta, f1__268907, this__268905.rear, null)
  }else {
    if(this__268905.rear == null) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__268905.meta, this__268905.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__268908 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__268909 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__268909.front, this__268909.rear, this__268909.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__268910 = this;
  return this__268910.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__268911 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__268911.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15929422
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__268912 = this;
  var h__364__auto____268913 = this__268912.__hash;
  if(h__364__auto____268913 != null) {
    return h__364__auto____268913
  }else {
    var h__364__auto____268914 = cljs.core.hash_coll.call(null, coll);
    this__268912.__hash = h__364__auto____268914;
    return h__364__auto____268914
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__268915 = this;
  if(cljs.core.truth_(this__268915.front)) {
    return new cljs.core.PersistentQueue(this__268915.meta, this__268915.count + 1, this__268915.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____268916 = this__268915.rear;
      if(cljs.core.truth_(or__3824__auto____268916)) {
        return or__3824__auto____268916
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__268915.meta, this__268915.count + 1, cljs.core.conj.call(null, this__268915.front, o), cljs.core.PersistentVector.fromArray([]), null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__268917 = this;
  var this$__268918 = this;
  return cljs.core.pr_str.call(null, this$__268918)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__268919 = this;
  var rear__268920 = cljs.core.seq.call(null, this__268919.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____268921 = this__268919.front;
    if(cljs.core.truth_(or__3824__auto____268921)) {
      return or__3824__auto____268921
    }else {
      return rear__268920
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__268919.front, cljs.core.seq.call(null, rear__268920), null, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__268922 = this;
  return this__268922.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__268923 = this;
  return cljs.core._first.call(null, this__268923.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__268924 = this;
  if(cljs.core.truth_(this__268924.front)) {
    var temp__3971__auto____268925 = cljs.core.next.call(null, this__268924.front);
    if(cljs.core.truth_(temp__3971__auto____268925)) {
      var f1__268926 = temp__3971__auto____268925;
      return new cljs.core.PersistentQueue(this__268924.meta, this__268924.count - 1, f1__268926, this__268924.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__268924.meta, this__268924.count - 1, cljs.core.seq.call(null, this__268924.rear), cljs.core.PersistentVector.fromArray([]), null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__268927 = this;
  return cljs.core.first.call(null, this__268927.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__268928 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__268929 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__268930 = this;
  return new cljs.core.PersistentQueue(meta, this__268930.count, this__268930.front, this__268930.rear, this__268930.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__268931 = this;
  return this__268931.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__268932 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.fromArray([]), 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1048576
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__268933 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__268934 = array.length;
  var i__268935 = 0;
  while(true) {
    if(i__268935 < len__268934) {
      if(cljs.core._EQ_.call(null, k, array[i__268935])) {
        return i__268935
      }else {
        var G__268936 = i__268935 + incr;
        i__268935 = G__268936;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_contains_key_QMARK_ = function() {
  var obj_map_contains_key_QMARK_ = null;
  var obj_map_contains_key_QMARK___2 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___4 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____268937 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3822__auto____268937)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3822__auto____268937
      }
    }())) {
      return true_val
    }else {
      return false_val
    }
  };
  obj_map_contains_key_QMARK_ = function(k, strobj, true_val, false_val) {
    switch(arguments.length) {
      case 2:
        return obj_map_contains_key_QMARK___2.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___4.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  obj_map_contains_key_QMARK_.cljs$lang$arity$2 = obj_map_contains_key_QMARK___2;
  obj_map_contains_key_QMARK_.cljs$lang$arity$4 = obj_map_contains_key_QMARK___4;
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__268938 = cljs.core.hash.call(null, a);
  var b__268939 = cljs.core.hash.call(null, b);
  if(a__268938 < b__268939) {
    return-1
  }else {
    if(a__268938 > b__268939) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__268941 = m.keys;
  var len__268942 = ks__268941.length;
  var so__268943 = m.strobj;
  var out__268944 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__268945 = 0;
  var out__268946 = cljs.core.transient$.call(null, out__268944);
  while(true) {
    if(i__268945 < len__268942) {
      var k__268947 = ks__268941[i__268945];
      var G__268948 = i__268945 + 1;
      var G__268949 = cljs.core.assoc_BANG_.call(null, out__268946, k__268947, so__268943[k__268947]);
      i__268945 = G__268948;
      out__268946 = G__268949;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__268946, k, v))
    }
    break
  }
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155021199
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__268954 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__268955 = this;
  var h__364__auto____268956 = this__268955.__hash;
  if(h__364__auto____268956 != null) {
    return h__364__auto____268956
  }else {
    var h__364__auto____268957 = cljs.core.hash_imap.call(null, coll);
    this__268955.__hash = h__364__auto____268957;
    return h__364__auto____268957
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__268958 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__268959 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__268959.strobj, this__268959.strobj[k], not_found)
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__268960 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var overwrite_QMARK___268961 = this__268960.strobj.hasOwnProperty(k);
    if(cljs.core.truth_(overwrite_QMARK___268961)) {
      var new_strobj__268962 = goog.object.clone.call(null, this__268960.strobj);
      new_strobj__268962[k] = v;
      return new cljs.core.ObjMap(this__268960.meta, this__268960.keys, new_strobj__268962, this__268960.update_count + 1, null)
    }else {
      if(this__268960.update_count < cljs.core.ObjMap.HASHMAP_THRESHOLD) {
        var new_strobj__268963 = goog.object.clone.call(null, this__268960.strobj);
        var new_keys__268964 = cljs.core.aclone.call(null, this__268960.keys);
        new_strobj__268963[k] = v;
        new_keys__268964.push(k);
        return new cljs.core.ObjMap(this__268960.meta, new_keys__268964, new_strobj__268963, this__268960.update_count + 1, null)
      }else {
        return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__268965 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__268965.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__268985 = null;
  var G__268985__2 = function(tsym268952, k) {
    var this__268966 = this;
    var tsym268952__268967 = this;
    var coll__268968 = tsym268952__268967;
    return cljs.core._lookup.call(null, coll__268968, k)
  };
  var G__268985__3 = function(tsym268953, k, not_found) {
    var this__268969 = this;
    var tsym268953__268970 = this;
    var coll__268971 = tsym268953__268970;
    return cljs.core._lookup.call(null, coll__268971, k, not_found)
  };
  G__268985 = function(tsym268953, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__268985__2.call(this, tsym268953, k);
      case 3:
        return G__268985__3.call(this, tsym268953, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__268985
}();
cljs.core.ObjMap.prototype.apply = function(tsym268950, args268951) {
  return tsym268950.call.apply(tsym268950, [tsym268950].concat(cljs.core.aclone.call(null, args268951)))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__268972 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__268973 = this;
  var this$__268974 = this;
  return cljs.core.pr_str.call(null, this$__268974)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__268975 = this;
  if(this__268975.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__268940_SHARP_) {
      return cljs.core.vector.call(null, p1__268940_SHARP_, this__268975.strobj[p1__268940_SHARP_])
    }, this__268975.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__268976 = this;
  return this__268976.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__268977 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__268978 = this;
  return new cljs.core.ObjMap(meta, this__268978.keys, this__268978.strobj, this__268978.update_count, this__268978.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__268979 = this;
  return this__268979.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__268980 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__268980.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__268981 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____268982 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3822__auto____268982)) {
      return this__268981.strobj.hasOwnProperty(k)
    }else {
      return and__3822__auto____268982
    }
  }())) {
    var new_keys__268983 = cljs.core.aclone.call(null, this__268981.keys);
    var new_strobj__268984 = goog.object.clone.call(null, this__268981.strobj);
    new_keys__268983.splice(cljs.core.scan_array.call(null, 1, k, new_keys__268983), 1);
    cljs.core.js_delete.call(null, new_strobj__268984, k);
    return new cljs.core.ObjMap(this__268981.meta, new_keys__268983, new_strobj__268984, this__268981.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 7537551
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__268991 = this;
  var h__364__auto____268992 = this__268991.__hash;
  if(h__364__auto____268992 != null) {
    return h__364__auto____268992
  }else {
    var h__364__auto____268993 = cljs.core.hash_imap.call(null, coll);
    this__268991.__hash = h__364__auto____268993;
    return h__364__auto____268993
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__268994 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__268995 = this;
  var bucket__268996 = this__268995.hashobj[cljs.core.hash.call(null, k)];
  var i__268997 = cljs.core.truth_(bucket__268996) ? cljs.core.scan_array.call(null, 2, k, bucket__268996) : null;
  if(cljs.core.truth_(i__268997)) {
    return bucket__268996[i__268997 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__268998 = this;
  var h__268999 = cljs.core.hash.call(null, k);
  var bucket__269000 = this__268998.hashobj[h__268999];
  if(cljs.core.truth_(bucket__269000)) {
    var new_bucket__269001 = cljs.core.aclone.call(null, bucket__269000);
    var new_hashobj__269002 = goog.object.clone.call(null, this__268998.hashobj);
    new_hashobj__269002[h__268999] = new_bucket__269001;
    var temp__3971__auto____269003 = cljs.core.scan_array.call(null, 2, k, new_bucket__269001);
    if(cljs.core.truth_(temp__3971__auto____269003)) {
      var i__269004 = temp__3971__auto____269003;
      new_bucket__269001[i__269004 + 1] = v;
      return new cljs.core.HashMap(this__268998.meta, this__268998.count, new_hashobj__269002, null)
    }else {
      new_bucket__269001.push(k, v);
      return new cljs.core.HashMap(this__268998.meta, this__268998.count + 1, new_hashobj__269002, null)
    }
  }else {
    var new_hashobj__269005 = goog.object.clone.call(null, this__268998.hashobj);
    new_hashobj__269005[h__268999] = [k, v];
    return new cljs.core.HashMap(this__268998.meta, this__268998.count + 1, new_hashobj__269005, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__269006 = this;
  var bucket__269007 = this__269006.hashobj[cljs.core.hash.call(null, k)];
  var i__269008 = cljs.core.truth_(bucket__269007) ? cljs.core.scan_array.call(null, 2, k, bucket__269007) : null;
  if(cljs.core.truth_(i__269008)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__269031 = null;
  var G__269031__2 = function(tsym268989, k) {
    var this__269009 = this;
    var tsym268989__269010 = this;
    var coll__269011 = tsym268989__269010;
    return cljs.core._lookup.call(null, coll__269011, k)
  };
  var G__269031__3 = function(tsym268990, k, not_found) {
    var this__269012 = this;
    var tsym268990__269013 = this;
    var coll__269014 = tsym268990__269013;
    return cljs.core._lookup.call(null, coll__269014, k, not_found)
  };
  G__269031 = function(tsym268990, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__269031__2.call(this, tsym268990, k);
      case 3:
        return G__269031__3.call(this, tsym268990, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__269031
}();
cljs.core.HashMap.prototype.apply = function(tsym268987, args268988) {
  return tsym268987.call.apply(tsym268987, [tsym268987].concat(cljs.core.aclone.call(null, args268988)))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__269015 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__269016 = this;
  var this$__269017 = this;
  return cljs.core.pr_str.call(null, this$__269017)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__269018 = this;
  if(this__269018.count > 0) {
    var hashes__269019 = cljs.core.js_keys.call(null, this__269018.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__268986_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__269018.hashobj[p1__268986_SHARP_]))
    }, hashes__269019)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__269020 = this;
  return this__269020.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__269021 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__269022 = this;
  return new cljs.core.HashMap(meta, this__269022.count, this__269022.hashobj, this__269022.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__269023 = this;
  return this__269023.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__269024 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__269024.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__269025 = this;
  var h__269026 = cljs.core.hash.call(null, k);
  var bucket__269027 = this__269025.hashobj[h__269026];
  var i__269028 = cljs.core.truth_(bucket__269027) ? cljs.core.scan_array.call(null, 2, k, bucket__269027) : null;
  if(cljs.core.not.call(null, i__269028)) {
    return coll
  }else {
    var new_hashobj__269029 = goog.object.clone.call(null, this__269025.hashobj);
    if(3 > bucket__269027.length) {
      cljs.core.js_delete.call(null, new_hashobj__269029, h__269026)
    }else {
      var new_bucket__269030 = cljs.core.aclone.call(null, bucket__269027);
      new_bucket__269030.splice(i__269028, 2);
      new_hashobj__269029[h__269026] = new_bucket__269030
    }
    return new cljs.core.HashMap(this__269025.meta, this__269025.count - 1, new_hashobj__269029, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__269032 = ks.length;
  var i__269033 = 0;
  var out__269034 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__269033 < len__269032) {
      var G__269035 = i__269033 + 1;
      var G__269036 = cljs.core.assoc.call(null, out__269034, ks[i__269033], vs[i__269033]);
      i__269033 = G__269035;
      out__269034 = G__269036;
      continue
    }else {
      return out__269034
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__269037 = m.arr;
  var len__269038 = arr__269037.length;
  var i__269039 = 0;
  while(true) {
    if(len__269038 <= i__269039) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__269037[i__269039], k)) {
        return i__269039
      }else {
        if("\ufdd0'else") {
          var G__269040 = i__269039 + 2;
          i__269039 = G__269040;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
void 0;
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__269045 = this;
  return new cljs.core.TransientArrayMap({}, this__269045.arr.length, cljs.core.aclone.call(null, this__269045.arr))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__269046 = this;
  var h__364__auto____269047 = this__269046.__hash;
  if(h__364__auto____269047 != null) {
    return h__364__auto____269047
  }else {
    var h__364__auto____269048 = cljs.core.hash_imap.call(null, coll);
    this__269046.__hash = h__364__auto____269048;
    return h__364__auto____269048
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__269049 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__269050 = this;
  var idx__269051 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__269051 === -1) {
    return not_found
  }else {
    return this__269050.arr[idx__269051 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__269052 = this;
  var idx__269053 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__269053 === -1) {
    if(this__269052.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__269052.meta, this__269052.cnt + 1, function() {
        var G__269054__269055 = cljs.core.aclone.call(null, this__269052.arr);
        G__269054__269055.push(k);
        G__269054__269055.push(v);
        return G__269054__269055
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__269052.arr[idx__269053 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__269052.meta, this__269052.cnt, function() {
          var G__269056__269057 = cljs.core.aclone.call(null, this__269052.arr);
          G__269056__269057[idx__269053 + 1] = v;
          return G__269056__269057
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__269058 = this;
  return cljs.core.array_map_index_of.call(null, coll, k) != -1
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__269088 = null;
  var G__269088__2 = function(tsym269043, k) {
    var this__269059 = this;
    var tsym269043__269060 = this;
    var coll__269061 = tsym269043__269060;
    return cljs.core._lookup.call(null, coll__269061, k)
  };
  var G__269088__3 = function(tsym269044, k, not_found) {
    var this__269062 = this;
    var tsym269044__269063 = this;
    var coll__269064 = tsym269044__269063;
    return cljs.core._lookup.call(null, coll__269064, k, not_found)
  };
  G__269088 = function(tsym269044, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__269088__2.call(this, tsym269044, k);
      case 3:
        return G__269088__3.call(this, tsym269044, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__269088
}();
cljs.core.PersistentArrayMap.prototype.apply = function(tsym269041, args269042) {
  return tsym269041.call.apply(tsym269041, [tsym269041].concat(cljs.core.aclone.call(null, args269042)))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__269065 = this;
  var len__269066 = this__269065.arr.length;
  var i__269067 = 0;
  var init__269068 = init;
  while(true) {
    if(i__269067 < len__269066) {
      var init__269069 = f.call(null, init__269068, this__269065.arr[i__269067], this__269065.arr[i__269067 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__269069)) {
        return cljs.core.deref.call(null, init__269069)
      }else {
        var G__269089 = i__269067 + 2;
        var G__269090 = init__269069;
        i__269067 = G__269089;
        init__269068 = G__269090;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__269070 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__269071 = this;
  var this$__269072 = this;
  return cljs.core.pr_str.call(null, this$__269072)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__269073 = this;
  if(this__269073.cnt > 0) {
    var len__269074 = this__269073.arr.length;
    var array_map_seq__269075 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__269074) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__269073.arr[i], this__269073.arr[i + 1]]), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      })
    };
    return array_map_seq__269075.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__269076 = this;
  return this__269076.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__269077 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__269078 = this;
  return new cljs.core.PersistentArrayMap(meta, this__269078.cnt, this__269078.arr, this__269078.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__269079 = this;
  return this__269079.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__269080 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__269080.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__269081 = this;
  var idx__269082 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__269082 >= 0) {
    var len__269083 = this__269081.arr.length;
    var new_len__269084 = len__269083 - 2;
    if(new_len__269084 === 0) {
      return cljs.core._empty.call(null, coll)
    }else {
      var new_arr__269085 = cljs.core.make_array.call(null, new_len__269084);
      var s__269086 = 0;
      var d__269087 = 0;
      while(true) {
        if(s__269086 >= len__269083) {
          return new cljs.core.PersistentArrayMap(this__269081.meta, this__269081.cnt - 1, new_arr__269085, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__269081.arr[s__269086])) {
            var G__269091 = s__269086 + 2;
            var G__269092 = d__269087;
            s__269086 = G__269091;
            d__269087 = G__269092;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__269085[d__269087] = this__269081.arr[s__269086];
              new_arr__269085[d__269087 + 1] = this__269081.arr[s__269086 + 1];
              var G__269093 = s__269086 + 2;
              var G__269094 = d__269087 + 2;
              s__269086 = G__269093;
              d__269087 = G__269094;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__269095 = cljs.core.count.call(null, ks);
  var i__269096 = 0;
  var out__269097 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__269096 < len__269095) {
      var G__269098 = i__269096 + 1;
      var G__269099 = cljs.core.assoc_BANG_.call(null, out__269097, ks[i__269096], vs[i__269096]);
      i__269096 = G__269098;
      out__269097 = G__269099;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__269097)
    }
    break
  }
};
void 0;
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__269100 = this;
  if(cljs.core.truth_(this__269100.editable_QMARK_)) {
    var idx__269101 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__269101 >= 0) {
      this__269100.arr[idx__269101] = this__269100.arr[this__269100.len - 2];
      this__269100.arr[idx__269101 + 1] = this__269100.arr[this__269100.len - 1];
      var G__269102__269103 = this__269100.arr;
      G__269102__269103.pop();
      G__269102__269103.pop();
      G__269102__269103;
      this__269100.len = this__269100.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__269104 = this;
  if(cljs.core.truth_(this__269104.editable_QMARK_)) {
    var idx__269105 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__269105 === -1) {
      if(this__269104.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__269104.len = this__269104.len + 2;
        this__269104.arr.push(key);
        this__269104.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__269104.len, this__269104.arr), key, val)
      }
    }else {
      if(val === this__269104.arr[idx__269105 + 1]) {
        return tcoll
      }else {
        this__269104.arr[idx__269105 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__269106 = this;
  if(cljs.core.truth_(this__269106.editable_QMARK_)) {
    if(function() {
      var G__269107__269108 = o;
      if(G__269107__269108 != null) {
        if(function() {
          var or__3824__auto____269109 = G__269107__269108.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3824__auto____269109) {
            return or__3824__auto____269109
          }else {
            return G__269107__269108.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__269107__269108.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__269107__269108)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__269107__269108)
      }
    }()) {
      return cljs.core._assoc_BANG_.call(null, tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__269110 = cljs.core.seq.call(null, o);
      var tcoll__269111 = tcoll;
      while(true) {
        var temp__3971__auto____269112 = cljs.core.first.call(null, es__269110);
        if(cljs.core.truth_(temp__3971__auto____269112)) {
          var e__269113 = temp__3971__auto____269112;
          var G__269119 = cljs.core.next.call(null, es__269110);
          var G__269120 = cljs.core._assoc_BANG_.call(null, tcoll__269111, cljs.core.key.call(null, e__269113), cljs.core.val.call(null, e__269113));
          es__269110 = G__269119;
          tcoll__269111 = G__269120;
          continue
        }else {
          return tcoll__269111
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__269114 = this;
  if(cljs.core.truth_(this__269114.editable_QMARK_)) {
    this__269114.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__269114.len, 2), this__269114.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__269115 = this;
  return cljs.core._lookup.call(null, tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__269116 = this;
  if(cljs.core.truth_(this__269116.editable_QMARK_)) {
    var idx__269117 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__269117 === -1) {
      return not_found
    }else {
      return this__269116.arr[idx__269117 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__269118 = this;
  if(cljs.core.truth_(this__269118.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__269118.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__269121 = cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {}));
  var i__269122 = 0;
  while(true) {
    if(i__269122 < len) {
      var G__269123 = cljs.core.assoc_BANG_.call(null, out__269121, arr[i__269122], arr[i__269122 + 1]);
      var G__269124 = i__269122 + 2;
      out__269121 = G__269123;
      i__269122 = G__269124;
      continue
    }else {
      return out__269121
    }
    break
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__269125__269126 = cljs.core.aclone.call(null, arr);
    G__269125__269126[i] = a;
    return G__269125__269126
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__269127__269128 = cljs.core.aclone.call(null, arr);
    G__269127__269128[i] = a;
    G__269127__269128[j] = b;
    return G__269127__269128
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__269129 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__269129, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__269129, 2 * i, new_arr__269129.length - 2 * i);
  return new_arr__269129
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__269130 = inode.ensure_editable(edit);
    editable__269130.arr[i] = a;
    return editable__269130
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__269131 = inode.ensure_editable(edit);
    editable__269131.arr[i] = a;
    editable__269131.arr[j] = b;
    return editable__269131
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__269132 = arr.length;
  var i__269133 = 0;
  var init__269134 = init;
  while(true) {
    if(i__269133 < len__269132) {
      var init__269137 = function() {
        var k__269135 = arr[i__269133];
        if(k__269135 != null) {
          return f.call(null, init__269134, k__269135, arr[i__269133 + 1])
        }else {
          var node__269136 = arr[i__269133 + 1];
          if(node__269136 != null) {
            return node__269136.kv_reduce(f, init__269134)
          }else {
            return init__269134
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__269137)) {
        return cljs.core.deref.call(null, init__269137)
      }else {
        var G__269138 = i__269133 + 2;
        var G__269139 = init__269137;
        i__269133 = G__269138;
        init__269134 = G__269139;
        continue
      }
    }else {
      return init__269134
    }
    break
  }
};
void 0;
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__269140 = this;
  var inode__269141 = this;
  if(this__269140.bitmap === bit) {
    return null
  }else {
    var editable__269142 = inode__269141.ensure_editable(e);
    var earr__269143 = editable__269142.arr;
    var len__269144 = earr__269143.length;
    editable__269142.bitmap = bit ^ editable__269142.bitmap;
    cljs.core.array_copy.call(null, earr__269143, 2 * (i + 1), earr__269143, 2 * i, len__269144 - 2 * (i + 1));
    earr__269143[len__269144 - 2] = null;
    earr__269143[len__269144 - 1] = null;
    return editable__269142
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__269145 = this;
  var inode__269146 = this;
  var bit__269147 = 1 << (hash >>> shift & 31);
  var idx__269148 = cljs.core.bitmap_indexed_node_index.call(null, this__269145.bitmap, bit__269147);
  if((this__269145.bitmap & bit__269147) === 0) {
    var n__269149 = cljs.core.bit_count.call(null, this__269145.bitmap);
    if(2 * n__269149 < this__269145.arr.length) {
      var editable__269150 = inode__269146.ensure_editable(edit);
      var earr__269151 = editable__269150.arr;
      added_leaf_QMARK_[0] = true;
      cljs.core.array_copy_downward.call(null, earr__269151, 2 * idx__269148, earr__269151, 2 * (idx__269148 + 1), 2 * (n__269149 - idx__269148));
      earr__269151[2 * idx__269148] = key;
      earr__269151[2 * idx__269148 + 1] = val;
      editable__269150.bitmap = editable__269150.bitmap | bit__269147;
      return editable__269150
    }else {
      if(n__269149 >= 16) {
        var nodes__269152 = cljs.core.make_array.call(null, 32);
        var jdx__269153 = hash >>> shift & 31;
        nodes__269152[jdx__269153] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__269154 = 0;
        var j__269155 = 0;
        while(true) {
          if(i__269154 < 32) {
            if((this__269145.bitmap >>> i__269154 & 1) === 0) {
              var G__269208 = i__269154 + 1;
              var G__269209 = j__269155;
              i__269154 = G__269208;
              j__269155 = G__269209;
              continue
            }else {
              nodes__269152[i__269154] = null != this__269145.arr[j__269155] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__269145.arr[j__269155]), this__269145.arr[j__269155], this__269145.arr[j__269155 + 1], added_leaf_QMARK_) : this__269145.arr[j__269155 + 1];
              var G__269210 = i__269154 + 1;
              var G__269211 = j__269155 + 2;
              i__269154 = G__269210;
              j__269155 = G__269211;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__269149 + 1, nodes__269152)
      }else {
        if("\ufdd0'else") {
          var new_arr__269156 = cljs.core.make_array.call(null, 2 * (n__269149 + 4));
          cljs.core.array_copy.call(null, this__269145.arr, 0, new_arr__269156, 0, 2 * idx__269148);
          new_arr__269156[2 * idx__269148] = key;
          added_leaf_QMARK_[0] = true;
          new_arr__269156[2 * idx__269148 + 1] = val;
          cljs.core.array_copy.call(null, this__269145.arr, 2 * idx__269148, new_arr__269156, 2 * (idx__269148 + 1), 2 * (n__269149 - idx__269148));
          var editable__269157 = inode__269146.ensure_editable(edit);
          editable__269157.arr = new_arr__269156;
          editable__269157.bitmap = editable__269157.bitmap | bit__269147;
          return editable__269157
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__269158 = this__269145.arr[2 * idx__269148];
    var val_or_node__269159 = this__269145.arr[2 * idx__269148 + 1];
    if(null == key_or_nil__269158) {
      var n__269160 = val_or_node__269159.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__269160 === val_or_node__269159) {
        return inode__269146
      }else {
        return cljs.core.edit_and_set.call(null, inode__269146, edit, 2 * idx__269148 + 1, n__269160)
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__269158)) {
        if(val === val_or_node__269159) {
          return inode__269146
        }else {
          return cljs.core.edit_and_set.call(null, inode__269146, edit, 2 * idx__269148 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return cljs.core.edit_and_set.call(null, inode__269146, edit, 2 * idx__269148, null, 2 * idx__269148 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__269158, val_or_node__269159, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__269161 = this;
  var inode__269162 = this;
  return cljs.core.create_inode_seq.call(null, this__269161.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__269163 = this;
  var inode__269164 = this;
  var bit__269165 = 1 << (hash >>> shift & 31);
  if((this__269163.bitmap & bit__269165) === 0) {
    return inode__269164
  }else {
    var idx__269166 = cljs.core.bitmap_indexed_node_index.call(null, this__269163.bitmap, bit__269165);
    var key_or_nil__269167 = this__269163.arr[2 * idx__269166];
    var val_or_node__269168 = this__269163.arr[2 * idx__269166 + 1];
    if(null == key_or_nil__269167) {
      var n__269169 = val_or_node__269168.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__269169 === val_or_node__269168) {
        return inode__269164
      }else {
        if(null != n__269169) {
          return cljs.core.edit_and_set.call(null, inode__269164, edit, 2 * idx__269166 + 1, n__269169)
        }else {
          if(this__269163.bitmap === bit__269165) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__269164.edit_and_remove_pair(edit, bit__269165, idx__269166)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__269167)) {
        removed_leaf_QMARK_[0] = true;
        return inode__269164.edit_and_remove_pair(edit, bit__269165, idx__269166)
      }else {
        if("\ufdd0'else") {
          return inode__269164
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__269170 = this;
  var inode__269171 = this;
  if(e === this__269170.edit) {
    return inode__269171
  }else {
    var n__269172 = cljs.core.bit_count.call(null, this__269170.bitmap);
    var new_arr__269173 = cljs.core.make_array.call(null, n__269172 < 0 ? 4 : 2 * (n__269172 + 1));
    cljs.core.array_copy.call(null, this__269170.arr, 0, new_arr__269173, 0, 2 * n__269172);
    return new cljs.core.BitmapIndexedNode(e, this__269170.bitmap, new_arr__269173)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__269174 = this;
  var inode__269175 = this;
  return cljs.core.inode_kv_reduce.call(null, this__269174.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function() {
  var G__269212 = null;
  var G__269212__3 = function(shift, hash, key) {
    var this__269176 = this;
    var inode__269177 = this;
    var bit__269178 = 1 << (hash >>> shift & 31);
    if((this__269176.bitmap & bit__269178) === 0) {
      return null
    }else {
      var idx__269179 = cljs.core.bitmap_indexed_node_index.call(null, this__269176.bitmap, bit__269178);
      var key_or_nil__269180 = this__269176.arr[2 * idx__269179];
      var val_or_node__269181 = this__269176.arr[2 * idx__269179 + 1];
      if(null == key_or_nil__269180) {
        return val_or_node__269181.inode_find(shift + 5, hash, key)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__269180)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__269180, val_or_node__269181])
        }else {
          if("\ufdd0'else") {
            return null
          }else {
            return null
          }
        }
      }
    }
  };
  var G__269212__4 = function(shift, hash, key, not_found) {
    var this__269182 = this;
    var inode__269183 = this;
    var bit__269184 = 1 << (hash >>> shift & 31);
    if((this__269182.bitmap & bit__269184) === 0) {
      return not_found
    }else {
      var idx__269185 = cljs.core.bitmap_indexed_node_index.call(null, this__269182.bitmap, bit__269184);
      var key_or_nil__269186 = this__269182.arr[2 * idx__269185];
      var val_or_node__269187 = this__269182.arr[2 * idx__269185 + 1];
      if(null == key_or_nil__269186) {
        return val_or_node__269187.inode_find(shift + 5, hash, key, not_found)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__269186)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__269186, val_or_node__269187])
        }else {
          if("\ufdd0'else") {
            return not_found
          }else {
            return null
          }
        }
      }
    }
  };
  G__269212 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__269212__3.call(this, shift, hash, key);
      case 4:
        return G__269212__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__269212
}();
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__269188 = this;
  var inode__269189 = this;
  var bit__269190 = 1 << (hash >>> shift & 31);
  if((this__269188.bitmap & bit__269190) === 0) {
    return inode__269189
  }else {
    var idx__269191 = cljs.core.bitmap_indexed_node_index.call(null, this__269188.bitmap, bit__269190);
    var key_or_nil__269192 = this__269188.arr[2 * idx__269191];
    var val_or_node__269193 = this__269188.arr[2 * idx__269191 + 1];
    if(null == key_or_nil__269192) {
      var n__269194 = val_or_node__269193.inode_without(shift + 5, hash, key);
      if(n__269194 === val_or_node__269193) {
        return inode__269189
      }else {
        if(null != n__269194) {
          return new cljs.core.BitmapIndexedNode(null, this__269188.bitmap, cljs.core.clone_and_set.call(null, this__269188.arr, 2 * idx__269191 + 1, n__269194))
        }else {
          if(this__269188.bitmap === bit__269190) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__269188.bitmap ^ bit__269190, cljs.core.remove_pair.call(null, this__269188.arr, idx__269191))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__269192)) {
        return new cljs.core.BitmapIndexedNode(null, this__269188.bitmap ^ bit__269190, cljs.core.remove_pair.call(null, this__269188.arr, idx__269191))
      }else {
        if("\ufdd0'else") {
          return inode__269189
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__269195 = this;
  var inode__269196 = this;
  var bit__269197 = 1 << (hash >>> shift & 31);
  var idx__269198 = cljs.core.bitmap_indexed_node_index.call(null, this__269195.bitmap, bit__269197);
  if((this__269195.bitmap & bit__269197) === 0) {
    var n__269199 = cljs.core.bit_count.call(null, this__269195.bitmap);
    if(n__269199 >= 16) {
      var nodes__269200 = cljs.core.make_array.call(null, 32);
      var jdx__269201 = hash >>> shift & 31;
      nodes__269200[jdx__269201] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__269202 = 0;
      var j__269203 = 0;
      while(true) {
        if(i__269202 < 32) {
          if((this__269195.bitmap >>> i__269202 & 1) === 0) {
            var G__269213 = i__269202 + 1;
            var G__269214 = j__269203;
            i__269202 = G__269213;
            j__269203 = G__269214;
            continue
          }else {
            nodes__269200[i__269202] = null != this__269195.arr[j__269203] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__269195.arr[j__269203]), this__269195.arr[j__269203], this__269195.arr[j__269203 + 1], added_leaf_QMARK_) : this__269195.arr[j__269203 + 1];
            var G__269215 = i__269202 + 1;
            var G__269216 = j__269203 + 2;
            i__269202 = G__269215;
            j__269203 = G__269216;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__269199 + 1, nodes__269200)
    }else {
      var new_arr__269204 = cljs.core.make_array.call(null, 2 * (n__269199 + 1));
      cljs.core.array_copy.call(null, this__269195.arr, 0, new_arr__269204, 0, 2 * idx__269198);
      new_arr__269204[2 * idx__269198] = key;
      added_leaf_QMARK_[0] = true;
      new_arr__269204[2 * idx__269198 + 1] = val;
      cljs.core.array_copy.call(null, this__269195.arr, 2 * idx__269198, new_arr__269204, 2 * (idx__269198 + 1), 2 * (n__269199 - idx__269198));
      return new cljs.core.BitmapIndexedNode(null, this__269195.bitmap | bit__269197, new_arr__269204)
    }
  }else {
    var key_or_nil__269205 = this__269195.arr[2 * idx__269198];
    var val_or_node__269206 = this__269195.arr[2 * idx__269198 + 1];
    if(null == key_or_nil__269205) {
      var n__269207 = val_or_node__269206.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__269207 === val_or_node__269206) {
        return inode__269196
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__269195.bitmap, cljs.core.clone_and_set.call(null, this__269195.arr, 2 * idx__269198 + 1, n__269207))
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__269205)) {
        if(val === val_or_node__269206) {
          return inode__269196
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__269195.bitmap, cljs.core.clone_and_set.call(null, this__269195.arr, 2 * idx__269198 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return new cljs.core.BitmapIndexedNode(null, this__269195.bitmap, cljs.core.clone_and_set.call(null, this__269195.arr, 2 * idx__269198, null, 2 * idx__269198 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__269205, val_or_node__269206, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__269217 = array_node.arr;
  var len__269218 = 2 * (array_node.cnt - 1);
  var new_arr__269219 = cljs.core.make_array.call(null, len__269218);
  var i__269220 = 0;
  var j__269221 = 1;
  var bitmap__269222 = 0;
  while(true) {
    if(i__269220 < len__269218) {
      if(function() {
        var and__3822__auto____269223 = i__269220 != idx;
        if(and__3822__auto____269223) {
          return null != arr__269217[i__269220]
        }else {
          return and__3822__auto____269223
        }
      }()) {
        new_arr__269219[j__269221] = arr__269217[i__269220];
        var G__269224 = i__269220 + 1;
        var G__269225 = j__269221 + 2;
        var G__269226 = bitmap__269222 | 1 << i__269220;
        i__269220 = G__269224;
        j__269221 = G__269225;
        bitmap__269222 = G__269226;
        continue
      }else {
        var G__269227 = i__269220 + 1;
        var G__269228 = j__269221;
        var G__269229 = bitmap__269222;
        i__269220 = G__269227;
        j__269221 = G__269228;
        bitmap__269222 = G__269229;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__269222, new_arr__269219)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__269230 = this;
  var inode__269231 = this;
  var idx__269232 = hash >>> shift & 31;
  var node__269233 = this__269230.arr[idx__269232];
  if(null == node__269233) {
    return new cljs.core.ArrayNode(null, this__269230.cnt + 1, cljs.core.clone_and_set.call(null, this__269230.arr, idx__269232, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__269234 = node__269233.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__269234 === node__269233) {
      return inode__269231
    }else {
      return new cljs.core.ArrayNode(null, this__269230.cnt, cljs.core.clone_and_set.call(null, this__269230.arr, idx__269232, n__269234))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__269235 = this;
  var inode__269236 = this;
  var idx__269237 = hash >>> shift & 31;
  var node__269238 = this__269235.arr[idx__269237];
  if(null != node__269238) {
    var n__269239 = node__269238.inode_without(shift + 5, hash, key);
    if(n__269239 === node__269238) {
      return inode__269236
    }else {
      if(n__269239 == null) {
        if(this__269235.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__269236, null, idx__269237)
        }else {
          return new cljs.core.ArrayNode(null, this__269235.cnt - 1, cljs.core.clone_and_set.call(null, this__269235.arr, idx__269237, n__269239))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__269235.cnt, cljs.core.clone_and_set.call(null, this__269235.arr, idx__269237, n__269239))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__269236
  }
};
cljs.core.ArrayNode.prototype.inode_find = function() {
  var G__269271 = null;
  var G__269271__3 = function(shift, hash, key) {
    var this__269240 = this;
    var inode__269241 = this;
    var idx__269242 = hash >>> shift & 31;
    var node__269243 = this__269240.arr[idx__269242];
    if(null != node__269243) {
      return node__269243.inode_find(shift + 5, hash, key)
    }else {
      return null
    }
  };
  var G__269271__4 = function(shift, hash, key, not_found) {
    var this__269244 = this;
    var inode__269245 = this;
    var idx__269246 = hash >>> shift & 31;
    var node__269247 = this__269244.arr[idx__269246];
    if(null != node__269247) {
      return node__269247.inode_find(shift + 5, hash, key, not_found)
    }else {
      return not_found
    }
  };
  G__269271 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__269271__3.call(this, shift, hash, key);
      case 4:
        return G__269271__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__269271
}();
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__269248 = this;
  var inode__269249 = this;
  return cljs.core.create_array_node_seq.call(null, this__269248.arr)
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__269250 = this;
  var inode__269251 = this;
  if(e === this__269250.edit) {
    return inode__269251
  }else {
    return new cljs.core.ArrayNode(e, this__269250.cnt, cljs.core.aclone.call(null, this__269250.arr))
  }
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__269252 = this;
  var inode__269253 = this;
  var idx__269254 = hash >>> shift & 31;
  var node__269255 = this__269252.arr[idx__269254];
  if(null == node__269255) {
    var editable__269256 = cljs.core.edit_and_set.call(null, inode__269253, edit, idx__269254, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__269256.cnt = editable__269256.cnt + 1;
    return editable__269256
  }else {
    var n__269257 = node__269255.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__269257 === node__269255) {
      return inode__269253
    }else {
      return cljs.core.edit_and_set.call(null, inode__269253, edit, idx__269254, n__269257)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__269258 = this;
  var inode__269259 = this;
  var idx__269260 = hash >>> shift & 31;
  var node__269261 = this__269258.arr[idx__269260];
  if(null == node__269261) {
    return inode__269259
  }else {
    var n__269262 = node__269261.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__269262 === node__269261) {
      return inode__269259
    }else {
      if(null == n__269262) {
        if(this__269258.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__269259, edit, idx__269260)
        }else {
          var editable__269263 = cljs.core.edit_and_set.call(null, inode__269259, edit, idx__269260, n__269262);
          editable__269263.cnt = editable__269263.cnt - 1;
          return editable__269263
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__269259, edit, idx__269260, n__269262)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__269264 = this;
  var inode__269265 = this;
  var len__269266 = this__269264.arr.length;
  var i__269267 = 0;
  var init__269268 = init;
  while(true) {
    if(i__269267 < len__269266) {
      var node__269269 = this__269264.arr[i__269267];
      if(node__269269 != null) {
        var init__269270 = node__269269.kv_reduce(f, init__269268);
        if(cljs.core.reduced_QMARK_.call(null, init__269270)) {
          return cljs.core.deref.call(null, init__269270)
        }else {
          var G__269272 = i__269267 + 1;
          var G__269273 = init__269270;
          i__269267 = G__269272;
          init__269268 = G__269273;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__269268
    }
    break
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__269274 = 2 * cnt;
  var i__269275 = 0;
  while(true) {
    if(i__269275 < lim__269274) {
      if(cljs.core._EQ_.call(null, key, arr[i__269275])) {
        return i__269275
      }else {
        var G__269276 = i__269275 + 2;
        i__269275 = G__269276;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__269277 = this;
  var inode__269278 = this;
  if(hash === this__269277.collision_hash) {
    var idx__269279 = cljs.core.hash_collision_node_find_index.call(null, this__269277.arr, this__269277.cnt, key);
    if(idx__269279 === -1) {
      var len__269280 = this__269277.arr.length;
      var new_arr__269281 = cljs.core.make_array.call(null, len__269280 + 2);
      cljs.core.array_copy.call(null, this__269277.arr, 0, new_arr__269281, 0, len__269280);
      new_arr__269281[len__269280] = key;
      new_arr__269281[len__269280 + 1] = val;
      added_leaf_QMARK_[0] = true;
      return new cljs.core.HashCollisionNode(null, this__269277.collision_hash, this__269277.cnt + 1, new_arr__269281)
    }else {
      if(cljs.core._EQ_.call(null, this__269277.arr[idx__269279], val)) {
        return inode__269278
      }else {
        return new cljs.core.HashCollisionNode(null, this__269277.collision_hash, this__269277.cnt, cljs.core.clone_and_set.call(null, this__269277.arr, idx__269279 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__269277.collision_hash >>> shift & 31), [null, inode__269278])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__269282 = this;
  var inode__269283 = this;
  var idx__269284 = cljs.core.hash_collision_node_find_index.call(null, this__269282.arr, this__269282.cnt, key);
  if(idx__269284 === -1) {
    return inode__269283
  }else {
    if(this__269282.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__269282.collision_hash, this__269282.cnt - 1, cljs.core.remove_pair.call(null, this__269282.arr, cljs.core.quot.call(null, idx__269284, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_find = function() {
  var G__269311 = null;
  var G__269311__3 = function(shift, hash, key) {
    var this__269285 = this;
    var inode__269286 = this;
    var idx__269287 = cljs.core.hash_collision_node_find_index.call(null, this__269285.arr, this__269285.cnt, key);
    if(idx__269287 < 0) {
      return null
    }else {
      if(cljs.core._EQ_.call(null, key, this__269285.arr[idx__269287])) {
        return cljs.core.PersistentVector.fromArray([this__269285.arr[idx__269287], this__269285.arr[idx__269287 + 1]])
      }else {
        if("\ufdd0'else") {
          return null
        }else {
          return null
        }
      }
    }
  };
  var G__269311__4 = function(shift, hash, key, not_found) {
    var this__269288 = this;
    var inode__269289 = this;
    var idx__269290 = cljs.core.hash_collision_node_find_index.call(null, this__269288.arr, this__269288.cnt, key);
    if(idx__269290 < 0) {
      return not_found
    }else {
      if(cljs.core._EQ_.call(null, key, this__269288.arr[idx__269290])) {
        return cljs.core.PersistentVector.fromArray([this__269288.arr[idx__269290], this__269288.arr[idx__269290 + 1]])
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  };
  G__269311 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__269311__3.call(this, shift, hash, key);
      case 4:
        return G__269311__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__269311
}();
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__269291 = this;
  var inode__269292 = this;
  return cljs.core.create_inode_seq.call(null, this__269291.arr)
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function() {
  var G__269312 = null;
  var G__269312__1 = function(e) {
    var this__269293 = this;
    var inode__269294 = this;
    if(e === this__269293.edit) {
      return inode__269294
    }else {
      var new_arr__269295 = cljs.core.make_array.call(null, 2 * (this__269293.cnt + 1));
      cljs.core.array_copy.call(null, this__269293.arr, 0, new_arr__269295, 0, 2 * this__269293.cnt);
      return new cljs.core.HashCollisionNode(e, this__269293.collision_hash, this__269293.cnt, new_arr__269295)
    }
  };
  var G__269312__3 = function(e, count, array) {
    var this__269296 = this;
    var inode__269297 = this;
    if(e === this__269296.edit) {
      this__269296.arr = array;
      this__269296.cnt = count;
      return inode__269297
    }else {
      return new cljs.core.HashCollisionNode(this__269296.edit, this__269296.collision_hash, count, array)
    }
  };
  G__269312 = function(e, count, array) {
    switch(arguments.length) {
      case 1:
        return G__269312__1.call(this, e);
      case 3:
        return G__269312__3.call(this, e, count, array)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__269312
}();
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__269298 = this;
  var inode__269299 = this;
  if(hash === this__269298.collision_hash) {
    var idx__269300 = cljs.core.hash_collision_node_find_index.call(null, this__269298.arr, this__269298.cnt, key);
    if(idx__269300 === -1) {
      if(this__269298.arr.length > 2 * this__269298.cnt) {
        var editable__269301 = cljs.core.edit_and_set.call(null, inode__269299, edit, 2 * this__269298.cnt, key, 2 * this__269298.cnt + 1, val);
        added_leaf_QMARK_[0] = true;
        editable__269301.cnt = editable__269301.cnt + 1;
        return editable__269301
      }else {
        var len__269302 = this__269298.arr.length;
        var new_arr__269303 = cljs.core.make_array.call(null, len__269302 + 2);
        cljs.core.array_copy.call(null, this__269298.arr, 0, new_arr__269303, 0, len__269302);
        new_arr__269303[len__269302] = key;
        new_arr__269303[len__269302 + 1] = val;
        added_leaf_QMARK_[0] = true;
        return inode__269299.ensure_editable(edit, this__269298.cnt + 1, new_arr__269303)
      }
    }else {
      if(this__269298.arr[idx__269300 + 1] === val) {
        return inode__269299
      }else {
        return cljs.core.edit_and_set.call(null, inode__269299, edit, idx__269300 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__269298.collision_hash >>> shift & 31), [null, inode__269299, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__269304 = this;
  var inode__269305 = this;
  var idx__269306 = cljs.core.hash_collision_node_find_index.call(null, this__269304.arr, this__269304.cnt, key);
  if(idx__269306 === -1) {
    return inode__269305
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__269304.cnt === 1) {
      return null
    }else {
      var editable__269307 = inode__269305.ensure_editable(edit);
      var earr__269308 = editable__269307.arr;
      earr__269308[idx__269306] = earr__269308[2 * this__269304.cnt - 2];
      earr__269308[idx__269306 + 1] = earr__269308[2 * this__269304.cnt - 1];
      earr__269308[2 * this__269304.cnt - 1] = null;
      earr__269308[2 * this__269304.cnt - 2] = null;
      editable__269307.cnt = editable__269307.cnt - 1;
      return editable__269307
    }
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__269309 = this;
  var inode__269310 = this;
  return cljs.core.inode_kv_reduce.call(null, this__269309.arr, f, init)
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__269313 = cljs.core.hash.call(null, key1);
    if(key1hash__269313 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__269313, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___269314 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__269313, key1, val1, added_leaf_QMARK___269314).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___269314)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__269315 = cljs.core.hash.call(null, key1);
    if(key1hash__269315 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__269315, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___269316 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__269315, key1, val1, added_leaf_QMARK___269316).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___269316)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__269317 = this;
  var h__364__auto____269318 = this__269317.__hash;
  if(h__364__auto____269318 != null) {
    return h__364__auto____269318
  }else {
    var h__364__auto____269319 = cljs.core.hash_coll.call(null, coll);
    this__269317.__hash = h__364__auto____269319;
    return h__364__auto____269319
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__269320 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__269321 = this;
  var this$__269322 = this;
  return cljs.core.pr_str.call(null, this$__269322)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__269323 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__269324 = this;
  if(this__269324.s == null) {
    return cljs.core.PersistentVector.fromArray([this__269324.nodes[this__269324.i], this__269324.nodes[this__269324.i + 1]])
  }else {
    return cljs.core.first.call(null, this__269324.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__269325 = this;
  if(this__269325.s == null) {
    return cljs.core.create_inode_seq.call(null, this__269325.nodes, this__269325.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__269325.nodes, this__269325.i, cljs.core.next.call(null, this__269325.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__269326 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__269327 = this;
  return new cljs.core.NodeSeq(meta, this__269327.nodes, this__269327.i, this__269327.s, this__269327.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__269328 = this;
  return this__269328.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__269329 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__269329.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__269330 = nodes.length;
      var j__269331 = i;
      while(true) {
        if(j__269331 < len__269330) {
          if(null != nodes[j__269331]) {
            return new cljs.core.NodeSeq(null, nodes, j__269331, null, null)
          }else {
            var temp__3971__auto____269332 = nodes[j__269331 + 1];
            if(cljs.core.truth_(temp__3971__auto____269332)) {
              var node__269333 = temp__3971__auto____269332;
              var temp__3971__auto____269334 = node__269333.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____269334)) {
                var node_seq__269335 = temp__3971__auto____269334;
                return new cljs.core.NodeSeq(null, nodes, j__269331 + 2, node_seq__269335, null)
              }else {
                var G__269336 = j__269331 + 2;
                j__269331 = G__269336;
                continue
              }
            }else {
              var G__269337 = j__269331 + 2;
              j__269331 = G__269337;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__269338 = this;
  var h__364__auto____269339 = this__269338.__hash;
  if(h__364__auto____269339 != null) {
    return h__364__auto____269339
  }else {
    var h__364__auto____269340 = cljs.core.hash_coll.call(null, coll);
    this__269338.__hash = h__364__auto____269340;
    return h__364__auto____269340
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__269341 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__269342 = this;
  var this$__269343 = this;
  return cljs.core.pr_str.call(null, this$__269343)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__269344 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__269345 = this;
  return cljs.core.first.call(null, this__269345.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__269346 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__269346.nodes, this__269346.i, cljs.core.next.call(null, this__269346.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__269347 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__269348 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__269348.nodes, this__269348.i, this__269348.s, this__269348.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__269349 = this;
  return this__269349.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__269350 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__269350.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__269351 = nodes.length;
      var j__269352 = i;
      while(true) {
        if(j__269352 < len__269351) {
          var temp__3971__auto____269353 = nodes[j__269352];
          if(cljs.core.truth_(temp__3971__auto____269353)) {
            var nj__269354 = temp__3971__auto____269353;
            var temp__3971__auto____269355 = nj__269354.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____269355)) {
              var ns__269356 = temp__3971__auto____269355;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__269352 + 1, ns__269356, null)
            }else {
              var G__269357 = j__269352 + 1;
              j__269352 = G__269357;
              continue
            }
          }else {
            var G__269358 = j__269352 + 1;
            j__269352 = G__269358;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
void 0;
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__269363 = this;
  return new cljs.core.TransientHashMap({}, this__269363.root, this__269363.cnt, this__269363.has_nil_QMARK_, this__269363.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__269364 = this;
  var h__364__auto____269365 = this__269364.__hash;
  if(h__364__auto____269365 != null) {
    return h__364__auto____269365
  }else {
    var h__364__auto____269366 = cljs.core.hash_imap.call(null, coll);
    this__269364.__hash = h__364__auto____269366;
    return h__364__auto____269366
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__269367 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__269368 = this;
  if(k == null) {
    if(cljs.core.truth_(this__269368.has_nil_QMARK_)) {
      return this__269368.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__269368.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return cljs.core.nth.call(null, this__269368.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__269369 = this;
  if(k == null) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____269370 = this__269369.has_nil_QMARK_;
      if(cljs.core.truth_(and__3822__auto____269370)) {
        return v === this__269369.nil_val
      }else {
        return and__3822__auto____269370
      }
    }())) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__269369.meta, cljs.core.truth_(this__269369.has_nil_QMARK_) ? this__269369.cnt : this__269369.cnt + 1, this__269369.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___269371 = [false];
    var new_root__269372 = (this__269369.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__269369.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___269371);
    if(new_root__269372 === this__269369.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__269369.meta, cljs.core.truth_(added_leaf_QMARK___269371[0]) ? this__269369.cnt + 1 : this__269369.cnt, new_root__269372, this__269369.has_nil_QMARK_, this__269369.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__269373 = this;
  if(k == null) {
    return this__269373.has_nil_QMARK_
  }else {
    if(this__269373.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return cljs.core.not.call(null, this__269373.root.inode_find(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__269394 = null;
  var G__269394__2 = function(tsym269361, k) {
    var this__269374 = this;
    var tsym269361__269375 = this;
    var coll__269376 = tsym269361__269375;
    return cljs.core._lookup.call(null, coll__269376, k)
  };
  var G__269394__3 = function(tsym269362, k, not_found) {
    var this__269377 = this;
    var tsym269362__269378 = this;
    var coll__269379 = tsym269362__269378;
    return cljs.core._lookup.call(null, coll__269379, k, not_found)
  };
  G__269394 = function(tsym269362, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__269394__2.call(this, tsym269362, k);
      case 3:
        return G__269394__3.call(this, tsym269362, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__269394
}();
cljs.core.PersistentHashMap.prototype.apply = function(tsym269359, args269360) {
  return tsym269359.call.apply(tsym269359, [tsym269359].concat(cljs.core.aclone.call(null, args269360)))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__269380 = this;
  var init__269381 = cljs.core.truth_(this__269380.has_nil_QMARK_) ? f.call(null, init, null, this__269380.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__269381)) {
    return cljs.core.deref.call(null, init__269381)
  }else {
    if(null != this__269380.root) {
      return this__269380.root.kv_reduce(f, init__269381)
    }else {
      if("\ufdd0'else") {
        return init__269381
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__269382 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__269383 = this;
  var this$__269384 = this;
  return cljs.core.pr_str.call(null, this$__269384)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__269385 = this;
  if(this__269385.cnt > 0) {
    var s__269386 = null != this__269385.root ? this__269385.root.inode_seq() : null;
    if(cljs.core.truth_(this__269385.has_nil_QMARK_)) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__269385.nil_val]), s__269386)
    }else {
      return s__269386
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__269387 = this;
  return this__269387.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__269388 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__269389 = this;
  return new cljs.core.PersistentHashMap(meta, this__269389.cnt, this__269389.root, this__269389.has_nil_QMARK_, this__269389.nil_val, this__269389.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__269390 = this;
  return this__269390.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__269391 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__269391.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__269392 = this;
  if(k == null) {
    if(cljs.core.truth_(this__269392.has_nil_QMARK_)) {
      return new cljs.core.PersistentHashMap(this__269392.meta, this__269392.cnt - 1, this__269392.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__269392.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__269393 = this__269392.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__269393 === this__269392.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__269392.meta, this__269392.cnt - 1, new_root__269393, this__269392.has_nil_QMARK_, this__269392.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__269395 = ks.length;
  var i__269396 = 0;
  var out__269397 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__269396 < len__269395) {
      var G__269398 = i__269396 + 1;
      var G__269399 = cljs.core.assoc_BANG_.call(null, out__269397, ks[i__269396], vs[i__269396]);
      i__269396 = G__269398;
      out__269397 = G__269399;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__269397)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__269400 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__269401 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__269402 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__269403 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__269404 = this;
  if(k == null) {
    if(cljs.core.truth_(this__269404.has_nil_QMARK_)) {
      return this__269404.nil_val
    }else {
      return null
    }
  }else {
    if(this__269404.root == null) {
      return null
    }else {
      return cljs.core.nth.call(null, this__269404.root.inode_find(0, cljs.core.hash.call(null, k), k), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__269405 = this;
  if(k == null) {
    if(cljs.core.truth_(this__269405.has_nil_QMARK_)) {
      return this__269405.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__269405.root == null) {
      return not_found
    }else {
      return cljs.core.nth.call(null, this__269405.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__269406 = this;
  if(cljs.core.truth_(this__269406.edit)) {
    return this__269406.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__269407 = this;
  var tcoll__269408 = this;
  if(cljs.core.truth_(this__269407.edit)) {
    if(function() {
      var G__269409__269410 = o;
      if(G__269409__269410 != null) {
        if(function() {
          var or__3824__auto____269411 = G__269409__269410.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3824__auto____269411) {
            return or__3824__auto____269411
          }else {
            return G__269409__269410.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__269409__269410.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__269409__269410)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__269409__269410)
      }
    }()) {
      return tcoll__269408.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__269412 = cljs.core.seq.call(null, o);
      var tcoll__269413 = tcoll__269408;
      while(true) {
        var temp__3971__auto____269414 = cljs.core.first.call(null, es__269412);
        if(cljs.core.truth_(temp__3971__auto____269414)) {
          var e__269415 = temp__3971__auto____269414;
          var G__269426 = cljs.core.next.call(null, es__269412);
          var G__269427 = tcoll__269413.assoc_BANG_(cljs.core.key.call(null, e__269415), cljs.core.val.call(null, e__269415));
          es__269412 = G__269426;
          tcoll__269413 = G__269427;
          continue
        }else {
          return tcoll__269413
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__269416 = this;
  var tcoll__269417 = this;
  if(cljs.core.truth_(this__269416.edit)) {
    if(k == null) {
      if(this__269416.nil_val === v) {
      }else {
        this__269416.nil_val = v
      }
      if(cljs.core.truth_(this__269416.has_nil_QMARK_)) {
      }else {
        this__269416.count = this__269416.count + 1;
        this__269416.has_nil_QMARK_ = true
      }
      return tcoll__269417
    }else {
      var added_leaf_QMARK___269418 = [false];
      var node__269419 = (this__269416.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__269416.root).inode_assoc_BANG_(this__269416.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___269418);
      if(node__269419 === this__269416.root) {
      }else {
        this__269416.root = node__269419
      }
      if(cljs.core.truth_(added_leaf_QMARK___269418[0])) {
        this__269416.count = this__269416.count + 1
      }else {
      }
      return tcoll__269417
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__269420 = this;
  var tcoll__269421 = this;
  if(cljs.core.truth_(this__269420.edit)) {
    if(k == null) {
      if(cljs.core.truth_(this__269420.has_nil_QMARK_)) {
        this__269420.has_nil_QMARK_ = false;
        this__269420.nil_val = null;
        this__269420.count = this__269420.count - 1;
        return tcoll__269421
      }else {
        return tcoll__269421
      }
    }else {
      if(this__269420.root == null) {
        return tcoll__269421
      }else {
        var removed_leaf_QMARK___269422 = [false];
        var node__269423 = this__269420.root.inode_without_BANG_(this__269420.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___269422);
        if(node__269423 === this__269420.root) {
        }else {
          this__269420.root = node__269423
        }
        if(cljs.core.truth_(removed_leaf_QMARK___269422[0])) {
          this__269420.count = this__269420.count - 1
        }else {
        }
        return tcoll__269421
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__269424 = this;
  var tcoll__269425 = this;
  if(cljs.core.truth_(this__269424.edit)) {
    this__269424.edit = null;
    return new cljs.core.PersistentHashMap(null, this__269424.count, this__269424.root, this__269424.has_nil_QMARK_, this__269424.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__269428 = node;
  var stack__269429 = stack;
  while(true) {
    if(t__269428 != null) {
      var G__269430 = cljs.core.truth_(ascending_QMARK_) ? t__269428.left : t__269428.right;
      var G__269431 = cljs.core.conj.call(null, stack__269429, t__269428);
      t__269428 = G__269430;
      stack__269429 = G__269431;
      continue
    }else {
      return stack__269429
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925322
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__269432 = this;
  var h__364__auto____269433 = this__269432.__hash;
  if(h__364__auto____269433 != null) {
    return h__364__auto____269433
  }else {
    var h__364__auto____269434 = cljs.core.hash_coll.call(null, coll);
    this__269432.__hash = h__364__auto____269434;
    return h__364__auto____269434
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__269435 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__269436 = this;
  var this$__269437 = this;
  return cljs.core.pr_str.call(null, this$__269437)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__269438 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__269439 = this;
  if(this__269439.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__269439.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__269440 = this;
  return cljs.core.peek.call(null, this__269440.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__269441 = this;
  var t__269442 = cljs.core.peek.call(null, this__269441.stack);
  var next_stack__269443 = cljs.core.tree_map_seq_push.call(null, cljs.core.truth_(this__269441.ascending_QMARK_) ? t__269442.right : t__269442.left, cljs.core.pop.call(null, this__269441.stack), this__269441.ascending_QMARK_);
  if(next_stack__269443 != null) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__269443, this__269441.ascending_QMARK_, this__269441.cnt - 1, null)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__269444 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__269445 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__269445.stack, this__269445.ascending_QMARK_, this__269445.cnt, this__269445.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__269446 = this;
  return this__269446.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
void 0;
void 0;
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____269447 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____269447) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____269447
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____269448 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____269448) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____269448
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__269449 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__269449)) {
    return cljs.core.deref.call(null, init__269449)
  }else {
    var init__269450 = node.left != null ? tree_map_kv_reduce.call(null, node.left, f, init__269449) : init__269449;
    if(cljs.core.reduced_QMARK_.call(null, init__269450)) {
      return cljs.core.deref.call(null, init__269450)
    }else {
      var init__269451 = node.right != null ? tree_map_kv_reduce.call(null, node.right, f, init__269450) : init__269450;
      if(cljs.core.reduced_QMARK_.call(null, init__269451)) {
        return cljs.core.deref.call(null, init__269451)
      }else {
        return init__269451
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$ = true;
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__269456 = this;
  var h__364__auto____269457 = this__269456.__hash;
  if(h__364__auto____269457 != null) {
    return h__364__auto____269457
  }else {
    var h__364__auto____269458 = cljs.core.hash_coll.call(null, coll);
    this__269456.__hash = h__364__auto____269458;
    return h__364__auto____269458
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$ = true;
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__269459 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__269460 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__269461 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__269461.key, this__269461.val]), k, v)
};
cljs.core.BlackNode.prototype.cljs$core$IFn$ = true;
cljs.core.BlackNode.prototype.call = function() {
  var G__269508 = null;
  var G__269508__2 = function(tsym269454, k) {
    var this__269462 = this;
    var tsym269454__269463 = this;
    var node__269464 = tsym269454__269463;
    return cljs.core._lookup.call(null, node__269464, k)
  };
  var G__269508__3 = function(tsym269455, k, not_found) {
    var this__269465 = this;
    var tsym269455__269466 = this;
    var node__269467 = tsym269455__269466;
    return cljs.core._lookup.call(null, node__269467, k, not_found)
  };
  G__269508 = function(tsym269455, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__269508__2.call(this, tsym269455, k);
      case 3:
        return G__269508__3.call(this, tsym269455, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__269508
}();
cljs.core.BlackNode.prototype.apply = function(tsym269452, args269453) {
  return tsym269452.call.apply(tsym269452, [tsym269452].concat(cljs.core.aclone.call(null, args269453)))
};
cljs.core.BlackNode.prototype.cljs$core$ISequential$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__269468 = this;
  return cljs.core.PersistentVector.fromArray([this__269468.key, this__269468.val, o])
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__269469 = this;
  return this__269469.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__269470 = this;
  return this__269470.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__269471 = this;
  var node__269472 = this;
  return ins.balance_right(node__269472)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__269473 = this;
  var node__269474 = this;
  return new cljs.core.RedNode(this__269473.key, this__269473.val, this__269473.left, this__269473.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__269475 = this;
  var node__269476 = this;
  return cljs.core.balance_right_del.call(null, this__269475.key, this__269475.val, this__269475.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__269477 = this;
  var node__269478 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__269479 = this;
  var node__269480 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__269480, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__269481 = this;
  var node__269482 = this;
  return cljs.core.balance_left_del.call(null, this__269481.key, this__269481.val, del, this__269481.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__269483 = this;
  var node__269484 = this;
  return ins.balance_left(node__269484)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__269485 = this;
  var node__269486 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__269486, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__269509 = null;
  var G__269509__0 = function() {
    var this__269489 = this;
    var this$__269490 = this;
    return cljs.core.pr_str.call(null, this$__269490)
  };
  G__269509 = function() {
    switch(arguments.length) {
      case 0:
        return G__269509__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__269509
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__269491 = this;
  var node__269492 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__269492, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__269493 = this;
  var node__269494 = this;
  return node__269494
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$ = true;
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__269495 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__269496 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__269497 = this;
  return cljs.core.list.call(null, this__269497.key, this__269497.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__269499 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$ = true;
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__269500 = this;
  return this__269500.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__269501 = this;
  return cljs.core.PersistentVector.fromArray([this__269501.key])
};
cljs.core.BlackNode.prototype.cljs$core$IVector$ = true;
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__269502 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__269502.key, this__269502.val]), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__269503 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__269504 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__269504.key, this__269504.val]), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__269505 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__269506 = this;
  if(n === 0) {
    return this__269506.key
  }else {
    if(n === 1) {
      return this__269506.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__269507 = this;
  if(n === 0) {
    return this__269507.key
  }else {
    if(n === 1) {
      return this__269507.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__269498 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$ = true;
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__269514 = this;
  var h__364__auto____269515 = this__269514.__hash;
  if(h__364__auto____269515 != null) {
    return h__364__auto____269515
  }else {
    var h__364__auto____269516 = cljs.core.hash_coll.call(null, coll);
    this__269514.__hash = h__364__auto____269516;
    return h__364__auto____269516
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$ = true;
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__269517 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__269518 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__269519 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__269519.key, this__269519.val]), k, v)
};
cljs.core.RedNode.prototype.cljs$core$IFn$ = true;
cljs.core.RedNode.prototype.call = function() {
  var G__269566 = null;
  var G__269566__2 = function(tsym269512, k) {
    var this__269520 = this;
    var tsym269512__269521 = this;
    var node__269522 = tsym269512__269521;
    return cljs.core._lookup.call(null, node__269522, k)
  };
  var G__269566__3 = function(tsym269513, k, not_found) {
    var this__269523 = this;
    var tsym269513__269524 = this;
    var node__269525 = tsym269513__269524;
    return cljs.core._lookup.call(null, node__269525, k, not_found)
  };
  G__269566 = function(tsym269513, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__269566__2.call(this, tsym269513, k);
      case 3:
        return G__269566__3.call(this, tsym269513, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__269566
}();
cljs.core.RedNode.prototype.apply = function(tsym269510, args269511) {
  return tsym269510.call.apply(tsym269510, [tsym269510].concat(cljs.core.aclone.call(null, args269511)))
};
cljs.core.RedNode.prototype.cljs$core$ISequential$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__269526 = this;
  return cljs.core.PersistentVector.fromArray([this__269526.key, this__269526.val, o])
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__269527 = this;
  return this__269527.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__269528 = this;
  return this__269528.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__269529 = this;
  var node__269530 = this;
  return new cljs.core.RedNode(this__269529.key, this__269529.val, this__269529.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__269531 = this;
  var node__269532 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__269533 = this;
  var node__269534 = this;
  return new cljs.core.RedNode(this__269533.key, this__269533.val, this__269533.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__269535 = this;
  var node__269536 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__269537 = this;
  var node__269538 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__269538, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__269539 = this;
  var node__269540 = this;
  return new cljs.core.RedNode(this__269539.key, this__269539.val, del, this__269539.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__269541 = this;
  var node__269542 = this;
  return new cljs.core.RedNode(this__269541.key, this__269541.val, ins, this__269541.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__269543 = this;
  var node__269544 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__269543.left)) {
    return new cljs.core.RedNode(this__269543.key, this__269543.val, this__269543.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__269543.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__269543.right)) {
      return new cljs.core.RedNode(this__269543.right.key, this__269543.right.val, new cljs.core.BlackNode(this__269543.key, this__269543.val, this__269543.left, this__269543.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__269543.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__269544, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__269567 = null;
  var G__269567__0 = function() {
    var this__269547 = this;
    var this$__269548 = this;
    return cljs.core.pr_str.call(null, this$__269548)
  };
  G__269567 = function() {
    switch(arguments.length) {
      case 0:
        return G__269567__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__269567
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__269549 = this;
  var node__269550 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__269549.right)) {
    return new cljs.core.RedNode(this__269549.key, this__269549.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__269549.left, null), this__269549.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__269549.left)) {
      return new cljs.core.RedNode(this__269549.left.key, this__269549.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__269549.left.left, null), new cljs.core.BlackNode(this__269549.key, this__269549.val, this__269549.left.right, this__269549.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__269550, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__269551 = this;
  var node__269552 = this;
  return new cljs.core.BlackNode(this__269551.key, this__269551.val, this__269551.left, this__269551.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$ = true;
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__269553 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__269554 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__269555 = this;
  return cljs.core.list.call(null, this__269555.key, this__269555.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$ = true;
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__269557 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$ = true;
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__269558 = this;
  return this__269558.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__269559 = this;
  return cljs.core.PersistentVector.fromArray([this__269559.key])
};
cljs.core.RedNode.prototype.cljs$core$IVector$ = true;
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__269560 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__269560.key, this__269560.val]), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__269561 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__269562 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__269562.key, this__269562.val]), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__269563 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__269564 = this;
  if(n === 0) {
    return this__269564.key
  }else {
    if(n === 1) {
      return this__269564.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__269565 = this;
  if(n === 0) {
    return this__269565.key
  }else {
    if(n === 1) {
      return this__269565.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__269556 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__269568 = comp.call(null, k, tree.key);
    if(c__269568 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__269568 < 0) {
        var ins__269569 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(ins__269569 != null) {
          return tree.add_left(ins__269569)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__269570 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(ins__269570 != null) {
            return tree.add_right(ins__269570)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__269571 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__269571)) {
            return new cljs.core.RedNode(app__269571.key, app__269571.val, new cljs.core.RedNode(left.key, left.val, left.left, app__269571.left), new cljs.core.RedNode(right.key, right.val, app__269571.right, right.right), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__269571, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__269572 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__269572)) {
              return new cljs.core.RedNode(app__269572.key, app__269572.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__269572.left, null), new cljs.core.BlackNode(right.key, right.val, app__269572.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__269572, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(tree != null) {
    var c__269573 = comp.call(null, k, tree.key);
    if(c__269573 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__269573 < 0) {
        var del__269574 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____269575 = del__269574 != null;
          if(or__3824__auto____269575) {
            return or__3824__auto____269575
          }else {
            return found[0] != null
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__269574, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__269574, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__269576 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____269577 = del__269576 != null;
            if(or__3824__auto____269577) {
              return or__3824__auto____269577
            }else {
              return found[0] != null
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__269576)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__269576, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__269578 = tree.key;
  var c__269579 = comp.call(null, k, tk__269578);
  if(c__269579 === 0) {
    return tree.replace(tk__269578, v, tree.left, tree.right)
  }else {
    if(c__269579 < 0) {
      return tree.replace(tk__269578, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__269578, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 209388431
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__269584 = this;
  var h__364__auto____269585 = this__269584.__hash;
  if(h__364__auto____269585 != null) {
    return h__364__auto____269585
  }else {
    var h__364__auto____269586 = cljs.core.hash_imap.call(null, coll);
    this__269584.__hash = h__364__auto____269586;
    return h__364__auto____269586
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__269587 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__269588 = this;
  var n__269589 = coll.entry_at(k);
  if(n__269589 != null) {
    return n__269589.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__269590 = this;
  var found__269591 = [null];
  var t__269592 = cljs.core.tree_map_add.call(null, this__269590.comp, this__269590.tree, k, v, found__269591);
  if(t__269592 == null) {
    var found_node__269593 = cljs.core.nth.call(null, found__269591, 0);
    if(cljs.core._EQ_.call(null, v, found_node__269593.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__269590.comp, cljs.core.tree_map_replace.call(null, this__269590.comp, this__269590.tree, k, v), this__269590.cnt, this__269590.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__269590.comp, t__269592.blacken(), this__269590.cnt + 1, this__269590.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__269594 = this;
  return coll.entry_at(k) != null
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__269626 = null;
  var G__269626__2 = function(tsym269582, k) {
    var this__269595 = this;
    var tsym269582__269596 = this;
    var coll__269597 = tsym269582__269596;
    return cljs.core._lookup.call(null, coll__269597, k)
  };
  var G__269626__3 = function(tsym269583, k, not_found) {
    var this__269598 = this;
    var tsym269583__269599 = this;
    var coll__269600 = tsym269583__269599;
    return cljs.core._lookup.call(null, coll__269600, k, not_found)
  };
  G__269626 = function(tsym269583, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__269626__2.call(this, tsym269583, k);
      case 3:
        return G__269626__3.call(this, tsym269583, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__269626
}();
cljs.core.PersistentTreeMap.prototype.apply = function(tsym269580, args269581) {
  return tsym269580.call.apply(tsym269580, [tsym269580].concat(cljs.core.aclone.call(null, args269581)))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__269601 = this;
  if(this__269601.tree != null) {
    return cljs.core.tree_map_kv_reduce.call(null, this__269601.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__269602 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__269603 = this;
  if(this__269603.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__269603.tree, false, this__269603.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__269604 = this;
  var this$__269605 = this;
  return cljs.core.pr_str.call(null, this$__269605)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__269606 = this;
  var coll__269607 = this;
  var t__269608 = this__269606.tree;
  while(true) {
    if(t__269608 != null) {
      var c__269609 = this__269606.comp.call(null, k, t__269608.key);
      if(c__269609 === 0) {
        return t__269608
      }else {
        if(c__269609 < 0) {
          var G__269627 = t__269608.left;
          t__269608 = G__269627;
          continue
        }else {
          if("\ufdd0'else") {
            var G__269628 = t__269608.right;
            t__269608 = G__269628;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__269610 = this;
  if(this__269610.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__269610.tree, ascending_QMARK_, this__269610.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__269611 = this;
  if(this__269611.cnt > 0) {
    var stack__269612 = null;
    var t__269613 = this__269611.tree;
    while(true) {
      if(t__269613 != null) {
        var c__269614 = this__269611.comp.call(null, k, t__269613.key);
        if(c__269614 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__269612, t__269613), ascending_QMARK_, -1)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__269614 < 0) {
              var G__269629 = cljs.core.conj.call(null, stack__269612, t__269613);
              var G__269630 = t__269613.left;
              stack__269612 = G__269629;
              t__269613 = G__269630;
              continue
            }else {
              var G__269631 = stack__269612;
              var G__269632 = t__269613.right;
              stack__269612 = G__269631;
              t__269613 = G__269632;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__269614 > 0) {
                var G__269633 = cljs.core.conj.call(null, stack__269612, t__269613);
                var G__269634 = t__269613.right;
                stack__269612 = G__269633;
                t__269613 = G__269634;
                continue
              }else {
                var G__269635 = stack__269612;
                var G__269636 = t__269613.left;
                stack__269612 = G__269635;
                t__269613 = G__269636;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__269612 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__269612, ascending_QMARK_, -1)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__269615 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__269616 = this;
  return this__269616.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__269617 = this;
  if(this__269617.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__269617.tree, true, this__269617.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__269618 = this;
  return this__269618.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__269619 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__269620 = this;
  return new cljs.core.PersistentTreeMap(this__269620.comp, this__269620.tree, this__269620.cnt, meta, this__269620.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__269624 = this;
  return this__269624.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__269625 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__269625.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__269621 = this;
  var found__269622 = [null];
  var t__269623 = cljs.core.tree_map_remove.call(null, this__269621.comp, this__269621.tree, k, found__269622);
  if(t__269623 == null) {
    if(cljs.core.nth.call(null, found__269622, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__269621.comp, null, 0, this__269621.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__269621.comp, t__269623.blacken(), this__269621.cnt - 1, this__269621.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__269637 = cljs.core.seq.call(null, keyvals);
    var out__269638 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(cljs.core.truth_(in$__269637)) {
        var G__269639 = cljs.core.nnext.call(null, in$__269637);
        var G__269640 = cljs.core.assoc_BANG_.call(null, out__269638, cljs.core.first.call(null, in$__269637), cljs.core.second.call(null, in$__269637));
        in$__269637 = G__269639;
        out__269638 = G__269640;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__269638)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__269641) {
    var keyvals = cljs.core.seq(arglist__269641);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__269642) {
    var keyvals = cljs.core.seq(arglist__269642);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$__269643 = cljs.core.seq.call(null, keyvals);
    var out__269644 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__269643)) {
        var G__269645 = cljs.core.nnext.call(null, in$__269643);
        var G__269646 = cljs.core.assoc.call(null, out__269644, cljs.core.first.call(null, in$__269643), cljs.core.second.call(null, in$__269643));
        in$__269643 = G__269645;
        out__269644 = G__269646;
        continue
      }else {
        return out__269644
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__269647) {
    var keyvals = cljs.core.seq(arglist__269647);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$__269648 = cljs.core.seq.call(null, keyvals);
    var out__269649 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(cljs.core.truth_(in$__269648)) {
        var G__269650 = cljs.core.nnext.call(null, in$__269648);
        var G__269651 = cljs.core.assoc.call(null, out__269649, cljs.core.first.call(null, in$__269648), cljs.core.second.call(null, in$__269648));
        in$__269648 = G__269650;
        out__269649 = G__269651;
        continue
      }else {
        return out__269649
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__269652) {
    var comparator = cljs.core.first(arglist__269652);
    var keyvals = cljs.core.rest(arglist__269652);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__269653_SHARP_, p2__269654_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____269655 = p1__269653_SHARP_;
          if(cljs.core.truth_(or__3824__auto____269655)) {
            return or__3824__auto____269655
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__269654_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__269656) {
    var maps = cljs.core.seq(arglist__269656);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__269659 = function(m, e) {
        var k__269657 = cljs.core.first.call(null, e);
        var v__269658 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__269657)) {
          return cljs.core.assoc.call(null, m, k__269657, f.call(null, cljs.core.get.call(null, m, k__269657), v__269658))
        }else {
          return cljs.core.assoc.call(null, m, k__269657, v__269658)
        }
      };
      var merge2__269661 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__269659, function() {
          var or__3824__auto____269660 = m1;
          if(cljs.core.truth_(or__3824__auto____269660)) {
            return or__3824__auto____269660
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__269661, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__269662) {
    var f = cljs.core.first(arglist__269662);
    var maps = cljs.core.rest(arglist__269662);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__269663 = cljs.core.ObjMap.fromObject([], {});
  var keys__269664 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__269664)) {
      var key__269665 = cljs.core.first.call(null, keys__269664);
      var entry__269666 = cljs.core.get.call(null, map, key__269665, "\ufdd0'user/not-found");
      var G__269667 = cljs.core.not_EQ_.call(null, entry__269666, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__269663, key__269665, entry__269666) : ret__269663;
      var G__269668 = cljs.core.next.call(null, keys__269664);
      ret__269663 = G__269667;
      keys__269664 = G__269668;
      continue
    }else {
      return ret__269663
    }
    break
  }
};
void 0;
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155022479
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__269674 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__269674.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__269675 = this;
  var h__364__auto____269676 = this__269675.__hash;
  if(h__364__auto____269676 != null) {
    return h__364__auto____269676
  }else {
    var h__364__auto____269677 = cljs.core.hash_iset.call(null, coll);
    this__269675.__hash = h__364__auto____269677;
    return h__364__auto____269677
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__269678 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__269679 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__269679.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__269698 = null;
  var G__269698__2 = function(tsym269672, k) {
    var this__269680 = this;
    var tsym269672__269681 = this;
    var coll__269682 = tsym269672__269681;
    return cljs.core._lookup.call(null, coll__269682, k)
  };
  var G__269698__3 = function(tsym269673, k, not_found) {
    var this__269683 = this;
    var tsym269673__269684 = this;
    var coll__269685 = tsym269673__269684;
    return cljs.core._lookup.call(null, coll__269685, k, not_found)
  };
  G__269698 = function(tsym269673, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__269698__2.call(this, tsym269673, k);
      case 3:
        return G__269698__3.call(this, tsym269673, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__269698
}();
cljs.core.PersistentHashSet.prototype.apply = function(tsym269670, args269671) {
  return tsym269670.call.apply(tsym269670, [tsym269670].concat(cljs.core.aclone.call(null, args269671)))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__269686 = this;
  return new cljs.core.PersistentHashSet(this__269686.meta, cljs.core.assoc.call(null, this__269686.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__269687 = this;
  var this$__269688 = this;
  return cljs.core.pr_str.call(null, this$__269688)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__269689 = this;
  return cljs.core.keys.call(null, this__269689.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__269690 = this;
  return new cljs.core.PersistentHashSet(this__269690.meta, cljs.core.dissoc.call(null, this__269690.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__269691 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__269692 = this;
  var and__3822__auto____269693 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____269693) {
    var and__3822__auto____269694 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____269694) {
      return cljs.core.every_QMARK_.call(null, function(p1__269669_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__269669_SHARP_)
      }, other)
    }else {
      return and__3822__auto____269694
    }
  }else {
    return and__3822__auto____269693
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__269695 = this;
  return new cljs.core.PersistentHashSet(meta, this__269695.hash_map, this__269695.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__269696 = this;
  return this__269696.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__269697 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__269697.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 131;
  this.cljs$lang$protocol_mask$partition1$ = 17
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashSet")
};
cljs.core.TransientHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.TransientHashSet.prototype.call = function() {
  var G__269716 = null;
  var G__269716__2 = function(tsym269702, k) {
    var this__269704 = this;
    var tsym269702__269705 = this;
    var tcoll__269706 = tsym269702__269705;
    if(cljs.core._lookup.call(null, this__269704.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__269716__3 = function(tsym269703, k, not_found) {
    var this__269707 = this;
    var tsym269703__269708 = this;
    var tcoll__269709 = tsym269703__269708;
    if(cljs.core._lookup.call(null, this__269707.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__269716 = function(tsym269703, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__269716__2.call(this, tsym269703, k);
      case 3:
        return G__269716__3.call(this, tsym269703, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__269716
}();
cljs.core.TransientHashSet.prototype.apply = function(tsym269700, args269701) {
  return tsym269700.call.apply(tsym269700, [tsym269700].concat(cljs.core.aclone.call(null, args269701)))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__269710 = this;
  return cljs.core._lookup.call(null, tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__269711 = this;
  if(cljs.core._lookup.call(null, this__269711.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__269712 = this;
  return cljs.core.count.call(null, this__269712.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__269713 = this;
  this__269713.transient_map = cljs.core.dissoc_BANG_.call(null, this__269713.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__269714 = this;
  this__269714.transient_map = cljs.core.assoc_BANG_.call(null, this__269714.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__269715 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__269715.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 208865423
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__269721 = this;
  var h__364__auto____269722 = this__269721.__hash;
  if(h__364__auto____269722 != null) {
    return h__364__auto____269722
  }else {
    var h__364__auto____269723 = cljs.core.hash_iset.call(null, coll);
    this__269721.__hash = h__364__auto____269723;
    return h__364__auto____269723
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__269724 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__269725 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__269725.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__269749 = null;
  var G__269749__2 = function(tsym269719, k) {
    var this__269726 = this;
    var tsym269719__269727 = this;
    var coll__269728 = tsym269719__269727;
    return cljs.core._lookup.call(null, coll__269728, k)
  };
  var G__269749__3 = function(tsym269720, k, not_found) {
    var this__269729 = this;
    var tsym269720__269730 = this;
    var coll__269731 = tsym269720__269730;
    return cljs.core._lookup.call(null, coll__269731, k, not_found)
  };
  G__269749 = function(tsym269720, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__269749__2.call(this, tsym269720, k);
      case 3:
        return G__269749__3.call(this, tsym269720, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__269749
}();
cljs.core.PersistentTreeSet.prototype.apply = function(tsym269717, args269718) {
  return tsym269717.call.apply(tsym269717, [tsym269717].concat(cljs.core.aclone.call(null, args269718)))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__269732 = this;
  return new cljs.core.PersistentTreeSet(this__269732.meta, cljs.core.assoc.call(null, this__269732.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__269733 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__269733.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__269734 = this;
  var this$__269735 = this;
  return cljs.core.pr_str.call(null, this$__269735)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__269736 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__269736.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__269737 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__269737.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__269738 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__269739 = this;
  return cljs.core._comparator.call(null, this__269739.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__269740 = this;
  return cljs.core.keys.call(null, this__269740.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__269741 = this;
  return new cljs.core.PersistentTreeSet(this__269741.meta, cljs.core.dissoc.call(null, this__269741.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__269742 = this;
  return cljs.core.count.call(null, this__269742.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__269743 = this;
  var and__3822__auto____269744 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____269744) {
    var and__3822__auto____269745 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____269745) {
      return cljs.core.every_QMARK_.call(null, function(p1__269699_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__269699_SHARP_)
      }, other)
    }else {
      return and__3822__auto____269745
    }
  }else {
    return and__3822__auto____269744
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__269746 = this;
  return new cljs.core.PersistentTreeSet(meta, this__269746.tree_map, this__269746.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__269747 = this;
  return this__269747.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__269748 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__269748.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.set = function set(coll) {
  var in$__269750 = cljs.core.seq.call(null, coll);
  var out__269751 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, in$__269750))) {
      var G__269752 = cljs.core.next.call(null, in$__269750);
      var G__269753 = cljs.core.conj_BANG_.call(null, out__269751, cljs.core.first.call(null, in$__269750));
      in$__269750 = G__269752;
      out__269751 = G__269753;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__269751)
    }
    break
  }
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__269754) {
    var keys = cljs.core.seq(arglist__269754);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__269756) {
    var comparator = cljs.core.first(arglist__269756);
    var keys = cljs.core.rest(arglist__269756);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__269757 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____269758 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____269758)) {
        var e__269759 = temp__3971__auto____269758;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__269759))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__269757, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__269755_SHARP_) {
      var temp__3971__auto____269760 = cljs.core.find.call(null, smap, p1__269755_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____269760)) {
        var e__269761 = temp__3971__auto____269760;
        return cljs.core.second.call(null, e__269761)
      }else {
        return p1__269755_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__269769 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__269762, seen) {
        while(true) {
          var vec__269763__269764 = p__269762;
          var f__269765 = cljs.core.nth.call(null, vec__269763__269764, 0, null);
          var xs__269766 = vec__269763__269764;
          var temp__3974__auto____269767 = cljs.core.seq.call(null, xs__269766);
          if(cljs.core.truth_(temp__3974__auto____269767)) {
            var s__269768 = temp__3974__auto____269767;
            if(cljs.core.contains_QMARK_.call(null, seen, f__269765)) {
              var G__269770 = cljs.core.rest.call(null, s__269768);
              var G__269771 = seen;
              p__269762 = G__269770;
              seen = G__269771;
              continue
            }else {
              return cljs.core.cons.call(null, f__269765, step.call(null, cljs.core.rest.call(null, s__269768), cljs.core.conj.call(null, seen, f__269765)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__269769.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__269772 = cljs.core.PersistentVector.fromArray([]);
  var s__269773 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__269773))) {
      var G__269774 = cljs.core.conj.call(null, ret__269772, cljs.core.first.call(null, s__269773));
      var G__269775 = cljs.core.next.call(null, s__269773);
      ret__269772 = G__269774;
      s__269773 = G__269775;
      continue
    }else {
      return cljs.core.seq.call(null, ret__269772)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____269776 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____269776) {
        return or__3824__auto____269776
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__269777 = x.lastIndexOf("/");
      if(i__269777 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__269777 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____269778 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____269778) {
      return or__3824__auto____269778
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__269779 = x.lastIndexOf("/");
    if(i__269779 > -1) {
      return cljs.core.subs.call(null, x, 2, i__269779)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__269782 = cljs.core.ObjMap.fromObject([], {});
  var ks__269783 = cljs.core.seq.call(null, keys);
  var vs__269784 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____269785 = ks__269783;
      if(cljs.core.truth_(and__3822__auto____269785)) {
        return vs__269784
      }else {
        return and__3822__auto____269785
      }
    }())) {
      var G__269786 = cljs.core.assoc.call(null, map__269782, cljs.core.first.call(null, ks__269783), cljs.core.first.call(null, vs__269784));
      var G__269787 = cljs.core.next.call(null, ks__269783);
      var G__269788 = cljs.core.next.call(null, vs__269784);
      map__269782 = G__269786;
      ks__269783 = G__269787;
      vs__269784 = G__269788;
      continue
    }else {
      return map__269782
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__269791__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__269780_SHARP_, p2__269781_SHARP_) {
        return max_key.call(null, k, p1__269780_SHARP_, p2__269781_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__269791 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__269791__delegate.call(this, k, x, y, more)
    };
    G__269791.cljs$lang$maxFixedArity = 3;
    G__269791.cljs$lang$applyTo = function(arglist__269792) {
      var k = cljs.core.first(arglist__269792);
      var x = cljs.core.first(cljs.core.next(arglist__269792));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__269792)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__269792)));
      return G__269791__delegate(k, x, y, more)
    };
    G__269791.cljs$lang$arity$variadic = G__269791__delegate;
    return G__269791
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__269793__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__269789_SHARP_, p2__269790_SHARP_) {
        return min_key.call(null, k, p1__269789_SHARP_, p2__269790_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__269793 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__269793__delegate.call(this, k, x, y, more)
    };
    G__269793.cljs$lang$maxFixedArity = 3;
    G__269793.cljs$lang$applyTo = function(arglist__269794) {
      var k = cljs.core.first(arglist__269794);
      var x = cljs.core.first(cljs.core.next(arglist__269794));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__269794)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__269794)));
      return G__269793__delegate(k, x, y, more)
    };
    G__269793.cljs$lang$arity$variadic = G__269793__delegate;
    return G__269793
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____269795 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____269795)) {
        var s__269796 = temp__3974__auto____269795;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__269796), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__269796)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____269797 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____269797)) {
      var s__269798 = temp__3974__auto____269797;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__269798)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__269798), take_while.call(null, pred, cljs.core.rest.call(null, s__269798)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__269799 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__269799.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__269800 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____269801 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____269801)) {
        var vec__269802__269803 = temp__3974__auto____269801;
        var e__269804 = cljs.core.nth.call(null, vec__269802__269803, 0, null);
        var s__269805 = vec__269802__269803;
        if(cljs.core.truth_(include__269800.call(null, e__269804))) {
          return s__269805
        }else {
          return cljs.core.next.call(null, s__269805)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__269800, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____269806 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____269806)) {
      var vec__269807__269808 = temp__3974__auto____269806;
      var e__269809 = cljs.core.nth.call(null, vec__269807__269808, 0, null);
      var s__269810 = vec__269807__269808;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__269809)) ? s__269810 : cljs.core.next.call(null, s__269810))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__269811 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____269812 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____269812)) {
        var vec__269813__269814 = temp__3974__auto____269812;
        var e__269815 = cljs.core.nth.call(null, vec__269813__269814, 0, null);
        var s__269816 = vec__269813__269814;
        if(cljs.core.truth_(include__269811.call(null, e__269815))) {
          return s__269816
        }else {
          return cljs.core.next.call(null, s__269816)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__269811, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____269817 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____269817)) {
      var vec__269818__269819 = temp__3974__auto____269817;
      var e__269820 = cljs.core.nth.call(null, vec__269818__269819, 0, null);
      var s__269821 = vec__269818__269819;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__269820)) ? s__269821 : cljs.core.next.call(null, s__269821))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16187486
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__269822 = this;
  var h__364__auto____269823 = this__269822.__hash;
  if(h__364__auto____269823 != null) {
    return h__364__auto____269823
  }else {
    var h__364__auto____269824 = cljs.core.hash_coll.call(null, rng);
    this__269822.__hash = h__364__auto____269824;
    return h__364__auto____269824
  }
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__269825 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__269826 = this;
  var this$__269827 = this;
  return cljs.core.pr_str.call(null, this$__269827)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__269828 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__269829 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__269830 = this;
  var comp__269831 = this__269830.step > 0 ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__269831.call(null, this__269830.start, this__269830.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__269832 = this;
  if(cljs.core.not.call(null, cljs.core._seq.call(null, rng))) {
    return 0
  }else {
    return Math["ceil"]((this__269832.end - this__269832.start) / this__269832.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__269833 = this;
  return this__269833.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__269834 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__269834.meta, this__269834.start + this__269834.step, this__269834.end, this__269834.step, null)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__269835 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__269836 = this;
  return new cljs.core.Range(meta, this__269836.start, this__269836.end, this__269836.step, this__269836.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__269837 = this;
  return this__269837.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__269838 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__269838.start + n * this__269838.step
  }else {
    if(function() {
      var and__3822__auto____269839 = this__269838.start > this__269838.end;
      if(and__3822__auto____269839) {
        return this__269838.step === 0
      }else {
        return and__3822__auto____269839
      }
    }()) {
      return this__269838.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__269840 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__269840.start + n * this__269840.step
  }else {
    if(function() {
      var and__3822__auto____269841 = this__269840.start > this__269840.end;
      if(and__3822__auto____269841) {
        return this__269840.step === 0
      }else {
        return and__3822__auto____269841
      }
    }()) {
      return this__269840.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__269842 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__269842.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____269843 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____269843)) {
      var s__269844 = temp__3974__auto____269843;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__269844), take_nth.call(null, n, cljs.core.drop.call(null, n, s__269844)))
    }else {
      return null
    }
  })
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)])
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____269846 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____269846)) {
      var s__269847 = temp__3974__auto____269846;
      var fst__269848 = cljs.core.first.call(null, s__269847);
      var fv__269849 = f.call(null, fst__269848);
      var run__269850 = cljs.core.cons.call(null, fst__269848, cljs.core.take_while.call(null, function(p1__269845_SHARP_) {
        return cljs.core._EQ_.call(null, fv__269849, f.call(null, p1__269845_SHARP_))
      }, cljs.core.next.call(null, s__269847)));
      return cljs.core.cons.call(null, run__269850, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__269850), s__269847))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {})), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____269861 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____269861)) {
        var s__269862 = temp__3971__auto____269861;
        return reductions.call(null, f, cljs.core.first.call(null, s__269862), cljs.core.rest.call(null, s__269862))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____269863 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____269863)) {
        var s__269864 = temp__3974__auto____269863;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__269864)), cljs.core.rest.call(null, s__269864))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__269866 = null;
      var G__269866__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__269866__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__269866__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__269866__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__269866__4 = function() {
        var G__269867__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__269867 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__269867__delegate.call(this, x, y, z, args)
        };
        G__269867.cljs$lang$maxFixedArity = 3;
        G__269867.cljs$lang$applyTo = function(arglist__269868) {
          var x = cljs.core.first(arglist__269868);
          var y = cljs.core.first(cljs.core.next(arglist__269868));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__269868)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__269868)));
          return G__269867__delegate(x, y, z, args)
        };
        G__269867.cljs$lang$arity$variadic = G__269867__delegate;
        return G__269867
      }();
      G__269866 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__269866__0.call(this);
          case 1:
            return G__269866__1.call(this, x);
          case 2:
            return G__269866__2.call(this, x, y);
          case 3:
            return G__269866__3.call(this, x, y, z);
          default:
            return G__269866__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__269866.cljs$lang$maxFixedArity = 3;
      G__269866.cljs$lang$applyTo = G__269866__4.cljs$lang$applyTo;
      return G__269866
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__269869 = null;
      var G__269869__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__269869__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__269869__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__269869__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__269869__4 = function() {
        var G__269870__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__269870 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__269870__delegate.call(this, x, y, z, args)
        };
        G__269870.cljs$lang$maxFixedArity = 3;
        G__269870.cljs$lang$applyTo = function(arglist__269871) {
          var x = cljs.core.first(arglist__269871);
          var y = cljs.core.first(cljs.core.next(arglist__269871));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__269871)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__269871)));
          return G__269870__delegate(x, y, z, args)
        };
        G__269870.cljs$lang$arity$variadic = G__269870__delegate;
        return G__269870
      }();
      G__269869 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__269869__0.call(this);
          case 1:
            return G__269869__1.call(this, x);
          case 2:
            return G__269869__2.call(this, x, y);
          case 3:
            return G__269869__3.call(this, x, y, z);
          default:
            return G__269869__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__269869.cljs$lang$maxFixedArity = 3;
      G__269869.cljs$lang$applyTo = G__269869__4.cljs$lang$applyTo;
      return G__269869
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__269872 = null;
      var G__269872__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__269872__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__269872__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__269872__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__269872__4 = function() {
        var G__269873__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__269873 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__269873__delegate.call(this, x, y, z, args)
        };
        G__269873.cljs$lang$maxFixedArity = 3;
        G__269873.cljs$lang$applyTo = function(arglist__269874) {
          var x = cljs.core.first(arglist__269874);
          var y = cljs.core.first(cljs.core.next(arglist__269874));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__269874)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__269874)));
          return G__269873__delegate(x, y, z, args)
        };
        G__269873.cljs$lang$arity$variadic = G__269873__delegate;
        return G__269873
      }();
      G__269872 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__269872__0.call(this);
          case 1:
            return G__269872__1.call(this, x);
          case 2:
            return G__269872__2.call(this, x, y);
          case 3:
            return G__269872__3.call(this, x, y, z);
          default:
            return G__269872__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__269872.cljs$lang$maxFixedArity = 3;
      G__269872.cljs$lang$applyTo = G__269872__4.cljs$lang$applyTo;
      return G__269872
    }()
  };
  var juxt__4 = function() {
    var G__269875__delegate = function(f, g, h, fs) {
      var fs__269865 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__269876 = null;
        var G__269876__0 = function() {
          return cljs.core.reduce.call(null, function(p1__269851_SHARP_, p2__269852_SHARP_) {
            return cljs.core.conj.call(null, p1__269851_SHARP_, p2__269852_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__269865)
        };
        var G__269876__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__269853_SHARP_, p2__269854_SHARP_) {
            return cljs.core.conj.call(null, p1__269853_SHARP_, p2__269854_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__269865)
        };
        var G__269876__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__269855_SHARP_, p2__269856_SHARP_) {
            return cljs.core.conj.call(null, p1__269855_SHARP_, p2__269856_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__269865)
        };
        var G__269876__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__269857_SHARP_, p2__269858_SHARP_) {
            return cljs.core.conj.call(null, p1__269857_SHARP_, p2__269858_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__269865)
        };
        var G__269876__4 = function() {
          var G__269877__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__269859_SHARP_, p2__269860_SHARP_) {
              return cljs.core.conj.call(null, p1__269859_SHARP_, cljs.core.apply.call(null, p2__269860_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__269865)
          };
          var G__269877 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__269877__delegate.call(this, x, y, z, args)
          };
          G__269877.cljs$lang$maxFixedArity = 3;
          G__269877.cljs$lang$applyTo = function(arglist__269878) {
            var x = cljs.core.first(arglist__269878);
            var y = cljs.core.first(cljs.core.next(arglist__269878));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__269878)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__269878)));
            return G__269877__delegate(x, y, z, args)
          };
          G__269877.cljs$lang$arity$variadic = G__269877__delegate;
          return G__269877
        }();
        G__269876 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__269876__0.call(this);
            case 1:
              return G__269876__1.call(this, x);
            case 2:
              return G__269876__2.call(this, x, y);
            case 3:
              return G__269876__3.call(this, x, y, z);
            default:
              return G__269876__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__269876.cljs$lang$maxFixedArity = 3;
        G__269876.cljs$lang$applyTo = G__269876__4.cljs$lang$applyTo;
        return G__269876
      }()
    };
    var G__269875 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__269875__delegate.call(this, f, g, h, fs)
    };
    G__269875.cljs$lang$maxFixedArity = 3;
    G__269875.cljs$lang$applyTo = function(arglist__269879) {
      var f = cljs.core.first(arglist__269879);
      var g = cljs.core.first(cljs.core.next(arglist__269879));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__269879)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__269879)));
      return G__269875__delegate(f, g, h, fs)
    };
    G__269875.cljs$lang$arity$variadic = G__269875__delegate;
    return G__269875
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__269881 = cljs.core.next.call(null, coll);
        coll = G__269881;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____269880 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3822__auto____269880)) {
          return n > 0
        }else {
          return and__3822__auto____269880
        }
      }())) {
        var G__269882 = n - 1;
        var G__269883 = cljs.core.next.call(null, coll);
        n = G__269882;
        coll = G__269883;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__269884 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__269884), s)) {
    if(cljs.core.count.call(null, matches__269884) === 1) {
      return cljs.core.first.call(null, matches__269884)
    }else {
      return cljs.core.vec.call(null, matches__269884)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__269885 = re.exec(s);
  if(matches__269885 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__269885) === 1) {
      return cljs.core.first.call(null, matches__269885)
    }else {
      return cljs.core.vec.call(null, matches__269885)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__269886 = cljs.core.re_find.call(null, re, s);
  var match_idx__269887 = s.search(re);
  var match_str__269888 = cljs.core.coll_QMARK_.call(null, match_data__269886) ? cljs.core.first.call(null, match_data__269886) : match_data__269886;
  var post_match__269889 = cljs.core.subs.call(null, s, match_idx__269887 + cljs.core.count.call(null, match_str__269888));
  if(cljs.core.truth_(match_data__269886)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__269886, re_seq.call(null, re, post_match__269889))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__269891__269892 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___269893 = cljs.core.nth.call(null, vec__269891__269892, 0, null);
  var flags__269894 = cljs.core.nth.call(null, vec__269891__269892, 1, null);
  var pattern__269895 = cljs.core.nth.call(null, vec__269891__269892, 2, null);
  return new RegExp(pattern__269895, flags__269894)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__269890_SHARP_) {
    return print_one.call(null, p1__269890_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end]))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____269896 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3822__auto____269896)) {
            var and__3822__auto____269900 = function() {
              var G__269897__269898 = obj;
              if(G__269897__269898 != null) {
                if(function() {
                  var or__3824__auto____269899 = G__269897__269898.cljs$lang$protocol_mask$partition0$ & 65536;
                  if(or__3824__auto____269899) {
                    return or__3824__auto____269899
                  }else {
                    return G__269897__269898.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__269897__269898.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__269897__269898)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__269897__269898)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____269900)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____269900
            }
          }else {
            return and__3822__auto____269896
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var and__3822__auto____269901 = obj != null;
          if(and__3822__auto____269901) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____269901
          }
        }()) ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__269902__269903 = obj;
          if(G__269902__269903 != null) {
            if(function() {
              var or__3824__auto____269904 = G__269902__269903.cljs$lang$protocol_mask$partition0$ & 268435456;
              if(or__3824__auto____269904) {
                return or__3824__auto____269904
              }else {
                return G__269902__269903.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__269902__269903.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__269902__269903)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__269902__269903)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__269905 = cljs.core.first.call(null, objs);
  var sb__269906 = new goog.string.StringBuffer;
  var G__269907__269908 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__269907__269908)) {
    var obj__269909 = cljs.core.first.call(null, G__269907__269908);
    var G__269907__269910 = G__269907__269908;
    while(true) {
      if(obj__269909 === first_obj__269905) {
      }else {
        sb__269906.append(" ")
      }
      var G__269911__269912 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__269909, opts));
      if(cljs.core.truth_(G__269911__269912)) {
        var string__269913 = cljs.core.first.call(null, G__269911__269912);
        var G__269911__269914 = G__269911__269912;
        while(true) {
          sb__269906.append(string__269913);
          var temp__3974__auto____269915 = cljs.core.next.call(null, G__269911__269914);
          if(cljs.core.truth_(temp__3974__auto____269915)) {
            var G__269911__269916 = temp__3974__auto____269915;
            var G__269919 = cljs.core.first.call(null, G__269911__269916);
            var G__269920 = G__269911__269916;
            string__269913 = G__269919;
            G__269911__269914 = G__269920;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____269917 = cljs.core.next.call(null, G__269907__269910);
      if(cljs.core.truth_(temp__3974__auto____269917)) {
        var G__269907__269918 = temp__3974__auto____269917;
        var G__269921 = cljs.core.first.call(null, G__269907__269918);
        var G__269922 = G__269907__269918;
        obj__269909 = G__269921;
        G__269907__269910 = G__269922;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__269906
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__269923 = cljs.core.pr_sb.call(null, objs, opts);
  sb__269923.append("\n");
  return[cljs.core.str(sb__269923)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__269924 = cljs.core.first.call(null, objs);
  var G__269925__269926 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__269925__269926)) {
    var obj__269927 = cljs.core.first.call(null, G__269925__269926);
    var G__269925__269928 = G__269925__269926;
    while(true) {
      if(obj__269927 === first_obj__269924) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__269929__269930 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__269927, opts));
      if(cljs.core.truth_(G__269929__269930)) {
        var string__269931 = cljs.core.first.call(null, G__269929__269930);
        var G__269929__269932 = G__269929__269930;
        while(true) {
          cljs.core.string_print.call(null, string__269931);
          var temp__3974__auto____269933 = cljs.core.next.call(null, G__269929__269932);
          if(cljs.core.truth_(temp__3974__auto____269933)) {
            var G__269929__269934 = temp__3974__auto____269933;
            var G__269937 = cljs.core.first.call(null, G__269929__269934);
            var G__269938 = G__269929__269934;
            string__269931 = G__269937;
            G__269929__269932 = G__269938;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____269935 = cljs.core.next.call(null, G__269925__269928);
      if(cljs.core.truth_(temp__3974__auto____269935)) {
        var G__269925__269936 = temp__3974__auto____269935;
        var G__269939 = cljs.core.first.call(null, G__269925__269936);
        var G__269940 = G__269925__269936;
        obj__269927 = G__269939;
        G__269925__269928 = G__269940;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0'flush-on-newline"))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__269941) {
    var objs = cljs.core.seq(arglist__269941);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__269942) {
    var objs = cljs.core.seq(arglist__269942);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__269943) {
    var objs = cljs.core.seq(arglist__269943);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__269944) {
    var objs = cljs.core.seq(arglist__269944);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__269945) {
    var objs = cljs.core.seq(arglist__269945);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__269946) {
    var objs = cljs.core.seq(arglist__269946);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__269947) {
    var objs = cljs.core.seq(arglist__269947);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__269948) {
    var objs = cljs.core.seq(arglist__269948);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__269949 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__269949, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__269950 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__269950, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__269951 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__269951, "{", ", ", "}", opts, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____269952 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____269952)) {
        var nspc__269953 = temp__3974__auto____269952;
        return[cljs.core.str(nspc__269953), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____269954 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____269954)) {
          var nspc__269955 = temp__3974__auto____269954;
          return[cljs.core.str(nspc__269955), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__269956 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__269956, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__269957 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__269957, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1345404928
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__269958 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__269959 = this;
  var G__269960__269961 = cljs.core.seq.call(null, this__269959.watches);
  if(cljs.core.truth_(G__269960__269961)) {
    var G__269963__269965 = cljs.core.first.call(null, G__269960__269961);
    var vec__269964__269966 = G__269963__269965;
    var key__269967 = cljs.core.nth.call(null, vec__269964__269966, 0, null);
    var f__269968 = cljs.core.nth.call(null, vec__269964__269966, 1, null);
    var G__269960__269969 = G__269960__269961;
    var G__269963__269970 = G__269963__269965;
    var G__269960__269971 = G__269960__269969;
    while(true) {
      var vec__269972__269973 = G__269963__269970;
      var key__269974 = cljs.core.nth.call(null, vec__269972__269973, 0, null);
      var f__269975 = cljs.core.nth.call(null, vec__269972__269973, 1, null);
      var G__269960__269976 = G__269960__269971;
      f__269975.call(null, key__269974, this$, oldval, newval);
      var temp__3974__auto____269977 = cljs.core.next.call(null, G__269960__269976);
      if(cljs.core.truth_(temp__3974__auto____269977)) {
        var G__269960__269978 = temp__3974__auto____269977;
        var G__269985 = cljs.core.first.call(null, G__269960__269978);
        var G__269986 = G__269960__269978;
        G__269963__269970 = G__269985;
        G__269960__269971 = G__269986;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__269979 = this;
  return this$.watches = cljs.core.assoc.call(null, this__269979.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__269980 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__269980.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__269981 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__269981.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__269982 = this;
  return this__269982.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__269983 = this;
  return this__269983.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__269984 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__269993__delegate = function(x, p__269987) {
      var map__269988__269989 = p__269987;
      var map__269988__269990 = cljs.core.seq_QMARK_.call(null, map__269988__269989) ? cljs.core.apply.call(null, cljs.core.hash_map, map__269988__269989) : map__269988__269989;
      var validator__269991 = cljs.core.get.call(null, map__269988__269990, "\ufdd0'validator");
      var meta__269992 = cljs.core.get.call(null, map__269988__269990, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__269992, validator__269991, null)
    };
    var G__269993 = function(x, var_args) {
      var p__269987 = null;
      if(goog.isDef(var_args)) {
        p__269987 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__269993__delegate.call(this, x, p__269987)
    };
    G__269993.cljs$lang$maxFixedArity = 1;
    G__269993.cljs$lang$applyTo = function(arglist__269994) {
      var x = cljs.core.first(arglist__269994);
      var p__269987 = cljs.core.rest(arglist__269994);
      return G__269993__delegate(x, p__269987)
    };
    G__269993.cljs$lang$arity$variadic = G__269993__delegate;
    return G__269993
  }();
  atom = function(x, var_args) {
    var p__269987 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____269995 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____269995)) {
    var validate__269996 = temp__3974__auto____269995;
    if(cljs.core.truth_(validate__269996.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 5905))))].join(""));
    }
  }else {
  }
  var old_value__269997 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__269997, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__269998__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__269998 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__269998__delegate.call(this, a, f, x, y, z, more)
    };
    G__269998.cljs$lang$maxFixedArity = 5;
    G__269998.cljs$lang$applyTo = function(arglist__269999) {
      var a = cljs.core.first(arglist__269999);
      var f = cljs.core.first(cljs.core.next(arglist__269999));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__269999)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__269999))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__269999)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__269999)))));
      return G__269998__delegate(a, f, x, y, z, more)
    };
    G__269998.cljs$lang$arity$variadic = G__269998__delegate;
    return G__269998
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__270000) {
    var iref = cljs.core.first(arglist__270000);
    var f = cljs.core.first(cljs.core.next(arglist__270000));
    var args = cljs.core.rest(cljs.core.next(arglist__270000));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 536887296
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__270001 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__270001.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__270002 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__270002.state, function(p__270003) {
    var curr_state__270004 = p__270003;
    var curr_state__270005 = cljs.core.seq_QMARK_.call(null, curr_state__270004) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__270004) : curr_state__270004;
    var done__270006 = cljs.core.get.call(null, curr_state__270005, "\ufdd0'done");
    if(cljs.core.truth_(done__270006)) {
      return curr_state__270005
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__270002.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__270007__270008 = options;
    var map__270007__270009 = cljs.core.seq_QMARK_.call(null, map__270007__270008) ? cljs.core.apply.call(null, cljs.core.hash_map, map__270007__270008) : map__270007__270008;
    var keywordize_keys__270010 = cljs.core.get.call(null, map__270007__270009, "\ufdd0'keywordize-keys");
    var keyfn__270011 = cljs.core.truth_(keywordize_keys__270010) ? cljs.core.keyword : cljs.core.str;
    var f__270017 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__593__auto____270016 = function iter__270012(s__270013) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__270013__270014 = s__270013;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__270013__270014))) {
                        var k__270015 = cljs.core.first.call(null, s__270013__270014);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__270011.call(null, k__270015), thisfn.call(null, x[k__270015])]), iter__270012.call(null, cljs.core.rest.call(null, s__270013__270014)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__593__auto____270016.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__270017.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__270018) {
    var x = cljs.core.first(arglist__270018);
    var options = cljs.core.rest(arglist__270018);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__270019 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__270023__delegate = function(args) {
      var temp__3971__auto____270020 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__270019), args);
      if(cljs.core.truth_(temp__3971__auto____270020)) {
        var v__270021 = temp__3971__auto____270020;
        return v__270021
      }else {
        var ret__270022 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__270019, cljs.core.assoc, args, ret__270022);
        return ret__270022
      }
    };
    var G__270023 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__270023__delegate.call(this, args)
    };
    G__270023.cljs$lang$maxFixedArity = 0;
    G__270023.cljs$lang$applyTo = function(arglist__270024) {
      var args = cljs.core.seq(arglist__270024);
      return G__270023__delegate(args)
    };
    G__270023.cljs$lang$arity$variadic = G__270023__delegate;
    return G__270023
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__270025 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__270025)) {
        var G__270026 = ret__270025;
        f = G__270026;
        continue
      }else {
        return ret__270025
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__270027__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__270027 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__270027__delegate.call(this, f, args)
    };
    G__270027.cljs$lang$maxFixedArity = 1;
    G__270027.cljs$lang$applyTo = function(arglist__270028) {
      var f = cljs.core.first(arglist__270028);
      var args = cljs.core.rest(arglist__270028);
      return G__270027__delegate(f, args)
    };
    G__270027.cljs$lang$arity$variadic = G__270027__delegate;
    return G__270027
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor(Math.random() * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__270029 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__270029, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__270029, cljs.core.PersistentVector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____270030 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____270030) {
      return or__3824__auto____270030
    }else {
      var or__3824__auto____270031 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(or__3824__auto____270031) {
        return or__3824__auto____270031
      }else {
        var and__3822__auto____270032 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____270032) {
          var and__3822__auto____270033 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____270033) {
            var and__3822__auto____270034 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____270034) {
              var ret__270035 = true;
              var i__270036 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____270037 = cljs.core.not.call(null, ret__270035);
                  if(or__3824__auto____270037) {
                    return or__3824__auto____270037
                  }else {
                    return i__270036 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__270035
                }else {
                  var G__270038 = isa_QMARK_.call(null, h, child.call(null, i__270036), parent.call(null, i__270036));
                  var G__270039 = i__270036 + 1;
                  ret__270035 = G__270038;
                  i__270036 = G__270039;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____270034
            }
          }else {
            return and__3822__auto____270033
          }
        }else {
          return and__3822__auto____270032
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6189))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6193))))].join(""));
    }
    var tp__270043 = "\ufdd0'parents".call(null, h);
    var td__270044 = "\ufdd0'descendants".call(null, h);
    var ta__270045 = "\ufdd0'ancestors".call(null, h);
    var tf__270046 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____270047 = cljs.core.contains_QMARK_.call(null, tp__270043.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__270045.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__270045.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__270043, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__270046.call(null, "\ufdd0'ancestors".call(null, h), tag, td__270044, parent, ta__270045), "\ufdd0'descendants":tf__270046.call(null, "\ufdd0'descendants".call(null, h), parent, ta__270045, tag, td__270044)})
    }();
    if(cljs.core.truth_(or__3824__auto____270047)) {
      return or__3824__auto____270047
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__270048 = "\ufdd0'parents".call(null, h);
    var childsParents__270049 = cljs.core.truth_(parentMap__270048.call(null, tag)) ? cljs.core.disj.call(null, parentMap__270048.call(null, tag), parent) : cljs.core.set([]);
    var newParents__270050 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__270049)) ? cljs.core.assoc.call(null, parentMap__270048, tag, childsParents__270049) : cljs.core.dissoc.call(null, parentMap__270048, tag);
    var deriv_seq__270051 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__270040_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__270040_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__270040_SHARP_), cljs.core.second.call(null, p1__270040_SHARP_)))
    }, cljs.core.seq.call(null, newParents__270050)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__270048.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__270041_SHARP_, p2__270042_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__270041_SHARP_, p2__270042_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__270051))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__270052 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____270054 = cljs.core.truth_(function() {
    var and__3822__auto____270053 = xprefs__270052;
    if(cljs.core.truth_(and__3822__auto____270053)) {
      return xprefs__270052.call(null, y)
    }else {
      return and__3822__auto____270053
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____270054)) {
    return or__3824__auto____270054
  }else {
    var or__3824__auto____270056 = function() {
      var ps__270055 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__270055) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__270055), prefer_table))) {
          }else {
          }
          var G__270059 = cljs.core.rest.call(null, ps__270055);
          ps__270055 = G__270059;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____270056)) {
      return or__3824__auto____270056
    }else {
      var or__3824__auto____270058 = function() {
        var ps__270057 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__270057) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__270057), y, prefer_table))) {
            }else {
            }
            var G__270060 = cljs.core.rest.call(null, ps__270057);
            ps__270057 = G__270060;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____270058)) {
        return or__3824__auto____270058
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____270061 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____270061)) {
    return or__3824__auto____270061
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__270070 = cljs.core.reduce.call(null, function(be, p__270062) {
    var vec__270063__270064 = p__270062;
    var k__270065 = cljs.core.nth.call(null, vec__270063__270064, 0, null);
    var ___270066 = cljs.core.nth.call(null, vec__270063__270064, 1, null);
    var e__270067 = vec__270063__270064;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__270065)) {
      var be2__270069 = cljs.core.truth_(function() {
        var or__3824__auto____270068 = be == null;
        if(or__3824__auto____270068) {
          return or__3824__auto____270068
        }else {
          return cljs.core.dominates.call(null, k__270065, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__270067 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__270069), k__270065, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__270065), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__270069)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__270069
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__270070)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__270070));
      return cljs.core.second.call(null, best_entry__270070)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
void 0;
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____270071 = mf;
    if(and__3822__auto____270071) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____270071
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____270072 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(or__3824__auto____270072) {
        return or__3824__auto____270072
      }else {
        var or__3824__auto____270073 = cljs.core._reset["_"];
        if(or__3824__auto____270073) {
          return or__3824__auto____270073
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____270074 = mf;
    if(and__3822__auto____270074) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____270074
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3824__auto____270075 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____270075) {
        return or__3824__auto____270075
      }else {
        var or__3824__auto____270076 = cljs.core._add_method["_"];
        if(or__3824__auto____270076) {
          return or__3824__auto____270076
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____270077 = mf;
    if(and__3822__auto____270077) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____270077
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____270078 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____270078) {
        return or__3824__auto____270078
      }else {
        var or__3824__auto____270079 = cljs.core._remove_method["_"];
        if(or__3824__auto____270079) {
          return or__3824__auto____270079
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____270080 = mf;
    if(and__3822__auto____270080) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____270080
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3824__auto____270081 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____270081) {
        return or__3824__auto____270081
      }else {
        var or__3824__auto____270082 = cljs.core._prefer_method["_"];
        if(or__3824__auto____270082) {
          return or__3824__auto____270082
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____270083 = mf;
    if(and__3822__auto____270083) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____270083
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____270084 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____270084) {
        return or__3824__auto____270084
      }else {
        var or__3824__auto____270085 = cljs.core._get_method["_"];
        if(or__3824__auto____270085) {
          return or__3824__auto____270085
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____270086 = mf;
    if(and__3822__auto____270086) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____270086
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____270087 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(or__3824__auto____270087) {
        return or__3824__auto____270087
      }else {
        var or__3824__auto____270088 = cljs.core._methods["_"];
        if(or__3824__auto____270088) {
          return or__3824__auto____270088
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____270089 = mf;
    if(and__3822__auto____270089) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____270089
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____270090 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(or__3824__auto____270090) {
        return or__3824__auto____270090
      }else {
        var or__3824__auto____270091 = cljs.core._prefers["_"];
        if(or__3824__auto____270091) {
          return or__3824__auto____270091
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____270092 = mf;
    if(and__3822__auto____270092) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____270092
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3824__auto____270093 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(or__3824__auto____270093) {
        return or__3824__auto____270093
      }else {
        var or__3824__auto____270094 = cljs.core._dispatch["_"];
        if(or__3824__auto____270094) {
          return or__3824__auto____270094
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__270095 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__270096 = cljs.core._get_method.call(null, mf, dispatch_val__270095);
  if(cljs.core.truth_(target_fn__270096)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__270095)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__270096, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 2097152;
  this.cljs$lang$protocol_mask$partition1$ = 32
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__270097 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__270098 = this;
  cljs.core.swap_BANG_.call(null, this__270098.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__270098.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__270098.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__270098.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__270099 = this;
  cljs.core.swap_BANG_.call(null, this__270099.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__270099.method_cache, this__270099.method_table, this__270099.cached_hierarchy, this__270099.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__270100 = this;
  cljs.core.swap_BANG_.call(null, this__270100.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__270100.method_cache, this__270100.method_table, this__270100.cached_hierarchy, this__270100.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__270101 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__270101.cached_hierarchy), cljs.core.deref.call(null, this__270101.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__270101.method_cache, this__270101.method_table, this__270101.cached_hierarchy, this__270101.hierarchy)
  }
  var temp__3971__auto____270102 = cljs.core.deref.call(null, this__270101.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____270102)) {
    var target_fn__270103 = temp__3971__auto____270102;
    return target_fn__270103
  }else {
    var temp__3971__auto____270104 = cljs.core.find_and_cache_best_method.call(null, this__270101.name, dispatch_val, this__270101.hierarchy, this__270101.method_table, this__270101.prefer_table, this__270101.method_cache, this__270101.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____270104)) {
      var target_fn__270105 = temp__3971__auto____270104;
      return target_fn__270105
    }else {
      return cljs.core.deref.call(null, this__270101.method_table).call(null, this__270101.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__270106 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__270106.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__270106.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__270106.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__270106.method_cache, this__270106.method_table, this__270106.cached_hierarchy, this__270106.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__270107 = this;
  return cljs.core.deref.call(null, this__270107.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__270108 = this;
  return cljs.core.deref.call(null, this__270108.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__270109 = this;
  return cljs.core.do_dispatch.call(null, mf, this__270109.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__270110__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__270110 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__270110__delegate.call(this, _, args)
  };
  G__270110.cljs$lang$maxFixedArity = 1;
  G__270110.cljs$lang$applyTo = function(arglist__270111) {
    var _ = cljs.core.first(arglist__270111);
    var args = cljs.core.rest(arglist__270111);
    return G__270110__delegate(_, args)
  };
  G__270110.cljs$lang$arity$variadic = G__270110__delegate;
  return G__270110
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  return cljs.core._dispatch.call(null, this, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isVersion("9"), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isVersion("9") || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", DD:"DD", DEL:"DEL", DFN:"DFN", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", FIELDSET:"FIELDSET", FONT:"FONT", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", 
H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", MAP:"MAP", MENU:"MENU", META:"META", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", P:"P", PARAM:"PARAM", PRE:"PRE", Q:"Q", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SELECT:"SELECT", SMALL:"SMALL", SPAN:"SPAN", STRIKE:"STRIKE", 
STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUP:"SUP", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TITLE:"TITLE", TR:"TR", TT:"TT", U:"U", UL:"UL", VAR:"VAR"};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return className && typeof className.split == "function" ? className.split(/\s+/) : []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < classes.length;i++) {
    if(goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      goog.dom.classes.remove_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.math.Coordinate");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return parent.querySelectorAll && parent.querySelector && (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(document) || goog.userAgent.isVersion("528"))
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            element[key] = val
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "rowspan":"rowSpan", "valign":"vAlign", "height":"height", "width":"width", "usemap":"useMap", "frameborder":"frameBorder", "maxlength":"maxLength", "type":"type"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("500") && !goog.userAgent.MOBILE) {
    if(typeof win.innerHeight == "undefined") {
      win = window
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;
    if(win == win.top) {
      if(scrollHeight < innerHeight) {
        innerHeight -= 15
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight)
  }
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.clone(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.STYLE:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc;
  if(goog.userAgent.WEBKIT) {
    doc = frame.document || frame.contentWindow.document
  }else {
    doc = frame.contentDocument || frame.contentWindow.document
  }
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    for(var i = 0, child;child = root.childNodes[i];i++) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.userAgent.IE) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, opt_class) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, opt_class)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("hello");
goog.require("cljs.core");
goog.require("goog.dom");
hello.greet = function greet(n) {
  return[cljs.core.str("hi "), cljs.core.str(n)].join("")
};
hello.heading = function heading(s) {
  return goog.dom.createDom.call(null, "h1", null, s)
};
hello.writeGreet = function writeGreet(n) {
  var word__267756 = hello.heading.call(null, hello.greet.call(null, "foo"));
  var body__267757 = goog.dom.getDocument.call(null).body;
  return goog.dom.appendChild.call(null, body__267757, word__267756)
};
goog.exportSymbol("hello.writeGreet", hello.writeGreet);
