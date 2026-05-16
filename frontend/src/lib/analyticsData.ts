export interface KPIData {
  topItem: string;
  topItemSales: number;
  totalRevenue: number;
  growthRate: number;
  demandAlerts: number;
  avgOrderValue: number;
}

export interface CategorySalesData {
  name: string;
  sales: number;
  revenue: number;
  trend: "up" | "down" | "stable";
}

export interface TrendPoint {
  month: string;
  sales: number;
  predicted: number;
}

export interface AnalyticsResult {
  kpi: KPIData;
  categorySales: CategorySalesData[];
  trendData: TrendPoint[];
  insights: string[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function seededRandom(seed: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const normalized = Math.abs(hash % 1000) / 1000;
  return Math.floor(normalized * (max - min + 1)) + min;
}

// Product items mapped by sector ID
const sectorItems: Record<string, string[]> = {
  // ── RETAIL ──
  grocery:        ["Fresh Vegetables", "Dairy Products", "Packaged Snacks", "Beverages", "Bakery Items", "Cooking Oils"],
  clothing:       ["Men's Shirts", "Women's Kurtis", "Jeans & Denim", "Kids Wear", "Sports Jerseys", "Ethnic Sarees"],
  electronics:    ["Smartphones", "TWS Earbuds", "Laptop Bags", "Power Banks", "Smart Watches", "Bluetooth Speakers"],
  pharmacy:       ["Paracetamol", "Vitamin C Supplements", "Hand Sanitizer", "BP Monitors", "Baby Diapers", "Antiseptic Cream"],
  furniture:      ["Sofa Sets", "Study Tables", "Wardrobes", "Dining Tables", "Mattresses", "Coffee Tables"],
  footwear:       ["Men's Sneakers", "Women's Heels", "Sports Shoes", "Leather Sandals", "Kids' Shoes", "Formal Shoes"],
  sports:         ["Yoga Mats", "Dumbbells", "Cricket Bats", "Football Boots", "Cycling Gloves", "Resistance Bands"],
  jewelry:        ["Gold Necklaces", "Diamond Rings", "Silver Bracelets", "Earrings", "Watches", "Bangles"],
  mobile_telecom: ["iPhones", "Samsung Galaxy", "OnePlus Phones", "Feature Phones", "Phone Cases", "Chargers"],
  bakery:         ["Sourdough Bread", "Chocolate Cakes", "Croissants", "Cookies Assorted", "Gulab Jamun", "Black Forest"],
  toys:           ["LEGO Sets", "Remote Cars", "Barbie Dolls", "Board Games", "Jigsaw Puzzles", "Soft Toys"],
  books:          ["Fiction Novels", "NCERT Textbooks", "Notebooks", "Sketch Pens", "Art Supplies", "Planners"],
  hardware:       ["Power Drills", "Screwdriver Sets", "PVC Pipes", "Electrical Switches", "Paints & Primers", "Nails & Bolts"],
  auto_retail:    ["Car Phone Mounts", "Dash Cams", "Bike Helmets", "Car Seat Covers", "Engine Oils", "Jump Starters"],
  optical:        ["Prescription Glasses", "Sunglasses", "Contact Lenses", "Blue Light Glasses", "Reading Glasses", "Kids Frames"],
  pet_retail:     ["Dog Food Pouches", "Cat Litter Bags", "Dog Toys", "Cat Scratchers", "Pet Shampoo", "Fish Food"],
  organic:        ["Organic Veggies", "Almond Milk", "Dry Fruits", "Herbal Tea", "Chia Seeds", "Cold Pressed Oils"],
  baby:           ["Baby Diapers", "Baby Formula", "Baby Clothing", "Rattles & Toys", "Baby Monitors", "Feeding Bottles"],
  music:          ["Acoustic Guitars", "Digital Keyboards", "Drum Kits", "Microphones", "DJ Controllers", "Guitar Picks"],
  garden:         ["Potted Plants", "Vegetable Seeds", "Garden Soil", "Watering Cans", "Pruning Shears", "Fertilizers"],

  // ── E-COMMERCE ──
  online_fashion: ["Women's Dresses", "Men's T-Shirts", "Ethnic Kurtas", "Sneakers", "Handbags", "Accessories"],
  electronics_ec: ["iPhone 15", "Samsung Galaxy S24", "AirPods Pro", "iPad Air", "Gaming Keyboards", "Smartwatches"],
  beauty_ec:      ["Moisturizers", "Lipsticks", "Vitamin C Serums", "Hair Oils", "Face Masks", "Sunscreen SPF50"],
  online_grocery: ["Organic Produce Box", "Almond Milk", "Frozen Paneer", "Instant Oats", "Green Tea", "Dark Chocolate"],
  home_ec:        ["Air Fryers", "Robot Vacuum Cleaners", "LED Strip Lights", "Storage Ottoman", "Curtains", "Cushion Covers"],
  health_wellness:["Whey Protein", "Omega-3 Capsules", "Gym Gloves", "Treadmill", "Yoga Blocks", "Collagen Supplements"],
  handmade:       ["Macramé Wall Art", "Handmade Candles", "Pottery Mugs", "Custom Jewelry", "Batik Fabric", "Resin Art"],
  online_pharmacy:["Amoxicillin", "Vitamin D3", "Blood Glucose Strips", "Pulse Oximeter", "KN95 Masks", "Thermometers"],
  food_delivery:  ["Chicken Biryani", "Cheese Burger", "Margherita Pizza", "Fresh Lime Soda", "Veg Thali", "Chocolate Brownie"],
  online_jewelry: ["Gold Chain 22K", "Diamond Solitaire Ring", "Silver Anklet", "Pearl Earrings", "Gemstone Pendant", "Bridal Set"],
  digital_products:["Udemy Courses", "Canva Templates", "eBook Bundle", "Stock Photos Pack", "WordPress Themes", "Notion Templates"],
  books_ec:       ["Bestseller Fiction", "JEE Prep Books", "Children's Picture Books", "Coloring Books", "Planners", "Art Journals"],
  sports_ec:      ["Cricket Batting Pads", "Cycling Helmet", "Treadmill 2HP", "Swimming Goggles", "Football Cleats", "Yoga Mat 6mm"],
  pet_ec:         ["Royal Canin Dog Food", "Whiskas Cat Food", "Interactive Dog Toy", "Cat Scratcher Tower", "Dog Treats", "Aquarium Kit"],
  subscription_box:["Monthly Beauty Box", "Snack Box Premium", "Book Lovers Box", "Kids' Activity Box", "Coffee Explorer Box", "Wellness Kit"],
  print_demand:   ["Custom Printed Tees", "Personalized Mugs", "Photo Phone Cases", "Customized Hoodies", "Poster Prints", "Logo Notebooks"],
  auto_ec:        ["Car Dash Cam 4K", "Phone Mount", "Bike Helmet", "Car Seat Cover Set", "Engine Flush Oil", "Tool Kit"],
  travel:         ["Cabin Luggage 20\"", "Travel Neck Pillow", "Packing Cubes", "Universal Adapter", "Toiletry Bag", "RFID Passport Holder"],
  office_ec:      ["Standing Desk", "Ergonomic Chair", "Mechanical Keyboard", "Desk Planner", "Cable Organizer", "Ring Light"],
  furniture_ec:   ["L-Shape Sofa", "King Bed Frame", "Study Desk", "3-Door Wardrobe", "Dining Table 6-Seater", "Bookshelf"],
  custom:         ["Top Product A", "Top Product B", "Top Product C", "Top Product D", "Top Product E", "Top Product F"],
};

const fallbackItems = ["Product A", "Product B", "Product C", "Product D", "Product E", "Product F"];

function getBaseItems(sectorId: string): string[] {
  return sectorItems[sectorId] || fallbackItems;
}

function filterBySubCategory(items: string[], subCategory: string): string[] {
  if (!subCategory.trim()) return items;
  const lower = subCategory.toLowerCase();
  const filtered = items.filter((item) => item.toLowerCase().includes(lower));
  if (filtered.length === 0) {
    return [
      `${subCategory} — Premium`,
      `${subCategory} — Standard`,
      `${subCategory} — Budget Pick`,
      `${subCategory} — Seasonal`,
      `${subCategory} — New Launch`,
      `${subCategory} — Bestseller`,
    ];
  }
  return filtered;
}

export function generateAnalytics(
  businessType: string,
  sectorId: string,
  subCategory: string = ""
): AnalyticsResult {
  const baseItems = getBaseItems(sectorId);
  const items = filterBySubCategory(baseItems, subCategory);
  const seed = `${businessType}-${sectorId}-${subCategory}`;

  const categorySales: CategorySalesData[] = items.map((item) => {
    const sales = seededRandom(`${seed}-${item}-sales`, 120, 980);
    const revenue = sales * seededRandom(`${seed}-${item}-rev`, 200, 2500);
    const trendRoll = seededRandom(`${seed}-${item}-trend`, 0, 2);
    return {
      name: item,
      sales,
      revenue,
      trend: trendRoll === 0 ? "up" : trendRoll === 1 ? "down" : "stable",
    };
  });

  categorySales.sort((a, b) => b.sales - a.sales);

  const trendData: TrendPoint[] = MONTHS.map((month) => {
    const base = seededRandom(`${seed}-trend-${month}`, 300, 900);
    const predicted = base + seededRandom(`${seed}-pred-${month}`, -60, 180);
    return { month, sales: base, predicted: Math.max(0, predicted) };
  });

  const topItem = categorySales[0];
  const totalRevenue = categorySales.reduce((acc, c) => acc + c.revenue, 0);

  const kpi: KPIData = {
    topItem: topItem.name,
    topItemSales: topItem.sales,
    totalRevenue,
    growthRate: seededRandom(`${seed}-growth`, 3, 34),
    demandAlerts: seededRandom(`${seed}-alerts`, 1, 8),
    avgOrderValue: seededRandom(`${seed}-aov`, 250, 3200),
  };

  const runner = categorySales[1]?.name ?? "your second product";
  const insights: string[] = [
    `📈 "${topItem.name}" is your top performer with ${topItem.sales.toLocaleString()} units sold this month.`,
    `🔥 "${runner}" is close behind — consider featuring it more prominently.`,
    `⚠️ ${kpi.demandAlerts} product(s) are showing low-stock signals. Reorder before stockout.`,
    `💡 Average order value is ₹${kpi.avgOrderValue.toLocaleString()} — ${kpi.growthRate > 18 ? "excellent basket size!" : "bundle offers could push this higher."}`,
    `📊 Monthly sales trend shows ${kpi.growthRate}% growth — ${kpi.growthRate > 25 ? "outstanding — you're in the top tier! 🚀" : kpi.growthRate > 15 ? "solid and on an upward trajectory." : "steady — consistent performers win long-term."}`,
  ];

  return { kpi, categorySales, trendData, insights };
}
