import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { moment } from 'meteor/momentjs:moment';
import { ReactiveDict } from 'meteor/reactive-dict';
import { TAPi18n } from 'meteor/tap:i18n';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Modal } from 'meteor/peppelg:bootstrap-3-modal';
import { _ } from 'meteor/underscore';
import { datatables_i18n } from 'meteor/ephemer:reactive-datatables';
import { __ } from '/imports/localization/i18n.js';
import { currentUserLanguage } from '/imports/startup/client/language.js';
import { DatatablesExportButtons } from '/imports/ui_3/views/blocks/datatables.js';
import { Topics } from '/imports/api/topics/topics.js';
import '/imports/api/topics/actions.js';
import '/imports/api/topics/tickets/actions.js';
import { Tickets } from '/imports/api/topics/tickets/tickets.js';
import { ticketColumns } from '/imports/api/topics/tickets/tables.js';
import { importCollectionFromFile } from '/imports/utils/import.js';
import '/imports/ui_3/views/modals/autoform-modal.js';
import '/imports/ui_3/views/modals/confirmation.js';
import '/imports/ui_3/views/blocks/chopped.js';
import '/imports/ui_3/views/components/new-ticket.js';
import { ContextMenu } from '/imports/ui_3/views/components/context-menu';
import { actionHandlers } from '/imports/ui_3/views/blocks/action-buttons.js';
import './worksheets.html';

Template.Worksheets.onCreated(function onCreated() {
  Session.set('activePartnerRelation', 'supplier');
  this.getCommunityId = () => FlowRouter.getParam('_cid') || Session.get('activeCommunityId');
  this.autorun(() => {
    const communityId = this.getCommunityId();
    this.subscribe('communities.byId', { _id: communityId });
    this.subscribe('topics.list', { communityId, category: 'ticket' });
    this.subscribe('contracts.inCommunity', { communityId });
    this.subscribe('partners.inCommunity', { communityId });
  });
});

Template.Worksheets.onDestroyed(function onDestroyed() {
  Session.update('modalContext', 'expectedStart', undefined);
});

