/* ============================================
   FEYNEGOCE — SCRIPTS
   i18n + D3 World Map + UI interactions
   ============================================ */

/* ============================================================
   TRANSLATIONS
   ============================================================ */
const translations = {
  en: {
    'page.title':                   'Feynegoce — Africa & Europe Business Facilitation',
    'nav.about':                    'About',
    'nav.partners':                 'Partners',
    'nav.presence':                 'Presence',
    'nav.projects':                 'Projects',
    'nav.services':                 'Services',
    'nav.contact':                  'Contact',
    'services.label':               'What We Do',
    'services.h2':                  'How We Can Help',
    'services.sub':                 'Three core areas where Feynegoce creates value for European and African partners.',
    'service1.title':               'Trade Facilitation',
    'service1.desc':                'We connect European manufacturers and African buyers, building distribution networks, negotiating trade terms, and establishing long-term commercial partnerships across West and Central Africa.',
    'service2.title':               'Supply Chain & Logistics',
    'service2.desc':                'From sourcing to last-mile delivery, we coordinate procurement, freight, customs clearance and in-country logistics for industrial and consumer goods across Africa.',
    'service3.title':               'Market Entry Advisory',
    'service3.desc':                'We guide companies entering African markets through regulatory requirements, trade compliance, ECOWAS documentation, and in-country partner identification.',
    'services.cta':                 'Discuss Your Project',
    'hero.label':                   'Africa \u2014 Europe Business Facilitation',
    'hero.h1':                      'Bridging Markets.<br>Building Futures.',
    'hero.sub':                     'We connect African and European businesses, turning opportunity into partnership through strategic facilitation, trade advisory, and on-the-ground expertise.',
    'hero.cta1':                    'See Our Work',
    'hero.cta2':                    'Get in Touch',
    'about.label':                  'Who We Are',
    'about.h2':                     'A dedicated bridge between two continents',
    'about.p1':                     'Feynegoce specialises in cross-continental business development. We work with established European manufacturers and distributors seeking to enter or expand across African markets \u2014 and with African enterprises looking for quality European supply chains.',
    'about.p2':                     'Our team combines deep market knowledge, regulatory expertise, and a trusted network of partners across both continents.',
    'stat.experience':              'Years of experience',
    'stat.partnerships':            'Partnerships forged',
    'stat.countries':               'Countries active',
    'stat.volume':                  'Trade volume facilitated',
    'partners.label':               'Our Partners',
    'partners.h2':                  'Trusted by leading European companies',
    'partners.sub':                 'We work closely with renowned manufacturers to bring world-class products and solutions to African markets.',
    'veba.sector':                  'Textiles & Fabrics',
    'veba.desc':                    "One of Europe's foremost textile producers, Veba has supplied quality fabrics across global markets for decades. We facilitate distribution and trade relationships throughout West and Central Africa.",
    'tomket.sector':                'Automotive & Mining',
    'tomket.desc':                  'Tomket produces high-performance tyres for passenger vehicles, commercial trucks, and heavy-duty mining lorries. We manage distribution networks and supply chains delivering Tomket tyres directly to mining operations and logistics companies across Africa.',
    'getzner.sector':               'Premium Fabrics',
    'getzner.desc':                 "Getzner is renowned for its premium woven fabrics and fashion textiles. We connect Getzner's collection with retail and wholesale buyers across major African fashion and apparel hubs.",
    'presence.label':               'Our Presence',
    'presence.h2':                  'Active across 10 countries',
    'presence.sub':                 'From Central European manufacturers to West African markets \u2014 our operational footprint spans both continents. Hover over a country to explore.',
    'presence.europe':              'Europe',
    'presence.africa':              'Africa',
    'country.france':               'France',
    'country.czech':                'Czech Republic',
    'country.austria':              'Austria',
    'country.poland':               'Poland',
    'country.senegal':              'Senegal',
    'country.ivorycoast':           'Ivory Coast',
    'country.burkinafaso':          'Burkina Faso',
    'country.mali':                 'Mali',
    'country.togo':                 'Togo',
    'country.niger':                'Niger',
    'projects.label':               'Selected Projects',
    'projects.h2':                  'What we have delivered',
    'projects.sub':                 'A selection of engagements that illustrate the breadth and depth of our facilitation work.',
    'project1.tag':                 'Textiles',
    'project1.title':               'Veba Fabric Distribution \u2014 West Africa',
    'project1.desc':                'Established a multi-country distribution network for Veba across Senegal, Ivory Coast, and Ghana, onboarding six regional wholesale partners and achieving first-year sales targets within nine months.',
    'project2.tag':                 'Mining Supply',
    'project2.title':               'Tomket Tires \u2014 Mining Supply, East Africa',
    'project2.desc':                'Managed procurement and logistics of Tomket heavy-duty tyres for mining operations in Kenya and Tanzania. We coordinated direct supply to active extraction sites, equipping commercial lorries and heavy mining vehicles, ensuring consistent tyre availability and competitive pricing for mining companies across the region.',
    'project3.tag':                 'Premium Fabrics',
    'project3.title':               'Getzner Buyer Network \u2014 West Africa',
    'project3.desc':                "Identified and qualified premium retail buyers in Ivory Coast, Guinea, and Senegal for Getzner's fashion fabric lines, facilitating direct trading relationships and B2B showroom events across West Africa's key apparel hubs.",
    'project4.tag':                 'Advisory',
    'project4.title':               'Cross-Continental Trade Compliance Advisory',
    'project4.desc':                'Provided comprehensive import/export compliance consulting to a consortium of three European manufacturers entering the ECOWAS trade zone, covering tariff structures, documentation, and local compliance requirements.',
    'project.enquire':              'Enquire about this case \u2192',
    'contact.label':                'Contact',
    'contact.h2':                   "Let's start a conversation",
    'contact.p':                    'Whether you are a European company looking to enter African markets, or an African business seeking quality European supply, we would be glad to hear from you.',
    'contact.field.name':           'Full Name',
    'contact.field.company':        'Company',
    'contact.field.email':          'Email Address',
    'contact.field.subject':        'Area of Interest',
    'contact.field.message':        'Message',
    'contact.placeholder.name':     'Jean Dupont',
    'contact.placeholder.company':  'Your Company',
    'contact.placeholder.email':    'you@company.com',
    'contact.placeholder.message':  'Tell us about your project or enquiry\u2026',
    'contact.subject.default':      'Select a topic',
    'contact.subject.textiles':     'Textiles & Fabrics (Veba / Getzner)',
    'contact.subject.mining':       'Mining Tyre Supply (Tomket)',
    'contact.subject.entry':        'Market Entry Advisory',
    'contact.subject.distribution': 'Distribution & Logistics',
    'contact.subject.other':        'Other',
    'contact.submit':               'Send Message',
    'contact.note':                 'We typically respond within 2 business days.',
    'contact.success':              "Thank you \u2014 your message has been sent. We'll be in touch shortly.",
    'contact.error.name':           'Please enter your full name.',
    'contact.error.email':          'Please enter a valid email address.',
    'contact.error.message':        'Please write a short message.',
    'footer.tagline':               'Africa \u2014 Europe Business Facilitation',
    'footer.copy':                  '\u00a9 2026 Feynegoce. All rights reserved.',
  },

  fr: {
    'page.title':                   'Feynegoce \u2014 Facilitation commerciale Afrique & Europe',
    'nav.about':                    '\u00c0 propos',
    'nav.partners':                 'Partenaires',
    'nav.presence':                 'Pr\u00e9sence',
    'nav.projects':                 'Projets',
    'nav.services':                 'Services',
    'nav.contact':                  'Contact',
    'services.label':               'Ce que nous faisons',
    'services.h2':                  'Comment nous pouvons vous aider',
    'services.sub':                 'Trois domaines cl\u00e9s o\u00f9 Feynegoce cr\u00e9e de la valeur pour les partenaires europ\u00e9ens et africains.',
    'service1.title':               'Facilitation commerciale',
    'service1.desc':                'Nous mettons en relation les fabricants europ\u00e9ens et les acheteurs africains, en \u00e9tablissant des r\u00e9seaux de distribution, en n\u00e9gociant les conditions commerciales et en cr\u00e9ant des partenariats durables en Afrique de l\u2019Ouest et centrale.',
    'service2.title':               'Cha\u00eene d\u2019approvisionnement & Logistique',
    'service2.desc':                "De l\u2019approvisionnement \u00e0 la livraison finale, nous coordonnons les achats, le fret, le d\u00e9douanement et la logistique locale pour les biens industriels et de consommation \u00e0 travers l\u2019Afrique.",
    'service3.title':               'Conseil \u00e0 l\u2019entr\u00e9e sur le march\u00e9',
    'service3.desc':                'Nous accompagnons les entreprises entrant sur les march\u00e9s africains dans les exigences r\u00e9glementaires, la conformit\u00e9 commerciale, la documentation CEDEAO et l\u2019identification de partenaires locaux.',
    'services.cta':                 'Discutons de votre projet',
    'hero.label':                   'Facilitation commerciale Afrique \u2014 Europe',
    'hero.h1':                      'Des march\u00e9s reli\u00e9s.<br>Des avenirs b\u00e2tis.',
    'hero.sub':                     "Nous connectons les entreprises africaines et europ\u00e9ennes, transformant les opportunit\u00e9s en partenariats gr\u00e2ce \u00e0 une facilitation strat\u00e9gique, des conseils commerciaux et une expertise sur le terrain.",
    'hero.cta1':                    'Nos r\u00e9alisations',
    'hero.cta2':                    'Nous contacter',
    'about.label':                  'Qui sommes-nous',
    'about.h2':                     'Un pont d\u00e9di\u00e9 entre deux continents',
    'about.p1':                     "Feynegoce est sp\u00e9cialis\u00e9e dans le d\u00e9veloppement commercial intercontinental. Nous collaborons avec des fabricants et distributeurs europ\u00e9ens \u00e9tablis souhaitant p\u00e9n\u00e9trer ou se d\u00e9velopper sur les march\u00e9s africains \u2014 et avec des entreprises africaines \u00e0 la recherche de cha\u00eenes d'approvisionnement europ\u00e9ennes de qualit\u00e9.",
    'about.p2':                     'Notre \u00e9quipe combine une connaissance approfondie des march\u00e9s, une expertise r\u00e9glementaire et un r\u00e9seau de partenaires de confiance sur les deux continents.',
    'stat.experience':              "Ann\u00e9es d'exp\u00e9rience",
    'stat.partnerships':            'Partenariats conclus',
    'stat.countries':               'Pays actifs',
    'stat.volume':                  "\u00c9changes facilit\u00e9s",
    'partners.label':               'Nos partenaires',
    'partners.h2':                  'La confiance de grandes entreprises europ\u00e9ennes',
    'partners.sub':                 'Nous travaillons \u00e9troitement avec des fabricants renomm\u00e9s pour apporter des produits et solutions de classe mondiale aux march\u00e9s africains.',
    'veba.sector':                  'Textiles & Tissus',
    'veba.desc':                    "L'un des premiers producteurs textiles d'Europe, Veba fournit des tissus de qualit\u00e9 sur les march\u00e9s mondiaux depuis des d\u00e9cennies. Nous facilitons la distribution et les relations commerciales en Afrique de l'Ouest et centrale.",
    'tomket.sector':                'Automobile & Mines',
    'tomket.desc':                  "Tomket produit des pneus haute performance pour v\u00e9hicules de tourisme, camions commerciaux et engins miniers lourds. Nous g\u00e9rons les r\u00e9seaux de distribution et les cha\u00eenes d\u2019approvisionnement livrant les pneus Tomket directement aux op\u00e9rations mini\u00e8res et aux entreprises de logistique \u00e0 travers l\u2019Afrique.",
    'getzner.sector':               'Tissus Premium',
    'getzner.desc':                 "Getzner est r\u00e9put\u00e9 pour ses tissus tiss\u00e9s premium et ses textiles de mode. Nous mettons en relation la collection Getzner avec des acheteurs au d\u00e9tail et en gros dans les principaux p\u00f4les de la mode africaine.",
    'presence.label':               'Notre pr\u00e9sence',
    'presence.h2':                  'Actif dans 10 pays',
    'presence.sub':                 "Des fabricants d\u2019Europe centrale aux march\u00e9s d\u2019Afrique de l\u2019Ouest \u2014 notre empreinte op\u00e9rationnelle couvre les deux continents. Survolez un pays pour explorer.",
    'presence.europe':              'Europe',
    'presence.africa':              'Afrique',
    'country.france':               'France',
    'country.czech':                'R\u00e9publique tch\u00e8que',
    'country.austria':              'Autriche',
    'country.poland':               'Pologne',
    'country.senegal':              'S\u00e9n\u00e9gal',
    'country.ivorycoast':           "C\u00f4te d\u2019Ivoire",
    'country.burkinafaso':          'Burkina Faso',
    'country.mali':                 'Mali',
    'country.togo':                 'Togo',
    'country.niger':                'Niger',
    'projects.label':               'Projets s\u00e9lectionn\u00e9s',
    'projects.h2':                  'Ce que nous avons r\u00e9alis\u00e9',
    'projects.sub':                 "Une s\u00e9lection d'engagements illustrant l'\u00e9tendue et la profondeur de notre travail de facilitation.",
    'project1.tag':                 'Textiles',
    'project1.title':               'Distribution de tissus Veba \u2014 Afrique de l\u2019Ouest',
    'project1.desc':                "Mise en place d'un r\u00e9seau de distribution multi-pays pour Veba au S\u00e9n\u00e9gal, en C\u00f4te d'Ivoire et au Ghana, avec l'int\u00e9gration de six partenaires grossistes r\u00e9gionaux et l'atteinte des objectifs de ventes de premi\u00e8re ann\u00e9e en neuf mois.",
    'project2.tag':                 'Fourniture mini\u00e8re',
    'project2.title':               'Pneus Tomket \u2014 Fourniture mini\u00e8re, Afrique de l\u2019Est',
    'project2.desc':                "Gestion de l\u2019approvisionnement et de la logistique des pneus lourds Tomket pour les op\u00e9rations mini\u00e8res au Kenya et en Tanzanie. Fourniture directe sur les sites d'extraction actifs, \u00e9quipant camions commerciaux et engins miniers lourds, garantissant disponibilit\u00e9 constante et prix comp\u00e9titifs pour les soci\u00e9t\u00e9s mini\u00e8res.",
    'project3.tag':                 'Tissus Premium',
    'project3.title':               'R\u00e9seau Getzner \u2014 Afrique de l\u2019Ouest',
    'project3.desc':                "Identification et qualification d\u2019acheteurs premium en C\u00f4te d\u2019Ivoire, en Guin\u00e9e et au S\u00e9n\u00e9gal pour les lignes de tissus Getzner, facilitant des relations commerciales directes et des \u00e9v\u00e9nements showroom B2B dans les principaux p\u00f4les de la mode en Afrique de l\u2019Ouest.",
    'project4.tag':                 'Conseil',
    'project4.title':               'Conseil en conformit\u00e9 commerciale intercontinentale',
    'project4.desc':                "Conseil complet en conformit\u00e9 import/export pour un consortium de trois fabricants europ\u00e9ens entrant dans la zone commerciale CEDEAO, couvrant les structures tarifaires, la documentation et les exigences de conformit\u00e9 locales.",
    'project.enquire':              'En savoir plus \u2192',
    'contact.label':                'Contact',
    'contact.h2':                   'Commen\u00e7ons une conversation',
    'contact.p':                    "Que vous soyez une entreprise europ\u00e9enne souhaitant p\u00e9n\u00e9trer les march\u00e9s africains ou une entreprise africaine \u00e0 la recherche d'approvisionnements europ\u00e9ens de qualit\u00e9, nous serons ravis d'\u00e9changer avec vous.",
    'contact.field.name':           'Nom complet',
    'contact.field.company':        'Entreprise',
    'contact.field.email':          'Adresse e-mail',
    'contact.field.subject':        "Domaine d'int\u00e9r\u00eat",
    'contact.field.message':        'Message',
    'contact.placeholder.name':     'Jean Dupont',
    'contact.placeholder.company':  'Votre entreprise',
    'contact.placeholder.email':    'vous@entreprise.com',
    'contact.placeholder.message':  'Parlez-nous de votre projet ou demande\u2026',
    'contact.subject.default':      'S\u00e9lectionner un sujet',
    'contact.subject.textiles':     'Textiles & Tissus (Veba / Getzner)',
    'contact.subject.mining':       'Fourniture de pneus miniers (Tomket)',
    'contact.subject.entry':        "Conseil \u00e0 l'entr\u00e9e sur le march\u00e9",
    'contact.subject.distribution': 'Distribution & Logistique',
    'contact.subject.other':        'Autre',
    'contact.submit':               'Envoyer le message',
    'contact.note':                 'Nous r\u00e9pondons g\u00e9n\u00e9ralement sous 2 jours ouvrables.',
    'contact.success':              'Merci \u2014 votre message a \u00e9t\u00e9 envoy\u00e9. Nous vous contacterons sous peu.',
    'contact.error.name':           'Veuillez entrer votre nom complet.',
    'contact.error.email':          'Veuillez entrer une adresse e-mail valide.',
    'contact.error.message':        'Veuillez \u00e9crire un court message.',
    'footer.tagline':               'Facilitation commerciale Afrique \u2014 Europe',
    'footer.copy':                  '\u00a9 2026 Feynegoce. Tous droits r\u00e9serv\u00e9s.',
  },

  cs: {
    'page.title':                   'Feynegoce \u2014 Obchodn\u00ed facilitace Afrika & Evropa',
    'nav.about':                    'O n\u00e1s',
    'nav.partners':                 'Partner\u0159i',
    'nav.presence':                 'P\u0159\u00edtomnost',
    'nav.projects':                 'Projekty',
    'nav.services':                 'Slu\u017eby',
    'nav.contact':                  'Kontakt',
    'services.label':               'Co d\u011bl\u00e1me',
    'services.h2':                  'Jak v\u00e1m m\u016f\u017eeme pomoci',
    'services.sub':                 'T\u0159i kl\u00ed\u010dov\u00e9 oblasti, kde Feynegoce vytv\u00e1\u0159\u00ed hodnotu pro evropsk\u00e9 a africk\u00e9 partnery.',
    'service1.title':               'Obchodn\u00ed facilitace',
    'service1.desc':                'Propojujeme evropsk\u00e9 v\u00fdrobce s africk\u00fdmi kupci, budujeme distribu\u010dn\u00ed s\u00edt\u011b, vyvjednáváme obchodn\u00ed podm\u00ednky a nav\u00e1z\u00e1me dlouhodob\u00e1 komer\u010dn\u00ed partnerstv\u00ed v Z\u00e1padn\u00ed a St\u0159edn\u00ed Africe.',
    'service2.title':               'Dodavatelsk\u00fd \u0159et\u011bzec & Logistika',
    'service2.desc':                'Od n\u00e1kupu a\u017e po doru\u010den\u00ed koordinujeme z\u00e1sobov\u00e1n\u00ed, p\u0159epravu, celn\u00ed odbaaven\u00ed a m\u00edstn\u00ed logistiku pro pr\u016fmyslov\u00e9 a spot\u0159ebn\u00ed zbo\u017e\u00ed v cel\u00e9 Africe.',
    'service3.title':               'Poradenstv\u00ed p\u0159i vstupu na trh',
    'service3.desc':                'Prov\u00e1z\u00edme spole\u010dnosti vstupuj\u00edc\u00ed na africk\u00e9 trhy regulatorn\u00edmi po\u017eadavky, obchodn\u00edm souladem, dokumentac\u00ed ECOWAS a identifikac\u00ed m\u00edstn\u00edch partner\u016f.',
    'services.cta':                 'Prodiskutujte sv\u016fj projekt',
    'hero.label':                   'Obchodn\u00ed facilitace Afrika \u2014 Evropa',
    'hero.h1':                      'Propojujeme trhy.<br>Budujeme budoucnost.',
    'hero.sub':                     'Spojujeme africk\u00e9 a evropsk\u00e9 podniky, p\u0159em\u011b\u0148ujeme p\u0159\u00edle\u017eitosti v partnersk\u00e9 vztahy prost\u0159ednictv\u00edm strategick\u00e9 facilitace, obchodn\u00edho poradenstv\u00ed a odbornch znalost\u00ed p\u0159\u00edmo na m\u00edst\u011b.',
    'hero.cta1':                    'Na\u0161e projekty',
    'hero.cta2':                    'Kontaktujte n\u00e1s',
    'about.label':                  'Kdo jsme',
    'about.h2':                     'Spolehliv\u00fd most mezi dv\u011bma kontinenty',
    'about.p1':                     'Feynegoce se specializuje na mezikontinent\u00e1ln\u00ed rozvoj podnik\u00e1n\u00ed. Spolupracujeme se zavedenmi evropskmi v\u00fdrobci a distributory, kte\u0159\u00ed cht\u011bj\u00ed vstoupit na africk\u00e9 trhy nebo se na nich rozr\u016fstat \u2014 a s africkmi podniky hledaj\u00edc\u00edmi kvalitn\u00ed evropsk\u00e9 dodavatelsk\u00e9 \u0159et\u011bzce.',
    'about.p2':                     'N\u00e1\u0161 t\u00fdm kombinuje hlubokou znalost trh\u016f, regulatorn\u00ed odbornost a d\u016bv\u011bryhodnou s\u00ed\u0165 partner\u016f na ob\u011bch kontinentech.',
    'stat.experience':              'Let zku\u0161enost\u00ed',
    'stat.partnerships':            'Uzav\u0159en\u00fdch partnerstvch',
    'stat.countries':               'Aktivn\u00edch zem\u00ed',
    'stat.volume':                  'Objem obchodu',
    'partners.label':               'Na\u0161i partner\u0159i',
    'partners.h2':                  'D\u016fv\u011bra p\u0159edn\u00edch evropsk\u00fdch spole\u010dnost\u00ed',
    'partners.sub':                 '\u00dazce spolupracujeme s renomovan\u00fdmi v\u00fdrobci, abychom p\u0159inesli sv\u011btov\u00e9 produkty a \u0159e\u0161en\u00ed na africk\u00e9 trhy.',
    'veba.sector':                  'Textil & Tkaniny',
    'veba.desc':                    'Veba je jedn\u00edm z p\u0159edn\u00edch evropsk\u00fdch textil\u00ednch v\u00fdrobc\u016f a po desetilet\u00ed z\u00e1sobuje glob\u00e1ln\u00ed trhy kvalitn\u00edmi tkaninami. Usnad\u0148ujeme distribuci a obchodn\u00ed vztahy po cel\u00e9 Africe.',
    'tomket.sector':                'Automobilov\u00fd pr\u016fmysl & Doly',
    'tomket.desc':                  'Tomket vyb\u00e1b\u00ed vysoce\u00fdkonn\u00e9 pneumatiky pro osobn\u00ed vozy, n\u00e1kladn\u00ed automobily a t\u011b\u017ek\u00e9 d\u016fln\u00ed stroje. Spr\u00e1vujeme distribu\u010dn\u00ed s\u00edt\u011b a dodavatelsk\u00e9 \u0159et\u011bzce dod\u00e1vaj\u00edc\u00ed pneumatiky Tomket p\u0159\u00edmo do d\u016fln\u00edch provoz\u016f a logistick\u00fdch spole\u010dnost\u00ed po cel\u00e9 Africe.',
    'getzner.sector':               'Pr\u00e9mium Tkaniny',
    'getzner.desc':                 'Getzner je proslul\u00fd sv\u00fdmi pr\u00e9miumov\u00fdmi tkan\u00fdmi tkaninami a modn\u00edm textilem. Spojujeme kolekci Getzner s maloobchodn\u00edmi a velkoobchodn\u00edmi kupci v hlavn\u00edch africk\u00fdch modn\u00edch centrech.',
    'presence.label':               'Na\u0161e p\u0159\u00edtomnost',
    'presence.h2':                  'Aktivn\u00ed v 10 zem\u00edch',
    'presence.sub':                 'Od st\u0159edoevropsk\u00fdch v\u00fdrobc\u016f po z\u00e1padoafrick\u00e9 trhy \u2014 na\u0161e opera\u010dn\u00ed p\u0159\u00edtomnost pokr\u00fdv\u00e1 oba kontinenty. Naje\u010fdte na zemi pro zobrazen\u00ed.',
    'presence.europe':              'Evropa',
    'presence.africa':              'Afrika',
    'country.france':               'Francie',
    'country.czech':                '\u010cesk\u00e1 republika',
    'country.austria':              'Rakousko',
    'country.poland':               'Polsko',
    'country.senegal':              'Senegal',
    'country.ivorycoast':           'Pob\u0159e\u017e\u00ed slonoviny',
    'country.burkinafaso':          'Burkina Faso',
    'country.mali':                 'Mali',
    'country.togo':                 'Togo',
    'country.niger':                'Niger',
    'projects.label':               'Vybran\u00e9 projekty',
    'projects.h2':                  '\u010ceho jsme dos\u00e1hli',
    'projects.sub':                 'V\u00fdběr zak\u00e1zek ilustruj\u00edc\u00ed \u0161\u00ed\u0159i a hloubku na\u0161\u00ed facilitačn\u00ed pr\u00e1ce.',
    'project1.tag':                 'Textil',
    'project1.title':               'Distribuce tkanin Veba \u2014 Z\u00e1padn\u00ed Afrika',
    'project1.desc':                'Vybudov\u00e1n\u00ed distribu\u010dn\u00ed s\u00edt\u011b pro Veba v Senegalu, Pob\u0159e\u017e\u00ed slonoviny a Ghan\u011b, zapojen\u00ed \u0161esti region\u00e1ln\u00edch velkoobchodn\u00edch partner\u016f a dosa\u017een\u00ed prodejn\u00edch c\u00edl\u016f prvn\u00edho roku za dev\u011bt m\u011bs\u00edc\u016f.',
    'project2.tag':                 'Z\u00e1sobov\u00e1n\u00ed dol\u016f',
    'project2.title':               'Pneumatiky Tomket \u2014 Z\u00e1sobov\u00e1n\u00ed dol\u016f, V\u00fdchodn\u00ed Afrika',
    'project2.desc':                'Řizen\u00ed n\u00e1kupu a logistiky t\u011b\u017ek\u00fdch pneumatik Tomket pro t\u011b\u017eebn\u00ed provoz v Keni a Tanzanii. Koordinace p\u0159\u00edm\u00e9ho z\u00e1sobov\u00e1n\u00ed na aktivn\u00edch t\u011b\u017eebn\u00edch lokalit\u00e1ch, vybaven\u00ed n\u00e1kladn\u00edch vozidel a t\u011b\u017ek\u00e9 t\u011b\u017eebn\u00ed techniky se zaji\u0161t\u011bn\u00edm st\u00e1l\u00e9 dostupnosti pro d\u016fln\u00ed spole\u010dnosti.',
    'project3.tag':                 'Pr\u00e9mium Tkaniny',
    'project3.title':               'S\u00ed\u0165 kupc\u016f Getzner \u2014 Z\u00e1padn\u00ed Afrika',
    'project3.desc':                'Identifikace a kvalifikace pr\u00e9miumov\u00fdch kupc\u016f v Pob\u0159e\u017e\u00ed slonoviny, Guinei a Senegalu pro modn\u00ed kolekce l\u00e1tek Getzner, usnadn\u011bn\u00ed p\u0159\u00edm\u00fdch obchodn\u00edch vztah\u016f a B2B v\u00fdstavn\u00edch akc\u00ed v kl\u00ed\u010dov\u00fdch modn\u00edch centrech Z\u00e1padn\u00ed Afriky.',
    'project4.tag':                 'Poradenstv\u00ed',
    'project4.title':               'Poradenstv\u00ed v oblasti obchodn\u00ed compliance',
    'project4.desc':                'Komplexn\u00ed poradenstv\u00ed v oblasti dovozu/v\u00fdvozu pro konsorcium t\u0159\u00ed evropsk\u00fdch v\u00fdrobc\u016f vstupuj\u00edc\u00edch do obchodn\u00ed z\u00f3ny ECOWAS, pokr\u00fdvaj\u00edc\u00ed celn\u00ed struktury, dokumentaci a m\u00edstn\u00ed po\u017eadavky na compliance.',
    'project.enquire':              'Zjistit v\u00edce \u2192',
    'contact.label':                'Kontakt',
    'contact.h2':                   'Za\u010dn\u011bme konverzaci',
    'contact.p':                    'A\u0165 jste evropsk\u00e1 spole\u010dnost hledaj\u00edc\u00ed vstup na africk\u00e9 trhy nebo africky podnik hledaj\u00edc\u00ed kvalitn\u00ed evropsk\u00e9 z\u00e1soby, r\u00e1di v\u00e1s usl\u00fd\u0161\u00edme.',
    'contact.field.name':           'Cel\u00e9 jm\u00e9no',
    'contact.field.company':        'Spole\u010dnost',
    'contact.field.email':          'E-mailov\u00e1 adresa',
    'contact.field.subject':        'Oblast z\u00e1jmu',
    'contact.field.message':        'Zpr\u00e1va',
    'contact.placeholder.name':     'Jan Novak',
    'contact.placeholder.company':  'Va\u0161e spole\u010dnost',
    'contact.placeholder.email':    'vy@spolecnost.cz',
    'contact.placeholder.message':  'Popidte n\u00e1m v\u00e1\u0161 projekt nebo dotaz\u2026',
    'contact.subject.default':      'Vyberte t\u00e9ma',
    'contact.subject.textiles':     'Textil & Tkaniny (Veba / Getzner)',
    'contact.subject.mining':       'Z\u00e1sobov\u00e1n\u00ed dol\u016f pneumatikami (Tomket)',
    'contact.subject.entry':        'Poradenstv\u00ed p\u0159i vstupu na trh',
    'contact.subject.distribution': 'Distribuce & Logistika',
    'contact.subject.other':        'Jin\u00e9',
    'contact.submit':               'Odeslat zpr\u00e1vu',
    'contact.note':                 'Obvykle odpov\u00edd\u00e1me do 2 pracovn\u00edch dn\u016f.',
    'contact.success':              'D\u011bkujeme \u2014 va\u0161e zpr\u00e1va byla odesl\u00e1na. Brzy se v\u00e1m ozv\u011bme.',
    'contact.error.name':           'Pros\u00edm zadejte sv\u00e9 cel\u00e9 jm\u00e9no.',
    'contact.error.email':          'Pros\u00edm zadejte platnou e-mailovou adresu.',
    'contact.error.message':        'Pros\u00edm napi\u0161te kr\u00e1tkou zpr\u00e1vu.',
    'footer.tagline':               'Obchodn\u00ed facilitace Afrika \u2014 Evropa',
    'footer.copy':                  '\u00a9 2026 Feynegoce. V\u0161echna pr\u00e1va vyhrazena.',
  },
};

