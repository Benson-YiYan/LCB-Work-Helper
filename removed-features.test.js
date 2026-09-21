const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const app = fs.readFileSync('app.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

for (const removed of ['#/chat', '#/weekly', 'viewChat(', 'viewWeekly(', "'nav.chat'", "'nav.weekly'"]) {
  assert.equal(app.includes(removed), false, `removed feature marker remains: ${removed}`);
}
assert.equal(html.includes('chat-core.js'), false, 'removed chat bundle is still loaded');
assert.equal(fs.existsSync('chat-core.js'), false, 'removed chat bundle still exists');
assert.equal(fs.existsSync('chat-behavior.test.js'), false, 'removed chat test still exists');

const tutorialStart = app.indexOf('const BEGINNER_TUTORIAL =');
const tutorialEnd = app.indexOf('const GUIDE_UI =');
assert.notEqual(tutorialStart, -1, 'tutorial data start is missing');
assert.notEqual(tutorialEnd, -1, 'tutorial data end is missing');
const tutorialSource = app.slice(tutorialStart, tutorialEnd);
assert.doesNotMatch(tutorialSource, /chat|聊天/i, 'chat remains in tutorial copy');

const tutorialData = vm.runInNewContext(
  `${tutorialSource}\n({ BEGINNER_TUTORIAL, TUTORIAL_DETAILS, GUIDE_ROUTES })`,
);
for (const lang of ['zh', 'en', 'es']) {
  assert.equal(
    tutorialData.BEGINNER_TUTORIAL[lang].steps.length,
    tutorialData.GUIDE_ROUTES.length,
    `${lang} tutorial topics do not match guide routes`,
  );
  assert.equal(
    tutorialData.TUTORIAL_DETAILS[lang].length,
    tutorialData.GUIDE_ROUTES.length,
    `${lang} tutorial details do not match guide routes`,
  );
}

console.log('removed feature tests passed');
