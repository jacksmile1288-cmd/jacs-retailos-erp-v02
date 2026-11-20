import { Product } from '../types';

// 1. Utilitas Standardisasi Penulisan (Title Case)
export const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      if (!word) return '';
      if (/^(gr|kg|ml|lt|pcs|box|pack|scm|csd|rtd|msg|mt|gt)$/i.test(word)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .trim();
};

// 2. Kamus Kategori Resmi Standar Ritel Modern (ACNielsen PC Code 2 - 471)
export const RETAIL_CATEGORY_DICTIONARY: { keywords: string[]; code: number; name: string }[] = [
  { keywords: ['powder detergent', 'deterjen bubuk', 'attack', 'rinso', 'daia', 'soklin bubuk'], code: 2, name: 'Powder Detergent' },
  { keywords: ['powder milk', 'susu bubuk', 'dancow', 'indomilk powder', 'bendera 456', 'sgm', 'lactogen', 'bebelac', 'anlene', 'milo bubuk'], code: 3, name: 'Powder Milk' },
  { keywords: ['sweetened condensed milk', 'skm', 'scm', 'susu kental manis', 'enaak', 'frisian flag kental', 'carnation', 'omela'], code: 4, name: 'Sweetened Condensed Milk (SCM)' },
  { keywords: ['cooking oil', 'minyak goreng', 'bimoli', 'filma', 'barco', 'sunco', 'sania', 'fortune', 'tropical'], code: 5, name: 'Cooking Oil' },
  { keywords: ['shoe care', 'semir sepatu', 'kiwi', 'cololite'], code: 6, name: 'Shoe Care' },
  { keywords: ['candies', 'permen', 'kopiko', 'kiss', 'relaxa', 'fox', 'mentos', 'alpenliebe'], code: 7, name: 'Total Candies MT' },
  { keywords: ['cigarette', 'rokok', 'gudang garam', 'djarum', 'sampoerna', 'marlboro', 'surya', 'la lights'], code: 8, name: 'Cigarette' },
  { keywords: ['cologne', 'parfum', 'body spray', 'axe', 'pucelle', 'rexona', 'casablanca', 'gatsby cologne'], code: 9, name: 'Cologne' },
  { keywords: ['snack', 'makanan ringan', 'chiki', 'cheetos', 'chitato', 'taro', 'lays', 'pringles', 'piattos', 'kusuka', 'pilus'], code: 10, name: 'Snack' },
  { keywords: ['mineral water', 'air mineral', 'aqua', 'ades', 'vit', 'le minerale', 'club'], code: 13, name: 'Mineral Water' },
  { keywords: ['razor', 'silet', 'gillette', 'pisau cukur', 'goal', 'schick'], code: 14, name: 'Razor Blades' },
  { keywords: ['juice', 'sari buah', 'buavita', 'nutrisari', 'abc juice', 'floridina', 'minute maid'], code: 15, name: 'Liquid Juice' },
  { keywords: ['toilet soap', 'sabun mandi', 'lux', 'lifebuoy', 'giv', 'nuvo', 'biore body', 'dettol sabun'], code: 21, name: 'Toilet Soap' },
  { keywords: ['toothpaste', 'pasta gigi', 'pepsodent', 'close-up', 'ciptadent', 'sensodyne', 'colgate'], code: 22, name: 'Tooth Paste' },
  { keywords: ['talcum powder', 'bedak tabur', 'herocyn', 'cussons baby powder', 'my baby powder', 'johnson powder'], code: 23, name: 'Talcum Powder' },
  { keywords: ['skin care', 'skincare', 'lotion', 'citra', 'nivea', 'vaseline', 'ponds', 'wardah', 'garnier', 'biore facial'], code: 24, name: 'Skin Care' },
  { keywords: ['sanitary napkin', 'pembalut', 'laurier', 'softex', 'charm', 'hers protex'], code: 25, name: 'Sanitary Napkins' },
  { keywords: ['shampoo', 'pencuci rambut', 'sunsilk', 'clear', 'pantene', 'dove shampoo', 'head & shoulders', 'rejoice', 'zinc'], code: 26, name: 'Shampoo' },
  { keywords: ['battery', 'baterai', 'energizer', 'duracell', 'abc baterai', 'alkaline'], code: 32, name: 'Battery' },
  { keywords: ['insecticides', 'obat nyamuk', 'baygon', 'raid', 'hit', 'autan', 'soffell', 'tiga roda'], code: 45, name: 'Insecticides' },
  { keywords: ['cleaners', 'pembersih lantai', 'wipol', 'soklin lantai', 'super pell', 'vixal', 'porstex', 'harpic'], code: 48, name: 'Cleaners' },
  { keywords: ['air freshner', 'pengharum ruangan', 'bayfresh', 'stella', 'glade', 'bagus kamper'], code: 52, name: 'Air Freshner' },
  { keywords: ['dishwashing liquid', 'sabun cuci piring', 'sunlight', 'mama lemon', 'ekonomi liquid'], code: 53, name: 'Dishwashing Liquid' },
  { keywords: ['fabric softener', 'pelembut pakaian', 'downy', 'molto', 'so klin softener'], code: 54, name: 'Fabric Softener' },
  { keywords: ['glass cleaner', 'pembersih kaca', 'cling', 'clear glass'], code: 55, name: 'Glass Cleaner' },
  { keywords: ['scouring powder', 'bubuk pembersih', 'vim', 'scourer'], code: 56, name: 'Scouring Powder' },
  { keywords: ['gum', 'permen karet', 'chiclets', 'wrigleys', 'clorets', 'happydent', 'big babol'], code: 57, name: 'Gum' },
  { keywords: ['mouth wash', 'mouthwash', 'obat kumur', 'listerine', 'pepsodent mouthwash'], code: 58, name: 'Mouth Wash' },
  { keywords: ['cheese', 'keju', 'kraft', 'anchor', 'prochiz', 'meg cheese'], code: 59, name: 'Cheese' },
  { keywords: ['coffee', 'kopi', 'kapal api', 'nescafe', 'torabika', 'abc kopi', 'luwak white', 'good day', 'indocafe', 'espresso', 'latte', 'americano'], code: 63, name: 'Coffee' },
  { keywords: ['margarine', 'butter', 'mentega', 'blue band', 'simas', 'forvita', 'palmboom', 'wisman'], code: 64, name: 'Margarine & Butter' },
  { keywords: ['baby cereal', 'bubur bayi', 'cerelac', 'promina', 'sun bubur', 'milna'], code: 65, name: 'Baby Cereal' },
  { keywords: ['chocolate', 'cokelat', 'silverqueen', 'cadbury', 'delfi', 'beng-beng', 'top', 'chacha'], code: 67, name: 'Chocolate' },
  { keywords: ['package tea', 'teh celup', 'teh bubuk', 'sariwangi', 'lipton', 'cap botol', 'sosro celup', 'tong tji'], code: 68, name: 'Package Tea' },
  { keywords: ['stock soup', 'msg', 'ajinomoto', 'sasa', 'royco', 'masako', 'knorr', 'penyedap'], code: 69, name: 'Stock Soup, Soup & MSG' },
  { keywords: ['liquid milk', 'susu cair', 'ultra milk', 'indomilk cair', 'diamond milk', 'bear brand', 'frisian flag uht', 'milo uht'], code: 70, name: 'Liquid Milk' },
  { keywords: ['hair styling', 'pomade', 'gatsby', 'hair gel', 'rudy hadisuwarno'], code: 71, name: 'Hair Styling' },
  { keywords: ['biscuit', 'biskuit', 'roma', 'regal', 'good time', 'oreo', 'tango', 'nabati', 'khong guan', 'nissin', 'malkist', 'slai olai'], code: 73, name: 'Biscuit' },
  { keywords: ['bread spread', 'selai', 'meses', 'ceres', 'morin', 'nutella', 'skippy', 'mayonnaise', 'maestro'], code: 74, name: 'Bread Spread' },
  { keywords: ['tooth brush', 'toothbrush', 'sikat gigi', 'oral-b', 'formula sikat', 'pepsodent sikat', 'ciptadent sikat'], code: 75, name: 'Tooth Brush' },
  { keywords: ['yoghurt drink', 'yakult', 'vitacharm', 'cimory yogurt'], code: 76, name: 'Yoghurt Drink' },
  { keywords: ['liquid hand soap', 'sabun cuci tangan', 'hand wash', 'dettol hand', 'lifebuoy hand'], code: 77, name: 'Liquid Hand Soap' },
  { keywords: ['breakfast cereal', 'sereal', 'koko krunch', 'quaker', 'energen', 'milo balls'], code: 78, name: 'Breakfast Cereal' },
  { keywords: ['hair tonic', 'tonik rambut', 'neril', 'natur hair'], code: 80, name: 'Hair Tonic' },
  { keywords: ['baby diapers', 'pampers', 'mamypoko', 'merries', 'sweety', 'goon', 'fitti'], code: 81, name: 'Baby Diapers' },
  { keywords: ['face powder', 'bedak muka', 'marcks', 'pigeon powder', 'wardah powder'], code: 82, name: 'Face Powder' },
  { keywords: ['foundation', 'alas bedak', 'bb cream', 'purbasari'], code: 83, name: 'Foundation' },
  { keywords: ['hair conditioner', 'kondisioner', 'pantene conditioner', 'dove conditioner'], code: 85, name: 'Hair Conditioner' },
  { keywords: ['coffee creamer', 'krimer', 'max creamer', 'fibercreme'], code: 86, name: 'Coffee Creamer' },
  { keywords: ['instant noodle', 'mie instan', 'indomie', 'sarimi', 'supermi', 'mie sedaap', 'pop mie', 'lemonilo'], code: 90, name: 'Instant Noodle' },
  { keywords: ['hair colouring', 'pewarna rambut', 'semir rambut', 'miranda', 'nyu', 'garnier color'], code: 91, name: 'Hair Colouring' },
  { keywords: ['seasoning flour', 'tepung bumbu', 'sajiku', 'kobe', 'sasa tepung'], code: 93, name: 'Seasoning Flour' },
  { keywords: ['carbonated soft drink', 'csd', 'soda', 'coca-cola', 'pepsi', 'sprite', 'fanta', 'big cola'], code: 95, name: 'Carbonated Soft Drink' },
  { keywords: ['remedy drink', 'larutan penyegar', 'cap kaki tiga', 'lasegar', 'adem sari'], code: 98, name: 'Remedy Drink' },
  { keywords: ['rtd tea', 'teh siap saji', 'teh botol', 'teh pucuk', 'frestea', 'ichitan', 'nu green tea', 'teh gelas'], code: 100, name: 'RTD Tea (Ready to Drink Tea)' },
  { keywords: ['ice cream', 'es krim', 'walls', 'campina', 'aice', 'glico wings'], code: 101, name: 'Ice Cream' },
  { keywords: ['energy drink', 'minuman berenergi', 'kratingdaeng', 'extra joss', 'm-150', 'kuku bima', 'hemaviton jreng'], code: 104, name: 'Energy Drink' },
  { keywords: ['light bulb', 'bohlam', 'lampu led', 'philips', 'hannochs', 'osram'], code: 105, name: 'Light Bulb' },
  { keywords: ['canned fish', 'canned meat', 'sarden', 'kornet', 'botan', 'abc sarden', 'pronas'], code: 106, name: 'Canned Fish & Canned Meat' },
  { keywords: ['facial tissues', 'tisu wajah', 'paseo', 'nice', 'tessa', 'multi'], code: 107, name: 'Facial Tissues' },
  { keywords: ['nursing bottle', 'botol susu', 'dot bayi', 'pigeon botol', 'huki'], code: 108, name: 'Nursing Bottle & Nipple' },
  { keywords: ['functional drink', 'isotonik', 'pocari sweat', 'mizone', 'isoplus', 'you c1000'], code: 110, name: 'Functional Drink' },
  { keywords: ['household tissues', 'tisu toilet', 'tisu dapur', 'tisu roll'], code: 116, name: 'Household Tissues' },
  { keywords: ['pet food', 'makanan kucing', 'makanan anjing', 'whiskas', 'pedigree', 'friskies', 'bolt'], code: 119, name: 'Pet Food' },
  { keywords: ['bleach', 'pemutih pakaian', 'bayclin', 'soklin pemutih', 'vanish'], code: 120, name: 'Bleach' },
  { keywords: ['powder soft drink', 'minuman serbuk', 'marimas', 'jasjus', 'pop ice', 'teajus'], code: 121, name: 'Powder Soft Drink' },
  { keywords: ['dry noodle', 'bihun', 'sohun', 'mie kering', 'mie telur', 'cap atom'], code: 123, name: 'Dry Noodle' },
  { keywords: ['flavoured water', 'flavored water', 'air perisa', 'nata de coco', 'inaco', 'wong coco'], code: 125, name: 'Flavoured Water' },
  { keywords: ['frozen', 'nugget', 'sosis beku', 'fiesta', 'belfoods', 'so good', 'kanzler', 'champ'], code: 127, name: 'Frozen Fish & Meat' },
  { keywords: ['non powder detergent', 'deterjen cair', 'sabun colek', 'rinso cair', 'attack cair', 'soklin liquid', 'ekonomi colek'], code: 130, name: 'Non Powder Detergent' },
  { keywords: ['seasoning liquid', 'bumbu cair', 'saus tiram', 'saori', 'kecap inggris', 'minyak wijen'], code: 131, name: 'Seasoning Liquid' },
  { keywords: ['gallon', 'galon', 'aqua galon', 'le minerale galon'], code: 132, name: 'Gallon Mineral Water' },
  { keywords: ['ironning aid', 'pelicin setrika', 'kispray', 'rapika', 'trika'], code: 133, name: 'Ironning Aid' },
  { keywords: ['tomato sauce', 'saus tomat', 'abc tomat', 'delmonte tomat'], code: 135, name: 'Tomato Sauce' },
  { keywords: ['nuts', 'kacang', 'garuda', 'dua kelinci', 'kacang atom', 'kacang sukro'], code: 136, name: 'Nuts' },
  { keywords: ['gel dessert', 'jelly', 'agar-agar', 'nutrijell', 'swallow globe', 'okky jelly'], code: 138, name: 'Gel Dessert' },
  { keywords: ['syrup', 'sirup', 'marjan', 'abc syrup', 'kurnia', 'dht'], code: 200, name: 'Syrup' },
  { keywords: ['soy sauce', 'kecap', 'bango', 'kecap abc', 'sedaap kecap'], code: 205, name: 'Soy Sauce' },
  { keywords: ['chilli sauce', 'saus sambal', 'sambal abc', 'indofood sambal', 'belibis', 'jawara'], code: 207, name: 'Chilli Sauce' },
  { keywords: ['coffee rtd', 'kopi siap saji', 'nescafe kaleng', 'kopiko 78', 'good day botol', 'golda'], code: 337, name: 'Coffee RTD' },
  { keywords: ['feminine wash', 'pembersih kewanitaan', 'resik-v', 'lactacyd', 'sumber ayu'], code: 338, name: 'Feminine Wash' },
  { keywords: ['body scrub', 'lulur', 'shinzui lulur', 'purbasari lulur'], code: 340, name: 'Body Scrub' },
  { keywords: ['rice', 'beras', 'ramos', 'pandan wangi', 'rojolele', 'sania beras'], code: 342, name: 'Rice' },
  { keywords: ['salt', 'garam', 'cap kapal', 'refina', 'dolpin'], code: 343, name: 'Salt' },
  { keywords: ['sugar', 'gula', 'gulaku', 'rose brand gula', 'gula pasir', 'gula merah'], code: 344, name: 'Sugar' },
  { keywords: ['egg', 'telur', 'telur ayam', 'telur bebek'], code: 345, name: 'Egg' },
  { keywords: ['bread', 'roti', 'sari roti', 'mr bread', 'sharon', 'bakery', 'pastry', 'croissant'], code: 351, name: 'Bread' },
  { keywords: ['stationery', 'alat tulis', 'pulpen', 'buku tulis', 'sidu', 'joyko', 'kenko'], code: 352, name: 'Stationery' },
  { keywords: ['wet tissue', 'tisu basah', 'mitu', 'cussons wipes'], code: 462, name: 'Wet Tissue' },
  { keywords: ['adult diapers', 'popok dewasa', 'confidence', 'lifree', 'oto diapers'], code: 471, name: 'Adult Diapers' }
];