/* Map country ISO numeric → translated names */
const countryIsoNames = {
  250: { en: 'France',         fr: 'France',                    cs: 'Francie' },
  203: { en: 'Czech Republic', fr: 'R\u00e9publique tch\u00e8que', cs: '\u010cesk\u00e1 republika' },
  40:  { en: 'Austria',        fr: 'Autriche',                  cs: 'Rakousko' },
  616: { en: 'Poland',         fr: 'Pologne',                   cs: 'Polsko' },
  686: { en: 'Senegal',        fr: 'S\u00e9n\u00e9gal',         cs: 'Senegal' },
  384: { en: 'Ivory Coast',    fr: "C\u00f4te d\u2019Ivoire",   cs: 'Pob\u0159e\u017e\u00ed slonoviny' },
  854: { en: 'Burkina Faso',   fr: 'Burkina Faso',              cs: 'Burkina Faso' },
  466: { en: 'Mali',           fr: 'Mali',                      cs: 'Mali' },
  768: { en: 'Togo',           fr: 'Togo',                      cs: 'Togo' },
  562: { en: 'Niger',          fr: 'Niger',                     cs: 'Niger' },
};

/* ============================================================
   LANGUAGE STATE & APPLICATION
   ============================================================ */
let currentLang = localStorage.getItem('feynegoce_lang') || 'en';

