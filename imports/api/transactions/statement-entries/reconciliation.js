import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { AutoForm } from 'meteor/aldeed:autoform';

import { ModalStack } from '/imports/ui_3/lib/modal-stack.js';
import { __ } from '/imports/localization/i18n.js';
import { Transactions } from '/imports/api/transactions/transactions.js';
import { Txdefs } from '/imports/api/transactions/txdefs/txdefs.js';
import { StatementEntries } from '/imports/api/transactions/statement-entries/statement-entries.js';

export const chooseTxdef = {
  options() {
    const communityId = ModalStack.getVar('communityId');
    const txdefs = Txdefs.find({ communityId });
    const options = txdefs.map(txdef => ({ label: __(txdef.name), value: txdef._id }));
    return options;
  },
  firstOption() {
    return false;
//    const txdef = ModalStack.getVar('txdef');
//    return txdef._id;
  },
};

export const chooseTransaction = {
  relation: 'transaction',
  value() {
    const selfId = AutoForm.getFormId();
    const category = ModalStack.getVar('txdef').category;
    return ModalStack.readResult(selfId, `af.${category}.insert`);
  },
  options() {
    const communityId = ModalStack.getVar('communityId');
    const txdef = ModalStack.getVar('txdef');
    const txs = Transactions.find({ communityId, defId: txdef._id, seId: { $exists: false } });
    const options = txs.map(tx => ({ label: tx.serialId, value: tx._id }));
    return options;
  },
  firstOption: () => __('(Select one)'),
};

export const reconciliationSchema = new SimpleSchema({
  _id: { type: String, regEx: SimpleSchema.RegEx.Id, autoform: { omit: true } },
  txId: { type: String, regEx: SimpleSchema.RegEx.Id, optional: true, autoform: chooseTransaction },
  defId: { type: String, regEx: SimpleSchema.RegEx.Id, optional: true, autoform: chooseTxdef },
});

Meteor.startup(function attach() {
  reconciliationSchema.i18n('schemaStatementEntries');
  reconciliationSchema.i18n('schemaTransactions');
});
