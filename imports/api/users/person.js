import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { _ } from 'meteor/underscore';

import { debugAssert } from '/imports/utils/assert.js';
import { autoformOptions, chooseUser } from '/imports/utils/autoform.js';
import { __ } from '/imports/localization/i18n.js';
import { Memberships } from '/imports/api/memberships/memberships.js';

const idCardTypeValues = ['natural', 'legal'];
const IdCardSchema = new SimpleSchema({
  type: { type: String, allowedValues: idCardTypeValues, autoform: autoformOptions(idCardTypeValues, 'schemaMemberships.person.') },
  name: { type: String },
  address: { type: String },
  identifier: { type: String }, // cegjegyzek szam vagy szig szam - egyedi!!!
  mothersName: { type: String, optional: true },
  dob: { type: Date, optional: true },
});

export const PersonSchema = new SimpleSchema({
  // The user is connected with the membership via 3 possible ways: userId (registered user),
  userId: { type: String, regEx: SimpleSchema.RegEx.Id, optional: true, autoform: chooseUser },
  // userEmail (not yet registered, but invitation is sent)
  userEmail: { type: String, regEx: SimpleSchema.RegEx.Email, optional: true },
  // idCard (confirmed identity papers - this person does not wish to register)
  idCard: { type: IdCardSchema, optional: true },
});

export class Person {
  constructor(data) {
//    console.log("construct Person", data);
    this.userId = data.userId;
    this.userEmail = data.userEmail;
    this.idCard = data.idCard;
  }
  // A personId is either a userId (for registered users) or an idCard identifier (for non-registered users)
  static constructFromId(personId) {
//    console.log("construct Person from id", personId);
    const data = {};
    const user = Meteor.users.findOne(personId);
    if (user) {
      data.userId = personId;
      const m1 = Memberships.findOne({ 'person.userId': personId });
      if (m1) data.idCard = m1.person.idCard;
    } else {
      const m2 = Memberships.findOne({ 'person.idCard.identifier': personId });
      if (m2) data.idCard = m2.person.idCard;
    }
    return new Person(data);
  }
  isConsistent() {
    if (this.userId && this.userEmail) return false;
    return true; 
  }
  isVerified() {
    return !!this.idCard;
  }
  isRegistered() {
    return !!this.userId;
  }
  personId() {
    if (this.userId) return this.userId;
    if (this.idCard) return this.idCard.identifier;
    return undefined;
  }
  user() {
    if (this.userId) return Meteor.users.findOne(this.userId);
    return undefined;
  }
  email() {
    if (this.userId && this.user()) return this.user().emails[0].address;
    if (this.userEmail) return this.userEmail;
    return undefined;
  }
  avatar() {
    if (this.userId && this.user()) return this.user().avatar;
    return '/images/avatars/avatarnull.png';
  }
  displayName() {
    if (this.idCard) return this.idCard.name;
    if (this.userId && this.user()) return this.user().displayName();
    if (this.userEmail) return this.userEmail;
    return undefined;
  }
  id() {
    if (this.userId) return this.userId;
    if (this.idCard) return this.idCard.identifier;
    if (this.userEmail) return this.userEmail;
    debugAssert(false);
    return 'should never get here';
  }
  toString() {
    return this.displayName();
  }
}

export const choosePerson = {
  options() { 
    const communityId = Session.get('activeCommunityId');
    const memberships = Memberships.find({ communityId });
    const options = memberships.map(function option(m) {
      return { label: m.Person().displayName(), value: m.Person().id() };
    });
    const sortedOptions = _.sortBy(options, o => o.label.toLowerCase());
    return sortedOptions;
  },
  firstOption: () => __('(Select one)'),
};