function t(key) {
  return (translations[currentLang] && translations[currentLang][key]) ||
         (translations.en[key]) || key;
}

function getCountryName(isoId) {
  const names = countryIsoNames[isoId];
  if (!names) return '';
  return names[currentLang] || names.en;
}

function applyTranslations() {
  /* textContent */
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (val) el.textContent = val;
  });
  /* innerHTML (for <br> etc.) */
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    const val = t(key);
    if (val) el.innerHTML = val;
  });
  /* placeholder */
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const val = t(key);
    if (val) el.placeholder = val;
  });
  /* page title */
  document.title = t('page.title');
  /* html lang attribute */
  document.documentElement.lang = currentLang;
}

function setLang(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem('feynegoce_lang', lang);
  applyTranslations();
  /* update active button */
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

/* Init language */
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => setLang(btn.dataset.lang));
});
applyTranslations();
/* Reflect saved lang in buttons */
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.classList.toggle('active', btn.dataset.lang === currentLang);
});


/* ============================================================
   NAV TOGGLE (mobile)
   ============================================================ */
const navToggle = document.querySelector('.nav-toggle');
const navLinks  = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});


/* ============================================================
   ACTIVE NAV LINK ON SCROLL
   ============================================================ */
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY + 100;
  sections.forEach(section => {
    const id   = section.getAttribute('id');
    const link = document.querySelector(`.nav-links a[href="#${id}"]`);
    if (!link) return;
    const top    = section.offsetTop;
    const height = section.offsetHeight;
    link.style.color = (scrollY >= top && scrollY < top + height)
      ? 'rgba(255,255,255,1)' : '';
  });
}, { passive: true });


