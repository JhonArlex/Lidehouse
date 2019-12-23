import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Factory } from 'meteor/dburles:factory';
import faker from 'faker';
import { _ } from 'meteor/underscore';
import { moment } from 'meteor/momentjs:moment';

import { __ } from '/imports/localization/i18n.js';
import { Clock } from '/imports/utils/clock.js';
import { debugAssert } from '/imports/utils/assert.js';
import { TxDefs } from '/imports/api/transactions/tx-defs/tx-defs.js';
import { Transactions, oppositeSide } from '/imports/api/transactions/transactions.js';
import { MinimongoIndexing } from '/imports/startup/both/collection-patches.js';
import { ChartOfAccounts, chooseAccountNode } from '/imports/api/transactions/breakdowns/chart-of-accounts.js';
import { Localizer, chooseLocalizerNode } from '/imports/api/transactions/breakdowns/localizer.js';
import { Parcels } from '/imports/api/parcels/parcels.js';
import { Partners, choosePartner } from '/imports/api/partners/partners.js';

const Session = (Meteor.isClient) ? require('meteor/session').Session : { get: () => undefined };

export const Bills = {};

export const chooseConteerAccount = {
  options() {
    const txDefId = Session.get('modalContext').txDef._id;
    const txDef = TxDefs.findOne(txDefId);
    const coa = ChartOfAccounts.get();
    if (!coa || !txDef) return [];
    const nodeCodes = txDef[txDef.conteerSide()];
    return coa.nodeOptionsOf(nodeCodes, /*leafsOnly*/ false);
  },
  firstOption: () => __('Conteer'),
};

const lineSchema = {
  title: { type: String },
  details: { type: String, optional: true },
  uom: { type: String, optional: true },  // unit of measurment
  quantity: { type: Number, decimal: true },
  unitPrice: { type: Number, decimal: true },
  taxPct: { type: Number, decimal: true, defaultValue: 0 },
  tax: { type: Number, decimal: true, optional: true, autoform: { omit: true, readonly: true } },
  amount: { type: Number, decimal: true, optional: true, autoform: { omit: true, readonly: true } },
  // autoValue() {
  //  return this.siblingField('quantity').value * this.siblingField('unitPrice').value;
  //} },
  billingId: { type: String, regEx: SimpleSchema.RegEx.Id, optional: true, autoform: { omit: true } },
  period: { type: String, optional: true, autoform: { omit: true } },
  account: { type: String, optional: true, autoform: chooseConteerAccount },
  localizer: { type: String, optional: true, autoform: chooseLocalizerNode },
};
_.each(lineSchema, val => val.autoform = _.extend({}, val.autoform, { afFormGroup: { label: false } }));
Bills.lineSchema = new SimpleSchema(lineSchema);

Bills.receiptSchema = new SimpleSchema({
  // amount overrides non-optional value of transactions, with optional & calculated value
  amount: { type: Number, decimal: true, optional: true, autoform: { omit: true, readonly: true } },
  tax: { type: Number, decimal: true, optional: true, autoform: { omit: true, readonly: true } },
  lines: { type: Array, defaultValue: [] },
  'lines.$': { type: Bills.lineSchema },
});

Bills.extensionSchema = new SimpleSchema([
  Transactions.partnerSchema,
  Bills.receiptSchema, {
    issueDate: { type: Date },
    deliveryDate: { type: Date },
    dueDate: { type: Date },
    payments: { type: Array, defaultValue: [] },
    'payments.$': { type: String, regEx: SimpleSchema.RegEx.Id, autoform: { omit: true } },
    // cached value, so client can ask to sort on outstanding amount:
    outstanding: { type: Number, decimal: true, optional: true, autoform: { omit: true } },
  //  closed: { type: Boolean, optional: true },  // can use outstanding === 0 for now
  },
]);

Bills.modifiableFields = ['amount', 'issueDate', 'valueDate', 'dueDate', 'partnerId'];

Meteor.startup(function indexBills() {
  if (Meteor.isClient && MinimongoIndexing) {
  } else if (Meteor.isServer) {
    Transactions._ensureIndex({ communityId: 1, relation: 1, outstanding: -1 });
  }
});

Transactions.categoryHelpers('bill', {
  getPayments() {
    return (this.payments || []).map(id => Transactions.findOne(id));
  },
  paymentCount() {
    return this.payments.length;
  },
  makeJournalEntries(accountingMethod) {
    const self = this;
//    const communityId = this.communityId;
//    const cat = TxDefs.findOne({ communityId, category: 'bill', 'data.relation': this.relation });
//    this.valueDate = this.issueDate;
    function copyLinesInto(txSide) {
      self.lines.forEach(line => {
        if (!line) return; // can be null, when a line is deleted from the array
        txSide.push({ amount: line.amount, account: line.account, localizer: line.localizer });
      });
    }
    if (accountingMethod === 'accrual') {
      if (this.relation === 'supplier') {
        this.debit = []; copyLinesInto(this.debit);
        this.credit = [{ account: '46' }];
      } else if (this.relation === 'customer') {
        this.debit = [{ account: '31' }];
        this.credit = []; copyLinesInto(this.credit);
      } else if (this.relation === 'parcel') {
        this.debit = [{ account: '33'+'' }];  // line.account = Breakdowns.name2code('Assets', 'Owner obligations', parcelBilling.communityId) + parcelBilling.payinType;
        this.credit = []; copyLinesInto(this.credit);
      } else debugAssert(false, 'No such bill relation');
    } // else we have no accounting to do
    return { debit: this.debit, credit: this.credit };
  },
  autofillOutstanding() {
    let paid = 0;
    this.getPayments().forEach(p => paid += p.amount);
    this.outstanding = this.amount - paid;
  },
  updateOutstandings(directionSign) {
    if (Meteor.isClient) return;
    debugAssert(this.partnerId, 'Cannot process a bill without a partner');
    Partners.relCollection(this.relation).update(this.partnerId, { $inc: { outstanding: directionSign * this.amount } }, { selector: { role: 'owner' } });
    if (this.relation === 'parcel') {
      this.lines.forEach(line => {
        if (!line) return; // can be null, when a line is deleted from the array
        debugAssert(line.localizer, 'Cannot process a parcel bill without localizer fields');
        const ref = Localizer.code2parcelRef(line.localizer);
        Parcels.update({ communityId: this.communityId, ref }, { $inc: { outstanding: directionSign * line.amount } });
      });
    }
  },
  display() {
    return `${moment(this.deliveryDate).format('L')} ${this.partner()} ${this.amount}`;
  },
});

Transactions.attachVariantSchema(Bills.extensionSchema, { selector: { category: 'bill' } });

Meteor.startup(function attach() {
  Transactions.simpleSchema({ category: 'bill' }).i18n('schemaTransactions');
  Transactions.simpleSchema({ category: 'bill' }).i18n('schemaBills');
});

// --- Factory ---

Factory.define('bill', Transactions, {
  category: 'bill',
  valueDate: () => Clock.currentDate(),
  partnerId: () => Factory.get('supplier'),
  issueDate: () => Clock.currentDate(),
  deliveryDate: () => Clock.currentDate(),
  dueDate: () => Clock.currentDate(),
  lines: () => [{
    title: faker.random.word(),
    uom: 'piece',
    quantity: 1,
    unitPrice: faker.random.number(10000),
    account: '85',
    localizer: '@',
  }],
});
