/* eslint-env mocha */
import { Meteor } from 'meteor/meteor';
import { chai, assert } from 'meteor/practicalmeteor:chai';
import { freshFixture, logDB } from '/imports/api/test-utils.js';
import { Breakdowns } from './breakdowns.js';
import './methods.js';
import { PeriodBreakdown, SideBreakdown } from './breakdowns-utils';

if (Meteor.isServer) {
  let Fixture;
  let breakdown;

  describe('breakdowns', function () {
    this.timeout(5000);
    before(function () {
      Fixture = freshFixture();
    });
    after(function () {
      Breakdowns.remove({});
    });

    describe('api', function () {
      before(function () {
        const rootId = Breakdowns.define({ communityId: null,
          name: 'Root',
          children: [
            { digit: '1', name: 'Level1',
              children: [
                { digit: '2', name: 'Level2',
                  children: [
                  { digit: 'A', name: 'LeafA' },
                  { digit: 'B', name: 'LeafB' },
                  { digit: 'C', name: 'LeafC' },
                  ],
                },
                { name: '',
                  children: [
                  { digit: 'D', name: 'LeafD' },
                  ],
                },
              ],
            },
            { name: '',
              children: [
                { name: '',
                  children: [
                  { digit: 'E', name: 'LeafE' },
                  ],
                },
                { digit: '3', name: 'Level3',
                  children: [
                  { digit: 'F', name: 'LeafF' },
                  ],
                },
              ],
            },
          ],
        });
        breakdown = Breakdowns.findOne(rootId);
      });

      it('access to leaf names', function () {
        const leafNames = breakdown.leafNames();
        const expectedLeafNames = ['LeafA', 'LeafB', 'LeafC', 'LeafD', 'LeafE', 'LeafF'];
        chai.assert.deepEqual(leafNames, expectedLeafNames);
      });

      it('access to leaf paths', function () {
        const leafPaths = breakdown.leafs().map(l => l.path);
        const expectedLeaPaths = [
          ['Root', 'Level1', 'Level2', 'LeafA'],
          ['Root', 'Level1', 'Level2', 'LeafB'],
          ['Root', 'Level1', 'Level2', 'LeafC'],
          ['Root', 'Level1', 'LeafD'],
          ['Root', 'LeafE'],
          ['Root', 'Level3', 'LeafF'],
        ];
        chai.assert.deepEqual(leafPaths, expectedLeaPaths);
      });

      it('access to node names', function () {
        const nodeNames = breakdown.nodeNames();
        const expectedNodeNames = [
          'Root',
          'Level1',
          'Level2',
          'LeafA',
          'LeafB',
          'LeafC',
          'LeafD',  // under Level1
          'LeafE',  // under Root
          'Level3',
          'LeafF',
        ];
        chai.assert.deepEqual(nodeNames, expectedNodeNames);
      });

      it('access to leaf codes', function () {
        const leafCodes = breakdown.leafCodes();
        const expectedLeafCodes = ['12A', '12B', '12C', '1D', 'E', '3F'];
        chai.assert.deepEqual(leafCodes, expectedLeafCodes);
      });

      it('access to leaf options', function () {
        const leafOptions = breakdown.leafOptions();
        const expectedLeafOptions = [
          { label: '12A: LeafA', value: '12A' },
          { label: '12B: LeafB', value: '12B' },
          { label: '12C: LeafC', value: '12C' },
          { label: '1D: LeafD',  value: '1D' },
          { label:  'E: LeafE',  value: 'E' },
          { label: '3F: LeafF',  value: '3F' },
        ];
        chai.assert.deepEqual(leafOptions, expectedLeafOptions);
      });

      it('access to node options', function () {
        const nodeOptions = breakdown.nodeOptions();
        const expectedNodeOptions = [
          { label: ': Root',     value: '' },
          { label: '1: Level1',  value: '1' },
          { label: '12: Level2', value: '12' },
          { label: '12A: LeafA', value: '12A' },
          { label: '12B: LeafB', value: '12B' },
          { label: '12C: LeafC', value: '12C' },
          { label: '1D: LeafD',  value: '1D' },
          { label:  'E: LeafE',  value: 'E' },
          { label: '3: Level3',  value: '3' },
          { label: '3F: LeafF',  value: '3F' },
        ];
        chai.assert.deepEqual(nodeOptions, expectedNodeOptions);
      });
    });

    describe('construction', function () {
      before(function () {
        Breakdowns.define({ communityId: null,
          digit: '2', name: 'includeLevel2',
          children: [
            { digit: 'A', name: 'LeafA' },
            { digit: 'B', name: 'LeafB' },
            { digit: 'C', name: 'LeafC' },
          ],
        });

        Breakdowns.define({ communityId: null,
          digit: '3', name: 'includeSub',
          children: [
            { digit: '1', name: 'Leaf1' },
            { digit: '2', name: 'Types', include: 'includeTypes' },
          ],
        });

        Breakdowns.define({ communityId: null,
          digit: 'D', name: 'includeLeafD',
        });

        Breakdowns.define({ communityId: null,
          digit: '1', name: 'includeLevel1',
          children: [
            { digit: '2', name: 'Level2',
              include: 'includeLevel2',
            },
            { name: '',
              children: [
              { digit: 'D', name: 'LeafD', include: 'includeLeafD' },
              ],
            },
          ],
        });

        const assemblyId = Breakdowns.define({ communityId: null,
          name: 'Assembly',
          children: [
            { name: 'Level1',
              include: 'includeLevel1',
            },
            { name: '',
              children: [
                { name: '',
                  children: [
                  { digit: 'E', name: 'LeafE' },
                  ],
                },
                { digit: '3', name: 'Level3',
                  children: [
                  { digit: 'F', name: 'LeafF' },
                  ],
                },
              ],
            },
          ],
        });

        breakdown = Breakdowns.findOne(assemblyId);
      });

      it('clones for a community simply renaming it', function () {
        Breakdowns.define({ communityId: null, name: 'Simple', children: [{ digit: '1', name: 'One' }] });
        Breakdowns.define({ communityId: Fixture.demoCommunityId, name: 'DemoSimple', include: 'Simple' });
        const demoSimple = Breakdowns.findOneByName('DemoSimple', Fixture.demoCommunityId);
        chai.assert.deepEqual(demoSimple.nodeOptions(), [
          { label: ': DemoSimple', value: '' },
          { label: '1: One', value: '1' },
        ]);
      });

      it('clones for a community', function () {
        const root = Breakdowns.findOneByName('Root', Fixture.demoCommunityId);
        chai.assert.equal(root.communityId, null);  // it is generic template
        const cloneId = Breakdowns.methods.clone._execute({ userId: Fixture.demoAccountantId }, {
          name: 'Root', communityId: Fixture.demoCommunityId,
        });
        const clone = Breakdowns.findOne(cloneId);
        chai.assert.equal(clone.communityId, Fixture.demoCommunityId);
        chai.assert.equal(clone.name, 'Root');
        const myRoot = Breakdowns.findOneByName('Root', Fixture.demoCommunityId);
        chai.assert.equal(myRoot.communityId, Fixture.demoCommunityId);
        delete root._id; delete root.createdAt; delete root.updatedAt; delete root.communityId;
        delete myRoot._id; delete myRoot.createdAt; delete myRoot.updatedAt; delete myRoot.communityId;
        chai.assert.deepEqual(root, myRoot);    // YET the same, other than those

        // but if we modify it, only our copy changes
        Breakdowns.methods.update._execute({ userId: Fixture.demoAccountantId }, {
          _id: cloneId, modifier: { $set: { name: 'MyRoot' } },
        });
        const rootNew = Breakdowns.findOneByName('Root', null);
        const cloneNew = Breakdowns.findOne(cloneId);
        chai.assert.equal(rootNew.name, 'Root');
        chai.assert.equal(cloneNew.name, 'MyRoot');
      });

      it('assembles included parts', function () {
        // console.log(PeriodBreakdown.leafOptions());
        chai.assert.deepEqual(PeriodBreakdown.leafOptions(), [
          { label: 'T-2017-1: JAN', value: 'T-2017-1' },
          { label: 'T-2017-2: FEB', value: 'T-2017-2' },
          { label: 'T-2017-3: MAR', value: 'T-2017-3' },
          { label: 'T-2017-4: APR', value: 'T-2017-4' },
          { label: 'T-2017-5: MAY', value: 'T-2017-5' },
          { label: 'T-2017-6: JUN', value: 'T-2017-6' },
          { label: 'T-2017-7: JUL', value: 'T-2017-7' },
          { label: 'T-2017-8: AUG', value: 'T-2017-8' },
          { label: 'T-2017-9: SEP', value: 'T-2017-9' },
          { label: 'T-2017-10: OCT', value: 'T-2017-10' },
          { label: 'T-2017-11: NOV', value: 'T-2017-11' },
          { label: 'T-2017-12: DEC', value: 'T-2017-12' },
          { label: 'T-2018-1: JAN', value: 'T-2018-1' },
          { label: 'T-2018-2: FEB', value: 'T-2018-2' },
          { label: 'T-2018-3: MAR', value: 'T-2018-3' },
          { label: 'T-2018-4: APR', value: 'T-2018-4' },
          { label: 'T-2018-5: MAY', value: 'T-2018-5' },
          { label: 'T-2018-6: JUN', value: 'T-2018-6' },
          { label: 'T-2018-7: JUL', value: 'T-2018-7' },
          { label: 'T-2018-8: AUG', value: 'T-2018-8' },
          { label: 'T-2018-9: SEP', value: 'T-2018-9' },
          { label: 'T-2018-10: OCT', value: 'T-2018-10' },
          { label: 'T-2018-11: NOV', value: 'T-2018-11' },
          { label: 'T-2018-12: DEC', value: 'T-2018-12' },
          { label: 'T-2019-1: JAN', value: 'T-2019-1' },
          { label: 'T-2019-2: FEB', value: 'T-2019-2' },
          { label: 'T-2019-3: MAR', value: 'T-2019-3' },
          { label: 'T-2019-4: APR', value: 'T-2019-4' },
          { label: 'T-2019-5: MAY', value: 'T-2019-5' },
          { label: 'T-2019-6: JUN', value: 'T-2019-6' },
          { label: 'T-2019-7: JUL', value: 'T-2019-7' },
          { label: 'T-2019-8: AUG', value: 'T-2019-8' },
          { label: 'T-2019-9: SEP', value: 'T-2019-9' },
          { label: 'T-2019-10: OCT', value: 'T-2019-10' },
          { label: 'T-2019-11: NOV', value: 'T-2019-11' },
          { label: 'T-2019-12: DEC', value: 'T-2019-12' },
          { label: 'T-2020-1: JAN', value: 'T-2020-1' },
          { label: 'T-2020-2: FEB', value: 'T-2020-2' },
          { label: 'T-2020-3: MAR', value: 'T-2020-3' },
          { label: 'T-2020-4: APR', value: 'T-2020-4' },
          { label: 'T-2020-5: MAY', value: 'T-2020-5' },
          { label: 'T-2020-6: JUN', value: 'T-2020-6' },
          { label: 'T-2020-7: JUL', value: 'T-2020-7' },
          { label: 'T-2020-8: AUG', value: 'T-2020-8' },
          { label: 'T-2020-9: SEP', value: 'T-2020-9' },
          { label: 'T-2020-10: OCT', value: 'T-2020-10' },
          { label: 'T-2020-11: NOV', value: 'T-2020-11' },
          { label: 'T-2020-12: DEC', value: 'T-2020-12' },
        ]);
      });

      it('assembles imported parts', function () {
        Breakdowns.define({ communityId: Fixture.demoCommunityId, name: 'DemoAssembly', include: 'Assembly' });
        const commonRoot = Breakdowns.findOneByName('Root', null);
        const demoHouseRoot = Breakdowns.findOneByName('DemoAssembly', Fixture.demoCommunityId);

        demoHouseRoot.name = 'Root';
        chai.assert.deepEqual(demoHouseRoot.leafOptions(), commonRoot.leafOptions());
      });
    });
  });
}