import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
import { Breakdowns } from './breakdowns.js';

export function defineBreakdownTemplates() {

  //if (Breakdowns.findOne({})) return;

//Kettős könyvelés verzió

  Breakdowns.define({ communityId: null,
    digit: '1', name: 'Befektetett Eszközök', locked: true, sign: +1,
    children: [
    ],
  });

  Breakdowns.define({ communityId: null,
    digit: '2', name: 'Készletek', locked: true, sign: +1,
    children: [
    ],
  });

  Breakdowns.define({ communityId: null,
    digit: '3', name: 'Assets', locked: true, sign: +1,
    children: [
      { digit: '1', name: 'Tárgyi és immateriális',
        children: [
        { digit: '1', name: 'Vagyoni értékű jogok' },
        { digit: '2', name: 'Műszaki berendezések' },
        ],
      },
      { digit: '2', name: 'Money accounts',
        children: [
        { digit: '1', name: 'Folyószámla' },
        { digit: '2', name: 'Megtakarítási számla' },
        { digit: '3', name: 'Pénztár' },
        ],
      },
      { digit: '3', name: 'Owner obligations',
        include: 'Owner payin types',
      },
      { digit: '4', name: 'Hátralékok',
        children: [
        { digit: '1', name: 'Albetétek jelzáloggal nem terhelt hátraléka' },
        { digit: '2', name: 'Albetétek jelzáloggal terhelt hátraléka' },
        ],
      },
      { digit: '5', name: 'Egyéb követelések' },
    ],
  });

  Breakdowns.define({ communityId: null,
    digit: '4', name: 'Liabilities', locked: true, sign: -1,
    children: [
      { digit: '1', name: 'Equity', locked: true,
        children: [
            { digit: '9', name: 'Adózott eredmény' },
        ],
      },
      { digit: '3', name: 'Unidentified items',
        children: [
        { digit: '1', name: 'Unidentified incomes' },
        { digit: '2', name: 'Unidentified expenses' },
        ],
      },
      { digit: '4', name: 'Hitelek',
        children: [
        { digit: '1', name: 'Bank hitel' },
        { digit: '2', name: 'Egyéb hitel' },
        ],
      },
      { digit: '5', name: 'Szállítók' },
    ],
  });
  Breakdowns.define({ communityId: null,
    digit: '5', name: 'Költség nemek', locked: true, sign: +1,
    children: [
        { digit: '1', name: 'ANYAGKÖLTSÉG',
       children: [
           { digit: '1', name: 'Közüzemi díjak' }, 
         
         //kibontani
         
           { digit: '2', name: 'Anyagok' },
        ],
        },
        { digit: '2', name: 'SZOLGÁLTATÁSOK KÖLTSÉGEI',  
        children: [
           { digit: '01', name: 'Csatorna díjak' }, 
           { digit: '02', name: 'Szemét díjak' },
           { digit: '03', name: 'Takarítás' },
           { digit: '04', name: 'Kommunikációs költségek' },   
           { digit: '05', name: 'Könyvelési díj' },   
           { digit: '06', name: 'Közösképviselet díja' },
           { digit: '07', name: 'Jogi költségek' },        
           { digit: '08', name: 'Karbantartás' },  
           { digit: '09', name: 'Javítások' },  
           { digit: '10', name: 'Biztonsági költségek' },            
           { digit: '11', name: 'Tagdíjak' }, 
           { digit: '12', name: 'Kertészet' },         
           { digit: '13', name: 'Egyéb megbízási, vállalkozási díjak' },          
        ],              
        },
        { digit: '3', name: 'EGYÉB SZOLGÁLTATÁSOK KÖLTSÉGEI',
        children: [
           { digit: '1', name: 'Hatósági díjak' }, 
           { digit: '2', name: 'Pénzügyi  díjak' },
           { digit: '3', name: 'Biztosítási díjak' },   
        ],               
        }, 
        { digit: '4', name: 'BÉRKÖLTSÉG'},
        { digit: '5', name: 'SZEMÉLYI JELLEGŰ EGYÉB KÖLTSÉG' },     
        { digit: '6', name: 'BÉRJÁRULÉKOK' },   
        { digit: '7', name: 'ÉRTÉKCSÖKKENÉSI LEÍRÁS' },     
        { digit: '9', name: 'KÖLTSÉGNEMEK ÁTVEZETÉSE' },

    ],
  });
          // itt tartok
  Breakdowns.define({ communityId: null,
    digit: '8', name: 'Expenses', locked: true, sign: +1, //Ráfordítások
    children: [
      { digit: '1', name: 'Költségek',
        children: [
        { digit: '01', name: 'Víz' },
        { digit: '02', name: 'Csatorna' },
        { digit: '03', name: 'Áram' },
        { digit: '04', name: 'Szemét' },
        { digit: '05', name: 'Anyagok' },
        { digit: '06', name: 'Takarítás' },
        { digit: '07', name: 'Karbantartás' },
        { digit: '08', name: 'Üzemeltetés' },
        { digit: '09', name: 'Közösképviselet' },
        { digit: '10', name: 'Megbízási díjak' },
        { digit: '11', name: 'Bérek és közterhek' },
        { digit: '12', name: 'Jogi költségek' },
        { digit: '13', name: 'Hatósági díjak' },
        { digit: '14', name: 'Adók és bírságok' },
        { digit: '15', name: 'Kamat és bank költségek' },
        { digit: '16', name: 'Egyéb költségek' },
        ],
      },
      { digit: '2', name: 'Beruházások',
        children: [
        { digit: '1', name: 'Épület' },
        { digit: '2', name: 'Gép, berendezés' },
        ],
      },
      { digit: '3', name: 'Hitel törlesztés',
        children: [
        { digit: '1', name: 'Bank hitel törlesztés' },
        ],
      },
      { digit: '4', name: 'Egyéb kiadások',
        children: [
        { digit: '1', name: 'Egyéb kiadás' },
        ],
      },
    ],
  });

  Breakdowns.define({ communityId: null,
    digit: '9', name: 'Incomes', locked: true, sign: -1,   // 9-es számlaosztály kész
    children: [
     { digit: '1', name: 'ÉRTÉKESÍTÉS ÁRBEVÉTELE',
        children: [
        { digit: '1', name: 'Bérleti díj bevételek' }, 
        { digit: '5', name: 'Egyéb adóköteles bevételek' },
        ],
      }, 
      
      { digit: '5', name: 'TUAJDONOSI BEFIZETÉSEK',
        children: [
        { digit: '1', name: 'Közös költség' }, 
        { digit: '2', name: 'Fogyasztás előírás' },
        { digit: '3', name: 'Fejlesztési alap előírás' }, 
        { digit: '5', name: 'Egyéb előírás' },         
        { digit: '5', name: 'Rendkivüli befizetés előírás' },         
        ],
      },
      { digit: '6', name: 'EGYÉB BEVÉTELEK',
        children: [
        { digit: '6', name: 'Támogatások' },
        { digit: '7', name: 'Biztosítói kártérítés' },
        { digit: '8', name: 'Kártérítések' },
        { digit: '9', name: 'Különféle egyéb bevételek' },  
        ],
      },
     { digit: '7', name: 'PÉNZÜGYI MŰVELETEK BEVÉTELEI',
        children: [
        { digit: '3', name: 'Hitelintézettől kapott kamatok' }, 
        { digit: '4', name: 'Egyéb pénzügyi bevételek' },         
        ],
      },      
     { digit: '8', name: 'RENDKIVÜLI BEVÉTELEK',
      },       
      
      { digit: '5', name: 'Owner payins', locked: true, // a 'Tulajdonosi befizetések' ld fentebb
        include: 'Owner payin types',
      },
//      { name: 'Hitelfelvétel',
//        children: [
//          { name: 'Bank hitel' },
//        ],
//      },
    ],
  });
  Breakdowns.define({ communityId: null,
    name: 'Owner payin types', locked: true,
    children: [
    { digit: '1', name: 'Közös költség előírás' },
    { digit: '2', name: 'Fogyasztás előírás' },
    { digit: '3', name: 'Fejlesztési alap előírás' },
    { digit: '4', name: 'Egyéb előírás' },
    { digit: '5', name: 'Rendkivüli befizetés előírás' },
    ],
  });
  
  Breakdowns.define({ communityId: null,
    name: 'COA', label: 'Chart Of Accounts',
    children: [
      { digit: '0', name: 'Opening' },// Technikai számlák
      { digit: '1', include: 'Befektetett Eszközök' },
      { digit: '2', include: 'Készletek' },
      { digit: '3', include: 'Assets' }, // követelések
      { digit: '4', include: 'Liabilities' }, // Források
      { digit: '5', include: 'Költség nemek' },
      { digit: '8', include: 'Expenses' }, // Ráfordítások
      { digit: '9', include: 'Incomes' }, //Bevételek
    ],
  });

  Breakdowns.define({ communityId: null,
    digit: '@', name: 'Parcels', children: [
      { digit: 'A', name: 'Main building' },
    ],
  });

  Breakdowns.define({ communityId: null,
    digit: '#', name: 'Places', children: [
      { digit: '0', name: 'Central' },
      { digit: '1', name: 'Garden' },
      { digit: '2', name: 'Heating system' },
    ],
  });

  Breakdowns.define({ communityId: null,
    digit: '', name: 'Localizer', label: 'Localizers',
    children: [
      { digit: '@', name: 'Parcels', include: 'Parcels',
      },
      { digit: '#', name: 'Places', include: 'Places',
      },
    ],
  });
}

if (Meteor.isServer) {
  Meteor.startup(defineBreakdownTemplates);
}