import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { AutoForm } from 'meteor/aldeed:autoform';
import { Modal } from 'meteor/peppelg:bootstrap-3-modal';
import { ModalStack } from '/imports/ui_3/lib/modal-stack.js';

import { __ } from '/imports/localization/i18n.js';
import { importCollectionFromFile } from '/imports/ui_3/views/components/import-dialog.js';
import { BatchAction } from '/imports/api/batch-action.js';
import { defaultNewDoc } from '/imports/ui_3/lib/active-community.js';
import { Meters } from './meters.js';
import './methods.js';

Meters.actions = {
  new: (options, doc = defaultNewDoc(), user = Meteor.userOrNull()) => ({
    name: 'new',
    label: __('new') + ' ' + __('meter'),
    icon: 'fa fa-plus',
    color: 'primary',
    visible: user.hasPermission('meters.insert', doc),
    run() {
      Modal.show('Autoform_modal', {
        id: 'af.meter.insert',
        collection: Meters,
        doc,
        omitFields: ['readings'],
        type: 'method',
        meteormethod: 'meters.insert',
      });
    },
  }),
  import: (options, doc, user = Meteor.userOrNull()) => ({
    name: 'import',
    icon: 'fa fa-upload',
    visible: user.hasPermission('meters.upsert', doc),
    run: () => importCollectionFromFile(Meters),
  }),
  view: (options, doc, user = Meteor.userOrNull()) => ({
    name: 'view',
    icon: 'fa fa-eye',
    visible: user.hasPermission('parcels.details', doc.parcel()),
    run() {
      Modal.show('Autoform_modal', {
        id: 'af.meter.view',
        collection: Meters,
        doc,
        type: 'readonly',
      });
    },
  }),
  edit: (options, doc, user = Meteor.userOrNull()) => ({
    name: 'edit',
    icon: 'fa fa-pencil',
    visible: user.hasPermission('meters.update', doc),
    run() {
      Modal.show('Autoform_modal', {
        id: 'af.meter.update',
        collection: Meters,
        omitFields: ['readings'],
        doc,
        type: 'method-update',
        meteormethod: 'meters.update',
        singleMethodArgument: true,
      });
    },
  }),
  editReadings: (options, doc, user = Meteor.userOrNull()) => ({
    name: 'editReadings',
    icon: 'fa fa-pencil',
    visible: user.hasPermission('meters.update', doc),
    run() {
      Modal.show('Autoform_modal', {
        id: 'af.meter.update',
        collection: Meters,
        fields: ['readings'],
        doc,
        type: 'method-update',
        meteormethod: 'meters.update',
        singleMethodArgument: true,
      });
    },
  }),
  registerReading: (options, doc, user = Meteor.userOrNull()) => ({
    name: 'registerReading',
    icon: 'fa fa-camera',
    color: doc.lastReadingColor(),
    visible: user.hasPermission('meters.registerReading', doc),
    run() {
      ModalStack.setVar('meterId', doc._id);
      Modal.show('Autoform_modal', {
        id: 'af.meter.registerReading',
        schema: Meters.registerReadingSchema,
        type: 'method',
        meteormethod: 'meters.registerReading',
      });
    },
  }),
  period: (options, doc, user = Meteor.userOrNull()) => ({
    name: 'period',
    icon: 'fa fa-history',
    visible: user.hasPermission('meters.update', doc),
    run() {
      Modal.show('Autoform_modal', {
        id: 'af.meter.update',
        collection: Meters,
        fields: ['activeTime'],
        doc,
        type: 'method-update',
        meteormethod: 'meters.update',
        singleMethodArgument: true,
      });
    },
  }),
  delete: (options, doc, user = Meteor.userOrNull()) => ({
    name: 'delete',
    icon: 'fa fa-trash',
    visible: user.hasPermission('meters.remove', doc),
    run() {
      Modal.confirmAndCall(Meters.methods.remove, { _id: doc._id }, {
        action: 'delete meter',
        message: 'You should rather archive it',
      });
    },
  }),
};

Meters.batchActions = {
  delete: new BatchAction(Meters.actions.delete, Meters.methods.batch.remove),
};

//-----------------------------------------------

AutoForm.addModalHooks('af.meter.insert');
AutoForm.addModalHooks('af.meter.update');
AutoForm.addModalHooks('af.meter.registerReading');
AutoForm.addHooks('af.meter.insert', {
  formToDoc(doc) {
    doc.parcelId = ModalStack.getVar('parcelId');
    //    doc.approved = true;
    return doc;
  },
});
AutoForm.addHooks('af.meter.update', {
  formToModifier(modifier) {
    //    modifier.$set.approved = true;
    return modifier;
  },
});
AutoForm.addHooks('af.meter.registerReading', {
  formToDoc(doc) {
    doc._id = ModalStack.getVar('meterId');
    return doc;
  },
});
