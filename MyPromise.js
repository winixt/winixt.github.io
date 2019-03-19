
function isFunction(fn) {
    return typeof fn === 'function';
}

const PENDING = 'pending';
const FULFILED = 'fulfilled';
const REJECTED = 'rejected';

class MyPromise {
    constructor(fn) {
        if (!isFunction(fn)) {
            return new TypeError('promise arguments[0] type error');
        }
        this.status = PENDING;
        this.val = undefined; // 位定义值，如果是 null 则为认为定义，语义不合
        this._onResolves = [];
        this._onRejects = [];
        try {
            fn(this._resolve, this._reject);
        } catch(e) {
            this._reject(e);
        }
    }
    _resolve = (val) => {
        const runResolve = () => {
            this.status = FULFILED;
            this.val = val;
            this._onResolves.forEach(fn => fn(val));
            this._onResolves = [];
        }
        const runReject = () => {
            this.status = REJECTED;
            this.val = val;
            this._onRejects.forEach(fn => fn(val));
            this._onRejects = [];
        }
        if (val instanceof MyPromise) { // resolve 可传入 promise
            val.then(runResolve, runReject);
        } else {
            setTimeout(runResolve, 0);
        }
    }
    _reject = (val) => {
        const run = () => {
            this.status = REJECTED;
            this.val = val;
            this._onRejects.forEach(fn => fn(val));
            this._onRejects = [];
        }
        setTimeout(run, 0)
    }
    then(onResolve, onReject) {
        const {status, val} = this;
        return new MyPromise((onResolveNext, onRejectNext) => {
            const _resolve = (value) => {
                if (isFunction(onResolve)) {
                    let res;
                    try {
                        res = onResolve(value);
                    } catch(e) {
                        onRejectNext(e);
                    }
                    if (res instanceof MyPromise) {
                        res.then(onResolveNext, onRejectNext);
                    } else {
                        onResolveNext(res);
                    }
                } else {
                    onResolveNext(value);
                }
            }
            const _reject = (value) => {
                if (isFunction(onReject)) {
                    let res;
                    try {
                        res = onReject(value);
                    } catch(e) {
                        onRejectNext(e);
                    }
                    if (res instanceof MyPromise) {
                        res.then(onResolveNext, onRejectNext);
                    } else {
                        onResolveNext(res);
                    }
                } else {
                    onRejectNext(value);
                }
            }
            switch(status) {
                case PENDING:
                    this._onResolves.push(_resolve); // 多次调用 p.then 
                    this._onRejects.push(_reject);
                    break;
                case FULFILED:
                    _resolve(val); // resolve 之后再调用 p.then 例如 setTimeout 之后
                    break;
                case REJECTED:
                    _reject(val);
                    break;
                default:
                    throw new Error('promise status error');
            }
        })
    }
    catch(fn) {
        return this.then(null, fn)
    }
    static resolve(val) {
        if (val instanceof MyPromise) {
            return val;
        }
        return new MyPromise((resolve) => resolve(val));
    }
    static reject(val) {
        return new MyPromise((resolve, reject) => reject(val));
    }
}