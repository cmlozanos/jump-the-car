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
            const context = await browser.newContext({viewport,hasTouch:true});
            const page = await context.newPage(), errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.addInitScript(() => {window.__offset=0; const now=Date.now; Date.now=()=>now()+window.__offset;});
            await page.goto('http://127.0.0.1:' + server.address().port + '/');
            await page.locator('#learning-gate').waitFor();
            assert(await page.evaluate(() => learningLocked && !soundEnabled && !audioContext));
            await solve(page);
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
            await solve(page);
            await page.locator('#configButton').click();
            assert(await page.evaluate(() => gamePaused));
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
            await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
            await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
            await context.setOffline(true); await page.reload();
            await page.locator('#learning-gate').waitFor(); await solve(page);
            await page.locator('#levelsGrid .car-option').first().waitFor();
            assert.equal(await page.locator('.portal-controls a').getAttribute('href'),'https://cmlozanos.github.io/games/');
            assert.deepEqual(errors,[]);
            await context.close();
            console.log('PASS',viewport.width+'x'+viewport.height,'entry/touch jump/10min/manual pause/explosion/timers/offline');
        }
        console.log('Browser',await browser.version());
    } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exit(1);});