/* ============================================================
   SCROLL FADE-IN
   ============================================================ */
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll(
  '.partner-card, .project-item, .stat, .about-text, .contact-info, .contact-form'
).forEach(el => {
  el.classList.add('fade-in');
  fadeObserver.observe(el);
});


/* ============================================================
   D3 WORLD MAP
   ============================================================ */
let mapRendered = false;

async function renderMap() {
  if (mapRendered) return;
  mapRendered = true;

  const mapWrap = document.querySelector('.map-wrap');
  if (!mapWrap || typeof d3 === 'undefined' || typeof topojson === 'undefined') return;

  try {
    const world = await d3.json(
      'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
    );

    const width  = mapWrap.clientWidth || 1140;
    const height = Math.round(width * 0.48);
    const svg    = d3.select('#world-map')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('width', '100%')
      .attr('height', height);

    /* Country metadata */
    const highlighted = {
      250: 'europe',   /* France          */
      203: 'europe',   /* Czech Republic  */
      40:  'europe',   /* Austria         */
      616: 'europe',   /* Poland          */
      686: 'africa',   /* Senegal         */
      384: 'africa',   /* Ivory Coast     */
      854: 'africa',   /* Burkina Faso    */
      466: 'africa',   /* Mali            */
      768: 'africa',   /* Togo            */
      562: 'africa',   /* Niger           */
    };

    const COLOR_EU      = '#c8963e';
    const COLOR_AF      = '#e8b05a';
    const COLOR_HOVER   = '#f5c842';
    const COLOR_LAND    = '#1e1e1e';
    const COLOR_BORDER  = '#0d0d0d';

    /* Projection — NaturalEarth, slight westward rotation to centre
       the Atlantic / show Europe & Africa clearly */
    const projection = d3.geoNaturalEarth1()
      .scale(width / 6.3)
      .rotate([-10, 0])
      .translate([width / 2, height / 2 + height * 0.04]);

    const path = d3.geoPath().projection(projection);

    /* Background radial gradient */
    const defs   = svg.append('defs');
    const bgGrad = defs.append('radialGradient')
      .attr('id', 'map-bg').attr('cx', '50%').attr('cy', '50%').attr('r', '60%');
    bgGrad.append('stop').attr('offset', '0%').attr('stop-color', '#181818');
    bgGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0d0d0d');

    /* Glow filter for highlighted countries */
    const glow = defs.append('filter').attr('id', 'glow');
    glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = glow.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    svg.append('rect').attr('width', width).attr('height', height)
       .attr('fill', 'url(#map-bg)');

    /* Graticule */
    svg.append('path')
      .datum(d3.geoGraticule()())
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255,255,255,0.03)')
      .attr('stroke-width', 0.4);

    /* Countries */
    const countries = topojson.feature(world, world.objects.countries);
    const tooltip   = document.getElementById('map-tooltip');

    const countryPaths = svg.selectAll('.country')
      .data(countries.features)
      .join('path')
      .attr('class', 'country')
      .attr('d', path)
      .attr('fill', d => {
        const type = highlighted[+d.id];
        if (type === 'europe') return COLOR_EU;
        if (type === 'africa') return COLOR_AF;
        return COLOR_LAND;
      })
      .attr('stroke', COLOR_BORDER)
      .attr('stroke-width', d => highlighted[+d.id] ? 0.6 : 0.35)
      .style('filter', d => highlighted[+d.id] ? 'url(#glow)' : 'none')
      .style('cursor', d => highlighted[+d.id] ? 'pointer' : 'default')
      .on('mouseenter', function (event, d) {
        const type = highlighted[+d.id];
        if (!type) return;
        d3.select(this).attr('fill', COLOR_HOVER);
        tooltip.textContent = getCountryName(+d.id);
        tooltip.classList.add('visible');
      })
      .on('mousemove', function (event) {
        tooltip.style.left = (event.clientX + 14) + 'px';
        tooltip.style.top  = (event.clientY - 38) + 'px';
      })
      .on('mouseleave', function (event, d) {
        const type = highlighted[+d.id];
        if (!type) return;
        d3.select(this).attr('fill', type === 'europe' ? COLOR_EU : COLOR_AF);
        tooltip.classList.remove('visible');
      });

    /* Country borders mesh */
    svg.append('path')
      .datum(topojson.mesh(world, world.objects.countries, (a, b) => a !== b))
      .attr('d', path).attr('fill', 'none')
      .attr('stroke', COLOR_BORDER).attr('stroke-width', 0.25);

    /* ---- Connection arcs ---- */
    const centroids = {
      250: [2.35,  46.23],    /* France           */
      203: [15.47, 49.82],    /* Czech Republic   */
      40:  [14.55, 47.52],    /* Austria          */
      616: [19.15, 51.91],    /* Poland           */
      686: [-14.45, 14.50],   /* Senegal          */
      384: [-5.55,  7.54],    /* Ivory Coast      */
      854: [-1.56, 12.36],    /* Burkina Faso     */
      466: [-1.98, 17.57],    /* Mali             */
      768: [ 0.82,  8.62],    /* Togo             */
      562: [ 8.08, 17.61],    /* Niger            */
    };

    /* France → all African; Czech → Senegal, Ivory Coast, Burkina;
       Austria → Ivory Coast, Mali; Poland → Niger, Togo */
    const connections = [
      [250, 686], [250, 384], [250, 854], [250, 466], [250, 768], [250, 562],
      [203, 686], [203, 384], [203, 854],
      [40,  384], [40,  466],
      [616, 562], [616, 768],
    ];

    const arcGroup = svg.append('g').attr('class', 'arcs');

    connections.forEach(([from, to], i) => {
      const feature = {
        type: 'LineString',
        coordinates: [centroids[from], centroids[to]],
      };
      const arcPath = arcGroup.append('path')
        .datum(feature)
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(200,150,62,.16)')
        .attr('stroke-width', 0.9);

      const len = arcPath.node().getTotalLength();
      arcPath
        .attr('stroke-dasharray', `${len} ${len}`)
        .attr('stroke-dashoffset', len)
        .transition()
        .delay(400 + i * 120)
        .duration(1100)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0);
    });

    /* ---- Pulse dots on each active country ---- */
    Object.entries(centroids).forEach(([id, coords], i) => {
      const [cx, cy] = projection(coords) || [];
      if (cx == null || cy == null || isNaN(cx) || isNaN(cy)) return;

      const isEu = [250, 203, 40, 616].includes(+id);
      const col  = isEu ? COLOR_EU : COLOR_AF;

      /* Pulse ring */
      const ring = svg.append('circle')
        .attr('cx', cx).attr('cy', cy)
        .attr('r', 4).attr('fill', 'none')
        .attr('stroke', col).attr('stroke-width', 1).attr('opacity', 0);

      (function pulse() {
        ring.attr('r', 4).attr('opacity', 0.9)
          .transition().duration(1600)
          .attr('r', 16).attr('opacity', 0)
          .on('end', pulse);
      })();
      /* slight random offset so rings don't all fire together */
      setTimeout(() => {}, i * 180);

      /* Centre dot */
      svg.append('circle')
        .attr('cx', cx).attr('cy', cy)
        .attr('r', 4)
        .attr('fill', col)
        .attr('stroke', COLOR_BORDER)
        .attr('stroke-width', 1.2);
    });

  } catch (err) {
    console.warn('Map render error:', err);
    const wrap = document.querySelector('.map-wrap');
    if (wrap) wrap.style.display = 'none';
  }
}

