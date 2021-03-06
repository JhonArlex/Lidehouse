/* eslint-disable no-extend-native */
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';
import deepExtend from 'deep-extend';

// Source: https://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key
Object.getByString = function (object, string) {
  let obj = object;
  let str = string;
  str = str.replace(/\[(\w+)\]/g, '.$1'); // cobjnvert indexes to properties
  str = str.replace(/^\./, '');           // strip keyFragments leading dot
  const keyFragments = str.split('.');
  for (let i = 0, n = keyFragments.length; i < n; ++i) {
    const key = keyFragments[i];
    if (typeof obj === 'object' && key in obj) obj = obj[key];
    else return; // return undefined if not found
  }
  return obj;
};

Object.setByString = function (object, string, value) {
  let obj = object;
  let str = string;
  str = str.replace(/\[(\w+)\]/g, '.$1'); // cobjnvert indexes to properties
  str = str.replace(/^\./, '');           // strip keyFragments leading dot
  const keyFragments = str.split('.');
  for (let i = 0, n = keyFragments.length; i < n; ++i) {
    const key = keyFragments[i];
    if (i === n - 1) obj[key] = value;
    else {
      if (!(key in obj)) obj[key] = {};
      obj = obj[key];
    }
  }
};

// Source: http://adripofjavascript.com/blog/drips/object-equality-in-javascript.html
Object.deepEquals = function deepEquals(a, b) {
  if (a === undefined && b === undefined) return true;
  if (a === undefined || b === undefined) return false;
  if (a === b) return true;
  const aProps = Object.getOwnPropertyNames(a);
  const bProps = Object.getOwnPropertyNames(b);
  if (aProps.length != bProps.length) return false;
  for (let i = 0; i < aProps.length; i++) {
    const propName = aProps[i];
    if (!Object.deepEquals(a[propName], b[propName])) {
      return false;
    }
  }
  return true;
};

// Info: https://www.samanthaming.com/tidbits/70-3-ways-to-clone-objects/
Object.deepClone = function deepClone(obj) {
  const clone = {};
  $.extend(true, clone, obj);
  return clone;
};

Object.deepCloneOwn = function deepCloneOwn(obj) {
//  return _.extendOwn({}, obj);  // only available in new underscore version
  return deepExtend({}, obj);
};

Object.stringifyClone = function stringifyClone(obj) {
  return JSON.parse(JSON.stringify(obj));
};

Object.cleanUndefined = function cleanUndefined(obj) {
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'undefined') {
      delete obj[key];
    }
  });
  return obj;
};

String.prototype.forEachChar = function forEachChar(func) {
  for (let i = 0; i < this.length; i++) {
    func(this.charAt(i));
  }
};

String.prototype.capitalize = function capitalize() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.deaccent = function deaccent() { 
  return this.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

Number.prototype.round = function round(places) {
//  return Math.round((this * 100) + Number.EPSILON) / 100;
  return +(Math.round(this + 'e+' + places) + 'e-' + places);
};

// Sometimes you don't know if you are dealing with an array or a cursor. 
// So by calling fetch, you can make sure it becomes an Array
Array.prototype.fetch = function fetch() { return this; };

Array.prototype.count = function count() { return this.length; };

_.isDefined = function isDefined(obj) { // underscore did not have this
  return obj !== undefined;
};

_.isSimpleObject = function isSimpleObject(variable) {
  return Object.prototype.toString.call(variable) === '[object Object]';
};

_.deepExtend = deepExtend;

let lastTimeCheck;

console.startElapsedTime = function () {
  lastTimeCheck = Date.now();
};

console.logElapsedTime = function (text) {
  const elapsedTime = Date.now() - lastTimeCheck;
  console.log(text, elapsedTime, 'ms');
  lastTimeCheck = Date.now();
};
