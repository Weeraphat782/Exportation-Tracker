import { validateIntake } from '../src/lib/chat-log.ts';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const withEmail = validateIntake({
  name: 'Jane Doe',
  company: 'Acme Co.',
  email: 'jane@example.com',
  phone: '',
});
assert(withEmail.ok === true, 'name+company+email accepted');
assert(withEmail.ok && withEmail.intake.email === 'jane@example.com', 'email normalized');

const withPhone = validateIntake({
  name: 'John Smith',
  company: 'Beta Ltd',
  email: '',
  phone: '02-630-4600-1',
});
assert(withPhone.ok === true, 'name+company+phone accepted');

const missingCompany = validateIntake({
  name: 'Jane',
  company: '',
  email: 'jane@example.com',
});
assert(missingCompany.ok === false, 'missing company rejected');

const missingContact = validateIntake({
  name: 'Jane',
  company: 'Acme',
  email: '',
  phone: '',
});
assert(missingContact.ok === false, 'missing email and phone rejected');

console.log('check-chat-log: OK');