/* Lazy-render map when Presence section enters viewport */
const presenceSection = document.getElementById('presence');
if (presenceSection) {
  const mapTrigger = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      mapTrigger.disconnect();
      renderMap();
    }
  }, { threshold: 0.05 });
  mapTrigger.observe(presenceSection);
}


/* ============================================================
   CONTACT FORM
   ============================================================ */
const form         = document.getElementById('contactForm');
const nameInput    = document.getElementById('name');
const emailInput   = document.getElementById('email');
const messageInput = document.getElementById('message');
const nameError    = document.getElementById('nameError');
const emailError   = document.getElementById('emailError');
const messageError = document.getElementById('messageError');
const formSuccess  = document.getElementById('formSuccess');

function showError(field, errEl, msgKey) {
  field.style.borderColor = '#c0392b';
  errEl.textContent = t(msgKey);
  errEl.classList.add('visible');
}

function clearError(field, errEl) {
  field.style.borderColor = '';
  errEl.textContent = '';
  errEl.classList.remove('visible');
}

const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

nameInput.addEventListener('input',    () => { if (nameInput.value.trim())        clearError(nameInput,    nameError); });
emailInput.addEventListener('input',   () => { if (isEmail(emailInput.value))     clearError(emailInput,   emailError); });
messageInput.addEventListener('input', () => { if (messageInput.value.trim())     clearError(messageInput, messageError); });

