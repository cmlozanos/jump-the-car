// Exercise the actual game update/collision functions without browser rendering.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Clock = require('../frame-clock.js');
const source = fs.readFileSync(path.join(__dirname, '../game.js'), 'utf8').split('// The educational pause is independent')[0];
function world(setup) {
    let nextRequest = 0; const pending = new Map();
    const scope = { JumpFrameClock: Clock, LearningGate: { createTimers: () => ({set(){}}) },
        localStorage: { getItem: () => null }, document: {hidden:false}, Date, console,
        requestAnimationFrame(callback) { pending.set(++nextRequest,callback); return nextRequest; },
        cancelAnimationFrame(id) { pending.delete(id); }, pending };
    vm.createContext(scope);
    vm.runInContext('Math.random = function () { return 0.25; };\n' + source + `
        canvas = {width:1200,height:600}; learningLocked = false;
        showMessage = function () {}; playCrashSound = function () {};
        playWinSound = function () {}; playLandingSound = function () {};
        draw = function () {}; selectedCar = cars[0]; gameState = 'playing';
        ${setup}
        this.tick = function () { update(); if (explosionActive) animateExplosion(); return simulationActive(); };
        this.state = function () { return JSON.stringify([currentDistance,roadScrollX,carY,carVy,isJumping,gameState,explosionActive,explosionParticles]); };
        this.active = simulationActive;
        this.levelCount = levels.length; this.carCount = cars.length;
    `, scope);
    return scope;
}
function compare(setup, label) {
    const reference = world(setup), expected = [];
    for (let step = 0; step < 600 && reference.active(); step++) {
        reference.tick(); expected.push(reference.state());
    }
    for (const fps of [10,15,20,30,60]) {
        const actual = world(setup), clock = Clock.create(), states = [];
        clock.advance(0, () => {});
        for (let frame = 1; frame <= fps * 10 && actual.active(); frame++) {
            clock.advance(frame * 1000 / fps, () => {
                const active = actual.tick(); states.push(actual.state()); return active;
            });
        }
        assert.deepEqual(states, expected, label + ' @ ' + fps + ' FPS');
    }
    return reference;
}
const straight = compare('currentLevelData = {goalDistance:100000,obstacles:[]};', '10 seconds clear road');
assert.equal(JSON.parse(straight.state())[0], 900);
for (let car = 0; car < straight.carCount; car++) {
    compare(`selectedCar=cars[${car}]; angle=selectedCar.baseAngle; speed=selectedCar.baseSpeed; startJump();`, 'original car '+car+' jump');
}
for (let level = 0; level < straight.levelCount; level++) {
    compare(`currentLevel=${level+1}; currentLevelData=levels[${level}]; roadSpeed=getRoadSpeedForLevel(currentLevel);`, 'original level '+(level+1)+' collision/goal');
}
// All obstacle hit boxes and the goal use the same substeps, even at max speed.
for (const type of ['obstacle','tree','spikes','hole','fire','ufo']) {
    compare(`roadSpeed=4.5; currentLevelData={goalDistance:1000,obstacles:[{distance:80,y:500,width:1,height:60,type:'${type}'}]};`, 'thin '+type);
}
compare('currentLevelData={goalDistance:80,obstacles:[]};', 'goal');
compare('explodeCar();', 'explosion lifecycle');
const clock = Clock.create(); let ticks=0;
clock.advance(0,()=>{}); assert.equal(clock.advance(60000,()=>{ticks++;}),8);
assert.equal(ticks,8,'stall work bounded');
clock.reset(); assert.equal(clock.advance(120000,()=>{ticks++;}),0,'resume has no catch-up');
assert.equal(clock.advance(120100,()=>{ticks++;}),6,'10 FPS after resume');
const paused=world('gamePaused=true;'); const before=paused.state(); paused.tick(); assert.equal(paused.state(),before);
const locked=world('learningLocked=true;'); const frozen=locked.state(); locked.tick(); assert.equal(locked.state(),frozen);
const owner=world('gameLoop(); gameLoop(); explodeCar(); gameLoop();');
assert.equal(owner.pending.size,1,'driving and explosion share one RAF owner');
vm.runInContext('stopGameLoop();',owner); assert.equal(owner.pending.size,0);
vm.runInContext('learningLocked=true; gameLoop();',owner); assert.equal(owner.pending.size,0);
vm.runInContext('learningLocked=false; gamePaused=true; gameLoop();',owner); assert.equal(owner.pending.size,0);
vm.runInContext('gamePaused=false; document.hidden=true; gameLoop();',owner); assert.equal(owner.pending.size,0);
vm.runInContext('document.hidden=false; gameLoop();',owner); assert.equal(owner.pending.size,1);
vm.runInContext(`
    soundEnabled=true; isEngineSoundPlaying=true;
    audioContext={state:'running', suspend(){this.state='suspended';return Promise.resolve();},resume(){this.state='running';return Promise.resolve();}};
    document.hidden=true; handleVisibilityChange();
`,owner);
assert.equal(vm.runInContext('audioContext.state',owner),'suspended');
assert.equal(owner.pending.size,0);
vm.runInContext('learningLocked=true; document.hidden=false; handleVisibilityChange();',owner);
assert.equal(vm.runInContext('audioContext.state',owner),'suspended','visibility cannot bypass educational audio pause');
vm.runInContext('learningLocked=false; handleVisibilityChange();',owner);
assert.equal(vm.runInContext('audioContext.state',owner),'running');
assert.equal(vm.runInContext('soundEnabled',owner),true,'visibility never changes preference');
console.log('PASS 10/15/20/30/60 FPS match every original 60Hz tick: '+straight.carCount+' cars, '+straight.levelCount+' levels, 6 obstacles, goal, bounded stalls, pauses and single RAF owner');