// 3. AI Smart Mapper (Pencocokan Barcode Eksisting + Keyword Tokenization)
export function runAISmartMapper(
  barcode: string,
  longDesc: string,
  existingProducts: Product[] = []
): { categoryCode: number; categoryName: string; matchedBy: 'BARCODE' | 'AI_TOKEN' | 'DEFAULT' } {
  const cleanBarcode = barcode.trim();
  if (cleanBarcode) {
    const foundByBarcode = existingProducts.find((p) => p.barcode === cleanBarcode && p.categoryCode);
    if (foundByBarcode && foundByBarcode.categoryCode) {
      return {
        categoryCode: Number(foundByBarcode.categoryCode),
        categoryName: foundByBarcode.category || 'Snack',
        matchedBy: 'BARCODE'
      };
    }
  }

  const cleanText = longDesc.toLowerCase().trim();
  for (const item of RETAIL_CATEGORY_DICTIONARY) {
    for (const kw of item.keywords) {
      if (cleanText.includes(kw)) {
        return {
          categoryCode: item.code,
          categoryName: item.name,
          matchedBy: 'AI_TOKEN'
        };
      }
    }
  }

  return {
    categoryCode: 10,
    categoryName: 'Snack / General',
    matchedBy: 'DEFAULT'
  };
}

