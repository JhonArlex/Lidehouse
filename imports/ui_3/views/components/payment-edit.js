import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { AutoForm } from 'meteor/aldeed:autoform';
import { moment } from 'meteor/momentjs:moment';
import { Clock } from '/imports/utils/clock';
import { __ } from '/imports/localization/i18n.js';
import '/imports/ui_3/views/modals/modal-guard.js';
// The autoform needs to see these, to handle new events on it
import '/imports/api/partners/actions.js';
import '/imports/api/contracts/actions.js';
import './payment-edit.html';

Template.Payment_edit.viewmodel({
  partnerRelation() {
    return Session.get('modalContext').txdef.data.relation;
  },
  allocatedAmount() {
    let allocated = 0;
    (AutoForm.getFieldValue('bills') || []).forEach(bp => {
      if (!bp) return;
      allocated += bp.amount;
    });
    return allocated;
  },
  unallocatedAmount() {
    return AutoForm.getFieldValue('amount') - this.allocatedAmount();
  },
});