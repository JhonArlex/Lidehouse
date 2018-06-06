import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Accounts } from 'meteor/accounts-base';

import { handleError } from '/imports/ui/lib/errors.js';

import { debugAssert } from '/imports/utils/assert.js';
import { insert as insertMember } from '/imports/api/memberships/methods.js';
import './users.js';

export const invite = new ValidatedMethod({
  name: 'user.invite',
  validate: new SimpleSchema({
    email: { type: String, regEx: SimpleSchema.RegEx.Email },
    communityId: { type: String, regEx: SimpleSchema.RegEx.Id },
  }).validator(),

  run({ email, communityId }) {
    const inviter = Meteor.user();
    const userId = Accounts.createUser({ email, password: 'initialPassword' });
    // userId supposed to be good at this point on the client, but it is NOT,
    // so I can only add the user to the community on the server side (not nice)
    if (inviter.settings.language) {
      Meteor.users.update(userId, { $set: { 'settings.language': inviter.settings.language },
      });
    }
    if (Meteor.isServer) {
      Accounts.sendEnrollmentEmail(userId);
     // insertMember.call({ userId, communityId, role: 'guest' });
    }
    return userId;
  },
});

export const update = new ValidatedMethod({
  name: 'user.update',
  validate: new SimpleSchema({
    _id: { type: String, regEx: SimpleSchema.RegEx.Id },
    modifier: { type: Object, blackbox: true },
  }).validator(),

  run({ _id, modifier }) {
    if (_id !== this.userId) {
      throw new Meteor.Error('err_permissionDenied', 'No permission to perform this activity',
        `Method: users.update, userId: ${this.userId}, _id: ${_id}`);
    }

    Meteor.users.update({ _id }, modifier);
  },
});

if (Meteor.isClient) {
}

Meteor.users.helpers({
  hasNowSeen(topic, seenType) {
    debugAssert(seenType === Meteor.users.SEEN_BY_EYES || seenType === Meteor.users.SEEN_BY_NOTI);
    // The user has just seen this topic, so the lastseen info needs to be updated  
    const oldLastSeenInfo = this.lastSeens[seenType][topic._id];
    let newLastSeenInfo;
    const comments = topic.comments().fetch(); // returns newest-first order
    if (!comments || comments.length === 0) {
      newLastSeenInfo = { timestamp: null, commentCounter: 0 };
    } else {
      const lastseenTimestamp = comments[0].createdAt;
      newLastSeenInfo = { timestamp: lastseenTimestamp, commentCounter: topic.commentCounter };
    }

    if (oldLastSeenInfo && oldLastSeenInfo.commentCounter === newLastSeenInfo.commentCounter) return; // this avoids infinite loop

    const modifier = {};
    modifier['$set'] = {};
    for (let i = seenType; i <= Meteor.users.SEEN_BY_NOTI; i++) {
      // When user seen it by eyes than it implies also no NOTI needed - so it propagates upwards (SEEN_BY_EYES=0, SEEN_BY_NOTI=1)
      modifier['$set']['lastSeens.' + seenType + '.' + topic._id] = newLastSeenInfo;
    }

    if (Meteor.isClient) {
      update.call({ _id: this._id, modifier }, handleError);
    } else if (Meteor.isServer) {
      update._execute({ userId: this._id }, { _id: this._id, modifier });
    }
  },
});