// 4. Regex Attribute Parser (Brand, Pack Size, & Satuan Unit Otomatis)
export function parseProductAttributes(longDesc: string): { brand: string; packSize: string; unit: string } {
  const clean = toTitleCase(longDesc);
  const words = clean.split(/\s+/);
  const brand = words[0] ? words[0].toUpperCase() : 'GENERIC';

  const sizeRegex = /(\d+(?:[.,]\d+)?\s*(?:x\s*\d+)?\s*(?:gr|g|kg|ml|lt|l|pcs|sachet|box|can|botol|pack|btl))/i;
  const match = longDesc.match(sizeRegex);
  const packSize = match ? match[0].toUpperCase().replace(/\s+/g, ' ') : 'STD';

  let unit = 'Pcs';
  if (/box|dus|karton/i.test(longDesc)) unit = 'Box';
  else if (/pack|renteng|\d+x\d+/i.test(longDesc)) unit = 'Pack';
  else if (/lt|ml|botol|can|kaleng|btl/i.test(longDesc)) unit = 'Btl/Can';
  else if (/sachet|sch/i.test(longDesc)) unit = 'Sachet';
  else if (/kg|karung|sak/i.test(longDesc)) unit = 'Kg/Sak';

  return { brand, packSize, unit };
}

// 5. Multi-Tier Pricing Engine (+20% Retail, +15% Member, +10% Grosir)
export function calculateTierPrices(costPrice: number) {
  const safeCost = Math.max(0, Number(costPrice) || 0);
  const retailPrice = Math.ceil((safeCost * 1.2) / 100) * 100;
  const memberPrice = Math.ceil((safeCost * 1.15) / 100) * 100;
  const wholesalePrice = Math.ceil((safeCost * 1.1) / 100) * 100;
  return { retailPrice, memberPrice, wholesalePrice };
}
