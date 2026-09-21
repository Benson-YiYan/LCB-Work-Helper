const assert = require('node:assert/strict');
const fs = require('node:fs');

const app = fs.readFileSync('app.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

for (const removed of ['#/chat', '#/weekly', 'viewChat(', 'viewWeekly(', "'nav.chat'", "'nav.weekly'"]) {
  assert.equal(app.includes(removed), false, `removed feature marker remains: ${removed}`);
}
assert.equal(html.includes('chat-core.js'), false, 'removed chat bundle is still loaded');
assert.equal(fs.existsSync('chat-core.js'), false, 'removed chat bundle still exists');
assert.equal(fs.existsSync('chat-behavior.test.js'), false, 'removed chat test still exists');

console.log('removed feature tests passed');
