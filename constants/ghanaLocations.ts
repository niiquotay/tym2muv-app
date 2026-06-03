
export interface LocationStructure {
  region: string;
  cities: {
    name: string;
    towns: string[];
  }[];
}

export const GHANA_LOCATIONS: LocationStructure[] = [
  {
    region: "Greater Accra",
    cities: [
      {
        name: "Accra Metropolitan",
        towns: [
          "Abelemkpe", "Abossey Okai", "Accra Central", "Adabraka", "Airport City", "Airport Residential Area", 
          "Alajo", "Asylum Down", "Avenor", "Burma Camp", "Cantonments", "Circle", "Chorkor", 
          "Christian Village", "Dansoman", "Darkuman", "Dzorwulu", "East Legon", "East Legon Hills", 
          "Gbawe", "Haatso", "James Town", "Kaneshie", "Kokomlemle", "Korle Bu", "Korle Gonno", 
          "Kotobabi", "Kwashieman", "Labadi", "Labone", "Lapaz", "Lartebiokorshie", "Legon", 
          "Madina", "Makola", "Mamobi", "Mamprobi", "Mataheko", "McCarthy Hill", "New Achimota", 
          "Nima", "North Industrial Area", "North Kaneshie", "North Ridge", "Odorkor", "Osu", 
          "Oyarifa", "Pantang", "Roman Ridge", "Santa Maria", "South La", "South Odorkor", 
          "Spintex", "Tesano", "Teshie", "Teshie Nungua", "Tudu", "University of Ghana", 
          "West Legon", "West Ridge", "Westhills"
        ]
      },
      {
        name: "Tema Metropolitan",
        towns: [
          "Community 1", "Community 2", "Community 3", "Community 4", "Community 5", 
          "Community 6", "Community 7", "Community 8", "Community 9", "Community 10", 
          "Community 11", "Community 12", "Community 18", "Community 20", "Community 22", 
          "Community 25", "Ashaiman", "Adjei Kojo", "Afienya", "Dawhenya", "Kakasunanka", 
          "Kpone", "Lashibi", "Manet", "Michel Camp", "Prampram", "Sakumono", "Tema Heavy Industrial Area"
        ]
      },
      {
        name: "Ga Districts",
        towns: [
          "Abokobi", "Achimota", "Adenta", "Amasaman", "Ayigbe Town", "Bortianor", "Dome", 
          "Dome Pillar 2", "Kwabenya", "Mallam", "Mile 7", "Ofankor", "Pokuase", "Red Top", 
          "Sowutuom", "Taifa", "Tantra Hill", "Weija"
        ]
      },
      {
        name: "Dangme Districts",
        towns: ["Ada Foah", "Big Ada", "Dodowa", "Kasseh", "Ningoprampram", "Old Ningo", "Sege", "Tsopoli"]
      }
    ]
  },
  {
    region: "Ashanti",
    cities: [
      {
        name: "Kumasi Metropolitan",
        towns: [
          "Abrepo", "Adum", "Ahodwo", "Airport Roundabout", "Amakom", "Aputuogya", "Asafo", 
          "Ash-Town", "Asokore Mampong", "Asokwa", "Ayeduase", "Bantama", "Bohyen", "Bomso", 
          "Breman", "Buokrom", "Chirapatre", "Dakodwom", "Danyame", "Dichemso", "Emina", 
          "Fankyenebra", "Kaase", "Kejetia", "Kentinkrono", "KNUST Campus", "Krofrom", "Kumasi Central", 
          "Kwadaso", "Manhyia", "New Amakom", "Nhyiaeso", "North Patasi", "Oforikrom", "Old Tafo", 
          "Pankrono", "Patasi", "Santasi", "Sofoline", "South Suntreso", "Suame", "Tanoso", "Tech Junction"
        ]
      },
      {
        name: "Obuasi",
        towns: ["Brahabebome", "Gausu", "Obuasi Central", "Tutuka", "Wawase"]
      },
      {
        name: "Other Towns",
        towns: [
          "Agogo", "Agona", "Akumadan", "Asante Mampong", "Bekwai", "Effiduase", "Ejisu", 
          "Ejura", "Juaben", "Konongo", "Kuntenase", "Mampongteng", "Mankranso", "New Edubiase", 
          "Nkawie", "Offinso", "Tepa"
        ]
      }
    ]
  },
  {
    region: "Western",
    cities: [
      {
        name: "Sekondi-Takoradi",
        towns: [
          "Adiembra", "Airport Ridge", "Anaji", "Beach Road", "Effiakuma", "Essikado", 
          "Fijai", "Ketan", "Kojokrom", "Kwankyeabo", "Kwesimintsim", "Market Circle", 
          "New Takoradi", "Sekondi", "Takoradi Central", "Tanokrom", "Windy Ridge"
        ]
      },
      {
        name: "Tarkwa",
        towns: ["Aboso", "Bogoso", "Prestea", "Tarkwa Central", "University of Mines Area"]
      },
      {
        name: "Coastal & Inland",
        towns: ["Agona Nkwanta", "Axim", "Dixcove", "Elubo", "Half Assini", "Mpohor", "Nsein", "Shama"]
      }
    ]
  },
  {
    region: "Central",
    cities: [
      {
        name: "Cape Coast",
        towns: ["Abura", "Adisadel", "Bakaano", "Cape Coast Castle Area", "Kakumdo", "Ola", "Pedu", "UCC Campus"]
      },
      {
        name: "Kasoa (Awutu Senya East)",
        towns: ["Amanfrom", "Big Man Town", "Buduburam", "CP", "Kasoa Central", "Millennium City", "Nyanyano", "Opeikuma"]
      },
      {
        name: "Other Towns",
        towns: [
          "Agona Swedru", "Apam", "Assin Fosu", "Breman Asikuma", "Dunkwa-on-Offin", 
          "Elmina", "Komenda", "Mankessim", "Moree", "Saltpond", "Twifo Praso", "Winneba"
        ]
      }
    ]
  },
  {
    region: "Eastern",
    cities: [
      {
        name: "Koforidua",
        towns: ["Adweso", "Asokore", "Effiduase", "Galloway", "Koforidua Central", "Old Estate", "Polytechnic Area", "Srodae"]
      },
      {
        name: "Akuapem Area",
        towns: ["Aburi", "Akropong", "Adukrom", "Larteh", "Mampong-Akuapem"]
      },
      {
        name: "Kwahu Area",
        towns: ["Mpraeso", "Nkawkaw", "Abetifi", "Pepease"]
      },
      {
        name: "Other Towns",
        towns: [
          "Abetifi", "Akim Oda", "Akim Swedru", "Akosombo", "Asamankese", "Begoro", "Donkorkrom", 
          "Kade", "Kibi", "New Abirem", "Nsawam", "Odumase Krobo", "Somanya", "Suhum", "Suhum"
        ]
      }
    ]
  },
  {
    region: "Volta",
    cities: [
      {
        name: "Ho",
        towns: ["Ahoe", "Bankoe", "Dome", "Heve", "Ho Central", "Sokode"]
      },
      {
        name: "Other Towns",
        towns: [
          "Adidome", "Aflao", "Agbozume", "Akatsi", "Anloga", "Dzodze", "Hohoe", 
          "Juapong", "Keta", "Kpando", "Peki", "Sogakope", "Tsito"
        ]
      }
    ]
  },
  {
    region: "Northern",
    cities: [
      {
        name: "Tamale",
        towns: ["Aboabo", "Airport Area", "Bamvim", "Bulpeila", "Education Ridge", "Gurugu", "Industrial Area", "Kalpohin", "Lamashegu", "Nyohini", "Sakasaka", "Tamale Central", "Vitting"]
      },
      {
        name: "Other Towns",
        towns: ["Bimbilla", "Karaga", "Kpandai", "Saboba", "Savelugu", "Tatale", "Tolon", "Yendi", "Zabzugu"]
      }
    ]
  },
  {
    region: "Western North",
    cities: [
      {
        name: "Sefwi Wiawso",
        towns: ["Dwinase", "Sefwi Wiawso Central"]
      },
      {
        name: "Other Towns",
        towns: ["Bibiani", "Awaso", "Enchi", "Juaboso", "Sefwi Bekwai"]
      }
    ]
  },
  {
    region: "Bono",
    cities: [
      {
        name: "Sunyani",
        towns: ["Abesim", "Airport Residential", "Berlin Top", "Fiapre", "Kotokrom", "New Dormaa", "Penkwase", "Sunyani Central"]
      },
      {
        name: "Other Towns",
        towns: ["Berekum", "Dormaa Ahenkro", "Drobo", "Nsoatre", "Sampa", "Wenchi"]
      }
    ]
  },
  {
    region: "Bono East",
    cities: [
      {
        name: "Techiman",
        towns: ["Kenten", "Techiman Central", "Tuobodom"]
      },
      {
        name: "Other Towns",
        towns: ["Atebubu", "Kintampo", "Nkoranza", "Prang", "Yeji"]
      }
    ]
  },
  {
    region: "Ahafo",
    cities: [
      {
        name: "Goaso",
        towns: ["Goaso Central"]
      },
      {
        name: "Other Towns",
        towns: ["Bechem", "Duayaw Nkwanta", "Hwidiem", "Kenyasi", "Kukuom", "Mim"]
      }
    ]
  },
  {
    region: "Oti",
    cities: [
      {
        name: "Dambai",
        towns: ["Dambai Central"]
      },
      {
        name: "Other Towns",
        towns: ["Jasikan", "Kadjebi", "Kete Krachi", "Nkwanta", "Worawora"]
      }
    ]
  },
  {
    region: "Upper East",
    cities: [
      {
        name: "Bolgatanga",
        towns: ["Atulbabisi", "Bolga Central", "Estates", "Soe", "Zaare"]
      },
      {
        name: "Other Towns",
        towns: ["Bawku", "Navrongo", "Paga", "Sandema", "Tongo", "Zebilla"]
      }
    ]
  },
  {
    region: "Upper West",
    cities: [
      {
        name: "Wa",
        towns: ["Dobile", "Kambali", "Kpaguri", "Wa Central"]
      },
      {
        name: "Other Towns",
        towns: ["Jirapa", "Lambussie", "Lawra", "Nandom", "Tumu", "Wechiau"]
      }
    ]
  },
  {
    region: "Savannah",
    cities: [
      {
        name: "Damongo",
        towns: ["Damongo Central"]
      },
      {
        name: "Other Towns",
        towns: ["Bole", "Buipe", "Salaga", "Sawla"]
      }
    ]
  },
  {
    region: "North East",
    cities: [
      {
        name: "Nalerigu",
        towns: ["Nalerigu Central", "Gambaga"]
      },
      {
        name: "Other Towns",
        towns: ["Bunkpurugu", "Chereponi", "Walewale"]
      }
    ]
  }
];

// Helper to get formatted search strings if needed elsewhere
export const getFlattenedLocations = (): string[] => {
  const flattened: string[] = [];
  GHANA_LOCATIONS.forEach(reg => {
    flattened.push(`${reg.region} Region`);
    reg.cities.forEach(city => {
      if (city.name !== "Other Towns") {
        flattened.push(`${city.name}, ${reg.region}`);
      }
      city.towns.forEach(town => {
        if (city.name === "Other Towns") {
           flattened.push(`${town}, ${reg.region}`);
        } else {
           flattened.push(`${town}, ${city.name} - ${reg.region}`);
        }
      });
    });
  });
  return flattened.sort();
};
