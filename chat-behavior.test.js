const assert = require('node:assert/strict');
const ChatCore = require('./chat-core.js');

const users = ['carol', 'carlos', 'hector'];
const message = {
  key: 'detail.entry.chat',
  by: 'carol',
  at: 200,
  notifyTo: users,
  vars: { message: '请看这个事项', mentions: ['carlos'], blockedTo: ['hector'], reference: { type: 'matter', id: '42' } },
};

assert.equal(ChatCore.canViewMessage(message, 'carol'), true, 'sender keeps seeing own message');
assert.equal(ChatCore.canViewMessage(message, 'carlos'), true, 'unblocked member sees message');
assert.equal(ChatCore.canViewMessage(message, 'hector'), false, 'blocked member cannot see message');
assert.deepEqual(ChatCore.visibleMessages([message], 'hector'), []);
assert.deepEqual(ChatCore.visibleMessages([message], 'carlos'), [message]);

assert.deepEqual(
  ChatCore.messageRecipients(users, 'carol', ['hector']),
  ['carol', 'carlos'],
  'blocked recipients are removed but sender remains included',
);

assert.equal(ChatCore.unreadCount([message], 'carlos', 100), 1);
assert.equal(ChatCore.unreadCount([message], 'carlos', 250), 0);
assert.equal(ChatCore.unreadCount([message], 'hector', 100), 0);
assert.equal(ChatCore.unreadCount([message], 'carol', 100), 0, 'own messages are not unread');

assert.equal(ChatCore.blockedLabel(message, 'carol', { hector: 'Héctor' }), 'Héctor');
assert.equal(ChatCore.blockedLabel(message, 'carlos', { hector: 'Héctor' }), '', 'only sender sees blocked label');

assert.deepEqual(ChatCore.normalizeReference({ type: 'step', matterId: 42, id: 3 }), { type: 'step', matterId: '42', id: '3' });
assert.equal(ChatCore.normalizeReference({ type: 'unknown', id: 1 }), null);
assert.equal(ChatCore.pickReferenceValue('matter', { matter: 'matter:42', step: 'step:42:3', client: 'client:9' }), 'matter:42');
assert.equal(ChatCore.pickReferenceValue('step', { matter: 'matter:42', step: 'step:42:3', client: 'client:9' }), 'step:42:3');
assert.equal(ChatCore.pickReferenceValue('', { matter: 'matter:42' }), '');

console.log('chat behavior tests passed');
