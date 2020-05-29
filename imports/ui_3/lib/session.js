import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

export function resetSession() {
  Object.keys(Session.keys).forEach(function unset(key) {
    Session.set(key, undefined);
  });
  Session.keys = {};
  Session.set('modalStack', [{ result: {}, context: {} }]);
}

Meteor.startup(resetSession);