Template.Worksheets.viewmodel({
  eventsToUpdate: {},
  calendarView: false,
  showNeedToSaveWarning: true,
  searchText: '',
  ticketStatusSelected: [],
  ticketTypeSelected: [],
  ticketUrgencySelected: [],
  startDate: '',
  endDate: '',
  reportedByCurrentUser: false,
  communityId: null,
  onCreated() {
    this.communityId(this.templateInstance.getCommunityId());
    this.setDefaultFilter();
    ContextMenu.initialize('Worksheets', Topics, this);
  },
  setDefaultFilter() {
    this.searchText('');
    this.ticketStatusSelected([]);
    this.ticketTypeSelected([]);
    this.ticketUrgencySelected([]);
    this.startDate(moment().subtract(30, 'days').format('YYYY-MM-DD'));
    this.endDate('');
    this.reportedByCurrentUser(false);
  },
  addEventsToUpdate(eventObject) {
    const eventsToUpdate = this.eventsToUpdate();
    eventsToUpdate[eventObject.id] = eventObject;
    const newRef = _.clone(eventsToUpdate);
    this.eventsToUpdate(newRef);
  },
  warnToSave() {
    const viewmodel = this;
    if (viewmodel.showNeedToSaveWarning()) {
      Modal.show('Modal', {
        title: 'Warning',
        text: __('youNeedToSaveYourChanges'),
        btnOK: 'OK',
        onOK() { viewmodel.showNeedToSaveWarning(false); },
      });
    }
  },
  calendarOptions() {
    const viewmodel = this;
    return {
      lang: currentUserLanguage(),
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay',
      },
      eventClick(eventObject, jsEvent) {
        event.stopPropagation();
        const contextObj = {
          template: 'Action_buttons_dropdown_list',
          actions: 'statusUpdate,statusChange,edit,delete',
          collection: 'topics',
          options: {},
          id: eventObject._id,
        };
        ContextMenu.show(event, contextObj, viewmodel);
      },
      dayClick(date, jsEvent, view) {
        Session.update('modalContext', 'expectedStart', date.toDate());
        event.stopPropagation();
        const contextObj = {
          template: 'New_Ticket',
        };
        ContextMenu.show(event, contextObj, viewmodel );
      },
      eventResizeStop(eventObject, jsEvent, ui, view) {
        viewmodel.addEventsToUpdate(eventObject);
        viewmodel.warnToSave();
      },
      eventDrop(eventObject) {
        viewmodel.addEventsToUpdate(eventObject);
        viewmodel.warnToSave();
      },
      editable: true,
      events(start, end, timezone, callback) {
        const events = Topics.find(viewmodel.filterSelector()).fetch().map(function (t) {
        const start = t.ticket.actualStart || t.ticket.expectedStart || t.createdAt;
        const end = t.ticket.actualFinish || t.ticket.expectedFinish;
        const editable = _.contains(t.modifiableFieldsByStatus(), 'expectedStart');
          return {
            title: t.title,
            start,
            end,
            color: Tickets.statuses[t.status].colorCode,
            id: t._id,
            status: t.status,
            editable,
          };
        });
        if (!_.isEmpty(viewmodel.eventsToUpdate())) {
          const eventsToUpdate = viewmodel.eventsToUpdate();
          events.forEach((eventObject) => {
            if (eventsToUpdate[eventObject.id]) {
              if (eventsToUpdate[eventObject.id].start) eventObject.start = eventsToUpdate[eventObject.id].start.toISOString();
              if (eventsToUpdate[eventObject.id].end) eventObject.end = eventsToUpdate[eventObject.id].end.toISOString();
            }
          });
        }
        callback(events);
      },
    };
  },
  ticketStatuses() {
    return Object.values(Tickets.statuses);
  },
  ticketTypes() {
    return Tickets.typeValues;
  },
  ticketUrgencies() {
    return Tickets.urgencyValues;
  },
  ticketsUrgencyColor(name) {
    return Tickets.urgencyColors[name];
  },
  hasFilters() {
    if (this.searchText() ||
        this.ticketStatusSelected().length ||
        this.ticketTypeSelected().length ||
        this.ticketUrgencySelected().length ||
        this.startDate() !== moment().subtract(30, 'days').format('YYYY-MM-DD') ||
        this.endDate() ||
        this.reportedByCurrentUser()) return true;
    return false;
  },
  activeButton(type, elem) {
    const selected = this[`${type}Selected`]();
    return selected.includes(elem) && 'active';
  },
  recentTickets() {
    const communityId = Session.get('activeCommunityId');
    const recentTickets = [];
    const allTickets = Topics.find({ communityId, category: 'ticket',
      $or: [{ status: { $ne: 'closed' } }, { createdAt: { $gt: moment().subtract(1, 'week').toDate() } }],
    }, { sort: { createdAt: -1 } }).fetch();
    for (let i = 0; i <= 1; i += 1) {
      recentTickets.push(allTickets[i]);
    }
    return recentTickets;
  },
  filterSelector() {
    const communityId = Session.get('activeCommunityId');
    const ticketStatusSelected = this.ticketStatusSelected();
    const ticketTypeSelected = this.ticketTypeSelected();
    const ticketUrgencySelected = this.ticketUrgencySelected();
    const startDate = this.startDate();
    const endDate = this.endDate();
    const reportedByCurrentUser = this.reportedByCurrentUser();
    const selector = { communityId, category: 'ticket' };
    if (ticketStatusSelected.length > 0) selector.status = { $in: ticketStatusSelected };
    if (ticketTypeSelected.length > 0) selector['ticket.type'] = { $in: ticketTypeSelected };
    if (ticketUrgencySelected.length > 0) selector['ticket.urgency'] = { $in: ticketUrgencySelected };
    selector.createdAt = {};
    if (startDate) selector.createdAt.$gte = new Date(startDate);
    if (endDate) selector.createdAt.$lte = new Date(endDate);
    if (reportedByCurrentUser) selector.creatorId = Meteor.userId();
    return selector;
  },
  ticketsDataFn() {
    return () => {
      const selector = this.filterSelector();
      const searchText = this.searchText();
      let result = Topics.find(selector, { sort: { createdAt: -1 } }).fetch();
      if (searchText) result = result.filter(t =>
        t.title.toLowerCase().search(searchText.toLowerCase()) >= 0
        || t.text.toLowerCase().search(searchText.toLowerCase()) >= 0
      );
      return result;
    };
  },
  ticketsOptionsFn() {
    const self = this;
    return () => {
      const communityId = self.communityId();
      const permissions = {
        view: true,
        edit: Meteor.userOrNull().hasPermission('ticket.update', { communityId }),
        statusChange: Meteor.userOrNull().hasPermission('ticket.statusChange', { communityId }),
        statusUpdate: Meteor.userOrNull().hasPermission('ticket.statusChange', { communityId }),
        delete: Meteor.userOrNull().hasPermission('ticket.remove', { communityId }),
      };
      return {
        id: 'tickets',
        columns: ticketColumns(permissions),
        tableClasses: 'display',
        language: datatables_i18n[TAPi18n.getLanguage()],
        searching: false,
        paging: false,
        ...DatatablesExportButtons,
      };
    };
  },
});

Template.Worksheets.events({ 
  ...(actionHandlers(Topics, 'new,view')),
  'click .js-mode'(event, instance) {
    const oldVal = instance.viewmodel.calendarView();
    instance.viewmodel.calendarView(!oldVal);
  },
  'click .js-import'(event, instance) {
    importCollectionFromFile(Topics); // TODO Make it Ticket specific
  },
  'click .js-clear-filter'(event, instance) {
    instance.viewmodel.setDefaultFilter();
  },
  'click .js-filter'(event, instance) {
    const key = $(event.target).data('key');
    const value = $(event.target).data('value');
    const vmFunc = instance.viewmodel[`${key}Selected`];
    const selected = vmFunc();
    if (selected.includes(value)) {
      vmFunc(_.without(selected, value));
      $(event.target).blur();
    } else {
      selected.push(value);
      vmFunc(selected);
    }
  },
  'click .js-save-calendar'(event, instance) {
    const eventsToUpdate = instance.viewmodel.eventsToUpdate();
    const args = [];
    const communityId = instance.viewmodel.communityId();
    _.forEach(eventsToUpdate, function(value, key) {
      const dates = {};
      if (value.start) dates['ticket.expectedStart'] = value.start.toISOString();
      if (value.end) dates['ticket.expectedFinish'] = value.end.toISOString();
      const modifier = { $set: dates };
      args.push({ _id: key, modifier });
    });
    Topics.methods.batch.statusUpdate.call({ args });
    instance.viewmodel.eventsToUpdate({});
  },
  'click .js-cancel-calendar'(event, instance) {
    instance.viewmodel.eventsToUpdate({});
  },
});
