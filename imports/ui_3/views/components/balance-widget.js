import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { getActiveCommunityId } from '/imports/ui_3/lib/active-community.js';
import { Memberships } from '/imports/api/memberships/memberships.js';

import { numeral } from 'meteor/numeral:numeral';
import { __ } from '/imports/localization/i18n.js';
import { equalWithinRounding } from '/imports/api/utils.js';

import { Partners } from '/imports/api/partners/partners.js';
import '/imports/api/users/users.js';
import './balance-widget.html';

Template.Balance_widget.viewmodel({
  autorun() {
    const user = Meteor.user();
    this.templateInstance.subscribe('memberships.ofUser', { userId: Meteor.userId() });
    const communityId = getActiveCommunityId();
    const partnerId = user && user.partnerId(communityId);
    this.templateInstance.subscribe('transactions.byPartner', { communityId, partnerId });
  },
  partner() {
    const user = Meteor.user();
    const communityId = getActiveCommunityId();
    const partnerId = user.partnerId(communityId);
    return Partners.findOne(partnerId);
  },
  balance() {
    const partner = this.partner();
    return partner && (-1) * partner.outstanding;
  },
  display(balance) {
    const signPrefix = balance > 0 ? '+' : '';
    return signPrefix + numeral(balance).format();
  },
  message(balance) {
    const partner = this.partner();
    if (equalWithinRounding(balance, 0)) return __('Your Parcel Balance');
    if (balance > 0) return __('You have overpayment');
    else if (balance < 0) {
      if (partner && partner.mostOverdueDays()) return __('You have overdue payments');
      else return __('You have due payments');
    }
    return __('Your Parcel Balance');
  },
  colorClass(balance) {
    const partner = this.partner();
    if (equalWithinRounding(balance, 0)) return 'navy-bg';
    if (balance < 0) {
      return 'bg-' + (partner && partner.mostOverdueDaysColor());
    }
    return 'navy-bg';
  },
  icon(balance) {
    if (equalWithinRounding(balance, 0)) return 'fa fa-thumbs-up';
    if (balance < 0) return 'glyphicon glyphicon-exclamation-sign';
    return 'fa fa-thumbs-up';
  },
});

