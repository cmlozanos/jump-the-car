// Fixed 60 Hz simulation; rendering may run at any refresh rate.
(function (root) {
    'use strict';
    function create() {
        var previous = null, remaining = 0;
        var step = 1000 / 60, maxSteps = 8;
        return {
            reset: function () { previous = null; remaining = 0; },
            advance: function (now, tick) {
                if (previous === null) { previous = now; return 0; }
                // Bound work after a stall; never replay a hidden tab's whole absence.
                remaining += Math.min(Math.max(0, now - previous), step * maxSteps);
                previous = now;
                var count = 0;
                while (remaining + 0.000001 >= step && count < maxSteps) {
                    remaining -= step;
                    count++;
                    if (tick() === false) { remaining = 0; break; }
                }
                return count;
            }
        };
    }
    root.JumpFrameClock = { create: create };
    if (typeof module === 'object' && module.exports) module.exports = root.JumpFrameClock;
}(typeof window !== 'undefined' ? window : this));
