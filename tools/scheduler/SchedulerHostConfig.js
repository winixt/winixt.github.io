// 基于时间的调度器
// 使用 requestAnimationFrame 和 MessageChannel 模拟 requestIdleCallback

export let getCurrentTime;
export let shouldYieldToHost;
export let requestHostCallback;
export let cancelHostCallback;

const lacalDate = Date;
const hasNativePerformanceNow =
  typeof performance === 'object' && typeof performance.now === 'function';

// requestAnimationFrame 在 tab 隐藏的时候不会再执行回调函数，这时需要使用 setTimeout 进行模拟
// 100ms 是人类能够感知的时间。https://www.w3.org/TR/requestidlecallback/
const ANIMATION_FRAME_TIMEOUT = 100;
let rAFID;
let rAFTimeoutID;
const requestAnimationFrameWithTimeout = function(callback) {
    rAFID = requestAnimationFrame(function(timestamp) {
        // 取消定时器
        clearTimeout(rAFTimeoutID);
        callback(timestamp);
    });
    rAFTimeoutID = setTimeout(function() {
        // 取消 arf
        cancelAnimationFrame(rAFID);
        callback(getCurrentTime());
    }, ANIMATION_FRAME_TIMEOUT);
}

// 获取当前时间
if (hasNativePerformanceNow) {
    getCurrentTime = function() {
        return performance.now();
    }
} else {
    getCurrentTime = function() {
        return lacalDate.now();
    }
}


let sheduledHostCallback = null; // 记录回调
let isMessageEventScheduled = false; // 是否在进行 message Event Scheduled 调度
let timeoutTime = -1;

let isAnimationFrameScheduled = false; // 是否为 AnimationFrame 调度
let isFlushingHostCallback = false; // 标识是否刷新过 callback

let frameDeadline = 0; // 当前帧需要结束的时间

// 开始假设帧的频率为 30fps. 1000 / 30 = 33ms
// 后续将会调的更快，如果我们更快的动画帧
let previousFrameTime = 33; // 记录上一帧的时常
let activeFrameTime = 33;

// 判断当前运行时间是否超过一帧的时间
shouldYieldToHost = function() {
    return frameDeadline <= getCurrentTime();
}


// 使用 postMessage 来定义浏览器空闲
const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = function() {
    isMessageEventScheduled = false;

    const prevScheduledCallback = sheduledHostCallback;
    const prevTimeoutTime = timeoutTime;
    sheduledHostCallback = null;
    timeoutTime = -1;

    const currentTime = getCurrentTime();

    let didTimeout = false;
    if (frameDeadline - currentTime <= 0) {
        // 说明这里已经没有 idle period 了，检查 callback 是否已经超时
        if (prevTimeoutTime !== -1 && prevTimeoutTime <= currentTime) {
            didTimeout = true;
        } else {
            // 没有超时
            if (!isAnimationFrameScheduled) {
                // 调起另外一个 animation callback，继续延迟等待
                isAnimationFrameScheduled = true;
                requestAnimationFrameWithTimeout(animationTick)
            }
            // 退出，不触发 callback
            sheduledHostCallback = prevScheduledCallback;
            timeoutTime = prevTimeoutTime;
            return;
        }
    }

    if (prevScheduledCallback !== null) {
        isFlushingHostCallback = true;
        try {
            prevScheduledCallback(didTimeout);
        } finally {
            isFlushingHostCallback = false;
        }
    }
}

const animationTick = function(rafTime) {
    if (sheduledHostCallback !== null) {
        requestAnimationFrameWithTimeout(animationTick);
    } else {
        isAnimationFrameScheduled = false;
        return;
    }

    let nextFrameTime = rafTime - frameDeadline + activeFrameTime;
    if (nextFrameTime < activeFrameTime && previousFrameTime < activeFrameTime) {
        if (nextFrameTime < 8) {
            // 不支持 120hz 刷新频率，如果出现，可能是个 bug
            nextFrameTime = 8;
        }
        // 缩短一帧的时常
        activeFrameTime = nextFrameTime < previousFrameTime ? previousFrameTime : nextFrameTime;
    } else {
        previousFrameTime = nextFrameTime;
    }

    frameDeadline = rafTime + activeFrameTime;
    if (!isMessageEventScheduled) {
        isMessageEventScheduled = true;
        port.postMessage(undefined);
    }
}

requestHostCallback = function(callback, absoluteTimeout) {
    sheduledHostCallback =  callback;
    timeoutTime = absoluteTimeout;
    if (isFlushingHostCallback || absoluteTimeout < 0) {
        // 不等待
        port.postMessage(undefined);
    } else if (!isAnimationFrameScheduled) {
        isAnimationFrameScheduled = true;
        requestAnimationFrameWithTimeout(animationTick);
    }
}

cancelHostCallback = function() {
    scheduledHostCallback = null;
    isMessageEventScheduled = false;
    timeoutTime = -1;
}