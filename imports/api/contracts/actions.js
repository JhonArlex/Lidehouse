import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { AutoForm } from 'meteor/aldeed:autoform';

import { __ } from '/imports/localization/i18n.js';
import { Modal } from 'meteor/peppelg:bootstrap-3-modal';
import { currentUserHasPermission } from '/imports/ui_3/helpers/permissions.js';
import { handleError, onSuccess, displayMessage } from '/imports/ui_3/lib/errors.js';
import { Contracts } from './contracts.js';
import './methods.js';

Contracts.actions = {
  new: (options, doc, user = Meteor.userOrNull()) => ({
    name: 'new',
    icon: 'fa fa-plus',
    visible: user.hasPermission('contracts.insert', doc),
    run() {
      Modal.show('Autoform_modal', {
        id: 'af.contract.insert',
        collection: Contracts,
        type: 'method',
        meteormethod: 'contracts.insert',
      });
    },
  }),
  view: (options, doc, user = Meteor.userOrNull()) => ({
    name: 'view',
    icon: 'fa fa-eye',
    visible: user.hasPermission('contracts.inCommunity', doc),
    run() {
      Modal.show('Autoform_modal', {
        id: 'af.contract.view',
        collection: Contracts,
        doc,
        type: 'readonly',
      });
    },
  }),
  edit: (options, doc, user = Meteor.userOrNull()) => ({
    name: 'edit',
    icon: 'fa fa-pencil',
    visible: user.hasPermission('contracts.update', doc),
    run() {
      Modal.show('Autoform_modal', {
        id: 'af.contract.update',
        collection: Contracts,
        doc,
        type: 'method-update',
        meteormethod: 'contracts.update',
        singleMethodArgument: true,
      });
    },
  }),
  delete: (options, doc, user = Meteor.userOrNull()) => ({
    name: 'delete',
    icon: 'fa fa-trash',
    visible: user.hasPermission('contracts.remove', doc),
    run() {
      Modal.confirmAndCall(Contracts.methods.remove, { _id: doc._id }, {
        action: 'delete contract',
        message: 'It will disappear forever',
      });
    },
  }),
};

//-------------------------------------------------------

AutoForm.addModalHooks('af.contract.insert');
AutoForm.addModalHooks('af.contract.update');

AutoForm.addHooks('af.contract.insert', {
  formToDoc(doc) {
    doc.communityId = Session.get('activeCommunityId');
    return doc;
  },
});
