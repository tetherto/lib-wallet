
// Simple data structure for iterating thourought assets
class AssetList {
  constructor() {
    this._define('size', 0)
    this._define('keys', [])
  }

  _define(k,v) {
    Object.defineProperty(this, k, {
      value: v,
      writable: true,
      configurable: true,
      enumerable: false
    })
  }

  set(k,v) {
    if(this.exists(k)) throw new Error('Asset already exists '+k)
    this.size++
    this[k] = v
    this.keys.push(k)
    return v
  }

  exists(k) {
    return !!this[k]
  }

  [Symbol.iterator]() {
    let index = 0;
    const items = this.keys
    return {
    next : () => {
        if (index < items.length) {
            return { value: this[items[index++]], done: false };
        } else {
            return { done: true };
        }
      }
    }
  }
}

module.exports = AssetList
