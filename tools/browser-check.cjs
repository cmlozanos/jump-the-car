const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
async function solve(page) {
    const prompt = page.locator('#gate-prompt');
    if (await prompt.isVisible()) {
        const parts = (await prompt.textContent()).match(/(\d)\s*([+−-])\s*(\d)/);
        const answer = parts[2] === '+' ? +parts[1] + +parts[3] : +parts[1] - +parts[3];
        await page.locator('[data-gate-key="' + answer + '"]').click();
    } else {
        const canvas = page.locator('#gate-trace'), box = await canvas.boundingBox();
        const strokes = await canvas.evaluate(node => LearningGate.Core.glyphs[node.dataset.letter]);
        for (const stroke of strokes) {
            await page.mouse.move(box.x + stroke[0][0]*box.width/100, box.y + stroke[0][1]*box.height/100); await page.mouse.down();
            for (const p of stroke.slice(1)) await page.mouse.move(box.x+p[0]*box.width/100,box.y+p[1]*box.height/100,{steps:3});
            await page.mouse.up();
        }
    }
    await page.waitForFunction(() => !document.getElementById('learning-gate'));
}
(async () => {
    const server = http.createServer((req, res) => {
        let file = decodeURIComponent(req.url.split('?')[0]); if (file.endsWith('/')) file += 'index.html';
        const target = path.join(root, file);
        if (!target.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
        fs.readFile(target, (error, data) => { if (error) { res.writeHead(404); return res.end(); } res.setHeader('Content-Type', ({'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.png':'image/png'})[path.extname(target)] || 'application/octet-stream'); res.end(data); });
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME95_PATH || undefined});
    try {
        for (const viewport of [{width:1280,height:800},{width:360,height:740}]) {
            const context = await browser.newContext({viewport,hasTouch:true,
                userAgent:process.env.CHROME95_PATH ? 'Mozilla/5.0 (Linux; Android 5.0.2; SM-T530NU) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.75 Safari/537.36' : undefined});
            const page = await context.newPage(), errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.addInitScript(() => {
                window.__offset=0; const now=Date.now; Date.now=()=>now()+window.__offset;
                window.__draws=0;
                const clear=CanvasRenderingContext2D.prototype.clearRect;
                CanvasRenderingContext2D.prototype.clearRect=function(...args) {
                    if(this.canvas.id==='gameCanvas') window.__draws++;
                    return clear.apply(this,args);
                };
            });
            await page.goto('http://127.0.0.1:' + server.address().port + '/');
            await page.locator('#learning-gate').waitFor();
            assert(await page.evaluate(() => learningLocked && !soundEnabled && !audioContext));
            assert.equal(await page.locator('#lightToggle').getAttribute('aria-pressed'),'true','first-run default is light');
            assert(await page.evaluate(()=>lightMode));
            assert.equal(await page.evaluate(()=>localStorage.getItem('jump-the-car-light-mode')),null,'default does not overwrite stored data');
            await solve(page);
            await page.locator('#lightToggle').click();
            assert.equal(await page.evaluate(()=>localStorage.getItem('jump-the-car-light-mode')),'false');
            await page.reload();await page.locator('#learning-gate').waitFor();await solve(page);
            assert.equal(await page.locator('#lightToggle').getAttribute('aria-pressed'),'false','explicit normal preference survives reload');
            await page.locator('#soundToggle').click();
            await page.waitForFunction(()=>audioContext && audioContext.state==='running');
            await page.evaluate(()=>{
                Object.defineProperty(document,'hidden',{configurable:true,value:true});
                document.dispatchEvent(new Event('visibilitychange'));
            });
            await page.waitForFunction(()=>audioContext.state==='suspended');
            assert(await page.evaluate(()=>soundEnabled && frameRequest===null));
            await page.evaluate(()=>{window.__offset+=600001;learningGate.check();});
            await page.evaluate(()=>{
                Object.defineProperty(document,'hidden',{configurable:true,value:false});
                document.dispatchEvent(new Event('visibilitychange'));
            });
            assert(await page.evaluate(()=>learningLocked && audioContext.state==='suspended'));
            await solve(page);
            await page.waitForFunction(()=>audioContext.state==='running');
            await page.locator('#soundToggle').click();
            await page.locator('#levelsGrid .car-option').first().click();
            await page.locator('#carsGrid .car-option').first().click();
            await page.waitForFunction(() => gameState === 'playing');
            const box = await page.locator('#gameCanvas').boundingBox();
            await page.touchscreen.tap(box.x+box.width*.5,box.y+box.height*.5);
            assert(await page.evaluate(() => isJumping));
            await page.evaluate(() => {window.__offset+=600001; learningGate.check();});
            await page.locator('#learning-gate').waitFor();
            const locked = await page.evaluate(() => [currentDistance,carY,carVy,isJumping]);
            await page.waitForTimeout(120);
            assert.deepEqual(await page.evaluate(() => [currentDistance,carY,carVy,isJumping]),locked);
            assert(await page.evaluate(()=>frameRequest===null && !gameLoopRunning),'no RAF while gate locked');
            await solve(page);
            await page.locator('#configButton').click();
            assert(await page.evaluate(() => gamePaused));
            const pauseDraws=await page.evaluate(()=>window.__draws);
            await page.waitForTimeout(160);
            assert.equal(await page.evaluate(()=>window.__draws),pauseDraws,'paused canvas must not repaint');
            const pausedPhysics=await page.evaluate(()=>[currentDistance,carY,carVy,roadSpeed]);
            await page.locator('#lightToggle').click();
            assert(await page.evaluate(()=>lightMode && canvas.width===800 && canvas.height===400 && WORLD.height===600));
            assert.deepEqual(await page.evaluate(()=>[currentDistance,carY,carVy,roadSpeed]),pausedPhysics,'render resolution must not affect world');
            assert(await page.evaluate(()=>{
                draw(); const background=backgroundCache.surface, hud=hudCache.surface;
                for(let i=0;i<40;i++) draw();
                return backgroundCache.surface===background && hudCache.surface===hud;
            }),'background and HUD reused across redraws');
            const cacheMetrics=await page.evaluate(()=>{
                const originalPaint=paintBackground; let builds=0;
                paintBackground=function(context){builds++;originalPaint(context);};
                const mode=lightMode, level=currentLevel;
                const results=[];
                try {
                    for(const lightweight of [false,true]) {
                        lightMode=lightweight; applyRenderMode();
                        builds=0; const start=performance.now();
                        for(let i=0;i<120;i++) draw();
                        results.push({mode:lightweight?'light':'normal',pixels:canvas.width*canvas.height,
                            backgroundBuilds:builds,ms:Math.round((performance.now()-start)*100)/100});
                    }
                    const previous=backgroundCache.surface;
                    currentLevel=backgroundThemes.findIndex(theme=>theme.stars)+1;
                    if(currentLevel<1) throw Error('Missing night theme fixture');
                    draw();
                    if(backgroundCache.surface===previous) throw Error('Stale level background');
                    const night=backgroundCache.surface;
                    draw(); if(backgroundCache.surface!==night) throw Error('Night background not cached');
                } finally {currentLevel=level;lightMode=mode;paintBackground=originalPaint;applyRenderMode();}
                return results;
            });
            assert.deepEqual(cacheMetrics.map(result=>result.backgroundBuilds),[0,0]);
            assert.deepEqual(cacheMetrics.map(result=>result.pixels),[720000,320000]);
            console.log('Render diagnostic (desktop engine, not Android hardware)',JSON.stringify(cacheMetrics));
            await page.evaluate(()=>{window.__oldHud=hudCache.surface;});
            await page.locator('#accelerateButton').click();
            assert(await page.evaluate(()=>hudCache.surface!==window.__oldHud),'speed change redraws paused HUD');
            await page.locator('#decelerateButton').click();
            await page.evaluate(() => {window.__offset+=600001; learningGate.check();});
            await solve(page);
            assert(await page.evaluate(() => gamePaused && gameState==='paused'));
            await page.locator('#closeConfigButton').click();
            await page.evaluate(() => {
                resetGame(); explodeCar();
                learningTimers.set(()=>{window.__timerReached=true;},50);
                window.__offset+=600001; learningGate.check();
            });
            const particles = await page.evaluate(() => JSON.stringify(explosionParticles));
            await page.waitForTimeout(120);
            assert.equal(await page.evaluate(() => JSON.stringify(explosionParticles)),particles);
            assert(!await page.evaluate(() => window.__timerReached));
            await solve(page); await page.waitForTimeout(90);
            assert(await page.evaluate(() => window.__timerReached));
            assert.notEqual(await page.evaluate(() => JSON.stringify(explosionParticles)),particles);
            assert(await page.evaluate(()=>explosionParticles.length===12),'light explosion has reduced decoration');
            await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
            await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
            await context.setOffline(true); await page.reload();
            await page.locator('#learning-gate').waitFor(); await solve(page);
            await page.locator('#levelsGrid .car-option').first().waitFor();
            assert.equal(await page.locator('#lightToggle').getAttribute('aria-pressed'),'true','local light mode survives offline reload');
            assert(await page.evaluate(()=>canvas.width===800));
            await page.locator('#levelsGrid .car-option').first().click();
            await page.locator('#carsGrid .car-option').first().click();
            await page.waitForFunction(()=>gameState==='playing');
            const lightBox=await page.locator('#gameCanvas').boundingBox();
            await page.touchscreen.tap(lightBox.x+lightBox.width*.5,lightBox.y+lightBox.height*.5);
            assert(await page.evaluate(()=>isJumping),'offline light-mode touch jump');
            await page.locator('#configButton').click();
            await page.locator('#lightToggle').click();
            assert(await page.evaluate(()=>!lightMode && canvas.width===1200 && canvas.height===600),'normal mode restored');
            if(process.env.QA_DIR) {
                fs.mkdirSync(process.env.QA_DIR,{recursive:true});
                await page.locator('#closeConfigButton').click();
                await page.screenshot({path:path.join(process.env.QA_DIR,'jump-'+viewport.width+'-normal.png'),fullPage:true});
                await page.locator('#lightToggle').click();
                await page.screenshot({path:path.join(process.env.QA_DIR,'jump-'+viewport.width+'-light.png'),fullPage:true});
            }
            assert.equal(await page.locator('.portal-controls a').getAttribute('href'),'https://cmlozanos.github.io/games/');
            assert.deepEqual(errors,[]);
            await context.close();
            console.log('PASS',viewport.width+'x'+viewport.height,'entry/touch/10min/hidden audio/zero paused draws/caches/light world invariance/HUD invalidation/explosion/timers/offline persistence');
        }
        console.log('Browser',await browser.version());
    } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exit(1);});
