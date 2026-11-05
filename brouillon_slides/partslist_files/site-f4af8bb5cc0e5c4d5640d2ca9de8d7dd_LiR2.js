

// Polyfill from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
if (typeof Object.assign != 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) { // .length of function is 2
      'use strict';
      if (target == null) { // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) { // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}

if (!Object.entries) {
  Object.entries = function( obj ){
    var ownProps = Object.keys( obj ),
        i = ownProps.length,
        resArray = new Array(i); // preallocate the Array
    while (i--)
      resArray[i] = [ownProps[i], obj[ownProps[i]]];

    return resArray;
  };
}

// Production steps of ECMA-262, Edition 6, 22.1.2.1
if (!Array.from) {
  Array.from = (function () {
    var toStr = Object.prototype.toString;
    var isCallable = function (fn) {
      return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
    };
    var toInteger = function (value) {
      var number = Number(value);
      if (isNaN(number)) { return 0; }
      if (number === 0 || !isFinite(number)) { return number; }
      return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
    };
    var maxSafeInteger = Math.pow(2, 53) - 1;
    var toLength = function (value) {
      var len = toInteger(value);
      return Math.min(Math.max(len, 0), maxSafeInteger);
    };

    // The length property of the from method is 1.
    return function from(arrayLike/*, mapFn, thisArg */) {
      // 1. Let C be the this value.
      var C = this;

      // 2. Let items be ToObject(arrayLike).
      var items = Object(arrayLike);

      // 3. ReturnIfAbrupt(items).
      if (arrayLike == null) {
        throw new TypeError('Array.from requires an array-like object - not null or undefined');
      }

      // 4. If mapfn is undefined, then let mapping be false.
      var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
      var T;
      if (typeof mapFn !== 'undefined') {
        // 5. else
        // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
        if (!isCallable(mapFn)) {
          throw new TypeError('Array.from: when provided, the second argument must be a function');
        }

        // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if (arguments.length > 2) {
          T = arguments[2];
        }
      }

      // 10. Let lenValue be Get(items, "length").
      // 11. Let len be ToLength(lenValue).
      var len = toLength(items.length);

      // 13. If IsConstructor(C) is true, then
      // 13. a. Let A be the result of calling the [[Construct]] internal method
      // of C with an argument list containing the single item len.
      // 14. a. Else, Let A be ArrayCreate(len).
      var A = isCallable(C) ? Object(new C(len)) : new Array(len);

      // 16. Let k be 0.
      var k = 0;
      // 17. Repeat, while k < len… (also steps a - h)
      var kValue;
      while (k < len) {
        kValue = items[k];
        if (mapFn) {
          A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
        } else {
          A[k] = kValue;
        }
        k += 1;
      }
      // 18. Let putStatus be Put(A, "length", len, true).
      A.length = len;
      // 20. Return A.
      return A;
    };
  }());
}

if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
    'use strict';
    if (typeof start !== 'number') {
      start = 0;
    }

    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}


/*! jQuery v3.6.0 | (c) OpenJS Foundation and other contributors | jquery.org/license */
!function(e,t){"use strict";"object"==typeof module&&"object"==typeof module.exports?module.exports=e.document?t(e,!0):function(e){if(!e.document)throw new Error("jQuery requires a window with a document");return t(e)}:t(e)}("undefined"!=typeof window?window:this,function(C,e){"use strict";var t=[],r=Object.getPrototypeOf,s=t.slice,g=t.flat?function(e){return t.flat.call(e)}:function(e){return t.concat.apply([],e)},u=t.push,i=t.indexOf,n={},o=n.toString,v=n.hasOwnProperty,a=v.toString,l=a.call(Object),y={},m=function(e){return"function"==typeof e&&"number"!=typeof e.nodeType&&"function"!=typeof e.item},x=function(e){return null!=e&&e===e.window},E=C.document,c={type:!0,src:!0,nonce:!0,noModule:!0};function b(e,t,n){var r,i,o=(n=n||E).createElement("script");if(o.text=e,t)for(r in c)(i=t[r]||t.getAttribute&&t.getAttribute(r))&&o.setAttribute(r,i);n.head.appendChild(o).parentNode.removeChild(o)}function w(e){return null==e?e+"":"object"==typeof e||"function"==typeof e?n[o.call(e)]||"object":typeof e}var f="3.6.0",S=function(e,t){return new S.fn.init(e,t)};function p(e){var t=!!e&&"length"in e&&e.length,n=w(e);return!m(e)&&!x(e)&&("array"===n||0===t||"number"==typeof t&&0<t&&t-1 in e)}S.fn=S.prototype={jquery:f,constructor:S,length:0,toArray:function(){return s.call(this)},get:function(e){return null==e?s.call(this):e<0?this[e+this.length]:this[e]},pushStack:function(e){var t=S.merge(this.constructor(),e);return t.prevObject=this,t},each:function(e){return S.each(this,e)},map:function(n){return this.pushStack(S.map(this,function(e,t){return n.call(e,t,e)}))},slice:function(){return this.pushStack(s.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},even:function(){return this.pushStack(S.grep(this,function(e,t){return(t+1)%2}))},odd:function(){return this.pushStack(S.grep(this,function(e,t){return t%2}))},eq:function(e){var t=this.length,n=+e+(e<0?t:0);return this.pushStack(0<=n&&n<t?[this[n]]:[])},end:function(){return this.prevObject||this.constructor()},push:u,sort:t.sort,splice:t.splice},S.extend=S.fn.extend=function(){var e,t,n,r,i,o,a=arguments[0]||{},s=1,u=arguments.length,l=!1;for("boolean"==typeof a&&(l=a,a=arguments[s]||{},s++),"object"==typeof a||m(a)||(a={}),s===u&&(a=this,s--);s<u;s++)if(null!=(e=arguments[s]))for(t in e)r=e[t],"__proto__"!==t&&a!==r&&(l&&r&&(S.isPlainObject(r)||(i=Array.isArray(r)))?(n=a[t],o=i&&!Array.isArray(n)?[]:i||S.isPlainObject(n)?n:{},i=!1,a[t]=S.extend(l,o,r)):void 0!==r&&(a[t]=r));return a},S.extend({expando:"jQuery"+(f+Math.random()).replace(/\D/g,""),isReady:!0,error:function(e){throw new Error(e)},noop:function(){},isPlainObject:function(e){var t,n;return!(!e||"[object Object]"!==o.call(e))&&(!(t=r(e))||"function"==typeof(n=v.call(t,"constructor")&&t.constructor)&&a.call(n)===l)},isEmptyObject:function(e){var t;for(t in e)return!1;return!0},globalEval:function(e,t,n){b(e,{nonce:t&&t.nonce},n)},each:function(e,t){var n,r=0;if(p(e)){for(n=e.length;r<n;r++)if(!1===t.call(e[r],r,e[r]))break}else for(r in e)if(!1===t.call(e[r],r,e[r]))break;return e},makeArray:function(e,t){var n=t||[];return null!=e&&(p(Object(e))?S.merge(n,"string"==typeof e?[e]:e):u.call(n,e)),n},inArray:function(e,t,n){return null==t?-1:i.call(t,e,n)},merge:function(e,t){for(var n=+t.length,r=0,i=e.length;r<n;r++)e[i++]=t[r];return e.length=i,e},grep:function(e,t,n){for(var r=[],i=0,o=e.length,a=!n;i<o;i++)!t(e[i],i)!==a&&r.push(e[i]);return r},map:function(e,t,n){var r,i,o=0,a=[];if(p(e))for(r=e.length;o<r;o++)null!=(i=t(e[o],o,n))&&a.push(i);else for(o in e)null!=(i=t(e[o],o,n))&&a.push(i);return g(a)},guid:1,support:y}),"function"==typeof Symbol&&(S.fn[Symbol.iterator]=t[Symbol.iterator]),S.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "),function(e,t){n["[object "+t+"]"]=t.toLowerCase()});var d=function(n){var e,d,b,o,i,h,f,g,w,u,l,T,C,a,E,v,s,c,y,S="sizzle"+1*new Date,p=n.document,k=0,r=0,m=ue(),x=ue(),A=ue(),N=ue(),j=function(e,t){return e===t&&(l=!0),0},D={}.hasOwnProperty,t=[],q=t.pop,L=t.push,H=t.push,O=t.slice,P=function(e,t){for(var n=0,r=e.length;n<r;n++)if(e[n]===t)return n;return-1},R="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",M="[\\x20\\t\\r\\n\\f]",I="(?:\\\\[\\da-fA-F]{1,6}"+M+"?|\\\\[^\\r\\n\\f]|[\\w-]|[^\0-\\x7f])+",W="\\["+M+"*("+I+")(?:"+M+"*([*^$|!~]?=)"+M+"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|("+I+"))|)"+M+"*\\]",F=":("+I+")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|"+W+")*)|.*)\\)|)",B=new RegExp(M+"+","g"),$=new RegExp("^"+M+"+|((?:^|[^\\\\])(?:\\\\.)*)"+M+"+$","g"),_=new RegExp("^"+M+"*,"+M+"*"),z=new RegExp("^"+M+"*([>+~]|"+M+")"+M+"*"),U=new RegExp(M+"|>"),X=new RegExp(F),V=new RegExp("^"+I+"$"),G={ID:new RegExp("^#("+I+")"),CLASS:new RegExp("^\\.("+I+")"),TAG:new RegExp("^("+I+"|[*])"),ATTR:new RegExp("^"+W),PSEUDO:new RegExp("^"+F),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+M+"*(even|odd|(([+-]|)(\\d*)n|)"+M+"*(?:([+-]|)"+M+"*(\\d+)|))"+M+"*\\)|)","i"),bool:new RegExp("^(?:"+R+")$","i"),needsContext:new RegExp("^"+M+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+M+"*((?:-\\d)?\\d*)"+M+"*\\)|)(?=[^-]|$)","i")},Y=/HTML$/i,Q=/^(?:input|select|textarea|button)$/i,J=/^h\d$/i,K=/^[^{]+\{\s*\[native \w/,Z=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,ee=/[+~]/,te=new RegExp("\\\\[\\da-fA-F]{1,6}"+M+"?|\\\\([^\\r\\n\\f])","g"),ne=function(e,t){var n="0x"+e.slice(1)-65536;return t||(n<0?String.fromCharCode(n+65536):String.fromCharCode(n>>10|55296,1023&n|56320))},re=/([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,ie=function(e,t){return t?"\0"===e?"\ufffd":e.slice(0,-1)+"\\"+e.charCodeAt(e.length-1).toString(16)+" ":"\\"+e},oe=function(){T()},ae=be(function(e){return!0===e.disabled&&"fieldset"===e.nodeName.toLowerCase()},{dir:"parentNode",next:"legend"});try{H.apply(t=O.call(p.childNodes),p.childNodes),t[p.childNodes.length].nodeType}catch(e){H={apply:t.length?function(e,t){L.apply(e,O.call(t))}:function(e,t){var n=e.length,r=0;while(e[n++]=t[r++]);e.length=n-1}}}function se(t,e,n,r){var i,o,a,s,u,l,c,f=e&&e.ownerDocument,p=e?e.nodeType:9;if(n=n||[],"string"!=typeof t||!t||1!==p&&9!==p&&11!==p)return n;if(!r&&(T(e),e=e||C,E)){if(11!==p&&(u=Z.exec(t)))if(i=u[1]){if(9===p){if(!(a=e.getElementById(i)))return n;if(a.id===i)return n.push(a),n}else if(f&&(a=f.getElementById(i))&&y(e,a)&&a.id===i)return n.push(a),n}else{if(u[2])return H.apply(n,e.getElementsByTagName(t)),n;if((i=u[3])&&d.getElementsByClassName&&e.getElementsByClassName)return H.apply(n,e.getElementsByClassName(i)),n}if(d.qsa&&!N[t+" "]&&(!v||!v.test(t))&&(1!==p||"object"!==e.nodeName.toLowerCase())){if(c=t,f=e,1===p&&(U.test(t)||z.test(t))){(f=ee.test(t)&&ye(e.parentNode)||e)===e&&d.scope||((s=e.getAttribute("id"))?s=s.replace(re,ie):e.setAttribute("id",s=S)),o=(l=h(t)).length;while(o--)l[o]=(s?"#"+s:":scope")+" "+xe(l[o]);c=l.join(",")}try{return H.apply(n,f.querySelectorAll(c)),n}catch(e){N(t,!0)}finally{s===S&&e.removeAttribute("id")}}}return g(t.replace($,"$1"),e,n,r)}function ue(){var r=[];return function e(t,n){return r.push(t+" ")>b.cacheLength&&delete e[r.shift()],e[t+" "]=n}}function le(e){return e[S]=!0,e}function ce(e){var t=C.createElement("fieldset");try{return!!e(t)}catch(e){return!1}finally{t.parentNode&&t.parentNode.removeChild(t),t=null}}function fe(e,t){var n=e.split("|"),r=n.length;while(r--)b.attrHandle[n[r]]=t}function pe(e,t){var n=t&&e,r=n&&1===e.nodeType&&1===t.nodeType&&e.sourceIndex-t.sourceIndex;if(r)return r;if(n)while(n=n.nextSibling)if(n===t)return-1;return e?1:-1}function de(t){return function(e){return"input"===e.nodeName.toLowerCase()&&e.type===t}}function he(n){return function(e){var t=e.nodeName.toLowerCase();return("input"===t||"button"===t)&&e.type===n}}function ge(t){return function(e){return"form"in e?e.parentNode&&!1===e.disabled?"label"in e?"label"in e.parentNode?e.parentNode.disabled===t:e.disabled===t:e.isDisabled===t||e.isDisabled!==!t&&ae(e)===t:e.disabled===t:"label"in e&&e.disabled===t}}function ve(a){return le(function(o){return o=+o,le(function(e,t){var n,r=a([],e.length,o),i=r.length;while(i--)e[n=r[i]]&&(e[n]=!(t[n]=e[n]))})})}function ye(e){return e&&"undefined"!=typeof e.getElementsByTagName&&e}for(e in d=se.support={},i=se.isXML=function(e){var t=e&&e.namespaceURI,n=e&&(e.ownerDocument||e).documentElement;return!Y.test(t||n&&n.nodeName||"HTML")},T=se.setDocument=function(e){var t,n,r=e?e.ownerDocument||e:p;return r!=C&&9===r.nodeType&&r.documentElement&&(a=(C=r).documentElement,E=!i(C),p!=C&&(n=C.defaultView)&&n.top!==n&&(n.addEventListener?n.addEventListener("unload",oe,!1):n.attachEvent&&n.attachEvent("onunload",oe)),d.scope=ce(function(e){return a.appendChild(e).appendChild(C.createElement("div")),"undefined"!=typeof e.querySelectorAll&&!e.querySelectorAll(":scope fieldset div").length}),d.attributes=ce(function(e){return e.className="i",!e.getAttribute("className")}),d.getElementsByTagName=ce(function(e){return e.appendChild(C.createComment("")),!e.getElementsByTagName("*").length}),d.getElementsByClassName=K.test(C.getElementsByClassName),d.getById=ce(function(e){return a.appendChild(e).id=S,!C.getElementsByName||!C.getElementsByName(S).length}),d.getById?(b.filter.ID=function(e){var t=e.replace(te,ne);return function(e){return e.getAttribute("id")===t}},b.find.ID=function(e,t){if("undefined"!=typeof t.getElementById&&E){var n=t.getElementById(e);return n?[n]:[]}}):(b.filter.ID=function(e){var n=e.replace(te,ne);return function(e){var t="undefined"!=typeof e.getAttributeNode&&e.getAttributeNode("id");return t&&t.value===n}},b.find.ID=function(e,t){if("undefined"!=typeof t.getElementById&&E){var n,r,i,o=t.getElementById(e);if(o){if((n=o.getAttributeNode("id"))&&n.value===e)return[o];i=t.getElementsByName(e),r=0;while(o=i[r++])if((n=o.getAttributeNode("id"))&&n.value===e)return[o]}return[]}}),b.find.TAG=d.getElementsByTagName?function(e,t){return"undefined"!=typeof t.getElementsByTagName?t.getElementsByTagName(e):d.qsa?t.querySelectorAll(e):void 0}:function(e,t){var n,r=[],i=0,o=t.getElementsByTagName(e);if("*"===e){while(n=o[i++])1===n.nodeType&&r.push(n);return r}return o},b.find.CLASS=d.getElementsByClassName&&function(e,t){if("undefined"!=typeof t.getElementsByClassName&&E)return t.getElementsByClassName(e)},s=[],v=[],(d.qsa=K.test(C.querySelectorAll))&&(ce(function(e){var t;a.appendChild(e).innerHTML="<a id='"+S+"'></a><select id='"+S+"-\r\\' msallowcapture=''><option selected=''></option></select>",e.querySelectorAll("[msallowcapture^='']").length&&v.push("[*^$]="+M+"*(?:''|\"\")"),e.querySelectorAll("[selected]").length||v.push("\\["+M+"*(?:value|"+R+")"),e.querySelectorAll("[id~="+S+"-]").length||v.push("~="),(t=C.createElement("input")).setAttribute("name",""),e.appendChild(t),e.querySelectorAll("[name='']").length||v.push("\\["+M+"*name"+M+"*="+M+"*(?:''|\"\")"),e.querySelectorAll(":checked").length||v.push(":checked"),e.querySelectorAll("a#"+S+"+*").length||v.push(".#.+[+~]"),e.querySelectorAll("\\\f"),v.push("[\\r\\n\\f]")}),ce(function(e){e.innerHTML="<a href='' disabled='disabled'></a><select disabled='disabled'><option/></select>";var t=C.createElement("input");t.setAttribute("type","hidden"),e.appendChild(t).setAttribute("name","D"),e.querySelectorAll("[name=d]").length&&v.push("name"+M+"*[*^$|!~]?="),2!==e.querySelectorAll(":enabled").length&&v.push(":enabled",":disabled"),a.appendChild(e).disabled=!0,2!==e.querySelectorAll(":disabled").length&&v.push(":enabled",":disabled"),e.querySelectorAll("*,:x"),v.push(",.*:")})),(d.matchesSelector=K.test(c=a.matches||a.webkitMatchesSelector||a.mozMatchesSelector||a.oMatchesSelector||a.msMatchesSelector))&&ce(function(e){d.disconnectedMatch=c.call(e,"*"),c.call(e,"[s!='']:x"),s.push("!=",F)}),v=v.length&&new RegExp(v.join("|")),s=s.length&&new RegExp(s.join("|")),t=K.test(a.compareDocumentPosition),y=t||K.test(a.contains)?function(e,t){var n=9===e.nodeType?e.documentElement:e,r=t&&t.parentNode;return e===r||!(!r||1!==r.nodeType||!(n.contains?n.contains(r):e.compareDocumentPosition&&16&e.compareDocumentPosition(r)))}:function(e,t){if(t)while(t=t.parentNode)if(t===e)return!0;return!1},j=t?function(e,t){if(e===t)return l=!0,0;var n=!e.compareDocumentPosition-!t.compareDocumentPosition;return n||(1&(n=(e.ownerDocument||e)==(t.ownerDocument||t)?e.compareDocumentPosition(t):1)||!d.sortDetached&&t.compareDocumentPosition(e)===n?e==C||e.ownerDocument==p&&y(p,e)?-1:t==C||t.ownerDocument==p&&y(p,t)?1:u?P(u,e)-P(u,t):0:4&n?-1:1)}:function(e,t){if(e===t)return l=!0,0;var n,r=0,i=e.parentNode,o=t.parentNode,a=[e],s=[t];if(!i||!o)return e==C?-1:t==C?1:i?-1:o?1:u?P(u,e)-P(u,t):0;if(i===o)return pe(e,t);n=e;while(n=n.parentNode)a.unshift(n);n=t;while(n=n.parentNode)s.unshift(n);while(a[r]===s[r])r++;return r?pe(a[r],s[r]):a[r]==p?-1:s[r]==p?1:0}),C},se.matches=function(e,t){return se(e,null,null,t)},se.matchesSelector=function(e,t){if(T(e),d.matchesSelector&&E&&!N[t+" "]&&(!s||!s.test(t))&&(!v||!v.test(t)))try{var n=c.call(e,t);if(n||d.disconnectedMatch||e.document&&11!==e.document.nodeType)return n}catch(e){N(t,!0)}return 0<se(t,C,null,[e]).length},se.contains=function(e,t){return(e.ownerDocument||e)!=C&&T(e),y(e,t)},se.attr=function(e,t){(e.ownerDocument||e)!=C&&T(e);var n=b.attrHandle[t.toLowerCase()],r=n&&D.call(b.attrHandle,t.toLowerCase())?n(e,t,!E):void 0;return void 0!==r?r:d.attributes||!E?e.getAttribute(t):(r=e.getAttributeNode(t))&&r.specified?r.value:null},se.escape=function(e){return(e+"").replace(re,ie)},se.error=function(e){throw new Error("Syntax error, unrecognized expression: "+e)},se.uniqueSort=function(e){var t,n=[],r=0,i=0;if(l=!d.detectDuplicates,u=!d.sortStable&&e.slice(0),e.sort(j),l){while(t=e[i++])t===e[i]&&(r=n.push(i));while(r--)e.splice(n[r],1)}return u=null,e},o=se.getText=function(e){var t,n="",r=0,i=e.nodeType;if(i){if(1===i||9===i||11===i){if("string"==typeof e.textContent)return e.textContent;for(e=e.firstChild;e;e=e.nextSibling)n+=o(e)}else if(3===i||4===i)return e.nodeValue}else while(t=e[r++])n+=o(t);return n},(b=se.selectors={cacheLength:50,createPseudo:le,match:G,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(e){return e[1]=e[1].replace(te,ne),e[3]=(e[3]||e[4]||e[5]||"").replace(te,ne),"~="===e[2]&&(e[3]=" "+e[3]+" "),e.slice(0,4)},CHILD:function(e){return e[1]=e[1].toLowerCase(),"nth"===e[1].slice(0,3)?(e[3]||se.error(e[0]),e[4]=+(e[4]?e[5]+(e[6]||1):2*("even"===e[3]||"odd"===e[3])),e[5]=+(e[7]+e[8]||"odd"===e[3])):e[3]&&se.error(e[0]),e},PSEUDO:function(e){var t,n=!e[6]&&e[2];return G.CHILD.test(e[0])?null:(e[3]?e[2]=e[4]||e[5]||"":n&&X.test(n)&&(t=h(n,!0))&&(t=n.indexOf(")",n.length-t)-n.length)&&(e[0]=e[0].slice(0,t),e[2]=n.slice(0,t)),e.slice(0,3))}},filter:{TAG:function(e){var t=e.replace(te,ne).toLowerCase();return"*"===e?function(){return!0}:function(e){return e.nodeName&&e.nodeName.toLowerCase()===t}},CLASS:function(e){var t=m[e+" "];return t||(t=new RegExp("(^|"+M+")"+e+"("+M+"|$)"))&&m(e,function(e){return t.test("string"==typeof e.className&&e.className||"undefined"!=typeof e.getAttribute&&e.getAttribute("class")||"")})},ATTR:function(n,r,i){return function(e){var t=se.attr(e,n);return null==t?"!="===r:!r||(t+="","="===r?t===i:"!="===r?t!==i:"^="===r?i&&0===t.indexOf(i):"*="===r?i&&-1<t.indexOf(i):"$="===r?i&&t.slice(-i.length)===i:"~="===r?-1<(" "+t.replace(B," ")+" ").indexOf(i):"|="===r&&(t===i||t.slice(0,i.length+1)===i+"-"))}},CHILD:function(h,e,t,g,v){var y="nth"!==h.slice(0,3),m="last"!==h.slice(-4),x="of-type"===e;return 1===g&&0===v?function(e){return!!e.parentNode}:function(e,t,n){var r,i,o,a,s,u,l=y!==m?"nextSibling":"previousSibling",c=e.parentNode,f=x&&e.nodeName.toLowerCase(),p=!n&&!x,d=!1;if(c){if(y){while(l){a=e;while(a=a[l])if(x?a.nodeName.toLowerCase()===f:1===a.nodeType)return!1;u=l="only"===h&&!u&&"nextSibling"}return!0}if(u=[m?c.firstChild:c.lastChild],m&&p){d=(s=(r=(i=(o=(a=c)[S]||(a[S]={}))[a.uniqueID]||(o[a.uniqueID]={}))[h]||[])[0]===k&&r[1])&&r[2],a=s&&c.childNodes[s];while(a=++s&&a&&a[l]||(d=s=0)||u.pop())if(1===a.nodeType&&++d&&a===e){i[h]=[k,s,d];break}}else if(p&&(d=s=(r=(i=(o=(a=e)[S]||(a[S]={}))[a.uniqueID]||(o[a.uniqueID]={}))[h]||[])[0]===k&&r[1]),!1===d)while(a=++s&&a&&a[l]||(d=s=0)||u.pop())if((x?a.nodeName.toLowerCase()===f:1===a.nodeType)&&++d&&(p&&((i=(o=a[S]||(a[S]={}))[a.uniqueID]||(o[a.uniqueID]={}))[h]=[k,d]),a===e))break;return(d-=v)===g||d%g==0&&0<=d/g}}},PSEUDO:function(e,o){var t,a=b.pseudos[e]||b.setFilters[e.toLowerCase()]||se.error("unsupported pseudo: "+e);return a[S]?a(o):1<a.length?(t=[e,e,"",o],b.setFilters.hasOwnProperty(e.toLowerCase())?le(function(e,t){var n,r=a(e,o),i=r.length;while(i--)e[n=P(e,r[i])]=!(t[n]=r[i])}):function(e){return a(e,0,t)}):a}},pseudos:{not:le(function(e){var r=[],i=[],s=f(e.replace($,"$1"));return s[S]?le(function(e,t,n,r){var i,o=s(e,null,r,[]),a=e.length;while(a--)(i=o[a])&&(e[a]=!(t[a]=i))}):function(e,t,n){return r[0]=e,s(r,null,n,i),r[0]=null,!i.pop()}}),has:le(function(t){return function(e){return 0<se(t,e).length}}),contains:le(function(t){return t=t.replace(te,ne),function(e){return-1<(e.textContent||o(e)).indexOf(t)}}),lang:le(function(n){return V.test(n||"")||se.error("unsupported lang: "+n),n=n.replace(te,ne).toLowerCase(),function(e){var t;do{if(t=E?e.lang:e.getAttribute("xml:lang")||e.getAttribute("lang"))return(t=t.toLowerCase())===n||0===t.indexOf(n+"-")}while((e=e.parentNode)&&1===e.nodeType);return!1}}),target:function(e){var t=n.location&&n.location.hash;return t&&t.slice(1)===e.id},root:function(e){return e===a},focus:function(e){return e===C.activeElement&&(!C.hasFocus||C.hasFocus())&&!!(e.type||e.href||~e.tabIndex)},enabled:ge(!1),disabled:ge(!0),checked:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&!!e.checked||"option"===t&&!!e.selected},selected:function(e){return e.parentNode&&e.parentNode.selectedIndex,!0===e.selected},empty:function(e){for(e=e.firstChild;e;e=e.nextSibling)if(e.nodeType<6)return!1;return!0},parent:function(e){return!b.pseudos.empty(e)},header:function(e){return J.test(e.nodeName)},input:function(e){return Q.test(e.nodeName)},button:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&"button"===e.type||"button"===t},text:function(e){var t;return"input"===e.nodeName.toLowerCase()&&"text"===e.type&&(null==(t=e.getAttribute("type"))||"text"===t.toLowerCase())},first:ve(function(){return[0]}),last:ve(function(e,t){return[t-1]}),eq:ve(function(e,t,n){return[n<0?n+t:n]}),even:ve(function(e,t){for(var n=0;n<t;n+=2)e.push(n);return e}),odd:ve(function(e,t){for(var n=1;n<t;n+=2)e.push(n);return e}),lt:ve(function(e,t,n){for(var r=n<0?n+t:t<n?t:n;0<=--r;)e.push(r);return e}),gt:ve(function(e,t,n){for(var r=n<0?n+t:n;++r<t;)e.push(r);return e})}}).pseudos.nth=b.pseudos.eq,{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})b.pseudos[e]=de(e);for(e in{submit:!0,reset:!0})b.pseudos[e]=he(e);function me(){}function xe(e){for(var t=0,n=e.length,r="";t<n;t++)r+=e[t].value;return r}function be(s,e,t){var u=e.dir,l=e.next,c=l||u,f=t&&"parentNode"===c,p=r++;return e.first?function(e,t,n){while(e=e[u])if(1===e.nodeType||f)return s(e,t,n);return!1}:function(e,t,n){var r,i,o,a=[k,p];if(n){while(e=e[u])if((1===e.nodeType||f)&&s(e,t,n))return!0}else while(e=e[u])if(1===e.nodeType||f)if(i=(o=e[S]||(e[S]={}))[e.uniqueID]||(o[e.uniqueID]={}),l&&l===e.nodeName.toLowerCase())e=e[u]||e;else{if((r=i[c])&&r[0]===k&&r[1]===p)return a[2]=r[2];if((i[c]=a)[2]=s(e,t,n))return!0}return!1}}function we(i){return 1<i.length?function(e,t,n){var r=i.length;while(r--)if(!i[r](e,t,n))return!1;return!0}:i[0]}function Te(e,t,n,r,i){for(var o,a=[],s=0,u=e.length,l=null!=t;s<u;s++)(o=e[s])&&(n&&!n(o,r,i)||(a.push(o),l&&t.push(s)));return a}function Ce(d,h,g,v,y,e){return v&&!v[S]&&(v=Ce(v)),y&&!y[S]&&(y=Ce(y,e)),le(function(e,t,n,r){var i,o,a,s=[],u=[],l=t.length,c=e||function(e,t,n){for(var r=0,i=t.length;r<i;r++)se(e,t[r],n);return n}(h||"*",n.nodeType?[n]:n,[]),f=!d||!e&&h?c:Te(c,s,d,n,r),p=g?y||(e?d:l||v)?[]:t:f;if(g&&g(f,p,n,r),v){i=Te(p,u),v(i,[],n,r),o=i.length;while(o--)(a=i[o])&&(p[u[o]]=!(f[u[o]]=a))}if(e){if(y||d){if(y){i=[],o=p.length;while(o--)(a=p[o])&&i.push(f[o]=a);y(null,p=[],i,r)}o=p.length;while(o--)(a=p[o])&&-1<(i=y?P(e,a):s[o])&&(e[i]=!(t[i]=a))}}else p=Te(p===t?p.splice(l,p.length):p),y?y(null,t,p,r):H.apply(t,p)})}function Ee(e){for(var i,t,n,r=e.length,o=b.relative[e[0].type],a=o||b.relative[" "],s=o?1:0,u=be(function(e){return e===i},a,!0),l=be(function(e){return-1<P(i,e)},a,!0),c=[function(e,t,n){var r=!o&&(n||t!==w)||((i=t).nodeType?u(e,t,n):l(e,t,n));return i=null,r}];s<r;s++)if(t=b.relative[e[s].type])c=[be(we(c),t)];else{if((t=b.filter[e[s].type].apply(null,e[s].matches))[S]){for(n=++s;n<r;n++)if(b.relative[e[n].type])break;return Ce(1<s&&we(c),1<s&&xe(e.slice(0,s-1).concat({value:" "===e[s-2].type?"*":""})).replace($,"$1"),t,s<n&&Ee(e.slice(s,n)),n<r&&Ee(e=e.slice(n)),n<r&&xe(e))}c.push(t)}return we(c)}return me.prototype=b.filters=b.pseudos,b.setFilters=new me,h=se.tokenize=function(e,t){var n,r,i,o,a,s,u,l=x[e+" "];if(l)return t?0:l.slice(0);a=e,s=[],u=b.preFilter;while(a){for(o in n&&!(r=_.exec(a))||(r&&(a=a.slice(r[0].length)||a),s.push(i=[])),n=!1,(r=z.exec(a))&&(n=r.shift(),i.push({value:n,type:r[0].replace($," ")}),a=a.slice(n.length)),b.filter)!(r=G[o].exec(a))||u[o]&&!(r=u[o](r))||(n=r.shift(),i.push({value:n,type:o,matches:r}),a=a.slice(n.length));if(!n)break}return t?a.length:a?se.error(e):x(e,s).slice(0)},f=se.compile=function(e,t){var n,v,y,m,x,r,i=[],o=[],a=A[e+" "];if(!a){t||(t=h(e)),n=t.length;while(n--)(a=Ee(t[n]))[S]?i.push(a):o.push(a);(a=A(e,(v=o,m=0<(y=i).length,x=0<v.length,r=function(e,t,n,r,i){var o,a,s,u=0,l="0",c=e&&[],f=[],p=w,d=e||x&&b.find.TAG("*",i),h=k+=null==p?1:Math.random()||.1,g=d.length;for(i&&(w=t==C||t||i);l!==g&&null!=(o=d[l]);l++){if(x&&o){a=0,t||o.ownerDocument==C||(T(o),n=!E);while(s=v[a++])if(s(o,t||C,n)){r.push(o);break}i&&(k=h)}m&&((o=!s&&o)&&u--,e&&c.push(o))}if(u+=l,m&&l!==u){a=0;while(s=y[a++])s(c,f,t,n);if(e){if(0<u)while(l--)c[l]||f[l]||(f[l]=q.call(r));f=Te(f)}H.apply(r,f),i&&!e&&0<f.length&&1<u+y.length&&se.uniqueSort(r)}return i&&(k=h,w=p),c},m?le(r):r))).selector=e}return a},g=se.select=function(e,t,n,r){var i,o,a,s,u,l="function"==typeof e&&e,c=!r&&h(e=l.selector||e);if(n=n||[],1===c.length){if(2<(o=c[0]=c[0].slice(0)).length&&"ID"===(a=o[0]).type&&9===t.nodeType&&E&&b.relative[o[1].type]){if(!(t=(b.find.ID(a.matches[0].replace(te,ne),t)||[])[0]))return n;l&&(t=t.parentNode),e=e.slice(o.shift().value.length)}i=G.needsContext.test(e)?0:o.length;while(i--){if(a=o[i],b.relative[s=a.type])break;if((u=b.find[s])&&(r=u(a.matches[0].replace(te,ne),ee.test(o[0].type)&&ye(t.parentNode)||t))){if(o.splice(i,1),!(e=r.length&&xe(o)))return H.apply(n,r),n;break}}}return(l||f(e,c))(r,t,!E,n,!t||ee.test(e)&&ye(t.parentNode)||t),n},d.sortStable=S.split("").sort(j).join("")===S,d.detectDuplicates=!!l,T(),d.sortDetached=ce(function(e){return 1&e.compareDocumentPosition(C.createElement("fieldset"))}),ce(function(e){return e.innerHTML="<a href='#'></a>","#"===e.firstChild.getAttribute("href")})||fe("type|href|height|width",function(e,t,n){if(!n)return e.getAttribute(t,"type"===t.toLowerCase()?1:2)}),d.attributes&&ce(function(e){return e.innerHTML="<input/>",e.firstChild.setAttribute("value",""),""===e.firstChild.getAttribute("value")})||fe("value",function(e,t,n){if(!n&&"input"===e.nodeName.toLowerCase())return e.defaultValue}),ce(function(e){return null==e.getAttribute("disabled")})||fe(R,function(e,t,n){var r;if(!n)return!0===e[t]?t.toLowerCase():(r=e.getAttributeNode(t))&&r.specified?r.value:null}),se}(C);S.find=d,S.expr=d.selectors,S.expr[":"]=S.expr.pseudos,S.uniqueSort=S.unique=d.uniqueSort,S.text=d.getText,S.isXMLDoc=d.isXML,S.contains=d.contains,S.escapeSelector=d.escape;var h=function(e,t,n){var r=[],i=void 0!==n;while((e=e[t])&&9!==e.nodeType)if(1===e.nodeType){if(i&&S(e).is(n))break;r.push(e)}return r},T=function(e,t){for(var n=[];e;e=e.nextSibling)1===e.nodeType&&e!==t&&n.push(e);return n},k=S.expr.match.needsContext;function A(e,t){return e.nodeName&&e.nodeName.toLowerCase()===t.toLowerCase()}var N=/^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;function j(e,n,r){return m(n)?S.grep(e,function(e,t){return!!n.call(e,t,e)!==r}):n.nodeType?S.grep(e,function(e){return e===n!==r}):"string"!=typeof n?S.grep(e,function(e){return-1<i.call(n,e)!==r}):S.filter(n,e,r)}S.filter=function(e,t,n){var r=t[0];return n&&(e=":not("+e+")"),1===t.length&&1===r.nodeType?S.find.matchesSelector(r,e)?[r]:[]:S.find.matches(e,S.grep(t,function(e){return 1===e.nodeType}))},S.fn.extend({find:function(e){var t,n,r=this.length,i=this;if("string"!=typeof e)return this.pushStack(S(e).filter(function(){for(t=0;t<r;t++)if(S.contains(i[t],this))return!0}));for(n=this.pushStack([]),t=0;t<r;t++)S.find(e,i[t],n);return 1<r?S.uniqueSort(n):n},filter:function(e){return this.pushStack(j(this,e||[],!1))},not:function(e){return this.pushStack(j(this,e||[],!0))},is:function(e){return!!j(this,"string"==typeof e&&k.test(e)?S(e):e||[],!1).length}});var D,q=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/;(S.fn.init=function(e,t,n){var r,i;if(!e)return this;if(n=n||D,"string"==typeof e){if(!(r="<"===e[0]&&">"===e[e.length-1]&&3<=e.length?[null,e,null]:q.exec(e))||!r[1]&&t)return!t||t.jquery?(t||n).find(e):this.constructor(t).find(e);if(r[1]){if(t=t instanceof S?t[0]:t,S.merge(this,S.parseHTML(r[1],t&&t.nodeType?t.ownerDocument||t:E,!0)),N.test(r[1])&&S.isPlainObject(t))for(r in t)m(this[r])?this[r](t[r]):this.attr(r,t[r]);return this}return(i=E.getElementById(r[2]))&&(this[0]=i,this.length=1),this}return e.nodeType?(this[0]=e,this.length=1,this):m(e)?void 0!==n.ready?n.ready(e):e(S):S.makeArray(e,this)}).prototype=S.fn,D=S(E);var L=/^(?:parents|prev(?:Until|All))/,H={children:!0,contents:!0,next:!0,prev:!0};function O(e,t){while((e=e[t])&&1!==e.nodeType);return e}S.fn.extend({has:function(e){var t=S(e,this),n=t.length;return this.filter(function(){for(var e=0;e<n;e++)if(S.contains(this,t[e]))return!0})},closest:function(e,t){var n,r=0,i=this.length,o=[],a="string"!=typeof e&&S(e);if(!k.test(e))for(;r<i;r++)for(n=this[r];n&&n!==t;n=n.parentNode)if(n.nodeType<11&&(a?-1<a.index(n):1===n.nodeType&&S.find.matchesSelector(n,e))){o.push(n);break}return this.pushStack(1<o.length?S.uniqueSort(o):o)},index:function(e){return e?"string"==typeof e?i.call(S(e),this[0]):i.call(this,e.jquery?e[0]:e):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(e,t){return this.pushStack(S.uniqueSort(S.merge(this.get(),S(e,t))))},addBack:function(e){return this.add(null==e?this.prevObject:this.prevObject.filter(e))}}),S.each({parent:function(e){var t=e.parentNode;return t&&11!==t.nodeType?t:null},parents:function(e){return h(e,"parentNode")},parentsUntil:function(e,t,n){return h(e,"parentNode",n)},next:function(e){return O(e,"nextSibling")},prev:function(e){return O(e,"previousSibling")},nextAll:function(e){return h(e,"nextSibling")},prevAll:function(e){return h(e,"previousSibling")},nextUntil:function(e,t,n){return h(e,"nextSibling",n)},prevUntil:function(e,t,n){return h(e,"previousSibling",n)},siblings:function(e){return T((e.parentNode||{}).firstChild,e)},children:function(e){return T(e.firstChild)},contents:function(e){return null!=e.contentDocument&&r(e.contentDocument)?e.contentDocument:(A(e,"template")&&(e=e.content||e),S.merge([],e.childNodes))}},function(r,i){S.fn[r]=function(e,t){var n=S.map(this,i,e);return"Until"!==r.slice(-5)&&(t=e),t&&"string"==typeof t&&(n=S.filter(t,n)),1<this.length&&(H[r]||S.uniqueSort(n),L.test(r)&&n.reverse()),this.pushStack(n)}});var P=/[^\x20\t\r\n\f]+/g;function R(e){return e}function M(e){throw e}function I(e,t,n,r){var i;try{e&&m(i=e.promise)?i.call(e).done(t).fail(n):e&&m(i=e.then)?i.call(e,t,n):t.apply(void 0,[e].slice(r))}catch(e){n.apply(void 0,[e])}}S.Callbacks=function(r){var e,n;r="string"==typeof r?(e=r,n={},S.each(e.match(P)||[],function(e,t){n[t]=!0}),n):S.extend({},r);var i,t,o,a,s=[],u=[],l=-1,c=function(){for(a=a||r.once,o=i=!0;u.length;l=-1){t=u.shift();while(++l<s.length)!1===s[l].apply(t[0],t[1])&&r.stopOnFalse&&(l=s.length,t=!1)}r.memory||(t=!1),i=!1,a&&(s=t?[]:"")},f={add:function(){return s&&(t&&!i&&(l=s.length-1,u.push(t)),function n(e){S.each(e,function(e,t){m(t)?r.unique&&f.has(t)||s.push(t):t&&t.length&&"string"!==w(t)&&n(t)})}(arguments),t&&!i&&c()),this},remove:function(){return S.each(arguments,function(e,t){var n;while(-1<(n=S.inArray(t,s,n)))s.splice(n,1),n<=l&&l--}),this},has:function(e){return e?-1<S.inArray(e,s):0<s.length},empty:function(){return s&&(s=[]),this},disable:function(){return a=u=[],s=t="",this},disabled:function(){return!s},lock:function(){return a=u=[],t||i||(s=t=""),this},locked:function(){return!!a},fireWith:function(e,t){return a||(t=[e,(t=t||[]).slice?t.slice():t],u.push(t),i||c()),this},fire:function(){return f.fireWith(this,arguments),this},fired:function(){return!!o}};return f},S.extend({Deferred:function(e){var o=[["notify","progress",S.Callbacks("memory"),S.Callbacks("memory"),2],["resolve","done",S.Callbacks("once memory"),S.Callbacks("once memory"),0,"resolved"],["reject","fail",S.Callbacks("once memory"),S.Callbacks("once memory"),1,"rejected"]],i="pending",a={state:function(){return i},always:function(){return s.done(arguments).fail(arguments),this},"catch":function(e){return a.then(null,e)},pipe:function(){var i=arguments;return S.Deferred(function(r){S.each(o,function(e,t){var n=m(i[t[4]])&&i[t[4]];s[t[1]](function(){var e=n&&n.apply(this,arguments);e&&m(e.promise)?e.promise().progress(r.notify).done(r.resolve).fail(r.reject):r[t[0]+"With"](this,n?[e]:arguments)})}),i=null}).promise()},then:function(t,n,r){var u=0;function l(i,o,a,s){return function(){var n=this,r=arguments,e=function(){var e,t;if(!(i<u)){if((e=a.apply(n,r))===o.promise())throw new TypeError("Thenable self-resolution");t=e&&("object"==typeof e||"function"==typeof e)&&e.then,m(t)?s?t.call(e,l(u,o,R,s),l(u,o,M,s)):(u++,t.call(e,l(u,o,R,s),l(u,o,M,s),l(u,o,R,o.notifyWith))):(a!==R&&(n=void 0,r=[e]),(s||o.resolveWith)(n,r))}},t=s?e:function(){try{e()}catch(e){S.Deferred.exceptionHook&&S.Deferred.exceptionHook(e,t.stackTrace),u<=i+1&&(a!==M&&(n=void 0,r=[e]),o.rejectWith(n,r))}};i?t():(S.Deferred.getStackHook&&(t.stackTrace=S.Deferred.getStackHook()),C.setTimeout(t))}}return S.Deferred(function(e){o[0][3].add(l(0,e,m(r)?r:R,e.notifyWith)),o[1][3].add(l(0,e,m(t)?t:R)),o[2][3].add(l(0,e,m(n)?n:M))}).promise()},promise:function(e){return null!=e?S.extend(e,a):a}},s={};return S.each(o,function(e,t){var n=t[2],r=t[5];a[t[1]]=n.add,r&&n.add(function(){i=r},o[3-e][2].disable,o[3-e][3].disable,o[0][2].lock,o[0][3].lock),n.add(t[3].fire),s[t[0]]=function(){return s[t[0]+"With"](this===s?void 0:this,arguments),this},s[t[0]+"With"]=n.fireWith}),a.promise(s),e&&e.call(s,s),s},when:function(e){var n=arguments.length,t=n,r=Array(t),i=s.call(arguments),o=S.Deferred(),a=function(t){return function(e){r[t]=this,i[t]=1<arguments.length?s.call(arguments):e,--n||o.resolveWith(r,i)}};if(n<=1&&(I(e,o.done(a(t)).resolve,o.reject,!n),"pending"===o.state()||m(i[t]&&i[t].then)))return o.then();while(t--)I(i[t],a(t),o.reject);return o.promise()}});var W=/^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;S.Deferred.exceptionHook=function(e,t){C.console&&C.console.warn&&e&&W.test(e.name)&&C.console.warn("jQuery.Deferred exception: "+e.message,e.stack,t)},S.readyException=function(e){C.setTimeout(function(){throw e})};var F=S.Deferred();function B(){E.removeEventListener("DOMContentLoaded",B),C.removeEventListener("load",B),S.ready()}S.fn.ready=function(e){return F.then(e)["catch"](function(e){S.readyException(e)}),this},S.extend({isReady:!1,readyWait:1,ready:function(e){(!0===e?--S.readyWait:S.isReady)||(S.isReady=!0)!==e&&0<--S.readyWait||F.resolveWith(E,[S])}}),S.ready.then=F.then,"complete"===E.readyState||"loading"!==E.readyState&&!E.documentElement.doScroll?C.setTimeout(S.ready):(E.addEventListener("DOMContentLoaded",B),C.addEventListener("load",B));var $=function(e,t,n,r,i,o,a){var s=0,u=e.length,l=null==n;if("object"===w(n))for(s in i=!0,n)$(e,t,s,n[s],!0,o,a);else if(void 0!==r&&(i=!0,m(r)||(a=!0),l&&(a?(t.call(e,r),t=null):(l=t,t=function(e,t,n){return l.call(S(e),n)})),t))for(;s<u;s++)t(e[s],n,a?r:r.call(e[s],s,t(e[s],n)));return i?e:l?t.call(e):u?t(e[0],n):o},_=/^-ms-/,z=/-([a-z])/g;function U(e,t){return t.toUpperCase()}function X(e){return e.replace(_,"ms-").replace(z,U)}var V=function(e){return 1===e.nodeType||9===e.nodeType||!+e.nodeType};function G(){this.expando=S.expando+G.uid++}G.uid=1,G.prototype={cache:function(e){var t=e[this.expando];return t||(t={},V(e)&&(e.nodeType?e[this.expando]=t:Object.defineProperty(e,this.expando,{value:t,configurable:!0}))),t},set:function(e,t,n){var r,i=this.cache(e);if("string"==typeof t)i[X(t)]=n;else for(r in t)i[X(r)]=t[r];return i},get:function(e,t){return void 0===t?this.cache(e):e[this.expando]&&e[this.expando][X(t)]},access:function(e,t,n){return void 0===t||t&&"string"==typeof t&&void 0===n?this.get(e,t):(this.set(e,t,n),void 0!==n?n:t)},remove:function(e,t){var n,r=e[this.expando];if(void 0!==r){if(void 0!==t){n=(t=Array.isArray(t)?t.map(X):(t=X(t))in r?[t]:t.match(P)||[]).length;while(n--)delete r[t[n]]}(void 0===t||S.isEmptyObject(r))&&(e.nodeType?e[this.expando]=void 0:delete e[this.expando])}},hasData:function(e){var t=e[this.expando];return void 0!==t&&!S.isEmptyObject(t)}};var Y=new G,Q=new G,J=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,K=/[A-Z]/g;function Z(e,t,n){var r,i;if(void 0===n&&1===e.nodeType)if(r="data-"+t.replace(K,"-$&").toLowerCase(),"string"==typeof(n=e.getAttribute(r))){try{n="true"===(i=n)||"false"!==i&&("null"===i?null:i===+i+""?+i:J.test(i)?JSON.parse(i):i)}catch(e){}Q.set(e,t,n)}else n=void 0;return n}S.extend({hasData:function(e){return Q.hasData(e)||Y.hasData(e)},data:function(e,t,n){return Q.access(e,t,n)},removeData:function(e,t){Q.remove(e,t)},_data:function(e,t,n){return Y.access(e,t,n)},_removeData:function(e,t){Y.remove(e,t)}}),S.fn.extend({data:function(n,e){var t,r,i,o=this[0],a=o&&o.attributes;if(void 0===n){if(this.length&&(i=Q.get(o),1===o.nodeType&&!Y.get(o,"hasDataAttrs"))){t=a.length;while(t--)a[t]&&0===(r=a[t].name).indexOf("data-")&&(r=X(r.slice(5)),Z(o,r,i[r]));Y.set(o,"hasDataAttrs",!0)}return i}return"object"==typeof n?this.each(function(){Q.set(this,n)}):$(this,function(e){var t;if(o&&void 0===e)return void 0!==(t=Q.get(o,n))?t:void 0!==(t=Z(o,n))?t:void 0;this.each(function(){Q.set(this,n,e)})},null,e,1<arguments.length,null,!0)},removeData:function(e){return this.each(function(){Q.remove(this,e)})}}),S.extend({queue:function(e,t,n){var r;if(e)return t=(t||"fx")+"queue",r=Y.get(e,t),n&&(!r||Array.isArray(n)?r=Y.access(e,t,S.makeArray(n)):r.push(n)),r||[]},dequeue:function(e,t){t=t||"fx";var n=S.queue(e,t),r=n.length,i=n.shift(),o=S._queueHooks(e,t);"inprogress"===i&&(i=n.shift(),r--),i&&("fx"===t&&n.unshift("inprogress"),delete o.stop,i.call(e,function(){S.dequeue(e,t)},o)),!r&&o&&o.empty.fire()},_queueHooks:function(e,t){var n=t+"queueHooks";return Y.get(e,n)||Y.access(e,n,{empty:S.Callbacks("once memory").add(function(){Y.remove(e,[t+"queue",n])})})}}),S.fn.extend({queue:function(t,n){var e=2;return"string"!=typeof t&&(n=t,t="fx",e--),arguments.length<e?S.queue(this[0],t):void 0===n?this:this.each(function(){var e=S.queue(this,t,n);S._queueHooks(this,t),"fx"===t&&"inprogress"!==e[0]&&S.dequeue(this,t)})},dequeue:function(e){return this.each(function(){S.dequeue(this,e)})},clearQueue:function(e){return this.queue(e||"fx",[])},promise:function(e,t){var n,r=1,i=S.Deferred(),o=this,a=this.length,s=function(){--r||i.resolveWith(o,[o])};"string"!=typeof e&&(t=e,e=void 0),e=e||"fx";while(a--)(n=Y.get(o[a],e+"queueHooks"))&&n.empty&&(r++,n.empty.add(s));return s(),i.promise(t)}});var ee=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,te=new RegExp("^(?:([+-])=|)("+ee+")([a-z%]*)$","i"),ne=["Top","Right","Bottom","Left"],re=E.documentElement,ie=function(e){return S.contains(e.ownerDocument,e)},oe={composed:!0};re.getRootNode&&(ie=function(e){return S.contains(e.ownerDocument,e)||e.getRootNode(oe)===e.ownerDocument});var ae=function(e,t){return"none"===(e=t||e).style.display||""===e.style.display&&ie(e)&&"none"===S.css(e,"display")};function se(e,t,n,r){var i,o,a=20,s=r?function(){return r.cur()}:function(){return S.css(e,t,"")},u=s(),l=n&&n[3]||(S.cssNumber[t]?"":"px"),c=e.nodeType&&(S.cssNumber[t]||"px"!==l&&+u)&&te.exec(S.css(e,t));if(c&&c[3]!==l){u/=2,l=l||c[3],c=+u||1;while(a--)S.style(e,t,c+l),(1-o)*(1-(o=s()/u||.5))<=0&&(a=0),c/=o;c*=2,S.style(e,t,c+l),n=n||[]}return n&&(c=+c||+u||0,i=n[1]?c+(n[1]+1)*n[2]:+n[2],r&&(r.unit=l,r.start=c,r.end=i)),i}var ue={};function le(e,t){for(var n,r,i,o,a,s,u,l=[],c=0,f=e.length;c<f;c++)(r=e[c]).style&&(n=r.style.display,t?("none"===n&&(l[c]=Y.get(r,"display")||null,l[c]||(r.style.display="")),""===r.style.display&&ae(r)&&(l[c]=(u=a=o=void 0,a=(i=r).ownerDocument,s=i.nodeName,(u=ue[s])||(o=a.body.appendChild(a.createElement(s)),u=S.css(o,"display"),o.parentNode.removeChild(o),"none"===u&&(u="block"),ue[s]=u)))):"none"!==n&&(l[c]="none",Y.set(r,"display",n)));for(c=0;c<f;c++)null!=l[c]&&(e[c].style.display=l[c]);return e}S.fn.extend({show:function(){return le(this,!0)},hide:function(){return le(this)},toggle:function(e){return"boolean"==typeof e?e?this.show():this.hide():this.each(function(){ae(this)?S(this).show():S(this).hide()})}});var ce,fe,pe=/^(?:checkbox|radio)$/i,de=/<([a-z][^\/\0>\x20\t\r\n\f]*)/i,he=/^$|^module$|\/(?:java|ecma)script/i;ce=E.createDocumentFragment().appendChild(E.createElement("div")),(fe=E.createElement("input")).setAttribute("type","radio"),fe.setAttribute("checked","checked"),fe.setAttribute("name","t"),ce.appendChild(fe),y.checkClone=ce.cloneNode(!0).cloneNode(!0).lastChild.checked,ce.innerHTML="<textarea>x</textarea>",y.noCloneChecked=!!ce.cloneNode(!0).lastChild.defaultValue,ce.innerHTML="<option></option>",y.option=!!ce.lastChild;var ge={thead:[1,"<table>","</table>"],col:[2,"<table><colgroup>","</colgroup></table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]};function ve(e,t){var n;return n="undefined"!=typeof e.getElementsByTagName?e.getElementsByTagName(t||"*"):"undefined"!=typeof e.querySelectorAll?e.querySelectorAll(t||"*"):[],void 0===t||t&&A(e,t)?S.merge([e],n):n}function ye(e,t){for(var n=0,r=e.length;n<r;n++)Y.set(e[n],"globalEval",!t||Y.get(t[n],"globalEval"))}ge.tbody=ge.tfoot=ge.colgroup=ge.caption=ge.thead,ge.th=ge.td,y.option||(ge.optgroup=ge.option=[1,"<select multiple='multiple'>","</select>"]);var me=/<|&#?\w+;/;function xe(e,t,n,r,i){for(var o,a,s,u,l,c,f=t.createDocumentFragment(),p=[],d=0,h=e.length;d<h;d++)if((o=e[d])||0===o)if("object"===w(o))S.merge(p,o.nodeType?[o]:o);else if(me.test(o)){a=a||f.appendChild(t.createElement("div")),s=(de.exec(o)||["",""])[1].toLowerCase(),u=ge[s]||ge._default,a.innerHTML=u[1]+S.htmlPrefilter(o)+u[2],c=u[0];while(c--)a=a.lastChild;S.merge(p,a.childNodes),(a=f.firstChild).textContent=""}else p.push(t.createTextNode(o));f.textContent="",d=0;while(o=p[d++])if(r&&-1<S.inArray(o,r))i&&i.push(o);else if(l=ie(o),a=ve(f.appendChild(o),"script"),l&&ye(a),n){c=0;while(o=a[c++])he.test(o.type||"")&&n.push(o)}return f}var be=/^([^.]*)(?:\.(.+)|)/;function we(){return!0}function Te(){return!1}function Ce(e,t){return e===function(){try{return E.activeElement}catch(e){}}()==("focus"===t)}function Ee(e,t,n,r,i,o){var a,s;if("object"==typeof t){for(s in"string"!=typeof n&&(r=r||n,n=void 0),t)Ee(e,s,n,r,t[s],o);return e}if(null==r&&null==i?(i=n,r=n=void 0):null==i&&("string"==typeof n?(i=r,r=void 0):(i=r,r=n,n=void 0)),!1===i)i=Te;else if(!i)return e;return 1===o&&(a=i,(i=function(e){return S().off(e),a.apply(this,arguments)}).guid=a.guid||(a.guid=S.guid++)),e.each(function(){S.event.add(this,t,i,r,n)})}function Se(e,i,o){o?(Y.set(e,i,!1),S.event.add(e,i,{namespace:!1,handler:function(e){var t,n,r=Y.get(this,i);if(1&e.isTrigger&&this[i]){if(r.length)(S.event.special[i]||{}).delegateType&&e.stopPropagation();else if(r=s.call(arguments),Y.set(this,i,r),t=o(this,i),this[i](),r!==(n=Y.get(this,i))||t?Y.set(this,i,!1):n={},r!==n)return e.stopImmediatePropagation(),e.preventDefault(),n&&n.value}else r.length&&(Y.set(this,i,{value:S.event.trigger(S.extend(r[0],S.Event.prototype),r.slice(1),this)}),e.stopImmediatePropagation())}})):void 0===Y.get(e,i)&&S.event.add(e,i,we)}S.event={global:{},add:function(t,e,n,r,i){var o,a,s,u,l,c,f,p,d,h,g,v=Y.get(t);if(V(t)){n.handler&&(n=(o=n).handler,i=o.selector),i&&S.find.matchesSelector(re,i),n.guid||(n.guid=S.guid++),(u=v.events)||(u=v.events=Object.create(null)),(a=v.handle)||(a=v.handle=function(e){return"undefined"!=typeof S&&S.event.triggered!==e.type?S.event.dispatch.apply(t,arguments):void 0}),l=(e=(e||"").match(P)||[""]).length;while(l--)d=g=(s=be.exec(e[l])||[])[1],h=(s[2]||"").split(".").sort(),d&&(f=S.event.special[d]||{},d=(i?f.delegateType:f.bindType)||d,f=S.event.special[d]||{},c=S.extend({type:d,origType:g,data:r,handler:n,guid:n.guid,selector:i,needsContext:i&&S.expr.match.needsContext.test(i),namespace:h.join(".")},o),(p=u[d])||((p=u[d]=[]).delegateCount=0,f.setup&&!1!==f.setup.call(t,r,h,a)||t.addEventListener&&t.addEventListener(d,a)),f.add&&(f.add.call(t,c),c.handler.guid||(c.handler.guid=n.guid)),i?p.splice(p.delegateCount++,0,c):p.push(c),S.event.global[d]=!0)}},remove:function(e,t,n,r,i){var o,a,s,u,l,c,f,p,d,h,g,v=Y.hasData(e)&&Y.get(e);if(v&&(u=v.events)){l=(t=(t||"").match(P)||[""]).length;while(l--)if(d=g=(s=be.exec(t[l])||[])[1],h=(s[2]||"").split(".").sort(),d){f=S.event.special[d]||{},p=u[d=(r?f.delegateType:f.bindType)||d]||[],s=s[2]&&new RegExp("(^|\\.)"+h.join("\\.(?:.*\\.|)")+"(\\.|$)"),a=o=p.length;while(o--)c=p[o],!i&&g!==c.origType||n&&n.guid!==c.guid||s&&!s.test(c.namespace)||r&&r!==c.selector&&("**"!==r||!c.selector)||(p.splice(o,1),c.selector&&p.delegateCount--,f.remove&&f.remove.call(e,c));a&&!p.length&&(f.teardown&&!1!==f.teardown.call(e,h,v.handle)||S.removeEvent(e,d,v.handle),delete u[d])}else for(d in u)S.event.remove(e,d+t[l],n,r,!0);S.isEmptyObject(u)&&Y.remove(e,"handle events")}},dispatch:function(e){var t,n,r,i,o,a,s=new Array(arguments.length),u=S.event.fix(e),l=(Y.get(this,"events")||Object.create(null))[u.type]||[],c=S.event.special[u.type]||{};for(s[0]=u,t=1;t<arguments.length;t++)s[t]=arguments[t];if(u.delegateTarget=this,!c.preDispatch||!1!==c.preDispatch.call(this,u)){a=S.event.handlers.call(this,u,l),t=0;while((i=a[t++])&&!u.isPropagationStopped()){u.currentTarget=i.elem,n=0;while((o=i.handlers[n++])&&!u.isImmediatePropagationStopped())u.rnamespace&&!1!==o.namespace&&!u.rnamespace.test(o.namespace)||(u.handleObj=o,u.data=o.data,void 0!==(r=((S.event.special[o.origType]||{}).handle||o.handler).apply(i.elem,s))&&!1===(u.result=r)&&(u.preventDefault(),u.stopPropagation()))}return c.postDispatch&&c.postDispatch.call(this,u),u.result}},handlers:function(e,t){var n,r,i,o,a,s=[],u=t.delegateCount,l=e.target;if(u&&l.nodeType&&!("click"===e.type&&1<=e.button))for(;l!==this;l=l.parentNode||this)if(1===l.nodeType&&("click"!==e.type||!0!==l.disabled)){for(o=[],a={},n=0;n<u;n++)void 0===a[i=(r=t[n]).selector+" "]&&(a[i]=r.needsContext?-1<S(i,this).index(l):S.find(i,this,null,[l]).length),a[i]&&o.push(r);o.length&&s.push({elem:l,handlers:o})}return l=this,u<t.length&&s.push({elem:l,handlers:t.slice(u)}),s},addProp:function(t,e){Object.defineProperty(S.Event.prototype,t,{enumerable:!0,configurable:!0,get:m(e)?function(){if(this.originalEvent)return e(this.originalEvent)}:function(){if(this.originalEvent)return this.originalEvent[t]},set:function(e){Object.defineProperty(this,t,{enumerable:!0,configurable:!0,writable:!0,value:e})}})},fix:function(e){return e[S.expando]?e:new S.Event(e)},special:{load:{noBubble:!0},click:{setup:function(e){var t=this||e;return pe.test(t.type)&&t.click&&A(t,"input")&&Se(t,"click",we),!1},trigger:function(e){var t=this||e;return pe.test(t.type)&&t.click&&A(t,"input")&&Se(t,"click"),!0},_default:function(e){var t=e.target;return pe.test(t.type)&&t.click&&A(t,"input")&&Y.get(t,"click")||A(t,"a")}},beforeunload:{postDispatch:function(e){void 0!==e.result&&e.originalEvent&&(e.originalEvent.returnValue=e.result)}}}},S.removeEvent=function(e,t,n){e.removeEventListener&&e.removeEventListener(t,n)},S.Event=function(e,t){if(!(this instanceof S.Event))return new S.Event(e,t);e&&e.type?(this.originalEvent=e,this.type=e.type,this.isDefaultPrevented=e.defaultPrevented||void 0===e.defaultPrevented&&!1===e.returnValue?we:Te,this.target=e.target&&3===e.target.nodeType?e.target.parentNode:e.target,this.currentTarget=e.currentTarget,this.relatedTarget=e.relatedTarget):this.type=e,t&&S.extend(this,t),this.timeStamp=e&&e.timeStamp||Date.now(),this[S.expando]=!0},S.Event.prototype={constructor:S.Event,isDefaultPrevented:Te,isPropagationStopped:Te,isImmediatePropagationStopped:Te,isSimulated:!1,preventDefault:function(){var e=this.originalEvent;this.isDefaultPrevented=we,e&&!this.isSimulated&&e.preventDefault()},stopPropagation:function(){var e=this.originalEvent;this.isPropagationStopped=we,e&&!this.isSimulated&&e.stopPropagation()},stopImmediatePropagation:function(){var e=this.originalEvent;this.isImmediatePropagationStopped=we,e&&!this.isSimulated&&e.stopImmediatePropagation(),this.stopPropagation()}},S.each({altKey:!0,bubbles:!0,cancelable:!0,changedTouches:!0,ctrlKey:!0,detail:!0,eventPhase:!0,metaKey:!0,pageX:!0,pageY:!0,shiftKey:!0,view:!0,"char":!0,code:!0,charCode:!0,key:!0,keyCode:!0,button:!0,buttons:!0,clientX:!0,clientY:!0,offsetX:!0,offsetY:!0,pointerId:!0,pointerType:!0,screenX:!0,screenY:!0,targetTouches:!0,toElement:!0,touches:!0,which:!0},S.event.addProp),S.each({focus:"focusin",blur:"focusout"},function(e,t){S.event.special[e]={setup:function(){return Se(this,e,Ce),!1},trigger:function(){return Se(this,e),!0},_default:function(){return!0},delegateType:t}}),S.each({mouseenter:"mouseover",mouseleave:"mouseout",pointerenter:"pointerover",pointerleave:"pointerout"},function(e,i){S.event.special[e]={delegateType:i,bindType:i,handle:function(e){var t,n=e.relatedTarget,r=e.handleObj;return n&&(n===this||S.contains(this,n))||(e.type=r.origType,t=r.handler.apply(this,arguments),e.type=i),t}}}),S.fn.extend({on:function(e,t,n,r){return Ee(this,e,t,n,r)},one:function(e,t,n,r){return Ee(this,e,t,n,r,1)},off:function(e,t,n){var r,i;if(e&&e.preventDefault&&e.handleObj)return r=e.handleObj,S(e.delegateTarget).off(r.namespace?r.origType+"."+r.namespace:r.origType,r.selector,r.handler),this;if("object"==typeof e){for(i in e)this.off(i,t,e[i]);return this}return!1!==t&&"function"!=typeof t||(n=t,t=void 0),!1===n&&(n=Te),this.each(function(){S.event.remove(this,e,n,t)})}});var ke=/<script|<style|<link/i,Ae=/checked\s*(?:[^=]|=\s*.checked.)/i,Ne=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;function je(e,t){return A(e,"table")&&A(11!==t.nodeType?t:t.firstChild,"tr")&&S(e).children("tbody")[0]||e}function De(e){return e.type=(null!==e.getAttribute("type"))+"/"+e.type,e}function qe(e){return"true/"===(e.type||"").slice(0,5)?e.type=e.type.slice(5):e.removeAttribute("type"),e}function Le(e,t){var n,r,i,o,a,s;if(1===t.nodeType){if(Y.hasData(e)&&(s=Y.get(e).events))for(i in Y.remove(t,"handle events"),s)for(n=0,r=s[i].length;n<r;n++)S.event.add(t,i,s[i][n]);Q.hasData(e)&&(o=Q.access(e),a=S.extend({},o),Q.set(t,a))}}function He(n,r,i,o){r=g(r);var e,t,a,s,u,l,c=0,f=n.length,p=f-1,d=r[0],h=m(d);if(h||1<f&&"string"==typeof d&&!y.checkClone&&Ae.test(d))return n.each(function(e){var t=n.eq(e);h&&(r[0]=d.call(this,e,t.html())),He(t,r,i,o)});if(f&&(t=(e=xe(r,n[0].ownerDocument,!1,n,o)).firstChild,1===e.childNodes.length&&(e=t),t||o)){for(s=(a=S.map(ve(e,"script"),De)).length;c<f;c++)u=e,c!==p&&(u=S.clone(u,!0,!0),s&&S.merge(a,ve(u,"script"))),i.call(n[c],u,c);if(s)for(l=a[a.length-1].ownerDocument,S.map(a,qe),c=0;c<s;c++)u=a[c],he.test(u.type||"")&&!Y.access(u,"globalEval")&&S.contains(l,u)&&(u.src&&"module"!==(u.type||"").toLowerCase()?S._evalUrl&&!u.noModule&&S._evalUrl(u.src,{nonce:u.nonce||u.getAttribute("nonce")},l):b(u.textContent.replace(Ne,""),u,l))}return n}function Oe(e,t,n){for(var r,i=t?S.filter(t,e):e,o=0;null!=(r=i[o]);o++)n||1!==r.nodeType||S.cleanData(ve(r)),r.parentNode&&(n&&ie(r)&&ye(ve(r,"script")),r.parentNode.removeChild(r));return e}S.extend({htmlPrefilter:function(e){return e},clone:function(e,t,n){var r,i,o,a,s,u,l,c=e.cloneNode(!0),f=ie(e);if(!(y.noCloneChecked||1!==e.nodeType&&11!==e.nodeType||S.isXMLDoc(e)))for(a=ve(c),r=0,i=(o=ve(e)).length;r<i;r++)s=o[r],u=a[r],void 0,"input"===(l=u.nodeName.toLowerCase())&&pe.test(s.type)?u.checked=s.checked:"input"!==l&&"textarea"!==l||(u.defaultValue=s.defaultValue);if(t)if(n)for(o=o||ve(e),a=a||ve(c),r=0,i=o.length;r<i;r++)Le(o[r],a[r]);else Le(e,c);return 0<(a=ve(c,"script")).length&&ye(a,!f&&ve(e,"script")),c},cleanData:function(e){for(var t,n,r,i=S.event.special,o=0;void 0!==(n=e[o]);o++)if(V(n)){if(t=n[Y.expando]){if(t.events)for(r in t.events)i[r]?S.event.remove(n,r):S.removeEvent(n,r,t.handle);n[Y.expando]=void 0}n[Q.expando]&&(n[Q.expando]=void 0)}}}),S.fn.extend({detach:function(e){return Oe(this,e,!0)},remove:function(e){return Oe(this,e)},text:function(e){return $(this,function(e){return void 0===e?S.text(this):this.empty().each(function(){1!==this.nodeType&&11!==this.nodeType&&9!==this.nodeType||(this.textContent=e)})},null,e,arguments.length)},append:function(){return He(this,arguments,function(e){1!==this.nodeType&&11!==this.nodeType&&9!==this.nodeType||je(this,e).appendChild(e)})},prepend:function(){return He(this,arguments,function(e){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var t=je(this,e);t.insertBefore(e,t.firstChild)}})},before:function(){return He(this,arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this)})},after:function(){return He(this,arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this.nextSibling)})},empty:function(){for(var e,t=0;null!=(e=this[t]);t++)1===e.nodeType&&(S.cleanData(ve(e,!1)),e.textContent="");return this},clone:function(e,t){return e=null!=e&&e,t=null==t?e:t,this.map(function(){return S.clone(this,e,t)})},html:function(e){return $(this,function(e){var t=this[0]||{},n=0,r=this.length;if(void 0===e&&1===t.nodeType)return t.innerHTML;if("string"==typeof e&&!ke.test(e)&&!ge[(de.exec(e)||["",""])[1].toLowerCase()]){e=S.htmlPrefilter(e);try{for(;n<r;n++)1===(t=this[n]||{}).nodeType&&(S.cleanData(ve(t,!1)),t.innerHTML=e);t=0}catch(e){}}t&&this.empty().append(e)},null,e,arguments.length)},replaceWith:function(){var n=[];return He(this,arguments,function(e){var t=this.parentNode;S.inArray(this,n)<0&&(S.cleanData(ve(this)),t&&t.replaceChild(e,this))},n)}}),S.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(e,a){S.fn[e]=function(e){for(var t,n=[],r=S(e),i=r.length-1,o=0;o<=i;o++)t=o===i?this:this.clone(!0),S(r[o])[a](t),u.apply(n,t.get());return this.pushStack(n)}});var Pe=new RegExp("^("+ee+")(?!px)[a-z%]+$","i"),Re=function(e){var t=e.ownerDocument.defaultView;return t&&t.opener||(t=C),t.getComputedStyle(e)},Me=function(e,t,n){var r,i,o={};for(i in t)o[i]=e.style[i],e.style[i]=t[i];for(i in r=n.call(e),t)e.style[i]=o[i];return r},Ie=new RegExp(ne.join("|"),"i");function We(e,t,n){var r,i,o,a,s=e.style;return(n=n||Re(e))&&(""!==(a=n.getPropertyValue(t)||n[t])||ie(e)||(a=S.style(e,t)),!y.pixelBoxStyles()&&Pe.test(a)&&Ie.test(t)&&(r=s.width,i=s.minWidth,o=s.maxWidth,s.minWidth=s.maxWidth=s.width=a,a=n.width,s.width=r,s.minWidth=i,s.maxWidth=o)),void 0!==a?a+"":a}function Fe(e,t){return{get:function(){if(!e())return(this.get=t).apply(this,arguments);delete this.get}}}!function(){function e(){if(l){u.style.cssText="position:absolute;left:-11111px;width:60px;margin-top:1px;padding:0;border:0",l.style.cssText="position:relative;display:block;box-sizing:border-box;overflow:scroll;margin:auto;border:1px;padding:1px;width:60%;top:1%",re.appendChild(u).appendChild(l);var e=C.getComputedStyle(l);n="1%"!==e.top,s=12===t(e.marginLeft),l.style.right="60%",o=36===t(e.right),r=36===t(e.width),l.style.position="absolute",i=12===t(l.offsetWidth/3),re.removeChild(u),l=null}}function t(e){return Math.round(parseFloat(e))}var n,r,i,o,a,s,u=E.createElement("div"),l=E.createElement("div");l.style&&(l.style.backgroundClip="content-box",l.cloneNode(!0).style.backgroundClip="",y.clearCloneStyle="content-box"===l.style.backgroundClip,S.extend(y,{boxSizingReliable:function(){return e(),r},pixelBoxStyles:function(){return e(),o},pixelPosition:function(){return e(),n},reliableMarginLeft:function(){return e(),s},scrollboxSize:function(){return e(),i},reliableTrDimensions:function(){var e,t,n,r;return null==a&&(e=E.createElement("table"),t=E.createElement("tr"),n=E.createElement("div"),e.style.cssText="position:absolute;left:-11111px;border-collapse:separate",t.style.cssText="border:1px solid",t.style.height="1px",n.style.height="9px",n.style.display="block",re.appendChild(e).appendChild(t).appendChild(n),r=C.getComputedStyle(t),a=parseInt(r.height,10)+parseInt(r.borderTopWidth,10)+parseInt(r.borderBottomWidth,10)===t.offsetHeight,re.removeChild(e)),a}}))}();var Be=["Webkit","Moz","ms"],$e=E.createElement("div").style,_e={};function ze(e){var t=S.cssProps[e]||_e[e];return t||(e in $e?e:_e[e]=function(e){var t=e[0].toUpperCase()+e.slice(1),n=Be.length;while(n--)if((e=Be[n]+t)in $e)return e}(e)||e)}var Ue=/^(none|table(?!-c[ea]).+)/,Xe=/^--/,Ve={position:"absolute",visibility:"hidden",display:"block"},Ge={letterSpacing:"0",fontWeight:"400"};function Ye(e,t,n){var r=te.exec(t);return r?Math.max(0,r[2]-(n||0))+(r[3]||"px"):t}function Qe(e,t,n,r,i,o){var a="width"===t?1:0,s=0,u=0;if(n===(r?"border":"content"))return 0;for(;a<4;a+=2)"margin"===n&&(u+=S.css(e,n+ne[a],!0,i)),r?("content"===n&&(u-=S.css(e,"padding"+ne[a],!0,i)),"margin"!==n&&(u-=S.css(e,"border"+ne[a]+"Width",!0,i))):(u+=S.css(e,"padding"+ne[a],!0,i),"padding"!==n?u+=S.css(e,"border"+ne[a]+"Width",!0,i):s+=S.css(e,"border"+ne[a]+"Width",!0,i));return!r&&0<=o&&(u+=Math.max(0,Math.ceil(e["offset"+t[0].toUpperCase()+t.slice(1)]-o-u-s-.5))||0),u}function Je(e,t,n){var r=Re(e),i=(!y.boxSizingReliable()||n)&&"border-box"===S.css(e,"boxSizing",!1,r),o=i,a=We(e,t,r),s="offset"+t[0].toUpperCase()+t.slice(1);if(Pe.test(a)){if(!n)return a;a="auto"}return(!y.boxSizingReliable()&&i||!y.reliableTrDimensions()&&A(e,"tr")||"auto"===a||!parseFloat(a)&&"inline"===S.css(e,"display",!1,r))&&e.getClientRects().length&&(i="border-box"===S.css(e,"boxSizing",!1,r),(o=s in e)&&(a=e[s])),(a=parseFloat(a)||0)+Qe(e,t,n||(i?"border":"content"),o,r,a)+"px"}function Ke(e,t,n,r,i){return new Ke.prototype.init(e,t,n,r,i)}S.extend({cssHooks:{opacity:{get:function(e,t){if(t){var n=We(e,"opacity");return""===n?"1":n}}}},cssNumber:{animationIterationCount:!0,columnCount:!0,fillOpacity:!0,flexGrow:!0,flexShrink:!0,fontWeight:!0,gridArea:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnStart:!0,gridRow:!0,gridRowEnd:!0,gridRowStart:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{},style:function(e,t,n,r){if(e&&3!==e.nodeType&&8!==e.nodeType&&e.style){var i,o,a,s=X(t),u=Xe.test(t),l=e.style;if(u||(t=ze(s)),a=S.cssHooks[t]||S.cssHooks[s],void 0===n)return a&&"get"in a&&void 0!==(i=a.get(e,!1,r))?i:l[t];"string"===(o=typeof n)&&(i=te.exec(n))&&i[1]&&(n=se(e,t,i),o="number"),null!=n&&n==n&&("number"!==o||u||(n+=i&&i[3]||(S.cssNumber[s]?"":"px")),y.clearCloneStyle||""!==n||0!==t.indexOf("background")||(l[t]="inherit"),a&&"set"in a&&void 0===(n=a.set(e,n,r))||(u?l.setProperty(t,n):l[t]=n))}},css:function(e,t,n,r){var i,o,a,s=X(t);return Xe.test(t)||(t=ze(s)),(a=S.cssHooks[t]||S.cssHooks[s])&&"get"in a&&(i=a.get(e,!0,n)),void 0===i&&(i=We(e,t,r)),"normal"===i&&t in Ge&&(i=Ge[t]),""===n||n?(o=parseFloat(i),!0===n||isFinite(o)?o||0:i):i}}),S.each(["height","width"],function(e,u){S.cssHooks[u]={get:function(e,t,n){if(t)return!Ue.test(S.css(e,"display"))||e.getClientRects().length&&e.getBoundingClientRect().width?Je(e,u,n):Me(e,Ve,function(){return Je(e,u,n)})},set:function(e,t,n){var r,i=Re(e),o=!y.scrollboxSize()&&"absolute"===i.position,a=(o||n)&&"border-box"===S.css(e,"boxSizing",!1,i),s=n?Qe(e,u,n,a,i):0;return a&&o&&(s-=Math.ceil(e["offset"+u[0].toUpperCase()+u.slice(1)]-parseFloat(i[u])-Qe(e,u,"border",!1,i)-.5)),s&&(r=te.exec(t))&&"px"!==(r[3]||"px")&&(e.style[u]=t,t=S.css(e,u)),Ye(0,t,s)}}}),S.cssHooks.marginLeft=Fe(y.reliableMarginLeft,function(e,t){if(t)return(parseFloat(We(e,"marginLeft"))||e.getBoundingClientRect().left-Me(e,{marginLeft:0},function(){return e.getBoundingClientRect().left}))+"px"}),S.each({margin:"",padding:"",border:"Width"},function(i,o){S.cssHooks[i+o]={expand:function(e){for(var t=0,n={},r="string"==typeof e?e.split(" "):[e];t<4;t++)n[i+ne[t]+o]=r[t]||r[t-2]||r[0];return n}},"margin"!==i&&(S.cssHooks[i+o].set=Ye)}),S.fn.extend({css:function(e,t){return $(this,function(e,t,n){var r,i,o={},a=0;if(Array.isArray(t)){for(r=Re(e),i=t.length;a<i;a++)o[t[a]]=S.css(e,t[a],!1,r);return o}return void 0!==n?S.style(e,t,n):S.css(e,t)},e,t,1<arguments.length)}}),((S.Tween=Ke).prototype={constructor:Ke,init:function(e,t,n,r,i,o){this.elem=e,this.prop=n,this.easing=i||S.easing._default,this.options=t,this.start=this.now=this.cur(),this.end=r,this.unit=o||(S.cssNumber[n]?"":"px")},cur:function(){var e=Ke.propHooks[this.prop];return e&&e.get?e.get(this):Ke.propHooks._default.get(this)},run:function(e){var t,n=Ke.propHooks[this.prop];return this.options.duration?this.pos=t=S.easing[this.easing](e,this.options.duration*e,0,1,this.options.duration):this.pos=t=e,this.now=(this.end-this.start)*t+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),n&&n.set?n.set(this):Ke.propHooks._default.set(this),this}}).init.prototype=Ke.prototype,(Ke.propHooks={_default:{get:function(e){var t;return 1!==e.elem.nodeType||null!=e.elem[e.prop]&&null==e.elem.style[e.prop]?e.elem[e.prop]:(t=S.css(e.elem,e.prop,""))&&"auto"!==t?t:0},set:function(e){S.fx.step[e.prop]?S.fx.step[e.prop](e):1!==e.elem.nodeType||!S.cssHooks[e.prop]&&null==e.elem.style[ze(e.prop)]?e.elem[e.prop]=e.now:S.style(e.elem,e.prop,e.now+e.unit)}}}).scrollTop=Ke.propHooks.scrollLeft={set:function(e){e.elem.nodeType&&e.elem.parentNode&&(e.elem[e.prop]=e.now)}},S.easing={linear:function(e){return e},swing:function(e){return.5-Math.cos(e*Math.PI)/2},_default:"swing"},S.fx=Ke.prototype.init,S.fx.step={};var Ze,et,tt,nt,rt=/^(?:toggle|show|hide)$/,it=/queueHooks$/;function ot(){et&&(!1===E.hidden&&C.requestAnimationFrame?C.requestAnimationFrame(ot):C.setTimeout(ot,S.fx.interval),S.fx.tick())}function at(){return C.setTimeout(function(){Ze=void 0}),Ze=Date.now()}function st(e,t){var n,r=0,i={height:e};for(t=t?1:0;r<4;r+=2-t)i["margin"+(n=ne[r])]=i["padding"+n]=e;return t&&(i.opacity=i.width=e),i}function ut(e,t,n){for(var r,i=(lt.tweeners[t]||[]).concat(lt.tweeners["*"]),o=0,a=i.length;o<a;o++)if(r=i[o].call(n,t,e))return r}function lt(o,e,t){var n,a,r=0,i=lt.prefilters.length,s=S.Deferred().always(function(){delete u.elem}),u=function(){if(a)return!1;for(var e=Ze||at(),t=Math.max(0,l.startTime+l.duration-e),n=1-(t/l.duration||0),r=0,i=l.tweens.length;r<i;r++)l.tweens[r].run(n);return s.notifyWith(o,[l,n,t]),n<1&&i?t:(i||s.notifyWith(o,[l,1,0]),s.resolveWith(o,[l]),!1)},l=s.promise({elem:o,props:S.extend({},e),opts:S.extend(!0,{specialEasing:{},easing:S.easing._default},t),originalProperties:e,originalOptions:t,startTime:Ze||at(),duration:t.duration,tweens:[],createTween:function(e,t){var n=S.Tween(o,l.opts,e,t,l.opts.specialEasing[e]||l.opts.easing);return l.tweens.push(n),n},stop:function(e){var t=0,n=e?l.tweens.length:0;if(a)return this;for(a=!0;t<n;t++)l.tweens[t].run(1);return e?(s.notifyWith(o,[l,1,0]),s.resolveWith(o,[l,e])):s.rejectWith(o,[l,e]),this}}),c=l.props;for(!function(e,t){var n,r,i,o,a;for(n in e)if(i=t[r=X(n)],o=e[n],Array.isArray(o)&&(i=o[1],o=e[n]=o[0]),n!==r&&(e[r]=o,delete e[n]),(a=S.cssHooks[r])&&"expand"in a)for(n in o=a.expand(o),delete e[r],o)n in e||(e[n]=o[n],t[n]=i);else t[r]=i}(c,l.opts.specialEasing);r<i;r++)if(n=lt.prefilters[r].call(l,o,c,l.opts))return m(n.stop)&&(S._queueHooks(l.elem,l.opts.queue).stop=n.stop.bind(n)),n;return S.map(c,ut,l),m(l.opts.start)&&l.opts.start.call(o,l),l.progress(l.opts.progress).done(l.opts.done,l.opts.complete).fail(l.opts.fail).always(l.opts.always),S.fx.timer(S.extend(u,{elem:o,anim:l,queue:l.opts.queue})),l}S.Animation=S.extend(lt,{tweeners:{"*":[function(e,t){var n=this.createTween(e,t);return se(n.elem,e,te.exec(t),n),n}]},tweener:function(e,t){m(e)?(t=e,e=["*"]):e=e.match(P);for(var n,r=0,i=e.length;r<i;r++)n=e[r],lt.tweeners[n]=lt.tweeners[n]||[],lt.tweeners[n].unshift(t)},prefilters:[function(e,t,n){var r,i,o,a,s,u,l,c,f="width"in t||"height"in t,p=this,d={},h=e.style,g=e.nodeType&&ae(e),v=Y.get(e,"fxshow");for(r in n.queue||(null==(a=S._queueHooks(e,"fx")).unqueued&&(a.unqueued=0,s=a.empty.fire,a.empty.fire=function(){a.unqueued||s()}),a.unqueued++,p.always(function(){p.always(function(){a.unqueued--,S.queue(e,"fx").length||a.empty.fire()})})),t)if(i=t[r],rt.test(i)){if(delete t[r],o=o||"toggle"===i,i===(g?"hide":"show")){if("show"!==i||!v||void 0===v[r])continue;g=!0}d[r]=v&&v[r]||S.style(e,r)}if((u=!S.isEmptyObject(t))||!S.isEmptyObject(d))for(r in f&&1===e.nodeType&&(n.overflow=[h.overflow,h.overflowX,h.overflowY],null==(l=v&&v.display)&&(l=Y.get(e,"display")),"none"===(c=S.css(e,"display"))&&(l?c=l:(le([e],!0),l=e.style.display||l,c=S.css(e,"display"),le([e]))),("inline"===c||"inline-block"===c&&null!=l)&&"none"===S.css(e,"float")&&(u||(p.done(function(){h.display=l}),null==l&&(c=h.display,l="none"===c?"":c)),h.display="inline-block")),n.overflow&&(h.overflow="hidden",p.always(function(){h.overflow=n.overflow[0],h.overflowX=n.overflow[1],h.overflowY=n.overflow[2]})),u=!1,d)u||(v?"hidden"in v&&(g=v.hidden):v=Y.access(e,"fxshow",{display:l}),o&&(v.hidden=!g),g&&le([e],!0),p.done(function(){for(r in g||le([e]),Y.remove(e,"fxshow"),d)S.style(e,r,d[r])})),u=ut(g?v[r]:0,r,p),r in v||(v[r]=u.start,g&&(u.end=u.start,u.start=0))}],prefilter:function(e,t){t?lt.prefilters.unshift(e):lt.prefilters.push(e)}}),S.speed=function(e,t,n){var r=e&&"object"==typeof e?S.extend({},e):{complete:n||!n&&t||m(e)&&e,duration:e,easing:n&&t||t&&!m(t)&&t};return S.fx.off?r.duration=0:"number"!=typeof r.duration&&(r.duration in S.fx.speeds?r.duration=S.fx.speeds[r.duration]:r.duration=S.fx.speeds._default),null!=r.queue&&!0!==r.queue||(r.queue="fx"),r.old=r.complete,r.complete=function(){m(r.old)&&r.old.call(this),r.queue&&S.dequeue(this,r.queue)},r},S.fn.extend({fadeTo:function(e,t,n,r){return this.filter(ae).css("opacity",0).show().end().animate({opacity:t},e,n,r)},animate:function(t,e,n,r){var i=S.isEmptyObject(t),o=S.speed(e,n,r),a=function(){var e=lt(this,S.extend({},t),o);(i||Y.get(this,"finish"))&&e.stop(!0)};return a.finish=a,i||!1===o.queue?this.each(a):this.queue(o.queue,a)},stop:function(i,e,o){var a=function(e){var t=e.stop;delete e.stop,t(o)};return"string"!=typeof i&&(o=e,e=i,i=void 0),e&&this.queue(i||"fx",[]),this.each(function(){var e=!0,t=null!=i&&i+"queueHooks",n=S.timers,r=Y.get(this);if(t)r[t]&&r[t].stop&&a(r[t]);else for(t in r)r[t]&&r[t].stop&&it.test(t)&&a(r[t]);for(t=n.length;t--;)n[t].elem!==this||null!=i&&n[t].queue!==i||(n[t].anim.stop(o),e=!1,n.splice(t,1));!e&&o||S.dequeue(this,i)})},finish:function(a){return!1!==a&&(a=a||"fx"),this.each(function(){var e,t=Y.get(this),n=t[a+"queue"],r=t[a+"queueHooks"],i=S.timers,o=n?n.length:0;for(t.finish=!0,S.queue(this,a,[]),r&&r.stop&&r.stop.call(this,!0),e=i.length;e--;)i[e].elem===this&&i[e].queue===a&&(i[e].anim.stop(!0),i.splice(e,1));for(e=0;e<o;e++)n[e]&&n[e].finish&&n[e].finish.call(this);delete t.finish})}}),S.each(["toggle","show","hide"],function(e,r){var i=S.fn[r];S.fn[r]=function(e,t,n){return null==e||"boolean"==typeof e?i.apply(this,arguments):this.animate(st(r,!0),e,t,n)}}),S.each({slideDown:st("show"),slideUp:st("hide"),slideToggle:st("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(e,r){S.fn[e]=function(e,t,n){return this.animate(r,e,t,n)}}),S.timers=[],S.fx.tick=function(){var e,t=0,n=S.timers;for(Ze=Date.now();t<n.length;t++)(e=n[t])()||n[t]!==e||n.splice(t--,1);n.length||S.fx.stop(),Ze=void 0},S.fx.timer=function(e){S.timers.push(e),S.fx.start()},S.fx.interval=13,S.fx.start=function(){et||(et=!0,ot())},S.fx.stop=function(){et=null},S.fx.speeds={slow:600,fast:200,_default:400},S.fn.delay=function(r,e){return r=S.fx&&S.fx.speeds[r]||r,e=e||"fx",this.queue(e,function(e,t){var n=C.setTimeout(e,r);t.stop=function(){C.clearTimeout(n)}})},tt=E.createElement("input"),nt=E.createElement("select").appendChild(E.createElement("option")),tt.type="checkbox",y.checkOn=""!==tt.value,y.optSelected=nt.selected,(tt=E.createElement("input")).value="t",tt.type="radio",y.radioValue="t"===tt.value;var ct,ft=S.expr.attrHandle;S.fn.extend({attr:function(e,t){return $(this,S.attr,e,t,1<arguments.length)},removeAttr:function(e){return this.each(function(){S.removeAttr(this,e)})}}),S.extend({attr:function(e,t,n){var r,i,o=e.nodeType;if(3!==o&&8!==o&&2!==o)return"undefined"==typeof e.getAttribute?S.prop(e,t,n):(1===o&&S.isXMLDoc(e)||(i=S.attrHooks[t.toLowerCase()]||(S.expr.match.bool.test(t)?ct:void 0)),void 0!==n?null===n?void S.removeAttr(e,t):i&&"set"in i&&void 0!==(r=i.set(e,n,t))?r:(e.setAttribute(t,n+""),n):i&&"get"in i&&null!==(r=i.get(e,t))?r:null==(r=S.find.attr(e,t))?void 0:r)},attrHooks:{type:{set:function(e,t){if(!y.radioValue&&"radio"===t&&A(e,"input")){var n=e.value;return e.setAttribute("type",t),n&&(e.value=n),t}}}},removeAttr:function(e,t){var n,r=0,i=t&&t.match(P);if(i&&1===e.nodeType)while(n=i[r++])e.removeAttribute(n)}}),ct={set:function(e,t,n){return!1===t?S.removeAttr(e,n):e.setAttribute(n,n),n}},S.each(S.expr.match.bool.source.match(/\w+/g),function(e,t){var a=ft[t]||S.find.attr;ft[t]=function(e,t,n){var r,i,o=t.toLowerCase();return n||(i=ft[o],ft[o]=r,r=null!=a(e,t,n)?o:null,ft[o]=i),r}});var pt=/^(?:input|select|textarea|button)$/i,dt=/^(?:a|area)$/i;function ht(e){return(e.match(P)||[]).join(" ")}function gt(e){return e.getAttribute&&e.getAttribute("class")||""}function vt(e){return Array.isArray(e)?e:"string"==typeof e&&e.match(P)||[]}S.fn.extend({prop:function(e,t){return $(this,S.prop,e,t,1<arguments.length)},removeProp:function(e){return this.each(function(){delete this[S.propFix[e]||e]})}}),S.extend({prop:function(e,t,n){var r,i,o=e.nodeType;if(3!==o&&8!==o&&2!==o)return 1===o&&S.isXMLDoc(e)||(t=S.propFix[t]||t,i=S.propHooks[t]),void 0!==n?i&&"set"in i&&void 0!==(r=i.set(e,n,t))?r:e[t]=n:i&&"get"in i&&null!==(r=i.get(e,t))?r:e[t]},propHooks:{tabIndex:{get:function(e){var t=S.find.attr(e,"tabindex");return t?parseInt(t,10):pt.test(e.nodeName)||dt.test(e.nodeName)&&e.href?0:-1}}},propFix:{"for":"htmlFor","class":"className"}}),y.optSelected||(S.propHooks.selected={get:function(e){var t=e.parentNode;return t&&t.parentNode&&t.parentNode.selectedIndex,null},set:function(e){var t=e.parentNode;t&&(t.selectedIndex,t.parentNode&&t.parentNode.selectedIndex)}}),S.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){S.propFix[this.toLowerCase()]=this}),S.fn.extend({addClass:function(t){var e,n,r,i,o,a,s,u=0;if(m(t))return this.each(function(e){S(this).addClass(t.call(this,e,gt(this)))});if((e=vt(t)).length)while(n=this[u++])if(i=gt(n),r=1===n.nodeType&&" "+ht(i)+" "){a=0;while(o=e[a++])r.indexOf(" "+o+" ")<0&&(r+=o+" ");i!==(s=ht(r))&&n.setAttribute("class",s)}return this},removeClass:function(t){var e,n,r,i,o,a,s,u=0;if(m(t))return this.each(function(e){S(this).removeClass(t.call(this,e,gt(this)))});if(!arguments.length)return this.attr("class","");if((e=vt(t)).length)while(n=this[u++])if(i=gt(n),r=1===n.nodeType&&" "+ht(i)+" "){a=0;while(o=e[a++])while(-1<r.indexOf(" "+o+" "))r=r.replace(" "+o+" "," ");i!==(s=ht(r))&&n.setAttribute("class",s)}return this},toggleClass:function(i,t){var o=typeof i,a="string"===o||Array.isArray(i);return"boolean"==typeof t&&a?t?this.addClass(i):this.removeClass(i):m(i)?this.each(function(e){S(this).toggleClass(i.call(this,e,gt(this),t),t)}):this.each(function(){var e,t,n,r;if(a){t=0,n=S(this),r=vt(i);while(e=r[t++])n.hasClass(e)?n.removeClass(e):n.addClass(e)}else void 0!==i&&"boolean"!==o||((e=gt(this))&&Y.set(this,"__className__",e),this.setAttribute&&this.setAttribute("class",e||!1===i?"":Y.get(this,"__className__")||""))})},hasClass:function(e){var t,n,r=0;t=" "+e+" ";while(n=this[r++])if(1===n.nodeType&&-1<(" "+ht(gt(n))+" ").indexOf(t))return!0;return!1}});var yt=/\r/g;S.fn.extend({val:function(n){var r,e,i,t=this[0];return arguments.length?(i=m(n),this.each(function(e){var t;1===this.nodeType&&(null==(t=i?n.call(this,e,S(this).val()):n)?t="":"number"==typeof t?t+="":Array.isArray(t)&&(t=S.map(t,function(e){return null==e?"":e+""})),(r=S.valHooks[this.type]||S.valHooks[this.nodeName.toLowerCase()])&&"set"in r&&void 0!==r.set(this,t,"value")||(this.value=t))})):t?(r=S.valHooks[t.type]||S.valHooks[t.nodeName.toLowerCase()])&&"get"in r&&void 0!==(e=r.get(t,"value"))?e:"string"==typeof(e=t.value)?e.replace(yt,""):null==e?"":e:void 0}}),S.extend({valHooks:{option:{get:function(e){var t=S.find.attr(e,"value");return null!=t?t:ht(S.text(e))}},select:{get:function(e){var t,n,r,i=e.options,o=e.selectedIndex,a="select-one"===e.type,s=a?null:[],u=a?o+1:i.length;for(r=o<0?u:a?o:0;r<u;r++)if(((n=i[r]).selected||r===o)&&!n.disabled&&(!n.parentNode.disabled||!A(n.parentNode,"optgroup"))){if(t=S(n).val(),a)return t;s.push(t)}return s},set:function(e,t){var n,r,i=e.options,o=S.makeArray(t),a=i.length;while(a--)((r=i[a]).selected=-1<S.inArray(S.valHooks.option.get(r),o))&&(n=!0);return n||(e.selectedIndex=-1),o}}}}),S.each(["radio","checkbox"],function(){S.valHooks[this]={set:function(e,t){if(Array.isArray(t))return e.checked=-1<S.inArray(S(e).val(),t)}},y.checkOn||(S.valHooks[this].get=function(e){return null===e.getAttribute("value")?"on":e.value})}),y.focusin="onfocusin"in C;var mt=/^(?:focusinfocus|focusoutblur)$/,xt=function(e){e.stopPropagation()};S.extend(S.event,{trigger:function(e,t,n,r){var i,o,a,s,u,l,c,f,p=[n||E],d=v.call(e,"type")?e.type:e,h=v.call(e,"namespace")?e.namespace.split("."):[];if(o=f=a=n=n||E,3!==n.nodeType&&8!==n.nodeType&&!mt.test(d+S.event.triggered)&&(-1<d.indexOf(".")&&(d=(h=d.split(".")).shift(),h.sort()),u=d.indexOf(":")<0&&"on"+d,(e=e[S.expando]?e:new S.Event(d,"object"==typeof e&&e)).isTrigger=r?2:3,e.namespace=h.join("."),e.rnamespace=e.namespace?new RegExp("(^|\\.)"+h.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,e.result=void 0,e.target||(e.target=n),t=null==t?[e]:S.makeArray(t,[e]),c=S.event.special[d]||{},r||!c.trigger||!1!==c.trigger.apply(n,t))){if(!r&&!c.noBubble&&!x(n)){for(s=c.delegateType||d,mt.test(s+d)||(o=o.parentNode);o;o=o.parentNode)p.push(o),a=o;a===(n.ownerDocument||E)&&p.push(a.defaultView||a.parentWindow||C)}i=0;while((o=p[i++])&&!e.isPropagationStopped())f=o,e.type=1<i?s:c.bindType||d,(l=(Y.get(o,"events")||Object.create(null))[e.type]&&Y.get(o,"handle"))&&l.apply(o,t),(l=u&&o[u])&&l.apply&&V(o)&&(e.result=l.apply(o,t),!1===e.result&&e.preventDefault());return e.type=d,r||e.isDefaultPrevented()||c._default&&!1!==c._default.apply(p.pop(),t)||!V(n)||u&&m(n[d])&&!x(n)&&((a=n[u])&&(n[u]=null),S.event.triggered=d,e.isPropagationStopped()&&f.addEventListener(d,xt),n[d](),e.isPropagationStopped()&&f.removeEventListener(d,xt),S.event.triggered=void 0,a&&(n[u]=a)),e.result}},simulate:function(e,t,n){var r=S.extend(new S.Event,n,{type:e,isSimulated:!0});S.event.trigger(r,null,t)}}),S.fn.extend({trigger:function(e,t){return this.each(function(){S.event.trigger(e,t,this)})},triggerHandler:function(e,t){var n=this[0];if(n)return S.event.trigger(e,t,n,!0)}}),y.focusin||S.each({focus:"focusin",blur:"focusout"},function(n,r){var i=function(e){S.event.simulate(r,e.target,S.event.fix(e))};S.event.special[r]={setup:function(){var e=this.ownerDocument||this.document||this,t=Y.access(e,r);t||e.addEventListener(n,i,!0),Y.access(e,r,(t||0)+1)},teardown:function(){var e=this.ownerDocument||this.document||this,t=Y.access(e,r)-1;t?Y.access(e,r,t):(e.removeEventListener(n,i,!0),Y.remove(e,r))}}});var bt=C.location,wt={guid:Date.now()},Tt=/\?/;S.parseXML=function(e){var t,n;if(!e||"string"!=typeof e)return null;try{t=(new C.DOMParser).parseFromString(e,"text/xml")}catch(e){}return n=t&&t.getElementsByTagName("parsererror")[0],t&&!n||S.error("Invalid XML: "+(n?S.map(n.childNodes,function(e){return e.textContent}).join("\n"):e)),t};var Ct=/\[\]$/,Et=/\r?\n/g,St=/^(?:submit|button|image|reset|file)$/i,kt=/^(?:input|select|textarea|keygen)/i;function At(n,e,r,i){var t;if(Array.isArray(e))S.each(e,function(e,t){r||Ct.test(n)?i(n,t):At(n+"["+("object"==typeof t&&null!=t?e:"")+"]",t,r,i)});else if(r||"object"!==w(e))i(n,e);else for(t in e)At(n+"["+t+"]",e[t],r,i)}S.param=function(e,t){var n,r=[],i=function(e,t){var n=m(t)?t():t;r[r.length]=encodeURIComponent(e)+"="+encodeURIComponent(null==n?"":n)};if(null==e)return"";if(Array.isArray(e)||e.jquery&&!S.isPlainObject(e))S.each(e,function(){i(this.name,this.value)});else for(n in e)At(n,e[n],t,i);return r.join("&")},S.fn.extend({serialize:function(){return S.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var e=S.prop(this,"elements");return e?S.makeArray(e):this}).filter(function(){var e=this.type;return this.name&&!S(this).is(":disabled")&&kt.test(this.nodeName)&&!St.test(e)&&(this.checked||!pe.test(e))}).map(function(e,t){var n=S(this).val();return null==n?null:Array.isArray(n)?S.map(n,function(e){return{name:t.name,value:e.replace(Et,"\r\n")}}):{name:t.name,value:n.replace(Et,"\r\n")}}).get()}});var Nt=/%20/g,jt=/#.*$/,Dt=/([?&])_=[^&]*/,qt=/^(.*?):[ \t]*([^\r\n]*)$/gm,Lt=/^(?:GET|HEAD)$/,Ht=/^\/\//,Ot={},Pt={},Rt="*/".concat("*"),Mt=E.createElement("a");function It(o){return function(e,t){"string"!=typeof e&&(t=e,e="*");var n,r=0,i=e.toLowerCase().match(P)||[];if(m(t))while(n=i[r++])"+"===n[0]?(n=n.slice(1)||"*",(o[n]=o[n]||[]).unshift(t)):(o[n]=o[n]||[]).push(t)}}function Wt(t,i,o,a){var s={},u=t===Pt;function l(e){var r;return s[e]=!0,S.each(t[e]||[],function(e,t){var n=t(i,o,a);return"string"!=typeof n||u||s[n]?u?!(r=n):void 0:(i.dataTypes.unshift(n),l(n),!1)}),r}return l(i.dataTypes[0])||!s["*"]&&l("*")}function Ft(e,t){var n,r,i=S.ajaxSettings.flatOptions||{};for(n in t)void 0!==t[n]&&((i[n]?e:r||(r={}))[n]=t[n]);return r&&S.extend(!0,e,r),e}Mt.href=bt.href,S.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:bt.href,type:"GET",isLocal:/^(?:about|app|app-storage|.+-extension|file|res|widget):$/.test(bt.protocol),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":Rt,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/\bxml\b/,html:/\bhtml/,json:/\bjson\b/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":JSON.parse,"text xml":S.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(e,t){return t?Ft(Ft(e,S.ajaxSettings),t):Ft(S.ajaxSettings,e)},ajaxPrefilter:It(Ot),ajaxTransport:It(Pt),ajax:function(e,t){"object"==typeof e&&(t=e,e=void 0),t=t||{};var c,f,p,n,d,r,h,g,i,o,v=S.ajaxSetup({},t),y=v.context||v,m=v.context&&(y.nodeType||y.jquery)?S(y):S.event,x=S.Deferred(),b=S.Callbacks("once memory"),w=v.statusCode||{},a={},s={},u="canceled",T={readyState:0,getResponseHeader:function(e){var t;if(h){if(!n){n={};while(t=qt.exec(p))n[t[1].toLowerCase()+" "]=(n[t[1].toLowerCase()+" "]||[]).concat(t[2])}t=n[e.toLowerCase()+" "]}return null==t?null:t.join(", ")},getAllResponseHeaders:function(){return h?p:null},setRequestHeader:function(e,t){return null==h&&(e=s[e.toLowerCase()]=s[e.toLowerCase()]||e,a[e]=t),this},overrideMimeType:function(e){return null==h&&(v.mimeType=e),this},statusCode:function(e){var t;if(e)if(h)T.always(e[T.status]);else for(t in e)w[t]=[w[t],e[t]];return this},abort:function(e){var t=e||u;return c&&c.abort(t),l(0,t),this}};if(x.promise(T),v.url=((e||v.url||bt.href)+"").replace(Ht,bt.protocol+"//"),v.type=t.method||t.type||v.method||v.type,v.dataTypes=(v.dataType||"*").toLowerCase().match(P)||[""],null==v.crossDomain){r=E.createElement("a");try{r.href=v.url,r.href=r.href,v.crossDomain=Mt.protocol+"//"+Mt.host!=r.protocol+"//"+r.host}catch(e){v.crossDomain=!0}}if(v.data&&v.processData&&"string"!=typeof v.data&&(v.data=S.param(v.data,v.traditional)),Wt(Ot,v,t,T),h)return T;for(i in(g=S.event&&v.global)&&0==S.active++&&S.event.trigger("ajaxStart"),v.type=v.type.toUpperCase(),v.hasContent=!Lt.test(v.type),f=v.url.replace(jt,""),v.hasContent?v.data&&v.processData&&0===(v.contentType||"").indexOf("application/x-www-form-urlencoded")&&(v.data=v.data.replace(Nt,"+")):(o=v.url.slice(f.length),v.data&&(v.processData||"string"==typeof v.data)&&(f+=(Tt.test(f)?"&":"?")+v.data,delete v.data),!1===v.cache&&(f=f.replace(Dt,"$1"),o=(Tt.test(f)?"&":"?")+"_="+wt.guid+++o),v.url=f+o),v.ifModified&&(S.lastModified[f]&&T.setRequestHeader("If-Modified-Since",S.lastModified[f]),S.etag[f]&&T.setRequestHeader("If-None-Match",S.etag[f])),(v.data&&v.hasContent&&!1!==v.contentType||t.contentType)&&T.setRequestHeader("Content-Type",v.contentType),T.setRequestHeader("Accept",v.dataTypes[0]&&v.accepts[v.dataTypes[0]]?v.accepts[v.dataTypes[0]]+("*"!==v.dataTypes[0]?", "+Rt+"; q=0.01":""):v.accepts["*"]),v.headers)T.setRequestHeader(i,v.headers[i]);if(v.beforeSend&&(!1===v.beforeSend.call(y,T,v)||h))return T.abort();if(u="abort",b.add(v.complete),T.done(v.success),T.fail(v.error),c=Wt(Pt,v,t,T)){if(T.readyState=1,g&&m.trigger("ajaxSend",[T,v]),h)return T;v.async&&0<v.timeout&&(d=C.setTimeout(function(){T.abort("timeout")},v.timeout));try{h=!1,c.send(a,l)}catch(e){if(h)throw e;l(-1,e)}}else l(-1,"No Transport");function l(e,t,n,r){var i,o,a,s,u,l=t;h||(h=!0,d&&C.clearTimeout(d),c=void 0,p=r||"",T.readyState=0<e?4:0,i=200<=e&&e<300||304===e,n&&(s=function(e,t,n){var r,i,o,a,s=e.contents,u=e.dataTypes;while("*"===u[0])u.shift(),void 0===r&&(r=e.mimeType||t.getResponseHeader("Content-Type"));if(r)for(i in s)if(s[i]&&s[i].test(r)){u.unshift(i);break}if(u[0]in n)o=u[0];else{for(i in n){if(!u[0]||e.converters[i+" "+u[0]]){o=i;break}a||(a=i)}o=o||a}if(o)return o!==u[0]&&u.unshift(o),n[o]}(v,T,n)),!i&&-1<S.inArray("script",v.dataTypes)&&S.inArray("json",v.dataTypes)<0&&(v.converters["text script"]=function(){}),s=function(e,t,n,r){var i,o,a,s,u,l={},c=e.dataTypes.slice();if(c[1])for(a in e.converters)l[a.toLowerCase()]=e.converters[a];o=c.shift();while(o)if(e.responseFields[o]&&(n[e.responseFields[o]]=t),!u&&r&&e.dataFilter&&(t=e.dataFilter(t,e.dataType)),u=o,o=c.shift())if("*"===o)o=u;else if("*"!==u&&u!==o){if(!(a=l[u+" "+o]||l["* "+o]))for(i in l)if((s=i.split(" "))[1]===o&&(a=l[u+" "+s[0]]||l["* "+s[0]])){!0===a?a=l[i]:!0!==l[i]&&(o=s[0],c.unshift(s[1]));break}if(!0!==a)if(a&&e["throws"])t=a(t);else try{t=a(t)}catch(e){return{state:"parsererror",error:a?e:"No conversion from "+u+" to "+o}}}return{state:"success",data:t}}(v,s,T,i),i?(v.ifModified&&((u=T.getResponseHeader("Last-Modified"))&&(S.lastModified[f]=u),(u=T.getResponseHeader("etag"))&&(S.etag[f]=u)),204===e||"HEAD"===v.type?l="nocontent":304===e?l="notmodified":(l=s.state,o=s.data,i=!(a=s.error))):(a=l,!e&&l||(l="error",e<0&&(e=0))),T.status=e,T.statusText=(t||l)+"",i?x.resolveWith(y,[o,l,T]):x.rejectWith(y,[T,l,a]),T.statusCode(w),w=void 0,g&&m.trigger(i?"ajaxSuccess":"ajaxError",[T,v,i?o:a]),b.fireWith(y,[T,l]),g&&(m.trigger("ajaxComplete",[T,v]),--S.active||S.event.trigger("ajaxStop")))}return T},getJSON:function(e,t,n){return S.get(e,t,n,"json")},getScript:function(e,t){return S.get(e,void 0,t,"script")}}),S.each(["get","post"],function(e,i){S[i]=function(e,t,n,r){return m(t)&&(r=r||n,n=t,t=void 0),S.ajax(S.extend({url:e,type:i,dataType:r,data:t,success:n},S.isPlainObject(e)&&e))}}),S.ajaxPrefilter(function(e){var t;for(t in e.headers)"content-type"===t.toLowerCase()&&(e.contentType=e.headers[t]||"")}),S._evalUrl=function(e,t,n){return S.ajax({url:e,type:"GET",dataType:"script",cache:!0,async:!1,global:!1,converters:{"text script":function(){}},dataFilter:function(e){S.globalEval(e,t,n)}})},S.fn.extend({wrapAll:function(e){var t;return this[0]&&(m(e)&&(e=e.call(this[0])),t=S(e,this[0].ownerDocument).eq(0).clone(!0),this[0].parentNode&&t.insertBefore(this[0]),t.map(function(){var e=this;while(e.firstElementChild)e=e.firstElementChild;return e}).append(this)),this},wrapInner:function(n){return m(n)?this.each(function(e){S(this).wrapInner(n.call(this,e))}):this.each(function(){var e=S(this),t=e.contents();t.length?t.wrapAll(n):e.append(n)})},wrap:function(t){var n=m(t);return this.each(function(e){S(this).wrapAll(n?t.call(this,e):t)})},unwrap:function(e){return this.parent(e).not("body").each(function(){S(this).replaceWith(this.childNodes)}),this}}),S.expr.pseudos.hidden=function(e){return!S.expr.pseudos.visible(e)},S.expr.pseudos.visible=function(e){return!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length)},S.ajaxSettings.xhr=function(){try{return new C.XMLHttpRequest}catch(e){}};var Bt={0:200,1223:204},$t=S.ajaxSettings.xhr();y.cors=!!$t&&"withCredentials"in $t,y.ajax=$t=!!$t,S.ajaxTransport(function(i){var o,a;if(y.cors||$t&&!i.crossDomain)return{send:function(e,t){var n,r=i.xhr();if(r.open(i.type,i.url,i.async,i.username,i.password),i.xhrFields)for(n in i.xhrFields)r[n]=i.xhrFields[n];for(n in i.mimeType&&r.overrideMimeType&&r.overrideMimeType(i.mimeType),i.crossDomain||e["X-Requested-With"]||(e["X-Requested-With"]="XMLHttpRequest"),e)r.setRequestHeader(n,e[n]);o=function(e){return function(){o&&(o=a=r.onload=r.onerror=r.onabort=r.ontimeout=r.onreadystatechange=null,"abort"===e?r.abort():"error"===e?"number"!=typeof r.status?t(0,"error"):t(r.status,r.statusText):t(Bt[r.status]||r.status,r.statusText,"text"!==(r.responseType||"text")||"string"!=typeof r.responseText?{binary:r.response}:{text:r.responseText},r.getAllResponseHeaders()))}},r.onload=o(),a=r.onerror=r.ontimeout=o("error"),void 0!==r.onabort?r.onabort=a:r.onreadystatechange=function(){4===r.readyState&&C.setTimeout(function(){o&&a()})},o=o("abort");try{r.send(i.hasContent&&i.data||null)}catch(e){if(o)throw e}},abort:function(){o&&o()}}}),S.ajaxPrefilter(function(e){e.crossDomain&&(e.contents.script=!1)}),S.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/\b(?:java|ecma)script\b/},converters:{"text script":function(e){return S.globalEval(e),e}}}),S.ajaxPrefilter("script",function(e){void 0===e.cache&&(e.cache=!1),e.crossDomain&&(e.type="GET")}),S.ajaxTransport("script",function(n){var r,i;if(n.crossDomain||n.scriptAttrs)return{send:function(e,t){r=S("<script>").attr(n.scriptAttrs||{}).prop({charset:n.scriptCharset,src:n.url}).on("load error",i=function(e){r.remove(),i=null,e&&t("error"===e.type?404:200,e.type)}),E.head.appendChild(r[0])},abort:function(){i&&i()}}});var _t,zt=[],Ut=/(=)\?(?=&|$)|\?\?/;S.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var e=zt.pop()||S.expando+"_"+wt.guid++;return this[e]=!0,e}}),S.ajaxPrefilter("json jsonp",function(e,t,n){var r,i,o,a=!1!==e.jsonp&&(Ut.test(e.url)?"url":"string"==typeof e.data&&0===(e.contentType||"").indexOf("application/x-www-form-urlencoded")&&Ut.test(e.data)&&"data");if(a||"jsonp"===e.dataTypes[0])return r=e.jsonpCallback=m(e.jsonpCallback)?e.jsonpCallback():e.jsonpCallback,a?e[a]=e[a].replace(Ut,"$1"+r):!1!==e.jsonp&&(e.url+=(Tt.test(e.url)?"&":"?")+e.jsonp+"="+r),e.converters["script json"]=function(){return o||S.error(r+" was not called"),o[0]},e.dataTypes[0]="json",i=C[r],C[r]=function(){o=arguments},n.always(function(){void 0===i?S(C).removeProp(r):C[r]=i,e[r]&&(e.jsonpCallback=t.jsonpCallback,zt.push(r)),o&&m(i)&&i(o[0]),o=i=void 0}),"script"}),y.createHTMLDocument=((_t=E.implementation.createHTMLDocument("").body).innerHTML="<form></form><form></form>",2===_t.childNodes.length),S.parseHTML=function(e,t,n){return"string"!=typeof e?[]:("boolean"==typeof t&&(n=t,t=!1),t||(y.createHTMLDocument?((r=(t=E.implementation.createHTMLDocument("")).createElement("base")).href=E.location.href,t.head.appendChild(r)):t=E),o=!n&&[],(i=N.exec(e))?[t.createElement(i[1])]:(i=xe([e],t,o),o&&o.length&&S(o).remove(),S.merge([],i.childNodes)));var r,i,o},S.fn.load=function(e,t,n){var r,i,o,a=this,s=e.indexOf(" ");return-1<s&&(r=ht(e.slice(s)),e=e.slice(0,s)),m(t)?(n=t,t=void 0):t&&"object"==typeof t&&(i="POST"),0<a.length&&S.ajax({url:e,type:i||"GET",dataType:"html",data:t}).done(function(e){o=arguments,a.html(r?S("<div>").append(S.parseHTML(e)).find(r):e)}).always(n&&function(e,t){a.each(function(){n.apply(this,o||[e.responseText,t,e])})}),this},S.expr.pseudos.animated=function(t){return S.grep(S.timers,function(e){return t===e.elem}).length},S.offset={setOffset:function(e,t,n){var r,i,o,a,s,u,l=S.css(e,"position"),c=S(e),f={};"static"===l&&(e.style.position="relative"),s=c.offset(),o=S.css(e,"top"),u=S.css(e,"left"),("absolute"===l||"fixed"===l)&&-1<(o+u).indexOf("auto")?(a=(r=c.position()).top,i=r.left):(a=parseFloat(o)||0,i=parseFloat(u)||0),m(t)&&(t=t.call(e,n,S.extend({},s))),null!=t.top&&(f.top=t.top-s.top+a),null!=t.left&&(f.left=t.left-s.left+i),"using"in t?t.using.call(e,f):c.css(f)}},S.fn.extend({offset:function(t){if(arguments.length)return void 0===t?this:this.each(function(e){S.offset.setOffset(this,t,e)});var e,n,r=this[0];return r?r.getClientRects().length?(e=r.getBoundingClientRect(),n=r.ownerDocument.defaultView,{top:e.top+n.pageYOffset,left:e.left+n.pageXOffset}):{top:0,left:0}:void 0},position:function(){if(this[0]){var e,t,n,r=this[0],i={top:0,left:0};if("fixed"===S.css(r,"position"))t=r.getBoundingClientRect();else{t=this.offset(),n=r.ownerDocument,e=r.offsetParent||n.documentElement;while(e&&(e===n.body||e===n.documentElement)&&"static"===S.css(e,"position"))e=e.parentNode;e&&e!==r&&1===e.nodeType&&((i=S(e).offset()).top+=S.css(e,"borderTopWidth",!0),i.left+=S.css(e,"borderLeftWidth",!0))}return{top:t.top-i.top-S.css(r,"marginTop",!0),left:t.left-i.left-S.css(r,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var e=this.offsetParent;while(e&&"static"===S.css(e,"position"))e=e.offsetParent;return e||re})}}),S.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(t,i){var o="pageYOffset"===i;S.fn[t]=function(e){return $(this,function(e,t,n){var r;if(x(e)?r=e:9===e.nodeType&&(r=e.defaultView),void 0===n)return r?r[i]:e[t];r?r.scrollTo(o?r.pageXOffset:n,o?n:r.pageYOffset):e[t]=n},t,e,arguments.length)}}),S.each(["top","left"],function(e,n){S.cssHooks[n]=Fe(y.pixelPosition,function(e,t){if(t)return t=We(e,n),Pe.test(t)?S(e).position()[n]+"px":t})}),S.each({Height:"height",Width:"width"},function(a,s){S.each({padding:"inner"+a,content:s,"":"outer"+a},function(r,o){S.fn[o]=function(e,t){var n=arguments.length&&(r||"boolean"!=typeof e),i=r||(!0===e||!0===t?"margin":"border");return $(this,function(e,t,n){var r;return x(e)?0===o.indexOf("outer")?e["inner"+a]:e.document.documentElement["client"+a]:9===e.nodeType?(r=e.documentElement,Math.max(e.body["scroll"+a],r["scroll"+a],e.body["offset"+a],r["offset"+a],r["client"+a])):void 0===n?S.css(e,t,i):S.style(e,t,n,i)},s,n?e:void 0,n)}})}),S.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(e,t){S.fn[t]=function(e){return this.on(t,e)}}),S.fn.extend({bind:function(e,t,n){return this.on(e,null,t,n)},unbind:function(e,t){return this.off(e,null,t)},delegate:function(e,t,n,r){return this.on(t,e,n,r)},undelegate:function(e,t,n){return 1===arguments.length?this.off(e,"**"):this.off(t,e||"**",n)},hover:function(e,t){return this.mouseenter(e).mouseleave(t||e)}}),S.each("blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "),function(e,n){S.fn[n]=function(e,t){return 0<arguments.length?this.on(n,null,e,t):this.trigger(n)}});var Xt=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;S.proxy=function(e,t){var n,r,i;if("string"==typeof t&&(n=e[t],t=e,e=n),m(e))return r=s.call(arguments,2),(i=function(){return e.apply(t||this,r.concat(s.call(arguments)))}).guid=e.guid=e.guid||S.guid++,i},S.holdReady=function(e){e?S.readyWait++:S.ready(!0)},S.isArray=Array.isArray,S.parseJSON=JSON.parse,S.nodeName=A,S.isFunction=m,S.isWindow=x,S.camelCase=X,S.type=w,S.now=Date.now,S.isNumeric=function(e){var t=S.type(e);return("number"===t||"string"===t)&&!isNaN(e-parseFloat(e))},S.trim=function(e){return null==e?"":(e+"").replace(Xt,"")},"function"==typeof define&&define.amd&&define("jquery",[],function(){return S});var Vt=C.jQuery,Gt=C.$;return S.noConflict=function(e){return C.$===S&&(C.$=Gt),e&&C.jQuery===S&&(C.jQuery=Vt),S},"undefined"==typeof e&&(C.jQuery=C.$=S),S});


/*! jQuery UI - v1.13.1 - 2022-04-07
* http://jqueryui.com
* Includes: widget.js, keycode.js, widgets/datepicker.js, widgets/mouse.js, widgets/slider.js
* Copyright jQuery Foundation and other contributors; Licensed MIT */

!function(e){"use strict";"function"==typeof define&&define.amd?define(["jquery"],e):e(jQuery)}(function(G){"use strict";G.ui=G.ui||{};G.ui.version="1.13.1";var s,i=0,r=Array.prototype.hasOwnProperty,o=Array.prototype.slice;G.cleanData=(s=G.cleanData,function(e){for(var t,i,a=0;null!=(i=e[a]);a++)(t=G._data(i,"events"))&&t.remove&&G(i).triggerHandler("remove");s(e)}),G.widget=function(e,i,t){var a,s,n,r={},o=e.split(".")[0],l=o+"-"+(e=e.split(".")[1]);return t||(t=i,i=G.Widget),Array.isArray(t)&&(t=G.extend.apply(null,[{}].concat(t))),G.expr.pseudos[l.toLowerCase()]=function(e){return!!G.data(e,l)},G[o]=G[o]||{},a=G[o][e],s=G[o][e]=function(e,t){if(!this||!this._createWidget)return new s(e,t);arguments.length&&this._createWidget(e,t)},G.extend(s,a,{version:t.version,_proto:G.extend({},t),_childConstructors:[]}),(n=new i).options=G.widget.extend({},n.options),G.each(t,function(t,a){function s(){return i.prototype[t].apply(this,arguments)}function n(e){return i.prototype[t].apply(this,e)}r[t]="function"==typeof a?function(){var e,t=this._super,i=this._superApply;return this._super=s,this._superApply=n,e=a.apply(this,arguments),this._super=t,this._superApply=i,e}:a}),s.prototype=G.widget.extend(n,{widgetEventPrefix:a&&n.widgetEventPrefix||e},r,{constructor:s,namespace:o,widgetName:e,widgetFullName:l}),a?(G.each(a._childConstructors,function(e,t){var i=t.prototype;G.widget(i.namespace+"."+i.widgetName,s,t._proto)}),delete a._childConstructors):i._childConstructors.push(s),G.widget.bridge(e,s),s},G.widget.extend=function(e){for(var t,i,a=o.call(arguments,1),s=0,n=a.length;s<n;s++)for(t in a[s])i=a[s][t],r.call(a[s],t)&&void 0!==i&&(G.isPlainObject(i)?e[t]=G.isPlainObject(e[t])?G.widget.extend({},e[t],i):G.widget.extend({},i):e[t]=i);return e},G.widget.bridge=function(n,t){var r=t.prototype.widgetFullName||n;G.fn[n]=function(i){var e="string"==typeof i,a=o.call(arguments,1),s=this;return e?this.length||"instance"!==i?this.each(function(){var e,t=G.data(this,r);return"instance"===i?(s=t,!1):t?"function"!=typeof t[i]||"_"===i.charAt(0)?G.error("no such method '"+i+"' for "+n+" widget instance"):(e=t[i].apply(t,a))!==t&&void 0!==e?(s=e&&e.jquery?s.pushStack(e.get()):e,!1):void 0:G.error("cannot call methods on "+n+" prior to initialization; attempted to call method '"+i+"'")}):s=void 0:(a.length&&(i=G.widget.extend.apply(null,[i].concat(a))),this.each(function(){var e=G.data(this,r);e?(e.option(i||{}),e._init&&e._init()):G.data(this,r,new t(i,this))})),s}},G.Widget=function(){},G.Widget._childConstructors=[],G.Widget.prototype={widgetName:"widget",widgetEventPrefix:"",defaultElement:"<div>",options:{classes:{},disabled:!1,create:null},_createWidget:function(e,t){t=G(t||this.defaultElement||this)[0],this.element=G(t),this.uuid=i++,this.eventNamespace="."+this.widgetName+this.uuid,this.bindings=G(),this.hoverable=G(),this.focusable=G(),this.classesElementLookup={},t!==this&&(G.data(t,this.widgetFullName,this),this._on(!0,this.element,{remove:function(e){e.target===t&&this.destroy()}}),this.document=G(t.style?t.ownerDocument:t.document||t),this.window=G(this.document[0].defaultView||this.document[0].parentWindow)),this.options=G.widget.extend({},this.options,this._getCreateOptions(),e),this._create(),this.options.disabled&&this._setOptionDisabled(this.options.disabled),this._trigger("create",null,this._getCreateEventData()),this._init()},_getCreateOptions:function(){return{}},_getCreateEventData:G.noop,_create:G.noop,_init:G.noop,destroy:function(){var i=this;this._destroy(),G.each(this.classesElementLookup,function(e,t){i._removeClass(t,e)}),this.element.off(this.eventNamespace).removeData(this.widgetFullName),this.widget().off(this.eventNamespace).removeAttr("aria-disabled"),this.bindings.off(this.eventNamespace)},_destroy:G.noop,widget:function(){return this.element},option:function(e,t){var i,a,s,n=e;if(0===arguments.length)return G.widget.extend({},this.options);if("string"==typeof e)if(n={},e=(i=e.split(".")).shift(),i.length){for(a=n[e]=G.widget.extend({},this.options[e]),s=0;s<i.length-1;s++)a[i[s]]=a[i[s]]||{},a=a[i[s]];if(e=i.pop(),1===arguments.length)return void 0===a[e]?null:a[e];a[e]=t}else{if(1===arguments.length)return void 0===this.options[e]?null:this.options[e];n[e]=t}return this._setOptions(n),this},_setOptions:function(e){for(var t in e)this._setOption(t,e[t]);return this},_setOption:function(e,t){return"classes"===e&&this._setOptionClasses(t),this.options[e]=t,"disabled"===e&&this._setOptionDisabled(t),this},_setOptionClasses:function(e){var t,i,a;for(t in e)a=this.classesElementLookup[t],e[t]!==this.options.classes[t]&&a&&a.length&&(i=G(a.get()),this._removeClass(a,t),i.addClass(this._classes({element:i,keys:t,classes:e,add:!0})))},_setOptionDisabled:function(e){this._toggleClass(this.widget(),this.widgetFullName+"-disabled",null,!!e),e&&(this._removeClass(this.hoverable,null,"ui-state-hover"),this._removeClass(this.focusable,null,"ui-state-focus"))},enable:function(){return this._setOptions({disabled:!1})},disable:function(){return this._setOptions({disabled:!0})},_classes:function(s){var n=[],r=this;function e(e,t){for(var i,a=0;a<e.length;a++)i=r.classesElementLookup[e[a]]||G(),i=s.add?(function(){var i=[];s.element.each(function(e,t){G.map(r.classesElementLookup,function(e){return e}).some(function(e){return e.is(t)})||i.push(t)}),r._on(G(i),{remove:"_untrackClassesElement"})}(),G(G.uniqueSort(i.get().concat(s.element.get())))):G(i.not(s.element).get()),r.classesElementLookup[e[a]]=i,n.push(e[a]),t&&s.classes[e[a]]&&n.push(s.classes[e[a]])}return(s=G.extend({element:this.element,classes:this.options.classes||{}},s)).keys&&e(s.keys.match(/\S+/g)||[],!0),s.extra&&e(s.extra.match(/\S+/g)||[]),n.join(" ")},_untrackClassesElement:function(i){var a=this;G.each(a.classesElementLookup,function(e,t){-1!==G.inArray(i.target,t)&&(a.classesElementLookup[e]=G(t.not(i.target).get()))}),this._off(G(i.target))},_removeClass:function(e,t,i){return this._toggleClass(e,t,i,!1)},_addClass:function(e,t,i){return this._toggleClass(e,t,i,!0)},_toggleClass:function(e,t,i,a){var s="string"==typeof e||null===e,i={extra:s?t:i,keys:s?e:t,element:s?this.element:e,add:a="boolean"==typeof a?a:i};return i.element.toggleClass(this._classes(i),a),this},_on:function(s,n,e){var r,o=this;"boolean"!=typeof s&&(e=n,n=s,s=!1),e?(n=r=G(n),this.bindings=this.bindings.add(n)):(e=n,n=this.element,r=this.widget()),G.each(e,function(e,t){function i(){if(s||!0!==o.options.disabled&&!G(this).hasClass("ui-state-disabled"))return("string"==typeof t?o[t]:t).apply(o,arguments)}"string"!=typeof t&&(i.guid=t.guid=t.guid||i.guid||G.guid++);var a=e.match(/^([\w:-]*)\s*(.*)$/),e=a[1]+o.eventNamespace,a=a[2];a?r.on(e,a,i):n.on(e,i)})},_off:function(e,t){t=(t||"").split(" ").join(this.eventNamespace+" ")+this.eventNamespace,e.off(t),this.bindings=G(this.bindings.not(e).get()),this.focusable=G(this.focusable.not(e).get()),this.hoverable=G(this.hoverable.not(e).get())},_delay:function(e,t){var i=this;return setTimeout(function(){return("string"==typeof e?i[e]:e).apply(i,arguments)},t||0)},_hoverable:function(e){this.hoverable=this.hoverable.add(e),this._on(e,{mouseenter:function(e){this._addClass(G(e.currentTarget),null,"ui-state-hover")},mouseleave:function(e){this._removeClass(G(e.currentTarget),null,"ui-state-hover")}})},_focusable:function(e){this.focusable=this.focusable.add(e),this._on(e,{focusin:function(e){this._addClass(G(e.currentTarget),null,"ui-state-focus")},focusout:function(e){this._removeClass(G(e.currentTarget),null,"ui-state-focus")}})},_trigger:function(e,t,i){var a,s,n=this.options[e];if(i=i||{},(t=G.Event(t)).type=(e===this.widgetEventPrefix?e:this.widgetEventPrefix+e).toLowerCase(),t.target=this.element[0],s=t.originalEvent)for(a in s)a in t||(t[a]=s[a]);return this.element.trigger(t,i),!("function"==typeof n&&!1===n.apply(this.element[0],[t].concat(i))||t.isDefaultPrevented())}},G.each({show:"fadeIn",hide:"fadeOut"},function(n,r){G.Widget.prototype["_"+n]=function(t,e,i){var a,s=(e="string"==typeof e?{effect:e}:e)?!0!==e&&"number"!=typeof e&&e.effect||r:n;"number"==typeof(e=e||{})?e={duration:e}:!0===e&&(e={}),a=!G.isEmptyObject(e),e.complete=i,e.delay&&t.delay(e.delay),a&&G.effects&&G.effects.effect[s]?t[n](e):s!==n&&t[s]?t[s](e.duration,e.easing,i):t.queue(function(e){G(this)[n](),i&&i.call(t[0]),e()})}});var l;G.widget,G.ui.keyCode={BACKSPACE:8,COMMA:188,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,LEFT:37,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SPACE:32,TAB:9,UP:38};function e(){this._curInst=null,this._keyEvent=!1,this._disabledInputs=[],this._datepickerShowing=!1,this._inDialog=!1,this._mainDivId="ui-datepicker-div",this._inlineClass="ui-datepicker-inline",this._appendClass="ui-datepicker-append",this._triggerClass="ui-datepicker-trigger",this._dialogClass="ui-datepicker-dialog",this._disableClass="ui-datepicker-disabled",this._unselectableClass="ui-datepicker-unselectable",this._currentClass="ui-datepicker-current-day",this._dayOverClass="ui-datepicker-days-cell-over",this.regional=[],this.regional[""]={closeText:"Done",prevText:"Prev",nextText:"Next",currentText:"Today",monthNames:["January","February","March","April","May","June","July","August","September","October","November","December"],monthNamesShort:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],dayNames:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],dayNamesShort:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],dayNamesMin:["Su","Mo","Tu","We","Th","Fr","Sa"],weekHeader:"Wk",dateFormat:"mm/dd/yy",firstDay:0,isRTL:!1,showMonthAfterYear:!1,yearSuffix:"",selectMonthLabel:"Select month",selectYearLabel:"Select year"},this._defaults={showOn:"focus",showAnim:"fadeIn",showOptions:{},defaultDate:null,appendText:"",buttonText:"...",buttonImage:"",buttonImageOnly:!1,hideIfNoPrevNext:!1,navigationAsDateFormat:!1,gotoCurrent:!1,changeMonth:!1,changeYear:!1,yearRange:"c-10:c+10",showOtherMonths:!1,selectOtherMonths:!1,showWeek:!1,calculateWeek:this.iso8601Week,shortYearCutoff:"+10",minDate:null,maxDate:null,duration:"fast",beforeShowDay:null,beforeShow:null,onSelect:null,onChangeMonthYear:null,onClose:null,onUpdateDatepicker:null,numberOfMonths:1,showCurrentAtPos:0,stepMonths:1,stepBigMonths:12,altField:"",altFormat:"",constrainInput:!0,showButtonPanel:!1,autoSize:!1,disabled:!1},G.extend(this._defaults,this.regional[""]),this.regional.en=G.extend(!0,{},this.regional[""]),this.regional["en-US"]=G.extend(!0,{},this.regional.en),this.dpDiv=a(G("<div id='"+this._mainDivId+"' class='ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all'></div>"))}function a(e){var t="button, .ui-datepicker-prev, .ui-datepicker-next, .ui-datepicker-calendar td a";return e.on("mouseout",t,function(){G(this).removeClass("ui-state-hover"),-1!==this.className.indexOf("ui-datepicker-prev")&&G(this).removeClass("ui-datepicker-prev-hover"),-1!==this.className.indexOf("ui-datepicker-next")&&G(this).removeClass("ui-datepicker-next-hover")}).on("mouseover",t,h)}function h(){G.datepicker._isDisabledDatepicker((l.inline?l.dpDiv.parent():l.input)[0])||(G(this).parents(".ui-datepicker-calendar").find("a").removeClass("ui-state-hover"),G(this).addClass("ui-state-hover"),-1!==this.className.indexOf("ui-datepicker-prev")&&G(this).addClass("ui-datepicker-prev-hover"),-1!==this.className.indexOf("ui-datepicker-next")&&G(this).addClass("ui-datepicker-next-hover"))}function u(e,t){for(var i in G.extend(e,t),t)null==t[i]&&(e[i]=t[i]);return e}G.extend(G.ui,{datepicker:{version:"1.13.1"}}),G.extend(e.prototype,{markerClassName:"hasDatepicker",maxRows:4,_widgetDatepicker:function(){return this.dpDiv},setDefaults:function(e){return u(this._defaults,e||{}),this},_attachDatepicker:function(e,t){var i,a=e.nodeName.toLowerCase(),s="div"===a||"span"===a;e.id||(this.uuid+=1,e.id="dp"+this.uuid),(i=this._newInst(G(e),s)).settings=G.extend({},t||{}),"input"===a?this._connectDatepicker(e,i):s&&this._inlineDatepicker(e,i)},_newInst:function(e,t){return{id:e[0].id.replace(/([^A-Za-z0-9_\-])/g,"\\\\$1"),input:e,selectedDay:0,selectedMonth:0,selectedYear:0,drawMonth:0,drawYear:0,inline:t,dpDiv:t?a(G("<div class='"+this._inlineClass+" ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all'></div>")):this.dpDiv}},_connectDatepicker:function(e,t){var i=G(e);t.append=G([]),t.trigger=G([]),i.hasClass(this.markerClassName)||(this._attachments(i,t),i.addClass(this.markerClassName).on("keydown",this._doKeyDown).on("keypress",this._doKeyPress).on("keyup",this._doKeyUp),this._autoSize(t),G.data(e,"datepicker",t),t.settings.disabled&&this._disableDatepicker(e))},_attachments:function(e,t){var i,a=this._get(t,"appendText"),s=this._get(t,"isRTL");t.append&&t.append.remove(),a&&(t.append=G("<span>").addClass(this._appendClass).text(a),e[s?"before":"after"](t.append)),e.off("focus",this._showDatepicker),t.trigger&&t.trigger.remove(),"focus"!==(i=this._get(t,"showOn"))&&"both"!==i||e.on("focus",this._showDatepicker),"button"!==i&&"both"!==i||(a=this._get(t,"buttonText"),i=this._get(t,"buttonImage"),this._get(t,"buttonImageOnly")?t.trigger=G("<img>").addClass(this._triggerClass).attr({src:i,alt:a,title:a}):(t.trigger=G("<button type='button'>").addClass(this._triggerClass),i?t.trigger.html(G("<img>").attr({src:i,alt:a,title:a})):t.trigger.text(a)),e[s?"before":"after"](t.trigger),t.trigger.on("click",function(){return G.datepicker._datepickerShowing&&G.datepicker._lastInput===e[0]?G.datepicker._hideDatepicker():(G.datepicker._datepickerShowing&&G.datepicker._lastInput!==e[0]&&G.datepicker._hideDatepicker(),G.datepicker._showDatepicker(e[0])),!1}))},_autoSize:function(e){var t,i,a,s,n,r;this._get(e,"autoSize")&&!e.inline&&(n=new Date(2009,11,20),(r=this._get(e,"dateFormat")).match(/[DM]/)&&(t=function(e){for(s=a=i=0;s<e.length;s++)e[s].length>i&&(i=e[s].length,a=s);return a},n.setMonth(t(this._get(e,r.match(/MM/)?"monthNames":"monthNamesShort"))),n.setDate(t(this._get(e,r.match(/DD/)?"dayNames":"dayNamesShort"))+20-n.getDay())),e.input.attr("size",this._formatDate(e,n).length))},_inlineDatepicker:function(e,t){var i=G(e);i.hasClass(this.markerClassName)||(i.addClass(this.markerClassName).append(t.dpDiv),G.data(e,"datepicker",t),this._setDate(t,this._getDefaultDate(t),!0),this._updateDatepicker(t),this._updateAlternate(t),t.settings.disabled&&this._disableDatepicker(e),t.dpDiv.css("display","block"))},_dialogDatepicker:function(e,t,i,a,s){var n,r=this._dialogInst;return r||(this.uuid+=1,n="dp"+this.uuid,this._dialogInput=G("<input type='text' id='"+n+"' style='position: absolute; top: -100px; width: 0px;'/>"),this._dialogInput.on("keydown",this._doKeyDown),G("body").append(this._dialogInput),(r=this._dialogInst=this._newInst(this._dialogInput,!1)).settings={},G.data(this._dialogInput[0],"datepicker",r)),u(r.settings,a||{}),t=t&&t.constructor===Date?this._formatDate(r,t):t,this._dialogInput.val(t),this._pos=s?s.length?s:[s.pageX,s.pageY]:null,this._pos||(n=document.documentElement.clientWidth,a=document.documentElement.clientHeight,t=document.documentElement.scrollLeft||document.body.scrollLeft,s=document.documentElement.scrollTop||document.body.scrollTop,this._pos=[n/2-100+t,a/2-150+s]),this._dialogInput.css("left",this._pos[0]+20+"px").css("top",this._pos[1]+"px"),r.settings.onSelect=i,this._inDialog=!0,this.dpDiv.addClass(this._dialogClass),this._showDatepicker(this._dialogInput[0]),G.blockUI&&G.blockUI(this.dpDiv),G.data(this._dialogInput[0],"datepicker",r),this},_destroyDatepicker:function(e){var t,i=G(e),a=G.data(e,"datepicker");i.hasClass(this.markerClassName)&&(t=e.nodeName.toLowerCase(),G.removeData(e,"datepicker"),"input"===t?(a.append.remove(),a.trigger.remove(),i.removeClass(this.markerClassName).off("focus",this._showDatepicker).off("keydown",this._doKeyDown).off("keypress",this._doKeyPress).off("keyup",this._doKeyUp)):"div"!==t&&"span"!==t||i.removeClass(this.markerClassName).empty(),l===a&&(l=null,this._curInst=null))},_enableDatepicker:function(t){var e,i=G(t),a=G.data(t,"datepicker");i.hasClass(this.markerClassName)&&("input"===(e=t.nodeName.toLowerCase())?(t.disabled=!1,a.trigger.filter("button").each(function(){this.disabled=!1}).end().filter("img").css({opacity:"1.0",cursor:""})):"div"!==e&&"span"!==e||((i=i.children("."+this._inlineClass)).children().removeClass("ui-state-disabled"),i.find("select.ui-datepicker-month, select.ui-datepicker-year").prop("disabled",!1)),this._disabledInputs=G.map(this._disabledInputs,function(e){return e===t?null:e}))},_disableDatepicker:function(t){var e,i=G(t),a=G.data(t,"datepicker");i.hasClass(this.markerClassName)&&("input"===(e=t.nodeName.toLowerCase())?(t.disabled=!0,a.trigger.filter("button").each(function(){this.disabled=!0}).end().filter("img").css({opacity:"0.5",cursor:"default"})):"div"!==e&&"span"!==e||((i=i.children("."+this._inlineClass)).children().addClass("ui-state-disabled"),i.find("select.ui-datepicker-month, select.ui-datepicker-year").prop("disabled",!0)),this._disabledInputs=G.map(this._disabledInputs,function(e){return e===t?null:e}),this._disabledInputs[this._disabledInputs.length]=t)},_isDisabledDatepicker:function(e){if(!e)return!1;for(var t=0;t<this._disabledInputs.length;t++)if(this._disabledInputs[t]===e)return!0;return!1},_getInst:function(e){try{return G.data(e,"datepicker")}catch(e){throw"Missing instance data for this datepicker"}},_optionDatepicker:function(e,t,i){var a,s,n=this._getInst(e);if(2===arguments.length&&"string"==typeof t)return"defaults"===t?G.extend({},G.datepicker._defaults):n?"all"===t?G.extend({},n.settings):this._get(n,t):null;a=t||{},"string"==typeof t&&((a={})[t]=i),n&&(this._curInst===n&&this._hideDatepicker(),s=this._getDateDatepicker(e,!0),t=this._getMinMaxDate(n,"min"),i=this._getMinMaxDate(n,"max"),u(n.settings,a),null!==t&&void 0!==a.dateFormat&&void 0===a.minDate&&(n.settings.minDate=this._formatDate(n,t)),null!==i&&void 0!==a.dateFormat&&void 0===a.maxDate&&(n.settings.maxDate=this._formatDate(n,i)),"disabled"in a&&(a.disabled?this._disableDatepicker(e):this._enableDatepicker(e)),this._attachments(G(e),n),this._autoSize(n),this._setDate(n,s),this._updateAlternate(n),this._updateDatepicker(n))},_changeDatepicker:function(e,t,i){this._optionDatepicker(e,t,i)},_refreshDatepicker:function(e){e=this._getInst(e);e&&this._updateDatepicker(e)},_setDateDatepicker:function(e,t){e=this._getInst(e);e&&(this._setDate(e,t),this._updateDatepicker(e),this._updateAlternate(e))},_getDateDatepicker:function(e,t){e=this._getInst(e);return e&&!e.inline&&this._setDateFromField(e,t),e?this._getDate(e):null},_doKeyDown:function(e){var t,i,a=G.datepicker._getInst(e.target),s=!0,n=a.dpDiv.is(".ui-datepicker-rtl");if(a._keyEvent=!0,G.datepicker._datepickerShowing)switch(e.keyCode){case 9:G.datepicker._hideDatepicker(),s=!1;break;case 13:return(i=G("td."+G.datepicker._dayOverClass+":not(."+G.datepicker._currentClass+")",a.dpDiv))[0]&&G.datepicker._selectDay(e.target,a.selectedMonth,a.selectedYear,i[0]),(t=G.datepicker._get(a,"onSelect"))?(i=G.datepicker._formatDate(a),t.apply(a.input?a.input[0]:null,[i,a])):G.datepicker._hideDatepicker(),!1;case 27:G.datepicker._hideDatepicker();break;case 33:G.datepicker._adjustDate(e.target,e.ctrlKey?-G.datepicker._get(a,"stepBigMonths"):-G.datepicker._get(a,"stepMonths"),"M");break;case 34:G.datepicker._adjustDate(e.target,e.ctrlKey?+G.datepicker._get(a,"stepBigMonths"):+G.datepicker._get(a,"stepMonths"),"M");break;case 35:(e.ctrlKey||e.metaKey)&&G.datepicker._clearDate(e.target),s=e.ctrlKey||e.metaKey;break;case 36:(e.ctrlKey||e.metaKey)&&G.datepicker._gotoToday(e.target),s=e.ctrlKey||e.metaKey;break;case 37:(e.ctrlKey||e.metaKey)&&G.datepicker._adjustDate(e.target,n?1:-1,"D"),s=e.ctrlKey||e.metaKey,e.originalEvent.altKey&&G.datepicker._adjustDate(e.target,e.ctrlKey?-G.datepicker._get(a,"stepBigMonths"):-G.datepicker._get(a,"stepMonths"),"M");break;case 38:(e.ctrlKey||e.metaKey)&&G.datepicker._adjustDate(e.target,-7,"D"),s=e.ctrlKey||e.metaKey;break;case 39:(e.ctrlKey||e.metaKey)&&G.datepicker._adjustDate(e.target,n?-1:1,"D"),s=e.ctrlKey||e.metaKey,e.originalEvent.altKey&&G.datepicker._adjustDate(e.target,e.ctrlKey?+G.datepicker._get(a,"stepBigMonths"):+G.datepicker._get(a,"stepMonths"),"M");break;case 40:(e.ctrlKey||e.metaKey)&&G.datepicker._adjustDate(e.target,7,"D"),s=e.ctrlKey||e.metaKey;break;default:s=!1}else 36===e.keyCode&&e.ctrlKey?G.datepicker._showDatepicker(this):s=!1;s&&(e.preventDefault(),e.stopPropagation())},_doKeyPress:function(e){var t,i=G.datepicker._getInst(e.target);if(G.datepicker._get(i,"constrainInput"))return t=G.datepicker._possibleChars(G.datepicker._get(i,"dateFormat")),i=String.fromCharCode(null==e.charCode?e.keyCode:e.charCode),e.ctrlKey||e.metaKey||i<" "||!t||-1<t.indexOf(i)},_doKeyUp:function(e){e=G.datepicker._getInst(e.target);if(e.input.val()!==e.lastVal)try{G.datepicker.parseDate(G.datepicker._get(e,"dateFormat"),e.input?e.input.val():null,G.datepicker._getFormatConfig(e))&&(G.datepicker._setDateFromField(e),G.datepicker._updateAlternate(e),G.datepicker._updateDatepicker(e))}catch(e){}return!0},_showDatepicker:function(e){var t,i,a,s;"input"!==(e=e.target||e).nodeName.toLowerCase()&&(e=G("input",e.parentNode)[0]),G.datepicker._isDisabledDatepicker(e)||G.datepicker._lastInput===e||(s=G.datepicker._getInst(e),G.datepicker._curInst&&G.datepicker._curInst!==s&&(G.datepicker._curInst.dpDiv.stop(!0,!0),s&&G.datepicker._datepickerShowing&&G.datepicker._hideDatepicker(G.datepicker._curInst.input[0])),!1!==(i=(a=G.datepicker._get(s,"beforeShow"))?a.apply(e,[e,s]):{})&&(u(s.settings,i),s.lastVal=null,G.datepicker._lastInput=e,G.datepicker._setDateFromField(s),G.datepicker._inDialog&&(e.value=""),G.datepicker._pos||(G.datepicker._pos=G.datepicker._findPos(e),G.datepicker._pos[1]+=e.offsetHeight),t=!1,G(e).parents().each(function(){return!(t|="fixed"===G(this).css("position"))}),a={left:G.datepicker._pos[0],top:G.datepicker._pos[1]},G.datepicker._pos=null,s.dpDiv.empty(),s.dpDiv.css({position:"absolute",display:"block",top:"-1000px"}),G.datepicker._updateDatepicker(s),a=G.datepicker._checkOffset(s,a,t),s.dpDiv.css({position:G.datepicker._inDialog&&G.blockUI?"static":t?"fixed":"absolute",display:"none",left:a.left+"px",top:a.top+"px"}),s.inline||(i=G.datepicker._get(s,"showAnim"),a=G.datepicker._get(s,"duration"),s.dpDiv.css("z-index",function(e){for(var t,i;e.length&&e[0]!==document;){if(("absolute"===(t=e.css("position"))||"relative"===t||"fixed"===t)&&(i=parseInt(e.css("zIndex"),10),!isNaN(i)&&0!==i))return i;e=e.parent()}return 0}(G(e))+1),G.datepicker._datepickerShowing=!0,G.effects&&G.effects.effect[i]?s.dpDiv.show(i,G.datepicker._get(s,"showOptions"),a):s.dpDiv[i||"show"](i?a:null),G.datepicker._shouldFocusInput(s)&&s.input.trigger("focus"),G.datepicker._curInst=s)))},_updateDatepicker:function(e){this.maxRows=4,(l=e).dpDiv.empty().append(this._generateHTML(e)),this._attachHandlers(e);var t,i=this._getNumberOfMonths(e),a=i[1],s=e.dpDiv.find("."+this._dayOverClass+" a"),n=G.datepicker._get(e,"onUpdateDatepicker");0<s.length&&h.apply(s.get(0)),e.dpDiv.removeClass("ui-datepicker-multi-2 ui-datepicker-multi-3 ui-datepicker-multi-4").width(""),1<a&&e.dpDiv.addClass("ui-datepicker-multi-"+a).css("width",17*a+"em"),e.dpDiv[(1!==i[0]||1!==i[1]?"add":"remove")+"Class"]("ui-datepicker-multi"),e.dpDiv[(this._get(e,"isRTL")?"add":"remove")+"Class"]("ui-datepicker-rtl"),e===G.datepicker._curInst&&G.datepicker._datepickerShowing&&G.datepicker._shouldFocusInput(e)&&e.input.trigger("focus"),e.yearshtml&&(t=e.yearshtml,setTimeout(function(){t===e.yearshtml&&e.yearshtml&&e.dpDiv.find("select.ui-datepicker-year").first().replaceWith(e.yearshtml),t=e.yearshtml=null},0)),n&&n.apply(e.input?e.input[0]:null,[e])},_shouldFocusInput:function(e){return e.input&&e.input.is(":visible")&&!e.input.is(":disabled")&&!e.input.is(":focus")},_checkOffset:function(e,t,i){var a=e.dpDiv.outerWidth(),s=e.dpDiv.outerHeight(),n=e.input?e.input.outerWidth():0,r=e.input?e.input.outerHeight():0,o=document.documentElement.clientWidth+(i?0:G(document).scrollLeft()),l=document.documentElement.clientHeight+(i?0:G(document).scrollTop());return t.left-=this._get(e,"isRTL")?a-n:0,t.left-=i&&t.left===e.input.offset().left?G(document).scrollLeft():0,t.top-=i&&t.top===e.input.offset().top+r?G(document).scrollTop():0,t.left-=Math.min(t.left,t.left+a>o&&a<o?Math.abs(t.left+a-o):0),t.top-=Math.min(t.top,t.top+s>l&&s<l?Math.abs(s+r):0),t},_findPos:function(e){for(var t=this._getInst(e),i=this._get(t,"isRTL");e&&("hidden"===e.type||1!==e.nodeType||G.expr.pseudos.hidden(e));)e=e[i?"previousSibling":"nextSibling"];return[(t=G(e).offset()).left,t.top]},_hideDatepicker:function(e){var t,i,a=this._curInst;!a||e&&a!==G.data(e,"datepicker")||this._datepickerShowing&&(t=this._get(a,"showAnim"),i=this._get(a,"duration"),e=function(){G.datepicker._tidyDialog(a)},G.effects&&(G.effects.effect[t]||G.effects[t])?a.dpDiv.hide(t,G.datepicker._get(a,"showOptions"),i,e):a.dpDiv["slideDown"===t?"slideUp":"fadeIn"===t?"fadeOut":"hide"](t?i:null,e),t||e(),this._datepickerShowing=!1,(e=this._get(a,"onClose"))&&e.apply(a.input?a.input[0]:null,[a.input?a.input.val():"",a]),this._lastInput=null,this._inDialog&&(this._dialogInput.css({position:"absolute",left:"0",top:"-100px"}),G.blockUI&&(G.unblockUI(),G("body").append(this.dpDiv))),this._inDialog=!1)},_tidyDialog:function(e){e.dpDiv.removeClass(this._dialogClass).off(".ui-datepicker-calendar")},_checkExternalClick:function(e){var t;G.datepicker._curInst&&(t=G(e.target),e=G.datepicker._getInst(t[0]),(t[0].id===G.datepicker._mainDivId||0!==t.parents("#"+G.datepicker._mainDivId).length||t.hasClass(G.datepicker.markerClassName)||t.closest("."+G.datepicker._triggerClass).length||!G.datepicker._datepickerShowing||G.datepicker._inDialog&&G.blockUI)&&(!t.hasClass(G.datepicker.markerClassName)||G.datepicker._curInst===e)||G.datepicker._hideDatepicker())},_adjustDate:function(e,t,i){var a=G(e),e=this._getInst(a[0]);this._isDisabledDatepicker(a[0])||(this._adjustInstDate(e,t,i),this._updateDatepicker(e))},_gotoToday:function(e){var t=G(e),i=this._getInst(t[0]);this._get(i,"gotoCurrent")&&i.currentDay?(i.selectedDay=i.currentDay,i.drawMonth=i.selectedMonth=i.currentMonth,i.drawYear=i.selectedYear=i.currentYear):(e=new Date,i.selectedDay=e.getDate(),i.drawMonth=i.selectedMonth=e.getMonth(),i.drawYear=i.selectedYear=e.getFullYear()),this._notifyChange(i),this._adjustDate(t)},_selectMonthYear:function(e,t,i){var a=G(e),e=this._getInst(a[0]);e["selected"+("M"===i?"Month":"Year")]=e["draw"+("M"===i?"Month":"Year")]=parseInt(t.options[t.selectedIndex].value,10),this._notifyChange(e),this._adjustDate(a)},_selectDay:function(e,t,i,a){var s=G(e);G(a).hasClass(this._unselectableClass)||this._isDisabledDatepicker(s[0])||((s=this._getInst(s[0])).selectedDay=s.currentDay=parseInt(G("a",a).attr("data-date")),s.selectedMonth=s.currentMonth=t,s.selectedYear=s.currentYear=i,this._selectDate(e,this._formatDate(s,s.currentDay,s.currentMonth,s.currentYear)))},_clearDate:function(e){e=G(e);this._selectDate(e,"")},_selectDate:function(e,t){var i=G(e),e=this._getInst(i[0]);t=null!=t?t:this._formatDate(e),e.input&&e.input.val(t),this._updateAlternate(e),(i=this._get(e,"onSelect"))?i.apply(e.input?e.input[0]:null,[t,e]):e.input&&e.input.trigger("change"),e.inline?this._updateDatepicker(e):(this._hideDatepicker(),this._lastInput=e.input[0],"object"!=typeof e.input[0]&&e.input.trigger("focus"),this._lastInput=null)},_updateAlternate:function(e){var t,i,a=this._get(e,"altField");a&&(t=this._get(e,"altFormat")||this._get(e,"dateFormat"),i=this._getDate(e),e=this.formatDate(t,i,this._getFormatConfig(e)),G(document).find(a).val(e))},noWeekends:function(e){e=e.getDay();return[0<e&&e<6,""]},iso8601Week:function(e){var t=new Date(e.getTime());return t.setDate(t.getDate()+4-(t.getDay()||7)),e=t.getTime(),t.setMonth(0),t.setDate(1),Math.floor(Math.round((e-t)/864e5)/7)+1},parseDate:function(t,s,e){if(null==t||null==s)throw"Invalid arguments";if(""===(s="object"==typeof s?s.toString():s+""))return null;for(var i,a,n,r=0,o=(e?e.shortYearCutoff:null)||this._defaults.shortYearCutoff,o="string"!=typeof o?o:(new Date).getFullYear()%100+parseInt(o,10),l=(e?e.dayNamesShort:null)||this._defaults.dayNamesShort,h=(e?e.dayNames:null)||this._defaults.dayNames,u=(e?e.monthNamesShort:null)||this._defaults.monthNamesShort,d=(e?e.monthNames:null)||this._defaults.monthNames,c=-1,p=-1,g=-1,_=-1,f=!1,m=function(e){e=y+1<t.length&&t.charAt(y+1)===e;return e&&y++,e},v=function(e){var t=m(e),t="@"===e?14:"!"===e?20:"y"===e&&t?4:"o"===e?3:2,t=new RegExp("^\\d{"+("y"===e?t:1)+","+t+"}"),t=s.substring(r).match(t);if(!t)throw"Missing number at position "+r;return r+=t[0].length,parseInt(t[0],10)},k=function(e,t,i){var a=-1,t=G.map(m(e)?i:t,function(e,t){return[[t,e]]}).sort(function(e,t){return-(e[1].length-t[1].length)});if(G.each(t,function(e,t){var i=t[1];if(s.substr(r,i.length).toLowerCase()===i.toLowerCase())return a=t[0],r+=i.length,!1}),-1!==a)return a+1;throw"Unknown name at position "+r},D=function(){if(s.charAt(r)!==t.charAt(y))throw"Unexpected literal at position "+r;r++},y=0;y<t.length;y++)if(f)"'"!==t.charAt(y)||m("'")?D():f=!1;else switch(t.charAt(y)){case"d":g=v("d");break;case"D":k("D",l,h);break;case"o":_=v("o");break;case"m":p=v("m");break;case"M":p=k("M",u,d);break;case"y":c=v("y");break;case"@":c=(n=new Date(v("@"))).getFullYear(),p=n.getMonth()+1,g=n.getDate();break;case"!":c=(n=new Date((v("!")-this._ticksTo1970)/1e4)).getFullYear(),p=n.getMonth()+1,g=n.getDate();break;case"'":m("'")?D():f=!0;break;default:D()}if(r<s.length&&(a=s.substr(r),!/^\s+/.test(a)))throw"Extra/unparsed characters found in date: "+a;if(-1===c?c=(new Date).getFullYear():c<100&&(c+=(new Date).getFullYear()-(new Date).getFullYear()%100+(c<=o?0:-100)),-1<_)for(p=1,g=_;;){if(g<=(i=this._getDaysInMonth(c,p-1)))break;p++,g-=i}if((n=this._daylightSavingAdjust(new Date(c,p-1,g))).getFullYear()!==c||n.getMonth()+1!==p||n.getDate()!==g)throw"Invalid date";return n},ATOM:"yy-mm-dd",COOKIE:"D, dd M yy",ISO_8601:"yy-mm-dd",RFC_822:"D, d M y",RFC_850:"DD, dd-M-y",RFC_1036:"D, d M y",RFC_1123:"D, d M yy",RFC_2822:"D, d M yy",RSS:"D, d M y",TICKS:"!",TIMESTAMP:"@",W3C:"yy-mm-dd",_ticksTo1970:24*(718685+Math.floor(492.5)-Math.floor(19.7)+Math.floor(4.925))*60*60*1e7,formatDate:function(t,e,i){if(!e)return"";function a(e,t,i){var a=""+t;if(u(e))for(;a.length<i;)a="0"+a;return a}function s(e,t,i,a){return(u(e)?a:i)[t]}var n,r=(i?i.dayNamesShort:null)||this._defaults.dayNamesShort,o=(i?i.dayNames:null)||this._defaults.dayNames,l=(i?i.monthNamesShort:null)||this._defaults.monthNamesShort,h=(i?i.monthNames:null)||this._defaults.monthNames,u=function(e){e=n+1<t.length&&t.charAt(n+1)===e;return e&&n++,e},d="",c=!1;if(e)for(n=0;n<t.length;n++)if(c)"'"!==t.charAt(n)||u("'")?d+=t.charAt(n):c=!1;else switch(t.charAt(n)){case"d":d+=a("d",e.getDate(),2);break;case"D":d+=s("D",e.getDay(),r,o);break;case"o":d+=a("o",Math.round((new Date(e.getFullYear(),e.getMonth(),e.getDate()).getTime()-new Date(e.getFullYear(),0,0).getTime())/864e5),3);break;case"m":d+=a("m",e.getMonth()+1,2);break;case"M":d+=s("M",e.getMonth(),l,h);break;case"y":d+=u("y")?e.getFullYear():(e.getFullYear()%100<10?"0":"")+e.getFullYear()%100;break;case"@":d+=e.getTime();break;case"!":d+=1e4*e.getTime()+this._ticksTo1970;break;case"'":u("'")?d+="'":c=!0;break;default:d+=t.charAt(n)}return d},_possibleChars:function(t){for(var e="",i=!1,a=function(e){e=s+1<t.length&&t.charAt(s+1)===e;return e&&s++,e},s=0;s<t.length;s++)if(i)"'"!==t.charAt(s)||a("'")?e+=t.charAt(s):i=!1;else switch(t.charAt(s)){case"d":case"m":case"y":case"@":e+="0123456789";break;case"D":case"M":return null;case"'":a("'")?e+="'":i=!0;break;default:e+=t.charAt(s)}return e},_get:function(e,t){return(void 0!==e.settings[t]?e.settings:this._defaults)[t]},_setDateFromField:function(e,t){if(e.input.val()!==e.lastVal){var i=this._get(e,"dateFormat"),a=e.lastVal=e.input?e.input.val():null,s=this._getDefaultDate(e),n=s,r=this._getFormatConfig(e);try{n=this.parseDate(i,a,r)||s}catch(e){a=t?"":a}e.selectedDay=n.getDate(),e.drawMonth=e.selectedMonth=n.getMonth(),e.drawYear=e.selectedYear=n.getFullYear(),e.currentDay=a?n.getDate():0,e.currentMonth=a?n.getMonth():0,e.currentYear=a?n.getFullYear():0,this._adjustInstDate(e)}},_getDefaultDate:function(e){return this._restrictMinMax(e,this._determineDate(e,this._get(e,"defaultDate"),new Date))},_determineDate:function(o,e,t){var i,a,e=null==e||""===e?t:"string"==typeof e?function(e){try{return G.datepicker.parseDate(G.datepicker._get(o,"dateFormat"),e,G.datepicker._getFormatConfig(o))}catch(e){}for(var t=(e.toLowerCase().match(/^c/)?G.datepicker._getDate(o):null)||new Date,i=t.getFullYear(),a=t.getMonth(),s=t.getDate(),n=/([+\-]?[0-9]+)\s*(d|D|w|W|m|M|y|Y)?/g,r=n.exec(e);r;){switch(r[2]||"d"){case"d":case"D":s+=parseInt(r[1],10);break;case"w":case"W":s+=7*parseInt(r[1],10);break;case"m":case"M":a+=parseInt(r[1],10),s=Math.min(s,G.datepicker._getDaysInMonth(i,a));break;case"y":case"Y":i+=parseInt(r[1],10),s=Math.min(s,G.datepicker._getDaysInMonth(i,a))}r=n.exec(e)}return new Date(i,a,s)}(e):"number"==typeof e?isNaN(e)?t:(i=e,(a=new Date).setDate(a.getDate()+i),a):new Date(e.getTime());return(e=e&&"Invalid Date"===e.toString()?t:e)&&(e.setHours(0),e.setMinutes(0),e.setSeconds(0),e.setMilliseconds(0)),this._daylightSavingAdjust(e)},_daylightSavingAdjust:function(e){return e?(e.setHours(12<e.getHours()?e.getHours()+2:0),e):null},_setDate:function(e,t,i){var a=!t,s=e.selectedMonth,n=e.selectedYear,t=this._restrictMinMax(e,this._determineDate(e,t,new Date));e.selectedDay=e.currentDay=t.getDate(),e.drawMonth=e.selectedMonth=e.currentMonth=t.getMonth(),e.drawYear=e.selectedYear=e.currentYear=t.getFullYear(),s===e.selectedMonth&&n===e.selectedYear||i||this._notifyChange(e),this._adjustInstDate(e),e.input&&e.input.val(a?"":this._formatDate(e))},_getDate:function(e){return!e.currentYear||e.input&&""===e.input.val()?null:this._daylightSavingAdjust(new Date(e.currentYear,e.currentMonth,e.currentDay))},_attachHandlers:function(e){var t=this._get(e,"stepMonths"),i="#"+e.id.replace(/\\\\/g,"\\");e.dpDiv.find("[data-handler]").map(function(){var e={prev:function(){G.datepicker._adjustDate(i,-t,"M")},next:function(){G.datepicker._adjustDate(i,+t,"M")},hide:function(){G.datepicker._hideDatepicker()},today:function(){G.datepicker._gotoToday(i)},selectDay:function(){return G.datepicker._selectDay(i,+this.getAttribute("data-month"),+this.getAttribute("data-year"),this),!1},selectMonth:function(){return G.datepicker._selectMonthYear(i,this,"M"),!1},selectYear:function(){return G.datepicker._selectMonthYear(i,this,"Y"),!1}};G(this).on(this.getAttribute("data-event"),e[this.getAttribute("data-handler")])})},_generateHTML:function(e){var t,i,a,s,n,r,o,l,h,u,d,c,p,g,_,f,m,v,k,D,y,M,w,b,C,x,I,N,S,A,T,O,Y=new Date,F=this._daylightSavingAdjust(new Date(Y.getFullYear(),Y.getMonth(),Y.getDate())),E=this._get(e,"isRTL"),j=this._get(e,"showButtonPanel"),K=this._get(e,"hideIfNoPrevNext"),L=this._get(e,"navigationAsDateFormat"),P=this._getNumberOfMonths(e),W=this._get(e,"showCurrentAtPos"),Y=this._get(e,"stepMonths"),V=1!==P[0]||1!==P[1],H=this._daylightSavingAdjust(e.currentDay?new Date(e.currentYear,e.currentMonth,e.currentDay):new Date(9999,9,9)),R=this._getMinMaxDate(e,"min"),U=this._getMinMaxDate(e,"max"),z=e.drawMonth-W,B=e.drawYear;if(z<0&&(z+=12,B--),U)for(t=this._daylightSavingAdjust(new Date(U.getFullYear(),U.getMonth()-P[0]*P[1]+1,U.getDate())),t=R&&t<R?R:t;this._daylightSavingAdjust(new Date(B,z,1))>t;)--z<0&&(z=11,B--);for(e.drawMonth=z,e.drawYear=B,W=this._get(e,"prevText"),W=L?this.formatDate(W,this._daylightSavingAdjust(new Date(B,z-Y,1)),this._getFormatConfig(e)):W,i=this._canAdjustMonth(e,-1,B,z)?G("<a>").attr({class:"ui-datepicker-prev ui-corner-all","data-handler":"prev","data-event":"click",title:W}).append(G("<span>").addClass("ui-icon ui-icon-circle-triangle-"+(E?"e":"w")).text(W))[0].outerHTML:K?"":G("<a>").attr({class:"ui-datepicker-prev ui-corner-all ui-state-disabled",title:W}).append(G("<span>").addClass("ui-icon ui-icon-circle-triangle-"+(E?"e":"w")).text(W))[0].outerHTML,W=this._get(e,"nextText"),W=L?this.formatDate(W,this._daylightSavingAdjust(new Date(B,z+Y,1)),this._getFormatConfig(e)):W,a=this._canAdjustMonth(e,1,B,z)?G("<a>").attr({class:"ui-datepicker-next ui-corner-all","data-handler":"next","data-event":"click",title:W}).append(G("<span>").addClass("ui-icon ui-icon-circle-triangle-"+(E?"w":"e")).text(W))[0].outerHTML:K?"":G("<a>").attr({class:"ui-datepicker-next ui-corner-all ui-state-disabled",title:W}).append(G("<span>").attr("class","ui-icon ui-icon-circle-triangle-"+(E?"w":"e")).text(W))[0].outerHTML,Y=this._get(e,"currentText"),K=this._get(e,"gotoCurrent")&&e.currentDay?H:F,Y=L?this.formatDate(Y,K,this._getFormatConfig(e)):Y,W="",e.inline||(W=G("<button>").attr({type:"button",class:"ui-datepicker-close ui-state-default ui-priority-primary ui-corner-all","data-handler":"hide","data-event":"click"}).text(this._get(e,"closeText"))[0].outerHTML),L="",j&&(L=G("<div class='ui-datepicker-buttonpane ui-widget-content'>").append(E?W:"").append(this._isInRange(e,K)?G("<button>").attr({type:"button",class:"ui-datepicker-current ui-state-default ui-priority-secondary ui-corner-all","data-handler":"today","data-event":"click"}).text(Y):"").append(E?"":W)[0].outerHTML),s=parseInt(this._get(e,"firstDay"),10),s=isNaN(s)?0:s,n=this._get(e,"showWeek"),r=this._get(e,"dayNames"),o=this._get(e,"dayNamesMin"),l=this._get(e,"monthNames"),h=this._get(e,"monthNamesShort"),u=this._get(e,"beforeShowDay"),d=this._get(e,"showOtherMonths"),c=this._get(e,"selectOtherMonths"),p=this._getDefaultDate(e),g="",f=0;f<P[0];f++){for(m="",this.maxRows=4,v=0;v<P[1];v++){if(k=this._daylightSavingAdjust(new Date(B,z,e.selectedDay)),D=" ui-corner-all",y="",V){if(y+="<div class='ui-datepicker-group",1<P[1])switch(v){case 0:y+=" ui-datepicker-group-first",D=" ui-corner-"+(E?"right":"left");break;case P[1]-1:y+=" ui-datepicker-group-last",D=" ui-corner-"+(E?"left":"right");break;default:y+=" ui-datepicker-group-middle",D=""}y+="'>"}for(y+="<div class='ui-datepicker-header ui-widget-header ui-helper-clearfix"+D+"'>"+(/all|left/.test(D)&&0===f?E?a:i:"")+(/all|right/.test(D)&&0===f?E?i:a:"")+this._generateMonthYearHeader(e,z,B,R,U,0<f||0<v,l,h)+"</div><table class='ui-datepicker-calendar'><thead><tr>",M=n?"<th class='ui-datepicker-week-col'>"+this._get(e,"weekHeader")+"</th>":"",_=0;_<7;_++)M+="<th scope='col'"+(5<=(_+s+6)%7?" class='ui-datepicker-week-end'":"")+"><span title='"+r[w=(_+s)%7]+"'>"+o[w]+"</span></th>";for(y+=M+"</tr></thead><tbody>",C=this._getDaysInMonth(B,z),B===e.selectedYear&&z===e.selectedMonth&&(e.selectedDay=Math.min(e.selectedDay,C)),b=(this._getFirstDayOfMonth(B,z)-s+7)%7,C=Math.ceil((b+C)/7),x=V&&this.maxRows>C?this.maxRows:C,this.maxRows=x,I=this._daylightSavingAdjust(new Date(B,z,1-b)),N=0;N<x;N++){for(y+="<tr>",S=n?"<td class='ui-datepicker-week-col'>"+this._get(e,"calculateWeek")(I)+"</td>":"",_=0;_<7;_++)A=u?u.apply(e.input?e.input[0]:null,[I]):[!0,""],O=(T=I.getMonth()!==z)&&!c||!A[0]||R&&I<R||U&&U<I,S+="<td class='"+(5<=(_+s+6)%7?" ui-datepicker-week-end":"")+(T?" ui-datepicker-other-month":"")+(I.getTime()===k.getTime()&&z===e.selectedMonth&&e._keyEvent||p.getTime()===I.getTime()&&p.getTime()===k.getTime()?" "+this._dayOverClass:"")+(O?" "+this._unselectableClass+" ui-state-disabled":"")+(T&&!d?"":" "+A[1]+(I.getTime()===H.getTime()?" "+this._currentClass:"")+(I.getTime()===F.getTime()?" ui-datepicker-today":""))+"'"+(T&&!d||!A[2]?"":" title='"+A[2].replace(/'/g,"&#39;")+"'")+(O?"":" data-handler='selectDay' data-event='click' data-month='"+I.getMonth()+"' data-year='"+I.getFullYear()+"'")+">"+(T&&!d?"&#xa0;":O?"<span class='ui-state-default'>"+I.getDate()+"</span>":"<a class='ui-state-default"+(I.getTime()===F.getTime()?" ui-state-highlight":"")+(I.getTime()===H.getTime()?" ui-state-active":"")+(T?" ui-priority-secondary":"")+"' href='#' aria-current='"+(I.getTime()===H.getTime()?"true":"false")+"' data-date='"+I.getDate()+"'>"+I.getDate()+"</a>")+"</td>",I.setDate(I.getDate()+1),I=this._daylightSavingAdjust(I);y+=S+"</tr>"}11<++z&&(z=0,B++),m+=y+="</tbody></table>"+(V?"</div>"+(0<P[0]&&v===P[1]-1?"<div class='ui-datepicker-row-break'></div>":""):"")}g+=m}return g+=L,e._keyEvent=!1,g},_generateMonthYearHeader:function(e,t,i,a,s,n,r,o){var l,h,u,d,c,p,g=this._get(e,"changeMonth"),_=this._get(e,"changeYear"),f=this._get(e,"showMonthAfterYear"),m=this._get(e,"selectMonthLabel"),v=this._get(e,"selectYearLabel"),k="<div class='ui-datepicker-title'>",D="";if(n||!g)D+="<span class='ui-datepicker-month'>"+r[t]+"</span>";else{for(l=a&&a.getFullYear()===i,h=s&&s.getFullYear()===i,D+="<select class='ui-datepicker-month' aria-label='"+m+"' data-handler='selectMonth' data-event='change'>",u=0;u<12;u++)(!l||u>=a.getMonth())&&(!h||u<=s.getMonth())&&(D+="<option value='"+u+"'"+(u===t?" selected='selected'":"")+">"+o[u]+"</option>");D+="</select>"}if(f||(k+=D+(!n&&g&&_?"":"&#xa0;")),!e.yearshtml)if(e.yearshtml="",n||!_)k+="<span class='ui-datepicker-year'>"+i+"</span>";else{for(r=this._get(e,"yearRange").split(":"),d=(new Date).getFullYear(),c=(m=function(e){e=e.match(/c[+\-].*/)?i+parseInt(e.substring(1),10):e.match(/[+\-].*/)?d+parseInt(e,10):parseInt(e,10);return isNaN(e)?d:e})(r[0]),p=Math.max(c,m(r[1]||"")),c=a?Math.max(c,a.getFullYear()):c,p=s?Math.min(p,s.getFullYear()):p,e.yearshtml+="<select class='ui-datepicker-year' aria-label='"+v+"' data-handler='selectYear' data-event='change'>";c<=p;c++)e.yearshtml+="<option value='"+c+"'"+(c===i?" selected='selected'":"")+">"+c+"</option>";e.yearshtml+="</select>",k+=e.yearshtml,e.yearshtml=null}return k+=this._get(e,"yearSuffix"),f&&(k+=(!n&&g&&_?"":"&#xa0;")+D),k+="</div>"},_adjustInstDate:function(e,t,i){var a=e.selectedYear+("Y"===i?t:0),s=e.selectedMonth+("M"===i?t:0),t=Math.min(e.selectedDay,this._getDaysInMonth(a,s))+("D"===i?t:0),t=this._restrictMinMax(e,this._daylightSavingAdjust(new Date(a,s,t)));e.selectedDay=t.getDate(),e.drawMonth=e.selectedMonth=t.getMonth(),e.drawYear=e.selectedYear=t.getFullYear(),"M"!==i&&"Y"!==i||this._notifyChange(e)},_restrictMinMax:function(e,t){var i=this._getMinMaxDate(e,"min"),e=this._getMinMaxDate(e,"max"),t=i&&t<i?i:t;return e&&e<t?e:t},_notifyChange:function(e){var t=this._get(e,"onChangeMonthYear");t&&t.apply(e.input?e.input[0]:null,[e.selectedYear,e.selectedMonth+1,e])},_getNumberOfMonths:function(e){e=this._get(e,"numberOfMonths");return null==e?[1,1]:"number"==typeof e?[1,e]:e},_getMinMaxDate:function(e,t){return this._determineDate(e,this._get(e,t+"Date"),null)},_getDaysInMonth:function(e,t){return 32-this._daylightSavingAdjust(new Date(e,t,32)).getDate()},_getFirstDayOfMonth:function(e,t){return new Date(e,t,1).getDay()},_canAdjustMonth:function(e,t,i,a){var s=this._getNumberOfMonths(e),s=this._daylightSavingAdjust(new Date(i,a+(t<0?t:s[0]*s[1]),1));return t<0&&s.setDate(this._getDaysInMonth(s.getFullYear(),s.getMonth())),this._isInRange(e,s)},_isInRange:function(e,t){var i=this._getMinMaxDate(e,"min"),a=this._getMinMaxDate(e,"max"),s=null,n=null,r=this._get(e,"yearRange");return r&&(e=r.split(":"),r=(new Date).getFullYear(),s=parseInt(e[0],10),n=parseInt(e[1],10),e[0].match(/[+\-].*/)&&(s+=r),e[1].match(/[+\-].*/)&&(n+=r)),(!i||t.getTime()>=i.getTime())&&(!a||t.getTime()<=a.getTime())&&(!s||t.getFullYear()>=s)&&(!n||t.getFullYear()<=n)},_getFormatConfig:function(e){var t=this._get(e,"shortYearCutoff");return{shortYearCutoff:t="string"!=typeof t?t:(new Date).getFullYear()%100+parseInt(t,10),dayNamesShort:this._get(e,"dayNamesShort"),dayNames:this._get(e,"dayNames"),monthNamesShort:this._get(e,"monthNamesShort"),monthNames:this._get(e,"monthNames")}},_formatDate:function(e,t,i,a){t||(e.currentDay=e.selectedDay,e.currentMonth=e.selectedMonth,e.currentYear=e.selectedYear);t=t?"object"==typeof t?t:this._daylightSavingAdjust(new Date(a,i,t)):this._daylightSavingAdjust(new Date(e.currentYear,e.currentMonth,e.currentDay));return this.formatDate(this._get(e,"dateFormat"),t,this._getFormatConfig(e))}}),G.fn.datepicker=function(e){if(!this.length)return this;G.datepicker.initialized||(G(document).on("mousedown",G.datepicker._checkExternalClick),G.datepicker.initialized=!0),0===G("#"+G.datepicker._mainDivId).length&&G("body").append(G.datepicker.dpDiv);var t=Array.prototype.slice.call(arguments,1);return"string"==typeof e&&("isDisabled"===e||"getDate"===e||"widget"===e)||"option"===e&&2===arguments.length&&"string"==typeof arguments[1]?G.datepicker["_"+e+"Datepicker"].apply(G.datepicker,[this[0]].concat(t)):this.each(function(){"string"==typeof e?G.datepicker["_"+e+"Datepicker"].apply(G.datepicker,[this].concat(t)):G.datepicker._attachDatepicker(this,e)})},G.datepicker=new e,G.datepicker.initialized=!1,G.datepicker.uuid=(new Date).getTime(),G.datepicker.version="1.13.1";G.datepicker,G.ui.ie=!!/msie [\w.]+/.exec(navigator.userAgent.toLowerCase());var n=!1;G(document).on("mouseup",function(){n=!1});G.widget("ui.mouse",{version:"1.13.1",options:{cancel:"input, textarea, button, select, option",distance:1,delay:0},_mouseInit:function(){var t=this;this.element.on("mousedown."+this.widgetName,function(e){return t._mouseDown(e)}).on("click."+this.widgetName,function(e){if(!0===G.data(e.target,t.widgetName+".preventClickEvent"))return G.removeData(e.target,t.widgetName+".preventClickEvent"),e.stopImmediatePropagation(),!1}),this.started=!1},_mouseDestroy:function(){this.element.off("."+this.widgetName),this._mouseMoveDelegate&&this.document.off("mousemove."+this.widgetName,this._mouseMoveDelegate).off("mouseup."+this.widgetName,this._mouseUpDelegate)},_mouseDown:function(e){if(!n){this._mouseMoved=!1,this._mouseStarted&&this._mouseUp(e),this._mouseDownEvent=e;var t=this,i=1===e.which,a=!("string"!=typeof this.options.cancel||!e.target.nodeName)&&G(e.target).closest(this.options.cancel).length;return i&&!a&&this._mouseCapture(e)?(this.mouseDelayMet=!this.options.delay,this.mouseDelayMet||(this._mouseDelayTimer=setTimeout(function(){t.mouseDelayMet=!0},this.options.delay)),this._mouseDistanceMet(e)&&this._mouseDelayMet(e)&&(this._mouseStarted=!1!==this._mouseStart(e),!this._mouseStarted)?(e.preventDefault(),!0):(!0===G.data(e.target,this.widgetName+".preventClickEvent")&&G.removeData(e.target,this.widgetName+".preventClickEvent"),this._mouseMoveDelegate=function(e){return t._mouseMove(e)},this._mouseUpDelegate=function(e){return t._mouseUp(e)},this.document.on("mousemove."+this.widgetName,this._mouseMoveDelegate).on("mouseup."+this.widgetName,this._mouseUpDelegate),e.preventDefault(),n=!0)):!0}},_mouseMove:function(e){if(this._mouseMoved){if(G.ui.ie&&(!document.documentMode||document.documentMode<9)&&!e.button)return this._mouseUp(e);if(!e.which)if(e.originalEvent.altKey||e.originalEvent.ctrlKey||e.originalEvent.metaKey||e.originalEvent.shiftKey)this.ignoreMissingWhich=!0;else if(!this.ignoreMissingWhich)return this._mouseUp(e)}return(e.which||e.button)&&(this._mouseMoved=!0),this._mouseStarted?(this._mouseDrag(e),e.preventDefault()):(this._mouseDistanceMet(e)&&this._mouseDelayMet(e)&&(this._mouseStarted=!1!==this._mouseStart(this._mouseDownEvent,e),this._mouseStarted?this._mouseDrag(e):this._mouseUp(e)),!this._mouseStarted)},_mouseUp:function(e){this.document.off("mousemove."+this.widgetName,this._mouseMoveDelegate).off("mouseup."+this.widgetName,this._mouseUpDelegate),this._mouseStarted&&(this._mouseStarted=!1,e.target===this._mouseDownEvent.target&&G.data(e.target,this.widgetName+".preventClickEvent",!0),this._mouseStop(e)),this._mouseDelayTimer&&(clearTimeout(this._mouseDelayTimer),delete this._mouseDelayTimer),this.ignoreMissingWhich=!1,n=!1,e.preventDefault()},_mouseDistanceMet:function(e){return Math.max(Math.abs(this._mouseDownEvent.pageX-e.pageX),Math.abs(this._mouseDownEvent.pageY-e.pageY))>=this.options.distance},_mouseDelayMet:function(){return this.mouseDelayMet},_mouseStart:function(){},_mouseDrag:function(){},_mouseStop:function(){},_mouseCapture:function(){return!0}}),G.widget("ui.slider",G.ui.mouse,{version:"1.13.1",widgetEventPrefix:"slide",options:{animate:!1,classes:{"ui-slider":"ui-corner-all","ui-slider-handle":"ui-corner-all","ui-slider-range":"ui-corner-all ui-widget-header"},distance:0,max:100,min:0,orientation:"horizontal",range:!1,step:1,value:0,values:null,change:null,slide:null,start:null,stop:null},numPages:5,_create:function(){this._keySliding=!1,this._mouseSliding=!1,this._animateOff=!0,this._handleIndex=null,this._detectOrientation(),this._mouseInit(),this._calculateNewMax(),this._addClass("ui-slider ui-slider-"+this.orientation,"ui-widget ui-widget-content"),this._refresh(),this._animateOff=!1},_refresh:function(){this._createRange(),this._createHandles(),this._setupEvents(),this._refreshValue()},_createHandles:function(){var e,t=this.options,i=this.element.find(".ui-slider-handle"),a=[],s=t.values&&t.values.length||1;for(i.length>s&&(i.slice(s).remove(),i=i.slice(0,s)),e=i.length;e<s;e++)a.push("<span tabindex='0'></span>");this.handles=i.add(G(a.join("")).appendTo(this.element)),this._addClass(this.handles,"ui-slider-handle","ui-state-default"),this.handle=this.handles.eq(0),this.handles.each(function(e){G(this).data("ui-slider-handle-index",e).attr("tabIndex",0)})},_createRange:function(){var e=this.options;e.range?(!0===e.range&&(e.values?e.values.length&&2!==e.values.length?e.values=[e.values[0],e.values[0]]:Array.isArray(e.values)&&(e.values=e.values.slice(0)):e.values=[this._valueMin(),this._valueMin()]),this.range&&this.range.length?(this._removeClass(this.range,"ui-slider-range-min ui-slider-range-max"),this.range.css({left:"",bottom:""})):(this.range=G("<div>").appendTo(this.element),this._addClass(this.range,"ui-slider-range")),"min"!==e.range&&"max"!==e.range||this._addClass(this.range,"ui-slider-range-"+e.range)):(this.range&&this.range.remove(),this.range=null)},_setupEvents:function(){this._off(this.handles),this._on(this.handles,this._handleEvents),this._hoverable(this.handles),this._focusable(this.handles)},_destroy:function(){this.handles.remove(),this.range&&this.range.remove(),this._mouseDestroy()},_mouseCapture:function(e){var i,a,s,n,t,r,o=this,l=this.options;return!l.disabled&&(this.elementSize={width:this.element.outerWidth(),height:this.element.outerHeight()},this.elementOffset=this.element.offset(),r={x:e.pageX,y:e.pageY},i=this._normValueFromMouse(r),a=this._valueMax()-this._valueMin()+1,this.handles.each(function(e){var t=Math.abs(i-o.values(e));(t<a||a===t&&(e===o._lastChangedValue||o.values(e)===l.min))&&(a=t,s=G(this),n=e)}),!1!==this._start(e,n)&&(this._mouseSliding=!0,this._handleIndex=n,this._addClass(s,null,"ui-state-active"),s.trigger("focus"),t=s.offset(),r=!G(e.target).parents().addBack().is(".ui-slider-handle"),this._clickOffset=r?{left:0,top:0}:{left:e.pageX-t.left-s.width()/2,top:e.pageY-t.top-s.height()/2-(parseInt(s.css("borderTopWidth"),10)||0)-(parseInt(s.css("borderBottomWidth"),10)||0)+(parseInt(s.css("marginTop"),10)||0)},this.handles.hasClass("ui-state-hover")||this._slide(e,n,i),this._animateOff=!0))},_mouseStart:function(){return!0},_mouseDrag:function(e){var t={x:e.pageX,y:e.pageY},t=this._normValueFromMouse(t);return this._slide(e,this._handleIndex,t),!1},_mouseStop:function(e){return this._removeClass(this.handles,null,"ui-state-active"),this._mouseSliding=!1,this._stop(e,this._handleIndex),this._change(e,this._handleIndex),this._handleIndex=null,this._clickOffset=null,this._animateOff=!1},_detectOrientation:function(){this.orientation="vertical"===this.options.orientation?"vertical":"horizontal"},_normValueFromMouse:function(e){var t,e="horizontal"===this.orientation?(t=this.elementSize.width,e.x-this.elementOffset.left-(this._clickOffset?this._clickOffset.left:0)):(t=this.elementSize.height,e.y-this.elementOffset.top-(this._clickOffset?this._clickOffset.top:0)),e=e/t;return(e=1<e?1:e)<0&&(e=0),"vertical"===this.orientation&&(e=1-e),t=this._valueMax()-this._valueMin(),t=this._valueMin()+e*t,this._trimAlignValue(t)},_uiHash:function(e,t,i){var a={handle:this.handles[e],handleIndex:e,value:void 0!==t?t:this.value()};return this._hasMultipleValues()&&(a.value=void 0!==t?t:this.values(e),a.values=i||this.values()),a},_hasMultipleValues:function(){return this.options.values&&this.options.values.length},_start:function(e,t){return this._trigger("start",e,this._uiHash(t))},_slide:function(e,t,i){var a,s=this.value(),n=this.values();this._hasMultipleValues()&&(a=this.values(t?0:1),s=this.values(t),2===this.options.values.length&&!0===this.options.range&&(i=0===t?Math.min(a,i):Math.max(a,i)),n[t]=i),i!==s&&!1!==this._trigger("slide",e,this._uiHash(t,i,n))&&(this._hasMultipleValues()?this.values(t,i):this.value(i))},_stop:function(e,t){this._trigger("stop",e,this._uiHash(t))},_change:function(e,t){this._keySliding||this._mouseSliding||(this._lastChangedValue=t,this._trigger("change",e,this._uiHash(t)))},value:function(e){return arguments.length?(this.options.value=this._trimAlignValue(e),this._refreshValue(),void this._change(null,0)):this._value()},values:function(e,t){var i,a,s;if(1<arguments.length)return this.options.values[e]=this._trimAlignValue(t),this._refreshValue(),void this._change(null,e);if(!arguments.length)return this._values();if(!Array.isArray(e))return this._hasMultipleValues()?this._values(e):this.value();for(i=this.options.values,a=e,s=0;s<i.length;s+=1)i[s]=this._trimAlignValue(a[s]),this._change(null,s);this._refreshValue()},_setOption:function(e,t){var i,a=0;switch("range"===e&&!0===this.options.range&&("min"===t?(this.options.value=this._values(0),this.options.values=null):"max"===t&&(this.options.value=this._values(this.options.values.length-1),this.options.values=null)),Array.isArray(this.options.values)&&(a=this.options.values.length),this._super(e,t),e){case"orientation":this._detectOrientation(),this._removeClass("ui-slider-horizontal ui-slider-vertical")._addClass("ui-slider-"+this.orientation),this._refreshValue(),this.options.range&&this._refreshRange(t),this.handles.css("horizontal"===t?"bottom":"left","");break;case"value":this._animateOff=!0,this._refreshValue(),this._change(null,0),this._animateOff=!1;break;case"values":for(this._animateOff=!0,this._refreshValue(),i=a-1;0<=i;i--)this._change(null,i);this._animateOff=!1;break;case"step":case"min":case"max":this._animateOff=!0,this._calculateNewMax(),this._refreshValue(),this._animateOff=!1;break;case"range":this._animateOff=!0,this._refresh(),this._animateOff=!1}},_setOptionDisabled:function(e){this._super(e),this._toggleClass(null,"ui-state-disabled",!!e)},_value:function(){var e=this.options.value;return e=this._trimAlignValue(e)},_values:function(e){var t,i;if(arguments.length)return e=this.options.values[e],e=this._trimAlignValue(e);if(this._hasMultipleValues()){for(t=this.options.values.slice(),i=0;i<t.length;i+=1)t[i]=this._trimAlignValue(t[i]);return t}return[]},_trimAlignValue:function(e){if(e<=this._valueMin())return this._valueMin();if(e>=this._valueMax())return this._valueMax();var t=0<this.options.step?this.options.step:1,i=(e-this._valueMin())%t,e=e-i;return 2*Math.abs(i)>=t&&(e+=0<i?t:-t),parseFloat(e.toFixed(5))},_calculateNewMax:function(){var e=this.options.max,t=this._valueMin(),i=this.options.step;(e=Math.round((e-t)/i)*i+t)>this.options.max&&(e-=i),this.max=parseFloat(e.toFixed(this._precision()))},_precision:function(){var e=this._precisionOf(this.options.step);return e=null!==this.options.min?Math.max(e,this._precisionOf(this.options.min)):e},_precisionOf:function(e){var t=e.toString(),e=t.indexOf(".");return-1===e?0:t.length-e-1},_valueMin:function(){return this.options.min},_valueMax:function(){return this.max},_refreshRange:function(e){"vertical"===e&&this.range.css({width:"",left:""}),"horizontal"===e&&this.range.css({height:"",bottom:""})},_refreshValue:function(){var t,i,e,a,s,n=this.options.range,r=this.options,o=this,l=!this._animateOff&&r.animate,h={};this._hasMultipleValues()?this.handles.each(function(e){i=(o.values(e)-o._valueMin())/(o._valueMax()-o._valueMin())*100,h["horizontal"===o.orientation?"left":"bottom"]=i+"%",G(this).stop(1,1)[l?"animate":"css"](h,r.animate),!0===o.options.range&&("horizontal"===o.orientation?(0===e&&o.range.stop(1,1)[l?"animate":"css"]({left:i+"%"},r.animate),1===e&&o.range[l?"animate":"css"]({width:i-t+"%"},{queue:!1,duration:r.animate})):(0===e&&o.range.stop(1,1)[l?"animate":"css"]({bottom:i+"%"},r.animate),1===e&&o.range[l?"animate":"css"]({height:i-t+"%"},{queue:!1,duration:r.animate}))),t=i}):(e=this.value(),a=this._valueMin(),s=this._valueMax(),i=s!==a?(e-a)/(s-a)*100:0,h["horizontal"===this.orientation?"left":"bottom"]=i+"%",this.handle.stop(1,1)[l?"animate":"css"](h,r.animate),"min"===n&&"horizontal"===this.orientation&&this.range.stop(1,1)[l?"animate":"css"]({width:i+"%"},r.animate),"max"===n&&"horizontal"===this.orientation&&this.range.stop(1,1)[l?"animate":"css"]({width:100-i+"%"},r.animate),"min"===n&&"vertical"===this.orientation&&this.range.stop(1,1)[l?"animate":"css"]({height:i+"%"},r.animate),"max"===n&&"vertical"===this.orientation&&this.range.stop(1,1)[l?"animate":"css"]({height:100-i+"%"},r.animate))},_handleEvents:{keydown:function(e){var t,i,a,s=G(e.target).data("ui-slider-handle-index");switch(e.keyCode){case G.ui.keyCode.HOME:case G.ui.keyCode.END:case G.ui.keyCode.PAGE_UP:case G.ui.keyCode.PAGE_DOWN:case G.ui.keyCode.UP:case G.ui.keyCode.RIGHT:case G.ui.keyCode.DOWN:case G.ui.keyCode.LEFT:if(e.preventDefault(),!this._keySliding&&(this._keySliding=!0,this._addClass(G(e.target),null,"ui-state-active"),!1===this._start(e,s)))return}switch(a=this.options.step,t=i=this._hasMultipleValues()?this.values(s):this.value(),e.keyCode){case G.ui.keyCode.HOME:i=this._valueMin();break;case G.ui.keyCode.END:i=this._valueMax();break;case G.ui.keyCode.PAGE_UP:i=this._trimAlignValue(t+(this._valueMax()-this._valueMin())/this.numPages);break;case G.ui.keyCode.PAGE_DOWN:i=this._trimAlignValue(t-(this._valueMax()-this._valueMin())/this.numPages);break;case G.ui.keyCode.UP:case G.ui.keyCode.RIGHT:if(t===this._valueMax())return;i=this._trimAlignValue(t+a);break;case G.ui.keyCode.DOWN:case G.ui.keyCode.LEFT:if(t===this._valueMin())return;i=this._trimAlignValue(t-a)}this._slide(e,s,i)},keyup:function(e){var t=G(e.target).data("ui-slider-handle-index");this._keySliding&&(this._keySliding=!1,this._stop(e,t),this._change(e,t),this._removeClass(G(e.target),null,"ui-state-active"))}}})});

/*!
 * jQuery UI Touch Punch 0.2.3
 *
 * Copyright 2011–2014, Dave Furfero
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Depends:
 *  jquery.ui.widget.js
 *  jquery.ui.mouse.js
 */
!function(a){function f(a,b){if(!(a.originalEvent.touches.length>1)){a.preventDefault();var c=a.originalEvent.changedTouches[0],d=document.createEvent("MouseEvents");d.initMouseEvent(b,!0,!0,window,1,c.screenX,c.screenY,c.clientX,c.clientY,!1,!1,!1,!1,0,null),a.target.dispatchEvent(d)}}if(a.support.touch="ontouchend"in document,a.support.touch){var e,b=a.ui.mouse.prototype,c=b._mouseInit,d=b._mouseDestroy;b._touchStart=function(a){var b=this;!e&&b._mouseCapture(a.originalEvent.changedTouches[0])&&(e=!0,b._touchMoved=!1,f(a,"mouseover"),f(a,"mousemove"),f(a,"mousedown"))},b._touchMove=function(a){e&&(this._touchMoved=!0,f(a,"mousemove"))},b._touchEnd=function(a){e&&(f(a,"mouseup"),f(a,"mouseout"),this._touchMoved||f(a,"click"),e=!1)},b._mouseInit=function(){var b=this;b.element.bind({touchstart:a.proxy(b,"_touchStart"),touchmove:a.proxy(b,"_touchMove"),touchend:a.proxy(b,"_touchEnd")}),c.call(b)},b._mouseDestroy=function(){var b=this;b.element.unbind({touchstart:a.proxy(b,"_touchStart"),touchmove:a.proxy(b,"_touchMove"),touchend:a.proxy(b,"_touchEnd")}),d.call(b)}}}(jQuery);

/*
 * jQuery BBQ: Back Button & Query Library - v1.2.1 - 2/17/2010
 * http://benalman.com/projects/jquery-bbq-plugin/
 *
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */

(function($,p){var i,m=Array.prototype.slice,r=decodeURIComponent,a=$.param,c,l,v,b=$.bbq=$.bbq||{},q,u,j,e=$.event.special,d="hashchange",A="querystring",D="fragment",y="elemUrlAttr",g="location",k="href",t="src",x=/^.*\?|#.*$/g,w=/^.*\#/,h,C={};function E(F){return typeof F==="string"}function B(G){var F=m.call(arguments,1);return function(){return G.apply(this,F.concat(m.call(arguments)))}}function n(F){return F.replace(/^[^#]*#?(.*)$/,"$1")}function o(F){return F.replace(/(?:^[^?#]*\?([^#]*).*$)?.*/,"$1")}function f(H,M,F,I,G){var O,L,K,N,J;if(I!==i){K=F.match(H?/^([^#]*)\#?(.*)$/:/^([^#?]*)\??([^#]*)(#?.*)/);J=K[3]||"";if(G===2&&E(I)){L=I.replace(H?w:x,"")}else{N=l(K[2]);I=E(I)?l[H?D:A](I):I;L=G===2?I:G===1?$.extend({},I,N):$.extend({},N,I);L=a(L);if(H){L=L.replace(h,r)}}O=K[1]+(H?"#":L||!K[1]?"?":"")+L+J}else{O=M(F!==i?F:p[g][k])}return O}a[A]=B(f,0,o);a[D]=c=B(f,1,n);c.noEscape=function(G){G=G||"";var F=$.map(G.split(""),encodeURIComponent);h=new RegExp(F.join("|"),"g")};c.noEscape(",/");$.deparam=l=function(I,F){var H={},G={"true":!0,"false":!1,"null":null};$.each(I.replace(/\+/g," ").split("&"),function(L,Q){var K=Q.split("="),P=r(K[0]),J,O=H,M=0,R=P.split("]["),N=R.length-1;if(/\[/.test(R[0])&&/\]$/.test(R[N])){R[N]=R[N].replace(/\]$/,"");R=R.shift().split("[").concat(R);N=R.length-1}else{N=0}if(K.length===2){J=r(K[1]);if(F){J=J&&!isNaN(J)?+J:J==="undefined"?i:G[J]!==i?G[J]:J}if(N){for(;M<=N;M++){P=R[M]===""?O.length:R[M];O=O[P]=M<N?O[P]||(R[M+1]&&isNaN(R[M+1])?{}:[]):J}}else{if($.isArray(H[P])){H[P].push(J)}else{if(H[P]!==i){H[P]=[H[P],J]}else{H[P]=J}}}}else{if(P){H[P]=F?i:""}}});return H};function z(H,F,G){if(F===i||typeof F==="boolean"){G=F;F=a[H?D:A]()}else{F=E(F)?F.replace(H?w:x,""):F}return l(F,G)}l[A]=B(z,0);l[D]=v=B(z,1);$[y]||($[y]=function(F){return $.extend(C,F)})({a:k,base:k,iframe:t,img:t,input:t,form:"action",link:k,script:t});j=$[y];function s(I,G,H,F){if(!E(H)&&typeof H!=="object"){F=H;H=G;G=i}return this.each(function(){var L=$(this),J=G||j()[(this.nodeName||"").toLowerCase()]||"",K=J&&L.attr(J)||"";L.attr(J,a[I](K,H,F))})}$.fn[A]=B(s,A);$.fn[D]=B(s,D);b.pushState=q=function(I,F){if(E(I)&&/^#/.test(I)&&F===i){F=2}var H=I!==i,G=c(p[g][k],H?I:{},H?F:2);p[g][k]=G+(/#/.test(G)?"":"#")};b.getState=u=function(F,G){return F===i||typeof F==="boolean"?v(F):v(G)[F]};b.removeState=function(F){var G={};if(F!==i){G=u();$.each($.isArray(F)?F:arguments,function(I,H){delete G[H]})}q(G,2)};e[d]=$.extend(e[d],{add:function(F){var H;function G(J){var I=J[D]=c();J.getState=function(K,L){return K===i||typeof K==="boolean"?l(I,K):l(I,L)[K]};H.apply(this,arguments)}if($.isFunction(F)){H=F;return G}else{H=F.handler;F.handler=G}}})})(jQuery,this);

/*
 * jQuery hashchange event - v1.2 - 2/11/2010
 * http://benalman.com/projects/jquery-hashchange-plugin/
 *
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */

(function($,i,b){var j,k=$.event.special,c="location",d="hashchange",l="href",f=navigator.userAgent.toLowerCase(),g=document.documentMode,h=/msie/.test(f)&&!/opera/.test(f)&&(g===b||g<8),e="on"+d in i&&!h;function a(m){m=m||i[c][l];return m.replace(/^[^#]*#?(.*)$/,"$1")}$[d+"Delay"]=100;k[d]=$.extend(k[d],{setup:function(){if(e){return false}$(j.start)},teardown:function(){if(e){return false}$(j.stop)}});j=(function(){var m={},r,n,o,q;function p(){o=q=function(s){return s};if(h){n=$('<iframe src="javascript:0"/>').hide().insertAfter("body")[0].contentWindow;q=function(){return a(n.document[c][l])};o=function(u,s){if(u!==s){var t=n.document;t.open().close();t[c].hash="#"+u}};o(a())}}m.start=function(){if(r){return}var t=a();o||p();(function s(){var v=a(),u=q(t);if(v!==t){o(t=v,u);$(i).trigger(d)}else{if(u!==t){i[c][l]=i[c][l].replace(/#.*/,"")+"#"+u}}r=setTimeout(s,$[d+"Delay"])})()};m.stop=function(){if(!n){r&&clearTimeout(r);r=0}};return m})()})(jQuery,this);


/*!
 * jquery.customSelect() - v0.5.1
 * http://adam.co/lab/jquery/customselect/
 * 2014-04-19
 *
 * Copyright 2013 Adam Coulombe
 * @license http://www.opensource.org/licenses/mit-license.html MIT License
 * @license http://www.gnu.org/licenses/gpl.html GPL2 License 
 */
(function(a){a.fn.extend({customSelect:function(c){if(typeof document.body.style.maxHeight==="undefined"){return this}var e={customClass:"customSelect",mapClass:true,mapStyle:true},c=a.extend(e,c),d=c.customClass,f=function(h,k){var g=h.find(":selected"),j=k.children(":first"),i=g.html()||"&nbsp;";j.html(i);if(g.attr("disabled")){k.addClass(b("DisabledOption"))}else{k.removeClass(b("DisabledOption"))}setTimeout(function(){k.removeClass(b("Open"));a(document).off("mouseup.customSelect")},60)},b=function(g){return d+g};return this.each(function(){var g=a(this),i=a("<span />").addClass(b("Inner")),h=a("<span />");g.after(h.append(i));h.addClass(d);if(c.mapClass){h.addClass(g.attr("class"))}if(c.mapStyle){h.attr("style",g.attr("style"))}g.addClass("hasCustomSelect").on("render.customSelect",function(){f(g,h);g.css("width","");var k=parseInt(g.outerWidth(),10)-(parseInt(h.outerWidth(),10)-parseInt(h.width(),10));h.css({display:"inline-block"});var j=h.outerHeight();if(g.attr("disabled")){h.addClass(b("Disabled"))}else{h.removeClass(b("Disabled"))}i.css({width:k,display:"inline-block"});g.css({"-webkit-appearance":"menulist-button",width:h.outerWidth(),position:"absolute",opacity:0,height:j,fontSize:h.css("font-size")})}).on("change.customSelect",function(){h.addClass(b("Changed"));f(g,h)}).on("keyup.customSelect",function(j){if(!h.hasClass(b("Open"))){g.trigger("blur.customSelect");g.trigger("focus.customSelect")}else{if(j.which==13||j.which==27){f(g,h)}}}).on("mousedown.customSelect",function(){h.removeClass(b("Changed"))}).on("mouseup.customSelect",function(j){if(!h.hasClass(b("Open"))){if(a("."+b("Open")).not(h).length>0&&typeof InstallTrigger!=="undefined"){g.trigger("focus.customSelect")}else{h.addClass(b("Open"));j.stopPropagation();a(document).one("mouseup.customSelect",function(k){if(k.target!=g.get(0)&&a.inArray(k.target,g.find("*").get())<0){g.trigger("blur.customSelect")}else{f(g,h)}})}}}).on("focus.customSelect",function(){h.removeClass(b("Changed")).addClass(b("Focus"))}).on("blur.customSelect",function(){h.removeClass(b("Focus")+" "+b("Open"))}).on("mouseenter.customSelect",function(){h.addClass(b("Hover"))}).on("mouseleave.customSelect",function(){h.removeClass(b("Hover"))}).trigger("render.customSelect")})}})})(jQuery);

/*
 * jQuery File Upload Plugin
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2010, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 */

/* global define, require */
/* eslint-disable new-cap */

(function (factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    // Register as an anonymous AMD module:
    define(['jquery', 'jquery-ui/ui/widget'], factory);
  } else if (typeof exports === 'object') {
    // Node/CommonJS:
    factory(require('jquery'), require('./vendor/jquery.ui.widget'));
  } else {
    // Browser globals:
    factory(window.jQuery);
  }
})(function ($) {
  'use strict';

  // Detect file input support, based on
  // https://viljamis.com/2012/file-upload-support-on-mobile/
  $.support.fileInput = !(
    new RegExp(
      // Handle devices which give false positives for the feature detection:
      '(Android (1\\.[0156]|2\\.[01]))' +
        '|(Windows Phone (OS 7|8\\.0))|(XBLWP)|(ZuneWP)|(WPDesktop)' +
        '|(w(eb)?OSBrowser)|(webOS)' +
        '|(Kindle/(1\\.0|2\\.[05]|3\\.0))'
    ).test(window.navigator.userAgent) ||
    // Feature detection for all other devices:
    $('<input type="file"/>').prop('disabled')
  );

  // The FileReader API is not actually used, but works as feature detection,
  // as some Safari versions (5?) support XHR file uploads via the FormData API,
  // but not non-multipart XHR file uploads.
  // window.XMLHttpRequestUpload is not available on IE10, so we check for
  // window.ProgressEvent instead to detect XHR2 file upload capability:
  $.support.xhrFileUpload = !!(window.ProgressEvent && window.FileReader);
  $.support.xhrFormDataFileUpload = !!window.FormData;

  // Detect support for Blob slicing (required for chunked uploads):
  $.support.blobSlice =
    window.Blob &&
    (Blob.prototype.slice ||
      Blob.prototype.webkitSlice ||
      Blob.prototype.mozSlice);

  /**
   * Helper function to create drag handlers for dragover/dragenter/dragleave
   *
   * @param {string} type Event type
   * @returns {Function} Drag handler
   */
  function getDragHandler(type) {
    var isDragOver = type === 'dragover';
    return function (e) {
      e.dataTransfer = e.originalEvent && e.originalEvent.dataTransfer;
      var dataTransfer = e.dataTransfer;
      if (
        dataTransfer &&
        $.inArray('Files', dataTransfer.types) !== -1 &&
        this._trigger(type, $.Event(type, { delegatedEvent: e })) !== false
      ) {
        e.preventDefault();
        if (isDragOver) {
          dataTransfer.dropEffect = 'copy';
        }
      }
    };
  }

  // The fileupload widget listens for change events on file input fields defined
  // via fileInput setting and paste or drop events of the given dropZone.
  // In addition to the default jQuery Widget methods, the fileupload widget
  // exposes the "add" and "send" methods, to add or directly send files using
  // the fileupload API.
  // By default, files added via file input selection, paste, drag & drop or
  // "add" method are uploaded immediately, but it is possible to override
  // the "add" callback option to queue file uploads.
  $.widget('blueimp.fileupload', {
    options: {
      // The drop target element(s), by the default the complete document.
      // Set to null to disable drag & drop support:
      dropZone: $(document),
      // The paste target element(s), by the default undefined.
      // Set to a DOM node or jQuery object to enable file pasting:
      pasteZone: undefined,
      // The file input field(s), that are listened to for change events.
      // If undefined, it is set to the file input fields inside
      // of the widget element on plugin initialization.
      // Set to null to disable the change listener.
      fileInput: undefined,
      // By default, the file input field is replaced with a clone after
      // each input field change event. This is required for iframe transport
      // queues and allows change events to be fired for the same file
      // selection, but can be disabled by setting the following option to false:
      replaceFileInput: true,
      // The parameter name for the file form data (the request argument name).
      // If undefined or empty, the name property of the file input field is
      // used, or "files[]" if the file input name property is also empty,
      // can be a string or an array of strings:
      paramName: undefined,
      // By default, each file of a selection is uploaded using an individual
      // request for XHR type uploads. Set to false to upload file
      // selections in one request each:
      singleFileUploads: true,
      // To limit the number of files uploaded with one XHR request,
      // set the following option to an integer greater than 0:
      limitMultiFileUploads: undefined,
      // The following option limits the number of files uploaded with one
      // XHR request to keep the request size under or equal to the defined
      // limit in bytes:
      limitMultiFileUploadSize: undefined,
      // Multipart file uploads add a number of bytes to each uploaded file,
      // therefore the following option adds an overhead for each file used
      // in the limitMultiFileUploadSize configuration:
      limitMultiFileUploadSizeOverhead: 512,
      // Set the following option to true to issue all file upload requests
      // in a sequential order:
      sequentialUploads: false,
      // To limit the number of concurrent uploads,
      // set the following option to an integer greater than 0:
      limitConcurrentUploads: undefined,
      // Set the following option to true to force iframe transport uploads:
      forceIframeTransport: false,
      // Set the following option to the location of a redirect url on the
      // origin server, for cross-domain iframe transport uploads:
      redirect: undefined,
      // The parameter name for the redirect url, sent as part of the form
      // data and set to 'redirect' if this option is empty:
      redirectParamName: undefined,
      // Set the following option to the location of a postMessage window,
      // to enable postMessage transport uploads:
      postMessage: undefined,
      // By default, XHR file uploads are sent as multipart/form-data.
      // The iframe transport is always using multipart/form-data.
      // Set to false to enable non-multipart XHR uploads:
      multipart: true,
      // To upload large files in smaller chunks, set the following option
      // to a preferred maximum chunk size. If set to 0, null or undefined,
      // or the browser does not support the required Blob API, files will
      // be uploaded as a whole.
      maxChunkSize: undefined,
      // When a non-multipart upload or a chunked multipart upload has been
      // aborted, this option can be used to resume the upload by setting
      // it to the size of the already uploaded bytes. This option is most
      // useful when modifying the options object inside of the "add" or
      // "send" callbacks, as the options are cloned for each file upload.
      uploadedBytes: undefined,
      // By default, failed (abort or error) file uploads are removed from the
      // global progress calculation. Set the following option to false to
      // prevent recalculating the global progress data:
      recalculateProgress: true,
      // Interval in milliseconds to calculate and trigger progress events:
      progressInterval: 100,
      // Interval in milliseconds to calculate progress bitrate:
      bitrateInterval: 500,
      // By default, uploads are started automatically when adding files:
      autoUpload: true,
      // By default, duplicate file names are expected to be handled on
      // the server-side. If this is not possible (e.g. when uploading
      // files directly to Amazon S3), the following option can be set to
      // an empty object or an object mapping existing filenames, e.g.:
      // { "image.jpg": true, "image (1).jpg": true }
      // If it is set, all files will be uploaded with unique filenames,
      // adding increasing number suffixes if necessary, e.g.:
      // "image (2).jpg"
      uniqueFilenames: undefined,

      // Error and info messages:
      messages: {
        uploadedBytes: 'Uploaded bytes exceed file size'
      },

      // Translation function, gets the message key to be translated
      // and an object with context specific data as arguments:
      i18n: function (message, context) {
        // eslint-disable-next-line no-param-reassign
        message = this.messages[message] || message.toString();
        if (context) {
          $.each(context, function (key, value) {
            // eslint-disable-next-line no-param-reassign
            message = message.replace('{' + key + '}', value);
          });
        }
        return message;
      },

      // Additional form data to be sent along with the file uploads can be set
      // using this option, which accepts an array of objects with name and
      // value properties, a function returning such an array, a FormData
      // object (for XHR file uploads), or a simple object.
      // The form of the first fileInput is given as parameter to the function:
      formData: function (form) {
        return form.serializeArray();
      },

      // The add callback is invoked as soon as files are added to the fileupload
      // widget (via file input selection, drag & drop, paste or add API call).
      // If the singleFileUploads option is enabled, this callback will be
      // called once for each file in the selection for XHR file uploads, else
      // once for each file selection.
      //
      // The upload starts when the submit method is invoked on the data parameter.
      // The data object contains a files property holding the added files
      // and allows you to override plugin options as well as define ajax settings.
      //
      // Listeners for this callback can also be bound the following way:
      // .on('fileuploadadd', func);
      //
      // data.submit() returns a Promise object and allows to attach additional
      // handlers using jQuery's Deferred callbacks:
      // data.submit().done(func).fail(func).always(func);
      add: function (e, data) {
        if (e.isDefaultPrevented()) {
          return false;
        }
        if (
          data.autoUpload ||
          (data.autoUpload !== false &&
            $(this).fileupload('option', 'autoUpload'))
        ) {
          data.process().done(function () {
            data.submit();
          });
        }
      },

      // Other callbacks:

      // Callback for the submit event of each file upload:
      // submit: function (e, data) {}, // .on('fileuploadsubmit', func);

      // Callback for the start of each file upload request:
      // send: function (e, data) {}, // .on('fileuploadsend', func);

      // Callback for successful uploads:
      // done: function (e, data) {}, // .on('fileuploaddone', func);

      // Callback for failed (abort or error) uploads:
      // fail: function (e, data) {}, // .on('fileuploadfail', func);

      // Callback for completed (success, abort or error) requests:
      // always: function (e, data) {}, // .on('fileuploadalways', func);

      // Callback for upload progress events:
      // progress: function (e, data) {}, // .on('fileuploadprogress', func);

      // Callback for global upload progress events:
      // progressall: function (e, data) {}, // .on('fileuploadprogressall', func);

      // Callback for uploads start, equivalent to the global ajaxStart event:
      // start: function (e) {}, // .on('fileuploadstart', func);

      // Callback for uploads stop, equivalent to the global ajaxStop event:
      // stop: function (e) {}, // .on('fileuploadstop', func);

      // Callback for change events of the fileInput(s):
      // change: function (e, data) {}, // .on('fileuploadchange', func);

      // Callback for paste events to the pasteZone(s):
      // paste: function (e, data) {}, // .on('fileuploadpaste', func);

      // Callback for drop events of the dropZone(s):
      // drop: function (e, data) {}, // .on('fileuploaddrop', func);

      // Callback for dragover events of the dropZone(s):
      // dragover: function (e) {}, // .on('fileuploaddragover', func);

      // Callback before the start of each chunk upload request (before form data initialization):
      // chunkbeforesend: function (e, data) {}, // .on('fileuploadchunkbeforesend', func);

      // Callback for the start of each chunk upload request:
      // chunksend: function (e, data) {}, // .on('fileuploadchunksend', func);

      // Callback for successful chunk uploads:
      // chunkdone: function (e, data) {}, // .on('fileuploadchunkdone', func);

      // Callback for failed (abort or error) chunk uploads:
      // chunkfail: function (e, data) {}, // .on('fileuploadchunkfail', func);

      // Callback for completed (success, abort or error) chunk upload requests:
      // chunkalways: function (e, data) {}, // .on('fileuploadchunkalways', func);

      // The plugin options are used as settings object for the ajax calls.
      // The following are jQuery ajax settings required for the file uploads:
      processData: false,
      contentType: false,
      cache: false,
      timeout: 0
    },

    // jQuery versions before 1.8 require promise.pipe if the return value is
    // used, as promise.then in older versions has a different behavior, see:
    // https://blog.jquery.com/2012/08/09/jquery-1-8-released/
    // https://bugs.jquery.com/ticket/11010
    // https://github.com/blueimp/jQuery-File-Upload/pull/3435
    _promisePipe: (function () {
      var parts = $.fn.jquery.split('.');
      return Number(parts[0]) > 1 || Number(parts[1]) > 7 ? 'then' : 'pipe';
    })(),

    // A list of options that require reinitializing event listeners and/or
    // special initialization code:
    _specialOptions: [
      'fileInput',
      'dropZone',
      'pasteZone',
      'multipart',
      'forceIframeTransport'
    ],

    _blobSlice:
      $.support.blobSlice &&
      function () {
        var slice = this.slice || this.webkitSlice || this.mozSlice;
        return slice.apply(this, arguments);
      },

    _BitrateTimer: function () {
      this.timestamp = Date.now ? Date.now() : new Date().getTime();
      this.loaded = 0;
      this.bitrate = 0;
      this.getBitrate = function (now, loaded, interval) {
        var timeDiff = now - this.timestamp;
        if (!this.bitrate || !interval || timeDiff > interval) {
          this.bitrate = (loaded - this.loaded) * (1000 / timeDiff) * 8;
          this.loaded = loaded;
          this.timestamp = now;
        }
        return this.bitrate;
      };
    },

    _isXHRUpload: function (options) {
      return (
        !options.forceIframeTransport &&
        ((!options.multipart && $.support.xhrFileUpload) ||
          $.support.xhrFormDataFileUpload)
      );
    },

    _getFormData: function (options) {
      var formData;
      if ($.type(options.formData) === 'function') {
        return options.formData(options.form);
      }
      if ($.isArray(options.formData)) {
        return options.formData;
      }
      if ($.type(options.formData) === 'object') {
        formData = [];
        $.each(options.formData, function (name, value) {
          formData.push({ name: name, value: value });
        });
        return formData;
      }
      return [];
    },

    _getTotal: function (files) {
      var total = 0;
      $.each(files, function (index, file) {
        total += file.size || 1;
      });
      return total;
    },

    _initProgressObject: function (obj) {
      var progress = {
        loaded: 0,
        total: 0,
        bitrate: 0
      };
      if (obj._progress) {
        $.extend(obj._progress, progress);
      } else {
        obj._progress = progress;
      }
    },

    _initResponseObject: function (obj) {
      var prop;
      if (obj._response) {
        for (prop in obj._response) {
          if (Object.prototype.hasOwnProperty.call(obj._response, prop)) {
            delete obj._response[prop];
          }
        }
      } else {
        obj._response = {};
      }
    },

    _onProgress: function (e, data) {
      if (e.lengthComputable) {
        var now = Date.now ? Date.now() : new Date().getTime(),
          loaded;
        if (
          data._time &&
          data.progressInterval &&
          now - data._time < data.progressInterval &&
          e.loaded !== e.total
        ) {
          return;
        }
        data._time = now;
        loaded =
          Math.floor(
            (e.loaded / e.total) * (data.chunkSize || data._progress.total)
          ) + (data.uploadedBytes || 0);
        // Add the difference from the previously loaded state
        // to the global loaded counter:
        this._progress.loaded += loaded - data._progress.loaded;
        this._progress.bitrate = this._bitrateTimer.getBitrate(
          now,
          this._progress.loaded,
          data.bitrateInterval
        );
        data._progress.loaded = data.loaded = loaded;
        data._progress.bitrate = data.bitrate = data._bitrateTimer.getBitrate(
          now,
          loaded,
          data.bitrateInterval
        );
        // Trigger a custom progress event with a total data property set
        // to the file size(s) of the current upload and a loaded data
        // property calculated accordingly:
        this._trigger(
          'progress',
          $.Event('progress', { delegatedEvent: e }),
          data
        );
        // Trigger a global progress event for all current file uploads,
        // including ajax calls queued for sequential file uploads:
        this._trigger(
          'progressall',
          $.Event('progressall', { delegatedEvent: e }),
          this._progress
        );
      }
    },

    _initProgressListener: function (options) {
      var that = this,
        xhr = options.xhr ? options.xhr() : $.ajaxSettings.xhr();
      // Access to the native XHR object is required to add event listeners
      // for the upload progress event:
      if (xhr.upload) {
        $(xhr.upload).on('progress', function (e) {
          var oe = e.originalEvent;
          // Make sure the progress event properties get copied over:
          e.lengthComputable = oe.lengthComputable;
          e.loaded = oe.loaded;
          e.total = oe.total;
          that._onProgress(e, options);
        });
        options.xhr = function () {
          return xhr;
        };
      }
    },

    _deinitProgressListener: function (options) {
      var xhr = options.xhr ? options.xhr() : $.ajaxSettings.xhr();
      if (xhr.upload) {
        $(xhr.upload).off('progress');
      }
    },

    _isInstanceOf: function (type, obj) {
      // Cross-frame instanceof check
      return Object.prototype.toString.call(obj) === '[object ' + type + ']';
    },

    _getUniqueFilename: function (name, map) {
      // eslint-disable-next-line no-param-reassign
      name = String(name);
      if (map[name]) {
        // eslint-disable-next-line no-param-reassign
        name = name.replace(
          /(?: \(([\d]+)\))?(\.[^.]+)?$/,
          function (_, p1, p2) {
            var index = p1 ? Number(p1) + 1 : 1;
            var ext = p2 || '';
            return ' (' + index + ')' + ext;
          }
        );
        return this._getUniqueFilename(name, map);
      }
      map[name] = true;
      return name;
    },

    _initXHRData: function (options) {
      var that = this,
        formData,
        file = options.files[0],
        // Ignore non-multipart setting if not supported:
        multipart = options.multipart || !$.support.xhrFileUpload,
        paramName =
          $.type(options.paramName) === 'array'
            ? options.paramName[0]
            : options.paramName;
      options.headers = $.extend({}, options.headers);
      if (options.contentRange) {
        options.headers['Content-Range'] = options.contentRange;
      }
      if (!multipart || options.blob || !this._isInstanceOf('File', file)) {
        options.headers['Content-Disposition'] =
          'attachment; filename="' +
          encodeURI(file.uploadName || file.name) +
          '"';
      }
      if (!multipart) {
        options.contentType = file.type || 'application/octet-stream';
        options.data = options.blob || file;
      } else if ($.support.xhrFormDataFileUpload) {
        if (options.postMessage) {
          // window.postMessage does not allow sending FormData
          // objects, so we just add the File/Blob objects to
          // the formData array and let the postMessage window
          // create the FormData object out of this array:
          formData = this._getFormData(options);
          if (options.blob) {
            formData.push({
              name: paramName,
              value: options.blob
            });
          } else {
            $.each(options.files, function (index, file) {
              formData.push({
                name:
                  ($.type(options.paramName) === 'array' &&
                    options.paramName[index]) ||
                  paramName,
                value: file
              });
            });
          }
        } else {
          if (that._isInstanceOf('FormData', options.formData)) {
            formData = options.formData;
          } else {
            formData = new FormData();
            $.each(this._getFormData(options), function (index, field) {
              formData.append(field.name, field.value);
            });
          }
          if (options.blob) {
            formData.append(
              paramName,
              options.blob,
              file.uploadName || file.name
            );
          } else {
            $.each(options.files, function (index, file) {
              // This check allows the tests to run with
              // dummy objects:
              if (
                that._isInstanceOf('File', file) ||
                that._isInstanceOf('Blob', file)
              ) {
                var fileName = file.uploadName || file.name;
                if (options.uniqueFilenames) {
                  fileName = that._getUniqueFilename(
                    fileName,
                    options.uniqueFilenames
                  );
                }
                formData.append(
                  ($.type(options.paramName) === 'array' &&
                    options.paramName[index]) ||
                    paramName,
                  file,
                  fileName
                );
              }
            });
          }
        }
        options.data = formData;
      }
      // Blob reference is not needed anymore, free memory:
      options.blob = null;
    },

    _initIframeSettings: function (options) {
      var targetHost = $('<a></a>').prop('href', options.url).prop('host');
      // Setting the dataType to iframe enables the iframe transport:
      options.dataType = 'iframe ' + (options.dataType || '');
      // The iframe transport accepts a serialized array as form data:
      options.formData = this._getFormData(options);
      // Add redirect url to form data on cross-domain uploads:
      if (options.redirect && targetHost && targetHost !== location.host) {
        options.formData.push({
          name: options.redirectParamName || 'redirect',
          value: options.redirect
        });
      }
    },

    _initDataSettings: function (options) {
      if (this._isXHRUpload(options)) {
        if (!this._chunkedUpload(options, true)) {
          if (!options.data) {
            this._initXHRData(options);
          }
          this._initProgressListener(options);
        }
        if (options.postMessage) {
          // Setting the dataType to postmessage enables the
          // postMessage transport:
          options.dataType = 'postmessage ' + (options.dataType || '');
        }
      } else {
        this._initIframeSettings(options);
      }
    },

    _getParamName: function (options) {
      var fileInput = $(options.fileInput),
        paramName = options.paramName;
      if (!paramName) {
        paramName = [];
        fileInput.each(function () {
          var input = $(this),
            name = input.prop('name') || 'files[]',
            i = (input.prop('files') || [1]).length;
          while (i) {
            paramName.push(name);
            i -= 1;
          }
        });
        if (!paramName.length) {
          paramName = [fileInput.prop('name') || 'files[]'];
        }
      } else if (!$.isArray(paramName)) {
        paramName = [paramName];
      }
      return paramName;
    },

    _initFormSettings: function (options) {
      // Retrieve missing options from the input field and the
      // associated form, if available:
      if (!options.form || !options.form.length) {
        options.form = $(options.fileInput.prop('form'));
        // If the given file input doesn't have an associated form,
        // use the default widget file input's form:
        if (!options.form.length) {
          options.form = $(this.options.fileInput.prop('form'));
        }
      }
      options.paramName = this._getParamName(options);
      if (!options.url) {
        options.url = options.form.prop('action') || location.href;
      }
      // The HTTP request method must be "POST" or "PUT":
      options.type = (
        options.type ||
        ($.type(options.form.prop('method')) === 'string' &&
          options.form.prop('method')) ||
        ''
      ).toUpperCase();
      if (
        options.type !== 'POST' &&
        options.type !== 'PUT' &&
        options.type !== 'PATCH'
      ) {
        options.type = 'POST';
      }
      if (!options.formAcceptCharset) {
        options.formAcceptCharset = options.form.attr('accept-charset');
      }
    },

    _getAJAXSettings: function (data) {
      var options = $.extend({}, this.options, data);
      this._initFormSettings(options);
      this._initDataSettings(options);
      return options;
    },

    // jQuery 1.6 doesn't provide .state(),
    // while jQuery 1.8+ removed .isRejected() and .isResolved():
    _getDeferredState: function (deferred) {
      if (deferred.state) {
        return deferred.state();
      }
      if (deferred.isResolved()) {
        return 'resolved';
      }
      if (deferred.isRejected()) {
        return 'rejected';
      }
      return 'pending';
    },

    // Maps jqXHR callbacks to the equivalent
    // methods of the given Promise object:
    _enhancePromise: function (promise) {
      promise.success = promise.done;
      promise.error = promise.fail;
      promise.complete = promise.always;
      return promise;
    },

    // Creates and returns a Promise object enhanced with
    // the jqXHR methods abort, success, error and complete:
    _getXHRPromise: function (resolveOrReject, context, args) {
      var dfd = $.Deferred(),
        promise = dfd.promise();
      // eslint-disable-next-line no-param-reassign
      context = context || this.options.context || promise;
      if (resolveOrReject === true) {
        dfd.resolveWith(context, args);
      } else if (resolveOrReject === false) {
        dfd.rejectWith(context, args);
      }
      promise.abort = dfd.promise;
      return this._enhancePromise(promise);
    },

    // Adds convenience methods to the data callback argument:
    _addConvenienceMethods: function (e, data) {
      var that = this,
        getPromise = function (args) {
          return $.Deferred().resolveWith(that, args).promise();
        };
      data.process = function (resolveFunc, rejectFunc) {
        if (resolveFunc || rejectFunc) {
          data._processQueue = this._processQueue = (this._processQueue ||
            getPromise([this]))
            [that._promisePipe](function () {
              if (data.errorThrown) {
                return $.Deferred().rejectWith(that, [data]).promise();
              }
              return getPromise(arguments);
            })
            [that._promisePipe](resolveFunc, rejectFunc);
        }
        return this._processQueue || getPromise([this]);
      };
      data.submit = function () {
        if (this.state() !== 'pending') {
          data.jqXHR = this.jqXHR =
            that._trigger(
              'submit',
              $.Event('submit', { delegatedEvent: e }),
              this
            ) !== false && that._onSend(e, this);
        }
        return this.jqXHR || that._getXHRPromise();
      };
      data.abort = function () {
        if (this.jqXHR) {
          return this.jqXHR.abort();
        }
        this.errorThrown = 'abort';
        that._trigger('fail', null, this);
        return that._getXHRPromise(false);
      };
      data.state = function () {
        if (this.jqXHR) {
          return that._getDeferredState(this.jqXHR);
        }
        if (this._processQueue) {
          return that._getDeferredState(this._processQueue);
        }
      };
      data.processing = function () {
        return (
          !this.jqXHR &&
          this._processQueue &&
          that._getDeferredState(this._processQueue) === 'pending'
        );
      };
      data.progress = function () {
        return this._progress;
      };
      data.response = function () {
        return this._response;
      };
    },

    // Parses the Range header from the server response
    // and returns the uploaded bytes:
    _getUploadedBytes: function (jqXHR) {
      var range = jqXHR.getResponseHeader('Range'),
        parts = range && range.split('-'),
        upperBytesPos = parts && parts.length > 1 && parseInt(parts[1], 10);
      return upperBytesPos && upperBytesPos + 1;
    },

    // Uploads a file in multiple, sequential requests
    // by splitting the file up in multiple blob chunks.
    // If the second parameter is true, only tests if the file
    // should be uploaded in chunks, but does not invoke any
    // upload requests:
    _chunkedUpload: function (options, testOnly) {
      options.uploadedBytes = options.uploadedBytes || 0;
      var that = this,
        file = options.files[0],
        fs = file.size,
        ub = options.uploadedBytes,
        mcs = options.maxChunkSize || fs,
        slice = this._blobSlice,
        dfd = $.Deferred(),
        promise = dfd.promise(),
        jqXHR,
        upload;
      if (
        !(
          this._isXHRUpload(options) &&
          slice &&
          (ub || ($.type(mcs) === 'function' ? mcs(options) : mcs) < fs)
        ) ||
        options.data
      ) {
        return false;
      }
      if (testOnly) {
        return true;
      }
      if (ub >= fs) {
        file.error = options.i18n('uploadedBytes');
        return this._getXHRPromise(false, options.context, [
          null,
          'error',
          file.error
        ]);
      }
      // The chunk upload method:
      upload = function () {
        // Clone the options object for each chunk upload:
        var o = $.extend({}, options),
          currentLoaded = o._progress.loaded;
        o.blob = slice.call(
          file,
          ub,
          ub + ($.type(mcs) === 'function' ? mcs(o) : mcs),
          file.type
        );
        // Store the current chunk size, as the blob itself
        // will be dereferenced after data processing:
        o.chunkSize = o.blob.size;
        // Expose the chunk bytes position range:
        o.contentRange =
          'bytes ' + ub + '-' + (ub + o.chunkSize - 1) + '/' + fs;
        // Trigger chunkbeforesend to allow form data to be updated for this chunk
        that._trigger('chunkbeforesend', null, o);
        // Process the upload data (the blob and potential form data):
        that._initXHRData(o);
        // Add progress listeners for this chunk upload:
        that._initProgressListener(o);
        jqXHR = (
          (that._trigger('chunksend', null, o) !== false && $.ajax(o)) ||
          that._getXHRPromise(false, o.context)
        )
          .done(function (result, textStatus, jqXHR) {
            ub = that._getUploadedBytes(jqXHR) || ub + o.chunkSize;
            // Create a progress event if no final progress event
            // with loaded equaling total has been triggered
            // for this chunk:
            if (currentLoaded + o.chunkSize - o._progress.loaded) {
              that._onProgress(
                $.Event('progress', {
                  lengthComputable: true,
                  loaded: ub - o.uploadedBytes,
                  total: ub - o.uploadedBytes
                }),
                o
              );
            }
            options.uploadedBytes = o.uploadedBytes = ub;
            o.result = result;
            o.textStatus = textStatus;
            o.jqXHR = jqXHR;
            that._trigger('chunkdone', null, o);
            that._trigger('chunkalways', null, o);
            if (ub < fs) {
              // File upload not yet complete,
              // continue with the next chunk:
              upload();
            } else {
              dfd.resolveWith(o.context, [result, textStatus, jqXHR]);
            }
          })
          .fail(function (jqXHR, textStatus, errorThrown) {
            o.jqXHR = jqXHR;
            o.textStatus = textStatus;
            o.errorThrown = errorThrown;
            that._trigger('chunkfail', null, o);
            that._trigger('chunkalways', null, o);
            dfd.rejectWith(o.context, [jqXHR, textStatus, errorThrown]);
          })
          .always(function () {
            that._deinitProgressListener(o);
          });
      };
      this._enhancePromise(promise);
      promise.abort = function () {
        return jqXHR.abort();
      };
      upload();
      return promise;
    },

    _beforeSend: function (e, data) {
      if (this._active === 0) {
        // the start callback is triggered when an upload starts
        // and no other uploads are currently running,
        // equivalent to the global ajaxStart event:
        this._trigger('start');
        // Set timer for global bitrate progress calculation:
        this._bitrateTimer = new this._BitrateTimer();
        // Reset the global progress values:
        this._progress.loaded = this._progress.total = 0;
        this._progress.bitrate = 0;
      }
      // Make sure the container objects for the .response() and
      // .progress() methods on the data object are available
      // and reset to their initial state:
      this._initResponseObject(data);
      this._initProgressObject(data);
      data._progress.loaded = data.loaded = data.uploadedBytes || 0;
      data._progress.total = data.total = this._getTotal(data.files) || 1;
      data._progress.bitrate = data.bitrate = 0;
      this._active += 1;
      // Initialize the global progress values:
      this._progress.loaded += data.loaded;
      this._progress.total += data.total;
    },

    _onDone: function (result, textStatus, jqXHR, options) {
      var total = options._progress.total,
        response = options._response;
      if (options._progress.loaded < total) {
        // Create a progress event if no final progress event
        // with loaded equaling total has been triggered:
        this._onProgress(
          $.Event('progress', {
            lengthComputable: true,
            loaded: total,
            total: total
          }),
          options
        );
      }
      response.result = options.result = result;
      response.textStatus = options.textStatus = textStatus;
      response.jqXHR = options.jqXHR = jqXHR;
      this._trigger('done', null, options);
    },

    _onFail: function (jqXHR, textStatus, errorThrown, options) {
      var response = options._response;
      if (options.recalculateProgress) {
        // Remove the failed (error or abort) file upload from
        // the global progress calculation:
        this._progress.loaded -= options._progress.loaded;
        this._progress.total -= options._progress.total;
      }
      response.jqXHR = options.jqXHR = jqXHR;
      response.textStatus = options.textStatus = textStatus;
      response.errorThrown = options.errorThrown = errorThrown;
      this._trigger('fail', null, options);
    },

    _onAlways: function (jqXHRorResult, textStatus, jqXHRorError, options) {
      // jqXHRorResult, textStatus and jqXHRorError are added to the
      // options object via done and fail callbacks
      this._trigger('always', null, options);
    },

    _onSend: function (e, data) {
      if (!data.submit) {
        this._addConvenienceMethods(e, data);
      }
      var that = this,
        jqXHR,
        aborted,
        slot,
        pipe,
        options = that._getAJAXSettings(data),
        send = function () {
          that._sending += 1;
          // Set timer for bitrate progress calculation:
          options._bitrateTimer = new that._BitrateTimer();
          jqXHR =
            jqXHR ||
            (
              ((aborted ||
                that._trigger(
                  'send',
                  $.Event('send', { delegatedEvent: e }),
                  options
                ) === false) &&
                that._getXHRPromise(false, options.context, aborted)) ||
              that._chunkedUpload(options) ||
              $.ajax(options)
            )
              .done(function (result, textStatus, jqXHR) {
                that._onDone(result, textStatus, jqXHR, options);
              })
              .fail(function (jqXHR, textStatus, errorThrown) {
                that._onFail(jqXHR, textStatus, errorThrown, options);
              })
              .always(function (jqXHRorResult, textStatus, jqXHRorError) {
                that._deinitProgressListener(options);
                that._onAlways(
                  jqXHRorResult,
                  textStatus,
                  jqXHRorError,
                  options
                );
                that._sending -= 1;
                that._active -= 1;
                if (
                  options.limitConcurrentUploads &&
                  options.limitConcurrentUploads > that._sending
                ) {
                  // Start the next queued upload,
                  // that has not been aborted:
                  var nextSlot = that._slots.shift();
                  while (nextSlot) {
                    if (that._getDeferredState(nextSlot) === 'pending') {
                      nextSlot.resolve();
                      break;
                    }
                    nextSlot = that._slots.shift();
                  }
                }
                if (that._active === 0) {
                  // The stop callback is triggered when all uploads have
                  // been completed, equivalent to the global ajaxStop event:
                  that._trigger('stop');
                }
              });
          return jqXHR;
        };
      this._beforeSend(e, options);
      if (
        this.options.sequentialUploads ||
        (this.options.limitConcurrentUploads &&
          this.options.limitConcurrentUploads <= this._sending)
      ) {
        if (this.options.limitConcurrentUploads > 1) {
          slot = $.Deferred();
          this._slots.push(slot);
          pipe = slot[that._promisePipe](send);
        } else {
          this._sequence = this._sequence[that._promisePipe](send, send);
          pipe = this._sequence;
        }
        // Return the piped Promise object, enhanced with an abort method,
        // which is delegated to the jqXHR object of the current upload,
        // and jqXHR callbacks mapped to the equivalent Promise methods:
        pipe.abort = function () {
          aborted = [undefined, 'abort', 'abort'];
          if (!jqXHR) {
            if (slot) {
              slot.rejectWith(options.context, aborted);
            }
            return send();
          }
          return jqXHR.abort();
        };
        return this._enhancePromise(pipe);
      }
      return send();
    },

    _onAdd: function (e, data) {
      var that = this,
        result = true,
        options = $.extend({}, this.options, data),
        files = data.files,
        filesLength = files.length,
        limit = options.limitMultiFileUploads,
        limitSize = options.limitMultiFileUploadSize,
        overhead = options.limitMultiFileUploadSizeOverhead,
        batchSize = 0,
        paramName = this._getParamName(options),
        paramNameSet,
        paramNameSlice,
        fileSet,
        i,
        j = 0;
      if (!filesLength) {
        return false;
      }
      if (limitSize && files[0].size === undefined) {
        limitSize = undefined;
      }
      if (
        !(options.singleFileUploads || limit || limitSize) ||
        !this._isXHRUpload(options)
      ) {
        fileSet = [files];
        paramNameSet = [paramName];
      } else if (!(options.singleFileUploads || limitSize) && limit) {
        fileSet = [];
        paramNameSet = [];
        for (i = 0; i < filesLength; i += limit) {
          fileSet.push(files.slice(i, i + limit));
          paramNameSlice = paramName.slice(i, i + limit);
          if (!paramNameSlice.length) {
            paramNameSlice = paramName;
          }
          paramNameSet.push(paramNameSlice);
        }
      } else if (!options.singleFileUploads && limitSize) {
        fileSet = [];
        paramNameSet = [];
        for (i = 0; i < filesLength; i = i + 1) {
          batchSize += files[i].size + overhead;
          if (
            i + 1 === filesLength ||
            batchSize + files[i + 1].size + overhead > limitSize ||
            (limit && i + 1 - j >= limit)
          ) {
            fileSet.push(files.slice(j, i + 1));
            paramNameSlice = paramName.slice(j, i + 1);
            if (!paramNameSlice.length) {
              paramNameSlice = paramName;
            }
            paramNameSet.push(paramNameSlice);
            j = i + 1;
            batchSize = 0;
          }
        }
      } else {
        paramNameSet = paramName;
      }
      data.originalFiles = files;
      $.each(fileSet || files, function (index, element) {
        var newData = $.extend({}, data);
        newData.files = fileSet ? element : [element];
        newData.paramName = paramNameSet[index];
        that._initResponseObject(newData);
        that._initProgressObject(newData);
        that._addConvenienceMethods(e, newData);
        result = that._trigger(
          'add',
          $.Event('add', { delegatedEvent: e }),
          newData
        );
        return result;
      });
      return result;
    },

    _replaceFileInput: function (data) {
      var input = data.fileInput,
        inputClone = input.clone(true),
        restoreFocus = input.is(document.activeElement);
      // Add a reference for the new cloned file input to the data argument:
      data.fileInputClone = inputClone;
      $('<form></form>').append(inputClone)[0].reset();
      // Detaching allows to insert the fileInput on another form
      // without losing the file input value:
      input.after(inputClone).detach();
      // If the fileInput had focus before it was detached,
      // restore focus to the inputClone.
      if (restoreFocus) {
        inputClone.trigger('focus');
      }
      // Avoid memory leaks with the detached file input:
      $.cleanData(input.off('remove'));
      // Replace the original file input element in the fileInput
      // elements set with the clone, which has been copied including
      // event handlers:
      this.options.fileInput = this.options.fileInput.map(function (i, el) {
        if (el === input[0]) {
          return inputClone[0];
        }
        return el;
      });
      // If the widget has been initialized on the file input itself,
      // override this.element with the file input clone:
      if (input[0] === this.element[0]) {
        this.element = inputClone;
      }
    },

    _handleFileTreeEntry: function (entry, path) {
      var that = this,
        dfd = $.Deferred(),
        entries = [],
        dirReader,
        errorHandler = function (e) {
          if (e && !e.entry) {
            e.entry = entry;
          }
          // Since $.when returns immediately if one
          // Deferred is rejected, we use resolve instead.
          // This allows valid files and invalid items
          // to be returned together in one set:
          dfd.resolve([e]);
        },
        successHandler = function (entries) {
          that
            ._handleFileTreeEntries(entries, path + entry.name + '/')
            .done(function (files) {
              dfd.resolve(files);
            })
            .fail(errorHandler);
        },
        readEntries = function () {
          dirReader.readEntries(function (results) {
            if (!results.length) {
              successHandler(entries);
            } else {
              entries = entries.concat(results);
              readEntries();
            }
          }, errorHandler);
        };
      // eslint-disable-next-line no-param-reassign
      path = path || '';
      if (entry.isFile) {
        if (entry._file) {
          // Workaround for Chrome bug #149735
          entry._file.relativePath = path;
          dfd.resolve(entry._file);
        } else {
          entry.file(function (file) {
            file.relativePath = path;
            dfd.resolve(file);
          }, errorHandler);
        }
      } else if (entry.isDirectory) {
        dirReader = entry.createReader();
        readEntries();
      } else {
        // Return an empty list for file system items
        // other than files or directories:
        dfd.resolve([]);
      }
      return dfd.promise();
    },

    _handleFileTreeEntries: function (entries, path) {
      var that = this;
      return $.when
        .apply(
          $,
          $.map(entries, function (entry) {
            return that._handleFileTreeEntry(entry, path);
          })
        )
        [this._promisePipe](function () {
          return Array.prototype.concat.apply([], arguments);
        });
    },

    _getDroppedFiles: function (dataTransfer) {
      // eslint-disable-next-line no-param-reassign
      dataTransfer = dataTransfer || {};
      var items = dataTransfer.items;
      if (
        items &&
        items.length &&
        (items[0].webkitGetAsEntry || items[0].getAsEntry)
      ) {
        return this._handleFileTreeEntries(
          $.map(items, function (item) {
            var entry;
            if (item.webkitGetAsEntry) {
              entry = item.webkitGetAsEntry();
              if (entry) {
                // Workaround for Chrome bug #149735:
                entry._file = item.getAsFile();
              }
              return entry;
            }
            return item.getAsEntry();
          })
        );
      }
      return $.Deferred().resolve($.makeArray(dataTransfer.files)).promise();
    },

    _getSingleFileInputFiles: function (fileInput) {
      // eslint-disable-next-line no-param-reassign
      fileInput = $(fileInput);
      var entries = fileInput.prop('entries'),
        files,
        value;
      if (entries && entries.length) {
        return this._handleFileTreeEntries(entries);
      }
      files = $.makeArray(fileInput.prop('files'));
      if (!files.length) {
        value = fileInput.prop('value');
        if (!value) {
          return $.Deferred().resolve([]).promise();
        }
        // If the files property is not available, the browser does not
        // support the File API and we add a pseudo File object with
        // the input value as name with path information removed:
        files = [{ name: value.replace(/^.*\\/, '') }];
      } else if (files[0].name === undefined && files[0].fileName) {
        // File normalization for Safari 4 and Firefox 3:
        $.each(files, function (index, file) {
          file.name = file.fileName;
          file.size = file.fileSize;
        });
      }
      return $.Deferred().resolve(files).promise();
    },

    _getFileInputFiles: function (fileInput) {
      if (!(fileInput instanceof $) || fileInput.length === 1) {
        return this._getSingleFileInputFiles(fileInput);
      }
      return $.when
        .apply($, $.map(fileInput, this._getSingleFileInputFiles))
        [this._promisePipe](function () {
          return Array.prototype.concat.apply([], arguments);
        });
    },

    _onChange: function (e) {
      var that = this,
        data = {
          fileInput: $(e.target),
          form: $(e.target.form)
        };
      this._getFileInputFiles(data.fileInput).always(function (files) {
        data.files = files;
        if (that.options.replaceFileInput) {
          that._replaceFileInput(data);
        }
        if (
          that._trigger(
            'change',
            $.Event('change', { delegatedEvent: e }),
            data
          ) !== false
        ) {
          that._onAdd(e, data);
        }
      });
    },

    _onPaste: function (e) {
      var items =
          e.originalEvent &&
          e.originalEvent.clipboardData &&
          e.originalEvent.clipboardData.items,
        data = { files: [] };
      if (items && items.length) {
        $.each(items, function (index, item) {
          var file = item.getAsFile && item.getAsFile();
          if (file) {
            data.files.push(file);
          }
        });
        if (
          this._trigger(
            'paste',
            $.Event('paste', { delegatedEvent: e }),
            data
          ) !== false
        ) {
          this._onAdd(e, data);
        }
      }
    },

    _onDrop: function (e) {
      e.dataTransfer = e.originalEvent && e.originalEvent.dataTransfer;
      var that = this,
        dataTransfer = e.dataTransfer,
        data = {};
      if (dataTransfer && dataTransfer.files && dataTransfer.files.length) {
        e.preventDefault();
        this._getDroppedFiles(dataTransfer).always(function (files) {
          data.files = files;
          if (
            that._trigger(
              'drop',
              $.Event('drop', { delegatedEvent: e }),
              data
            ) !== false
          ) {
            that._onAdd(e, data);
          }
        });
      }
    },

    _onDragOver: getDragHandler('dragover'),

    _onDragEnter: getDragHandler('dragenter'),

    _onDragLeave: getDragHandler('dragleave'),

    _initEventHandlers: function () {
      if (this._isXHRUpload(this.options)) {
        this._on(this.options.dropZone, {
          dragover: this._onDragOver,
          drop: this._onDrop,
          // event.preventDefault() on dragenter is required for IE10+:
          dragenter: this._onDragEnter,
          // dragleave is not required, but added for completeness:
          dragleave: this._onDragLeave
        });
        this._on(this.options.pasteZone, {
          paste: this._onPaste
        });
      }
      if ($.support.fileInput) {
        this._on(this.options.fileInput, {
          change: this._onChange
        });
      }
    },

    _destroyEventHandlers: function () {
      this._off(this.options.dropZone, 'dragenter dragleave dragover drop');
      this._off(this.options.pasteZone, 'paste');
      this._off(this.options.fileInput, 'change');
    },

    _destroy: function () {
      this._destroyEventHandlers();
    },

    _setOption: function (key, value) {
      var reinit = $.inArray(key, this._specialOptions) !== -1;
      if (reinit) {
        this._destroyEventHandlers();
      }
      this._super(key, value);
      if (reinit) {
        this._initSpecialOptions();
        this._initEventHandlers();
      }
    },

    _initSpecialOptions: function () {
      var options = this.options;
      if (options.fileInput === undefined) {
        options.fileInput = this.element.is('input[type="file"]')
          ? this.element
          : this.element.find('input[type="file"]');
      } else if (!(options.fileInput instanceof $)) {
        options.fileInput = $(options.fileInput);
      }
      if (!(options.dropZone instanceof $)) {
        options.dropZone = $(options.dropZone);
      }
      if (!(options.pasteZone instanceof $)) {
        options.pasteZone = $(options.pasteZone);
      }
    },

    _getRegExp: function (str) {
      var parts = str.split('/'),
        modifiers = parts.pop();
      parts.shift();
      return new RegExp(parts.join('/'), modifiers);
    },

    _isRegExpOption: function (key, value) {
      return (
        key !== 'url' &&
        $.type(value) === 'string' &&
        /^\/.*\/[igm]{0,3}$/.test(value)
      );
    },

    _initDataAttributes: function () {
      var that = this,
        options = this.options,
        data = this.element.data();
      // Initialize options set via HTML5 data-attributes:
      $.each(this.element[0].attributes, function (index, attr) {
        var key = attr.name.toLowerCase(),
          value;
        if (/^data-/.test(key)) {
          // Convert hyphen-ated key to camelCase:
          key = key.slice(5).replace(/-[a-z]/g, function (str) {
            return str.charAt(1).toUpperCase();
          });
          value = data[key];
          if (that._isRegExpOption(key, value)) {
            value = that._getRegExp(value);
          }
          options[key] = value;
        }
      });
    },

    _create: function () {
      this._initDataAttributes();
      this._initSpecialOptions();
      this._slots = [];
      this._sequence = this._getXHRPromise(true);
      this._sending = this._active = 0;
      this._initProgressObject(this);
      this._initEventHandlers();
    },

    // This method is exposed to the widget API and allows to query
    // the number of active uploads:
    active: function () {
      return this._active;
    },

    // This method is exposed to the widget API and allows to query
    // the widget upload progress.
    // It returns an object with loaded, total and bitrate properties
    // for the running uploads:
    progress: function () {
      return this._progress;
    },

    // This method is exposed to the widget API and allows adding files
    // using the fileupload API. The data parameter accepts an object which
    // must have a files property and can contain additional options:
    // .fileupload('add', {files: filesList});
    add: function (data) {
      var that = this;
      if (!data || this.options.disabled) {
        return;
      }
      if (data.fileInput && !data.files) {
        this._getFileInputFiles(data.fileInput).always(function (files) {
          data.files = files;
          that._onAdd(null, data);
        });
      } else {
        data.files = $.makeArray(data.files);
        this._onAdd(null, data);
      }
    },

    // This method is exposed to the widget API and allows sending files
    // using the fileupload API. The data parameter accepts an object which
    // must have a files or fileInput property and can contain additional options:
    // .fileupload('send', {files: filesList});
    // The method returns a Promise object for the file upload call.
    send: function (data) {
      if (data && !this.options.disabled) {
        if (data.fileInput && !data.files) {
          var that = this,
            dfd = $.Deferred(),
            promise = dfd.promise(),
            jqXHR,
            aborted;
          promise.abort = function () {
            aborted = true;
            if (jqXHR) {
              return jqXHR.abort();
            }
            dfd.reject(null, 'abort', 'abort');
            return promise;
          };
          this._getFileInputFiles(data.fileInput).always(function (files) {
            if (aborted) {
              return;
            }
            if (!files.length) {
              dfd.reject();
              return;
            }
            data.files = files;
            jqXHR = that._onSend(null, data);
            jqXHR.then(
              function (result, textStatus, jqXHR) {
                dfd.resolve(result, textStatus, jqXHR);
              },
              function (jqXHR, textStatus, errorThrown) {
                dfd.reject(jqXHR, textStatus, errorThrown);
              }
            );
          });
          return this._enhancePromise(promise);
        }
        data.files = $.makeArray(data.files);
        if (data.files.length) {
          return this._onSend(null, data);
        }
      }
      return this._getXHRPromise(false, data && data.context);
    }
  });
});


/*!
 * @fileOverview TouchSwipe - jQuery Plugin
 * @version 1.6.18
 *
 * @author Matt Bryson http://www.github.com/mattbryson
 * @see https://github.com/mattbryson/TouchSwipe-Jquery-Plugin
 * @see http://labs.rampinteractive.co.uk/touchSwipe/
 * @see http://plugins.jquery.com/project/touchSwipe
 * @license
 * Copyright (c) 2010-2015 Matt Bryson
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 */

!function(factory){"function"==typeof define&&define.amd&&define.amd.jQuery?define(["jquery"],factory):factory("undefined"!=typeof module&&module.exports?require("jquery"):jQuery)}(function($){"use strict";function init(options){return!options||void 0!==options.allowPageScroll||void 0===options.swipe&&void 0===options.swipeStatus||(options.allowPageScroll=NONE),void 0!==options.click&&void 0===options.tap&&(options.tap=options.click),options||(options={}),options=$.extend({},$.fn.swipe.defaults,options),this.each(function(){var $this=$(this),plugin=$this.data(PLUGIN_NS);plugin||(plugin=new TouchSwipe(this,options),$this.data(PLUGIN_NS,plugin))})}function TouchSwipe(element,options){function touchStart(jqEvent){if(!(getTouchInProgress()||$(jqEvent.target).closest(options.excludedElements,$element).length>0)){var event=jqEvent.originalEvent?jqEvent.originalEvent:jqEvent;if(!event.pointerType||"mouse"!=event.pointerType||0!=options.fallbackToMouseEvents){var ret,touches=event.touches,evt=touches?touches[0]:event;return phase=PHASE_START,touches?fingerCount=touches.length:options.preventDefaultEvents!==!1&&jqEvent.preventDefault(),distance=0,direction=null,currentDirection=null,pinchDirection=null,duration=0,startTouchesDistance=0,endTouchesDistance=0,pinchZoom=1,pinchDistance=0,maximumsMap=createMaximumsData(),cancelMultiFingerRelease(),createFingerData(0,evt),!touches||fingerCount===options.fingers||options.fingers===ALL_FINGERS||hasPinches()?(startTime=getTimeStamp(),2==fingerCount&&(createFingerData(1,touches[1]),startTouchesDistance=endTouchesDistance=calculateTouchesDistance(fingerData[0].start,fingerData[1].start)),(options.swipeStatus||options.pinchStatus)&&(ret=triggerHandler(event,phase))):ret=!1,ret===!1?(phase=PHASE_CANCEL,triggerHandler(event,phase),ret):(options.hold&&(holdTimeout=setTimeout($.proxy(function(){$element.trigger("hold",[event.target]),options.hold&&(ret=options.hold.call($element,event,event.target))},this),options.longTapThreshold)),setTouchInProgress(!0),null)}}}function touchMove(jqEvent){var event=jqEvent.originalEvent?jqEvent.originalEvent:jqEvent;if(phase!==PHASE_END&&phase!==PHASE_CANCEL&&!inMultiFingerRelease()){var ret,touches=event.touches,evt=touches?touches[0]:event,currentFinger=updateFingerData(evt);if(endTime=getTimeStamp(),touches&&(fingerCount=touches.length),options.hold&&clearTimeout(holdTimeout),phase=PHASE_MOVE,2==fingerCount&&(0==startTouchesDistance?(createFingerData(1,touches[1]),startTouchesDistance=endTouchesDistance=calculateTouchesDistance(fingerData[0].start,fingerData[1].start)):(updateFingerData(touches[1]),endTouchesDistance=calculateTouchesDistance(fingerData[0].end,fingerData[1].end),pinchDirection=calculatePinchDirection(fingerData[0].end,fingerData[1].end)),pinchZoom=calculatePinchZoom(startTouchesDistance,endTouchesDistance),pinchDistance=Math.abs(startTouchesDistance-endTouchesDistance)),fingerCount===options.fingers||options.fingers===ALL_FINGERS||!touches||hasPinches()){if(direction=calculateDirection(currentFinger.start,currentFinger.end),currentDirection=calculateDirection(currentFinger.last,currentFinger.end),validateDefaultEvent(jqEvent,currentDirection),distance=calculateDistance(currentFinger.start,currentFinger.end),duration=calculateDuration(),setMaxDistance(direction,distance),ret=triggerHandler(event,phase),!options.triggerOnTouchEnd||options.triggerOnTouchLeave){var inBounds=!0;if(options.triggerOnTouchLeave){var bounds=getbounds(this);inBounds=isInBounds(currentFinger.end,bounds)}!options.triggerOnTouchEnd&&inBounds?phase=getNextPhase(PHASE_MOVE):options.triggerOnTouchLeave&&!inBounds&&(phase=getNextPhase(PHASE_END)),phase!=PHASE_CANCEL&&phase!=PHASE_END||triggerHandler(event,phase)}}else phase=PHASE_CANCEL,triggerHandler(event,phase);ret===!1&&(phase=PHASE_CANCEL,triggerHandler(event,phase))}}function touchEnd(jqEvent){var event=jqEvent.originalEvent?jqEvent.originalEvent:jqEvent,touches=event.touches;if(touches){if(touches.length&&!inMultiFingerRelease())return startMultiFingerRelease(event),!0;if(touches.length&&inMultiFingerRelease())return!0}return inMultiFingerRelease()&&(fingerCount=fingerCountAtRelease),endTime=getTimeStamp(),duration=calculateDuration(),didSwipeBackToCancel()||!validateSwipeDistance()?(phase=PHASE_CANCEL,triggerHandler(event,phase)):options.triggerOnTouchEnd||options.triggerOnTouchEnd===!1&&phase===PHASE_MOVE?(options.preventDefaultEvents!==!1&&jqEvent.preventDefault(),phase=PHASE_END,triggerHandler(event,phase)):!options.triggerOnTouchEnd&&hasTap()?(phase=PHASE_END,triggerHandlerForGesture(event,phase,TAP)):phase===PHASE_MOVE&&(phase=PHASE_CANCEL,triggerHandler(event,phase)),setTouchInProgress(!1),null}function touchCancel(){fingerCount=0,endTime=0,startTime=0,startTouchesDistance=0,endTouchesDistance=0,pinchZoom=1,cancelMultiFingerRelease(),setTouchInProgress(!1)}function touchLeave(jqEvent){var event=jqEvent.originalEvent?jqEvent.originalEvent:jqEvent;options.triggerOnTouchLeave&&(phase=getNextPhase(PHASE_END),triggerHandler(event,phase))}function removeListeners(){$element.unbind(START_EV,touchStart),$element.unbind(CANCEL_EV,touchCancel),$element.unbind(MOVE_EV,touchMove),$element.unbind(END_EV,touchEnd),LEAVE_EV&&$element.unbind(LEAVE_EV,touchLeave),setTouchInProgress(!1)}function getNextPhase(currentPhase){var nextPhase=currentPhase,validTime=validateSwipeTime(),validDistance=validateSwipeDistance(),didCancel=didSwipeBackToCancel();return!validTime||didCancel?nextPhase=PHASE_CANCEL:!validDistance||currentPhase!=PHASE_MOVE||options.triggerOnTouchEnd&&!options.triggerOnTouchLeave?!validDistance&&currentPhase==PHASE_END&&options.triggerOnTouchLeave&&(nextPhase=PHASE_CANCEL):nextPhase=PHASE_END,nextPhase}function triggerHandler(event,phase){var ret,touches=event.touches;return(didSwipe()||hasSwipes())&&(ret=triggerHandlerForGesture(event,phase,SWIPE)),(didPinch()||hasPinches())&&ret!==!1&&(ret=triggerHandlerForGesture(event,phase,PINCH)),didDoubleTap()&&ret!==!1?ret=triggerHandlerForGesture(event,phase,DOUBLE_TAP):didLongTap()&&ret!==!1?ret=triggerHandlerForGesture(event,phase,LONG_TAP):didTap()&&ret!==!1&&(ret=triggerHandlerForGesture(event,phase,TAP)),phase===PHASE_CANCEL&&touchCancel(event),phase===PHASE_END&&(touches?touches.length||touchCancel(event):touchCancel(event)),ret}function triggerHandlerForGesture(event,phase,gesture){var ret;if(gesture==SWIPE){if($element.trigger("swipeStatus",[phase,direction||null,distance||0,duration||0,fingerCount,fingerData,currentDirection]),options.swipeStatus&&(ret=options.swipeStatus.call($element,event,phase,direction||null,distance||0,duration||0,fingerCount,fingerData,currentDirection),ret===!1))return!1;if(phase==PHASE_END&&validateSwipe()){if(clearTimeout(singleTapTimeout),clearTimeout(holdTimeout),$element.trigger("swipe",[direction,distance,duration,fingerCount,fingerData,currentDirection]),options.swipe&&(ret=options.swipe.call($element,event,direction,distance,duration,fingerCount,fingerData,currentDirection),ret===!1))return!1;switch(direction){case LEFT:$element.trigger("swipeLeft",[direction,distance,duration,fingerCount,fingerData,currentDirection]),options.swipeLeft&&(ret=options.swipeLeft.call($element,event,direction,distance,duration,fingerCount,fingerData,currentDirection));break;case RIGHT:$element.trigger("swipeRight",[direction,distance,duration,fingerCount,fingerData,currentDirection]),options.swipeRight&&(ret=options.swipeRight.call($element,event,direction,distance,duration,fingerCount,fingerData,currentDirection));break;case UP:$element.trigger("swipeUp",[direction,distance,duration,fingerCount,fingerData,currentDirection]),options.swipeUp&&(ret=options.swipeUp.call($element,event,direction,distance,duration,fingerCount,fingerData,currentDirection));break;case DOWN:$element.trigger("swipeDown",[direction,distance,duration,fingerCount,fingerData,currentDirection]),options.swipeDown&&(ret=options.swipeDown.call($element,event,direction,distance,duration,fingerCount,fingerData,currentDirection))}}}if(gesture==PINCH){if($element.trigger("pinchStatus",[phase,pinchDirection||null,pinchDistance||0,duration||0,fingerCount,pinchZoom,fingerData]),options.pinchStatus&&(ret=options.pinchStatus.call($element,event,phase,pinchDirection||null,pinchDistance||0,duration||0,fingerCount,pinchZoom,fingerData),ret===!1))return!1;if(phase==PHASE_END&&validatePinch())switch(pinchDirection){case IN:$element.trigger("pinchIn",[pinchDirection||null,pinchDistance||0,duration||0,fingerCount,pinchZoom,fingerData]),options.pinchIn&&(ret=options.pinchIn.call($element,event,pinchDirection||null,pinchDistance||0,duration||0,fingerCount,pinchZoom,fingerData));break;case OUT:$element.trigger("pinchOut",[pinchDirection||null,pinchDistance||0,duration||0,fingerCount,pinchZoom,fingerData]),options.pinchOut&&(ret=options.pinchOut.call($element,event,pinchDirection||null,pinchDistance||0,duration||0,fingerCount,pinchZoom,fingerData))}}return gesture==TAP?phase!==PHASE_CANCEL&&phase!==PHASE_END||(clearTimeout(singleTapTimeout),clearTimeout(holdTimeout),hasDoubleTap()&&!inDoubleTap()?(doubleTapStartTime=getTimeStamp(),singleTapTimeout=setTimeout($.proxy(function(){doubleTapStartTime=null,$element.trigger("tap",[event.target]),options.tap&&(ret=options.tap.call($element,event,event.target))},this),options.doubleTapThreshold)):(doubleTapStartTime=null,$element.trigger("tap",[event.target]),options.tap&&(ret=options.tap.call($element,event,event.target)))):gesture==DOUBLE_TAP?phase!==PHASE_CANCEL&&phase!==PHASE_END||(clearTimeout(singleTapTimeout),clearTimeout(holdTimeout),doubleTapStartTime=null,$element.trigger("doubletap",[event.target]),options.doubleTap&&(ret=options.doubleTap.call($element,event,event.target))):gesture==LONG_TAP&&(phase!==PHASE_CANCEL&&phase!==PHASE_END||(clearTimeout(singleTapTimeout),doubleTapStartTime=null,$element.trigger("longtap",[event.target]),options.longTap&&(ret=options.longTap.call($element,event,event.target)))),ret}function validateSwipeDistance(){var valid=!0;return null!==options.threshold&&(valid=distance>=options.threshold),valid}function didSwipeBackToCancel(){var cancelled=!1;return null!==options.cancelThreshold&&null!==direction&&(cancelled=getMaxDistance(direction)-distance>=options.cancelThreshold),cancelled}function validatePinchDistance(){return null===options.pinchThreshold||pinchDistance>=options.pinchThreshold}function validateSwipeTime(){var result;return result=!options.maxTimeThreshold||!(duration>=options.maxTimeThreshold)}function validateDefaultEvent(jqEvent,direction){if(options.preventDefaultEvents!==!1)if(options.allowPageScroll===NONE)jqEvent.preventDefault();else{var auto=options.allowPageScroll===AUTO;switch(direction){case LEFT:(options.swipeLeft&&auto||!auto&&options.allowPageScroll!=HORIZONTAL)&&jqEvent.preventDefault();break;case RIGHT:(options.swipeRight&&auto||!auto&&options.allowPageScroll!=HORIZONTAL)&&jqEvent.preventDefault();break;case UP:(options.swipeUp&&auto||!auto&&options.allowPageScroll!=VERTICAL)&&jqEvent.preventDefault();break;case DOWN:(options.swipeDown&&auto||!auto&&options.allowPageScroll!=VERTICAL)&&jqEvent.preventDefault();break;case NONE:}}}function validatePinch(){var hasCorrectFingerCount=validateFingers(),hasEndPoint=validateEndPoint(),hasCorrectDistance=validatePinchDistance();return hasCorrectFingerCount&&hasEndPoint&&hasCorrectDistance}function hasPinches(){return!!(options.pinchStatus||options.pinchIn||options.pinchOut)}function didPinch(){return!(!validatePinch()||!hasPinches())}function validateSwipe(){var hasValidTime=validateSwipeTime(),hasValidDistance=validateSwipeDistance(),hasCorrectFingerCount=validateFingers(),hasEndPoint=validateEndPoint(),didCancel=didSwipeBackToCancel(),valid=!didCancel&&hasEndPoint&&hasCorrectFingerCount&&hasValidDistance&&hasValidTime;return valid}function hasSwipes(){return!!(options.swipe||options.swipeStatus||options.swipeLeft||options.swipeRight||options.swipeUp||options.swipeDown)}function didSwipe(){return!(!validateSwipe()||!hasSwipes())}function validateFingers(){return fingerCount===options.fingers||options.fingers===ALL_FINGERS||!SUPPORTS_TOUCH}function validateEndPoint(){return 0!==fingerData[0].end.x}function hasTap(){return!!options.tap}function hasDoubleTap(){return!!options.doubleTap}function hasLongTap(){return!!options.longTap}function validateDoubleTap(){if(null==doubleTapStartTime)return!1;var now=getTimeStamp();return hasDoubleTap()&&now-doubleTapStartTime<=options.doubleTapThreshold}function inDoubleTap(){return validateDoubleTap()}function validateTap(){return(1===fingerCount||!SUPPORTS_TOUCH)&&(isNaN(distance)||distance<options.threshold)}function validateLongTap(){return duration>options.longTapThreshold&&distance<DOUBLE_TAP_THRESHOLD}function didTap(){return!(!validateTap()||!hasTap())}function didDoubleTap(){return!(!validateDoubleTap()||!hasDoubleTap())}function didLongTap(){return!(!validateLongTap()||!hasLongTap())}function startMultiFingerRelease(event){previousTouchEndTime=getTimeStamp(),fingerCountAtRelease=event.touches.length+1}function cancelMultiFingerRelease(){previousTouchEndTime=0,fingerCountAtRelease=0}function inMultiFingerRelease(){var withinThreshold=!1;if(previousTouchEndTime){var diff=getTimeStamp()-previousTouchEndTime;diff<=options.fingerReleaseThreshold&&(withinThreshold=!0)}return withinThreshold}function getTouchInProgress(){return!($element.data(PLUGIN_NS+"_intouch")!==!0)}function setTouchInProgress(val){$element&&(val===!0?($element.bind(MOVE_EV,touchMove),$element.bind(END_EV,touchEnd),LEAVE_EV&&$element.bind(LEAVE_EV,touchLeave)):($element.unbind(MOVE_EV,touchMove,!1),$element.unbind(END_EV,touchEnd,!1),LEAVE_EV&&$element.unbind(LEAVE_EV,touchLeave,!1)),$element.data(PLUGIN_NS+"_intouch",val===!0))}function createFingerData(id,evt){var f={start:{x:0,y:0},last:{x:0,y:0},end:{x:0,y:0}};return f.start.x=f.last.x=f.end.x=evt.pageX||evt.clientX,f.start.y=f.last.y=f.end.y=evt.pageY||evt.clientY,fingerData[id]=f,f}function updateFingerData(evt){var id=void 0!==evt.identifier?evt.identifier:0,f=getFingerData(id);return null===f&&(f=createFingerData(id,evt)),f.last.x=f.end.x,f.last.y=f.end.y,f.end.x=evt.pageX||evt.clientX,f.end.y=evt.pageY||evt.clientY,f}function getFingerData(id){return fingerData[id]||null}function setMaxDistance(direction,distance){direction!=NONE&&(distance=Math.max(distance,getMaxDistance(direction)),maximumsMap[direction].distance=distance)}function getMaxDistance(direction){if(maximumsMap[direction])return maximumsMap[direction].distance}function createMaximumsData(){var maxData={};return maxData[LEFT]=createMaximumVO(LEFT),maxData[RIGHT]=createMaximumVO(RIGHT),maxData[UP]=createMaximumVO(UP),maxData[DOWN]=createMaximumVO(DOWN),maxData}function createMaximumVO(dir){return{direction:dir,distance:0}}function calculateDuration(){return endTime-startTime}function calculateTouchesDistance(startPoint,endPoint){var diffX=Math.abs(startPoint.x-endPoint.x),diffY=Math.abs(startPoint.y-endPoint.y);return Math.round(Math.sqrt(diffX*diffX+diffY*diffY))}function calculatePinchZoom(startDistance,endDistance){var percent=endDistance/startDistance*1;return percent.toFixed(2)}function calculatePinchDirection(){return pinchZoom<1?OUT:IN}function calculateDistance(startPoint,endPoint){return Math.round(Math.sqrt(Math.pow(endPoint.x-startPoint.x,2)+Math.pow(endPoint.y-startPoint.y,2)))}function calculateAngle(startPoint,endPoint){var x=startPoint.x-endPoint.x,y=endPoint.y-startPoint.y,r=Math.atan2(y,x),angle=Math.round(180*r/Math.PI);return angle<0&&(angle=360-Math.abs(angle)),angle}function calculateDirection(startPoint,endPoint){if(comparePoints(startPoint,endPoint))return NONE;var angle=calculateAngle(startPoint,endPoint);return angle<=45&&angle>=0?LEFT:angle<=360&&angle>=315?LEFT:angle>=135&&angle<=225?RIGHT:angle>45&&angle<135?DOWN:UP}function getTimeStamp(){var now=new Date;return now.getTime()}function getbounds(el){el=$(el);var offset=el.offset(),bounds={left:offset.left,right:offset.left+el.outerWidth(),top:offset.top,bottom:offset.top+el.outerHeight()};return bounds}function isInBounds(point,bounds){return point.x>bounds.left&&point.x<bounds.right&&point.y>bounds.top&&point.y<bounds.bottom}function comparePoints(pointA,pointB){return pointA.x==pointB.x&&pointA.y==pointB.y}var options=$.extend({},options),useTouchEvents=SUPPORTS_TOUCH||SUPPORTS_POINTER||!options.fallbackToMouseEvents,START_EV=useTouchEvents?SUPPORTS_POINTER?SUPPORTS_POINTER_IE10?"MSPointerDown":"pointerdown":"touchstart":"mousedown",MOVE_EV=useTouchEvents?SUPPORTS_POINTER?SUPPORTS_POINTER_IE10?"MSPointerMove":"pointermove":"touchmove":"mousemove",END_EV=useTouchEvents?SUPPORTS_POINTER?SUPPORTS_POINTER_IE10?"MSPointerUp":"pointerup":"touchend":"mouseup",LEAVE_EV=useTouchEvents?SUPPORTS_POINTER?"mouseleave":null:"mouseleave",CANCEL_EV=SUPPORTS_POINTER?SUPPORTS_POINTER_IE10?"MSPointerCancel":"pointercancel":"touchcancel",distance=0,direction=null,currentDirection=null,duration=0,startTouchesDistance=0,endTouchesDistance=0,pinchZoom=1,pinchDistance=0,pinchDirection=0,maximumsMap=null,$element=$(element),phase="start",fingerCount=0,fingerData={},startTime=0,endTime=0,previousTouchEndTime=0,fingerCountAtRelease=0,doubleTapStartTime=0,singleTapTimeout=null,holdTimeout=null;try{$element.bind(START_EV,touchStart),$element.bind(CANCEL_EV,touchCancel)}catch(e){$.error("events not supported "+START_EV+","+CANCEL_EV+" on jQuery.swipe")}this.enable=function(){return this.disable(),$element.bind(START_EV,touchStart),$element.bind(CANCEL_EV,touchCancel),$element},this.disable=function(){return removeListeners(),$element},this.destroy=function(){removeListeners(),$element.data(PLUGIN_NS,null),$element=null},this.option=function(property,value){if("object"==typeof property)options=$.extend(options,property);else if(void 0!==options[property]){if(void 0===value)return options[property];options[property]=value}else{if(!property)return options;$.error("Option "+property+" does not exist on jQuery.swipe.options")}return null}}var VERSION="1.6.18",LEFT="left",RIGHT="right",UP="up",DOWN="down",IN="in",OUT="out",NONE="none",AUTO="auto",SWIPE="swipe",PINCH="pinch",TAP="tap",DOUBLE_TAP="doubletap",LONG_TAP="longtap",HORIZONTAL="horizontal",VERTICAL="vertical",ALL_FINGERS="all",DOUBLE_TAP_THRESHOLD=10,PHASE_START="start",PHASE_MOVE="move",PHASE_END="end",PHASE_CANCEL="cancel",SUPPORTS_TOUCH="ontouchstart"in window,SUPPORTS_POINTER_IE10=window.navigator.msPointerEnabled&&!window.PointerEvent&&!SUPPORTS_TOUCH,SUPPORTS_POINTER=(window.PointerEvent||window.navigator.msPointerEnabled)&&!SUPPORTS_TOUCH,PLUGIN_NS="TouchSwipe",defaults={fingers:1,threshold:75,cancelThreshold:null,pinchThreshold:20,maxTimeThreshold:null,fingerReleaseThreshold:250,longTapThreshold:500,doubleTapThreshold:200,swipe:null,swipeLeft:null,swipeRight:null,swipeUp:null,swipeDown:null,swipeStatus:null,pinchIn:null,pinchOut:null,pinchStatus:null,click:null,tap:null,doubleTap:null,longTap:null,hold:null,triggerOnTouchEnd:!0,triggerOnTouchLeave:!1,allowPageScroll:"auto",fallbackToMouseEvents:!0,excludedElements:".noSwipe",preventDefaultEvents:!0};$.fn.swipe=function(method){var $this=$(this),plugin=$this.data(PLUGIN_NS);if(plugin&&"string"==typeof method){if(plugin[method])return plugin[method].apply(plugin,Array.prototype.slice.call(arguments,1));$.error("Method "+method+" does not exist on jQuery.swipe")}else if(plugin&&"object"==typeof method)plugin.option.apply(plugin,arguments);else if(!(plugin||"object"!=typeof method&&method))return init.apply(this,arguments);return $this},$.fn.swipe.version=VERSION,$.fn.swipe.defaults=defaults,$.fn.swipe.phases={PHASE_START:PHASE_START,PHASE_MOVE:PHASE_MOVE,PHASE_END:PHASE_END,PHASE_CANCEL:PHASE_CANCEL},$.fn.swipe.directions={LEFT:LEFT,RIGHT:RIGHT,UP:UP,DOWN:DOWN,IN:IN,OUT:OUT},$.fn.swipe.pageScroll={NONE:NONE,HORIZONTAL:HORIZONTAL,VERTICAL:VERTICAL,AUTO:AUTO},$.fn.swipe.fingers={ONE:1,TWO:2,THREE:3,FOUR:4,FIVE:5,ALL:ALL_FINGERS}});



/* Javascript plotting library for jQuery, version 0.8.3.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

*/
(function($){$.color={};$.color.make=function(r,g,b,a){var o={};o.r=r||0;o.g=g||0;o.b=b||0;o.a=a!=null?a:1;o.add=function(c,d){for(var i=0;i<c.length;++i)o[c.charAt(i)]+=d;return o.normalize()};o.scale=function(c,f){for(var i=0;i<c.length;++i)o[c.charAt(i)]*=f;return o.normalize()};o.toString=function(){if(o.a>=1){return"rgb("+[o.r,o.g,o.b].join(",")+")"}else{return"rgba("+[o.r,o.g,o.b,o.a].join(",")+")"}};o.normalize=function(){function clamp(min,value,max){return value<min?min:value>max?max:value}o.r=clamp(0,parseInt(o.r),255);o.g=clamp(0,parseInt(o.g),255);o.b=clamp(0,parseInt(o.b),255);o.a=clamp(0,o.a,1);return o};o.clone=function(){return $.color.make(o.r,o.b,o.g,o.a)};return o.normalize()};$.color.extract=function(elem,css){var c;do{c=elem.css(css).toLowerCase();if(c!=""&&c!="transparent")break;elem=elem.parent()}while(elem.length&&!$.nodeName(elem.get(0),"body"));if(c=="rgba(0, 0, 0, 0)")c="transparent";return $.color.parse(c)};$.color.parse=function(str){var res,m=$.color.make;if(res=/rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(str))return m(parseInt(res[1],10),parseInt(res[2],10),parseInt(res[3],10));if(res=/rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)/.exec(str))return m(parseInt(res[1],10),parseInt(res[2],10),parseInt(res[3],10),parseFloat(res[4]));if(res=/rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(str))return m(parseFloat(res[1])*2.55,parseFloat(res[2])*2.55,parseFloat(res[3])*2.55);if(res=/rgba\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)/.exec(str))return m(parseFloat(res[1])*2.55,parseFloat(res[2])*2.55,parseFloat(res[3])*2.55,parseFloat(res[4]));if(res=/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(str))return m(parseInt(res[1],16),parseInt(res[2],16),parseInt(res[3],16));if(res=/#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(str))return m(parseInt(res[1]+res[1],16),parseInt(res[2]+res[2],16),parseInt(res[3]+res[3],16));var name=$.trim(str).toLowerCase();if(name=="transparent")return m(255,255,255,0);else{res=lookupColors[name]||[0,0,0];return m(res[0],res[1],res[2])}};var lookupColors={aqua:[0,255,255],azure:[240,255,255],beige:[245,245,220],black:[0,0,0],blue:[0,0,255],brown:[165,42,42],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgrey:[169,169,169],darkgreen:[0,100,0],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],darkviolet:[148,0,211],fuchsia:[255,0,255],gold:[255,215,0],green:[0,128,0],indigo:[75,0,130],khaki:[240,230,140],lightblue:[173,216,230],lightcyan:[224,255,255],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],lightyellow:[255,255,224],lime:[0,255,0],magenta:[255,0,255],maroon:[128,0,0],navy:[0,0,128],olive:[128,128,0],orange:[255,165,0],pink:[255,192,203],purple:[128,0,128],violet:[128,0,128],red:[255,0,0],silver:[192,192,192],white:[255,255,255],yellow:[255,255,0]}})(jQuery);(function($){var hasOwnProperty=Object.prototype.hasOwnProperty;if(!$.fn.detach){$.fn.detach=function(){return this.each(function(){if(this.parentNode){this.parentNode.removeChild(this)}})}}function Canvas(cls,container){var element=container.children("."+cls)[0];if(element==null){element=document.createElement("canvas");element.className=cls;$(element).css({direction:"ltr",position:"absolute",left:0,top:0}).appendTo(container);if(!element.getContext){if(window.G_vmlCanvasManager){element=window.G_vmlCanvasManager.initElement(element)}else{throw new Error("Canvas is not available. If you're using IE with a fall-back such as Excanvas, then there's either a mistake in your conditional include, or the page has no DOCTYPE and is rendering in Quirks Mode.")}}}this.element=element;var context=this.context=element.getContext("2d");var devicePixelRatio=window.devicePixelRatio||1,backingStoreRatio=context.webkitBackingStorePixelRatio||context.mozBackingStorePixelRatio||context.msBackingStorePixelRatio||context.oBackingStorePixelRatio||context.backingStorePixelRatio||1;this.pixelRatio=devicePixelRatio/backingStoreRatio;this.resize(container.width(),container.height());this.textContainer=null;this.text={};this._textCache={}}Canvas.prototype.resize=function(width,height){if(width<=0||height<=0){throw new Error("Invalid dimensions for plot, width = "+width+", height = "+height)}var element=this.element,context=this.context,pixelRatio=this.pixelRatio;if(this.width!=width){element.width=width*pixelRatio;element.style.width=width+"px";this.width=width}if(this.height!=height){element.height=height*pixelRatio;element.style.height=height+"px";this.height=height}context.restore();context.save();context.scale(pixelRatio,pixelRatio)};Canvas.prototype.clear=function(){this.context.clearRect(0,0,this.width,this.height)};Canvas.prototype.render=function(){var cache=this._textCache;for(var layerKey in cache){if(hasOwnProperty.call(cache,layerKey)){var layer=this.getTextLayer(layerKey),layerCache=cache[layerKey];layer.hide();for(var styleKey in layerCache){if(hasOwnProperty.call(layerCache,styleKey)){var styleCache=layerCache[styleKey];for(var key in styleCache){if(hasOwnProperty.call(styleCache,key)){var positions=styleCache[key].positions;for(var i=0,position;position=positions[i];i++){if(position.active){if(!position.rendered){layer.append(position.element);position.rendered=true}}else{positions.splice(i--,1);if(position.rendered){position.element.detach()}}}if(positions.length==0){delete styleCache[key]}}}}}layer.show()}}};Canvas.prototype.getTextLayer=function(classes){var layer=this.text[classes];if(layer==null){if(this.textContainer==null){this.textContainer=$("<div class='flot-text'></div>").css({position:"absolute",top:0,left:0,bottom:0,right:0,"font-size":"smaller",color:"#545454"}).insertAfter(this.element)}layer=this.text[classes]=$("<div></div>").addClass(classes).css({position:"absolute",top:0,left:0,bottom:0,right:0}).appendTo(this.textContainer)}return layer};Canvas.prototype.getTextInfo=function(layer,text,font,angle,width){var textStyle,layerCache,styleCache,info;text=""+text;if(typeof font==="object"){textStyle=font.style+" "+font.variant+" "+font.weight+" "+font.size+"px/"+font.lineHeight+"px "+font.family}else{textStyle=font}layerCache=this._textCache[layer];if(layerCache==null){layerCache=this._textCache[layer]={}}styleCache=layerCache[textStyle];if(styleCache==null){styleCache=layerCache[textStyle]={}}info=styleCache[text];if(info==null){var element=$("<div></div>").html(text).css({position:"absolute","max-width":width,top:-9999}).appendTo(this.getTextLayer(layer));if(typeof font==="object"){element.css({font:textStyle,color:font.color})}else if(typeof font==="string"){element.addClass(font)}info=styleCache[text]={width:element.outerWidth(true),height:element.outerHeight(true),element:element,positions:[]};element.detach()}return info};Canvas.prototype.addText=function(layer,x,y,text,font,angle,width,halign,valign){var info=this.getTextInfo(layer,text,font,angle,width),positions=info.positions;if(halign=="center"){x-=info.width/2}else if(halign=="right"){x-=info.width}if(valign=="middle"){y-=info.height/2}else if(valign=="bottom"){y-=info.height}for(var i=0,position;position=positions[i];i++){if(position.x==x&&position.y==y){position.active=true;return}}position={active:true,rendered:false,element:positions.length?info.element.clone():info.element,x:x,y:y};positions.push(position);position.element.css({top:Math.round(y),left:Math.round(x),"text-align":halign})};Canvas.prototype.removeText=function(layer,x,y,text,font,angle){if(text==null){var layerCache=this._textCache[layer];if(layerCache!=null){for(var styleKey in layerCache){if(hasOwnProperty.call(layerCache,styleKey)){var styleCache=layerCache[styleKey];for(var key in styleCache){if(hasOwnProperty.call(styleCache,key)){var positions=styleCache[key].positions;for(var i=0,position;position=positions[i];i++){position.active=false}}}}}}}else{var positions=this.getTextInfo(layer,text,font,angle).positions;for(var i=0,position;position=positions[i];i++){if(position.x==x&&position.y==y){position.active=false}}}};function Plot(placeholder,data_,options_,plugins){var series=[],options={colors:["#edc240","#afd8f8","#cb4b4b","#4da74d","#9440ed"],legend:{show:true,noColumns:1,labelFormatter:null,labelBoxBorderColor:"#ccc",container:null,position:"ne",margin:5,backgroundColor:null,backgroundOpacity:.85,sorted:null},xaxis:{show:null,position:"bottom",mode:null,font:null,color:null,tickColor:null,transform:null,inverseTransform:null,min:null,max:null,autoscaleMargin:null,ticks:null,tickFormatter:null,labelWidth:null,labelHeight:null,reserveSpace:null,tickLength:null,alignTicksWithAxis:null,tickDecimals:null,tickSize:null,minTickSize:null},yaxis:{autoscaleMargin:.02,position:"left"},xaxes:[],yaxes:[],series:{points:{show:false,radius:3,lineWidth:2,fill:true,fillColor:"#ffffff",symbol:"circle"},lines:{lineWidth:2,fill:false,fillColor:null,steps:false},bars:{show:false,lineWidth:2,barWidth:1,fill:true,fillColor:null,align:"left",horizontal:false,zero:true},shadowSize:3,highlightColor:null},grid:{show:true,aboveData:false,color:"#545454",backgroundColor:null,borderColor:null,tickColor:null,margin:0,labelMargin:5,axisMargin:8,borderWidth:2,minBorderMargin:null,markings:null,markingsColor:"#f4f4f4",markingsLineWidth:2,clickable:false,hoverable:false,autoHighlight:true,mouseActiveRadius:10},interaction:{redrawOverlayInterval:1e3/60},hooks:{}},surface=null,overlay=null,eventHolder=null,ctx=null,octx=null,xaxes=[],yaxes=[],plotOffset={left:0,right:0,top:0,bottom:0},plotWidth=0,plotHeight=0,hooks={processOptions:[],processRawData:[],processDatapoints:[],processOffset:[],drawBackground:[],drawSeries:[],draw:[],bindEvents:[],drawOverlay:[],shutdown:[]},plot=this;plot.setData=setData;plot.setupGrid=setupGrid;plot.draw=draw;plot.getPlaceholder=function(){return placeholder};plot.getCanvas=function(){return surface.element};plot.getPlotOffset=function(){return plotOffset};plot.width=function(){return plotWidth};plot.height=function(){return plotHeight};plot.offset=function(){var o=eventHolder.offset();o.left+=plotOffset.left;o.top+=plotOffset.top;return o};plot.getData=function(){return series};plot.getAxes=function(){var res={},i;$.each(xaxes.concat(yaxes),function(_,axis){if(axis)res[axis.direction+(axis.n!=1?axis.n:"")+"axis"]=axis});return res};plot.getXAxes=function(){return xaxes};plot.getYAxes=function(){return yaxes};plot.c2p=canvasToAxisCoords;plot.p2c=axisToCanvasCoords;plot.getOptions=function(){return options};plot.highlight=highlight;plot.unhighlight=unhighlight;plot.triggerRedrawOverlay=triggerRedrawOverlay;plot.pointOffset=function(point){return{left:parseInt(xaxes[axisNumber(point,"x")-1].p2c(+point.x)+plotOffset.left,10),top:parseInt(yaxes[axisNumber(point,"y")-1].p2c(+point.y)+plotOffset.top,10)}};plot.shutdown=shutdown;plot.destroy=function(){shutdown();placeholder.removeData("plot").empty();series=[];options=null;surface=null;overlay=null;eventHolder=null;ctx=null;octx=null;xaxes=[];yaxes=[];hooks=null;highlights=[];plot=null};plot.resize=function(){var width=placeholder.width(),height=placeholder.height();surface.resize(width,height);overlay.resize(width,height)};plot.hooks=hooks;initPlugins(plot);parseOptions(options_);setupCanvases();setData(data_);setupGrid();draw();bindEvents();function executeHooks(hook,args){args=[plot].concat(args);for(var i=0;i<hook.length;++i)hook[i].apply(this,args)}function initPlugins(){var classes={Canvas:Canvas};for(var i=0;i<plugins.length;++i){var p=plugins[i];p.init(plot,classes);if(p.options)$.extend(true,options,p.options)}}function parseOptions(opts){$.extend(true,options,opts);if(opts&&opts.colors){options.colors=opts.colors}if(options.xaxis.color==null)options.xaxis.color=$.color.parse(options.grid.color).scale("a",.22).toString();if(options.yaxis.color==null)options.yaxis.color=$.color.parse(options.grid.color).scale("a",.22).toString();if(options.xaxis.tickColor==null)options.xaxis.tickColor=options.grid.tickColor||options.xaxis.color;if(options.yaxis.tickColor==null)options.yaxis.tickColor=options.grid.tickColor||options.yaxis.color;if(options.grid.borderColor==null)options.grid.borderColor=options.grid.color;if(options.grid.tickColor==null)options.grid.tickColor=$.color.parse(options.grid.color).scale("a",.22).toString();var i,axisOptions,axisCount,fontSize=placeholder.css("font-size"),fontSizeDefault=fontSize?+fontSize.replace("px",""):13,fontDefaults={style:placeholder.css("font-style"),size:Math.round(.8*fontSizeDefault),variant:placeholder.css("font-variant"),weight:placeholder.css("font-weight"),family:placeholder.css("font-family")};axisCount=options.xaxes.length||1;for(i=0;i<axisCount;++i){axisOptions=options.xaxes[i];if(axisOptions&&!axisOptions.tickColor){axisOptions.tickColor=axisOptions.color}axisOptions=$.extend(true,{},options.xaxis,axisOptions);options.xaxes[i]=axisOptions;if(axisOptions.font){axisOptions.font=$.extend({},fontDefaults,axisOptions.font);if(!axisOptions.font.color){axisOptions.font.color=axisOptions.color}if(!axisOptions.font.lineHeight){axisOptions.font.lineHeight=Math.round(axisOptions.font.size*1.15)}}}axisCount=options.yaxes.length||1;for(i=0;i<axisCount;++i){axisOptions=options.yaxes[i];if(axisOptions&&!axisOptions.tickColor){axisOptions.tickColor=axisOptions.color}axisOptions=$.extend(true,{},options.yaxis,axisOptions);options.yaxes[i]=axisOptions;if(axisOptions.font){axisOptions.font=$.extend({},fontDefaults,axisOptions.font);if(!axisOptions.font.color){axisOptions.font.color=axisOptions.color}if(!axisOptions.font.lineHeight){axisOptions.font.lineHeight=Math.round(axisOptions.font.size*1.15)}}}if(options.xaxis.noTicks&&options.xaxis.ticks==null)options.xaxis.ticks=options.xaxis.noTicks;if(options.yaxis.noTicks&&options.yaxis.ticks==null)options.yaxis.ticks=options.yaxis.noTicks;if(options.x2axis){options.xaxes[1]=$.extend(true,{},options.xaxis,options.x2axis);options.xaxes[1].position="top";if(options.x2axis.min==null){options.xaxes[1].min=null}if(options.x2axis.max==null){options.xaxes[1].max=null}}if(options.y2axis){options.yaxes[1]=$.extend(true,{},options.yaxis,options.y2axis);options.yaxes[1].position="right";if(options.y2axis.min==null){options.yaxes[1].min=null}if(options.y2axis.max==null){options.yaxes[1].max=null}}if(options.grid.coloredAreas)options.grid.markings=options.grid.coloredAreas;if(options.grid.coloredAreasColor)options.grid.markingsColor=options.grid.coloredAreasColor;if(options.lines)$.extend(true,options.series.lines,options.lines);if(options.points)$.extend(true,options.series.points,options.points);if(options.bars)$.extend(true,options.series.bars,options.bars);if(options.shadowSize!=null)options.series.shadowSize=options.shadowSize;if(options.highlightColor!=null)options.series.highlightColor=options.highlightColor;for(i=0;i<options.xaxes.length;++i)getOrCreateAxis(xaxes,i+1).options=options.xaxes[i];for(i=0;i<options.yaxes.length;++i)getOrCreateAxis(yaxes,i+1).options=options.yaxes[i];for(var n in hooks)if(options.hooks[n]&&options.hooks[n].length)hooks[n]=hooks[n].concat(options.hooks[n]);executeHooks(hooks.processOptions,[options])}function setData(d){series=parseData(d);fillInSeriesOptions();processData()}function parseData(d){var res=[];for(var i=0;i<d.length;++i){var s=$.extend(true,{},options.series);if(d[i].data!=null){s.data=d[i].data;delete d[i].data;$.extend(true,s,d[i]);d[i].data=s.data}else s.data=d[i];res.push(s)}return res}function axisNumber(obj,coord){var a=obj[coord+"axis"];if(typeof a=="object")a=a.n;if(typeof a!="number")a=1;return a}function allAxes(){return $.grep(xaxes.concat(yaxes),function(a){return a})}function canvasToAxisCoords(pos){var res={},i,axis;for(i=0;i<xaxes.length;++i){axis=xaxes[i];if(axis&&axis.used)res["x"+axis.n]=axis.c2p(pos.left)}for(i=0;i<yaxes.length;++i){axis=yaxes[i];if(axis&&axis.used)res["y"+axis.n]=axis.c2p(pos.top)}if(res.x1!==undefined)res.x=res.x1;if(res.y1!==undefined)res.y=res.y1;return res}function axisToCanvasCoords(pos){var res={},i,axis,key;for(i=0;i<xaxes.length;++i){axis=xaxes[i];if(axis&&axis.used){key="x"+axis.n;if(pos[key]==null&&axis.n==1)key="x";if(pos[key]!=null){res.left=axis.p2c(pos[key]);break}}}for(i=0;i<yaxes.length;++i){axis=yaxes[i];if(axis&&axis.used){key="y"+axis.n;if(pos[key]==null&&axis.n==1)key="y";if(pos[key]!=null){res.top=axis.p2c(pos[key]);break}}}return res}function getOrCreateAxis(axes,number){if(!axes[number-1])axes[number-1]={n:number,direction:axes==xaxes?"x":"y",options:$.extend(true,{},axes==xaxes?options.xaxis:options.yaxis)};return axes[number-1]}function fillInSeriesOptions(){var neededColors=series.length,maxIndex=-1,i;for(i=0;i<series.length;++i){var sc=series[i].color;if(sc!=null){neededColors--;if(typeof sc=="number"&&sc>maxIndex){maxIndex=sc}}}if(neededColors<=maxIndex){neededColors=maxIndex+1}var c,colors=[],colorPool=options.colors,colorPoolSize=colorPool.length,variation=0;for(i=0;i<neededColors;i++){c=$.color.parse(colorPool[i%colorPoolSize]||"#666");if(i%colorPoolSize==0&&i){if(variation>=0){if(variation<.5){variation=-variation-.2}else variation=0}else variation=-variation}colors[i]=c.scale("rgb",1+variation)}var colori=0,s;for(i=0;i<series.length;++i){s=series[i];if(s.color==null){s.color=colors[colori].toString();++colori}else if(typeof s.color=="number")s.color=colors[s.color].toString();if(s.lines.show==null){var v,show=true;for(v in s)if(s[v]&&s[v].show){show=false;break}if(show)s.lines.show=true}if(s.lines.zero==null){s.lines.zero=!!s.lines.fill}s.xaxis=getOrCreateAxis(xaxes,axisNumber(s,"x"));s.yaxis=getOrCreateAxis(yaxes,axisNumber(s,"y"))}}function processData(){var topSentry=Number.POSITIVE_INFINITY,bottomSentry=Number.NEGATIVE_INFINITY,fakeInfinity=Number.MAX_VALUE,i,j,k,m,length,s,points,ps,x,y,axis,val,f,p,data,format;function updateAxis(axis,min,max){if(min<axis.datamin&&min!=-fakeInfinity)axis.datamin=min;if(max>axis.datamax&&max!=fakeInfinity)axis.datamax=max}$.each(allAxes(),function(_,axis){axis.datamin=topSentry;axis.datamax=bottomSentry;axis.used=false});for(i=0;i<series.length;++i){s=series[i];s.datapoints={points:[]};executeHooks(hooks.processRawData,[s,s.data,s.datapoints])}for(i=0;i<series.length;++i){s=series[i];data=s.data;format=s.datapoints.format;if(!format){format=[];format.push({x:true,number:true,required:true});format.push({y:true,number:true,required:true});if(s.bars.show||s.lines.show&&s.lines.fill){var autoscale=!!(s.bars.show&&s.bars.zero||s.lines.show&&s.lines.zero);format.push({y:true,number:true,required:false,defaultValue:0,autoscale:autoscale});if(s.bars.horizontal){delete format[format.length-1].y;format[format.length-1].x=true}}s.datapoints.format=format}if(s.datapoints.pointsize!=null)continue;s.datapoints.pointsize=format.length;ps=s.datapoints.pointsize;points=s.datapoints.points;var insertSteps=s.lines.show&&s.lines.steps;s.xaxis.used=s.yaxis.used=true;for(j=k=0;j<data.length;++j,k+=ps){p=data[j];var nullify=p==null;if(!nullify){for(m=0;m<ps;++m){val=p[m];f=format[m];if(f){if(f.number&&val!=null){val=+val;if(isNaN(val))val=null;else if(val==Infinity)val=fakeInfinity;else if(val==-Infinity)val=-fakeInfinity}if(val==null){if(f.required)nullify=true;if(f.defaultValue!=null)val=f.defaultValue}}points[k+m]=val}}if(nullify){for(m=0;m<ps;++m){val=points[k+m];if(val!=null){f=format[m];if(f.autoscale!==false){if(f.x){updateAxis(s.xaxis,val,val)}if(f.y){updateAxis(s.yaxis,val,val)}}}points[k+m]=null}}else{if(insertSteps&&k>0&&points[k-ps]!=null&&points[k-ps]!=points[k]&&points[k-ps+1]!=points[k+1]){for(m=0;m<ps;++m)points[k+ps+m]=points[k+m];points[k+1]=points[k-ps+1];k+=ps}}}}for(i=0;i<series.length;++i){s=series[i];executeHooks(hooks.processDatapoints,[s,s.datapoints])}for(i=0;i<series.length;++i){s=series[i];points=s.datapoints.points;ps=s.datapoints.pointsize;format=s.datapoints.format;var xmin=topSentry,ymin=topSentry,xmax=bottomSentry,ymax=bottomSentry;for(j=0;j<points.length;j+=ps){if(points[j]==null)continue;for(m=0;m<ps;++m){val=points[j+m];f=format[m];if(!f||f.autoscale===false||val==fakeInfinity||val==-fakeInfinity)continue;if(f.x){if(val<xmin)xmin=val;if(val>xmax)xmax=val}if(f.y){if(val<ymin)ymin=val;if(val>ymax)ymax=val}}}if(s.bars.show){var delta;switch(s.bars.align){case"left":delta=0;break;case"right":delta=-s.bars.barWidth;break;default:delta=-s.bars.barWidth/2}if(s.bars.horizontal){ymin+=delta;ymax+=delta+s.bars.barWidth}else{xmin+=delta;xmax+=delta+s.bars.barWidth}}updateAxis(s.xaxis,xmin,xmax);updateAxis(s.yaxis,ymin,ymax)}$.each(allAxes(),function(_,axis){if(axis.datamin==topSentry)axis.datamin=null;if(axis.datamax==bottomSentry)axis.datamax=null})}function setupCanvases(){placeholder.css("padding",0).children().filter(function(){return!$(this).hasClass("flot-overlay")&&!$(this).hasClass("flot-base")}).remove();if(placeholder.css("position")=="static")placeholder.css("position","relative");surface=new Canvas("flot-base",placeholder);overlay=new Canvas("flot-overlay",placeholder);ctx=surface.context;octx=overlay.context;eventHolder=$(overlay.element).unbind();var existing=placeholder.data("plot");if(existing){existing.shutdown();overlay.clear()}placeholder.data("plot",plot)}function bindEvents(){if(options.grid.hoverable){eventHolder.mousemove(onMouseMove);eventHolder.bind("mouseleave",onMouseLeave)}if(options.grid.clickable)eventHolder.click(onClick);executeHooks(hooks.bindEvents,[eventHolder])}function shutdown(){if(redrawTimeout)clearTimeout(redrawTimeout);eventHolder.unbind("mousemove",onMouseMove);eventHolder.unbind("mouseleave",onMouseLeave);eventHolder.unbind("click",onClick);executeHooks(hooks.shutdown,[eventHolder])}function setTransformationHelpers(axis){function identity(x){return x}var s,m,t=axis.options.transform||identity,it=axis.options.inverseTransform;if(axis.direction=="x"){s=axis.scale=plotWidth/Math.abs(t(axis.max)-t(axis.min));m=Math.min(t(axis.max),t(axis.min))}else{s=axis.scale=plotHeight/Math.abs(t(axis.max)-t(axis.min));s=-s;m=Math.max(t(axis.max),t(axis.min))}if(t==identity)axis.p2c=function(p){return(p-m)*s};else axis.p2c=function(p){return(t(p)-m)*s};if(!it)axis.c2p=function(c){return m+c/s};else axis.c2p=function(c){return it(m+c/s)}}function measureTickLabels(axis){var opts=axis.options,ticks=axis.ticks||[],labelWidth=opts.labelWidth||0,labelHeight=opts.labelHeight||0,maxWidth=labelWidth||(axis.direction=="x"?Math.floor(surface.width/(ticks.length||1)):null),legacyStyles=axis.direction+"Axis "+axis.direction+axis.n+"Axis",layer="flot-"+axis.direction+"-axis flot-"+axis.direction+axis.n+"-axis "+legacyStyles,font=opts.font||"flot-tick-label tickLabel";for(var i=0;i<ticks.length;++i){var t=ticks[i];if(!t.label)continue;var info=surface.getTextInfo(layer,t.label,font,null,maxWidth);labelWidth=Math.max(labelWidth,info.width);labelHeight=Math.max(labelHeight,info.height)}axis.labelWidth=opts.labelWidth||labelWidth;axis.labelHeight=opts.labelHeight||labelHeight}function allocateAxisBoxFirstPhase(axis){var lw=axis.labelWidth,lh=axis.labelHeight,pos=axis.options.position,isXAxis=axis.direction==="x",tickLength=axis.options.tickLength,axisMargin=options.grid.axisMargin,padding=options.grid.labelMargin,innermost=true,outermost=true,first=true,found=false;$.each(isXAxis?xaxes:yaxes,function(i,a){if(a&&(a.show||a.reserveSpace)){if(a===axis){found=true}else if(a.options.position===pos){if(found){outermost=false}else{innermost=false}}if(!found){first=false}}});if(outermost){axisMargin=0}if(tickLength==null){tickLength=first?"full":5}if(!isNaN(+tickLength))padding+=+tickLength;if(isXAxis){lh+=padding;if(pos=="bottom"){plotOffset.bottom+=lh+axisMargin;axis.box={top:surface.height-plotOffset.bottom,height:lh}}else{axis.box={top:plotOffset.top+axisMargin,height:lh};plotOffset.top+=lh+axisMargin}}else{lw+=padding;if(pos=="left"){axis.box={left:plotOffset.left+axisMargin,width:lw};plotOffset.left+=lw+axisMargin}else{plotOffset.right+=lw+axisMargin;axis.box={left:surface.width-plotOffset.right,width:lw}}}axis.position=pos;axis.tickLength=tickLength;axis.box.padding=padding;axis.innermost=innermost}function allocateAxisBoxSecondPhase(axis){if(axis.direction=="x"){axis.box.left=plotOffset.left-axis.labelWidth/2;axis.box.width=surface.width-plotOffset.left-plotOffset.right+axis.labelWidth}else{axis.box.top=plotOffset.top-axis.labelHeight/2;axis.box.height=surface.height-plotOffset.bottom-plotOffset.top+axis.labelHeight}}function adjustLayoutForThingsStickingOut(){var minMargin=options.grid.minBorderMargin,axis,i;if(minMargin==null){minMargin=0;for(i=0;i<series.length;++i)minMargin=Math.max(minMargin,2*(series[i].points.radius+series[i].points.lineWidth/2))}var margins={left:minMargin,right:minMargin,top:minMargin,bottom:minMargin};$.each(allAxes(),function(_,axis){if(axis.reserveSpace&&axis.ticks&&axis.ticks.length){if(axis.direction==="x"){margins.left=Math.max(margins.left,axis.labelWidth/2);margins.right=Math.max(margins.right,axis.labelWidth/2)}else{margins.bottom=Math.max(margins.bottom,axis.labelHeight/2);margins.top=Math.max(margins.top,axis.labelHeight/2)}}});plotOffset.left=Math.ceil(Math.max(margins.left,plotOffset.left));plotOffset.right=Math.ceil(Math.max(margins.right,plotOffset.right));plotOffset.top=Math.ceil(Math.max(margins.top,plotOffset.top));plotOffset.bottom=Math.ceil(Math.max(margins.bottom,plotOffset.bottom))}function setupGrid(){var i,axes=allAxes(),showGrid=options.grid.show;for(var a in plotOffset){var margin=options.grid.margin||0;plotOffset[a]=typeof margin=="number"?margin:margin[a]||0}executeHooks(hooks.processOffset,[plotOffset]);for(var a in plotOffset){if(typeof options.grid.borderWidth=="object"){plotOffset[a]+=showGrid?options.grid.borderWidth[a]:0}else{plotOffset[a]+=showGrid?options.grid.borderWidth:0}}$.each(axes,function(_,axis){var axisOpts=axis.options;axis.show=axisOpts.show==null?axis.used:axisOpts.show;axis.reserveSpace=axisOpts.reserveSpace==null?axis.show:axisOpts.reserveSpace;setRange(axis)});if(showGrid){var allocatedAxes=$.grep(axes,function(axis){return axis.show||axis.reserveSpace});$.each(allocatedAxes,function(_,axis){setupTickGeneration(axis);setTicks(axis);snapRangeToTicks(axis,axis.ticks);measureTickLabels(axis)});for(i=allocatedAxes.length-1;i>=0;--i)allocateAxisBoxFirstPhase(allocatedAxes[i]);adjustLayoutForThingsStickingOut();$.each(allocatedAxes,function(_,axis){allocateAxisBoxSecondPhase(axis)})}plotWidth=surface.width-plotOffset.left-plotOffset.right;plotHeight=surface.height-plotOffset.bottom-plotOffset.top;$.each(axes,function(_,axis){setTransformationHelpers(axis)});if(showGrid){drawAxisLabels()}insertLegend()}function setRange(axis){var opts=axis.options,min=+(opts.min!=null?opts.min:axis.datamin),max=+(opts.max!=null?opts.max:axis.datamax),delta=max-min;if(delta==0){var widen=max==0?1:.01;if(opts.min==null)min-=widen;if(opts.max==null||opts.min!=null)max+=widen}else{var margin=opts.autoscaleMargin;if(margin!=null){if(opts.min==null){min-=delta*margin;if(min<0&&axis.datamin!=null&&axis.datamin>=0)min=0}if(opts.max==null){max+=delta*margin;if(max>0&&axis.datamax!=null&&axis.datamax<=0)max=0}}}axis.min=min;axis.max=max}function setupTickGeneration(axis){var opts=axis.options;var noTicks;if(typeof opts.ticks=="number"&&opts.ticks>0)noTicks=opts.ticks;else noTicks=.3*Math.sqrt(axis.direction=="x"?surface.width:surface.height);var delta=(axis.max-axis.min)/noTicks,dec=-Math.floor(Math.log(delta)/Math.LN10),maxDec=opts.tickDecimals;if(maxDec!=null&&dec>maxDec){dec=maxDec}var magn=Math.pow(10,-dec),norm=delta/magn,size;if(norm<1.5){size=1}else if(norm<3){size=2;if(norm>2.25&&(maxDec==null||dec+1<=maxDec)){size=2.5;++dec}}else if(norm<7.5){size=5}else{size=10}size*=magn;if(opts.minTickSize!=null&&size<opts.minTickSize){size=opts.minTickSize}axis.delta=delta;axis.tickDecimals=Math.max(0,maxDec!=null?maxDec:dec);axis.tickSize=opts.tickSize||size;if(opts.mode=="time"&&!axis.tickGenerator){throw new Error("Time mode requires the flot.time plugin.")}if(!axis.tickGenerator){axis.tickGenerator=function(axis){var ticks=[],start=floorInBase(axis.min,axis.tickSize),i=0,v=Number.NaN,prev;do{prev=v;v=start+i*axis.tickSize;ticks.push(v);++i}while(v<axis.max&&v!=prev);return ticks};axis.tickFormatter=function(value,axis){var factor=axis.tickDecimals?Math.pow(10,axis.tickDecimals):1;var formatted=""+Math.round(value*factor)/factor;if(axis.tickDecimals!=null){var decimal=formatted.indexOf(".");var precision=decimal==-1?0:formatted.length-decimal-1;if(precision<axis.tickDecimals){return(precision?formatted:formatted+".")+(""+factor).substr(1,axis.tickDecimals-precision)}}return formatted}}if($.isFunction(opts.tickFormatter))axis.tickFormatter=function(v,axis){return""+opts.tickFormatter(v,axis)};if(opts.alignTicksWithAxis!=null){var otherAxis=(axis.direction=="x"?xaxes:yaxes)[opts.alignTicksWithAxis-1];if(otherAxis&&otherAxis.used&&otherAxis!=axis){var niceTicks=axis.tickGenerator(axis);if(niceTicks.length>0){if(opts.min==null)axis.min=Math.min(axis.min,niceTicks[0]);if(opts.max==null&&niceTicks.length>1)axis.max=Math.max(axis.max,niceTicks[niceTicks.length-1])}axis.tickGenerator=function(axis){var ticks=[],v,i;for(i=0;i<otherAxis.ticks.length;++i){v=(otherAxis.ticks[i].v-otherAxis.min)/(otherAxis.max-otherAxis.min);v=axis.min+v*(axis.max-axis.min);ticks.push(v)}return ticks};if(!axis.mode&&opts.tickDecimals==null){var extraDec=Math.max(0,-Math.floor(Math.log(axis.delta)/Math.LN10)+1),ts=axis.tickGenerator(axis);if(!(ts.length>1&&/\..*0$/.test((ts[1]-ts[0]).toFixed(extraDec))))axis.tickDecimals=extraDec}}}}function setTicks(axis){var oticks=axis.options.ticks,ticks=[];if(oticks==null||typeof oticks=="number"&&oticks>0)ticks=axis.tickGenerator(axis);else if(oticks){if($.isFunction(oticks))ticks=oticks(axis);else ticks=oticks}var i,v;axis.ticks=[];for(i=0;i<ticks.length;++i){var label=null;var t=ticks[i];if(typeof t=="object"){v=+t[0];if(t.length>1)label=t[1]}else v=+t;if(label==null)label=axis.tickFormatter(v,axis);if(!isNaN(v))axis.ticks.push({v:v,label:label})}}function snapRangeToTicks(axis,ticks){if(axis.options.autoscaleMargin&&ticks.length>0){if(axis.options.min==null)axis.min=Math.min(axis.min,ticks[0].v);if(axis.options.max==null&&ticks.length>1)axis.max=Math.max(axis.max,ticks[ticks.length-1].v)}}function draw(){surface.clear();executeHooks(hooks.drawBackground,[ctx]);var grid=options.grid;if(grid.show&&grid.backgroundColor)drawBackground();if(grid.show&&!grid.aboveData){drawGrid()}for(var i=0;i<series.length;++i){executeHooks(hooks.drawSeries,[ctx,series[i]]);drawSeries(series[i])}executeHooks(hooks.draw,[ctx]);if(grid.show&&grid.aboveData){drawGrid()}surface.render();triggerRedrawOverlay()}function extractRange(ranges,coord){var axis,from,to,key,axes=allAxes();for(var i=0;i<axes.length;++i){axis=axes[i];if(axis.direction==coord){key=coord+axis.n+"axis";if(!ranges[key]&&axis.n==1)key=coord+"axis";if(ranges[key]){from=ranges[key].from;to=ranges[key].to;break}}}if(!ranges[key]){axis=coord=="x"?xaxes[0]:yaxes[0];from=ranges[coord+"1"];to=ranges[coord+"2"]}if(from!=null&&to!=null&&from>to){var tmp=from;from=to;to=tmp}return{from:from,to:to,axis:axis}}function drawBackground(){ctx.save();ctx.translate(plotOffset.left,plotOffset.top);ctx.fillStyle=getColorOrGradient(options.grid.backgroundColor,plotHeight,0,"rgba(255, 255, 255, 0)");ctx.fillRect(0,0,plotWidth,plotHeight);ctx.restore()}function drawGrid(){var i,axes,bw,bc;ctx.save();ctx.translate(plotOffset.left,plotOffset.top);var markings=options.grid.markings;if(markings){if($.isFunction(markings)){axes=plot.getAxes();axes.xmin=axes.xaxis.min;axes.xmax=axes.xaxis.max;axes.ymin=axes.yaxis.min;axes.ymax=axes.yaxis.max;markings=markings(axes)}for(i=0;i<markings.length;++i){var m=markings[i],xrange=extractRange(m,"x"),yrange=extractRange(m,"y");if(xrange.from==null)xrange.from=xrange.axis.min;if(xrange.to==null)xrange.to=xrange.axis.max;
if(yrange.from==null)yrange.from=yrange.axis.min;if(yrange.to==null)yrange.to=yrange.axis.max;if(xrange.to<xrange.axis.min||xrange.from>xrange.axis.max||yrange.to<yrange.axis.min||yrange.from>yrange.axis.max)continue;xrange.from=Math.max(xrange.from,xrange.axis.min);xrange.to=Math.min(xrange.to,xrange.axis.max);yrange.from=Math.max(yrange.from,yrange.axis.min);yrange.to=Math.min(yrange.to,yrange.axis.max);var xequal=xrange.from===xrange.to,yequal=yrange.from===yrange.to;if(xequal&&yequal){continue}xrange.from=Math.floor(xrange.axis.p2c(xrange.from));xrange.to=Math.floor(xrange.axis.p2c(xrange.to));yrange.from=Math.floor(yrange.axis.p2c(yrange.from));yrange.to=Math.floor(yrange.axis.p2c(yrange.to));if(xequal||yequal){var lineWidth=m.lineWidth||options.grid.markingsLineWidth,subPixel=lineWidth%2?.5:0;ctx.beginPath();ctx.strokeStyle=m.color||options.grid.markingsColor;ctx.lineWidth=lineWidth;if(xequal){ctx.moveTo(xrange.to+subPixel,yrange.from);ctx.lineTo(xrange.to+subPixel,yrange.to)}else{ctx.moveTo(xrange.from,yrange.to+subPixel);ctx.lineTo(xrange.to,yrange.to+subPixel)}ctx.stroke()}else{ctx.fillStyle=m.color||options.grid.markingsColor;ctx.fillRect(xrange.from,yrange.to,xrange.to-xrange.from,yrange.from-yrange.to)}}}axes=allAxes();bw=options.grid.borderWidth;for(var j=0;j<axes.length;++j){var axis=axes[j],box=axis.box,t=axis.tickLength,x,y,xoff,yoff;if(!axis.show||axis.ticks.length==0)continue;ctx.lineWidth=1;if(axis.direction=="x"){x=0;if(t=="full")y=axis.position=="top"?0:plotHeight;else y=box.top-plotOffset.top+(axis.position=="top"?box.height:0)}else{y=0;if(t=="full")x=axis.position=="left"?0:plotWidth;else x=box.left-plotOffset.left+(axis.position=="left"?box.width:0)}if(!axis.innermost){ctx.strokeStyle=axis.options.color;ctx.beginPath();xoff=yoff=0;if(axis.direction=="x")xoff=plotWidth+1;else yoff=plotHeight+1;if(ctx.lineWidth==1){if(axis.direction=="x"){y=Math.floor(y)+.5}else{x=Math.floor(x)+.5}}ctx.moveTo(x,y);ctx.lineTo(x+xoff,y+yoff);ctx.stroke()}ctx.strokeStyle=axis.options.tickColor;ctx.beginPath();for(i=0;i<axis.ticks.length;++i){var v=axis.ticks[i].v;xoff=yoff=0;if(isNaN(v)||v<axis.min||v>axis.max||t=="full"&&(typeof bw=="object"&&bw[axis.position]>0||bw>0)&&(v==axis.min||v==axis.max))continue;if(axis.direction=="x"){x=axis.p2c(v);yoff=t=="full"?-plotHeight:t;if(axis.position=="top")yoff=-yoff}else{y=axis.p2c(v);xoff=t=="full"?-plotWidth:t;if(axis.position=="left")xoff=-xoff}if(ctx.lineWidth==1){if(axis.direction=="x")x=Math.floor(x)+.5;else y=Math.floor(y)+.5}ctx.moveTo(x,y);ctx.lineTo(x+xoff,y+yoff)}ctx.stroke()}if(bw){bc=options.grid.borderColor;if(typeof bw=="object"||typeof bc=="object"){if(typeof bw!=="object"){bw={top:bw,right:bw,bottom:bw,left:bw}}if(typeof bc!=="object"){bc={top:bc,right:bc,bottom:bc,left:bc}}if(bw.top>0){ctx.strokeStyle=bc.top;ctx.lineWidth=bw.top;ctx.beginPath();ctx.moveTo(0-bw.left,0-bw.top/2);ctx.lineTo(plotWidth,0-bw.top/2);ctx.stroke()}if(bw.right>0){ctx.strokeStyle=bc.right;ctx.lineWidth=bw.right;ctx.beginPath();ctx.moveTo(plotWidth+bw.right/2,0-bw.top);ctx.lineTo(plotWidth+bw.right/2,plotHeight);ctx.stroke()}if(bw.bottom>0){ctx.strokeStyle=bc.bottom;ctx.lineWidth=bw.bottom;ctx.beginPath();ctx.moveTo(plotWidth+bw.right,plotHeight+bw.bottom/2);ctx.lineTo(0,plotHeight+bw.bottom/2);ctx.stroke()}if(bw.left>0){ctx.strokeStyle=bc.left;ctx.lineWidth=bw.left;ctx.beginPath();ctx.moveTo(0-bw.left/2,plotHeight+bw.bottom);ctx.lineTo(0-bw.left/2,0);ctx.stroke()}}else{ctx.lineWidth=bw;ctx.strokeStyle=options.grid.borderColor;ctx.strokeRect(-bw/2,-bw/2,plotWidth+bw,plotHeight+bw)}}ctx.restore()}function drawAxisLabels(){$.each(allAxes(),function(_,axis){var box=axis.box,legacyStyles=axis.direction+"Axis "+axis.direction+axis.n+"Axis",layer="flot-"+axis.direction+"-axis flot-"+axis.direction+axis.n+"-axis "+legacyStyles,font=axis.options.font||"flot-tick-label tickLabel",tick,x,y,halign,valign;surface.removeText(layer);if(!axis.show||axis.ticks.length==0)return;for(var i=0;i<axis.ticks.length;++i){tick=axis.ticks[i];if(!tick.label||tick.v<axis.min||tick.v>axis.max)continue;if(axis.direction=="x"){halign="center";x=plotOffset.left+axis.p2c(tick.v);if(axis.position=="bottom"){y=box.top+box.padding}else{y=box.top+box.height-box.padding;valign="bottom"}}else{valign="middle";y=plotOffset.top+axis.p2c(tick.v);if(axis.position=="left"){x=box.left+box.width-box.padding;halign="right"}else{x=box.left+box.padding}}surface.addText(layer,x,y,tick.label,font,null,null,halign,valign)}})}function drawSeries(series){if(series.lines.show)drawSeriesLines(series);if(series.bars.show)drawSeriesBars(series);if(series.points.show)drawSeriesPoints(series)}function drawSeriesLines(series){function plotLine(datapoints,xoffset,yoffset,axisx,axisy){var points=datapoints.points,ps=datapoints.pointsize,prevx=null,prevy=null;ctx.beginPath();for(var i=ps;i<points.length;i+=ps){var x1=points[i-ps],y1=points[i-ps+1],x2=points[i],y2=points[i+1];if(x1==null||x2==null)continue;if(y1<=y2&&y1<axisy.min){if(y2<axisy.min)continue;x1=(axisy.min-y1)/(y2-y1)*(x2-x1)+x1;y1=axisy.min}else if(y2<=y1&&y2<axisy.min){if(y1<axisy.min)continue;x2=(axisy.min-y1)/(y2-y1)*(x2-x1)+x1;y2=axisy.min}if(y1>=y2&&y1>axisy.max){if(y2>axisy.max)continue;x1=(axisy.max-y1)/(y2-y1)*(x2-x1)+x1;y1=axisy.max}else if(y2>=y1&&y2>axisy.max){if(y1>axisy.max)continue;x2=(axisy.max-y1)/(y2-y1)*(x2-x1)+x1;y2=axisy.max}if(x1<=x2&&x1<axisx.min){if(x2<axisx.min)continue;y1=(axisx.min-x1)/(x2-x1)*(y2-y1)+y1;x1=axisx.min}else if(x2<=x1&&x2<axisx.min){if(x1<axisx.min)continue;y2=(axisx.min-x1)/(x2-x1)*(y2-y1)+y1;x2=axisx.min}if(x1>=x2&&x1>axisx.max){if(x2>axisx.max)continue;y1=(axisx.max-x1)/(x2-x1)*(y2-y1)+y1;x1=axisx.max}else if(x2>=x1&&x2>axisx.max){if(x1>axisx.max)continue;y2=(axisx.max-x1)/(x2-x1)*(y2-y1)+y1;x2=axisx.max}if(x1!=prevx||y1!=prevy)ctx.moveTo(axisx.p2c(x1)+xoffset,axisy.p2c(y1)+yoffset);prevx=x2;prevy=y2;ctx.lineTo(axisx.p2c(x2)+xoffset,axisy.p2c(y2)+yoffset)}ctx.stroke()}function plotLineArea(datapoints,axisx,axisy){var points=datapoints.points,ps=datapoints.pointsize,bottom=Math.min(Math.max(0,axisy.min),axisy.max),i=0,top,areaOpen=false,ypos=1,segmentStart=0,segmentEnd=0;while(true){if(ps>0&&i>points.length+ps)break;i+=ps;var x1=points[i-ps],y1=points[i-ps+ypos],x2=points[i],y2=points[i+ypos];if(areaOpen){if(ps>0&&x1!=null&&x2==null){segmentEnd=i;ps=-ps;ypos=2;continue}if(ps<0&&i==segmentStart+ps){ctx.fill();areaOpen=false;ps=-ps;ypos=1;i=segmentStart=segmentEnd+ps;continue}}if(x1==null||x2==null)continue;if(x1<=x2&&x1<axisx.min){if(x2<axisx.min)continue;y1=(axisx.min-x1)/(x2-x1)*(y2-y1)+y1;x1=axisx.min}else if(x2<=x1&&x2<axisx.min){if(x1<axisx.min)continue;y2=(axisx.min-x1)/(x2-x1)*(y2-y1)+y1;x2=axisx.min}if(x1>=x2&&x1>axisx.max){if(x2>axisx.max)continue;y1=(axisx.max-x1)/(x2-x1)*(y2-y1)+y1;x1=axisx.max}else if(x2>=x1&&x2>axisx.max){if(x1>axisx.max)continue;y2=(axisx.max-x1)/(x2-x1)*(y2-y1)+y1;x2=axisx.max}if(!areaOpen){ctx.beginPath();ctx.moveTo(axisx.p2c(x1),axisy.p2c(bottom));areaOpen=true}if(y1>=axisy.max&&y2>=axisy.max){ctx.lineTo(axisx.p2c(x1),axisy.p2c(axisy.max));ctx.lineTo(axisx.p2c(x2),axisy.p2c(axisy.max));continue}else if(y1<=axisy.min&&y2<=axisy.min){ctx.lineTo(axisx.p2c(x1),axisy.p2c(axisy.min));ctx.lineTo(axisx.p2c(x2),axisy.p2c(axisy.min));continue}var x1old=x1,x2old=x2;if(y1<=y2&&y1<axisy.min&&y2>=axisy.min){x1=(axisy.min-y1)/(y2-y1)*(x2-x1)+x1;y1=axisy.min}else if(y2<=y1&&y2<axisy.min&&y1>=axisy.min){x2=(axisy.min-y1)/(y2-y1)*(x2-x1)+x1;y2=axisy.min}if(y1>=y2&&y1>axisy.max&&y2<=axisy.max){x1=(axisy.max-y1)/(y2-y1)*(x2-x1)+x1;y1=axisy.max}else if(y2>=y1&&y2>axisy.max&&y1<=axisy.max){x2=(axisy.max-y1)/(y2-y1)*(x2-x1)+x1;y2=axisy.max}if(x1!=x1old){ctx.lineTo(axisx.p2c(x1old),axisy.p2c(y1))}ctx.lineTo(axisx.p2c(x1),axisy.p2c(y1));ctx.lineTo(axisx.p2c(x2),axisy.p2c(y2));if(x2!=x2old){ctx.lineTo(axisx.p2c(x2),axisy.p2c(y2));ctx.lineTo(axisx.p2c(x2old),axisy.p2c(y2))}}}ctx.save();ctx.translate(plotOffset.left,plotOffset.top);ctx.lineJoin="round";var lw=series.lines.lineWidth,sw=series.shadowSize;if(lw>0&&sw>0){ctx.lineWidth=sw;ctx.strokeStyle="rgba(0,0,0,0.1)";var angle=Math.PI/18;plotLine(series.datapoints,Math.sin(angle)*(lw/2+sw/2),Math.cos(angle)*(lw/2+sw/2),series.xaxis,series.yaxis);ctx.lineWidth=sw/2;plotLine(series.datapoints,Math.sin(angle)*(lw/2+sw/4),Math.cos(angle)*(lw/2+sw/4),series.xaxis,series.yaxis)}ctx.lineWidth=lw;ctx.strokeStyle=series.color;var fillStyle=getFillStyle(series.lines,series.color,0,plotHeight);if(fillStyle){ctx.fillStyle=fillStyle;plotLineArea(series.datapoints,series.xaxis,series.yaxis)}if(lw>0)plotLine(series.datapoints,0,0,series.xaxis,series.yaxis);ctx.restore()}function drawSeriesPoints(series){function plotPoints(datapoints,radius,fillStyle,offset,shadow,axisx,axisy,symbol){var points=datapoints.points,ps=datapoints.pointsize;for(var i=0;i<points.length;i+=ps){var x=points[i],y=points[i+1];if(x==null||x<axisx.min||x>axisx.max||y<axisy.min||y>axisy.max)continue;ctx.beginPath();x=axisx.p2c(x);y=axisy.p2c(y)+offset;if(symbol=="circle")ctx.arc(x,y,radius,0,shadow?Math.PI:Math.PI*2,false);else symbol(ctx,x,y,radius,shadow);ctx.closePath();if(fillStyle){ctx.fillStyle=fillStyle;ctx.fill()}ctx.stroke()}}ctx.save();ctx.translate(plotOffset.left,plotOffset.top);var lw=series.points.lineWidth,sw=series.shadowSize,radius=series.points.radius,symbol=series.points.symbol;if(lw==0)lw=1e-4;if(lw>0&&sw>0){var w=sw/2;ctx.lineWidth=w;ctx.strokeStyle="rgba(0,0,0,0.1)";plotPoints(series.datapoints,radius,null,w+w/2,true,series.xaxis,series.yaxis,symbol);ctx.strokeStyle="rgba(0,0,0,0.2)";plotPoints(series.datapoints,radius,null,w/2,true,series.xaxis,series.yaxis,symbol)}ctx.lineWidth=lw;ctx.strokeStyle=series.color;plotPoints(series.datapoints,radius,getFillStyle(series.points,series.color),0,false,series.xaxis,series.yaxis,symbol);ctx.restore()}function drawBar(x,y,b,barLeft,barRight,fillStyleCallback,axisx,axisy,c,horizontal,lineWidth){var left,right,bottom,top,drawLeft,drawRight,drawTop,drawBottom,tmp;if(horizontal){drawBottom=drawRight=drawTop=true;drawLeft=false;left=b;right=x;top=y+barLeft;bottom=y+barRight;if(right<left){tmp=right;right=left;left=tmp;drawLeft=true;drawRight=false}}else{drawLeft=drawRight=drawTop=true;drawBottom=false;left=x+barLeft;right=x+barRight;bottom=b;top=y;if(top<bottom){tmp=top;top=bottom;bottom=tmp;drawBottom=true;drawTop=false}}if(right<axisx.min||left>axisx.max||top<axisy.min||bottom>axisy.max)return;if(left<axisx.min){left=axisx.min;drawLeft=false}if(right>axisx.max){right=axisx.max;drawRight=false}if(bottom<axisy.min){bottom=axisy.min;drawBottom=false}if(top>axisy.max){top=axisy.max;drawTop=false}left=axisx.p2c(left);bottom=axisy.p2c(bottom);right=axisx.p2c(right);top=axisy.p2c(top);if(fillStyleCallback){c.fillStyle=fillStyleCallback(bottom,top);c.fillRect(left,top,right-left,bottom-top)}if(lineWidth>0&&(drawLeft||drawRight||drawTop||drawBottom)){c.beginPath();c.moveTo(left,bottom);if(drawLeft)c.lineTo(left,top);else c.moveTo(left,top);if(drawTop)c.lineTo(right,top);else c.moveTo(right,top);if(drawRight)c.lineTo(right,bottom);else c.moveTo(right,bottom);if(drawBottom)c.lineTo(left,bottom);else c.moveTo(left,bottom);c.stroke()}}function drawSeriesBars(series){function plotBars(datapoints,barLeft,barRight,fillStyleCallback,axisx,axisy){var points=datapoints.points,ps=datapoints.pointsize;for(var i=0;i<points.length;i+=ps){if(points[i]==null)continue;drawBar(points[i],points[i+1],points[i+2],barLeft,barRight,fillStyleCallback,axisx,axisy,ctx,series.bars.horizontal,series.bars.lineWidth)}}ctx.save();ctx.translate(plotOffset.left,plotOffset.top);ctx.lineWidth=series.bars.lineWidth;ctx.strokeStyle=series.color;var barLeft;switch(series.bars.align){case"left":barLeft=0;break;case"right":barLeft=-series.bars.barWidth;break;default:barLeft=-series.bars.barWidth/2}var fillStyleCallback=series.bars.fill?function(bottom,top){return getFillStyle(series.bars,series.color,bottom,top)}:null;plotBars(series.datapoints,barLeft,barLeft+series.bars.barWidth,fillStyleCallback,series.xaxis,series.yaxis);ctx.restore()}function getFillStyle(filloptions,seriesColor,bottom,top){var fill=filloptions.fill;if(!fill)return null;if(filloptions.fillColor)return getColorOrGradient(filloptions.fillColor,bottom,top,seriesColor);var c=$.color.parse(seriesColor);c.a=typeof fill=="number"?fill:.4;c.normalize();return c.toString()}function insertLegend(){if(options.legend.container!=null){$(options.legend.container).html("")}else{placeholder.find(".legend").remove()}if(!options.legend.show){return}var fragments=[],entries=[],rowStarted=false,lf=options.legend.labelFormatter,s,label;for(var i=0;i<series.length;++i){s=series[i];if(s.label){label=lf?lf(s.label,s):s.label;if(label){entries.push({label:label,color:s.color})}}}if(options.legend.sorted){if($.isFunction(options.legend.sorted)){entries.sort(options.legend.sorted)}else if(options.legend.sorted=="reverse"){entries.reverse()}else{var ascending=options.legend.sorted!="descending";entries.sort(function(a,b){return a.label==b.label?0:a.label<b.label!=ascending?1:-1})}}for(var i=0;i<entries.length;++i){var entry=entries[i];if(i%options.legend.noColumns==0){if(rowStarted)fragments.push("</tr>");fragments.push("<tr>");rowStarted=true}fragments.push('<td class="legendColorBox"><div style="border:1px solid '+options.legend.labelBoxBorderColor+';padding:1px"><div style="width:4px;height:0;border:5px solid '+entry.color+';overflow:hidden"></div></div></td>'+'<td class="legendLabel">'+entry.label+"</td>")}if(rowStarted)fragments.push("</tr>");if(fragments.length==0)return;var table='<table style="font-size:smaller;color:'+options.grid.color+'">'+fragments.join("")+"</table>";if(options.legend.container!=null)$(options.legend.container).html(table);else{var pos="",p=options.legend.position,m=options.legend.margin;if(m[0]==null)m=[m,m];if(p.charAt(0)=="n")pos+="top:"+(m[1]+plotOffset.top)+"px;";else if(p.charAt(0)=="s")pos+="bottom:"+(m[1]+plotOffset.bottom)+"px;";if(p.charAt(1)=="e")pos+="right:"+(m[0]+plotOffset.right)+"px;";else if(p.charAt(1)=="w")pos+="left:"+(m[0]+plotOffset.left)+"px;";var legend=$('<div class="legend">'+table.replace('style="','style="position:absolute;'+pos+";")+"</div>").appendTo(placeholder);if(options.legend.backgroundOpacity!=0){var c=options.legend.backgroundColor;if(c==null){c=options.grid.backgroundColor;if(c&&typeof c=="string")c=$.color.parse(c);else c=$.color.extract(legend,"background-color");c.a=1;c=c.toString()}var div=legend.children();$('<div style="position:absolute;width:'+div.width()+"px;height:"+div.height()+"px;"+pos+"background-color:"+c+';"> </div>').prependTo(legend).css("opacity",options.legend.backgroundOpacity)}}}var highlights=[],redrawTimeout=null;function findNearbyItem(mouseX,mouseY,seriesFilter){var maxDistance=options.grid.mouseActiveRadius,smallestDistance=maxDistance*maxDistance+1,item=null,foundPoint=false,i,j,ps;for(i=series.length-1;i>=0;--i){if(!seriesFilter(series[i]))continue;var s=series[i],axisx=s.xaxis,axisy=s.yaxis,points=s.datapoints.points,mx=axisx.c2p(mouseX),my=axisy.c2p(mouseY),maxx=maxDistance/axisx.scale,maxy=maxDistance/axisy.scale;ps=s.datapoints.pointsize;if(axisx.options.inverseTransform)maxx=Number.MAX_VALUE;if(axisy.options.inverseTransform)maxy=Number.MAX_VALUE;if(s.lines.show||s.points.show){for(j=0;j<points.length;j+=ps){var x=points[j],y=points[j+1];if(x==null)continue;if(x-mx>maxx||x-mx<-maxx||y-my>maxy||y-my<-maxy)continue;var dx=Math.abs(axisx.p2c(x)-mouseX),dy=Math.abs(axisy.p2c(y)-mouseY),dist=dx*dx+dy*dy;if(dist<smallestDistance){smallestDistance=dist;item=[i,j/ps]}}}if(s.bars.show&&!item){var barLeft,barRight;switch(s.bars.align){case"left":barLeft=0;break;case"right":barLeft=-s.bars.barWidth;break;default:barLeft=-s.bars.barWidth/2}barRight=barLeft+s.bars.barWidth;for(j=0;j<points.length;j+=ps){var x=points[j],y=points[j+1],b=points[j+2];if(x==null)continue;if(series[i].bars.horizontal?mx<=Math.max(b,x)&&mx>=Math.min(b,x)&&my>=y+barLeft&&my<=y+barRight:mx>=x+barLeft&&mx<=x+barRight&&my>=Math.min(b,y)&&my<=Math.max(b,y))item=[i,j/ps]}}}if(item){i=item[0];j=item[1];ps=series[i].datapoints.pointsize;return{datapoint:series[i].datapoints.points.slice(j*ps,(j+1)*ps),dataIndex:j,series:series[i],seriesIndex:i}}return null}function onMouseMove(e){if(options.grid.hoverable)triggerClickHoverEvent("plothover",e,function(s){return s["hoverable"]!=false})}function onMouseLeave(e){if(options.grid.hoverable)triggerClickHoverEvent("plothover",e,function(s){return false})}function onClick(e){triggerClickHoverEvent("plotclick",e,function(s){return s["clickable"]!=false})}function triggerClickHoverEvent(eventname,event,seriesFilter){var offset=eventHolder.offset(),canvasX=event.pageX-offset.left-plotOffset.left,canvasY=event.pageY-offset.top-plotOffset.top,pos=canvasToAxisCoords({left:canvasX,top:canvasY});pos.pageX=event.pageX;pos.pageY=event.pageY;var item=findNearbyItem(canvasX,canvasY,seriesFilter);if(item){item.pageX=parseInt(item.series.xaxis.p2c(item.datapoint[0])+offset.left+plotOffset.left,10);item.pageY=parseInt(item.series.yaxis.p2c(item.datapoint[1])+offset.top+plotOffset.top,10)}if(options.grid.autoHighlight){for(var i=0;i<highlights.length;++i){var h=highlights[i];if(h.auto==eventname&&!(item&&h.series==item.series&&h.point[0]==item.datapoint[0]&&h.point[1]==item.datapoint[1]))unhighlight(h.series,h.point)}if(item)highlight(item.series,item.datapoint,eventname)}placeholder.trigger(eventname,[pos,item])}function triggerRedrawOverlay(){var t=options.interaction.redrawOverlayInterval;if(t==-1){drawOverlay();return}if(!redrawTimeout)redrawTimeout=setTimeout(drawOverlay,t)}function drawOverlay(){redrawTimeout=null;octx.save();overlay.clear();octx.translate(plotOffset.left,plotOffset.top);var i,hi;for(i=0;i<highlights.length;++i){hi=highlights[i];if(hi.series.bars.show)drawBarHighlight(hi.series,hi.point);else drawPointHighlight(hi.series,hi.point)}octx.restore();executeHooks(hooks.drawOverlay,[octx])}function highlight(s,point,auto){if(typeof s=="number")s=series[s];if(typeof point=="number"){var ps=s.datapoints.pointsize;point=s.datapoints.points.slice(ps*point,ps*(point+1))}var i=indexOfHighlight(s,point);if(i==-1){highlights.push({series:s,point:point,auto:auto});triggerRedrawOverlay()}else if(!auto)highlights[i].auto=false}function unhighlight(s,point){if(s==null&&point==null){highlights=[];triggerRedrawOverlay();return}if(typeof s=="number")s=series[s];if(typeof point=="number"){var ps=s.datapoints.pointsize;point=s.datapoints.points.slice(ps*point,ps*(point+1))}var i=indexOfHighlight(s,point);if(i!=-1){highlights.splice(i,1);triggerRedrawOverlay()}}function indexOfHighlight(s,p){for(var i=0;i<highlights.length;++i){var h=highlights[i];if(h.series==s&&h.point[0]==p[0]&&h.point[1]==p[1])return i}return-1}function drawPointHighlight(series,point){var x=point[0],y=point[1],axisx=series.xaxis,axisy=series.yaxis,highlightColor=typeof series.highlightColor==="string"?series.highlightColor:$.color.parse(series.color).scale("a",.5).toString();if(x<axisx.min||x>axisx.max||y<axisy.min||y>axisy.max)return;var pointRadius=series.points.radius+series.points.lineWidth/2;octx.lineWidth=pointRadius;octx.strokeStyle=highlightColor;var radius=1.5*pointRadius;x=axisx.p2c(x);y=axisy.p2c(y);octx.beginPath();if(series.points.symbol=="circle")octx.arc(x,y,radius,0,2*Math.PI,false);else series.points.symbol(octx,x,y,radius,false);octx.closePath();octx.stroke()}function drawBarHighlight(series,point){var highlightColor=typeof series.highlightColor==="string"?series.highlightColor:$.color.parse(series.color).scale("a",.5).toString(),fillStyle=highlightColor,barLeft;switch(series.bars.align){case"left":barLeft=0;break;case"right":barLeft=-series.bars.barWidth;break;default:barLeft=-series.bars.barWidth/2}octx.lineWidth=series.bars.lineWidth;octx.strokeStyle=highlightColor;drawBar(point[0],point[1],point[2]||0,barLeft,barLeft+series.bars.barWidth,function(){return fillStyle},series.xaxis,series.yaxis,octx,series.bars.horizontal,series.bars.lineWidth)}function getColorOrGradient(spec,bottom,top,defaultColor){if(typeof spec=="string")return spec;else{var gradient=ctx.createLinearGradient(0,top,0,bottom);for(var i=0,l=spec.colors.length;i<l;++i){var c=spec.colors[i];if(typeof c!="string"){var co=$.color.parse(defaultColor);if(c.brightness!=null)co=co.scale("rgb",c.brightness);if(c.opacity!=null)co.a*=c.opacity;c=co.toString()}gradient.addColorStop(i/(l-1),c)}return gradient}}}$.plot=function(placeholder,data,options){var plot=new Plot($(placeholder),data,options,$.plot.plugins);return plot};$.plot.version="0.8.3";$.plot.plugins=[];$.fn.plot=function(data,options){return this.each(function(){$.plot(this,data,options)})};function floorInBase(n,base){return base*Math.floor(n/base)}})(jQuery);

/*
Axis Labels Plugin for flot.
http://github.com/markrcote/flot-axislabels

Original code is Copyright (c) 2010 Xuan Luo.
Original code was released under the GPLv3 license by Xuan Luo, September 2010.
Original code was rereleased under the MIT license by Xuan Luo, April 2012.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/*
Axis Labels Plugin for flot.
http://github.com/markrcote/flot-axislabels

Original code is Copyright (c) 2010 Xuan Luo.
Original code was released under the GPLv3 license by Xuan Luo, September 2010.
Original code was rereleased under the MIT license by Xuan Luo, April 2012.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
!function(s){function n(){return document.createElement("canvas").getContext&&"function"==typeof document.createElement("canvas").getContext("2d").fillText}function p(){var t=document.createElement("div");return void 0!==t.style.MozTransition||void 0!==t.style.OTransition||void 0!==t.style.webkitTransition||void 0!==t.style.transition}function a(t,i,e,s,o){this.axisName=t,this.position=i,this.padding=e,this.plot=s,this.opts=o,this.width=0,this.height=0}function r(t,i,e,s,o){a.prototype.constructor.call(this,t,i,e,s,o)}function d(t,i,e,s,o){a.prototype.constructor.call(this,t,i,e,s,o),this.elem=null}function c(t,i,e,s,o){d.prototype.constructor.call(this,t,i,e,s,o)}function f(t,i,e,s,o){c.prototype.constructor.call(this,t,i,e,s,o),this.requiresResize=!1}a.prototype.cleanup=function(){},((r.prototype=new a).constructor=r).prototype.calculateSize=function(){this.opts.axisLabelFontSizePixels||(this.opts.axisLabelFontSizePixels=14),this.opts.axisLabelFontFamily||(this.opts.axisLabelFontFamily="sans-serif");this.opts.axisLabelFontSizePixels,this.padding,this.opts.axisLabelFontSizePixels,this.padding;"left"==this.position||"right"==this.position?(this.width=this.opts.axisLabelFontSizePixels+this.padding,this.height=0):(this.width=0,this.height=this.opts.axisLabelFontSizePixels+this.padding)},r.prototype.draw=function(t){this.opts.axisLabelColour||(this.opts.axisLabelColour="black");var i=this.plot.getCanvas().getContext("2d");i.save(),i.font=this.opts.axisLabelFontSizePixels+"px "+this.opts.axisLabelFontFamily,i.fillStyle=this.opts.axisLabelColour;var e,s,o=i.measureText(this.opts.axisLabel).width,a=this.opts.axisLabelFontSizePixels,l=0;"top"==this.position?(e=t.left+t.width/2-o/2,s=t.top+.72*a):"bottom"==this.position?(e=t.left+t.width/2-o/2,s=t.top+t.height-.72*a):"left"==this.position?(e=t.left+.72*a,s=t.height/2+t.top+o/2,l=-Math.PI/2):"right"==this.position&&(e=t.left+t.width-.72*a,s=t.height/2+t.top-o/2,l=Math.PI/2),i.translate(e,s),i.rotate(l),i.fillText(this.opts.axisLabel,0,0),i.restore()},((d.prototype=new a).constructor=d).prototype.calculateSize=function(){var t=s('<div class="axisLabels" style="position:absolute;">'+this.opts.axisLabel+"</div>");this.plot.getPlaceholder().append(t),this.labelWidth=t.outerWidth(!0),this.labelHeight=t.outerHeight(!0),t.remove(),this.width=this.height=0,"left"==this.position||"right"==this.position?this.width=this.labelWidth+this.padding:this.height=this.labelHeight+this.padding},d.prototype.cleanup=function(){this.elem&&this.elem.remove()},d.prototype.draw=function(t){this.plot.getPlaceholder().find("#"+this.axisName+"Label").remove(),this.elem=s('<div id="'+this.axisName+'Label" " class="axisLabels" style="position:absolute;">'+this.opts.axisLabel+"</div>"),this.plot.getPlaceholder().append(this.elem),"top"==this.position?(this.elem.css("left",t.left+t.width/2-this.labelWidth/2+"px"),this.elem.css("top",t.top+"px")):"bottom"==this.position?(this.elem.css("left",t.left+t.width/2-this.labelWidth/2+"px"),this.elem.css("top",t.top+t.height-this.labelHeight+"px")):"left"==this.position?(this.elem.css("top",t.top+t.height/2-this.labelHeight/2+"px"),this.elem.css("left",t.left+"px")):"right"==this.position&&(this.elem.css("top",t.top+t.height/2-this.labelHeight/2+"px"),this.elem.css("left",t.left+t.width-this.labelWidth+"px"))},((c.prototype=new d).constructor=c).prototype.calculateSize=function(){d.prototype.calculateSize.call(this),this.width=this.height=0,"left"==this.position||"right"==this.position?this.width=this.labelHeight+this.padding:this.height=this.labelHeight+this.padding},c.prototype.transforms=function(t,i,e){var s={"-moz-transform":"","-webkit-transform":"","-o-transform":"","-ms-transform":""};0==i&&0==e||(e=" translate("+i+"px, "+e+"px)",s["-moz-transform"]+=e,s["-webkit-transform"]+=e,s["-o-transform"]+=e,s["-ms-transform"]+=e),0!=t&&(t=" rotate("+t+"deg)",s["-moz-transform"]+=t,s["-webkit-transform"]+=t,s["-o-transform"]+=t,s["-ms-transform"]+=t);var o,a="top: 0; left: 0; ";for(o in s)s[o]&&(a+=o+":"+s[o]+";");return a+=";"},c.prototype.calculateOffsets=function(t){var i={x:0,y:0,degrees:0};return"bottom"==this.position?(i.x=t.left+t.width/2-this.labelWidth/2,i.y=t.top+t.height-this.labelHeight):"top"==this.position?(i.x=t.left+t.width/2-this.labelWidth/2,i.y=t.top):"left"==this.position?(i.degrees=-90,i.x=t.left-this.labelWidth/2+this.labelHeight/2,i.y=t.height/2+t.top):"right"==this.position&&(i.degrees=90,i.x=t.left+t.width-this.labelWidth/2-this.labelHeight/2,i.y=t.height/2+t.top),i.x=Math.round(i.x),i.y=Math.round(i.y),i},c.prototype.draw=function(t){this.plot.getPlaceholder().find("."+this.axisName+"Label").remove();t=this.calculateOffsets(t);this.elem=s('<div class="axisLabels '+this.axisName+'Label" style="position:absolute; '+this.transforms(t.degrees,t.x,t.y)+'">'+this.opts.axisLabel+"</div>"),this.plot.getPlaceholder().append(this.elem)},((f.prototype=new c).constructor=f).prototype.transforms=function(t,i,e){var s="";if(0!=t){for(var o=t/90;o<0;)o+=4;s+=" filter: progid:DXImageTransform.Microsoft.BasicImage(rotation="+o+"); ",this.requiresResize="right"==this.position}return 0!=i&&(s+="left: "+i+"px; "),0!=e&&(s+="top: "+e+"px; "),s},f.prototype.calculateOffsets=function(t){var i=c.prototype.calculateOffsets.call(this,t);return"top"==this.position?i.y=t.top+1:"left"==this.position?(i.x=t.left,i.y=t.height/2+t.top-this.labelWidth/2):"right"==this.position&&(i.x=t.left+t.width-this.labelHeight,i.y=t.height/2+t.top-this.labelWidth/2),i},f.prototype.draw=function(t){c.prototype.draw.call(this,t),this.requiresResize&&(this.elem=this.plot.getPlaceholder().find("."+this.axisName+"Label"),this.elem.css("width",this.labelWidth),this.elem.css("height",this.labelHeight))},s.plot.plugins.push({init:function(t){t.hooks.processOptions.push(function(t,i){var e,h;i.axisLabels.show&&(e=!1,h={},t.hooks.draw.push(function(a,t){var l=!1;e?(e=!1,s.each(a.getAxes(),function(t,i){var e=i.options||a.getOptions()[t];e&&e.axisLabel&&i.show&&h[t].draw(i.box)})):(s.each(a.getAxes(),function(t,i){var e,s,o=i.options||a.getOptions()[t];t in h&&(i.labelHeight=i.labelHeight-h[t].height,i.labelWidth=i.labelWidth-h[t].width,o.labelHeight=i.labelHeight,o.labelWidth=i.labelWidth,h[t].cleanup(),delete h[t]),o&&o.axisLabel&&i.show&&(l=!0,e=null,e=o.axisLabelUseHtml||"Microsoft Internet Explorer"!=navigator.appName?o.axisLabelUseHtml||!p()&&!n()&&!o.axisLabelUseCanvas?d:o.axisLabelUseCanvas||!p()?r:c:(s=navigator.userAgent,null!=new RegExp("MSIE ([0-9]{1,}[.0-9]{0,})").exec(s)&&(rv=parseFloat(RegExp.$1)),9<=rv&&!o.axisLabelUseCanvas&&!o.axisLabelUseHtml?c:o.axisLabelUseCanvas||o.axisLabelUseHtml?o.axisLabelUseCanvas?r:d:f),s=void 0===o.axisLabelPadding?2:o.axisLabelPadding,h[t]=new e(t,i.position,s,a,o),h[t].calculateSize(),o.labelHeight=i.labelHeight+h[t].height,o.labelWidth=i.labelWidth+h[t].width)}),l&&(e=!0,a.setupGrid(),a.draw()))}))})},options:{axisLabels:{show:!0}},name:"axisLabels",version:"2.0"})}(jQuery);


/* Javascript plotting library for jQuery, version 0.8.3.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

*/
(function($){var options={series:{fillBetween:null}};function init(plot){function findBottomSeries(s,allseries){var i;for(i=0;i<allseries.length;++i){if(allseries[i].id===s.fillBetween){return allseries[i]}}if(typeof s.fillBetween==="number"){if(s.fillBetween<0||s.fillBetween>=allseries.length){return null}return allseries[s.fillBetween]}return null}function computeFillBottoms(plot,s,datapoints){if(s.fillBetween==null){return}var other=findBottomSeries(s,plot.getData());if(!other){return}var ps=datapoints.pointsize,points=datapoints.points,otherps=other.datapoints.pointsize,otherpoints=other.datapoints.points,newpoints=[],px,py,intery,qx,qy,bottom,withlines=s.lines.show,withbottom=ps>2&&datapoints.format[2].y,withsteps=withlines&&s.lines.steps,fromgap=true,i=0,j=0,l,m;while(true){if(i>=points.length){break}l=newpoints.length;if(points[i]==null){for(m=0;m<ps;++m){newpoints.push(points[i+m])}i+=ps}else if(j>=otherpoints.length){if(!withlines){for(m=0;m<ps;++m){newpoints.push(points[i+m])}}i+=ps}else if(otherpoints[j]==null){for(m=0;m<ps;++m){newpoints.push(null)}fromgap=true;j+=otherps}else{px=points[i];py=points[i+1];qx=otherpoints[j];qy=otherpoints[j+1];bottom=0;if(px===qx){for(m=0;m<ps;++m){newpoints.push(points[i+m])}bottom=qy;i+=ps;j+=otherps}else if(px>qx){if(withlines&&i>0&&points[i-ps]!=null){intery=py+(points[i-ps+1]-py)*(qx-px)/(points[i-ps]-px);newpoints.push(qx);newpoints.push(intery);for(m=2;m<ps;++m){newpoints.push(points[i+m])}bottom=qy}j+=otherps}else{if(fromgap&&withlines){i+=ps;continue}for(m=0;m<ps;++m){newpoints.push(points[i+m])}if(withlines&&j>0&&otherpoints[j-otherps]!=null){bottom=qy+(otherpoints[j-otherps+1]-qy)*(px-qx)/(otherpoints[j-otherps]-qx)}i+=ps}fromgap=false;if(l!==newpoints.length&&withbottom){newpoints[l+2]=bottom}}if(withsteps&&l!==newpoints.length&&l>0&&newpoints[l]!==null&&newpoints[l]!==newpoints[l-ps]&&newpoints[l+1]!==newpoints[l-ps+1]){for(m=0;m<ps;++m){newpoints[l+ps+m]=newpoints[l+m]}newpoints[l+1]=newpoints[l-ps+1]}}datapoints.points=newpoints}plot.hooks.processDatapoints.push(computeFillBottoms)}$.plot.plugins.push({init:init,options:options,name:"fillbetween",version:"1.0"})})(jQuery);

/* Javascript plotting library for jQuery, version 0.8.3.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

*/
(function($,e,t){"$:nomunge";var i=[],n=$.resize=$.extend($.resize,{}),a,r=false,s="setTimeout",u="resize",m=u+"-special-event",o="pendingDelay",l="activeDelay",f="throttleWindow";n[o]=200;n[l]=20;n[f]=true;$.event.special[u]={setup:function(){if(!n[f]&&this[s]){return false}var e=$(this);i.push(this);e.data(m,{w:e.width(),h:e.height()});if(i.length===1){a=t;h()}},teardown:function(){if(!n[f]&&this[s]){return false}var e=$(this);for(var t=i.length-1;t>=0;t--){if(i[t]==this){i.splice(t,1);break}}e.removeData(m);if(!i.length){if(r){cancelAnimationFrame(a)}else{clearTimeout(a)}a=null}},add:function(e){if(!n[f]&&this[s]){return false}var i;function a(e,n,a){var r=$(this),s=r.data(m)||{};s.w=n!==t?n:r.width();s.h=a!==t?a:r.height();i.apply(this,arguments)}if($.isFunction(e)){i=e;return a}else{i=e.handler;e.handler=a}}};function h(t){if(r===true){r=t||1}for(var s=i.length-1;s>=0;s--){var l=$(i[s]);if(l[0]==e||l.is(":visible")){var f=l.width(),c=l.height(),d=l.data(m);if(d&&(f!==d.w||c!==d.h)){l.trigger(u,[d.w=f,d.h=c]);r=t||true}}else{d=l.data(m);d.w=0;d.h=0}}if(a!==null){if(r&&(t==null||t-r<1e3)){a=e.requestAnimationFrame(h)}else{a=setTimeout(h,n[o]);r=false}}}if(!e.requestAnimationFrame){e.requestAnimationFrame=function(){return e.webkitRequestAnimationFrame||e.mozRequestAnimationFrame||e.oRequestAnimationFrame||e.msRequestAnimationFrame||function(t,i){return e.setTimeout(function(){t((new Date).getTime())},n[l])}}()}if(!e.cancelAnimationFrame){e.cancelAnimationFrame=function(){return e.webkitCancelRequestAnimationFrame||e.mozCancelRequestAnimationFrame||e.oCancelRequestAnimationFrame||e.msCancelRequestAnimationFrame||clearTimeout}()}})(jQuery,this);(function($){var options={};function init(plot){function onResize(){var placeholder=plot.getPlaceholder();if(placeholder.width()==0||placeholder.height()==0)return;plot.resize();plot.setupGrid();plot.draw()}function bindEvents(plot,eventHolder){plot.getPlaceholder().resize(onResize)}function shutdown(plot,eventHolder){plot.getPlaceholder().unbind("resize",onResize)}plot.hooks.bindEvents.push(bindEvents);plot.hooks.shutdown.push(shutdown)}$.plot.plugins.push({init:init,options:options,name:"resize",version:"1.0"})})(jQuery);

/* Javascript plotting library for jQuery, version 0.8.3.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

*/
(function($){var options={series:{stack:null}};function init(plot){function findMatchingSeries(s,allseries){var res=null;for(var i=0;i<allseries.length;++i){if(s==allseries[i])break;if(allseries[i].stack==s.stack)res=allseries[i]}return res}function stackData(plot,s,datapoints){if(s.stack==null||s.stack===false)return;var other=findMatchingSeries(s,plot.getData());if(!other)return;var ps=datapoints.pointsize,points=datapoints.points,otherps=other.datapoints.pointsize,otherpoints=other.datapoints.points,newpoints=[],px,py,intery,qx,qy,bottom,withlines=s.lines.show,horizontal=s.bars.horizontal,withbottom=ps>2&&(horizontal?datapoints.format[2].x:datapoints.format[2].y),withsteps=withlines&&s.lines.steps,fromgap=true,keyOffset=horizontal?1:0,accumulateOffset=horizontal?0:1,i=0,j=0,l,m;while(true){if(i>=points.length)break;l=newpoints.length;if(points[i]==null){for(m=0;m<ps;++m)newpoints.push(points[i+m]);i+=ps}else if(j>=otherpoints.length){if(!withlines){for(m=0;m<ps;++m)newpoints.push(points[i+m])}i+=ps}else if(otherpoints[j]==null){for(m=0;m<ps;++m)newpoints.push(null);fromgap=true;j+=otherps}else{px=points[i+keyOffset];py=points[i+accumulateOffset];qx=otherpoints[j+keyOffset];qy=otherpoints[j+accumulateOffset];bottom=0;if(px==qx){for(m=0;m<ps;++m)newpoints.push(points[i+m]);newpoints[l+accumulateOffset]+=qy;bottom=qy;i+=ps;j+=otherps}else if(px>qx){if(withlines&&i>0&&points[i-ps]!=null){intery=py+(points[i-ps+accumulateOffset]-py)*(qx-px)/(points[i-ps+keyOffset]-px);newpoints.push(qx);newpoints.push(intery+qy);for(m=2;m<ps;++m)newpoints.push(points[i+m]);bottom=qy}j+=otherps}else{if(fromgap&&withlines){i+=ps;continue}for(m=0;m<ps;++m)newpoints.push(points[i+m]);if(withlines&&j>0&&otherpoints[j-otherps]!=null)bottom=qy+(otherpoints[j-otherps+accumulateOffset]-qy)*(px-qx)/(otherpoints[j-otherps+keyOffset]-qx);newpoints[l+accumulateOffset]+=bottom;i+=ps}fromgap=false;if(l!=newpoints.length&&withbottom)newpoints[l+2]+=bottom}if(withsteps&&l!=newpoints.length&&l>0&&newpoints[l]!=null&&newpoints[l]!=newpoints[l-ps]&&newpoints[l+1]!=newpoints[l-ps+1]){for(m=0;m<ps;++m)newpoints[l+ps+m]=newpoints[l+m];newpoints[l+1]=newpoints[l-ps+1]}}datapoints.points=newpoints}plot.hooks.processDatapoints.push(stackData)}$.plot.plugins.push({init:init,options:options,name:"stack",version:"1.2"})})(jQuery);

/* Javascript plotting library for jQuery, version 0.8.3.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

*/
(function($){function init(plot){var selection={first:{x:-1,y:-1},second:{x:-1,y:-1},show:false,active:false};var savedhandlers={};var mouseUpHandler=null;function onMouseMove(e){if(selection.active){updateSelection(e);plot.getPlaceholder().trigger("plotselecting",[getSelection()])}}function onMouseDown(e){if(e.which!=1)return;document.body.focus();if(document.onselectstart!==undefined&&savedhandlers.onselectstart==null){savedhandlers.onselectstart=document.onselectstart;document.onselectstart=function(){return false}}if(document.ondrag!==undefined&&savedhandlers.ondrag==null){savedhandlers.ondrag=document.ondrag;document.ondrag=function(){return false}}setSelectionPos(selection.first,e);selection.active=true;mouseUpHandler=function(e){onMouseUp(e)};$(document).one("mouseup",mouseUpHandler)}function onMouseUp(e){mouseUpHandler=null;if(document.onselectstart!==undefined)document.onselectstart=savedhandlers.onselectstart;if(document.ondrag!==undefined)document.ondrag=savedhandlers.ondrag;selection.active=false;updateSelection(e);if(selectionIsSane())triggerSelectedEvent();else{plot.getPlaceholder().trigger("plotunselected",[]);plot.getPlaceholder().trigger("plotselecting",[null])}return false}function getSelection(){if(!selectionIsSane())return null;if(!selection.show)return null;var r={},c1=selection.first,c2=selection.second;$.each(plot.getAxes(),function(name,axis){if(axis.used){var p1=axis.c2p(c1[axis.direction]),p2=axis.c2p(c2[axis.direction]);r[name]={from:Math.min(p1,p2),to:Math.max(p1,p2)}}});return r}function triggerSelectedEvent(){var r=getSelection();plot.getPlaceholder().trigger("plotselected",[r]);if(r.xaxis&&r.yaxis)plot.getPlaceholder().trigger("selected",[{x1:r.xaxis.from,y1:r.yaxis.from,x2:r.xaxis.to,y2:r.yaxis.to}])}function clamp(min,value,max){return value<min?min:value>max?max:value}function setSelectionPos(pos,e){var o=plot.getOptions();var offset=plot.getPlaceholder().offset();var plotOffset=plot.getPlotOffset();pos.x=clamp(0,e.pageX-offset.left-plotOffset.left,plot.width());pos.y=clamp(0,e.pageY-offset.top-plotOffset.top,plot.height());if(o.selection.mode=="y")pos.x=pos==selection.first?0:plot.width();if(o.selection.mode=="x")pos.y=pos==selection.first?0:plot.height()}function updateSelection(pos){if(pos.pageX==null)return;setSelectionPos(selection.second,pos);if(selectionIsSane()){selection.show=true;plot.triggerRedrawOverlay()}else clearSelection(true)}function clearSelection(preventEvent){if(selection.show){selection.show=false;plot.triggerRedrawOverlay();if(!preventEvent)plot.getPlaceholder().trigger("plotunselected",[])}}function extractRange(ranges,coord){var axis,from,to,key,axes=plot.getAxes();for(var k in axes){axis=axes[k];if(axis.direction==coord){key=coord+axis.n+"axis";if(!ranges[key]&&axis.n==1)key=coord+"axis";if(ranges[key]){from=ranges[key].from;to=ranges[key].to;break}}}if(!ranges[key]){axis=coord=="x"?plot.getXAxes()[0]:plot.getYAxes()[0];from=ranges[coord+"1"];to=ranges[coord+"2"]}if(from!=null&&to!=null&&from>to){var tmp=from;from=to;to=tmp}return{from:from,to:to,axis:axis}}function setSelection(ranges,preventEvent){var axis,range,o=plot.getOptions();if(o.selection.mode=="y"){selection.first.x=0;selection.second.x=plot.width()}else{range=extractRange(ranges,"x");selection.first.x=range.axis.p2c(range.from);selection.second.x=range.axis.p2c(range.to)}if(o.selection.mode=="x"){selection.first.y=0;selection.second.y=plot.height()}else{range=extractRange(ranges,"y");selection.first.y=range.axis.p2c(range.from);selection.second.y=range.axis.p2c(range.to)}selection.show=true;plot.triggerRedrawOverlay();if(!preventEvent&&selectionIsSane())triggerSelectedEvent()}function selectionIsSane(){var minSize=plot.getOptions().selection.minSize;return Math.abs(selection.second.x-selection.first.x)>=minSize&&Math.abs(selection.second.y-selection.first.y)>=minSize}plot.clearSelection=clearSelection;plot.setSelection=setSelection;plot.getSelection=getSelection;plot.hooks.bindEvents.push(function(plot,eventHolder){var o=plot.getOptions();if(o.selection.mode!=null){eventHolder.mousemove(onMouseMove);eventHolder.mousedown(onMouseDown)}});plot.hooks.drawOverlay.push(function(plot,ctx){if(selection.show&&selectionIsSane()){var plotOffset=plot.getPlotOffset();var o=plot.getOptions();ctx.save();ctx.translate(plotOffset.left,plotOffset.top);var c=$.color.parse(o.selection.color);ctx.strokeStyle=c.scale("a",.8).toString();ctx.lineWidth=1;ctx.lineJoin=o.selection.shape;ctx.fillStyle=c.scale("a",.4).toString();var x=Math.min(selection.first.x,selection.second.x)+.5,y=Math.min(selection.first.y,selection.second.y)+.5,w=Math.abs(selection.second.x-selection.first.x)-1,h=Math.abs(selection.second.y-selection.first.y)-1;ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);ctx.restore()}});plot.hooks.shutdown.push(function(plot,eventHolder){eventHolder.unbind("mousemove",onMouseMove);eventHolder.unbind("mousedown",onMouseDown);if(mouseUpHandler)$(document).unbind("mouseup",mouseUpHandler)})}$.plot.plugins.push({init:init,options:{selection:{mode:null,color:"#e8cfac",shape:"round",minSize:5}},name:"selection",version:"1.1"})})(jQuery);

/* Javascript plotting library for jQuery, version 0.8.3.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

*/
(function($){var options={xaxis:{timezone:null,timeformat:null,twelveHourClock:false,monthNames:null}};function floorInBase(n,base){return base*Math.floor(n/base)}function formatDate(d,fmt,monthNames,dayNames){if(typeof d.strftime=="function"){return d.strftime(fmt)}var leftPad=function(n,pad){n=""+n;pad=""+(pad==null?"0":pad);return n.length==1?pad+n:n};var r=[];var escape=false;var hours=d.getHours();var isAM=hours<12;if(monthNames==null){monthNames=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]}if(dayNames==null){dayNames=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]}var hours12;if(hours>12){hours12=hours-12}else if(hours==0){hours12=12}else{hours12=hours}for(var i=0;i<fmt.length;++i){var c=fmt.charAt(i);if(escape){switch(c){case"a":c=""+dayNames[d.getDay()];break;case"b":c=""+monthNames[d.getMonth()];break;case"d":c=leftPad(d.getDate());break;case"e":c=leftPad(d.getDate()," ");break;case"h":case"H":c=leftPad(hours);break;case"I":c=leftPad(hours12);break;case"l":c=leftPad(hours12," ");break;case"m":c=leftPad(d.getMonth()+1);break;case"M":c=leftPad(d.getMinutes());break;case"q":c=""+(Math.floor(d.getMonth()/3)+1);break;case"S":c=leftPad(d.getSeconds());break;case"y":c=leftPad(d.getFullYear()%100);break;case"Y":c=""+d.getFullYear();break;case"p":c=isAM?""+"am":""+"pm";break;case"P":c=isAM?""+"AM":""+"PM";break;case"w":c=""+d.getDay();break}r.push(c);escape=false}else{if(c=="%"){escape=true}else{r.push(c)}}}return r.join("")}function makeUtcWrapper(d){function addProxyMethod(sourceObj,sourceMethod,targetObj,targetMethod){sourceObj[sourceMethod]=function(){return targetObj[targetMethod].apply(targetObj,arguments)}}var utc={date:d};if(d.strftime!=undefined){addProxyMethod(utc,"strftime",d,"strftime")}addProxyMethod(utc,"getTime",d,"getTime");addProxyMethod(utc,"setTime",d,"setTime");var props=["Date","Day","FullYear","Hours","Milliseconds","Minutes","Month","Seconds"];for(var p=0;p<props.length;p++){addProxyMethod(utc,"get"+props[p],d,"getUTC"+props[p]);addProxyMethod(utc,"set"+props[p],d,"setUTC"+props[p])}return utc}function dateGenerator(ts,opts){if(opts.timezone=="browser"){return new Date(ts)}else if(!opts.timezone||opts.timezone=="utc"){return makeUtcWrapper(new Date(ts))}else if(typeof timezoneJS!="undefined"&&typeof timezoneJS.Date!="undefined"){var d=new timezoneJS.Date;d.setTimezone(opts.timezone);d.setTime(ts);return d}else{return makeUtcWrapper(new Date(ts))}}var timeUnitSize={second:1e3,minute:60*1e3,hour:60*60*1e3,day:24*60*60*1e3,month:30*24*60*60*1e3,quarter:3*30*24*60*60*1e3,year:365.2425*24*60*60*1e3};var baseSpec=[[1,"second"],[2,"second"],[5,"second"],[10,"second"],[30,"second"],[1,"minute"],[2,"minute"],[5,"minute"],[10,"minute"],[30,"minute"],[1,"hour"],[2,"hour"],[4,"hour"],[8,"hour"],[12,"hour"],[1,"day"],[2,"day"],[3,"day"],[.25,"month"],[.5,"month"],[1,"month"],[2,"month"]];var specMonths=baseSpec.concat([[3,"month"],[6,"month"],[1,"year"]]);var specQuarters=baseSpec.concat([[1,"quarter"],[2,"quarter"],[1,"year"]]);function init(plot){plot.hooks.processOptions.push(function(plot,options){$.each(plot.getAxes(),function(axisName,axis){var opts=axis.options;if(opts.mode=="time"){axis.tickGenerator=function(axis){var ticks=[];var d=dateGenerator(axis.min,opts);var minSize=0;var spec=opts.tickSize&&opts.tickSize[1]==="quarter"||opts.minTickSize&&opts.minTickSize[1]==="quarter"?specQuarters:specMonths;if(opts.minTickSize!=null){if(typeof opts.tickSize=="number"){minSize=opts.tickSize}else{minSize=opts.minTickSize[0]*timeUnitSize[opts.minTickSize[1]]}}for(var i=0;i<spec.length-1;++i){if(axis.delta<(spec[i][0]*timeUnitSize[spec[i][1]]+spec[i+1][0]*timeUnitSize[spec[i+1][1]])/2&&spec[i][0]*timeUnitSize[spec[i][1]]>=minSize){break}}var size=spec[i][0];var unit=spec[i][1];if(unit=="year"){if(opts.minTickSize!=null&&opts.minTickSize[1]=="year"){size=Math.floor(opts.minTickSize[0])}else{var magn=Math.pow(10,Math.floor(Math.log(axis.delta/timeUnitSize.year)/Math.LN10));var norm=axis.delta/timeUnitSize.year/magn;if(norm<1.5){size=1}else if(norm<3){size=2}else if(norm<7.5){size=5}else{size=10}size*=magn}if(size<1){size=1}}axis.tickSize=opts.tickSize||[size,unit];var tickSize=axis.tickSize[0];unit=axis.tickSize[1];var step=tickSize*timeUnitSize[unit];if(unit=="second"){d.setSeconds(floorInBase(d.getSeconds(),tickSize))}else if(unit=="minute"){d.setMinutes(floorInBase(d.getMinutes(),tickSize))}else if(unit=="hour"){d.setHours(floorInBase(d.getHours(),tickSize))}else if(unit=="month"){d.setMonth(floorInBase(d.getMonth(),tickSize))}else if(unit=="quarter"){d.setMonth(3*floorInBase(d.getMonth()/3,tickSize))}else if(unit=="year"){d.setFullYear(floorInBase(d.getFullYear(),tickSize))}d.setMilliseconds(0);if(step>=timeUnitSize.minute){d.setSeconds(0)}if(step>=timeUnitSize.hour){d.setMinutes(0)}if(step>=timeUnitSize.day){d.setHours(0)}if(step>=timeUnitSize.day*4){d.setDate(1)}if(step>=timeUnitSize.month*2){d.setMonth(floorInBase(d.getMonth(),3))}if(step>=timeUnitSize.quarter*2){d.setMonth(floorInBase(d.getMonth(),6))}if(step>=timeUnitSize.year){d.setMonth(0)}var carry=0;var v=Number.NaN;var prev;do{prev=v;v=d.getTime();ticks.push(v);if(unit=="month"||unit=="quarter"){if(tickSize<1){d.setDate(1);var start=d.getTime();d.setMonth(d.getMonth()+(unit=="quarter"?3:1));var end=d.getTime();d.setTime(v+carry*timeUnitSize.hour+(end-start)*tickSize);carry=d.getHours();d.setHours(0)}else{d.setMonth(d.getMonth()+tickSize*(unit=="quarter"?3:1))}}else if(unit=="year"){d.setFullYear(d.getFullYear()+tickSize)}else{d.setTime(v+step)}}while(v<axis.max&&v!=prev);return ticks};axis.tickFormatter=function(v,axis){var d=dateGenerator(v,axis.options);if(opts.timeformat!=null){return formatDate(d,opts.timeformat,opts.monthNames,opts.dayNames)}var useQuarters=axis.options.tickSize&&axis.options.tickSize[1]=="quarter"||axis.options.minTickSize&&axis.options.minTickSize[1]=="quarter";var t=axis.tickSize[0]*timeUnitSize[axis.tickSize[1]];var span=axis.max-axis.min;var suffix=opts.twelveHourClock?" %p":"";var hourCode=opts.twelveHourClock?"%I":"%H";var fmt;if(t<timeUnitSize.minute){fmt=hourCode+":%M:%S"+suffix}else if(t<timeUnitSize.day){if(span<2*timeUnitSize.day){fmt=hourCode+":%M"+suffix}else{fmt="%b %d "+hourCode+":%M"+suffix}}else if(t<timeUnitSize.month){fmt="%b %d"}else if(useQuarters&&t<timeUnitSize.quarter||!useQuarters&&t<timeUnitSize.year){if(span<timeUnitSize.year){fmt="%b"}else{fmt="%b %Y"}}else if(useQuarters&&t<timeUnitSize.year){if(span<timeUnitSize.year){fmt="Q%q"}else{fmt="Q%q %Y"}}else{fmt="%Y"}var rt=formatDate(d,fmt,opts.monthNames,opts.dayNames);return rt}}})})}$.plot.plugins.push({init:init,options:options,name:"time",version:"1.0"});$.plot.formatDate=formatDate;$.plot.dateGenerator=dateGenerator})(jQuery);

/* Javascript plotting library for jQuery, version 0.8.3.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

*/
(function($){var options={crosshair:{mode:null,color:"rgba(170, 0, 0, 0.80)",lineWidth:1}};function init(plot){var crosshair={x:-1,y:-1,locked:false};plot.setCrosshair=function setCrosshair(pos){if(!pos)crosshair.x=-1;else{var o=plot.p2c(pos);crosshair.x=Math.max(0,Math.min(o.left,plot.width()));crosshair.y=Math.max(0,Math.min(o.top,plot.height()))}plot.triggerRedrawOverlay()};plot.clearCrosshair=plot.setCrosshair;plot.lockCrosshair=function lockCrosshair(pos){if(pos)plot.setCrosshair(pos);crosshair.locked=true};plot.unlockCrosshair=function unlockCrosshair(){crosshair.locked=false};function onMouseOut(e){if(crosshair.locked)return;if(crosshair.x!=-1){crosshair.x=-1;plot.triggerRedrawOverlay()}}function onMouseMove(e){if(crosshair.locked)return;if(plot.getSelection&&plot.getSelection()){crosshair.x=-1;return}var offset=plot.offset();crosshair.x=Math.max(0,Math.min(e.pageX-offset.left,plot.width()));crosshair.y=Math.max(0,Math.min(e.pageY-offset.top,plot.height()));plot.triggerRedrawOverlay()}plot.hooks.bindEvents.push(function(plot,eventHolder){if(!plot.getOptions().crosshair.mode)return;eventHolder.mouseout(onMouseOut);eventHolder.mousemove(onMouseMove)});plot.hooks.drawOverlay.push(function(plot,ctx){var c=plot.getOptions().crosshair;if(!c.mode)return;var plotOffset=plot.getPlotOffset();ctx.save();ctx.translate(plotOffset.left,plotOffset.top);if(crosshair.x!=-1){var adj=plot.getOptions().crosshair.lineWidth%2?.5:0;ctx.strokeStyle=c.color;ctx.lineWidth=c.lineWidth;ctx.lineJoin="round";ctx.beginPath();if(c.mode.indexOf("x")!=-1){var drawX=Math.floor(crosshair.x)+adj;ctx.moveTo(drawX,0);ctx.lineTo(drawX,plot.height())}if(c.mode.indexOf("y")!=-1){var drawY=Math.floor(crosshair.y)+adj;ctx.moveTo(0,drawY);ctx.lineTo(plot.width(),drawY)}ctx.stroke()}ctx.restore()});plot.hooks.shutdown.push(function(plot,eventHolder){eventHolder.unbind("mouseout",onMouseOut);eventHolder.unbind("mousemove",onMouseMove)})}$.plot.plugins.push({init:init,options:options,name:"crosshair",version:"1.0"})})(jQuery);

var sortable=function(){"use strict";function c(e,t,n){if(void 0===n)return e&&e.h5s&&e.h5s.data&&e.h5s.data[t];e.h5s=e.h5s||{},e.h5s.data=e.h5s.data||{},e.h5s.data[t]=n}var v=function(e,t){if(!(e instanceof NodeList||e instanceof HTMLCollection||e instanceof Array))throw new Error("You must provide a nodeList/HTMLCollection/Array of elements to be filtered.");return"string"!=typeof t?Array.from(e):Array.from(e).filter(function(e){return 1===e.nodeType&&e.matches(t)})},y=new Map,t=function(){function e(){this._config=new Map,this._placeholder=void 0,this._data=new Map}return Object.defineProperty(e.prototype,"config",{get:function(){var n={};return this._config.forEach(function(e,t){n[t]=e}),n},set:function(e){if("object"!=typeof e)throw new Error("You must provide a valid configuration object to the config setter.");var t=Object.assign({},e);this._config=new Map(Object.entries(t))},enumerable:!1,configurable:!0}),e.prototype.setConfig=function(e,t){if(!this._config.has(e))throw new Error("Trying to set invalid configuration item: "+e);this._config.set(e,t)},e.prototype.getConfig=function(e){if(!this._config.has(e))throw new Error("Invalid configuration item requested: "+e);return this._config.get(e)},Object.defineProperty(e.prototype,"placeholder",{get:function(){return this._placeholder},set:function(e){if(!(e instanceof HTMLElement)&&null!==e)throw new Error("A placeholder must be an html element or null.");this._placeholder=e},enumerable:!1,configurable:!0}),e.prototype.setData=function(e,t){if("string"!=typeof e)throw new Error("The key must be a string.");this._data.set(e,t)},e.prototype.getData=function(e){if("string"!=typeof e)throw new Error("The key must be a string.");return this._data.get(e)},e.prototype.deleteData=function(e){if("string"!=typeof e)throw new Error("The key must be a string.");return this._data.delete(e)},e}(),E=function(e){if(!(e instanceof HTMLElement))throw new Error("Please provide a sortable to the store function.");return y.has(e)||y.set(e,new t),y.get(e)};function i(e,t,n){if(e instanceof Array)for(var r=0;r<e.length;++r)i(e[r],t,n);else e.addEventListener(t,n),E(e).setData("event"+t,n)}function a(e,t){if(e instanceof Array)for(var n=0;n<e.length;++n)a(e[n],t);else e.removeEventListener(t,E(e).getData("event"+t)),E(e).deleteData("event"+t)}function l(e,t,n){if(e instanceof Array)for(var r=0;r<e.length;++r)l(e[r],t,n);else e.setAttribute(t,n)}function r(e,t){if(e instanceof Array)for(var n=0;n<e.length;++n)r(e[n],t);else e.removeAttribute(t)}var w=function(e){if(!e.parentElement||0===e.getClientRects().length)throw new Error("target element must be part of the dom");var t=e.getClientRects()[0];return{left:t.left+window.pageXOffset,right:t.right+window.pageXOffset,top:t.top+window.pageYOffset,bottom:t.bottom+window.pageYOffset}},d=function(n,r){var o;return void 0===r&&(r=0),function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];clearTimeout(o),o=setTimeout(function(){n.apply(void 0,e)},r)}},b=function(e,t){if(!(e instanceof HTMLElement&&(t instanceof NodeList||t instanceof HTMLCollection||t instanceof Array)))throw new Error("You must provide an element and a list of elements.");return Array.from(t).indexOf(e)},f=function(e){if(!(e instanceof HTMLElement))throw new Error("Element is not a node element.");return null!==e.parentNode},n=function(e,t,n){if(!(e instanceof HTMLElement&&e.parentElement instanceof HTMLElement))throw new Error("target and element must be a node");e.parentElement.insertBefore(t,"before"===n?e:e.nextElementSibling)},T=function(e,t){return n(e,t,"before")},C=function(e,t){return n(e,t,"after")},o=function(t,n,e){if(void 0===n&&(n=function(e,t){return e}),void 0===e&&(e=function(e){return e}),!(t instanceof HTMLElement)||!0==!t.isSortable)throw new Error("You need to provide a sortableContainer to be serialized.");if("function"!=typeof n||"function"!=typeof e)throw new Error("You need to provide a valid serializer for items and the container.");var r=c(t,"opts").items,o=v(t.children,r),a=o.map(function(e){return{parent:t,node:e,html:e.outerHTML,index:b(e,o)}});return{container:e({node:t,itemCount:a.length}),items:a.map(function(e){return n(e,t)})}},u=function(e,t,n){var r;if(void 0===n&&(n="sortable-placeholder"),!(e instanceof HTMLElement))throw new Error("You must provide a valid element as a sortable.");if(!(t instanceof HTMLElement)&&void 0!==t)throw new Error("You must provide a valid element as a placeholder or set ot to undefined.");return void 0===t&&(["UL","OL"].includes(e.tagName)?t=document.createElement("li"):["TABLE","TBODY"].includes(e.tagName)?(t=document.createElement("tr")).innerHTML='<td colspan="100"></td>':t=document.createElement("div")),"string"==typeof n&&(r=t.classList).add.apply(r,n.split(" ")),t},L=function(e){if(!(e instanceof HTMLElement))throw new Error("You must provide a valid dom element");var n=window.getComputedStyle(e);return"border-box"===n.getPropertyValue("box-sizing")?parseInt(n.getPropertyValue("height"),10):["height","padding-top","padding-bottom"].map(function(e){var t=parseInt(n.getPropertyValue(e),10);return isNaN(t)?0:t}).reduce(function(e,t){return e+t})},x=function(e){if(!(e instanceof HTMLElement))throw new Error("You must provide a valid dom element");var n=window.getComputedStyle(e);return["width","padding-left","padding-right"].map(function(e){var t=parseInt(n.getPropertyValue(e),10);return isNaN(t)?0:t}).reduce(function(e,t){return e+t})},s=function(e,t){if(!(e instanceof Array))throw new Error("You must provide a Array of HTMLElements to be filtered.");return"string"!=typeof t?e:e.filter(function(e){return e.querySelector(t)instanceof HTMLElement||e.shadowRoot&&e.shadowRoot.querySelector(t)instanceof HTMLElement}).map(function(e){return e.querySelector(t)||e.shadowRoot&&e.shadowRoot.querySelector(t)})},p=function(e){return e.composedPath&&e.composedPath()[0]||e.target},m=function(e,t,n){return{element:e,posX:n.pageX-t.left,posY:n.pageY-t.top}},g=function(e,t,n){if(!(e instanceof Event))throw new Error("setDragImage requires a DragEvent as the first argument.");if(!(t instanceof HTMLElement))throw new Error("setDragImage requires the dragged element as the second argument.");if(n||(n=m),e.dataTransfer&&e.dataTransfer.setDragImage){var r=n(t,w(t),e);if(!(r.element instanceof HTMLElement)||"number"!=typeof r.posX||"number"!=typeof r.posY)throw new Error("The customDragImage function you provided must return and object with the properties element[string], posX[integer], posY[integer].");e.dataTransfer.effectAllowed="copyMove",e.dataTransfer.setData("text/plain",p(e).id),e.dataTransfer.setDragImage(r.element,r.posX,r.posY)}},M=function(e,t){if(!0===e.isSortable){var n=E(e).getConfig("acceptFrom");if(null!==n&&!1!==n&&"string"!=typeof n)throw new Error('HTML5Sortable: Wrong argument, "acceptFrom" must be "null", "false", or a valid selector string.');if(null!==n)return!1!==n&&0<n.split(",").filter(function(e){return 0<e.length&&t.matches(e)}).length;if(e===t)return!0;if(void 0!==E(e).getConfig("connectWith")&&null!==E(e).getConfig("connectWith"))return E(e).getConfig("connectWith")===E(t).getConfig("connectWith")}return!1},D={items:null,connectWith:null,disableIEFix:null,acceptFrom:null,copy:!1,placeholder:null,placeholderClass:"sortable-placeholder",draggingClass:"sortable-dragging",hoverClass:!1,dropTargetContainerClass:!1,debounce:0,throttleTime:100,maxItems:0,itemSerializer:void 0,containerSerializer:void 0,customDragImage:null,orientation:"vertical"};var H,I,A,S,Y,_,O,P,z,h=function(e,t){if("string"==typeof E(e).getConfig("hoverClass")){var o=E(e).getConfig("hoverClass").split(" ");!0===t?(i(e,"mousemove",function(r,o){var a=this;if(void 0===o&&(o=250),"function"!=typeof r)throw new Error("You must provide a function as the first argument for throttle.");if("number"!=typeof o)throw new Error("You must provide a number as the second argument for throttle.");var i=null;return function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];var n=Date.now();(null===i||o<=n-i)&&(i=n,r.apply(a,e))}}(function(r){0===r.buttons&&v(e.children,E(e).getConfig("items")).forEach(function(e){var t,n;e===r.target||e.contains(r.target)?(t=e.classList).add.apply(t,o):(n=e.classList).remove.apply(n,o)})},E(e).getConfig("throttleTime"))),i(e,"mouseleave",function(){v(e.children,E(e).getConfig("items")).forEach(function(e){var t;(t=e.classList).remove.apply(t,o)})})):(a(e,"mousemove"),a(e,"mouseleave"))}},N=function(e){a(e,"dragstart"),a(e,"dragend"),a(e,"dragover"),a(e,"dragenter"),a(e,"drop"),a(e,"mouseenter"),a(e,"mouseleave")},W=function(e,t){e&&a(e,"dragleave"),t&&t!==e&&a(t,"dragleave")},j=function(e,t){var n=e;return!0===E(t).getConfig("copy")&&(l(n=e.cloneNode(!0),"aria-copied","true"),e.parentElement.appendChild(n),n.style.display="none",n.oldDisplay=e.style.display),n},F=function(e){var t;(t=e).h5s&&delete t.h5s.data,r(e,"aria-dropeffect")},q=function(e){r(e,"aria-grabbed"),r(e,"aria-copied"),r(e,"draggable"),r(e,"role")};function R(e,t){if(t.composedPath)return t.composedPath().find(function(e){return e.isSortable});for(;!0!==e.isSortable;)e=e.parentElement;return e}function X(e,t){var n=c(e,"opts"),r=v(e.children,n.items).filter(function(e){return e.contains(t)||e.shadowRoot&&e.shadowRoot.contains(t)});return 0<r.length?r[0]:t}var B=function(e){var t=c(e,"opts"),n=v(e.children,t.items),r=s(n,t.handle);(l(e,"aria-dropeffect","move"),c(e,"_disabled","false"),l(r,"draggable","true"),h(e,!0),!1===t.disableIEFix)&&("function"==typeof(document||window.document).createElement("span").dragDrop&&i(r,"mousedown",function(){if(-1!==n.indexOf(this))this.dragDrop();else{for(var e=this.parentElement;-1===n.indexOf(e);)e=e.parentElement;e.dragDrop()}}))},k=function(e){var t=c(e,"opts"),n=v(e.children,t.items),r=s(n,t.handle);c(e,"_disabled","false"),N(n),W(S,P),a(r,"mousedown"),a(e,"dragover"),a(e,"dragenter"),a(e,"drop")};function U(e,h){var a=String(h);return h=h||{},"string"==typeof e&&(e=document.querySelectorAll(e)),e instanceof HTMLElement&&(e=[e]),e=Array.prototype.slice.call(e),/serialize/.test(a)?e.map(function(e){var t=c(e,"opts");return o(e,t.itemSerializer,t.containerSerializer)}):(e.forEach(function(s){if(/enable|disable|destroy/.test(a))return U[a](s);["connectWith","disableIEFix"].forEach(function(e){Object.prototype.hasOwnProperty.call(h,e)&&null!==h[e]&&console.warn('HTML5Sortable: You are using the deprecated configuration "'+e+'". This will be removed in an upcoming version, make sure to migrate to the new options when updating.')}),h=Object.assign({},D,E(s).config,h),E(s).config=h,c(s,"opts",h),s.isSortable=!0,k(s);var e,t=v(s.children,h.items);if(null!==h.placeholder&&void 0!==h.placeholder){var n=document.createElement(s.tagName);h.placeholder instanceof HTMLElement?n.appendChild(h.placeholder):n.innerHTML=h.placeholder,e=n.children[0]}E(s).placeholder=u(s,e,h.placeholderClass),c(s,"items",h.items),h.acceptFrom?c(s,"acceptFrom",h.acceptFrom):h.connectWith&&c(s,"connectWith",h.connectWith),B(s),l(t,"role","option"),l(t,"aria-grabbed","false"),i(s,"dragstart",function(e){var t=p(e);if(!0!==t.isSortable&&(e.stopImmediatePropagation(),(!h.handle||t.matches(h.handle))&&"false"!==t.getAttribute("draggable"))){var n=R(t,e),r=X(n,t);O=v(n.children,h.items),Y=O.indexOf(r),_=b(r,n.children),S=n,g(e,r,h.customDragImage),I=L(r),A=x(r),r.classList.add(h.draggingClass),l(H=j(r,n),"aria-grabbed","true"),n.dispatchEvent(new CustomEvent("sortstart",{detail:{origin:{elementIndex:_,index:Y,container:S},item:H,originalTarget:t}}))}}),i(s,"dragenter",function(e){var n=p(e),r=R(n,e);r&&r!==P&&(z=v(r.children,c(r,"items")).filter(function(e){return e!==E(s).placeholder}),h.dropTargetContainerClass&&r.classList.add(h.dropTargetContainerClass),r.dispatchEvent(new CustomEvent("sortenter",{detail:{origin:{elementIndex:_,index:Y,container:S},destination:{container:r,itemsBeforeUpdate:z},item:H,originalTarget:n}})),i(r,"dragleave",function(e){var t=e.relatedTarget||e.fromElement;e.currentTarget.contains(t)||(h.dropTargetContainerClass&&r.classList.remove(h.dropTargetContainerClass),r.dispatchEvent(new CustomEvent("sortleave",{detail:{origin:{elementIndex:_,index:Y,container:r},item:H,originalTarget:n}})))})),P=r}),i(s,"dragend",function(e){if(H){H.classList.remove(h.draggingClass),l(H,"aria-grabbed","false"),"true"===H.getAttribute("aria-copied")&&"true"!==c(H,"dropped")&&H.remove(),H.style.display=H.oldDisplay,delete H.oldDisplay;var t=Array.from(y.values()).map(function(e){return e.placeholder}).filter(function(e){return e instanceof HTMLElement}).filter(f)[0];t&&t.remove(),s.dispatchEvent(new CustomEvent("sortstop",{detail:{origin:{elementIndex:_,index:Y,container:S},item:H}})),A=I=H=P=null}}),i(s,"drop",function(e){if(M(s,H.parentElement)){e.preventDefault(),e.stopPropagation(),c(H,"dropped","true");var t=Array.from(y.values()).map(function(e){return e.placeholder}).filter(function(e){return e instanceof HTMLElement}).filter(f)[0];C(t,H),t.remove(),s.dispatchEvent(new CustomEvent("sortstop",{detail:{origin:{elementIndex:_,index:Y,container:S},item:H}}));var n=E(s).placeholder,r=v(S.children,h.items).filter(function(e){return e!==n}),o=!0===this.isSortable?this:this.parentElement,a=v(o.children,c(o,"items")).filter(function(e){return e!==n}),i=b(H,Array.from(H.parentElement.children).filter(function(e){return e!==n})),l=b(H,a);h.dropTargetContainerClass&&o.classList.remove(h.dropTargetContainerClass),_===i&&S===o||s.dispatchEvent(new CustomEvent("sortupdate",{detail:{origin:{elementIndex:_,index:Y,container:S,itemsBeforeUpdate:O,items:r},destination:{index:l,elementIndex:i,container:o,itemsBeforeUpdate:z,items:a},item:H}}))}});var o=d(function(t,e,n,r){if(H)if(h.forcePlaceholderSize&&(E(t).placeholder.style.height=I+"px",E(t).placeholder.style.width=A+"px"),-1<Array.from(t.children).indexOf(e)){var o=L(e),a=x(e),i=b(E(t).placeholder,e.parentElement.children),l=b(e,e.parentElement.children);if(I<o||A<a){var s=o-I,c=a-A,d=w(e).top,f=w(e).left;if(i<l&&("vertical"===h.orientation&&r<d||"horizontal"===h.orientation&&n<f))return;if(l<i&&("vertical"===h.orientation&&d+o-s<r||"horizontal"===h.orientation&&f+a-c<n))return}void 0===H.oldDisplay&&(H.oldDisplay=H.style.display),"none"!==H.style.display&&(H.style.display="none");var u=!1;try{var p=w(e).top+e.offsetHeight/2,m=w(e).left+e.offsetWidth/2;u="vertical"===h.orientation&&p<=r||"horizontal"===h.orientation&&m<=n}catch(e){u=i<l}u?C(e,E(t).placeholder):T(e,E(t).placeholder),Array.from(y.values()).filter(function(e){return void 0!==e.placeholder}).forEach(function(e){e.placeholder!==E(t).placeholder&&e.placeholder.remove()})}else{var g=Array.from(y.values()).filter(function(e){return void 0!==e.placeholder}).map(function(e){return e.placeholder});-1!==g.indexOf(e)||t!==e||v(e.children,h.items).length||(g.forEach(function(e){return e.remove()}),e.appendChild(E(t).placeholder))}},h.debounce),r=function(e){var t=e.target,n=!0===t.isSortable?t:R(t,e);if(t=X(n,t),H&&M(n,H.parentElement)&&"true"!==c(n,"_disabled")){var r=c(n,"opts");parseInt(r.maxItems)&&v(n.children,c(n,"items")).length>=parseInt(r.maxItems)&&H.parentElement!==n||(e.preventDefault(),e.stopPropagation(),e.dataTransfer.dropEffect=!0===E(n).getConfig("copy")?"copy":"move",o(n,t,e.pageX,e.pageY))}};i(t.concat(s),"dragover",r),i(t.concat(s),"dragenter",r)}),e)}return U.destroy=function(e){var t,n,r,o;n=c(t=e,"opts")||{},r=v(t.children,n.items),o=s(r,n.handle),h(t,!1),a(t,"dragover"),a(t,"dragenter"),a(t,"dragstart"),a(t,"dragend"),a(t,"drop"),F(t),a(o,"mousedown"),N(r),q(r),W(S,P),t.isSortable=!1},U.enable=function(e){B(e)},U.disable=function(e){var t,n,r,o;n=c(t=e,"opts"),r=v(t.children,n.items),o=s(r,n.handle),l(t,"aria-dropeffect","none"),c(t,"_disabled","true"),l(o,"draggable","false"),a(o,"mousedown"),h(t,!1)},U.__testing={data:c,removeItemEvents:N,removeItemData:q,removeSortableData:F,removeContainerEvents:W},U}();


/*
    Livesearch adapted to remove jquery 3.6 deprecations, originally from:

	jQuery live search plugin
	Version 1.0 (05/20/2009)

	Author: Jeremy Herrman (jeremy@jherrman.com)

	Dual licensed under the MIT and GPL licenses:
	http://www.opensource.org/licenses/mit-license.php
	http://www.gnu.org/licenses/gpl.html
*/

(function($) {
	var LiveSearch = function(element, opts)
	{
		element = $(element);
		var obj = this;
		var settings = $.extend({}, $.fn.livesearch.defaults, opts);

		var timer = undefined;
		var prevSearchTerm = element.val();

		element.empty();

		element.on('keyup', function() {
			// have a timer that gets canceled if a key is pressed before it executes
			if(timer != undefined) {
				clearTimeout(timer);
			}
			timer = setTimeout(DoSearch, settings.queryDelay);
		});

		this.DoSearch = DoSearch;
		function DoSearch() {
			var searchTerm = element.val();
			if(searchTerm != prevSearchTerm) {
				prevSearchTerm = searchTerm;
				if(searchTerm.length >= settings.minimumSearchLength) {
					DisplayResults(searchTerm);
				}
				else if(searchTerm.length == 0) {
					DisplayResults('');
				}
			}
		};

		function DisplayResults(searchTerm) {
			timer = undefined;
			settings.searchCallback(searchTerm);
		};

		if (element.val() == '' || element.val() == settings.innerText) {
			disableSearch();
		}
		else {
			enableSearch();
		}

		element.on('focus', function() {
			if (element.hasClass('inactive_search')) { enableSearch(); }
		});

		element.on('blur', function() {
			if (element.val() == '') { disableSearch(); }
		});

		function enableSearch() {
			element.addClass('active_search');
			element.removeClass('inactive_search');
			element.val('');
		};

		function disableSearch() {
			element.addClass('inactive_search');
			element.removeClass('active_search');
			element.val(settings.innerText);
		};
	};

	$.fn.livesearch = function(options) {
		this.each(function() {
			var element = $(this);

			// Return early if this element already has a plugin instance
			if (element.data('livesearch')) return;

			// pass options to plugin constructor
			var livesearch = new LiveSearch(this, options);

			// Store plugin object in this element's data
			element.data('livesearch', livesearch);
		});
	};

	$.fn.livesearch.defaults = {
		queryDelay: 250,
		innerText: 'Search',
		minimumSearchLength: 3
	};

})(jQuery);


// original consent JS code from https://github.com/insites/cookieconsent
// with modifications by PCPartPicker
// 
// The MIT License (MIT)
//
// Copyright (c) 2016 Silktide Ltd
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

function _init_consent_dialog() {
  var cc = {};
  
  var util = {
    // http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
    escapeRegExp: function(str) {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    },

    hasClass: function(element, selector) {
      var s = ' ';
      return element.nodeType === 1 &&
        (s + element.className + s).replace(/[\n\t]/g, s).indexOf(s + selector + s) >= 0;
    },

    addClass: function(element, className) {
      element.className += ' ' + className;
    },

    removeClass: function(element, className) {
      var regex = new RegExp('\\b' + this.escapeRegExp(className) + '\\b');
      element.className = element.className.replace(regex, '');
    },

    interpolateString: function(str, callback) {
      var marker = /{{([a-z][a-z0-9\-_]*)}}/ig;
      return str.replace(marker, function(matches) {
        return callback(arguments[1]) || '';
      })
    },

    getCookie: function(name) {
      var value = '; ' + document.cookie;
      var parts = value.split('; ' + name + '=');
      return parts.length != 2 ?
        undefined : parts.pop().split(';').shift();
    },

    setCookie: function(name, value, expiryDays, domain, path) {
      var exdate = new Date();
      exdate.setDate(exdate.getDate() + (expiryDays || 365));

      var cookie = [
        name + '=' + value,
        'expires=' + exdate.toUTCString(),
        'path=' + (path || '/')
      ];

      if (domain) {
        cookie.push('domain=' + domain);
      }
      document.cookie = cookie.join(';');
    },

    // only used for extending the initial options
    deepExtend: function(target, source) {
      for (var prop in source) {
        if (source.hasOwnProperty(prop)) {
          if (prop in target && this.isPlainObject(target[prop]) && this.isPlainObject(source[prop])) {
            this.deepExtend(target[prop], source[prop]);
          } else {
            target[prop] = source[prop];
          }
        }
      }
      return target;
    },

    // only used for throttling the 'mousemove' event (used for animating the revoke button when `animateRevokable` is true)
    throttle: function(callback, limit) {
      var wait = false;
      return function() {
        if (!wait) {
          callback.apply(this, arguments);
          wait = true;
          setTimeout(function() {
            wait = false;
          }, limit);
        }
      }
    },

    // only used for hashing json objects (used for hash mapping palette objects, used when custom colours are passed through JavaScript)
    hash: function(str) {
      var hash = 0,
        i, chr, len;
      if (str.length === 0) return hash;
      for (i = 0, len = str.length; i < len; ++i) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
      }
      return hash;
    },

    normaliseHex: function(hex) {
      if (hex[0] == '#') {
        hex = hex.substr(1);
      }
      if (hex.length == 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      return hex;
    },

    // used to get text colors if not set
    getContrast: function(hex) {
      hex = this.normaliseHex(hex);
      var r = parseInt(hex.substr(0, 2), 16);
      var g = parseInt(hex.substr(2, 2), 16);
      var b = parseInt(hex.substr(4, 2), 16);
      var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
      return (yiq >= 128) ? '#000' : '#fff';
    },

    // used to change color on highlight
    getLuminance: function(hex) {
      var num = parseInt(this.normaliseHex(hex), 16), 
          amt = 38,
          R = (num >> 16) + amt,
          B = (num >> 8 & 0x00FF) + amt,
          G = (num & 0x0000FF) + amt;
      var newColour = (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255)).toString(16).slice(1);
      return '#'+newColour;
    },

    isMobile: function() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    isPlainObject: function(obj) {
      // The code "typeof obj === 'object' && obj !== null" allows Array objects
      return typeof obj === 'object' && obj !== null && obj.constructor == Object;
    },
  };

  // valid cookie values
  cc.status = {
    deny: 'deny',
    allow: 'allow',
    dismiss: 'dismiss'
  };

  // detects the `transitionend` event name
  cc.transitionEnd = (function() {
    var el = document.createElement('div');
    var trans = {
      t: "transitionend",
      OT: "oTransitionEnd",
      msT: "MSTransitionEnd",
      MozT: "transitionend",
      WebkitT: "webkitTransitionEnd",
    };

    for (var prefix in trans) {
      if (trans.hasOwnProperty(prefix) && typeof el.style[prefix + 'ransition'] != 'undefined') {
        return trans[prefix];
      }
    }
    return '';
  }());

  cc.hasTransition = !!cc.transitionEnd;

  // array of valid regexp escaped statuses
  var __allowedStatuses = Object.keys(cc.status).map(util.escapeRegExp);

  // contains references to the custom <style> tags
  cc.customStyles = {};

  cc.Popup = (function() {

    var defaultOptions = {

      // if false, this prevents the popup from showing (useful for giving to control to another piece of code)
      enabled: true,

      // optional (expecting a HTML element) if passed, the popup is appended to this element. default is `document.body`
      container: null,

      // defaults cookie options - it is RECOMMENDED to set these values to correspond with your server
      cookie: {
        // This is the name of this cookie - you can ignore this
        name: 'cookieconsent_status',

        // This is the url path that the cookie 'name' belongs to. The cookie can only be read at this location
        path: '/',

        // This is the domain that the cookie 'name' belongs to. The cookie can only be read on this domain.
        //  - Guide to cookie domains - http://erik.io/blog/2014/03/04/definitive-guide-to-cookie-domains/
        domain: '',

        // The cookies expire date, specified in days (specify -1 for no expiry)
        expiryDays: 365,
      },

      // these callback hooks are called at certain points in the program execution
      onPopupOpen: function() {},
      onPopupClose: function() {},
      onInitialise: function(status) {},
      onStatusChange: function(status, chosenBefore) {},
      onRevokeChoice: function() {},

      // each item defines the inner text for the element that it references
      content: {
        header: 'Cookies used on the website!',
        message: 'This website uses cookies to ensure you get the best experience on our website.',
        dismiss: 'Got it!',
        allow: 'Allow cookies',
        deny: 'Decline',
        link: 'Learn more',
        href: 'http://cookiesandyou.com',
        desc_tag: 'nil',
        close: '&#x274c;'
      },

      // This is the HTML for the elements above. The string {{header}} will be replaced with the equivalent text below.
      // You can remove "{{header}}" and write the content directly inside the HTML if you want.
      //
      //  - ARIA rules suggest to ensure controls are tabbable (so the browser can find the first control),
      //    and to set the focus to the first interactive control (http://w3c.github.io/aria-in-html/)
      elements: {
        header: '<span class="cc-header">{{header}}</span>&nbsp;',
        message: '<span id="cookieconsent:desc_{{desc_tag}}" class="cc-message">{{message}}</span>',
        messagelink: '<span id="cookieconsent:desc_{{desc_tag}}" class="cc-message">{{message}} <a aria-label="learn more about cookies" role=button tabindex="0" class="cc-link" href="{{href}}" rel="noopener noreferrer nofollow" target="_blank">{{link}}</a></span>',
        dismiss: '<a aria-label="dismiss cookie message" role=button tabindex="0" class="cc-btn cc-dismiss">{{dismiss}}</a>',
        allow: '<a aria-label="allow cookies" role=button tabindex="0"  class="cc-btn cc-allow">{{allow}}</a>',
        deny: '<a aria-label="deny cookies" role=button tabindex="0" class="cc-btn cc-deny">{{deny}}</a>',
        link: '<a aria-label="learn more about cookies" role=button tabindex="0" class="cc-link" href="{{href}}" target="_blank">{{link}}</a>',
        close: '<span aria-label="dismiss cookie message" role=button tabindex="0" class="cc-close">{{close}}</span>',

        //compliance: compliance is also an element, but it is generated by the application, depending on `type` below
      },

      // The placeholders {{classes}} and {{children}} both get replaced during initialisation:
      //  - {{classes}} is where additional classes get added
      //  - {{children}} is where the HTML children are placed
      window: '<div role="dialog" aria-live="polite" aria-label="cookieconsent" aria-describedby="cookieconsent:desc_{{desc_tag}}" class="cc-window {{classes}}"><!--googleoff: all-->{{children}}<!--googleon: all--></div>',

      // This is the html for the revoke button. This only shows up after the user has selected their level of consent
      // It can be enabled of disabled using the `revokable` option
      revokeBtn: '<div class="cc-revoke {{classes}}">Cookie Policy</div>',

      // define types of 'compliance' here. '{{value}}' strings in here are linked to `elements`
      compliance: {
        'info': '<div class="cc-compliance">{{dismiss}}</div>',
        'opt-in': '<div class="cc-compliance cc-highlight">{{dismiss}}{{allow}}</div>',
        'opt-out': '<div class="cc-compliance cc-highlight">{{deny}}{{dismiss}}</div>',
      },

      // select your type of popup here
      type: 'info', // refers to `compliance` (in other words, the buttons that are displayed)

      // define layout layouts here
      layouts: {
        // the 'block' layout tend to be for square floating popups
        'basic': '{{messagelink}}{{compliance}}',
        'basic-close': '{{messagelink}}{{compliance}}{{close}}',
        'basic-header': '{{header}}{{message}}{{link}}{{compliance}}',

        // add a custom layout here, then add some new css with the class '.cc-layout-my-cool-layout'
        //'my-cool-layout': '<div class="my-special-layout">{{message}}{{compliance}}</div>{{close}}',
      },

      // default layout (see above)
      layout: 'basic',

      // this refers to the popup windows position. we currently support:
      //  - banner positions: top, bottom
      //  - floating positions: top-left, top-right, bottom-left, bottom-right
      //
      // adds a class `cc-floating` or `cc-banner` which helps when styling
      position: 'bottom', // default position is 'bottom'

      // Available styles
      //    -block (default, no extra classes)
      //    -edgeless
      //    -classic
      // use your own style name and use `.cc-theme-STYLENAME` class in CSS to edit.
      // Note: style "wire" is used for the configurator, but has no CSS styles of its own, only palette is used.
      theme: 'block',

      // The popup is `fixed` by default, but if you want it to be static (inline with the page content), set this to false
      // Note: by default, we animate the height of the popup from 0 to full size
      static: false,

      // if you want custom colours, pass them in here. this object should look like this.
      // ideally, any custom colours/themes should be created in a separate style sheet, as this is more efficient.
      //   {
      //     popup: {background: '#000000', text: '#fff', link: '#fff'},
      //     button: {background: 'transparent', border: '#f8e71c', text: '#f8e71c'},
      //     highlight: {background: '#f8e71c', border: '#f8e71c', text: '#000000'},
      //   }
      // `highlight` is optional and extends `button`. if it exists, it will apply to the first button
      // only background needs to be defined for every element. if not set, other colors can be calculated from it
      palette: null,

      // Some countries REQUIRE that a user can change their mind. You can configure this yourself.
      // Most of the time this should be false, but the `cookieconsent.law` can change this to `true` if it detects that it should
      revokable: false,

      // if true, the revokable button will tranlate in and out
      animateRevokable: true,

      // used to disable link on existing layouts
      // replaces element messagelink with message and removes content of link
      showLink: true,

      // set value as scroll range to enable
      dismissOnScroll: false,

      // set value as time in milliseconds to autodismiss after set time
      dismissOnTimeout: false,

      // The application automatically decide whether the popup should open.
      // Set this to false to prevent this from happening and to allow you to control the behaviour yourself
      autoOpen: true,

      // By default the created HTML is automatically appended to the container (which defaults to <body>). You can prevent this behaviour
      // by setting this to false, but if you do, you must attach the `element` yourself, which is a public property of the popup instance:
      // 
      //     var instance = cookieconsent.factory(options);
      //     document.body.appendChild(instance.element);
      //
      autoAttach: true,

      // If this is defined, then it is used as the inner html instead of layout. This allows for ultimate customisation.
      // Be sure to use the classes `cc-btn` and `cc-allow`, `cc-deny` or `cc-dismiss`. They enable the app to register click
      // handlers. You can use other pre-existing classes too. See `src/styles` folder.
      overrideHTML: null,
    };

    function CookiePopup() {
      this.initialise.apply(this, arguments);
    }

    CookiePopup.prototype.initialise = function(options) {
      if (this.options) {
        this.destroy(); // already rendered
      }

      // set options back to default options
      util.deepExtend(this.options = {}, defaultOptions);

      // merge in user options
      if (util.isPlainObject(options)) {
        util.deepExtend(this.options, options);
      }

      // returns true if `onComplete` was called
      if (checkCallbackHooks.call(this)) {
        // user has already answered
        this.options.enabled = false;
      }

      // the full markup either contains the wrapper or it does not (for multiple instances)
      var cookiePopup = this.options.window
        .replace('{{classes}}', getPopupClasses.call(this).join(' '))
        .replace('{{children}}', getPopupInnerMarkup.call(this));

      // if user passes html, use it instead
      var customHTML = this.options.overrideHTML;
      if (typeof customHTML == 'string' && customHTML.length) {
        cookiePopup = customHTML;
      }

      // if static, we need to grow the element from 0 height so it doesn't jump the page
      // content. we wrap an element around it which will mask the hidden content
      if (this.options.static) {
        // `grower` is a wrapper div with a hidden overflow whose height is animated
        var wrapper = appendMarkup.call(this, '<div class="cc-grower">' + cookiePopup + '</div>');

        wrapper.style.display = ''; // set it to visible (because appendMarkup hides it)
        this.element = wrapper.firstChild; // get the `element` reference from the wrapper
        this.element.style.display = 'none';
        util.addClass(this.element, 'cc-invisible');
      } else {
        this.element = appendMarkup.call(this, cookiePopup);
      }

      applyAutoDismiss.call(this);

      applyRevokeButton.call(this);

      if (this.options.autoOpen) {
        this.autoOpen();
      }
    };

    CookiePopup.prototype.destroy = function() {
      if (this.onButtonClick && this.element) {
        this.element.removeEventListener('click', this.onButtonClick);
        this.onButtonClick = null;
      }

      if (this.dismissTimeout) {
        clearTimeout(this.dismissTimeout);
        this.dismissTimeout = null;
      }

      if (this.onWindowScroll) {
        window.removeEventListener('scroll', this.onWindowScroll);
        this.onWindowScroll = null;
      }

      if (this.onMouseMove) {
        window.removeEventListener('mousemove', this.onMouseMove);
        this.onMouseMove = null;
      }

      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.element = null;

      if (this.revokeBtn && this.revokeBtn.parentNode) {
        this.revokeBtn.parentNode.removeChild(this.revokeBtn);
      }
      this.revokeBtn = null;

      removeCustomStyle(this.options.palette);
      this.options = null;
    };

    CookiePopup.prototype.open = function(callback) {
      if (!this.element) return;

      if (!this.isOpen()) {
        if (cc.hasTransition) {
          this.fadeIn();
        } else {
          this.element.style.display = '';
        }

        if (this.options.revokable) {
          this.toggleRevokeButton();
        }
        this.options.onPopupOpen.call(this);
      }

      return this;
    };

    CookiePopup.prototype.close = function(showRevoke) {
      if (!this.element) return;

      if (this.isOpen()) {
        if (cc.hasTransition) {
          this.fadeOut();
        } else {
          this.element.style.display = 'none';
        }

        if (showRevoke && this.options.revokable) {
          this.toggleRevokeButton(true);
        }
        this.options.onPopupClose.call(this);
      }

      return this;
    };

    CookiePopup.prototype.fadeIn = function() {
      var el = this.element;

      if (!cc.hasTransition || !el)
        return;

      // This should always be called AFTER fadeOut (which is governed by the 'transitionend' event).
      // 'transitionend' isn't all that reliable, so, if we try and fadeIn before 'transitionend' has
      // has a chance to run, then we run it ourselves
      if (this.afterTransition) {
        afterFadeOut.call(this, el)
      }

      if (util.hasClass(el, 'cc-invisible')) {
        el.style.display = '';

        if (this.options.static) {
          var height = this.element.clientHeight;
          this.element.parentNode.style.maxHeight = height + 'px';
        }

        var fadeInTimeout = 20; // (ms) DO NOT MAKE THIS VALUE SMALLER. See below

        // Although most browsers can handle values less than 20ms, it should remain above this value.
        // This is because we are waiting for a "browser redraw" before we remove the 'cc-invisible' class.
        // If the class is remvoed before a redraw could happen, then the fadeIn effect WILL NOT work, and
        // the popup will appear from nothing. Therefore we MUST allow enough time for the browser to do
        // its thing. The actually difference between using 0 and 20 in a set timeout is neglegible anyway
        this.openingTimeout = setTimeout(afterFadeIn.bind(this, el), fadeInTimeout);
      }
    };

    CookiePopup.prototype.fadeOut = function() {
      var el = this.element;

      if (!cc.hasTransition || !el)
        return;

      if (this.openingTimeout) {
        clearTimeout(this.openingTimeout);
        afterFadeIn.bind(this, el);
      }

      if (!util.hasClass(el, 'cc-invisible')) {
        if (this.options.static) {
          this.element.parentNode.style.maxHeight = '';
        }

        this.afterTransition = afterFadeOut.bind(this, el);
        el.addEventListener(cc.transitionEnd, this.afterTransition);

        util.addClass(el, 'cc-invisible');
      }
    };

    CookiePopup.prototype.isOpen = function() {
      return this.element && this.element.style.display == '' && (cc.hasTransition ? !util.hasClass(this.element, 'cc-invisible') : true);
    };

    CookiePopup.prototype.toggleRevokeButton = function(show) {
      if (this.revokeBtn) this.revokeBtn.style.display = show ? '' : 'none';
    };

    CookiePopup.prototype.revokeChoice = function(preventOpen) {
      this.options.enabled = true;
      this.clearStatus();

      this.options.onRevokeChoice.call(this);

      if (!preventOpen) {
        this.autoOpen();
      }
    };

    // returns true if the cookie has a valid value
    CookiePopup.prototype.hasAnswered = function(options) {
      return Object.keys(cc.status).indexOf(this.getStatus()) >= 0;
    };

    // returns true if the cookie indicates that consent has been given
    CookiePopup.prototype.hasConsented = function(options) {
      var val = this.getStatus();
      return val == cc.status.allow || val == cc.status.dismiss;
    };

    // opens the popup if no answer has been given
    CookiePopup.prototype.autoOpen = function(options) {
      !this.hasAnswered() && this.options.enabled && this.open();
    };

    CookiePopup.prototype.setStatus = function(status) {
      var c = this.options.cookie;
      var value = util.getCookie(c.name);
      var chosenBefore = Object.keys(cc.status).indexOf(value) >= 0;

      // if `status` is valid
      if (Object.keys(cc.status).indexOf(status) >= 0) {
        util.setCookie(c.name, status, c.expiryDays, c.domain, c.path);

        this.options.onStatusChange.call(this, status, chosenBefore);
      } else {
        this.clearStatus();
      }
    };

    CookiePopup.prototype.getStatus = function() {
      return util.getCookie(this.options.cookie.name);
    };

    CookiePopup.prototype.clearStatus = function() {
      var c = this.options.cookie;
      util.setCookie(c.name, '', -1, c.domain, c.path);
    };

    // This needs to be called after 'fadeIn'. This is the code that actually causes the fadeIn to work
    // There is a good reason why it's called in a timeout. Read 'fadeIn';
    function afterFadeIn(el) {
      this.openingTimeout = null;
      util.removeClass(el, 'cc-invisible');
    }

    // This is called on 'transitionend' (only on the transition of the fadeOut). That's because after we've faded out, we need to
    // set the display to 'none' (so there aren't annoying invisible popups all over the page). If for whenever reason this function
    // is not called (lack of support), the open/close mechanism will still work.
    function afterFadeOut(el) {
      el.style.display = 'none'; // after close and before open, the display should be none
      el.removeEventListener(cc.transitionEnd, this.afterTransition);
      this.afterTransition = null;
    }

    // this function calls the `onComplete` hook and returns true (if needed) and returns false otherwise
    function checkCallbackHooks() {
      var complete = this.options.onInitialise.bind(this);

      if (!window.navigator.cookieEnabled) {
        complete(cc.status.deny);
        return true;
      }

      if (window.CookiesOK || window.navigator.CookiesOK) {
        complete(cc.status.allow);
        return true;
      }

      var allowed = Object.keys(cc.status);
      var answer = this.getStatus();
      var match = allowed.indexOf(answer) >= 0;

      if (match) {
        complete(answer);
      }
      return match;
    }

    function getPositionClasses() {
      var positions = this.options.position.split('-'); // top, bottom, left, right
      var classes = [];

      // top, left, right, bottom
      positions.forEach(function(cur) {
        classes.push('cc-' + cur);
      });

      return classes;
    }

    function getPopupClasses() {
      var opts = this.options;
      var positionStyle = (opts.position == 'top' || opts.position == 'bottom') ? 'banner' : 'floating';

      if (util.isMobile()) {
        positionStyle = 'floating';
      }

      var classes = [
        'cc-' + positionStyle, // floating or banner
        'cc-type-' + opts.type, // add the compliance type
        'cc-theme-' + opts.theme, // add the theme
      ];

      if (opts.static) {
        classes.push('cc-static');
      }

      classes.push.apply(classes, getPositionClasses.call(this));

      // we only add extra styles if `palette` has been set to a valid value
      var didAttach = attachCustomPalette.call(this, this.options.palette);

      // if we override the palette, add the class that enables this
      if (this.customStyleSelector) {
        classes.push(this.customStyleSelector);
      }

      return classes;
    }

    function getPopupInnerMarkup() {
      var interpolated = {};
      var opts = this.options;

      // removes link if showLink is false
      if (!opts.showLink) {
        opts.elements.link = '';
        opts.elements.messagelink = opts.elements.message;
      }

      Object.keys(opts.elements).forEach(function(prop) {
        interpolated[prop] = util.interpolateString(opts.elements[prop], function(name) {
          var str = opts.content[name];
          return (name && typeof str == 'string' && str.length) ? str : '';
        })
      });

      // checks if the type is valid and defaults to info if it's not
      var complianceType = opts.compliance[opts.type];
      if (!complianceType) {
        complianceType = opts.compliance.info;
      }

      // build the compliance types from the already interpolated `elements`
      interpolated.compliance = util.interpolateString(complianceType, function(name) {
        return interpolated[name];
      });

      // checks if the layout is valid and defaults to basic if it's not
      var layout = opts.layouts[opts.layout];
      if (!layout) {
        layout = opts.layouts.basic;
      }

      return util.interpolateString(layout, function(match) {
        return interpolated[match];
      });
    }

    function appendMarkup(markup) {
      var opts = this.options;
      var div = document.createElement('div');
      var cont = (opts.container && opts.container.nodeType === 1) ? opts.container : document.body;

      div.innerHTML = markup;

      var el = div.children[0];

      el.style.display = 'none';

      if (util.hasClass(el, 'cc-window') && cc.hasTransition) {
        util.addClass(el, 'cc-invisible');
      }

      // save ref to the function handle so we can unbind it later
      this.onButtonClick = handleButtonClick.bind(this);

      el.addEventListener('click', this.onButtonClick);

      if (opts.autoAttach) {
        if (!cont.firstChild) {
          cont.appendChild(el);
        } else {
          cont.insertBefore(el, cont.firstChild)
        }
      }

      return el;
    }

    function handleButtonClick(event) {
      var targ = event.target;
      if (util.hasClass(targ, 'cc-btn')) {

        var matches = targ.className.match(new RegExp("\\bcc-(" + __allowedStatuses.join('|') + ")\\b"));
        var match = (matches && matches[1]) || false;

        if (match) {
          this.setStatus(match);
          this.close(true);
        }
      }
      if (util.hasClass(targ, 'cc-close')) {
        this.setStatus(cc.status.dismiss);
        this.close(true);
      }
      if (util.hasClass(targ, 'cc-revoke')) {
        this.revokeChoice();
      }
    }

    // I might change this function to use inline styles. I originally chose a stylesheet because I could select many elements with a
    // single rule (something that happened a lot), the apps has changed slightly now though, so inline styles might be more applicable.
    function attachCustomPalette(palette) {
      var hash = util.hash(JSON.stringify(palette));
      var selector = 'cc-color-override-' + hash;
      var isValid = util.isPlainObject(palette);

      this.customStyleSelector = isValid ? selector : null;

      if (isValid) {
        addCustomStyle(hash, palette, '.' + selector);
      }
      return isValid;
    }

    function addCustomStyle(hash, palette, prefix) {

      // only add this if a style like it doesn't exist
      if (cc.customStyles[hash]) {
        // custom style already exists, so increment the reference count
        ++cc.customStyles[hash].references;
        return;
      }

      var colorStyles = {};
      var popup = palette.popup;
      var button = palette.button;
      var highlight = palette.highlight;

      // needs background colour, text and link will be set to black/white if not specified
      if (popup) {
        // assumes popup.background is set
        popup.text = popup.text ? popup.text : util.getContrast(popup.background);
        popup.link = popup.link ? popup.link : popup.text;
        colorStyles[prefix + '.cc-window'] = [
          'color: ' + popup.text,
          'background-color: ' + popup.background
        ];
        colorStyles[prefix + '.cc-revoke'] = [
          'color: ' + popup.text,
          'background-color: ' + popup.background
        ];
        colorStyles[prefix + ' .cc-link,' + prefix + ' .cc-link:active,' + prefix + ' .cc-link:visited'] = [
          'color: ' + popup.link
        ];

        if (button) {
          // assumes button.background is set
          button.text = button.text ? button.text : util.getContrast(button.background);
          button.border = button.border ? button.border : 'transparent';
          colorStyles[prefix + ' .cc-btn'] = [
            'color: ' + button.text,
            'border-color: ' + button.border,
            'background-color: ' + button.background
          ];
          
          if(button.background != 'transparent') 
            colorStyles[prefix + ' .cc-btn:hover, ' + prefix + ' .cc-btn:focus'] = [
              'background-color: ' + getHoverColour(button.background)
            ];

          if (highlight) {
            //assumes highlight.background is set
            highlight.text = highlight.text ? highlight.text : util.getContrast(highlight.background);
            highlight.border = highlight.border ? highlight.border : 'transparent';
            colorStyles[prefix + ' .cc-highlight .cc-btn:first-child'] = [
              'color: ' + highlight.text,
              'border-color: ' + highlight.border,
              'background-color: ' + highlight.background
            ];
          } else {
            // sets highlight text color to popup text. background and border are transparent by default.
            colorStyles[prefix + ' .cc-highlight .cc-btn:first-child'] = [
              'color: ' + popup.text
            ];
          }
        }

      }

      // this will be interpretted as CSS. the key is the selector, and each array element is a rule
      var style = document.createElement('style');
      document.head.appendChild(style);

      // custom style doesn't exist, so we create it
      cc.customStyles[hash] = {
        references: 1,
        element: style.sheet
      };

      var ruleIndex = -1;
      for (var prop in colorStyles) {
        if (colorStyles.hasOwnProperty(prop)) {
          style.sheet.insertRule(prop + '{' + colorStyles[prop].join(';') + '}', ++ruleIndex);
        }
      }
    }

    function getHoverColour(hex) {
      hex = util.normaliseHex(hex);
      // for black buttons
      if (hex == '000000') {
        return '#222';
      }
      return util.getLuminance(hex);
    }

    function removeCustomStyle(palette) {
      if (util.isPlainObject(palette)) {
        var hash = util.hash(JSON.stringify(palette));
        var customStyle = cc.customStyles[hash];
        if (customStyle && !--customStyle.references) {
          var styleNode = customStyle.element.ownerNode;
          if (styleNode && styleNode.parentNode) {
            styleNode.parentNode.removeChild(styleNode);
          }
          cc.customStyles[hash] = null;
        }
      }
    }

    function arrayContainsMatches(array, search) {
      for (var i = 0, l = array.length; i < l; ++i) {
        var str = array[i];
        // if regex matches or string is equal, return true
        if ((str instanceof RegExp && str.test(search)) ||
          (typeof str == 'string' && str.length && str === search)) {
          return true;
        }
      }
      return false;
    }

    function applyAutoDismiss() {
      var setStatus = this.setStatus.bind(this);

      var delay = this.options.dismissOnTimeout;
      if (typeof delay == 'number' && delay >= 0) {
        this.dismissTimeout = window.setTimeout(function() {
          setStatus(cc.status.dismiss);
        }, Math.floor(delay));
      }

      var scrollRange = this.options.dismissOnScroll;
      if (typeof scrollRange == 'number' && scrollRange >= 0) {
        var onWindowScroll = function(evt) {
          if (window.pageYOffset > Math.floor(scrollRange)) {
            setStatus(cc.status.dismiss);

            window.removeEventListener('scroll', onWindowScroll);
            this.onWindowScroll = null;
          }
        };

        this.onWindowScroll = onWindowScroll;
        window.addEventListener('scroll', onWindowScroll);
      }
    }

    function applyRevokeButton() {
      // revokable is true if advanced compliance is selected
      if (this.options.type != 'info') this.options.revokable = true;
      // animateRevokable false for mobile devices
      if (util.isMobile()) this.options.animateRevokable = false;

      if (this.options.revokable) {
        var classes = getPositionClasses.call(this);
        if (this.options.animateRevokable) {
          classes.push('cc-animate');
        }
        if (this.customStyleSelector) {
          classes.push(this.customStyleSelector)
        }
        var revokeBtn = this.options.revokeBtn.replace('{{classes}}', classes.join(' '));
        this.revokeBtn = appendMarkup.call(this, revokeBtn);

        var btn = this.revokeBtn;
        if (this.options.animateRevokable) {
          var wait = false;
          var onMouseMove = util.throttle(function(evt) {
            var active = false;
            var minY = 20;
            var maxY = (window.innerHeight - 20);

            if (util.hasClass(btn, 'cc-top') && evt.clientY < minY) active = true;
            if (util.hasClass(btn, 'cc-bottom') && evt.clientY > maxY) active = true;

            if (active) {
              if (!util.hasClass(btn, 'cc-active')) {
                util.addClass(btn, 'cc-active');
              }
            } else {
              if (util.hasClass(btn, 'cc-active')) {
                util.removeClass(btn, 'cc-active');
              }
            }
          }, 200);

          this.onMouseMove = onMouseMove;
          window.addEventListener('mousemove', onMouseMove);
        }
      }
    }

    return CookiePopup
  }());

  cc.Location = (function() {

    // An object containing all the location services we have already set up.
    // When using a service, it could either return a data structure in plain text (like a JSON object) or an executable script
    // When the response needs to be executed by the browser, then `isScript` must be set to true, otherwise it won't work.

    // When the service uses a script, the chances are that you'll have to use the script to make additional requests. In these
    // cases, the services `callback` property is called with a `done` function. When performing async operations, this must be called
    // with the data (or Error), and `cookieconsent.locate` will take care of the rest
    var defaultOptions = {

      // The default timeout is 5 seconds. This is mainly needed to catch JSONP requests that error.
      // Otherwise there is no easy way to catch JSONP errors. That means that if a JSONP fails, the
      // app will take `timeout` milliseconds to react to a JSONP network error.
      timeout: 5000,

      // the order that services will be attempted in
      services: [
        'freegeoip',
        'ipinfo',
        'maxmind'

        /*

        // 'ipinfodb' requires some options, so we define it using an object
        // this object will be passed to the function that defines the service

        {
          name: 'ipinfodb',
          interpolateUrl: {
            // obviously, this is a fake key
            api_key: 'vOgI3748dnIytIrsJcxS7qsDf6kbJkE9lN4yEDrXAqXcKUNvjjZPox3ekXqmMMld'
          },
        },

        // as well as defining an object, you can define a function that returns an object

        function () {
          return {name: 'ipinfodb'};
        },

        */
      ],

      serviceDefinitions: {

        freegeoip: function() {
          return {
            // This service responds with JSON, but they do not have CORS set, so we must use JSONP and provide a callback
            // The `{callback}` is automatically rewritten by the tool
            url: '//freegeoip.net/json/?callback={callback}',
            isScript: true, // this is JSONP, therefore we must set it to run as a script
            callback: function(done, response) {
              try{
                var json = JSON.parse(response);
                return json.error ? toError(json) : {
                  code: json.country_code
                };
              } catch (err) {
                return toError({error: 'Invalid response ('+err+')'});
              }
            }
          }
        },

        ipinfo: function() {
          return {
            // This service responds with JSON, so we simply need to parse it and return the country code
            url: '//ipinfo.io',
            headers: ['Accept: application/json'],
            callback: function(done, response) {
              try{
                var json = JSON.parse(response);
                return json.error ? toError(json) : {
                  code: json.country
                };
              } catch (err) {
                return toError({error: 'Invalid response ('+err+')'});
              }
            }
          }
        },

        // This service requires an option to define `key`. Options are proived using objects or functions
        ipinfodb: function(options) {
          return {
            // This service responds with JSON, so we simply need to parse it and return the country code
            url: '//api.ipinfodb.com/v3/ip-country/?key={api_key}&format=json&callback={callback}',
            isScript: true, // this is JSONP, therefore we must set it to run as a script
            callback: function(done, response) {
              try{
                var json = JSON.parse(response);
                return json.statusCode == 'ERROR' ? toError({error: json.statusMessage}) : {
                  code: json.countryCode
                };
              } catch (err) {
                return toError({error: 'Invalid response ('+err+')'});
              }
            }
          }
        },

        maxmind: function() {
          return {
            // This service responds with a JavaScript file which defines additional functionality. Once loaded, we must
            // make an additional AJAX call. Therefore we provide a `done` callback that can be called asynchronously
            url: '//js.maxmind.com/js/apis/geoip2/v2.1/geoip2.js',
            isScript: true, // this service responds with a JavaScript file, so it must be run as a script
            callback: function(done) {
              // if everything went okay then `geoip2` WILL be defined
              if (!window.geoip2) {
                done(new Error('Unexpected response format. The downloaded script should have exported `geoip2` to the global scope'));
                return;
              }

              geoip2.country(function(location) {
                try {
                  done({
                    code: location.country.iso_code
                  });
                } catch (err) {
                  done(toError(err));
                }
              }, function(err) {
                done(toError(err));
              });

              // We can't return anything, because we need to wait for the second AJAX call to return.
              // Then we can 'complete' the service by passing data or an error to the `done` callback.
            }
          }
        },
      },
    };

    function Location(options) {
      // Set up options
      util.deepExtend(this.options = {}, defaultOptions);

      if (util.isPlainObject(options)) {
        util.deepExtend(this.options, options);
      }

      this.currentServiceIndex = -1; // the index (in options) of the service we're currently using
    }

    Location.prototype.getNextService = function() {
      var service;

      do {
        service = this.getServiceByIdx(++this.currentServiceIndex);
      } while (this.currentServiceIndex < this.options.services.length && !service);

      return service;
    };

    Location.prototype.getServiceByIdx = function(idx) {
      // This can either be the name of a default locationService, or a function.
      var serviceOption = this.options.services[idx];

      // If it's a string, use one of the location services.
      if (typeof serviceOption === 'function') {
        var dynamicOpts = serviceOption();
        if (dynamicOpts.name) {
          util.deepExtend(dynamicOpts, this.options.serviceDefinitions[dynamicOpts.name](dynamicOpts));
        }
        return dynamicOpts;
      }

      // If it's a string, use one of the location services.
      if (typeof serviceOption === 'string') {
        return this.options.serviceDefinitions[serviceOption]();
      }

      // If it's an object, assume {name: 'ipinfo', ...otherOptions}
      // Allows user to pass in API keys etc.
      if (util.isPlainObject(serviceOption)) {
        return this.options.serviceDefinitions[serviceOption.name](serviceOption);
      }

      return null;
    };

    // This runs the service located at index `currentServiceIndex`.
    // If the service fails, `runNextServiceOnError` will continue trying each service until all fail, or one completes successfully
    Location.prototype.locate = function(complete, error) {
      var service = this.getNextService();

      if (!service) {
        error(new Error('No services to run'));
        return;
      }

      this.callbackComplete = complete;
      this.callbackError = error;

      this.runService(service, this.runNextServiceOnError.bind(this));
    };

    // Potentially adds a callback to a url for jsonp.
    Location.prototype.setupUrl = function(service) {
      var serviceOpts = this.getCurrentServiceOpts();
      return service.url.replace(/\{(.*?)\}/g, function(_, param) {
        if (param === 'callback') {
          var tempName = 'callback' + Date.now();
          window[tempName] = function(res) {
            service.__JSONP_DATA = JSON.stringify(res);
          }
          return tempName;
        }
        if (param in serviceOpts.interpolateUrl) {
          return serviceOpts.interpolateUrl[param];
        }
      });
    };

    // requires a `service` object that defines at least a `url` and `callback`
    Location.prototype.runService = function(service, complete) {
      var self = this;

      // basic check to ensure it resembles a `service`
      if (!service || !service.url || !service.callback) {
        return;
      }

      // we call either `getScript` or `makeAsyncRequest` depending on the type of resource
      var requestFunction = service.isScript ? getScript : makeAsyncRequest;

      var url = this.setupUrl(service);

      // both functions have similar signatures so we can pass the same arguments to both
      requestFunction(url, function(xhr) {
        // if `!xhr`, then `getScript` function was used, so there is no response text
        var responseText = xhr ? xhr.responseText : '';

        // if the resource is a script, then this function is called after the script has been run.
        // if the script is JSONP, then a time defined function `callback_{Date.now}` has already
        // been called (as the JSONP callback). This callback sets the __JSONP_DATA property
        if (service.__JSONP_DATA) {
          responseText = service.__JSONP_DATA;
          delete service.__JSONP_DATA;
        }

        // call the service callback with the response text (so it can parse the response)
        self.runServiceCallback.call(self, complete, service, responseText);

      }, this.options.timeout, service.data, service.headers);

      // `service.data` and `service.headers` are optional (they only count if `!service.isScript` anyway)
    };

    // The service request has run (and possibly has a `responseText`) [no `responseText` if `isScript`]
    // We need to run its callback which determines if its successful or not
    // `complete` is called on success or failure
    Location.prototype.runServiceCallback = function(complete, service, responseText) {
      var self = this;
      // this is the function that is called if the service uses the async callback in its handler method
      var serviceResultHandler = function (asyncResult) {
        // if `result` is a valid value, then this function shouldn't really run
        // even if it is called by `service.callback`
        if (!result) {
          self.onServiceResult.call(self, complete, asyncResult)
        }
      };

      // the function `service.callback` will either extract a country code from `responseText` and return it (in `result`)
      // or (if it has to make additional requests) it will call a `done` callback with the country code when it is ready
      var result = service.callback(serviceResultHandler, responseText);

      if (result) {
        this.onServiceResult.call(this, complete, result);
      }
    };

    // This is called with the `result` from `service.callback` regardless of how it provided that result (sync or async).
    // `result` will be whatever is returned from `service.callback`. A service callback should provide an object with data
    Location.prototype.onServiceResult = function(complete, result) {
      // convert result to nodejs style async callback
      if (result instanceof Error || (result && result.error)) {
        complete.call(this, result, null);
      } else {
        complete.call(this, null, result);
      }
    };

    // if `err` is set, the next service handler is called
    // if `err` is null, the `onComplete` handler is called with `data`
    Location.prototype.runNextServiceOnError = function(err, data) {
      if (err) {
        this.logError(err);

        var nextService = this.getNextService();

        if (nextService) {
          this.runService(nextService, this.runNextServiceOnError.bind(this));
        } else {
          this.completeService.call(this, this.callbackError, new Error('All services failed'));
        }
      } else {
        this.completeService.call(this, this.callbackComplete, data);
      }
    };

    Location.prototype.getCurrentServiceOpts = function() {
      var val = this.options.services[this.currentServiceIndex];

      if (typeof val == 'string') {
        return {name: val};
      }

      if (typeof val == 'function') {
        return val();
      }

      if (util.isPlainObject(val)) {
        return val;
      }

      return {};
    };

    // calls the `onComplete` callback after resetting the `currentServiceIndex`
    Location.prototype.completeService = function(fn, data) {
      this.currentServiceIndex = -1;

      fn && fn(data);
    };

    Location.prototype.logError = function (err) {
      var idx = this.currentServiceIndex;
      var service = this.getServiceByIdx(idx);

      console.error('The service[' + idx + '] (' + service.url + ') responded with the following error', err);
    };

    function getScript(url, callback, timeout) {
      var timeoutIdx, s = document.createElement('script');

      s.type = 'text/' + (url.type || 'javascript');
      s.src = url.src || url;
      s.async = false;

      s.onreadystatechange = s.onload = function() {
        // this code handles two scenarios, whether called by onload or onreadystatechange
        var state = s.readyState;

        clearTimeout(timeoutIdx);

        if (!callback.done && (!state || /loaded|complete/.test(state))) {
          callback.done = true;
          callback();
          s.onreadystatechange = s.onload = null;
        }
      };

      document.body.appendChild(s);

      // You can't catch JSONP Errors, because it's handled by the script tag
      // one way is to use a timeout
      timeoutIdx = setTimeout(function () {
        callback.done = true;
        callback();
        s.onreadystatechange = s.onload = null;
      }, timeout);
    }

    function makeAsyncRequest(url, onComplete, timeout, postData, requestHeaders) {
      var xhr = new(window.XMLHttpRequest || window.ActiveXObject)('MSXML2.XMLHTTP.3.0');

      xhr.open(postData ? 'POST' : 'GET', url, 1);

      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

      if (Array.isArray(requestHeaders)) {
        for (var i = 0, l = requestHeaders.length; i < l; ++i) {
          var split = requestHeaders[i].split(':', 2)
          xhr.setRequestHeader(split[0].replace(/^\s+|\s+$/g, ''), split[1].replace(/^\s+|\s+$/g, ''));
        }
      }

      if (typeof onComplete == 'function') {
        xhr.onreadystatechange = function() {
          if (xhr.readyState > 3) {
            onComplete(xhr);
          }
        };
      }

      xhr.send(postData);
    }

    function toError(obj) {
      return new Error('Error [' + (obj.code || 'UNKNOWN') + ']: ' + obj.error);
    }

    return Location;
  }());

  cc.Law = (function() {

    var defaultOptions = {
      // Make this false if you want to disable all regional overrides for settings.
      // If true, options can differ by country, depending on their cookie law.
      // It does not affect hiding the popup for countries that do not have cookie law.
      regionalLaw: true,

      // countries that enforce some version of a cookie law
      hasLaw: ['AT', 'BE', 'BG', 'HR', 'CZ', 'CY', 'DK', 'EE', 'FI', 'FR', 'DE', 'EL', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'SK', 'SI', 'ES', 'SE', 'GB', 'UK'],

      // countries that say that all cookie consent choices must be revokable (a user must be able too change their mind)
      revokable: ['HR', 'CY', 'DK', 'EE', 'FR', 'DE', 'LV', 'LT', 'NL', 'PT', 'ES'],

      // countries that say that a person can only "consent" if the explicitly click on "I agree".
      // in these countries, consent cannot be implied via a timeout or by scrolling down the page
      explicitAction: ['HR', 'IT', 'ES'],
    };

    function Law(options) {
      this.initialise.apply(this, arguments);
    }

    Law.prototype.initialise = function(options) {
      // set options back to default options
      util.deepExtend(this.options = {}, defaultOptions);

      // merge in user options
      if (util.isPlainObject(options)) {
        util.deepExtend(this.options, options);
      }
    };

    Law.prototype.get = function(countryCode) {
      var opts = this.options;
      return {
        hasLaw: opts.hasLaw.indexOf(countryCode) >= 0,
        revokable: opts.revokable.indexOf(countryCode) >= 0,
        explicitAction: opts.explicitAction.indexOf(countryCode) >= 0,
      };
    };

    Law.prototype.applyLaw = function(options, countryCode) {
      var country = this.get(countryCode);

      if (!country.hasLaw) {
        // The country has no cookie law
        options.enabled = false;
      }

      if (this.options.regionalLaw) {
        if (country.revokable) {
          // We must provide an option to revoke consent at a later time
          options.revokable = true;
        }

        if (country.explicitAction) {
          // The user must explicitly click the consent button
          options.dismissOnScroll = false;
          options.dismissOnTimeout = false;
        }
      }
      return options;
    };

    return Law;
  }());

  // This function initialises the app by combining the use of the Popup, Locator and Law modules
  // You can string together these three modules yourself however you want, by writing a new function.
  cc.initialise = function(options, complete, error) {
    var law = new cc.Law(options.law);

    if (!complete) complete = function() {};
    if (!error) error = function() {};

    cc.getCountryCode(options, function(result) {
      // don't need the law or location options anymore
      delete options.law;
      delete options.location;

      if (result.code) {
        options = law.applyLaw(options, result.code);
      }

      complete(new cc.Popup(options));
    }, function(err) {
      // don't need the law or location options anymore
      delete options.law;
      delete options.location;

      error(err, new cc.Popup(options));
    });
  };

  // This function tries to find your current location. It either grabs it from a hardcoded option in
  // `options.law.countryCode`, or attempts to make a location service request. This function accepts
  // options (which can configure the `law` and `location` modules) and fires a callback with which
  // passes an object `{code: countryCode}` as the first argument (which can have undefined properties)
  cc.getCountryCode = function(options, complete, error) {
    if (options.law && options.law.countryCode) {
      complete({
        code: options.law.countryCode
      });
      return;
    }
    if (options.location) {
      var locator = new cc.Location(options.location);
      locator.locate(function(serviceResult) {
        complete(serviceResult || {});
      }, error);
      return;
    }
    complete({});
  };

  // export utils (no point in hiding them, so we may as well expose them)
  cc.utils = util;

  return cc;
}


function _init_gdpr_consent_dialog(cookie_domain) {
    var d = _init_consent_dialog();
    var dp;
    d.initialise({
        palette: {
            popup: {
                background: '#237afc'
            },
            button: {
                background: '#fff',
                text: '#237afc'
            }
        },
        content: {
            allow: 'Allow',
            href: '/privacy/',
            message: 'This website uses cookies for performance monitoring to help us improve the website.',
            desc_tag: 'gdpr'
        },
        cookie: {
            name: 'xgdpr-consent',
            domain: cookie_domain 
        },
        compliance: {
            'opt-in': '<div class="cc-compliance cc-highlight">{{deny}}{{allow}}</div>'
        },
        autoOpen: false,
        type: 'opt-in',
        revokable: false, // hide revoke button in favor of revoke/change link instead
        enabled: true,
        onStatusChange: function(status) {
            $('.pp-consent-value').text(status.toUpperCase());
        }
    }, function(popup) {
        dp = popup;
        popup.options.revokable = false; // setting opt-in overrides revokable, set it back to false
    });
    return dp;
}

function _init_ccpa_consent_dialog(cookie_domain) {
    var d = _init_consent_dialog();
    var dp;
    d.initialise({
        palette: {
            popup: {
                background: '#237afc'
            },
            button: {
                background: '#fff',
                text: '#237afc'
            }
        },
        content: {
            dismiss: 'Ok',
            href: '/privacy/',
            message: 'This website uses cookies and other similar technologies for analytics and performance monitoring to help us improve the website.',
            desc_tag: 'ccpa'
        },
        cookie: {
            name: 'xccpa-consent',
            domain: cookie_domain 
        },
        compliance: {
            'info': '<div class="cc-compliance cc-highlight">{{dismiss}}</div>'
        },
        autoOpen: false,
        type: 'info',
        revokable: false, // hide revoke button in favor of revoke/change link instead
        enabled: true,
        onStatusChange: function(status) {
            pp_common_ajax_callback('/qapi/user/ccpa/ack/', {}, function(data) {});
        }
    }, function(popup) {
        dp = popup;
        popup.options.revokable = false; // setting opt-in overrides revokable, set it back to false
    });
    return dp;
}

var gdpr_consent_popup;
var ccpa_consent_popup;
function init_consent(cookie_domain, gdpr_enabled, ccpa_enabled) {
    gdpr_consent_popup = _init_gdpr_consent_dialog(cookie_domain);
    ccpa_consent_popup = _init_ccpa_consent_dialog(cookie_domain);
    if (gdpr_enabled)
        gdpr_consent_popup.open();
    if (ccpa_enabled)
        ccpa_consent_popup.open();
    $('.pp-change-consent').on('click', function() {
        gdpr_consent_popup.open();
        return false;
    });
}
 


// Code below Copyright 2014 PCPartPicker, LLC
var MODERATION_REASONS = {
	1: 'Spam',
	2: 'Obscene or offensive content',
	4: 'Harassment or verbal abuse',
	8: 'Trolling',
	16: 'Fake or non-authentic build',
	32: 'AI-generated content',
	65536: 'Other'
};
var MODERATION_REPORT_MAP = {
	'UserBuild': [1, 2, 4, 8, 16, 32, 65536]
};


var num_search_items = 0;
var search_selection_index = -1;
var search_id = 0;
var selection_urls = [];
function update_search_selection_index(new_index) {
    if (search_selection_index >= 0)
        $("#search_selection_" + search_selection_index).removeClass("search-row-selection");
    if (new_index >= 0)
        $("#search_selection_" + new_index).addClass("search-row-selection");
    search_selection_index = new_index;
}
function clear_search_result() {
    $('div.search_results').hide().html("");
    num_search_items = 0;
    search_selection_index = -1;
    selection_urls = [];
}
function on_search(search_term) {
    search_id++;
    pp_common_ajax_callback(
        '/qapi/product/search/live/',
        {
            q: search_term,
            qid: search_id
        },
        function (data) {
            if (data.success) {
                if (data.qid == search_id) {
                    $('div.search_results').html(data.content);
                    $('div.search_results').show();
                    update_search_selection_index(-1);
                    selection_urls = data.product_urls;
                }
            }
            else {
                window.alert(data.error);
            }
        }
    );
}
function init_live_search() {
    $('#search_q').livesearch({
        searchCallback: function (search_term) { return on_search(search_term); },
        innerText: "",
        queryDelay: 200,
        minimumSearchLength: 1
    });
    $('#search_q').on('keydown', function (e) {
        if (e.keyCode == 38) { /* up */
            if (search_selection_index >= 0)
                update_search_selection_index(search_selection_index - 1);
            return false;
        }
        else if (e.keyCode == 40) { /* down */
            if (search_selection_index < num_search_items - 1)
                update_search_selection_index(search_selection_index + 1);
            return false;
        }
        else if (e.keyCode == 13) { /* enter */
            if (search_selection_index >= 0) {
                window.location.href = selection_urls[search_selection_index];
                return false;
            }
        }
        else if (e.keyCode == 27) { /* escape */
            clear_search_result();
        }
    });
}


function view_upp_url(index, upp_id) {
    if (!$('#custom_part_' + index).is(':visible')) {
        $('#custom_part_' + index).show();
        $.get('/qapi/partlist/get_upp_url/?upp_id=' + upp_id, function(data) {
            $('#custom_part_loading_' + index).html(data);
        }, "json");
    }
    else {
        $('#custom_part_' + index).hide();
    }
}


function set_upp_purchased_text(val) {
    if (val) {
        $('#add_custom_part_buy').hide();
        $('#add_custom_part_own').show();
    }
    else {
        $('#add_custom_part_buy').show();
        $('#add_custom_part_own').hide();
    }
}
function show_partlist_upp_dialog(){
    $('#add_custom_id').val(0);
    $('#add_custom_submit').val('Add Custom Part');
    $('#add_custom_name').val('');
    $('#add_custom_class_slug').val('');
    $('#add_custom_url').val('');
    $('#add_custom_price').val('');

    if (true) {
        $('#partlist_upp_dialog_auto_fetch input[type=text]').val('');
        $('#partlist_upp_dialog_auto_fetch').show();
        $('#partlist_upp_dialog_auto_fetch_spinner').hide();
        $('#partlist_upp_dialog_auto_fetch_result').html('').hide();
        $('#partlist_upp_dialog_auto_fetch_error').html('').hide();
        $('#partlist_upp_dialog_manual_fetch').show();
        $('#partlist_upp_dialog_manual_entry_form').hide();
        $('#partlist_upp_dialog_auto_fetch input[type=submit]').show();
        $('#partlist_upp_dialog_auto_fetch input[type=text]').prop('disabled', false);
    }
    else {
        $('#partlist_upp_dialog_auto_fetch input[type=text]').val('');
        $('#partlist_upp_dialog_auto_fetch').hide();
        $('#partlist_upp_dialog_auto_fetch_spinner').hide();
        $('#partlist_upp_dialog_auto_fetch_result').html('').hide();
        $('#partlist_upp_dialog_auto_fetch_error').html('').hide();
        $('#partlist_upp_dialog_manual_fetch').hide();
        $('#partlist_upp_dialog_manual_entry_form').show();
        $('#partlist_upp_dialog_auto_fetch input[type=submit]').show();
        $('#partlist_upp_dialog_auto_fetch input[type=text]').prop('disabled', false);
    }

    $('#partlist_upp_dialog .modal__header h3').text('Add Custom Part');
    r_show_dialog('#partlist_upp_dialog');
}

function show_upp_edit_dialog(upp_id, upp_items){
    for (var upp_i in upp_items) {
        var upp_d = upp_items[upp_i];
        if (upp_d.id == upp_id) {
            $('#add_custom_id').val(upp_id);
            $('#add_custom_submit').val('Save Custom Part');
            $('#add_custom_name').val(upp_d.description);
            $('#add_custom_class_slug').val(upp_d.class_slug);
            $('#add_custom_url').val(upp_d.url);
            $('#add_custom_price').val(upp_d.price);

            $('#partlist_upp_dialog_auto_fetch').hide();
            $('#partlist_upp_dialog_auto_fetch_spinner').hide();
            $('#partlist_upp_dialog_auto_fetch_result').html('').hide();
            $('#partlist_upp_dialog_auto_fetch_error').html('').hide();
            $('#partlist_upp_dialog_manual_fetch').hide();
            $('#partlist_upp_dialog_manual_entry_form').show();
            $('#partlist_upp_dialog_auto_fetch input[type=submit]').show();
            $('#partlist_upp_dialog_auto_fetch input[type=text]').prop('disabled', false);

            $('#partlist_upp_dialog .modal__header h3').text('Edit Custom Part');
            r_show_dialog('#partlist_upp_dialog');
            $('#add_custom_own').prop('checked', upp_d.purchased);
            set_upp_purchased_text(upp_d.purchased);
            return;
        }
    }
}

function init_partlist_custom_dialog(upp_items) {
    $('#add_custom_own').on('change', function() {
        set_upp_purchased_text($('#add_custom_own').prop('checked'));
    });
    $('#add_custom').on('click', function(){
        show_partlist_upp_dialog();
        return false;
    });
    $('a.delete-custom').on('click', function(){
        pp_partlist_upp_delete(parseInt($(this).data('upp-id')));
        return false;
    });
    $('a.edit-custom').on('click', function(){
        show_upp_edit_dialog(parseInt($(this).data('upp-id')), upp_items);
        return false;
    });

    $('#upp_add_custom_form').on('submit', function(e){
        var form_data = pp_form_to_dict($(this));
        e.preventDefault();
        $('#partlist_upp_dialog_auto_fetch input[type=submit]').hide();
        $('#partlist_upp_dialog_auto_fetch input[type=text]').prop('disabled', true);
        $('#partlist_upp_dialog_auto_fetch_spinner').show();
        $('#partlist_upp_dialog_manual_fetch').hide();

        pp_post_wait('/qapi/upp/lookup/', form_data, function(data) {
            $('#partlist_upp_dialog_auto_fetch_spinner').hide();
            $('#partlist_upp_dialog_auto_fetch').hide();
            $('#partlist_upp_dialog_auto_fetch_error').html('').hide();
            $('#partlist_upp_dialog_auto_fetch_result').html(data.content).show();
        }, function(error) {
            $('#partlist_upp_dialog_auto_fetch_spinner').hide();
            $('#partlist_upp_dialog_auto_fetch input[type=submit]').show();
            $('#partlist_upp_dialog_auto_fetch input[type=text]').prop('disabled', false);
            $('#partlist_upp_dialog_auto_fetch_result').html('').hide();
            $('#partlist_upp_dialog_auto_fetch_error').html(error).show();
            $('#partlist_upp_dialog_manual_fetch').show();
        });
    });
    $('#partlist_upp_dialog_manual_fetch input.upp_manual_enter').on('click', function(){
        $('#partlist_upp_dialog_manual_fetch').hide();
        $('#partlist_upp_dialog_manual_entry_form').show();
        $('#partlist_upp_dialog_auto_fetch_result').hide();
        $('#partlist_upp_dialog_auto_fetch_error').hide();
        $('#partlist_upp_dialog_auto_fetch').hide();
    });
}


function moderation_get_reasons(linkage_type) {
    var ids = [];
    if (MODERATION_REPORT_MAP[linkage_type] != undefined)
        ids = MODERATION_REPORT_MAP[linkage_type];
    else
        ids = [1, 2, 4, 8, 32, 65536];
    var ss = [];
    for (var i = 0; i < ids.length; ++i)
        ss.push({'value': ids[i], 'name': MODERATION_REASONS[ids[i]]});
    return ss;
}

function cx_login_to_vote() {
    window.location.assign(window.location.protocol + "//" + window.location.host + '/accounts/login/?next=' + window.location.pathname + window.location.search + window.location.hash);
}

var skip_comment_vote = {};
function cx_vote(root_id, comment_id, amount) {
    if (skip_comment_vote[[root_id, comment_id]])
        return;
    skip_comment_vote[[root_id, comment_id]] = true;
    var container_prefix = '#cx' + comment_id;
    if (comment_id == 0)
        container_prefix = '#cxr' + root_id;
    var downvote_div = $(container_prefix + '_downvote');
    var upvote_div = $(container_prefix + '_upvote');
    //var point_container = $(container_prefix + '_points');
    //var points = parseInt(point_container.html());
    var upvoted = upvote_div.hasClass('comment-voted-up');
    var downvoted = downvote_div.hasClass('comment-voted-down');
    amount = Math.min(1, Math.max(-1, amount)) /* normalize to -1, 0, 1 */
    //points = points + (downvoted ? 1 : 0) + (upvoted ? -1 : 0)
    if ((amount > 0 && upvoted) || (amount < 0 && downvoted)) {
        amount = 0; /* negate vote */
    }
    pp_common_ajax_callback('/qapi/comments/vote/', { comment_root: root_id, comment_id: comment_id, amount: amount }, function (data) {
        skip_comment_vote[[root_id, comment_id]] = false;
        if (data.success) {
            if (amount == 0) {
                //point_container.html(points);
                upvote_div.removeClass('comment-voted-up').addClass('comment-vote-up');
                downvote_div.removeClass('comment-voted-down').addClass('comment-vote-down');
            }
            else if (amount > 0) {
                //point_container.html(points + 1);
                upvote_div.removeClass('comment-vote-up').addClass('comment-voted-up');
                downvote_div.removeClass('comment-voted-down').addClass('comment-vote-down');
            }
            else if (amount < 0) {
                //point_container.html(points - 1);
                upvote_div.removeClass('comment-voted-up').addClass('comment-vote-up');
                downvote_div.removeClass('comment-vote-down').addClass('comment-voted-down');
            }
        }
        else {
            window.alert(data.error);
        }
    });
}
function cxr_vote(root_id) {
    if (skip_comment_vote[[root_id, 0]])
        return;
    skip_comment_vote[[root_id, 0]] = true;
    container_prefix = '#cxr' + root_id;
    var upvote_div = $(container_prefix + '_upvote');
    var point_container = $(container_prefix + '_points');
    var points = parseInt(point_container.html());
    var upvoted = upvote_div.hasClass('actionBox__vote--voted');
    if (upvoted) {
        amount = 0; /* negate vote */
    }
    else {
        amount = 1;
    }
    pp_common_ajax_callback('/qapi/comments/vote/', { comment_root: root_id, comment_id: 0, amount: amount }, function (data) {
        skip_comment_vote[[root_id, 0]] = false;
        if (data.success) {
            if (upvoted) {
                point_container.html(points - 1);
                upvote_div.removeClass('actionBox__vote--voted');
            }
            else {
                point_container.html(points + 1);
                upvote_div.addClass('actionBox__vote--voted');
            }
        }
        else {
            window.alert(data.error);
        }
    });
}
function change_comment_sort(selector) {
    window.location = window.location.protocol + '//' + window.location.host + window.location.pathname + '?comment_sort=' + selector.value + '#comments';
}
function cx_edit_toggle(root_id, parent_id, comment_id) {
    var cmdiv = $('#cx' + comment_id + '_message_block');
    var crdiv = $('#cx' + comment_id + '_reply');
    if (!crdiv.is(':visible')) {
        pp_common_ajax_callback('/qapi/comments/view/', { comment_id: comment_id }, function (data) {
            if (data.success) {
                crdiv.html(cx_make_comment_edit_form(root_id, parent_id, comment_id, data.message));
                cmdiv.hide()
                crdiv.show();
                $('#cx' + comment_id + '_textarea').focus();
            }
            else {
                window.alert(data.error);
            }
        });
    }
    else {
        crdiv.hide();
        $('#cx' + comment_id + '_help_box').hide();
        cmdiv.show();
    }
}
function cx_reply_toggle(root_id, parent_id, permanent) {
    var crdiv = $('#cx' + parent_id + '_reply');
    if (permanent == undefined)
        permanent = false;
    if (!crdiv.is(':visible')) {
        crdiv.html(cx_make_comment_reply_form(root_id, parent_id, permanent)).show();
        if (!permanent)
            $('#cx' + parent_id + '_textarea').focus();
    }
    else {
        crdiv.html('').hide();
        $('#cx' + parent_id + '_help_box').hide();
    }
}
function show_error_div($error_div, message) {
    $error_div.text(message);
    $error_div.show();
}
function cx_submit_edit(s, comment_id) {
    var is_blank = ($('#cx' + comment_id + '_textarea').val().length == 0);
    var $form_error = $('#cx' + comment_id + '_form_error');
    $('#cx' + comment_id + '_help_box').hide();
    if (is_blank) {
        show_error_div($form_error, 'Comment cannot be blank.');
    }
    else {
        $form_error.hide();
        pp_common_ajax_callback('/qapi/comments/post/', pp_form_to_dict($(s.form)), function(data) {
            if (data.success) {
                $('#cx' + comment_id + '_reply').html('').hide();
                $('#cx' + comment_id).replaceWith(data.content);
            }
            else {
                if (data.error)
                    show_error_div($form_error, data.error);
                else
                    show_error_div($form_error, 'There was an error submitting your comment.');
            }
        });
    }
}
function cx_submit_reply(s, parent_id, permanent) {
    var is_blank = ($('#cx' + parent_id + '_textarea').val().length == 0);
    var $save_button = $(s);
    var $form_error = $('#cx' + parent_id + '_form_error');
    $('#cx' + parent_id + '_help_box').hide();
    if (is_blank) {
        show_error_div($form_error, 'Comment cannot be blank.');
    }
    else {
        $form_error.hide();
        $save_button.prop('disabled', true);
        pp_common_ajax_callback('/qapi/comments/post/', pp_form_to_dict($(s.form)), function(data) {
            if (data.success) {
                $('#cx' + parent_id + '_textarea').val('');
                if (!permanent) {
                    $('#cx' + parent_id + '_reply').hide();
                    $('#cx' + parent_id + '_reply').html('');
                }
                $('#cx' + parent_id + '_insert_point').prepend(data.content).show();
                $('#no_comments').hide();
                if (permanent) {
                    window.location.hash = 'cx' + data.comment_id;
                }
            }
            else {
                if (data.error)
                    show_error_div($form_error, data.error);
                else
                    show_error_div($form_error, 'There was an error submitting your comment.');
            }
            $save_button.prop('disabled', false);
        });
    }
}
function cx_delete(comment_id) { $('#cx' + comment_id + '_delete').hide(); $('#cx' + comment_id + '_delete_confirm').show(); }
function cx_delete_cancel(comment_id) { $('#cx' + comment_id + '_delete').show(); $('#cx' + comment_id + '_delete_confirm').hide(); }
function cx_delete_confirm(comment_id) {
    pp_common_ajax_callback('/qapi/comments/delete/', { comment_id: comment_id }, function(data) {
        if (data.success)
            $('#cx' + comment_id + '_item').html('<div class="comment-deleted">[comment deleted]</div>');
        else
            $('#cx' + comment_id + '_delete_confirm').html('There was an error deleting this comment.');
    });
}
function mx_reply_toggle(message_id) {
    var crdiv = $('#mx' + message_id + '_reply');
    if (!crdiv.is(':visible')) {
        crdiv.html(mx_make_comment_reply_form(message_id)).show();
        $('#mx' + message_id + '_textarea').focus();
    }
    else {
        crdiv.html('').hide();
        $('#mx' + message_id + '_help_box').hide();
    }
}
function mx_submit_reply(s, message_id) {
    var is_blank = ($('#mx' + message_id + '_textarea').val().length == 0);
    var $save_button = $(s);
    var $form_error = $('#mx' + message_id + '_form_error');
    $('#mx' + message_id + '_help_box').hide();
    if (is_blank) {
        show_error_div($form_error, 'Message cannot be blank.');
    }
    else {
        $form_error.hide();
        $save_button.prop('disabled', true);
        pp_common_ajax_callback('/qapi/comments/message/reply/', pp_form_to_dict($(s.form)), function(data) {
            if (data.success) {
                $('#mx' + message_id + '_textarea').val('');
                $('#mx' + message_id + '_reply').hide();
                $('#mx' + message_id + '_reply').html('');
                $('#mx' + message_id + '_insert_point').prepend(data.content).show();
                window.location.hash = 'mx' + data.message_id;
            }
            else {
                show_error_div($form_error, 'There was an error submitting your message.');
            }
            $save_button.prop('disabled', false);
        });
    }
}

$(document).ready(function() {
    if (document.querySelector('div.comment')) {
        $(window).on('hashchange', function(e) {
            var hash = window.location.hash;
            if (hash.substr(0, 3) === '#cx') {
                var comment_id = hash.substr(3);
                var parent_comment_id;
                if (window.hasOwnProperty('continuation_comment_map')) {
                    parent_comment_id = continuation_comment_map[comment_id];
                }
                if (parent_comment_id) {
                    window.location = '/comments/thread/' + parent_comment_id + '/' + hash;
                } else {
                    $('#comment_hidden_' + comment_id).hide();
                    $('#comment_wrap_' + comment_id).show();
                    window.location.hash = hash;
                }
            }
        });
        $(window).trigger('hashchange');
    }
});

function pp_comment_root_subscribe_toggle(root_id, container) { 
    pp_common_ajax_callback('/qapi/comments/root/subscribe_toggle/', { root_id: root_id }, function(data) {
        if (data.success)
            $(container).text(data.text);
        else
            window.alert(data.error);
    });
}

function pp_comment_root_subscribe_delete(id, container) { 
    pp_common_ajax_callback('/qapi/comments/root/subscribe_delete/', { id: id }, function(data) {
        if (data.success)
            $(container).hide();
        else
            window.alert(data.error);
    });
} 

function xx_toggle_help(parent_id) {
    var helpdiv = $('#' + parent_id + '_help_box');
    var helpa = $('#' + parent_id + '_help');
    if (!helpdiv.is(':visible')) {
        helpdiv.html('<table class="comment-help-table">'
            + '<thead><tr><th><em>you type:</em></th><th><em>you see:</em></th></tr></thead>'
            + '<tbody><tr><td>*italics*</td><td><em>italics</em></td></tr>'
            + '<tr><td>**bold**</td><td><b>bold</b></td></tr>'
            + '<tr><td>~~strikethrough~~</td><td><strike>strikethrough</strike></td></tr>'
            + '<tr><td>super^script</td><td>super<sup>script</sup></td></tr>'
            + '<tr><td>&gt; quoted text</td><td><div class="markdown"><blockquote><p>quoted text</p></blockquote></div></td></tr>'
            + '<tr><td>[pcpartpicker](http://pcpartpicker.com)</td><td><a href="http://pcpartpicker.com">pcpartpicker</a></td></tr>'
            + '<tr><td>Lines starting with four spaces<br/>are treated like code:<br/><br/><span class="spaces">&nbsp;&nbsp;&nbsp;&nbsp;</span>if 1 * 2 &lt 3:<br/><span class="spaces">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>print "hello, world!"<br/></td><td><div class="markdown">Lines starting with four spaces<br/>are treated like code:<br/><pre><code>if 1 * 2 &lt 3:\u000D\u000A    print "hello, world!"</code></pre></div></td></tr>'
            + '<tr><td>* item 1<br/>* item 2<br/>* item 3</td><td><ul><li>item 1</li><li>item 2</li><li>item 3</li></ul></td></tr></tbody>'
            + '</table>');
        helpdiv.show();
        helpa.html('Hide Help');
    }
    else {
        helpdiv.hide();
        helpa.html('Formatting Help');
    }
}
function cx_make_comment_edit_form(root_id, parent_id, comment_id, text) {
    s = '<form class="comment_form">'
        + '<div class="comment-edit-form">'
            + '<input type="hidden" name="root_id" value="' + root_id + '">'
            + '<input type="hidden" name="parent_id" value="' + parent_id + '">'
            + '<input type="hidden" name="comment_id" value="' + comment_id + '">'
            + '<input type="hidden" name="mode" value="edit">'
            + '<textarea id="cx' + comment_id + '_textarea" rows="8" name="message">' + text + '</textarea>'
            + '<input type="submit" value="Save" class="button xs-mr1" onclick="cx_submit_edit(this,' + comment_id + ');return false;">'
            + '<input type="button" value="Cancel" class="button button--secondary button--negative xs-mr1" onclick="cx_edit_toggle(' + root_id + ',' + parent_id + ',' + comment_id + ');return false;">'
            + '<a href="#" class="comment-help-link" id="cx' + comment_id + '_help" onclick="xx_toggle_help(\'cx' + comment_id + '\');return false;">Formatting Help</a>'
            + '<div id="cx' + comment_id + '_form_error" class="comment-form-error" style="display:none;"></div>'
            + '<div id="cx' + comment_id + '_help_box" class="comment-help-box" style="display:none;"></div>'
        + '</div>'
    + '</form>';
    return s;
}
function cx_make_comment_reply_form(root_id, parent_id, permanent) {
    s = '<form class="comment_form">'
        + '<div class="comment-edit-form">'
            + '<input type="hidden" name="root_id" value="' + root_id + '">'
            + '<input type="hidden" name="parent_id" value="' + parent_id + '">'
            + '<input type="hidden" name="comment_id" value="0">'
            + '<input type="hidden" name="mode" value="reply">'
            + '<textarea id="cx' + parent_id + '_textarea" rows="8" name="message"></textarea>'
            + '<input type="submit" value="Save" class="button xs-mr1" onclick="cx_submit_reply(this,' + parent_id + ',' + permanent + ');return false;">';
    if (!permanent)
        s += '<input type="button" value="Cancel" class="button button--secondary button--negative xs-mr1" onclick="cx_reply_toggle(' + root_id + ',' + parent_id + ',' + permanent + ');return false;">';
    s += '<a href="#" class="comment-help-link" id="cx' + parent_id + '_help" onclick="xx_toggle_help(\'cx' + parent_id + '\');return false;">Formatting Help</a>'
        + '<div id="cx' + parent_id + '_form_error" class="comment-form-error"></div>'
        + '<div id="cx' + parent_id + '_help_box" class="comment-help-box" style="display:none;"></div>'
        + '</div>'
    + '</form>';
    return s;
}
function mx_make_comment_reply_form(message_id) {
    s = '<form class="comment_form">'
        + '<div class="comment-edit-form">'
            + '<input type="hidden" name="message_id" value="' + message_id + '">'
            + '<textarea id="mx' + message_id + '_textarea" rows="8" name="message"></textarea>'
            + '<input type="submit" value="Save" class="button xs-mr1" onclick="mx_submit_reply(this,' + message_id + ');return false;">'
            + '<input type="button" value="Cancel" class="button button--secondary button--negative xs-mr1" onclick="mx_reply_toggle(' + message_id + ');return false;">'
            + '<a href="#" class="comment-help-link" id="mx' + message_id + '_help" onclick="xx_toggle_help(\'mx' + message_id + '\');return false;">Formatting Help</a>'
            + '<div id="mx' + message_id + '_form_error" class="comment-form-error"></div>'
            + '<div id="mx' + message_id + '_help_box" class="comment-help-box" style="display:none;"></div>';
        + '</div>'
    + '</form>'
    return s;
}


function pp_partlist_replace(identifier, tag) { pp_common_ajax_callback('/qapi/partlist/replace/', { identifier: identifier, replace_with: tag }); }
function pp_partlist_delete(identifier) { pp_common_ajax_callback('/qapi/partlist/delete/', { identifier: identifier }); }
function pp_partlist_upp_delete(upp_id) { pp_common_ajax_callback('/qapi/partlist/upp/delete/', { upp_id: upp_id }); }
function pp_partlist_add(tag, quantity) { pp_common_ajax_callback('/qapi/partlist/add/', { tag: tag, quantity: quantity }); }
function pp_partlist_add_by_identifier(identifier) { pp_common_ajax_callback('/qapi/partlist/add_another_by_identifier/', { identifier: identifier }); }
function pp_partlist_add_from_favorite(xid) { pp_common_ajax_callback('/qapi/partlist/add_from_favorite/', { xid: xid }); }
function pp_partlist_add_from_inventory(xid) { pp_common_ajax_callback('/qapi/partlist/add_from_inventory/', { xid: xid }); }
function pp_partlist_edit(permalink_tag) { pp_common_ajax_callback('/qapi/partlist/edit/', { permalink_tag: permalink_tag }); }
function pp_partlist_delete_all() { pp_common_ajax_callback('/qapi/partlist/delete/all/', { }); }
function pp_partlist_delete_all_custom_prices() { pp_common_ajax_callback('/qapi/partlist/delete/custom_prices/', { }); }
function pp_partlist_render_into_container(mode, obj_type, obj_tag, partlist_type, partlist_tag, container, callback) {
    pp_common_ajax_callback('/qapi/partlist/render/', {
            mode: mode,
            obj_type: obj_type,
            obj_tag: obj_tag,
            partlist_type: partlist_type,
            partlist_tag: partlist_tag 
        }, function(data) {
            if (data.success)
                $(container).html(data.content);
            else
                $(container).html(data.error);
            if (callback)
                callback(data);
        }
    );
}
function init_partlist_price_dialog(obj_data) {
    $('a.change-price').on('click', function(){
        var obj_index = parseInt($(this).data('obj-index'));
        show_price_dialog(obj_index);
        return false;
    });
    $('#change_price_select input').each(function(i_element, element) {
        $(element).on('click', function() {
            var mode = $('#change_price_select input:radio[name=mode]:checked').val();
            _set_price_dialog_enables(mode);
        });
    });
    function _set_price_dialog_enables(mode) {
        if (mode == 'preferred') {
            $('.price-manual-options').addClass('gray-out');
            $('.price-merchant-options').addClass('gray-out');
            $('.price-inventory-options').addClass('gray-out');
        }
        else if (mode == 'merchant') {
            $('.price-merchant-options').removeClass('gray-out');
            $('.price-manual-options').addClass('gray-out');
            $('.price-inventory-options').addClass('gray-out');
        }
        else if (mode == 'manual') {
            $('.price-merchant-options').addClass('gray-out');
            $('.price-manual-options').removeClass('gray-out');
            $('.price-inventory-options').addClass('gray-out');
        }
        else if (mode == 'inventory') {
            $('.price-merchant-options').addClass('gray-out');
            $('.price-manual-options').addClass('gray-out');
            $('.price-inventory-options').removeClass('gray-out');
        }
        if (mode == 'manual')
            $('.price-manual-options input').attr('disabled', false);
        else
            $('.price-manual-options input').attr('disabled', true);
        $('#change_price_merchant_select').prop('disabled', (mode != 'merchant'));
        $('#change_price_inventory_select').prop('disabled', (mode != 'inventory'));
    }
    function show_price_dialog(obj_index) {
        for (var i in obj_data) {
            var obj_d = obj_data[i];
            if (obj_d.index == obj_index) {
                $('#change_price_identifier').val(obj_d.identifier);
                /* check appropriate radio button */
                $('#change_price_' + obj_d.custom_price.mode).prop('checked', true);
                $('#price_manual_purchased').prop('checked', obj_d.custom_price.purchased);
                _set_price_dialog_enables(obj_d.custom_price.mode);
                if (obj_d.custom_price.merchant_id != undefined)
                    $('#change_price_merchant_select').val(obj_d.custom_price.merchant_id);
                if (obj_d.custom_price.price != undefined)
                    $('#change_price_custom_price').val(obj_d.custom_price.price);
                /* populate inventory field */
                if (obj_d.inventory.length) {
                    var inventory_content = '';
                    for (var j in obj_d.inventory)
                        inventory_content += '<option value="' + obj_d.inventory[j].id + '">' + obj_d.inventory[j].description + '</option>';
                    $('#change_price_inventory_select').html(inventory_content);
                    $('#change_price_inventory_row').show();
                }
                else {
                    $('#change_price_inventory_select').html('');
                    $('#change_price_inventory_row').hide();
                }
                /* disable inventory if there is none */
                if (obj_d.inventory.length == 0) {
                    $('#change_price_inventory_select').prop('disabled', (obj_d.inventory.length == 0));
                    $('.price-inventory-options').addClass('gray-out');
                }
                r_show_dialog('#partlist_custom_price_dialog');
                return;
            }
        }
    }
}

var g_markup_type = 'markdown';
var g_markup_merchant_select = 'preferred';
var g_markup_merchant = -1;
function init_partlist_markup_dialog(permalink_tag, parametric_tags, open_identifer) {
    function open_markup(t, dest) {
        $('#markup_text').html('Loading...');
        $('input#markup_selection_' + dest).prop('checked', true);
        r_show_dialog('#partlist_markup_dialog', false);
        g_markup_type = t;
        fetch_markup();
    }
    function fetch_markup() {
        $('#markup_text').html('Loading...');
        pp_common_ajax_callback('/qapi/partlist/markup/post/',
            {
                'mode': g_markup_type,
                'select': g_markup_merchant_select,
                'merchant': g_markup_merchant,
                'partlist': permalink_tag,
                'parametric_tags': parametric_tags
            },
            function(data) {
                if (data.success) {
                    $('#markup_text').html(data.content).focus().select().scrollTop(0);
                }
                else {
                    $('#markup_text').html(data.error).focus().select().scrollTop(0);
                }
            }
        );
    }
    $('#markup_merchant_select input').each(function(i_element, element) {
        $(element).on('click', function() {
            g_markup_merchant_select = $(this)[0].id.substring('markup_merchant_'.length);
            g_markup_merchant = $('#markup_single_merchant').val();
            $('#markup_single_merchant').prop('disabled', (g_markup_merchant_select != 'single'));
            fetch_markup();
        });
    });
    $('#markup_single_merchant').on('change', function() {
        g_markup_merchant = $(this).val();
        fetch_markup();
    });
    function _open_markup_dialog(o) {
        var markup_mode = $(o).data('markup-mode');
        var markup_destination = $(o).data('markup-destination');
        open_markup(markup_mode, markup_destination);
    }
    $(open_identifer).on('click', function() { _open_markup_dialog(this); return false; });
    $('#markup_selection input').on('click', function() { _open_markup_dialog(this); return true; });
}

function init_partlist_save_dialog(ccabbr, permalink_tag, open_identifier) {
    $(open_identifier).on('click', function(){
        r_show_dialog('#partlist_save_dialog', '#partlist_save_new_text');
        pp_common_ajax_callback('/qapi/partlist/save_as/choices/', { cc: ccabbr, partlist: permalink_tag }, function(data) {
            if (data.success) {
                $('#partlist_save_dialog_overwrite_choices').html(data.content);
                $('#partlist_save_existing_choice').on('click', function(){
                    var rbutton = $('input:radio[name=save_choice]');
                    $(rbutton[0]).prop('checked', false);
                    $(rbutton[1]).prop('checked', true);
                });
                $('#partlist_save_new_text').on('click', function(){
                    var rbutton = $('input:radio[name=save_choice]');
                    $(rbutton[1]).prop('checked', false);
                    $(rbutton[0]).prop('checked', true);
                });
            }
            else
                $('#partlist_save_dialog_overwrite_choices').html('An error has occurred.');
        });
        return false;
    });
}

function async_load_partlist_price_history_responsive(selector, currency_str, request_data, upps) {
    pp_common_ajax_callback(
        '/qapi/partlist/pricehistory/',
        request_data,
        function(data) {
            if (data.success) {
                var plots = [];
                for (var i in data.plots) {
                    var plot_data = data.plots[i];
                    plots.push({
                        label: plot_data.quantity + plot_data.name,
                        data: plot_data.data,
                        lines: {
                            show: true,
                            steps: true,
                            lineWidth: 2
                        },
                        shadowSize: 0
                    });
                }
                for (var i in upps) {
                    var upp = upps[i];
                    plots.push({
                        label: upp.description,
                        data: [[data.start_ms, upp.amount], [data.end_ms, upp.amount]],
                        lines: {
                            show: true,
                            steps: true,
                            lineWidth: 2
                        },
                        shadowSize: 0
                    });
                }
                var plot = $.plot($(selector + ' div.price-history-chart'), plots,
                    {
                        series: {
                            stack: true,
                            lines: {
                                fill: true
                            }
                        },
                        legend: {
                            show: false
                        },
                        xaxis: {
                            mode: 'time',
                            minTickSize: [1, "day"],
                            tickSize: [7, "day"]
                        },
                        yaxis: {
                            tickFormatter: function(v, axis) { v /= 100.0; return currency_str + v.toFixed(2); }
                        }
                    });
                update_flot_legend_responsive(plot, selector + ' .price-history-legend');
            }
            else {
                $(selector + ' div.price-history-chart').html(data.error);
            }
        }
    );
}





/**!
* PCPartPicker Tablesorter Fork, adapted from existing tablesorter code.
* copyright notice of original implementation below:
*
* TableSorter (FORK) 2.18.3 - Client-side table sorting with ease!
* @requires jQuery v1.2.6+
*
* Copyright (c) 2007 Christian Bach
* Examples and docs at: http://tablesorter.com
* Dual licensed under the MIT and GPL licenses:
* http://www.opensource.org/licenses/mit-license.php
* http://www.gnu.org/licenses/gpl.html
*
* @type jQuery
* @name tablesorter (FORK)
* @cat Plugins/Tablesorter
* @author Christian Bach/christian.bach@polyester.se
* @contributor Rob Garrison/https://github.com/Mottie/tablesorter
*/
/*jshint browser:true, jquery:true, unused:false, expr: true */
/*global console:false, alert:false */
!(function($) {
	"use strict";
	$.extend({
		/*jshint supernew:true */
		pcpptablesorter: new function() {

			var ts = this;

			ts.version = "0.0.1";

			ts.defaults = {

				// *** appearance
				theme            : 'default',  // adds tablesorter-{theme} to the table for styling

				headerTemplate   : '{content}',// header layout template (HTML ok); {content} = innerHTML, {icon} = <i/> (class from cssIcon)

				// *** functionality
				cancelSelection  : true,       // prevent text selection in the header
				tabIndex         : true,       // add tabindex to header for keyboard accessibility
				sortMultiSortKey : 'shiftKey', // key used to select additional columns
				sortResetKey     : 'ctrlKey',  // key used to remove sorting on a column

				// *** sort options
				headers          : {},         // set sorter, string, empty, locked order, sortInitialOrder, filter, etc.
				sortList         : [],         // Initial sort order; applied initially; updated when manually sorted

				sortInitialOrder : 'asc',      // sort direction on first click

				// *** callbacks
				initialized      : null,       // function(table){},

				// *** extra css class names
				tableClass       : '',
				cssAsc           : '',
				cssDesc          : '',
				cssNone          : '',
				cssHeader        : '',
				cssHeaderRow     : '',
				cssProcessing    : '', // processing icon applied to header during sort/filter

				cssChildRow      : 'tablesorter-childRow', // class name indiciating that a row is to be attached to the its parent
				cssIcon          : 'tablesorter-icon',     //  if this class exists, a <i> will be added to the header automatically
				cssIconNone      : '', // class name added to the icon when there is no column sort
				cssIconAsc       : '', // class name added to the icon when the column has an ascending sort
				cssIconDesc      : '', // class name added to the icon when the column has a descending sort
				cssInfoBlock     : 'tablesorter-infoOnly', // don't sort tbody with this class name (only one class name allowed here!)
				cssAllowClicks   : 'tablesorter-allowClicks', // class name added to table header which allows clicks to bubble up

				// *** selectors
				selectorHeaders  : '> thead th, > thead td',
				selectorSort     : 'th, td',   // jQuery selector of content within selectorHeaders that is clickable to trigger a sort
				selectorRemove   : '.remove-me',

				// *** Internal variables
				headerList: [],
			};

			// internal css classes - these will ALWAYS be added to
			// the table and MUST only contain one class name - fixes #381
			ts.css = {
				table      : 'tablesorter',
				cssHasChild: 'tablesorter-hasChildRow',
				childRow   : 'tablesorter-childRow',
				header     : 'tablesorter-header',
				headerRow  : 'tablesorter-headerRow',
				headerIn   : 'tablesorter-header-inner',
				icon       : 'tablesorter-icon',
				info       : 'tablesorter-infoOnly',
				processing : 'tablesorter-processing',
				sortAsc    : 'tablesorter-headerAsc',
				sortDesc   : 'tablesorter-headerDesc',
				sortNone   : 'tablesorter-headerUnSorted'
			};

			// labels applied to sortable headers for accessibility (aria) support
			ts.language = {
				sortAsc  : 'Ascending sort applied, ',
				sortDesc : 'Descending sort applied, ',
				sortNone : 'No sort applied, ',
				nextAsc  : 'activate to apply an ascending sort',
				nextDesc : 'activate to apply a descending sort',
				nextNone : 'activate to remove the sort'
			};

			function formatSortingOrder(v) {
				// look for "d" in "desc" order; return true
				return (/^d/i.test(v) || v === 1);
			}

			function buildHeaders(table) {
				var ch, $t,
					h, i, t, lock, time,
					c = table.config;
				c.headerList = [];
				c.headerContent = [];
				// children tr in tfoot - see issue #196 & #547
				c.columns = ts.computeColumnIndex( c.$table.children('thead, tfoot').children('tr') );
				// add icon if cssIcon option exists
				i = c.cssIcon ? '<i class="' + ( c.cssIcon === ts.css.icon ? ts.css.icon : c.cssIcon + ' ' + ts.css.icon ) + '"></i>' : '';
				// redefine c.$headers here in case of an updateAll that replaces or adds an entire header cell - see #683
				c.$headers = $(table).find(c.selectorHeaders).each(function(index) {
					$t = $(this);
					// make sure to get header cell & not column indexed cell
					ch = ts.getColumnData( table, c.headers, index, true );
					// save original header content
					c.headerContent[index] = $(this).html();
					// if headerTemplate is empty, don't reformat the header cell
					if ( c.headerTemplate !== '' ) {
						// set up header template
						t = c.headerTemplate.replace(/\{content\}/g, $(this).html()).replace(/\{icon\}/g, i);
						$(this).html('<div class="' + ts.css.headerIn + '">' + t + '</div>'); // faster than wrapInner
					}
					// *** remove this.column value if no conflicts found
					this.column = parseInt( $(this).attr('data-column'), 10);
					this.order = formatSortingOrder( ts.getData($t, ch, 'sortInitialOrder') || c.sortInitialOrder ) ? [1,0,2] : [0,1,2];
					this.count = -1; // set to -1 because clicking on the header automatically adds one
					this.lockedOrder = false;
					lock = ts.getData($t, ch, 'lockedOrder') || false;
					if (typeof lock !== 'undefined' && lock !== false) {
						this.order = this.lockedOrder = formatSortingOrder(lock) ? [1,1,1] : [0,0,0];
					}
					$t.addClass(ts.css.header + ' ' + c.cssHeader);
					// add cell to headerList
					c.headerList[index] = this;
					// add to parent in case there are multiple rows
					$t.parent().addClass(ts.css.headerRow + ' ' + c.cssHeaderRow).attr('role', 'row');
					// allow keyboard cursor to focus on element
					if (c.tabIndex) { $t.attr("tabindex", 0); }
				}).attr({
					scope: 'col',
					role : 'columnheader'
				});
				// enable/disable sorting
				updateHeader(table);
			}

			function updateHeader(table) {
				var s, $th, col,
					c = table.config;
				c.$headers.each(function(index, th){
					$th = $(th);
					col = ts.getColumnData( table, c.headers, index, true );
					// add "sorter-false" class if "parser-false" is set
					s = ts.getData( th, col, 'sorter' ) === 'false' || ts.getData( th, col, 'parser' ) === 'false';
					th.sortDisabled = s;
					$th[ s ? 'addClass' : 'removeClass' ]('sorter-false').attr('aria-disabled', '' + s);
					// aria-controls - requires table ID
					if (table.id) {
						if (s) {
							$th.removeAttr('aria-controls');
						} else {
							$th.attr('aria-controls', table.id);
						}
					}
				});
			}

			function setHeadersCss(table) {
				var f, i, j,
					c = table.config,
					list = c.sortList,
					len = list.length,
					none = ts.css.sortNone + ' ' + c.cssNone,
					css = [ts.css.sortAsc + ' ' + c.cssAsc, ts.css.sortDesc + ' ' + c.cssDesc],
					cssIcon = [ c.cssIconAsc, c.cssIconDesc, c.cssIconNone ],
					aria = ['ascending', 'descending'];
				// remove all header information
				c.$headers
					.removeClass(css.join(' '))
					.addClass(none).attr('aria-sort', 'none')
					.find('.' + c.cssIcon)
					.removeClass(cssIcon.join(' '))
					.addClass(cssIcon[2]);
				for (i = 0; i < len; i++) {
					// direction = 2 means reset!
					if (list[i][1] !== 2) {
						// multicolumn sorting updating - choose the :last in case there are nested columns
						f = c.$headers.not('.sorter-false').filter('[data-column="' + list[i][0] + '"]' + (len === 1 ? ':last' : '') );
						if (f.length) {
							for (j = 0; j < f.length; j++) {
								if (!f[j].sortDisabled) {
									f.eq(j)
										.removeClass(none)
										.addClass(css[list[i][1]])
										.attr('aria-sort', aria[list[i][1]])
										.find('.' + c.cssIcon)
										.removeClass(cssIcon[2])
										.addClass(cssIcon[list[i][1]]);
								}
							}
						}
					}
				}
				// add verbose aria labels
				c.$headers.not('.sorter-false').each(function(){
					var $this = $(this),
						nextSort = this.order[(this.count + 1) % 2],
						txt = $this.text() + ': ' +
							ts.language[ $this.hasClass(ts.css.sortAsc) ? 'sortAsc' : $this.hasClass(ts.css.sortDesc) ? 'sortDesc' : 'sortNone' ] +
							ts.language[ nextSort === 0 ? 'nextAsc' : nextSort === 1 ? 'nextDesc' : 'nextNone' ];
					$this.attr('aria-label', txt );
				});
			}

			function updateHeaderSortCount(table, list) {
				var s, t, o, col, primary,
					c = table.config,
					sl = list || c.sortList;
				c.sortList = [];
				$.each(sl, function(i,v){
					// ensure all sortList values are numeric - fixes #127
					col = parseInt(v[0], 10);
					// make sure header exists
					o = c.$headers.filter('[data-column="' + col + '"]:last')[0];
					if (o) { // prevents error if sorton array is wrong
						// o.count = o.count + 1;
						t = ('' + v[1]).match(/^(1|d|s|o|n)/);
						t = t ? t[0] : '';
						// 0/(a)sc (default), 1/(d)esc, (s)ame, (o)pposite, (n)ext
						switch(t) {
							case '1': case 'd': // descending
								t = 1;
								break;
							case 's': // same direction (as primary column)
								// if primary sort is set to "s", make it ascending
								t = primary || 0;
								break;
							case 'o':
								s = o.order[(primary || 0) % 2];
								// opposite of primary column; but resets if primary resets
								t = s === 0 ? 1 : s === 1 ? 0 : 2;
								break;
							case 'n':
								o.count = o.count + 1;
								t = o.order[(o.count) % 2];
								break;
							default: // ascending
								t = 0;
								break;
						}
						primary = i === 0 ? t : primary;
						s = [ col, parseInt(t, 10) || 0 ];
						c.sortList.push(s);
						t = $.inArray(s[1], o.order); // fixes issue #167
						o.count = t >= 0 ? t : s[1] % 2;
					}
				});
			}

			function initSort(table, cell, event){
				var arry, indx, col, order, s,
					c = table.config,
					key = !event[c.sortMultiSortKey],
					$table = c.$table;
				// get current column sort order
				cell.count = event[c.sortResetKey] ? 2 : (cell.count + 1) % 2;
				// get current column index
				indx = parseInt( $(cell).attr('data-column'), 10 );
				// user only wants to sort on one column
				if (key) {
					// flush the sort list
					c.sortList = [];
					// add column to sort list
					order = cell.order[cell.count];
					if (order < 2) {
						c.sortList.push([indx, order]);
						// add other columns if header spans across multiple
						if (cell.colSpan > 1) {
							for (col = 1; col < cell.colSpan; col++) {
								c.sortList.push([indx + col, order]);
							}
						}
					}
					// multi column sorting
				} else {
					// the user has clicked on an already sorted column
					if (ts.isValueInArray(indx, c.sortList) >= 0) {
						// reverse the sorting direction
						for (col = 0; col < c.sortList.length; col++) {
							s = c.sortList[col];
							order = c.$headers.filter('[data-column="' + s[0] + '"]:last')[0];
							if (s[0] === indx) {
								// order.count seems to be incorrect when compared to cell.count
								s[1] = order.order[cell.count];
								if (s[1] === 2) {
									c.sortList.splice(col,1);
									order.count = -1;
								}
							}
						}
					} else {
						// add column to sort list array
						order = cell.order[cell.count];
						if (order < 2) {
							c.sortList.push([indx, order]);
							// add other columns if header spans across multiple
							if (cell.colSpan > 1) {
								for (col = 1; col < cell.colSpan; col++) {
									c.sortList.push([indx + col, order]);
								}
							}
						}
					}
				}
				setHeadersCss(table);
				$table.trigger("sortEnd", table);
			}

			function bindMethods(table){
				var c = table.config,
					$table = c.$table;
				// apply easy methods that trigger bound events
				$table
				.unbind('sorton destroy mouseup mouseleave '.split(' ').join(c.namespace + ' '))
				.bind("sorton" + c.namespace, function(e, list, callback, init) {
					var c = table.config;
					e.stopPropagation();
					// update header count index
					updateHeaderSortCount(table, list);
					// set css for headers
					setHeadersCss(table);
					$table.trigger("sortEnd", this);
				})
				.bind("destroy" + c.namespace, function(e, c, cb){
					e.stopPropagation();
					ts.destroy(table, c, cb);
				})
			}

			/* public methods */
			ts.construct = function(settings) {
				return this.each(function() {
					var table = this,
						// merge & extend config options
						c = $.extend(true, {}, ts.defaults, settings);
						// save initial settings
						c.originalSettings = settings;
					// create a table from data (build table widget)
					if (!table.hasInitialized && ts.buildTable && this.tagName !== 'TABLE') {
						// return the table (in case the original target is the table's container)
						ts.buildTable(table, c);
					} else {
						ts.setup(table, c);
					}
				});
			};

			ts.setup = function(table, c) {
				// if no thead or tbody, or tablesorter is already present, quit
				if (!table || !table.tHead || table.tBodies.length === 0 || table.hasInitialized === true) {
					return '';
				}

				var k = '',
					$table = $(table),
					m = $.metadata;
				// initialization flag
				table.hasInitialized = false;
				// make sure to store the config object
				table.config = c;
				// save the settings where they read
				$.data(table, "tablesorter", c);

				// removing this in version 3 (only supports jQuery 1.7+)
				c.supportsDataObject = (function(version) {
					version[0] = parseInt(version[0], 10);
					return (version[0] > 1) || (version[0] === 1 && parseInt(version[1], 10) >= 4);
				})($.fn.jquery.split("."));
				// digit sort text location; keeping max+/- for backwards compatibility
				c.string = { 'max': 1, 'min': -1, 'emptymin': 1, 'emptymax': -1, 'zero': 0, 'none': 0, 'null': 0, 'top': true, 'bottom': false };
				// add table theme class only if there isn't already one there
				if (!/tablesorter\-/.test($table.attr('class'))) {
					k = (c.theme !== '' ? ' tablesorter-' + c.theme : '');
				}
				c.table = table;
				c.$table = $table
					.addClass(ts.css.table + ' ' + c.tableClass + k)
					.attr('role', 'grid');
				c.$headers = $table.find(c.selectorHeaders);

				// give the table a unique id, which will be used in namespace binding
				if (!c.namespace) {
					c.namespace = '.tablesorter' + Math.random().toString(16).slice(2);
				} else {
					// make sure namespace starts with a period & doesn't have weird characters
					c.namespace = '.' + c.namespace.replace(/\W/g,'');
				}

				c.$table.children().children('tr').attr('role', 'row');
				c.$tbodies = $table.children('tbody:not(.' + c.cssInfoBlock + ')').attr({
					'aria-live' : 'polite',
					'aria-relevant' : 'all'
				});
				if (c.$table.children('caption').length) {
					k = c.$table.children('caption')[0];
					if (!k.id) { k.id = c.namespace.slice(1) + 'caption'; }
					c.$table.attr('aria-labelledby', k.id);
				}
				// build headers
				buildHeaders(table);
				// start total row count at zero
				c.totalRows = 0;
				// bind all header events and methods
				ts.bindEvents(table, c.$headers, true);
				bindMethods(table);
				// get sort list from jQuery data or metadata
				// in jQuery < 1.4, an error occurs when calling $table.data()
				if (c.supportsDataObject && typeof $table.data().sortlist !== 'undefined') {
					c.sortList = $table.data().sortlist;
				} else if (m && ($table.metadata() && $table.metadata().sortlist)) {
					c.sortList = $table.metadata().sortlist;
				}
				// if user has supplied a sort list to constructor
				if (c.sortList.length > 0) {
					$table.trigger("sorton", [c.sortList, {}, false, true]);
				} else {
					setHeadersCss(table);
				}

				// initialized
				table.hasInitialized = true;
				$table.trigger('tablesorter-initialized', table);
				if (typeof c.initialized === 'function') { c.initialized(table); }
			};

			ts.getColumnData = function(table, obj, indx, getCell){
				if (typeof obj === 'undefined' || obj === null) { return; }
				table = $(table)[0];
				var result, $h, k,
					c = table.config;
				if (obj[indx]) {
					return getCell ? obj[indx] : obj[c.$headers.index( c.$headers.filter('[data-column="' + indx + '"]:last') )];
				}
				for (k in obj) {
					if (typeof k === 'string') {
						$h = c.$headers.filter('[data-column="' + indx + '"]:last')
							// header cell with class/id
							.filter(k)
							// find elements within the header cell with cell/id
							.add( c.$headers.filter('[data-column="' + indx + '"]:last').find(k) );
						if ($h.length) {
							return obj[k];
						}
					}
				}
				return result;
			};

			// computeTableHeaderCellIndexes from:
			// http://www.javascripttoolbox.com/lib/table/examples.php
			// http://www.javascripttoolbox.com/temp/table_cellindex.html
			ts.computeColumnIndex = function(trs) {
				var matrix = [],
				lookup = {},
				cols = 0, // determine the number of columns
				i, j, k, l, $cell, cell, cells, rowIndex, cellId, rowSpan, colSpan, firstAvailCol, matrixrow;
				for (i = 0; i < trs.length; i++) {
					cells = trs[i].cells;
					for (j = 0; j < cells.length; j++) {
						cell = cells[j];
						$cell = $(cell);
						rowIndex = cell.parentNode.rowIndex;
						cellId = rowIndex + "-" + $cell.index();
						rowSpan = cell.rowSpan || 1;
						colSpan = cell.colSpan || 1;
						if (typeof(matrix[rowIndex]) === "undefined") {
							matrix[rowIndex] = [];
						}
						// Find first available column in the first row
						for (k = 0; k < matrix[rowIndex].length + 1; k++) {
							if (typeof(matrix[rowIndex][k]) === "undefined") {
								firstAvailCol = k;
								break;
							}
						}
						lookup[cellId] = firstAvailCol;
						cols = Math.max(firstAvailCol, cols);
						// add data-column
						$cell.attr({ 'data-column' : firstAvailCol }); // 'data-row' : rowIndex
						for (k = rowIndex; k < rowIndex + rowSpan; k++) {
							if (typeof(matrix[k]) === "undefined") {
								matrix[k] = [];
							}
							matrixrow = matrix[k];
							for (l = firstAvailCol; l < firstAvailCol + colSpan; l++) {
								matrixrow[l] = "x";
							}
						}
					}
				}
				// may not be accurate if # header columns !== # tbody columns
				return cols + 1; // add one because it's a zero-based index
			};

			ts.bindEvents = function(table, $headers, core){
				table = $(table)[0];
				var downTime,
					c = table.config;
				if (core !== true) {
					c.$extraHeaders = c.$extraHeaders ? c.$extraHeaders.add($headers) : $headers;
				}
				// apply event handling to headers and/or additional headers (stickyheaders, scroller, etc)
				$headers
				// http://stackoverflow.com/questions/5312849/jquery-find-self;
				.find(c.selectorSort).add( $headers.filter(c.selectorSort) )
				.unbind('mousedown mouseup sort keyup '.split(' ').join(c.namespace + ' '))
				.bind('mousedown mouseup sort keyup '.split(' ').join(c.namespace + ' '), function(e, external) {
					var cell, type = e.type;
					// only recognize left clicks or enter
					if ( ((e.which || e.button) !== 1 && !/sort|keyup/.test(type)) || (type === 'keyup' && e.which !== 13) ) {
						return;
					}
					// ignore long clicks (prevents resizable widget from initializing a sort)
					if (type === 'mouseup' && external !== true && (new Date().getTime() - downTime > 250)) { return; }
					// set timer on mousedown
					if (type === 'mousedown') {
						downTime = new Date().getTime();
						return /(input|select|button|textarea)/i.test(e.target.tagName) ||
							// allow clicks to contents of selected cells
							$(e.target).closest('td,th').hasClass(c.cssAllowClicks) ? '' : !c.cancelSelection;
					}
					// jQuery v1.2.6 doesn't have closest()
					cell = $.fn.closest ? $(this).closest('th, td')[0] : /TH|TD/.test(this.tagName) ? this : $(this).parents('th, td')[0];
					// reference original table headers and find the same cell
					cell = c.$headers[ $headers.index( cell ) ];
					if (!cell.sortDisabled) {
						initSort(table, cell, e);
					}
				});
				if (c.cancelSelection) {
					// cancel selection
					$headers
						.attr('unselectable', 'on')
						.bind('selectstart', false)
						.css({
							'user-select': 'none',
							'MozUserSelect': 'none' // not needed for jQuery 1.8+
						});
				}
			};

			// restore headers
			ts.restoreHeaders = function(table){
				var c = $(table)[0].config;
				// don't use c.$headers here in case header cells were swapped
				c.$table.find(c.selectorHeaders).each(function(i){
					// only restore header cells if it is wrapped
					// because this is also used by the updateAll method
					if ($(this).find('.' + ts.css.headerIn).length){
						$(this).html( c.headerContent[i] );
					}
				});
			};

			ts.destroy = function(table, removeClasses, callback){
				table = $(table)[0];
				if (!table.hasInitialized) { return; }
				var $t = $(table), c = table.config,
				$h = $t.find('thead:first'),
				$r = $h.find('tr.' + ts.css.headerRow).removeClass(ts.css.headerRow + ' ' + c.cssHeaderRow);
				// remove widget added rows, just in case
				$h.find('tr').not($r).remove();
				// disable tablesorter
				$t
					.removeData('tablesorter')
					.unbind('sorton destroy mouseup mouseleave keypress sortEnd'.split(' ').join(c.namespace + ' '));
				c.$headers
					.removeClass( [ts.css.header, c.cssHeader, c.cssAsc, c.cssDesc, ts.css.sortAsc, ts.css.sortDesc, ts.css.sortNone].join(' ') )
					.removeAttr('data-column')
					.removeAttr('aria-label')
					.attr('aria-disabled', 'true');
				$r.find(c.selectorSort).unbind('mousedown mouseup keypress '.split(' ').join(c.namespace + ' '));
				ts.restoreHeaders(table);
				$t.toggleClass(ts.css.table + ' ' + c.tableClass + ' tablesorter-' + c.theme, removeClasses === false);
				// clear flag in case the plugin is initialized again
				table.hasInitialized = false;
				delete table.config.cache;
				if (typeof callback === 'function') {
					callback(table);
				}
			};

			// *** sort functions ***
			// regex used in natural sort
			ts.regex = {
				chunk : /(^([+\-]?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?)?$|^0x[0-9a-f]+$|\d+)/gi, // chunk/tokenize numbers & letters
				chunks: /(^\\0|\\0$)/, // replace chunks @ ends
				hex: /^0x[0-9a-f]+$/i // hex
			};

			// *** utilities ***
			ts.isValueInArray = function(column, arry) {
				var indx, len = arry.length;
				for (indx = 0; indx < len; indx++) {
					if (arry[indx][0] === column) {
						return indx;
					}
				}
				return -1;
			};

			// get sorter, string, empty, etc options for each column from
			// jQuery data, metadata, header option or header class name ("sorter-false")
			// priority = jQuery data > meta > headers option > header class name
			ts.getData = function(h, ch, key) {
				var val = '', $h = $(h), m, cl;
				if (!$h.length) { return ''; }
				m = $.metadata ? $h.metadata() : false;
				cl = ' ' + ($h.attr('class') || '');
				if (typeof $h.data(key) !== 'undefined' || typeof $h.data(key.toLowerCase()) !== 'undefined'){
					// "data-lockedOrder" is assigned to "lockedorder"; but "data-locked-order" is assigned to "lockedOrder"
					// "data-sort-initial-order" is assigned to "sortInitialOrder"
					val += $h.data(key) || $h.data(key.toLowerCase());
				} else if (m && typeof m[key] !== 'undefined') {
					val += m[key];
				} else if (ch && typeof ch[key] !== 'undefined') {
					val += ch[key];
				} else if (cl !== ' ' && cl.match(' ' + key + '-')) {
					// include sorter class name "sorter-text", etc; now works with "sorter-my-custom-parser"
					val = cl.match( new RegExp('\\s' + key + '-([\\w-]+)') )[1] || '';
				}
				return $.trim(val);
			};
		}()
	});

	// make shortcut
	var ts = $.pcpptablesorter;

	// extend plugin scope
	$.fn.extend({
		pcpptablesorter: ts.construct
	});
})(jQuery);


// Code below Copyright 2019 PCPartPicker, LLC
const entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, function (c) {
    return entityMap[c];
  });
}
function getCookie(name) {
    if (document.cookie) {
        var prefix = name + '=';
        var n = prefix.length;
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.substring(0, n) == prefix) {
                return decodeURIComponent(cookie.substring(n));
            }
        }
    }
    return null;
}

(function() {
    var csrftoken = getCookie('xcsrftoken');
    if (csrftoken) {
        $.ajaxSetup({
            beforeSend: function(xhr, settings) {
                if (!settings.crossDomain && !/^(GET|HEAD|OPTIONS|TRACE)$/.test(settings.type)) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            }
        });
    }
}());


function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    const outputData = outputArray.map((output, index) => rawData.charCodeAt(index));
    return outputData;
}

var zp_kpm = 0;
var zp_p = 0;
var zp_kpmt = new Date().getTime();
var zp_mme = 0;
var zp_mmx = 0;
var zp_mmy = 0;
var zp_fhv = 0;
var zp_fhh = 0;

function pp_get_fragment_state() {
    var state = $.deparam.fragment();
    delete state['qq'];
    return state;
}

function pp_set_fragment_state(state, skip_hashchange) {
    var new_url = window.location.origin + window.location.pathname + window.location.search;
    if (Object.keys(state).length !== 0) {
        var frag_part = $.param.fragment('', state);
        new_url += frag_part;
        $('a.pp-url-hash-target').each(function(i, e){
            e.hash = frag_part;
        });
    }
    window.history.replaceState(null, '', new_url);
    if (!skip_hashchange)
        $(window).trigger('hashchange');
}

function set_limit_compatibility(val) {
    var state = pp_get_fragment_state();
    if (state['page'])
        delete state['page'];
    if (val)
        delete state['xcx'];
    else
        state['xcx'] = 0;
    pp_set_fragment_state(state);
}
function get_limit_compatibility() {
    var state = pp_get_fragment_state();
    if (state['xcx'])
        return (state['xcx'] != '0');
    return true;
}
function filter_set_page(pagenum) {
    var state = pp_get_fragment_state();
    state['page'] = pagenum;
    pp_set_fragment_state(state);
}
function filter_set_sort(s) {
    var state = pp_get_fragment_state();
    if (s.length)
        state['sort'] = s;
    else if (state['sort']) {
        delete state['sort'];
    }
    state['page'] = 1;
    pp_set_fragment_state(state);
}
function filter_clear_selection() {
    var state = pp_get_fragment_state();
    if (state['select'])
        delete state['select'];
    pp_set_fragment_state(state, true);
}
function update_state(key, value) {
    var state = pp_get_fragment_state();
    // Any filter change results in a page reset
    if (state['page'])
        delete state['page'];
    // Any filter set back to default is removed from the hash fragment
    if (value == '' || value == undefined)
        delete state[key];
    else
        state[key] = value;
    // Push new state into the browser history.
    pp_set_fragment_state(state);
}
function update_state_from_list_filter(key) {
    // Enumerate all the checked items.
    var clicked_ids = [];
    var key_length = key.length;
    $('#' + key + '_set li input.filteritem').each(function (index, element) {
        if ($(this).is(':checked')) {
            var id = $(this).data('value-id');
            clicked_ids.push(id);
        }
    });
    var value = clicked_ids.join(',');
    update_state(key, value);
}
function update_state_from_selector_filter(key, value) {
    if (value == 'all') {
        value = ''
    }
    update_state(key, value)
}
function update_state_from_dualslide_filter(name, values) {
    var state = pp_get_fragment_state();
    if (state['page'])
        state['page'] = 1;
    if (values.length)
        state[name] = values.join(',');
    else
        delete state[name];
    pp_set_fragment_state(state);
}
function string_to_array(s) {
    if (s)
        return s.split(',');
    return [];
}
function update_filters_from_state(state, datafilters) {
    function in_array(a, x) { for (var i in a) { if (a[i] === x) return true; } return false; }

    $('#compatibility_enabled').prop('checked', get_limit_compatibility());
    for (var i in datafilters) {
        var datafilter = datafilters[i];
        if (datafilter.style == 'list') {
            var filter_state = string_to_array(state[datafilter.prefix]);
            var needs_show_all = false;

            var df_ul = $('ul#' + datafilter.prefix + '_set');
            for (var j in datafilter.items) {
                var is_checked = in_array(filter_state, datafilter.items[j].id);
                var item_input = df_ul.find('input.filteritem[data-value-id="' + datafilter.items[j].id + '"]');
                item_input.prop('checked', is_checked);
                var item_li = item_input.closest('li.filter-row-single');
                if (is_checked) {
                    item_li.show();
                }
                else if (datafilter.items[j].hide && !item_li.is(':visible'))
                    needs_show_all = true;
            }
            $('#' + datafilter.prefix + '_all').prop('checked', (filter_state.length == 0));
            if (needs_show_all)
                $('#showall_' + datafilter.prefix).show();
            else
                $('#showall_' + datafilter.prefix).hide();
            if (filter_state.length != 0)
                $('#filterdiv_' + datafilter.prefix).show();
        }
        else if (datafilter.style == 'selector') {
            var option_value = string_to_array(state[datafilter.prefix]);
            if (option_value == '')
                option_value = 'all';
            $('#' + datafilter.prefix + '_selector').val(option_value);
        }
        else if (datafilter.style == 'dualslide' || datafilter.style == 'priceslide') {
            datafilter.widget.set_slider_values(
                $.map(
                    string_to_array(state[datafilter.prefix]),
                    function (x, i) {
                        return datafilter.hashchange_parser(x);
                    }
                 )
            );
        }
    }
}
function register_filter_handlers(datafilters ) {
    $('#compatibility_enabled').on('click', function () {
        set_limit_compatibility($(this).is(':checked'));
    });

    $.each(datafilters, function (i, datafilter) {
        if (datafilter.style == 'list') {
            $('#' + datafilter.prefix + '_all').on('click', function () {
                if (!$(this).is(':checked'))
                    return false;
                else {
                    $('#' + datafilter.prefix + '_set li input.filteritem').each(function (index, element) {
                        $(this).prop('checked', false);
                    });
                    update_state_from_list_filter(datafilter.prefix);
                    return true;
                }
            });
            $('#' + datafilter.prefix + '_set li input.filteritem').each(function (i_element, element) {
                $(this).on('click', function () {
                    update_state_from_list_filter(datafilter.prefix);
                });
            });
        }
        else if (datafilter.style == 'selector') {
               $('#' + datafilter.prefix + '_selector').on('change', function () {
                update_state_from_selector_filter(datafilter.prefix, $(this).val())
            });
        }
        else if (datafilter.style == 'dualslide') {
            datafilter.widget = new SlideFilter('#filter_slide_' + datafilter.prefix, datafilter, update_state_from_dualslide_filter);
        }
        else if (datafilter.style == 'priceslide') {
            datafilter.widget = new PriceSlideFilter('#filter_slide_' + datafilter.prefix, datafilter, update_state_from_dualslide_filter);
        }
    });
}
function _scr(s) { s.scr=1; s.scr_vw=$(window).width(); s.scr_vh=$(window).height(); s.scr_dw=window.screen.width; s.scr_dh=window.screen.height; s.scr_daw=window.screen.availWidth; s.scr_dah=window.screen.availHeight; s.scr_ddw=$(document).width(); s.scr_ddh=$(document).height(); s.scr_ms=new Date().getTime(); s.scr_wd=0|navigator.webdriver; s.href=window.location.href; s.plg=navigator.plugins.length; s.scr_mme=zp_mme; s.scr_mmw=zp_mmx; s.scr_mmh=zp_mmy; s.zp_kpm=zp_kpm; s.scr_msi=zp_kpmt; s.zp_p=zp_p; s.zp_fhv=zp_fhv; s.zp_fhh=zp_fhh; try { s.scr_tz=Intl.DateTimeFormat().resolvedOptions().timeZone; } catch(e) {}; s.scr_loc=Intl.DateTimeFormat().resolvedOptions().locale || null; s.scr_tp=navigator.maxTouchPoints||-1; s.scr_te=('ontouchstart' in window)||-1;s.scr_pe=('onpointerdown' in window)||-1;return s; }
function fs_format_num(datafilter, x) { return parseInt(x); }
function fs_format_ms(datafilter, x) { return parseInt(x) + ' ms'; }
function fs_format_brightness(datafilter, x) { return parseInt(x) + ' cd/m²'; }
function fs_format_optical_speed(datafilter, x) { return parseInt(x) + 'X'; }
function fs_format_ppunit(datafilter, x) {
    if (datafilter.scale_factor == 1)
        return x + ' ' + datafilter.unit_label;
    return format_mxb(parseInt(x)/(datafilter.scale_factor/1000), ' ' + datafilter.unit_label);
}
function fs_format_cas(datafilter, x) {
    if (x % 10 == 0)
        return (x / 10);
    var _x = x / 10.0;
    return _x.toFixed(1);
}
function format_mxb(x, postfix) {
    if (x % 1000 == 0)
        return (x / 1000) + postfix;
    var _x = x / 1000.0;
    if (x % 100 == 0)
        return _x.toFixed(1) + postfix;
    if (x % 10 == 0)
        return _x.toFixed(2) + postfix;
    return _x.toFixed(3) + postfix;
}
function fs_format_display_inches(datafilter, x) {
    if (x % 100 == 0)
        return (x / 100) + '"';
    var _x = (x * 1.0 / 100);
    if (x % 10 == 0)
        return _x.toFixed(1) + '"';
    return _x.toFixed(2) + '"';
}
function fs_format_prefix_cc(datafilter, p) { return global_country_sign; }
function fs_format_price_whole(datafilter, p) { return parseInt(p); }
function format_price(ccstr, p) { var d = parseInt(p/100); var c = p - (d * 100); if (c < 10) return ccstr + d + '.0' + c; return ccstr + d + '.' + c; }
function parse_int(x) { return parseInt(x); }
function parse_hashchange_legacy_mm(x) { x = parseInt(x); if (x < 1000) x*= 1000000; return x; }
function _ds_format_divd(x, d) {
    if ((x % d) == 0)
        return (x / d);
    var _x = (x * 1.0 / d);
    if ((x*10 % d) == 0)
        return _x.toFixed(1);
    if ((x*100 % d) == 0)
        return _x.toFixed(2);
    return _x.toFixed(3);
}
function FilteredFetchList(datafilters, fetch_url, extra, fetch_callback, error_callback)
{
    var self = this;
    var search_term = null;
    var qid = 0;
    this._update = function(q) {
        qid++;
        var state = pp_get_fragment_state();
        for (var i in extra) {
            state[i] = extra[i];
        }
        if (q == null || q != search_term) {
            if (q != null)
                search_term = q;
            state.search = search_term;
            state.qid = qid;
            pp_common_ajax_callback(
                fetch_url,
                state,
                function(data, xhr) {
                    if (data.success) {
                        if (data.qid == qid) {
                            if (data.hash_redirect != undefined) {
                                stop_loading_animation();
                                window.location.hash = data.hash_redirect;
                            }
                            else {
                                fetch_callback(data, xhr);
                            }
                        }
                    }
                    else if (error_callback) {
                        error_callback(data, xhr);
                    }
                    else if (data.error) {
                        window.alert(data.error);
                    }
                    else {
                        window.alert('An error has occurred.');
                    }
                }
            );
        }
    }
    this.hashchange = function() {
        var state = pp_get_fragment_state();
        $('ul.tabbed-nav li a').each(function(index, element) {
            $(this).fragment('href', state, 2);
        });
        update_filters_from_state(state, datafilters);
        this._update(null);
    }
    this.on_search = function(q) {
        this._update(q);
    }
    register_filter_handlers(datafilters);
}

function register_fetchlist_search(f, category_search_selector) {
    $(category_search_selector).on('keydown', function(e){
        if (e.keyCode == 27) /* escape */
            $(category_search_selector).blur();
        if (e.keyCode == 13) /* enter */
            e.preventDefault();
    }).livesearch({
        searchCallback: function(q) { return f.on_search(q); },
        innerText: "",
        queryDelay: 100,
        minimumSearchLength: 1
    });
}

function register_fetchlist_sort(category_sort_selector) {
    $(category_sort_selector).on('change', function() {
        var s = $(category_sort_selector).val();
        filter_set_sort(s);
    });
}
function update_fetchlist_sort(category_sort_selector) {
    var state = pp_get_fragment_state();
    if (state['sort'])
        $(category_sort_selector).val(state['sort']);
    else
        $(category_sort_selector).val($(category_sort_selector + ' option:first').val());
}
function update_filter_breadcrumbs(container, breadcrumbs) {
    if (breadcrumbs.length > 0) {
        var s = '<p><span class="appliedFilter__label">Filtered by:</span>';
        for (var i=0; i < breadcrumbs.length; ++i) {
            s += '<span class="appliedFilter"><span class="appliedFilter__category">' + breadcrumbs[i].heading + ': </span>';
            for (var j=0; j < breadcrumbs[i].filter_items.length; ++j) {
                s += '<a href="#" class="pp-filter-breadcrumb" data-filter-prefix="' + breadcrumbs[i].prefix + '" data-filter-style="' + breadcrumbs[i].filter_style + '" data-value-id="' + breadcrumbs[i].filter_items[j].value_id + '"><span class="appliedFilter__value">' + breadcrumbs[i].filter_items[j].name + '<svg class="icon shape-delete"><use xlink:href="#shape-delete"></use></svg></span></a>';
            }
            if (i != breadcrumbs.length - 1)
                s += ', ';
            s += '</span>';

        }
        s += '</p>';
        $(container).html(s);
    }
    else
        $(container).text('');
}
function init_filter_breadcrumbs(container) {
    $(container).on('click', 'a.pp-filter-breadcrumb', function() {
        var filter_prefix = $(this).data('filter-prefix');
        var filter_style = $(this).data('filter-style');
        $(this).closest('span').hide();
        if (filter_style == 'list') {
            var value_id = $(this).data('value-id');
            $('input.filteritem[data-value-id="' + value_id + '"]').prop('checked', false);
            update_state_from_list_filter(filter_prefix);
        }
        else if (filter_style == 'dualslide' || filter_style == 'priceslide') {
            update_state_from_dualslide_filter(filter_prefix, []);
        }
        else if (filter_style == 'compatible_with') {
            var _search = new URLSearchParams(window.location.search);
            _search.delete('compatible_with');
            window.location.search = _search.toString();
        }
        else if (filter_style == 'using') {
            var value_id = $(this).data('value-id');
            var _search = new URLSearchParams(window.location.search);
            var tags = _search.get('using').split(',');
            tags = tags.filter(function(e) { return e !== value_id });
            if (tags.length === 0) {
                _search.delete('using');
                window.location.search = '';
            }
            else {
                window.location.search = '?using=' + tags.join(',');
            }
        }
        return false;
    });
}

function pp_common_ajax_callback(url, data, callback_func, always_func) {
    data.scr_perf = JSON.stringify(performance);
    $.ajax({
        type: "POST",
        url: url,
        data: _scr(data),
        dataType: "json"
    }).done(function(data, text_status, xhr) {
        if (always_func)
            always_func(data, xhr);
        if (data.redirect == '')
            window.location.reload();
        else if (data.redirect)
            window.location.href = data.redirect;
        else if (callback_func)
            callback_func(data, xhr);
        else if (!data.success)
            window.alert(data.error);
    }).fail(function(xhr, text_status, error_thrown) {
        var data = {
            success: false,
            error: 'An unknown error occurred on ' + url + ': ' + xhr.status + ': ' + error_thrown
        };
        if (always_func)
            always_func(data, xhr);
        if (callback_func)
            callback_func(data, xhr);
    });
}
function pp_form_to_dict(form) {
    var form_values = form.serializeArray();
    var params = {};
    for (var i=0; i < form_values.length; i++)
        params[form_values[i]['name']] = form_values[i]['value'];
    return params;
}
function pp_select_country(ccabbr, url) { pp_common_ajax_callback('/qapi/country/change/', { cc: ccabbr, url: url }); }
function pp_topic_delete(topic_id) { pp_common_ajax_callback('/qapi/forums/topic/delete/', { topic_id: topic_id }); }
function pp_topic_undelete(topic_id) { pp_common_ajax_callback('/qapi/forums/topic/undelete/', { topic_id: topic_id }); }
function pp_favorite_add(tag) { pp_common_ajax_callback('/qapi/user/favorite/add/', { tag: tag }); }
function pp_favorite_delete_by_id(xid) { pp_common_ajax_callback('/qapi/user/favorite/delete_by_id/', { xid: xid }); }
function pp_favorite_delete_cb(xid, user, callback_func) { pp_common_ajax_callback('/qapi/user/favorite/delete_by_id/', { xid: xid, user: user }, callback_func); }
function pp_inventory_add(tag) { pp_common_ajax_callback('/qapi/user/inventory/add/', { tag: tag }); }
function pp_inventory_delete_cb(xid, user, callback_func) { pp_common_ajax_callback('/qapi/user/inventory/delete/', { xid: xid, user: user }, callback_func); }
function pp_price_alert_delete(delete_obj, pnid) {
    pp_common_ajax_callback('/qapi/user/pricenotify/delete/', { pnid: pnid }, function(data) {
        delete_obj.closest('tr').hide();
    });
}
function pp_price_alert_reset(reset_obj, pnid) {
    pp_common_ajax_callback('/qapi/user/pricenotify/reset/', { pnid: pnid }, function(data) {
        reset_obj.closest('tr').find('td.td__triggered span').text('No');
        reset_obj.hide();
    });
}
function pp_parametric_price_alert_delete(delete_obj, pnid) {
    pp_common_ajax_callback('/qapi/user/pricenotify/parametric/delete/', { pnid: pnid }, function(data) {
        delete_obj.closest('tr').hide();
    });
}
function pp_parametric_price_alert_reset(reset_obj, pnid) {
    pp_common_ajax_callback('/qapi/user/pricenotify/parametric/reset/', { pnid: pnid }, function(data) {
        reset_obj.closest('tr').find('td.td__triggered span').text('No');
        reset_obj.hide();
    });
}
function update_flot_legend_responsive(plot, container) {
    var flot_data = plot.getData();
    var ss = [];
    for(var i = 0; i < flot_data.length; ++i)
        ss.push('<li class="price-history-legend-item block-grid__item"><span class="price-history-legend-color" style="background-color:' + flot_data[i].color + ';"></span>' + flot_data[i].label + '</li>');
    $(container).html(ss.join(''));
}

function pp_post_wait(url, data, complete_func, error_func) {
    function _pp_post_wait(wait_id) {
        setTimeout(function() {
            _pp_post(url, { wait_id: wait_id }, _pp_post_handle_response, error_func);
        }, 1000);
    }
    function _pp_post_handle_response(data) {
        if (data.success) {
            if (data.complete) {
                complete_func(data.result);
            }
            else {
                _pp_post_wait(data.wait_id);
            }
        }
        else {
            error_func(data.error);
        }
    }
    function _pp_post(url, data, complete_func, error_func) {
        pp_common_ajax_callback(url, data, _pp_post_handle_response);
    }
    _pp_post(url, data, _pp_post_handle_response, error_func);
}

function pp_delete_account(user_id) {
    run_confirm_dialog('Confirm Account Deletion', 'Are you sure you want to delete your account?', 'Delete Account', 'Cancel', function() {
        pp_common_ajax_callback(
            '/qapi/user/account/delete/',
            {
                user_id: user_id,
            },
            function(data) {
                if (data.success)
                    run_confirm_dialog('Account Deletion Requested', 'A confirmation email has been sent to the email address registered to your account.  Once you have confirmed the request, your account will be deleted.');
                else
                    window.alert(data.error);
            }
        );
    });
}

function pp_toggle_theme() {
    if ($('html').hasClass('dark-mode'))
        pp_set_theme('light-mode');
    else
        pp_set_theme('dark-mode');
}
function pp_set_theme(theme) {
    if (theme == 'light-mode') {
        $('html').addClass('light-mode').removeClass('dark-mode');
        $('.modeSwitch__toggle').addClass('modeSwitch__toggle--light-mode').removeClass('modeSwitch__toggle--dark-mode');
    }
    else {
        $('html').removeClass('light-mode').addClass('dark-mode');
        $('.modeSwitch__toggle').removeClass('modeSwitch__toggle--light-mode').addClass('modeSwitch__toggle--dark-mode');
    }
    $('input[name="theme"][value="' + theme + '"]').prop('checked', true);
    pp_common_ajax_callback('/qapi/switch_theme/', { theme: theme });
}

function pp_dismiss_banner(site_banner) {
    $('section.banner').hide();
    pp_common_ajax_callback('/qapi/banner/dismiss/', { site_banner: site_banner });
}
function pp_click_banner(site_banner) {
    pp_common_ajax_callback('/qapi/banner/action/', { site_banner: site_banner });
}

function pp_show_settings_saved() {
    pp_show_page_message('Settings saved.');
}
function pp_show_page_message(content) {
    var p = $('div.pageMessage');
    if (p.hasClass('pageMessage--show'))
        p.removeClass('.pageMessage--show').hide();
    p.html('<p>' + content + '</p>').show().addClass('pageMessage--show');
}
function pp_user_account_update_checkbox(user_id, checkbox) {
    pp_common_ajax_callback('/qapi/user/account/update/', { user_id: user_id, param: checkbox.name, value: +checkbox.checked }, function(data) {
        pp_show_settings_saved();
    });
}
function pp_user_account_update_merchant_table(user_id, country, states, tax_rates) {
    pp_common_ajax_callback('/qapi/user/account/update/', { user_id: user_id, param: 'user_account_merchant_table', country: country, merchant_data: JSON.stringify({states: states, tax_rates: tax_rates })}, function(data) {
        pp_show_settings_saved();
    });
}

function ParametricPogoStick(class_type)
{
    var self = this;
    self.selection = {};
    self.selection_ids = [];
    self.unselected_low_price = -1;
    self.class_type = class_type;
    self.filter_id_str = '';
    $('#compare_selected').on('click', function(e){
        if ($(this).hasClass('disabled')) {
            e.preventDefault();
            return false;
        }
        var pbids = [];
        for (var i in self.selection)
            pbids.push(i);
        pp_common_ajax_callback('/qapi/product/compare/ids/', { ids: pbids.join(',') });
        return false;
    });
    $('#clear_selected').on('click', function(e){
        if ($(this).hasClass('disabled')) {
            e.preventDefault();
            return false;
        }
        self.selection = {};
        self.selection_ids = [];
        $('#compare_selected').addClass('disabled');
        $('input.px').prop('checked', false);
        self._update_content();
        return false;
    });
    $('#parametric_add_button').on('click', function(){
        pp_common_ajax_callback('/qapi/partlist/add_parametric/', { class_type: self.class_type, filter_ids: self.filter_id_str, filter_string: window.location.hash });
        return false;
    });
    $('#parametric_submit_price_alert_button').on('click', function(){
        pp_common_ajax_callback('/qapi/user/pricenotify/parametric/add/', { class_type: self.class_type, filter_ids: self.filter_id_str, filter_string: window.location.hash, amount: $('#parametric_price_alert_amount').val() });
        return false;
    });
    self.toggle_selection = function(data) {
        if (self.selection[data.id]) {
            delete self.selection[data.id];
            var p = $.inArray(data.id, self.selection_ids);
            self.selection_ids.splice(p, 1);
        }
        else {
            self.selection[data.id] = data;
            self.selection_ids.push(data.id);
        }
        self._update_content();
    }
    self.set_selection = function(datas) {
        self.selection = {};
        self.selection_ids = [];
        for (var i = 0; i < datas.length; ++i) {
            var data = datas[i];
            self.selection[data.id] = data;
            self.selection_ids.push(data.id);
        }
        self._update_content();
    }
    self.get_selection_ids = function() {
        return self.selection_ids;
    }
    self.set_low_price = function(low_price) {
        self.unselected_low_price = low_price;
        self._update_content();
    }
    self._update_content = function() {
        var low_price = -1;
        var base_ids_str = '';
        if (self.selection_ids.length == 0) {
            $('#parametric_add_button').text('Add From Filter');
            $('#parametric_alert_help_str').text('matching the filter criteria');
            $('#clear_selected').addClass('disabled');
            $('#compare_selected').addClass('disabled');
            low_price = self.unselected_low_price;
        }
        else {
            var base_ids = [];
            $.each(self.selection_ids, function(i, selection_id) {
                base_ids.push(selection_id);
                var selection_price = self.selection[selection_id].price;
                if (selection_price > 0 && (low_price < 0 || selection_price < low_price))
                    low_price = selection_price;
            });
            base_ids_str = base_ids.join(',');
            $('#parametric_add_button').text('Add From Selection');
            $('#parametric_alert_help_str').text('from the current selection');
            $('#clear_selected').removeClass('disabled');
            if (self.selection_ids.length < 2)
                $('#compare_selected').addClass('disabled');
            else
                $('#compare_selected').removeClass('disabled');
        }
        self.filter_id_str = base_ids_str;
        if (low_price > 0)
            $('#parametric_price_alert_amount').val(format_price('',low_price-1));
        else
            $('#parametric_price_alert_amount').val('');
    }
    self._update_content();
}

function init_country_selector(current) {
    $(".pp-country-select").on('change', function(){
        var ccabbr = $(this).val();
        if (ccabbr != '' && ccabbr != current) {
            $('span.flag-icon').removeClass('flag-' + current).addClass('flag-' + ccabbr);
            pp_select_country(ccabbr, window.location.pathname + window.location.search + window.location.hash);
        }
    });
}

function make_drop_nav(clicker, tray, callback) {
    var tray_contents = $(tray);
    var drop = tray_contents.closest('.drop');
    var clicker = $(clicker);
    var drop_arrow = clicker.find('span.nav-dropdown');
    clicker.on('click', function(e) {
        e.preventDefault();
        $(this).toggleClass('active');
        drop.toggleClass('show');
        tray_contents.toggleClass('show');
        drop_arrow.toggleClass('show-drop');
        drop.toggleClass('active');
        if (callback)
            callback();
    });
    $(document).on('mouseup', function(e) {
        if (clicker.is(e.target) || clicker.has(e.target).length > 0)
            return;
        if (!tray_contents.is(e.target) && tray_contents.has(e.target).length == 0) {
            clicker.removeClass('active');
            drop.removeClass('show').removeClass('active');
            drop_arrow.removeClass('show-drop');
            tray_contents.removeClass('show');
        }
    });
    $(document).on('keyup', function(e) {
        if (e.keyCode == 27 && tray_contents.hasClass('show')) {
            clicker.removeClass('active');
            drop.removeClass('show').removeClass('active');
            drop_arrow.removeClass('show-drop');
            tray_contents.removeClass('show');
            e.target.blur();
            return false;
        }
    });
}

function delete_saved_confirm(save_id) {
    run_confirm_dialog('Confirm Saved Part List Deletion', 'Are you sure you want to delete this saved part list?', 'Delete Saved Part List', 'Cancel', function() {
        pp_common_ajax_callback('/qapi/user/saved/delete/', { save_id: save_id });
    });
}

function delete_userbuild_confirm(userbuild_id) {
    run_confirm_dialog('Confirm Completed Build Deletion', 'Are you sure you want to delete this completed build?', 'Delete Completed Build', 'Cancel', function() {
        pp_common_ajax_callback('/qapi/userbuild/delete/', { userbuild_id: userbuild_id });
    });
}

function delete_guide_confirm(guide_id) {
    run_confirm_dialog('Confirm Guide Deletion', 'Are you sure you want to delete this guide?', 'Delete Guide', 'Cancel', function() {
        pp_common_ajax_callback('/qapi/user/guide/delete/', { guide_id: guide_id });
    });
}

function logout_confirm() {
    run_confirm_dialog('Confirm Log Out', 'Are you sure you want to log out?', 'Log Out', 'Cancel', function() {
        pp_common_ajax_callback('/qapi/accounts/logout/', {});
    });
}

var loading_animation = null;
var loading_animation_depth = 0;

function start_loading_animation() {
    if (loading_animation_depth == 0) {
        loading_animation = setTimeout(function() {
            $('.productList__cover').addClass('productList__cover--show');
        }, 200);
    }
    loading_animation_depth += 1;
}

function stop_loading_animation() {
    if (loading_animation != null) {
        clearTimeout(loading_animation);
    }
    $('.productList__cover').removeClass('productList__cover--show');
    loading_animation_depth = 0;
}
function pp_reorder_partlists(reorder_url, d) {
    var ss = [];
    for(var k in d) {
        ss.push(k + ':' + d[k].join(','))
    }
    pp_common_ajax_callback(reorder_url, { ordering: ss.join('/') });
}
function pp_reorder_userbuild_images(userbuild_id, image_ids) {
    pp_common_ajax_callback('/qapi/userbuild/images/reorder/', { userbuild_id: userbuild_id, image_ids: image_ids.join(',') });
}
function pp_delete_userbuild_image(image_id) {
    pp_common_ajax_callback('/qapi/userbuild/images/delete/', { image_id: image_id });
}
function init_price_history_chart(container, ccstr, chart_data, start_ms, end_ms, max_price) {
    var num_days = (end_ms - start_ms) / 86400000;
    if (num_days > 365)
        tick_size = [3, 'month'];
    else if (num_days > 180)
        tick_size = [1, 'month'];
    else
        tick_size = [14, 'day'];
    var params = {
        crosshair: {
            mode: "x"
        },
        grid: {
            hoverable: true,
            autoHighlight: false
        },
        legend: {
            show: false,
        },
        xaxis: {
            mode: 'time',
            minTickSize: [1, "day"],
            min: start_ms,
            max: end_ms,
            tickSize: tick_size
        },
        yaxis: {
            tickFormatter: function(v, axis) { v /= 100.0; return ccstr + v.toFixed(2); }
        }
    }
    var phist_plots = [];
    if (chart_data.length == 0) {
        params['yaxis']['min'] = 0;
        params['yaxis']['max'] = 100000;
        phist_plots.push({
            label_id: 0,
            data: [],
            label: 'No price history is available for this time period.',
            lines: {
                show: true,
                steps: true,
                lineWidth: 2
            },
            shadowSize: 0
        });
    }
    if (max_price != 0) {
        params['yaxis']['max'] = max_price
    }
    for (var i in chart_data) {
        phist_plots.push({
            label_id: i,
            data: chart_data[i].data,
            label: chart_data[i].label,
            lines: {
                show: true,
                steps: true,
                lineWidth: 2
            },
            shadowSize: 0
        });
    }
    var plot = $.plot($(container + ' div.price-history-chart'), phist_plots, params);
    function get_last_price(mseries) {
        if (mseries.data.length == 0)
            return null;
        return mseries.data[mseries.data.length - 1][1];
    }
    function render_price(x) {
        if (x == null || x <= 0)
            return '';
        return format_price(ccstr, x);
    }
    function update_tooltip(prices, timestamp) {
        var date = new Date(parseInt(timestamp));
        var datenow = new Date();
        var hoursago = Math.floor((datenow - date) / (60 * 60 * 1000));
        var daysago = parseInt(Math.floor(hoursago / 24));
        var yearsago = parseInt(Math.floor(daysago / 365));
        daysago = daysago % 365;
        hoursago = hoursago - (daysago * 24);
        var agostr = '';

        agostr = ' (';
        if (yearsago > 0)
            agostr = agostr + yearsago + 'y ';
        if (daysago > 0)
            agostr = agostr + daysago + 'd ';
        if (num_days <= 60 && hoursago > 0)
            agostr = agostr + hoursago + 'h';
        agostr = agostr + ' ago)';

        $(container + ' .price-history-tooltip-date').text((date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear() + agostr);
        var lowest_price = null;
        for(var i = 0; i < prices.length; ++i) {
            var price = prices[i];
            if (price != null && (lowest_price == null || price < lowest_price))
                lowest_price = price;
        }
        for(var i = 0; i < flot_data.length; ++i) {
            var price = prices[flot_data[i].label_id];
            $(container + ' .price-history-price-' + flot_data[i].label_id + ' td.price-history-price').text(render_price(price));
            if (price != null && price == lowest_price)
                $(container + ' .price-history-price-' + flot_data[i].label_id).addClass('price-history-lowest');
            else
                $(container + ' .price-history-price-' + flot_data[i].label_id).removeClass('price-history-lowest');
        }
    }
    var flot_data = plot.getData();
    for(var i = 0; i < flot_data.length; ++i)
        $(container + ' div.price-history-tooltip table tbody').append('<tr class="price-history-price-' + flot_data[i].label_id + '"><td class="price-history-tooltip-color" style="background-color:' + flot_data[i].color + ';"></td><td class="price-history-tooltip-merchant">' + flot_data[i].label + '</td><td class="price-history-price"></td></tr>');
    update_flot_legend_responsive(plot, container + ' .price-history-legend');

    var latestPosition = null;
    var updateLegendTimeout = null;
    var ctx = plot.getCanvas().getContext('2d');

    function update_legend() {
        updateLegendTimeout = null;
        var pos = latestPosition;
        var axes = plot.getAxes();
        if (pos.x < axes.xaxis.min || pos.x > axes.xaxis.max || pos.y < axes.yaxis.min || pos.y > axes.yaxis.max)
            return;

        var i, j, dataset = plot.getData();
        var prices = [];
        for (i = 0; i < dataset.length; ++i) {
            var series = dataset[i];
            var curval = null;
            for (j = 0; j < series.data.length; ++j)
                if (series.data[j][0] < pos.x)
                    curval = series.data[j][1];
                else
                    break;
            prices.push(curval);
        }
        timestamp = pos.x;
        update_tooltip(prices, timestamp);

        var o = plot.pointOffset({x: pos.x, y: pos.y});
        var leftpos = o.left + 50;
        var tooltip_width = $(container + ' div.price-history-tooltip').width();
        if ((pos.pageX - plot.offset().left) + 43 + tooltip_width > plot.width())
            leftpos = leftpos - 100 - tooltip_width;
        var d = {
            position: "absolute",
            display: "block",
            top: 6,
            left: leftpos,
        };
        $(container + ' div.price-history-tooltip').css(d);
    }
    $(container + ' .price-history-chart').on('mouseout', function(e){
        $(container + ' div.price-history-tooltip').hide();
    });
    $(container + ' .price-history-chart').on('plothover', function (e, pos, item) {
        latestPosition = pos;
        var offset = plot.offset();
        var x = pos.pageX - offset.left;
        var y = pos.pageY - offset.top;
        if (x >= 0 && x < plot.width() && y >= 0 && y < plot.height()) {
            if (!updateLegendTimeout)
                updateLegendTimeout = setTimeout(update_legend, 20);
        }
        else {
            if (updateLegendTimeout) {
                clearTimeout(updateLegendTimeout);
                updateLegendTimeout = null;
            }
            $(container + ' div.price-history-tooltip').hide();
        }
    });
}
function get_nearest(a, v) {
    if (a.length == 0)
        return 0;
    if (v <= a[0])
        return a[0];
    if (a[a.length - 1] <= v)
        return a[a.length - 1];
    for (var i = 0; i < a.length - 1; ++i) {
        if (a[i] <= v && a[i + 1] >= v) {
            if ((v - a[i]) < (a[i + 1] - v))
                return a[i];
            return a[i + 1];
        }
    }
}

function SlideFilter(container_id, datafilter, stop_callback) {
    var self = this;

    self.init = function() {
        self.wrapper = $(container_id);
        self.container = self.wrapper.find('.obj-filter-dualslide');
        self.llabel = self.wrapper.find('.obj-filter-slide-left');
        self.rlabel = self.wrapper.find('.obj-filter-slide-right');
        self.llabela = self.llabel.find('a');
        self.rlabela = self.rlabel.find('a');
        self.values = $.map(datafilter.items, function(item, i) { return item.id; });
        self.scaled_values = self.rescale_values(self.values);
        self.scaled_min = self.scaled_values[0];
        self.scaled_max = self.scaled_values[self.scaled_values.length - 1];
        self.scaled_lval = self.scaled_min;
        self.scaled_rval = self.scaled_max;
        self.lval = self.values[0];
        self.rval = self.values[self.values.length - 1];
        self.slider_obj = self.container.slider({
            range: true,
            min: self.scaled_min,
            max: self.scaled_max,
            values: [self.scaled_lval, self.scaled_rval],
            slide: function(event, ui) {
                self.scaled_lval = get_nearest(self.scaled_values, ui.values[0]);
                self.scaled_rval = get_nearest(self.scaled_values, ui.values[1]);
                self.lval = self.values[$.inArray(self.scaled_lval, self.scaled_values)];
                self.rval = self.values[$.inArray(self.scaled_rval, self.scaled_values)];
                self.update_slider();
                return false;
            },
            stop: function() {
                self.on_stop();
            }
        });
        self.wrapper.find('.obj-filter-dualslide-placeholder').remove();
        self.bind_label(self.rlabel, 1);
        self.bind_label(self.llabel, 0);

        $('body').on('pp-post-show-off-canvas', function(event) {
            self.reposition_labels();
        });
        self.container.on('resize', function(event) {
            self.reposition_labels();
        });
    }
    self.rescale_values = function(a) {
        return $.map(a, function(value, i) {
            if (datafilter.log_scale)
                return parseInt(Math.log(value) * 100);
            if (datafilter.pow_scale != 0)
                return parseInt(Math.pow(value, datafilter.pow_scale));
            return value;
        });
    }
    self.on_stop = function() {
        if (self.scaled_lval == self.scaled_min && self.scaled_rval == self.scaled_max) {
            stop_callback(datafilter.prefix, []);
        } else if (self.scaled_lval == self.scaled_rval) {
            stop_callback(datafilter.prefix, [self.lval]);
        } else {
            stop_callback(datafilter.prefix, [self.lval, self.rval]);
        }
    }
    self.bind_label = function(label, pos) {
        const _ll = label.children('a');
        const _lt = label.children('div.labelbox-input');
        const _lti = _lt.children('input');
        function commit_llabel(a) {
            _lt.hide();
            let old_vals = self.get_slider_values();
            let new_val = parseInt(parseFloat(_lti.val() * datafilter.scale_factor));
            if (!isNaN(new_val)) {
                if (new_val < self.values[0])
                    new_val = self.values[0];
                if (new_val > self.values[self.values.length - 1])
                    new_val = self.values[self.values.length - 1];
                old_vals[pos] = new_val;
                self.set_slider_values(old_vals);
                self.on_stop();
            }
            _ll.show();
            self.reposition_labels();
        }
        _ll.on('click', function() {
            _ll.hide();
            const old_vals = self.get_slider_values();
            _lti.val(_ds_format_divd(old_vals[pos], datafilter.scale_factor));
            _lt.show();
            self.reposition_labels();
            _lti.focus().select();
            return false;
        });
        _lti.blur(function() {
            commit_llabel();
            return false;
        });
        _lti.keypress(function(e) {
            if (e.which == 13) {
                commit_llabel();
                return false;
            }
        });
    }
    self.set_slider_values = function(new_values) {
        if (new_values.length == 0) {
            self.set_values(self.values[0], self.values[self.values.length - 1])
        } else if (new_values.length == 1) {
            self.set_values(new_values[0], new_values[0]);
        } else {
            self.set_values(new_values[0], new_values[1]);
        }
    }
    self.update_slider = function() {
        self.slider_obj.slider('option', 'values', [self.scaled_lval, self.scaled_rval]);
        if (self.scaled_lval == self.scaled_rval && self.scaled_rval == self.scaled_max) {
            /* hack to allow right slider to back off - slider is set so on overlap last moved is the active one.  but if both are all the way
               to the right, and the right is the active slider, then you're stuck.  in that case, force the left to be the active slider by
               setting it separately and last. */
            self.slider_obj.slider('option', 'value', 0, self.scaled_lval);
        }
        self.reposition_labels();
    }
    self.get_llabel_text = function() {
        return datafilter.formatter(datafilter, self.lval);
    }
    self.get_rlabel_text = function() {
        return datafilter.formatter(datafilter, self.rval);
    }
    self.reposition_labels = function() {
        const containerbarwidth = self.wrapper.find('.obj-filter-labelbox').width();
        const knobwidth = self.container.find('.ui-slider-handle').width();
        const barwidth = self.container.width();
        const baroffset = (containerbarwidth - barwidth) / 2;
        const calc_loffset = parseInt(barwidth * (self.scaled_lval - self.scaled_min) / (self.scaled_max - self.scaled_min));
        const calc_roffset = parseInt(barwidth * (self.scaled_rval - self.scaled_min) / (self.scaled_max - self.scaled_min));
        self.rlabel.show();
        self.rlabela.html(self.get_rlabel_text());
        self.llabela.html(self.get_llabel_text());
        const lmin = Math.max(-knobwidth / 2, -self.llabel.width() / 2);
        const rmax = barwidth - self.rlabel.width() + knobwidth / 2;
        let lpx = Math.max(calc_loffset - self.llabel.width() / 2, lmin);
        let rpx = Math.min(calc_roffset - self.rlabel.width() / 2, rmax);
        if (self.scaled_lval == self.scaled_rval) {
            self.rlabel.hide();
            lpx = Math.min(lpx, rmax)
        } else {
            const overlap = lpx + self.llabel.width() - rpx + 6; // add padding to keep it clean
            if (overlap > 0) {
                lpx -= overlap / 2;
                rpx += (overlap + 1) / 2;
                if (rpx > rmax) {
                    lpx -= rpx - rmax;
                    rpx = rmax;
                }
                if (lpx < lmin) {
                    rpx += lmin - lpx;
                    lpx = lmin;
                }
            }
        }
        self.llabel.css({left: lpx + baroffset});
        self.rlabel.css({left: rpx + baroffset});
    }
    self.set_values = function(new_lval, new_rval) {
        let added = false;
        if ($.inArray(new_lval, self.values) < 0) {
            self.values.push(new_lval);
            added = true;
        }
        if ($.inArray(new_rval, self.values) < 0) {
            self.values.push(new_rval);
            added = true;
        }
        if (added) {
            self.values.sort(function(a,b){return a - b;});
            self.scaled_values = self.rescale_values(self.values);
            self.scaled_min = self.scaled_values[0];
            self.scaled_max = self.scaled_values[self.scaled_values.length - 1];
            self.slider_obj.slider('option', 'min', self.scaled_min);
            self.slider_obj.slider('option', 'max', self.scaled_max);
        }
        self.lval = new_lval;
        self.rval = new_rval;
        self.scaled_lval = self.scaled_values[$.inArray(self.lval, self.values)];
        self.scaled_rval = self.scaled_values[$.inArray(self.rval, self.values)];
        self.update_slider();
    }
    self.get_slider_values = function() { return [self.lval, self.rval]; }

    self.init();
}

function PriceSlideFilter(container_id, datafilter, stop_callback) {
    var self = this;

    self.init = function() {
        self.wrapper = $(container_id);
        self.container = self.wrapper.find('.obj-filter-dualslide');
        self.llabel = self.wrapper.find('.obj-filter-slide-left');
        self.rlabel = self.wrapper.find('.obj-filter-slide-right');
        self.llabela = self.llabel.find('a');
        self.rlabela = self.rlabel.find('a');
        self.minval = datafilter.minval;
        self.maxval = datafilter.maxval;
        self.lprice = datafilter.minval;
        self.rprice = datafilter.maxval;
        self.lpos = 0;
        self.rpos = 1000;
        self.slider_obj = self.container.slider({
            range: true,
            min: 0,
            max: 1000,
            values: [0, 1000],
            slide: function(event, ui) {
                if (ui.values[0] != self.lpos) {
                    self.lpos = ui.values[0];
                    self.lprice = self.pos_to_price(ui.values[0]);
                }
                if (ui.values[1] != self.rpos) {
                    self.rpos = ui.values[1];
                    self.rprice = self.pos_to_price(ui.values[1]);
                }
                self.update_slider(self.lprice, self.rprice);
                return false;
            },
            stop: function(event, ui) {
                self.on_stop();
            }
        });
        self.wrapper.find('.obj-filter-dualslide-placeholder').remove();
        self.bind_label(self.rlabel, 1);
        self.bind_label(self.llabel, 0);
        $('body').on('pp-post-show-off-canvas', function(event) {
            self.reposition_labels();
        });
        self.container.on('resize', function(event) {
            self.reposition_labels();
        });
    }

    self.on_stop = function() {
        if (self.lprice == self.minval && self.rprice == self.maxval) {
            stop_callback(datafilter.prefix, []);
        } else if (self.lprice == self.rprice) {
            stop_callback(datafilter.prefix, [self.lprice]);
        } else {
            stop_callback(datafilter.prefix, [self.lprice, self.rprice]);
        }
    }
    self.bound_price = function(price, default_price) {
        price = parseInt(price);
        if (!isNaN(price)) {
            if (price < self.minval)
                return self.minval;
            if (price > self.maxval)
                return self.maxval;
            return price;
        }
        return default_price;
    }
    self.get_log_const = function() {
        return Math.sqrt(self.maxval / 1000);
    }
    self.price_to_pos = function(price) {
        const r = price * 1.0 / self.maxval;
        const rlog = Math.log((Math.pow(self.get_log_const(), 1) - 1) * r + 1) / Math.log(self.get_log_const());
        return parseInt(rlog * 1000);
    }
    self.pos_to_price = function(pos) {
        const price = (Math.pow(self.get_log_const(), (pos / 1000.0)) - 1) / (Math.pow(self.get_log_const(), 1) - 1);
        return parseInt(price * self.maxval);
    }
    self.bind_label = function(label, pos) {
        const _ll = label.children('a');
        const _lt = label.children('div.labelbox-input');
        const _lti = _lt.children('input');
        function commit_llabel(a) {
            _lt.hide();
            let old_prices = [self.lprice, self.rprice];
            const new_price = parseInt(_lti.val()) * 100;
            old_prices[pos] = self.bound_price(new_price, [self.minval, self.maxval][pos]);
            self.set_slider_values(old_prices);
            self.on_stop();
            _ll.show();
            self.reposition_labels();
        }
        _ll.on('click', function() {
            _ll.hide();
            const values = self.container.slider('option', 'values');
            _lti.val(parseInt(self.pos_to_price(values[pos]) / 100));
            _lt.show();
            self.reposition_labels();
            _lti.focus().select();
            return false;
        });
        _lti.blur(function() {
            commit_llabel();
            return false;
        });
        _lti.keypress(function(e) {
            if (e.which == 13) {
                commit_llabel();
                return false;
            }
        });
    }
    self.set_slider_values = function(new_prices) {
        if (new_prices.length == 0) {
            self.lprice = self.minval;
            self.rprice = self.maxval;
        } else if (new_prices.length == 1) {
            self.lprice = self.bound_price(new_prices[0], self.minval);
            self.rprice = self.bound_price(new_prices[0], self.maxval);
        } else {
            self.lprice = self.bound_price(new_prices[0], self.minval);
            self.rprice = self.bound_price(new_prices[1], self.maxval);
            if (self.lprice > self.rprice)
                self.lprice = self.rprice;
        }
        self.update_slider(self.lprice, self.rprice);
    }
    self.update_slider = function(new_lprice, new_rprice) {
        self.lpos = self.price_to_pos(new_lprice);
        self.rpos = self.price_to_pos(new_rprice);
        self.slider_obj.slider('option', 'values', [self.lpos, self.rpos]);
        if (new_lprice == new_rprice && new_rprice == self.maxval) {
            /* hack to allow right slider to back off - slider is set so on overlap last moved is the active one.  but if both are all the way
               to the right, and the right is the active slider, then you're stuck.  in that case, force the left to be the active slider by
               setting it separately and last. */
            self.slider_obj.slider('option', 'value', 0, self.lpos);
        }
        self.reposition_labels();
    }
    self.get_llabel_text = function() {
        return datafilter.formatter_prefix(datafilter) + datafilter.formatter(datafilter, self.lprice / 100);
    }
    self.get_rlabel_text = function() {
        return datafilter.formatter_prefix(datafilter) + datafilter.formatter(datafilter, self.rprice / 100);
    }
    self.reposition_labels = function() {
        const values = self.container.slider('option', 'values');
        const lval = values[0];
        const rval = values[1];
        const containerbarwidth = self.wrapper.find('.obj-filter-labelbox').width();
        const knobwidth = self.container.find('.ui-slider-handle').width();
        const barwidth = self.container.width();
        const baroffset = (containerbarwidth - barwidth) / 2;
        const calc_loffset = parseInt(barwidth * lval / 1000);
        const calc_roffset = parseInt(barwidth * rval / 1000);
        self.llabela.html(self.get_llabel_text());
        self.rlabel.show();
        self.rlabela.html(self.get_rlabel_text());
        const lmin = Math.max(-knobwidth / 2, -self.llabel.width() / 2);
        const rmax = barwidth - self.rlabel.width() + knobwidth / 2;
        let lpx = Math.max(calc_loffset - self.llabel.width() / 2, lmin);
        let rpx = Math.min(calc_roffset - self.rlabel.width() / 2, rmax);
        if (lval == rval) {
            self.rlabel.hide();
            lpx = Math.min(lpx, rmax)
        } else {
            const overlap = lpx + self.llabel.width() - rpx + 6; // add padding to keep it clean
            if (overlap > 0) {
                lpx -= overlap / 2;
                rpx += (overlap + 1) / 2;
                if (rpx > rmax) {
                    lpx -= rpx - rmax;
                    rpx = rmax;
                }
                if (lpx < lmin) {
                    rpx += lmin - lpx;
                    lpx = lmin;
                }
            }
        }
        self.llabel.css({left: lpx + baroffset});
        self.rlabel.css({left: rpx + baroffset});
    }

    self.init();
}

function ResponsivePartReview(container, link_container, userbuild_id, slug, base_rating, unique_id) {
    this.open = function() {
        $(container).show();
        $(container + ' .partReviews__writeup').hide();
        $(container + ' .part-review-submit-error').text('');
        $(container + ' .partReviews__editor').show();
        $(container + ' textarea').show();
        this.prev_review_description = $(container + ' textarea').val();
    }
    this.close = function() {
        $(container + ' .partReviews__editor').hide();
        $(container + ' .partReviews__writeup').show();
    }
    function make_open_function(rb) {
        return function() {
            rb.open();
            return false;
        }
    }
    function make_cancel_function(rb) {
        return function() {
            $(container + ' textarea').val(rb.prev_review_description);
            rb.close();
            return false;
        }
    };
    function _post_rating(rb, userbuild_id, slug, rating, review_description) {
        pp_common_ajax_callback(
            '/qapi/product/rate/',
            {
                userbuild_id: userbuild_id,
                slug: slug,
                rating: rating,
                review_description: review_description
            },
            function(data) {
                if (data.success) {
                    $(container + ' .part-review-rating-content').html(data.review_rating_rendered);
                    $(container + ' .part-review-description-content').html(data.review_description_rendered);
                    if (review_description != '') {
                        $(container + ' .part-review-description-content-default').hide();
                        $(container + ' .part-review-description-content').show();
                    }
                    else {
                        $(container + ' .part-review-description-content').hide();
                        $(container + ' .part-review-description-content-default').show();
                    }
                    $(link_container).text('Edit Review');
                    rb.close();
                }
                else {
                    $(container + ' .part-review-submit-error').text(data.error);
                }
            }
        );
        return false;
    }
    function make_delete_function(rb) {
        return function() {
            return _post_rating(rb, userbuild_id, slug, 0, '');
        }
    }
    function make_send_function(rb) {
        return function() {
            var review_description = $(container + ' textarea').val();
            var rating = $(container + ' input[name="rating_' + unique_id + '"]:checked').val();
            return _post_rating(rb, userbuild_id, slug, rating, review_description);
        }
    }

    $(link_container).on('click', make_open_function(this));
    $(container).on('click', 'input.pp_review_submit', make_send_function(this));
    $(container).on('click', 'input.pp_review_cancel', make_cancel_function(this));
    $(container).on('click', 'input.pp_review_delete', make_delete_function(this));
}

function r_is_dialog_open() {
    return $('body').hasClass('js-show-modal');
}
function r_show_dialog(dialog_id, focus_id) {
    $('body').addClass('js-show-modal');
    $(dialog_id).on('animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd', function(e) {
        $(this).off(e);
        if (focus_id === undefined)
            $(dialog_id + ' :input:enabled:visible:first').focus();
        else if (focus_id !== false) {
            $(focus_id).focus().select();
        }
    }).show().addClass('modal--visible');
}
function r_close_dialog() {
    $('body').removeClass('js-show-modal');
    $('.modal--visible').removeClass('modal--visible');
}
function run_confirm_dialog(title, message, ok_msg, cancel_msg, callback, validate_callback) {
    $('#default_dialog div.modal__header h2').html(title);
    $('#default_dialog div.modal__content').html(message);
    if (ok_msg)
        $('#default_dialog_ok').val(ok_msg).show();
    else
        $('#default_dialog_ok').hide();
    if (cancel_msg)
        $('#default_dialog_cancel').val(cancel_msg).show();
    else
        $('#default_dialog_cancel').hide();
    $('body').off('click', '#default_dialog_ok');
    $('body').on('click', '#default_dialog_ok', function () {
        if (validate_callback == undefined || validate_callback()) {
            r_close_dialog();
            if (callback)
                callback();
        }
    });
    r_show_dialog('#default_dialog');
}
function run_ok_dialog(title, message, callback) {
    run_confirm_dialog(title, message, 'OK', null, callback);
}

function run_report_dialog(linkage_type, linkage_id, linkage_name, reasons) {
    var s = '<div id="desktop_report_dialog"><div class="moderation-report-reasons">Reason:</div><ul class="list-unstyled">';
    var reasons = moderation_get_reasons(linkage_type);
    for (var i=0; i<reasons.length; ++i) {
        var r = reasons[i];
        s += '<li class="moderation-report-reason"><input type="radio" class="radio" name="report_reason" value="' + r['value'] + '" id="report_reason_' + r['value'] + '"><label for="report_reason_' + r['value'] + '">' + r['name'] + '</label></li>';
    }
    s += '</ul><div class="moderation-report-no-reason-given" style="display:none;">Please choose a reason.</div><div class="moderation-report-additional-info">Additional Information: (optional)</div><textarea rows="4" name="report_message" class="moderation-report-additional-info-text" id="report_message"></textarea></div>';
    run_confirm_dialog('Report ' + linkage_name + '?', s, 'Report', 'Cancel', function() {
        var reason = $('input[name=report_reason]:checked').val();
        var message = $('#report_message').val();
        pp_common_ajax_callback('/qapi/moderation/report/', { linkage_type: linkage_type, linkage_id: linkage_id, reason: reason, message: message }, function(data) {
            $('#report_' + linkage_type + '_' + linkage_id).replaceWith('<span class="comment-confirm">You have reported this ' + linkage_name.toLowerCase() + '.</span>');
        });
    }, function() {
        var reason = $('input[name=report_reason]:checked').val();
        if (reason != undefined)
            return true;
        $('#desktop_report_dialog div.moderation-report-no-reason-given').show();
    });
}

function init_paging_scroller(container) {
    $('body').on('click', 'ul.pagination a', function() {
      filter_set_page($(this).text());
      window.scrollTo(0, 0);
      return false;
    });
}

function r_request() {
    pp_common_ajax_callback('/qapi/request/', {}, function(data){});
}
function r_is_off_canvas_open() {
    return $('.main-content').hasClass('main-content--display');
}
function r_show_off_canvas() {
    $('html').addClass("no-scroll");
    $('.main-content').addClass("main-content--display");
    $('footer').addClass("footer--display");
}
function r_show_off_canvas_gallery() {
    $('html').addClass("no-scroll--gallery");
    $('.main-content').addClass("main-content--display");
    $('footer').addClass("footer--display");
}
function r_hide_off_canvas() {
    $('html').removeClass("no-scroll");
    $('html').removeClass("no-scroll--gallery");
    $('.main-content').removeClass("main-content--display");
    $('footer').removeClass("footer--display");
    $('.browseProducts').addClass('browseProducts--hide');
    $('.navCard--search').removeClass('navCard--show');
    $('.navCard--products').removeClass('navCard--show');
    $('.navCard--account').removeClass('navCard--show');
    $('.navCard--resources').removeClass('navCard--show');
    $('.nav__search').removeClass('nav__search--active');
    $('.down-caret').removeClass('down-caret--rotate');
    $('li.nav__categories--browseProducts a').removeClass('nav__categories--active');
    $('.offCanvas__sidebar').removeClass("offCanvas--display");
    $('.offCanvas__sort').removeClass("offCanvas--display");
  $( '.sidebar-content' ).css('height',' auto');
}
function r_hide_site_search() {
  r_hide_off_canvas();
  $('.nav__search').removeClass('nav__search--active').attr('aria-expanded', false);
}

function r_is_site_search_open() {
    return $('.navCard--search').hasClass('navCard--show');
}
function r_show_site_search() {
    r_show_off_canvas();
    $('.navCard--search').addClass('navCard--show');
    $('.nav__search').addClass('nav__search--active').attr('aria-expanded', true);
    $('#search_q').focus();
}
function r_is_browse_products_open() {
    return !$('.browseProducts').hasClass('browseProducts--hide');

}
function r_show_browse_products() {
    r_show_off_canvas();
    $('.down-caret').addClass('down-caret--rotate');
    $('.navCard--products').addClass('navCard--show');
    $('li.nav__categories--browseProducts a').addClass('nav__categories--active').attr('aria-expanded', true);
    $('.browseProducts').removeClass('browseProducts--hide').removeAttr('aria-hidden');
    $('.browseProducts a').removeAttr('tabindex');
}
function r_hide_browse_products() {
    r_hide_off_canvas();
    $('.down-caret').removeClass('down-caret--rotate');
    $('.navCard--products').removeClass('navCard--show');
    $('li.nav__categories--browseProducts a').removeClass('nav__categories--active').attr('aria-expanded', false);
    $('.browseProducts').addClass('browseProducts--hide').attr('aria-hidden', true);
    $('.browseProducts a').attr('tabindex', -1);
}

function r_show_mobile_resources() {
    $('.navCard--resources').addClass('navCard--show');
    r_show_off_canvas();
}
function r_hide_mobile_resources() {
    $('.navCard--resources').removeClass('navCard--show');
}
function r_is_mobile_resources_open() {
    return $('.navCard--resources').hasClass('navCard--show');
}

function r_is_gallery_open() {
    return $('.offCanvas__gallery').hasClass("offCanvas--display");
}
function r_show_gallery() {
    $('.offCanvas__gallery').addClass("offCanvas--display");
    $('#product-page .wrapper__pageContent').addClass("main-content--display");
    r_show_off_canvas_gallery();
}
function r_hide_gallery() {
    $('.offCanvas__gallery').removeClass("offCanvas--display");
    $('#product-page .wrapper__pageContent').removeClass("main-content--display");
    r_hide_off_canvas();
}

function r_is_sidebar_open() {
    return $('.offCanvas__sidebar').hasClass("offCanvas--display");
}
function r_show_sidebar() {
    $('.offCanvas__content').scrollTop(0).scrollLeft(0);
    $('.offCanvas__sidebar').addClass("offCanvas--display");
    // makes filter(sidebar) off canvas 100 viewport height on iOS devices
    $( '.sidebar-content' ).css('height',' 100vh');
    $('body').trigger('pp-pre-show-off-canvas');
    r_show_off_canvas();
    $('body').trigger('pp-post-show-off-canvas');
}
function r_hide_sidebar() {
    r_hide_off_canvas();
}
function r_navigate_back(fallback_url) {
    if (!fallback_url)
        fallback_url = '/';
    var has_history = false;
    $(window).on('beforeunload', function(){
        has_history = true;
    });
    window.history.back();
    setTimeout(function(){
        if (!has_history)
            window.location.href = fallback_url;
    }, 500);
}

function init_bulk_tabs() {
    function calc_width() {
        var navwidth = 0;
        var morewidth = $('#tabs .more').outerWidth(true);
        $('#tabs > li:not(.more)').each(function() {
            navwidth += $(this).outerWidth( true );
        });
        var availablespace = $('.tabsGroup').outerWidth(true) - morewidth;
        if (navwidth > availablespace) {
            var lastItem = $('#tabs > li:not(.more)').last();
            lastItem.attr('data-width', lastItem.outerWidth(true));
            lastItem.prependTo($('#tabs .more ul'));
            calc_width();
        }
        else {
            var firstMoreElement = $('#tabs li.more li').first();
            if (navwidth + firstMoreElement.data('width') < availablespace) {
                firstMoreElement.insertBefore($('#tabs .more'));
            }
        }
        if ($('.more li').length > 0) {
            $('.more').css('display', 'inline-block');
        }
        else {
            $('.more').css('display', 'none');
        }
    }
    $(window).on('resize', function () {
        calc_width();
    });
    calc_width();
}
var qf_init = 0;
var qf_count = 0;
function init_common(site_banner) {
    qf_init++;
    $('body').on('click', '.pp_add_favorite', function () { pp_favorite_add($(this).data('product-tag'), 1); return false; });
    $('body').on('click', '.pp_add_inventory', function () { pp_inventory_add($(this).data('product-tag'), 1); return false; });
    $('body').on('click', '.pp_add_part', function () { pp_partlist_add($(this).data('product-tag'), 1); return false; });
    $('body').on('click', '.pp_add_part_quantity', function () {
        var quantity_element = $(this).closest('form').children('input[name=quantity]');
        if (!quantity_element.length)
            quantity_element = $(this).closest('form').children('select[name=quantity]');
        pp_partlist_add($(this).data('product-tag'), parseInt(quantity_element.val()));
        return false;
    });
    $('body').on('click', '.pp_add_part_by_identifier', function () { pp_partlist_add_by_identifier($(this).attr('data-part-identifier'), 1); return false; });
    $('body').on('click', '.pp_async_mr', function() { pp_common_ajax_callback('/qapi/product/mr/', {'product_tag': $(this).data('product-tag'), 'merchant_tag': $(this).data('merchant-tag')}, function(data){}); });
    $('body').on('click', '.pp_async_mratc', function() { pp_common_ajax_callback('/qapi/product/mratc/', {'product_tags': $(this).data('product-tags'), 'merchant_tag': $(this).data('merchant-tag')}, function(data){}); });
    $('body').on('click', '.pp_click_banner', function() { pp_click_banner(site_banner); });
    $('body').on('click', '.pp_confirm_logout', function() { logout_confirm(); return false; });
    $('body').on('click', '.pp_delete_part', function () { pp_partlist_delete($(this).attr('data-part-identifier'), 1); return false; });
    $('body').on('click', '.pp_delete_favorite', function () { pp_favorite_delete_by_id($(this).data('favorite-id'), 1); return false; });
    $('body').on('click', '.pp_dismiss_banner', function() { pp_dismiss_banner(site_banner); return false; });
    $('body').on('click', 'a.button--disabled', function () { return false; });
    $('body').on('click', '.pp_toggle_theme', pp_toggle_theme);
    $('ul.filter-list').on('click', 'a.moreless-show', function() { var ul=$(this).closest('ul'); ul.find('li.abbreviated').show(); ul.find('a.moreless-hide').show(); $(this).hide(); return false; });
    $('ul.filter-list').on('click', 'a.moreless-hide', function() {
        var ul=$(this).closest('ul');
        ul.find('li.abbreviated').each(function(i, e) {
            if (!$(e).find('input[type=checkbox]').is(':checked'))
                $(e).hide();
        });
        ul.find('a.moreless-show').show();
        $(this).hide();
        return false;
    });
    $('a.pp-url-hash-target').each(function(i, e){
        e.hash = window.location.hash;
    });
    $('body').on('submit', '.pp_qapi_form', function(e) {
        e.preventDefault();
        var form = $(this);
        if (form.hasClass('pp_qapi_in_progress'))
            return;
        form.addClass('pp_qapi_in_progress');
        var params = pp_form_to_dict(form);
        if (e.originalEvent && e.originalEvent.submitter && e.originalEvent.submitter.type == 'submit') {
            params[e.originalEvent.submitter.name] = e.originalEvent.submitter.value;
        }
        params['qapi_init_count'] = qf_init;
        params['qapi_form_count'] = ++qf_count;
        params['qapi_ts'] = new Date().getTime();
        error_container = form.find('.pp_qapi_form_error');
        if (error_container.length)
            error_container.text('').hide();
        pp_common_ajax_callback(
            form.attr('action'),
            params,
            function(data) {
                if (error_container.length)
                    error_container.text(data.error).show();
                else
                    window.alert(data.error);
            },
            function(data) {
                form.removeClass('pp_qapi_in_progress');
            }
        );
    });
    $('body').on('keypress', function(e) { zp_kpm++; });
    $('body').on('paste', function(e) { zp_p++; });
    $('body').on('mousemove', function(e) {
        zp_mme++;
        zp_mmx += e.pageX;
        zp_mmy += e.pageY;
    });

    // Browse Products menu button clicked
    $('body').on('click', '.js-trigger--browseProducts > a', function() {
        if (r_is_browse_products_open()) {
            r_hide_browse_products();
        }
        else {
          if (r_is_mobile_resources_open())
            r_hide_mobile_resources();
          if (r_is_site_search_open())
              r_hide_site_search();
            r_show_browse_products();
        }
        return false;
    });
    $('body').on('click', function(e) {
        var browse_block = $('.browseProducts');
        var search_block = $('.navCard--search');
        if (!browse_block.is(e.target) && browse_block.has(e.target).length === 0 && r_is_browse_products_open())
            r_hide_browse_products();
        if (!search_block.is(e.target) && search_block.has(e.target).length === 0 && r_is_site_search_open())
            r_hide_site_search();
    });

    // Global search clicked
    $('body').on('click', '.js-trigger-offCanvas--search', function() {
        if (r_is_site_search_open()) {
            r_hide_site_search();
        }
        else {
            if (r_is_browse_products_open())
                r_hide_browse_products();
            r_show_site_search();
        }
        return false;
    });

    // Account clicked (on mobile)
    $('body').on('click', '.js-trigger--accountMobile', function() {
        $('.navCard--account').addClass('navCard--show');
        r_show_off_canvas();
        return false;
    });

    // Account clicked (on mobile)
    $('body').on('click', '.js-trigger--resourcesMobile', function() {
        r_show_mobile_resources();
        return false;
    });

    $('body').on('click', '.js-trigger--gallery', function() {
        if (r_is_gallery_open())
            r_hide_gallery();
        else
            r_show_gallery();
        return false;
    });

    $('body').on('click', '.js-trigger-offCanvas--sidebar', function() {
        if (r_is_sidebar_open())
            r_hide_sidebar();
        else
            r_show_sidebar();
        return false;
    });
    $('body').on('click', '.js-trigger-offCanvas--sort', function() {
        if ($('.offCanvas__sort').hasClass("offCanvas--display")) {
            r_hide_off_canvas();
        }
        else {
            $('.offCanvas__sort').addClass("offCanvas--display");
            r_show_off_canvas();
        }
        return false;
    });
    $('body').on('click', '.js-trigger-offCanvas--navigate', function() {
        r_hide_off_canvas();
    });
    $('body').on('click', '.js-trigger--close', function() {
        r_hide_off_canvas();
        return false;
    });

    $('body').on('click', '.js-trigger-filter', function() {
        $(this).next('.group__content').slideToggle("fast");
        $(this).toggleClass('toggled');
        return false;
    });
    $('body').on('click', '.js-trigger-show', function() {
        $(this).prev('.showLink__content').slideToggle("fast");
        $(this).toggleClass("showLink--more");
        return false;
    });

    // dialog
    $('body').on('click', '.js-hide-modal', function () {
        r_close_dialog();
        return false;
    });
    zp_fhv = $('li.pp-fhome').is(':visible')?2:1;
    zp_fhh = $('li.pp-fhome').height();

    // escape handler to close nav/pulldowns
    $(document).on('keydown', function(e) {
        if (e.keyCode === 27) {
            if (r_is_dialog_open()) {
                r_close_dialog();
                return false;
            }
            if (r_is_browse_products_open()) {
                r_hide_browse_products();
                return false;
            }
            if (r_is_site_search_open()) {
                r_hide_site_search();
                // r_hide_off_canvas();
                return false;
            }
            if (r_is_gallery_open()) {
                r_hide_gallery();
                return false;
            }
            if (r_is_off_canvas_open()) {
                r_hide_off_canvas();
                return false;
            }
        }
    });

    $("input, textarea").on('keyup',function(){
        $(this).prev("label").addClass('show');
    }).on("focus",function(){
        $(this).prev("label").addClass('show');
    }).on("blur",function(){
        if (this.value == '')
            $(this).prev("label").removeClass('show');
    });

    // iOS devices
    // 1024px and smaller
    // makes filter(sidebar) off canvas 100 viewport height
    if ($('.offCanvas').hasClass('offCanvas--display')){
        $('.sidebar-content').css('height','100vh');
    }
}


function PPResponsiveImageBar(container, images, gallery)
{
    var self = this;
    self.image_offset = 0;
    self.gallery = gallery;

    function _get_num_visible_lis() {
        var divpx = Math.floor($(container).find('div.gallery__images')[0].getBoundingClientRect().width);
        var lipx = Math.floor($(container).find('div.gallery__images ul li')[0].getBoundingClientRect().width);
        return Math.floor(divpx / lipx);
    }

    function _update_paging() {
        // show/hide paging depending on page size
        var num_visible = _get_num_visible_lis();
        var num_pages = Math.floor((images.length + num_visible - 1) / num_visible);
        var active_page = Math.floor(self.gallery.image_offset / num_visible);
        $(container).find('div.gallery__paging ul li').each(function(i, e) {
            if (i < num_pages)
                $(e).show();
            else
                $(e).hide();
            if (i == active_page)
                $(e).addClass('gallery__paging--active');
            else
                $(e).removeClass('gallery__paging--active');
        });
    };

    self.set_image_offset = function(image_offset, on_resize) {
        self.gallery.image_offset = Math.max(Math.min(images.length - 1, image_offset), 0);
        var num_visible = _get_num_visible_lis();
        var num_pages = Math.floor((images.length + num_visible - 1) / num_visible);
        var active_page = Math.floor(self.gallery.image_offset / num_visible);
        if (!on_resize) {
            var animation_speed = 400;
            if (num_visible == 1)
                animation_speed = 200;
            $(container).find('div.gallery__images ul').animate({
                left: -(active_page * 100) + '%'
            }, animation_speed);
        }
        else {
            $(container).find('div.gallery__images ul').css({
                left: -(active_page * 100) + '%'
            });
        }
        $(container).find('div.gallery__imagecount').html((self.gallery.image_offset + 1) + ' <span></span> ' + images.length);
        _update_paging();
        return (image_offset == self.gallery.image_offset);
    }

    // set click handlers
    $(container).on('click', 'div.gallery__images ul li a', function() {
        var image_index = $(this).data('image-index');
        gallery.open_image(image_index);
        return false;
    });

    // set up paging for when in two image size / view
    var num_pages = Math.floor((images.length + 1) / 2);
    var paging_ul = $(container).find('div.gallery__paging ul');
    for (var i = 1; i < num_pages; ++i) {
        paging_ul.append('<li data-page="' + i + '"></li>');
    }
    if (num_pages)
        _update_paging();

    // paging handler
    $(container).on('click', 'div.gallery__paging ul li', function() {
        var page = parseInt($(this).data('page'));
        var offset = page * _get_num_visible_lis();
        self.set_image_offset(offset);
    });

    // browser resize handler
    $(container).on('resize', 'div.gallery__images', function() {
        self.set_image_offset(self.gallery.image_offset, true)
    });

    // right/left button handlers
    $(container).on('click', 'a.pp-gallery-right', function() {
        if (images.length) {
            var num_visible = _get_num_visible_lis();
            var active_page = Math.floor(self.gallery.image_offset / num_visible);
            self.set_image_offset((active_page + 1) * num_visible);
        }
        return false;
    });
    $(container).on('click', 'a.pp-gallery-left', function() {
        if (images.length) {
            var num_visible = _get_num_visible_lis();
            var active_page = Math.floor(self.gallery.image_offset / num_visible);
            self.set_image_offset((active_page - 1) * num_visible);
        }
        return false;
    });
}

function PPResponsiveImageBox(images, gallery)
{
    var self = this;
    self.gallery = gallery;

    $('img.pp_update_main_product_image').on('mouseenter', function() {
        $('img#pp_main_product_image').attr('src', $(this).attr('src'));
        $('img#pp_main_product_image').data('image-index', $(this).data('image-index'));
    })
    $('.thumbnail-active').hover(function() {
        $('.thumbnail-active').removeClass('active')
        $(this).addClass('active');
    });
    $('a.pp_open_gallery').on('click', function() {
        var image_index = $(this).find('img').data('image-index');
        gallery.open_image(image_index);
        return false;
    });
}

function PPResponsiveSingleImage(container, images, gallery)
{
    var self = this;
    self.gallery = gallery;

    $(container).on('click', 'a', function() {
        var image_index = $(this).data('image-index');
        gallery.open_image(image_index);
        return false;
    });
}

function PPResponsiveGallery(container, images)
{
    var self = this;
    self.image_offset = 0;
    self.set_image_offset = function(i) {
        self.image_offset = Math.max(Math.min(images.length - 1, i), 0);
        $(container).find('div.gallery__imagecount').html((self.image_offset + 1) + ' <span></span> ' + images.length);
        var img = $('<img>').attr('src', images[self.image_offset].src);
        $(container).find('div.gallery__content').html('').append(img);
        $(container).find('h3').html(images[self.image_offset].heading);
        $(container).find('h1').html(images[self.image_offset].title);
        return (i == self.image_offset);
    }
    self.open_image = function(i) {
        self.set_image_offset(i);
        r_show_gallery();
    }

    // prep page counts when in single image size / view
    $(container).find('div.gallery__imagecount').html('<p>1 <span></span> ' + images.length + '</p>');

    // right/left button handlers
    $(container).on('click', 'a.pp-gallery-right', function() {
        if (images.length)
            self.set_image_offset(self.image_offset + 1);
        return false;
    });
    $(container).on('click', 'a.pp-gallery-left', function() {
        if (images.length)
            self.set_image_offset(self.image_offset - 1);
        return false;
    });
    $(window).on('keyup', function(e) {
        if (r_is_gallery_open()) {
            if (e.keyCode == 39)
                self.set_image_offset(self.image_offset + 1);
            else if (e.keyCode == 37)
                self.set_image_offset(self.image_offset - 1)
            else if (e.keyCode == 36)
                self.set_image_offset(0)
            else if (e.keyCode == 35)
                self.set_image_offset(images.length - 1)
            return false;
        }
    });

    function scroll_image(distance, duration) {
        var img = $(container).find('.gallery__content img');
        img.css("transition-duration", (duration / 1000).toFixed(1) + "s");
        var value = (distance < 0 ? "" : "-") + Math.abs(distance).toString();
        img.css("transform", "translate(" + value + "px,0)");
    }

    $(container).find('.gallery__content img').swipe( {
        swipeStatus: function(event, phase, direction, distance) {
            if (phase == "move" && (direction == "left" || direction == "right")) {
                var duration = 0;
                if (direction == "left") {
                    scroll_image(distance, duration);
                } else if (direction == "right") {
                    scroll_image(-distance, duration);
                }

            }
            else if (phase == "cancel") {
                scroll_image(0, 200);
            }
            else if (phase == "end") {
                scroll_image(0, 0);
                if (direction == 'left')
                    self.set_image_offset(self.image_offset + 1);
                else if (direction == 'right')
                    self.set_image_offset(self.image_offset - 1);
            }
        }
    });
}


// Generated from https://github.com/github/webauthn-json.git v2.1.1 by scripts/update_webauthn-json
const webauthn_js = (function () {
// src/webauthn-json/base64url.ts
function base64urlToBuffer(baseurl64String) {
  const padding = "==".slice(0, (4 - baseurl64String.length % 4) % 4);
  const base64String = baseurl64String.replace(/-/g, "+").replace(/_/g, "/") + padding;
  const str = atob(base64String);
  const buffer = new ArrayBuffer(str.length);
  const byteView = new Uint8Array(buffer);
  for (let i = 0; i < str.length; i++) {
    byteView[i] = str.charCodeAt(i);
  }
  return buffer;
}
function bufferToBase64url(buffer) {
  const byteView = new Uint8Array(buffer);
  let str = "";
  for (const charCode of byteView) {
    str += String.fromCharCode(charCode);
  }
  const base64String = btoa(str);
  const base64urlString = base64String.replace(/\+/g, "-").replace(
    /\//g,
    "_"
  ).replace(/=/g, "");
  return base64urlString;
}

// src/webauthn-json/convert.ts
var copyValue = "copy";
var convertValue = "convert";
function convert(conversionFn, schema, input) {
  if (schema === copyValue) {
    return input;
  }
  if (schema === convertValue) {
    return conversionFn(input);
  }
  if (schema instanceof Array) {
    return input.map((v) => convert(conversionFn, schema[0], v));
  }
  if (schema instanceof Object) {
    const output = {};
    for (const [key, schemaField] of Object.entries(schema)) {
      if (schemaField.derive) {
        const v = schemaField.derive(input);
        if (v !== void 0) {
          input[key] = v;
        }
      }
      if (!(key in input)) {
        if (schemaField.required) {
          throw new Error(`Missing key: ${key}`);
        }
        continue;
      }
      if (input[key] == null) {
        output[key] = null;
        continue;
      }
      output[key] = convert(
        conversionFn,
        schemaField.schema,
        input[key]
      );
    }
    return output;
  }
}
function derived(schema, derive) {
  return {
    required: true,
    schema,
    derive
  };
}
function required(schema) {
  return {
    required: true,
    schema
  };
}
function optional(schema) {
  return {
    required: false,
    schema
  };
}

// src/webauthn-json/basic/schema.ts
var publicKeyCredentialDescriptorSchema = {
  type: required(copyValue),
  id: required(convertValue),
  transports: optional(copyValue)
};
var simplifiedExtensionsSchema = {
  appid: optional(copyValue),
  appidExclude: optional(copyValue),
  credProps: optional(copyValue)
};
var simplifiedClientExtensionResultsSchema = {
  appid: optional(copyValue),
  appidExclude: optional(copyValue),
  credProps: optional(copyValue)
};
var credentialCreationOptions = {
  publicKey: required({
    rp: required(copyValue),
    user: required({
      id: required(convertValue),
      name: required(copyValue),
      displayName: required(copyValue)
    }),
    challenge: required(convertValue),
    pubKeyCredParams: required(copyValue),
    timeout: optional(copyValue),
    excludeCredentials: optional([publicKeyCredentialDescriptorSchema]),
    authenticatorSelection: optional(copyValue),
    attestation: optional(copyValue),
    extensions: optional(simplifiedExtensionsSchema)
  }),
  signal: optional(copyValue)
};
var publicKeyCredentialWithAttestation = {
  type: required(copyValue),
  id: required(copyValue),
  rawId: required(convertValue),
  authenticatorAttachment: optional(copyValue),
  response: required({
    clientDataJSON: required(convertValue),
    attestationObject: required(convertValue),
    transports: derived(
      copyValue,
      (response) => {
        var _a;
        return ((_a = response.getTransports) == null ? void 0 : _a.call(response)) || [];
      }
    )
  }),
  clientExtensionResults: derived(
    simplifiedClientExtensionResultsSchema,
    (pkc) => pkc.getClientExtensionResults()
  )
};
var credentialRequestOptions = {
  mediation: optional(copyValue),
  publicKey: required({
    challenge: required(convertValue),
    timeout: optional(copyValue),
    rpId: optional(copyValue),
    allowCredentials: optional([publicKeyCredentialDescriptorSchema]),
    userVerification: optional(copyValue),
    extensions: optional(simplifiedExtensionsSchema)
  }),
  signal: optional(copyValue)
};
var publicKeyCredentialWithAssertion = {
  type: required(copyValue),
  id: required(copyValue),
  rawId: required(convertValue),
  authenticatorAttachment: optional(copyValue),
  response: required({
    clientDataJSON: required(convertValue),
    authenticatorData: required(convertValue),
    signature: required(convertValue),
    userHandle: required(convertValue)
  }),
  clientExtensionResults: derived(
    simplifiedClientExtensionResultsSchema,
    (pkc) => pkc.getClientExtensionResults()
  )
};

// src/webauthn-json/basic/api.ts
function createRequestFromJSON(requestJSON) {
  return convert(base64urlToBuffer, credentialCreationOptions, requestJSON);
}
function createResponseToJSON(credential) {
  return convert(
    bufferToBase64url,
    publicKeyCredentialWithAttestation,
    credential
  );
}
function getRequestFromJSON(requestJSON) {
  return convert(base64urlToBuffer, credentialRequestOptions, requestJSON);
}
function getResponseToJSON(credential) {
  return convert(
    bufferToBase64url,
    publicKeyCredentialWithAssertion,
    credential
  );
}

// src/webauthn-json/basic/supported.ts
function supported() {
  return !!(navigator.credentials && navigator.credentials.create && navigator.credentials.get && window.PublicKeyCredential);
}

// src/webauthn-json/browser-ponyfill.ts
async function create(options) {
  const response = await navigator.credentials.create(
    options
  );
  response.toJSON = () => createResponseToJSON(response);
  return response;
}
async function get(options) {
  const response = await navigator.credentials.get(
    options
  );
  response.toJSON = () => getResponseToJSON(response);
  return response;
}
return {
    create: create,
    get: get,
    parseCreationOptionsFromJSON: createRequestFromJSON,
    parseRequestOptionsFromJSON: getRequestFromJSON
}
})();