form.addEventListener('submit', async e => {
  e.preventDefault();
  let valid = true;

  if (!nameInput.value.trim())      { showError(nameInput,    nameError,    'contact.error.name');    valid = false; }
  else                              { clearError(nameInput,   nameError); }

  if (!isEmail(emailInput.value))   { showError(emailInput,   emailError,   'contact.error.email');   valid = false; }
  else                              { clearError(emailInput,  emailError); }

  if (!messageInput.value.trim())   { showError(messageInput, messageError, 'contact.error.message'); valid = false; }
  else                              { clearError(messageInput, messageError); }

  if (!valid) return;

  const btn = form.querySelector('button[type="submit"]');
  btn.textContent   = '\u2026';
  btn.disabled      = true;
  btn.style.opacity = '.6';

  try {
    const res  = await fetch('/api/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:    nameInput.value.trim(),
        company: document.getElementById('company').value.trim(),
        email:   emailInput.value.trim(),
        subject: document.getElementById('subject').value,
        message: messageInput.value.trim(),
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Server error');

    form.reset();
    formSuccess.classList.add('visible');
    setTimeout(() => formSuccess.classList.remove('visible'), 6000);

  } catch (err) {
    console.error('[Contact]', err);
    const errEl = document.createElement('p');
    errEl.className = 'form-server-error';
    errEl.textContent = err.message || 'Something went wrong \u2014 please try again.';
    form.appendChild(errEl);
    setTimeout(() => errEl.remove(), 5000);

  } finally {
    btn.textContent   = t('contact.submit');
    btn.disabled      = false;
    btn.style.opacity = '';
  }
});
