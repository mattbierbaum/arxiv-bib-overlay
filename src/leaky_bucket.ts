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
import * as FastMutex from 'fast-mutex'
import * as CONFIG from './bib_config'
import { RateLimitError } from './bib_lib'

export class CrossTabLeakyBucket {
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

    storage: any
    storename: string = ''

    constructor(capacity: number, interval: number = 60, maxWaitingTime: number = 300) {
        this.capacity = capacity
        this.slotSize = interval
        this.maxWaitingTime = maxWaitingTime

        this.refillRate = this.slotSize / this.capacity
        this.left = this.capacity
        this.queue = []

        this.storename = CONFIG.POLICY_LIMITER_LOCALSTORAGE_KEY
        this.storage = localStorage || window.localStorage
    }

    storage_load() {
        const txt = this.storage.getItem(this.storename) || ''
        try {
            if (!txt) { return }

            const data = JSON.parse(txt)
            if (!data) { return }

            this.last = data.last
            this.waitTime = data.waitTime
            this.left = data.left
        } catch (e) {
            console.log(e)
        }
    }

    storage_save() {
        const out = {last: this.last, waitTime: this.waitTime, left: this.left}
        this.storage.setItem(this.storename, JSON.stringify(out))
    }

    throttle(promise: () => Promise<any>) {
        const mutex = new FastMutex()
        return new Promise(
            (resolve, reject) => {
                mutex.lock(this.storename)
                .then(() => this.storage_load())
                .then(() => this._throttle())
                .then(() => this.storage_save())
                .then(() => mutex.release(this.storename))
                .then(() => resolve())
                .catch((e) => reject(e))
            }
        ).then(() => promise())
    }

    _throttle(fromQueue: boolean = false) {
        let waitTime: number = 0
        const now = Date.now()

        this.left = Math.min(((now  - this.last) / (1000 * this.refillRate)) + this.left, this.capacity)
        this.last = now

        if (this.left >= 1 && (!this.queue.length || fromQueue)) {
            this.left -= 1

            if (fromQueue) {
                this.waitTime -= 1
            }

            return
        } else {
            waitTime = Math.max((this.waitTime * (1000 * this.refillRate) - (now - this.last)) / 1000, 0)

            if (waitTime >= this.maxWaitingTime) {
                console.log(
                    `Timeout exceeded, too many waiting requests! Would take ${waitTime} seconds to complete, ` +
                    `the max waiting time is ${this.maxWaitingTime}.`
                )
                throw new RateLimitError('Too many requests, please try again in a few seconds.')
            } else {
                this.waitTime += 1

                if (fromQueue) {
                    this.queue.unshift(1)
                } else {
                    this.queue.push(1)
                }
            }
        }

        if (this.queue.length && this.timer === null) {
            this.timer = setTimeout(
                () => {
                    this.timer = null

                    if (this.queue.length) {
                        this._throttle(true)
                    }
                },
                Math.max(Math.ceil((1 - this.left) * this.refillRate * 1000), 0)
            )
        }
    }
}

export const api_bucket = new CrossTabLeakyBucket(CONFIG.POLICY_LIMITER_RATE, 1, CONFIG.POLICY_LIMITER_CAPACITY)
