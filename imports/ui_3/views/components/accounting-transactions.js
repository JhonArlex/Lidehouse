/* globals document */
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Session } from 'meteor/session';
import { TAPi18n } from 'meteor/tap:i18n';
import { AutoForm } from 'meteor/aldeed:autoform';
import { Modal } from 'meteor/peppelg:bootstrap-3-modal';
import { datatables_i18n } from 'meteor/ephemer:reactive-datatables';
import { __ } from '/imports/localization/i18n.js';

import { DatatablesExportButtons } from '/imports/ui_3/views/blocks/datatables.js';
import { onSuccess, handleError, displayMessage, displayError } from '/imports/ui_3/lib/errors.js';
import { Breakdowns } from '/imports/api/transactions/breakdowns/breakdowns.js';
import '/imports/api/transactions/breakdowns/methods.js';
import { ChartOfAccounts } from '/imports/api/transactions/breakdowns/chart-of-accounts.js';
import { Localizer } from '/imports/api/transactions/breakdowns/localizer.js';
import { Transactions } from '/imports/api/transactions/transactions.js';
import '/imports/api/transactions/methods.js';
import { Balances } from '/imports/api/transactions/balances/balances.js';
import '/imports/api/transactions/balances/methods.js';
import { TxCats } from '/imports/api/transactions/tx-cats/tx-cats.js';
import '/imports/api/transactions/tx-cats/methods.js';
import { transactionColumns } from '/imports/api/transactions/tables.js';
import '/imports/api/transactions/actions.js';
import '/imports/api/transactions/categories';
import { actionHandlers } from '/imports/ui_3/views/blocks/action-buttons.js';
import '/imports/ui_3/views/modals/confirmation.js';
import '/imports/ui_3/views/modals/autoform-modal.js';
import './accounting-transactions.html';

Template.Accounting_transactions.viewmodel({
  txCatSelected: '',
  txCatOptions: [],
  creditAccountSelected: '',
  creditAccountOptions: [],
  debitAccountSelected: '',
  debitAccountOptions: [],
  localizerSelected: '',
  localizerOptions: [],
//  partnerSelected: '',
//  referenceIdSelected: '',
  beginDate: '',
  endDate: '',
//  amount: undefined,
  onCreated(instance) {
    instance.autorun(() => {
      const communityId = this.communityId();
      instance.subscribe('breakdowns.inCommunity', { communityId });
      instance.subscribe('txCats.inCommunity', { communityId });
      instance.subscribe('transactions.incomplete', { communityId });
      instance.subscribe('bills.outstanding', { communityId });
    });
  },
  communityId() {
    return Session.get('activeCommunityId');
  },
  autorun: [
    function setTxCatOptions() {
      const communityId = Session.get('activeCommunityId');
      this.txCatOptions(TxCats.find({ communityId }).map(function (cat) {
        return { value: cat._id, label: __(cat.name) };
      }));
      if (!this.txCatSelected() && this.txCatOptions() && this.txCatOptions().length > 0) {
        this.txCatSelected(this.txCatOptions()[0].value);
      }
    },
    function setFilterAccountOptions() {
      const txCat = TxCats.findOne(this.txCatSelected());
      const coa = ChartOfAccounts.get();
      const loc = Localizer.get();
      if (!txCat || !coa || !loc) return;
      this.creditAccountOptions(coa.nodeOptionsOf(txCat.credit));
      this.debitAccountOptions(coa.nodeOptionsOf(txCat.debit));
      this.creditAccountSelected(txCat.credit[0]);
      this.debitAccountSelected(txCat.debit[0]);
      this.localizerOptions(loc.nodeOptions());
    },
    function txSubscription() {
      this.templateInstance.subscribe('transactions.betweenAccounts', this.subscribeParams());
    },
  ],
  txCats() {
    const communityId = Session.get('activeCommunityId');
    const txCats = TxCats.find({ communityId }).fetch().filter(c => c.isSimpleTx());
    return txCats;
  },
  optionsOf(accountCode) {
//    const accountSpec = new AccountSpecification(communityId, accountCode, undefined);
    const brk = Breakdowns.findOneByName('ChartOfAccounts', this.communityId());
    if (brk) return brk.nodeOptionsOf(accountCode, true);
    return [];
  },
  subscribeParams() {
    return {
      communityId: this.communityId(),
      catId: this.txCatSelected(),
      creditAccount: '\\^' + this.creditAccountSelected() + '\\',
      debitAccount: '\\^' + this.debitAccountSelected() + '\\',
      begin: new Date(this.beginDate()),
      end: new Date(this.endDate()),
    };
  },
  transactionsTableDataFn() {
    const templateInstance = Template.instance();
    return () => {
      if (!templateInstance.subscriptionsReady()) return [];
      const selector = Transactions.makeFilterSelector(this.subscribeParams());
      return Transactions.find(selector).fetch();
    };
  },
  transactionsOptionsFn() {
    return () => Object.create({
      columns: transactionColumns(),
      tableClasses: 'display',
      language: datatables_i18n[TAPi18n.getLanguage()],
      ...DatatablesExportButtons,
    });
  },
});

Template.Accounting_transactions.events(
  actionHandlers(Transactions),
);
