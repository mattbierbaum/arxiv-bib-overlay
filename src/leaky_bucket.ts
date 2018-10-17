/* Adapted from eventEmitter/leaky-bucket, licensed under:
 *
 * Copyright (C) 2015 Michael van der Weg
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the "Software"), to deal in the Software without restriction, 
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, 
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is 
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or 
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT 
 * NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
import { cookies } from './cookies'

export class LeakyBucket {
    // CONF: size of the slot where capacity tokens can be used in seconds, defaults to 60
    slotSize: number = 60

    // CONF: capacity, defaults to 60 tokens / minute
    capacity: number = 60

    // CONF: how many seconds it takes to refill one item
    refillRate: number = 1

    // CONF: how long can a item wait before it gets a timeout defaults to 300 seconds
    maxWaitingTime: number = 300

    // GLOBAL: timestamp of the last request
    last: number = 0

    // GLOBAL: indicates how long the next item has to wait until its executed, stored as reserved cost, not time
    waitTime: number = 0

    // GLOBAL: how many slots are left to fill
    left: number = 0

    // LOCAL: list of tasks to complete
    queue: any[] = []

    // LOCAL: timer which may be set to work the queue
    timer: any = null

    constructor(capacity: number, interval: number = 60, maxWaitingTime: number = 300) {
        this.capacity = capacity
        this.slotSize = interval
        this.maxWaitingTime = maxWaitingTime

        this.refillRate = this.slotSize / this.capacity
        this.left = this.capacity
        this.queue = []

        this.load_globals()
    }

    load_globals() {
        const data = cookies.limiter
        if (!data) {
            return
        }

        this.last = data.last
        this.waitTime = data.waitTime
        this.left = data.left
    }

    save_globals() {
        cookies.limiter = {last: this.last, waitTime: this.waitTime, left: this.left}
    }

    throttle(promise: () => Promise<any>, promise_cost: number = 1) {
        const cost = promise_cost

        return new Promise(
            (resolve, reject) => {
                this._throttle(
                    (err) => {err ? reject(err) : resolve() },
                    cost, false
                )
            }
        ).then(() => promise())
    }

    _throttle(callback: (err: any) => void, cost: number, fromQueue: boolean) {
        let waitTime: number = 0
        let item = {}
        const now = Date.now()

        this.left = Math.min(((now  - this.last) / (1000 * this.refillRate)) + this.left, this.capacity)
        this.last = now

        if (this.left >= cost && (!this.queue.length || fromQueue)) {
            this.left -= cost

            if (fromQueue) {
                this.waitTime -= cost
            }

            callback(null)
        } else {
            waitTime = Math.max((this.waitTime * (1000 * this.refillRate) - (now - this.last)) / 1000, 0)

            if (waitTime >= this.maxWaitingTime) {
                callback(new Error(
                    `Timeout exceeded, too many waiting requests! Would take ${waitTime} seconds to complete, ` +
                    `the max waiting time is ${this.maxWaitingTime}.`
                ))
            } else {
                item = {callback, cost}
                this.waitTime += cost

                if (fromQueue) {
                    this.queue.unshift(item)
                } else {
                    this.queue.push(item)
                }
            }
        }

        this.save_globals()

        if (this.queue.length && this.timer === null) {
            this.timer = setTimeout(
                () => {
                    this.timer = null

                    if (this.queue.length) {
                        const queuedItem = this.queue.shift()
                        this._throttle(queuedItem.callback, queuedItem.cost, true)
                    }
                },
                Math.max(Math.ceil((this.queue[0].cost - this.left) * this.refillRate * 1000), 0)
            )
        }
    }
}

/*const bucket = new LeakyBucket(1, 1, 1)
for (let i = 0; i < 10; i++) {
    bucket.throttle(
        () => {
            return new Promise((resolve, reject) => {
                setTimeout(
                    () => {
                        console.log('hi')
                        reject(new Error('bad'))
                        resolve()
                    },
                    1000
                )
            }).catch((e) => {console.log('Promise errror: ' + e)})
        }
    )
    .catch((e) => {console.log('Problem: ' + e)})
}*/

export const api_bucket = new LeakyBucket(1, 1, 0)
