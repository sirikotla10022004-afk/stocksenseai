export type TopLevelType = "retail" | "ecommerce";

export interface TopLevel {
  id: TopLevelType;
  label: string;
  tagline: string;
  description: string;
  icon: string;
  examples: string;
  gradient: string;
  glow: string;
}

export interface BusinessCategory {
  id: string;
  label: string;
  emoji: string;
  tags: string[]; // suggested sub-category drill-downs
  description: string;
}

export const topLevelTypes: TopLevel[] = [
  {
    id: "retail",
    label: "Retail",
    tagline: "Physical & In-Store",
    description:
      "You sell products in a physical store, local market, or brick-and-mortar shop where customers walk in.",
    icon: "🏪",
    examples: "Clothing store, supermarket, pharmacy, electronics shop...",
    gradient: "from-violet-600 to-purple-700",
    glow: "shadow-violet-500/30",
  },
  {
    id: "ecommerce",
    label: "E-Commerce",
    tagline: "Online & Digital",
    description:
      "You sell products through an online store, marketplace (Amazon, Flipkart, Meesho), or your own website.",
    icon: "🛒",
    examples: "Shopify store, Amazon seller, Myntra brand, own website...",
    gradient: "from-blue-600 to-cyan-600",
    glow: "shadow-blue-500/30",
  },
];

export const retailBusinesses: BusinessCategory[] = [
  {
    id: "grocery",
    label: "Grocery & Supermarket",
    emoji: "🛒",
    description: "General provisions, daily essentials, packaged foods",
    tags: ["Fresh Produce", "Dairy & Eggs", "Beverages", "Snacks", "Bakery", "Frozen Food"],
  },
  {
    id: "clothing",
    label: "Clothing & Apparel",
    emoji: "👗",
    description: "Garments, fashion wear, ethnic and western clothing",
    tags: ["Men's Wear", "Women's Wear", "Kids' Wear", "Ethnic Wear", "Sportswear", "Winter Wear"],
  },
  {
    id: "electronics",
    label: "Electronics & Gadgets",
    emoji: "📱",
    description: "Phones, laptops, accessories, and consumer electronics",
    tags: ["Smartphones", "Laptops", "Accessories", "Audio & Earbuds", "Smart Home", "Cameras"],
  },
  {
    id: "pharmacy",
    label: "Pharmacy & Health",
    emoji: "💊",
    description: "Medicines, healthcare products, supplements",
    tags: ["Prescription Drugs", "OTC Medicines", "Vitamins", "Personal Care", "Baby Care", "Medical Devices"],
  },
  {
    id: "furniture",
    label: "Home & Furniture",
    emoji: "🛋️",
    description: "Furniture, home décor, and household items",
    tags: ["Living Room", "Bedroom", "Kitchen & Dining", "Home Décor", "Outdoor", "Lighting"],
  },
  {
    id: "footwear",
    label: "Footwear & Bags",
    emoji: "👟",
    description: "Shoes, sandals, bags, and leather goods",
    tags: ["Men's Footwear", "Women's Footwear", "Sports Shoes", "Handbags", "Backpacks", "Wallets"],
  },
  {
    id: "sports",
    label: "Sports & Fitness",
    emoji: "⚽",
    description: "Sports equipment, gym gear, and outdoor gear",
    tags: ["Gym Equipment", "Cricket", "Football", "Yoga & Pilates", "Cycling", "Swimming"],
  },
  {
    id: "jewelry",
    label: "Jewelry & Accessories",
    emoji: "💍",
    description: "Gold, silver, artificial jewelry, and fashion accessories",
    tags: ["Gold Jewelry", "Silver Jewelry", "Diamond", "Artificial Jewelry", "Watches", "Sunglasses"],
  },
  {
    id: "mobile_telecom",
    label: "Mobile & Telecom",
    emoji: "📡",
    description: "Mobile phones, SIM cards, recharges, and accessories",
    tags: ["Smartphones", "Feature Phones", "Chargers & Cables", "Cases & Covers", "SIM & Recharge"],
  },
  {
    id: "bakery",
    label: "Bakery & Confectionery",
    emoji: "🥐",
    description: "Baked goods, sweets, chocolates, and confections",
    tags: ["Breads & Buns", "Cakes & Pastries", "Cookies", "Chocolates", "Traditional Sweets", "Ice Cream"],
  },
  {
    id: "toys",
    label: "Toys & Games",
    emoji: "🧸",
    description: "Kids' toys, board games, educational toys",
    tags: ["Action Figures", "Board Games", "Educational Toys", "LEGO & Building", "Outdoor Toys", "Puzzles"],
  },
  {
    id: "books",
    label: "Books & Stationery",
    emoji: "📚",
    description: "Books, stationery, office supplies, art materials",
    tags: ["Fiction & Novels", "Academic & NCERT", "Art Supplies", "Notebooks & Pads", "Office Supplies", "Gift Stationery"],
  },
  {
    id: "hardware",
    label: "Hardware & Tools",
    emoji: "🔧",
    description: "Construction materials, tools, plumbing, and electrical",
    tags: ["Power Tools", "Hand Tools", "Plumbing", "Electrical", "Paints", "Adhesives"],
  },
  {
    id: "auto_retail",
    label: "Auto Parts & Accessories",
    emoji: "🚗",
    description: "Car and bike parts, accessories, and servicing items",
    tags: ["Car Accessories", "Bike Parts", "Engine Oils", "Tyres", "Car Care", "Helmets"],
  },
  {
    id: "optical",
    label: "Optical & Eyewear",
    emoji: "👓",
    description: "Spectacles, contact lenses, and eyewear accessories",
    tags: ["Prescription Glasses", "Sunglasses", "Contact Lenses", "Reading Glasses", "Kids' Eyewear"],
  },
  {
    id: "pet_retail",
    label: "Pet Store",
    emoji: "🐾",
    description: "Pet food, accessories, grooming, and healthcare",
    tags: ["Dog Food", "Cat Food", "Pet Toys", "Grooming Products", "Aquarium", "Bird Supplies"],
  },
  {
    id: "organic",
    label: "Organic & Health Food",
    emoji: "🥦",
    description: "Natural, organic, and health-focused food products",
    tags: ["Organic Vegetables", "Dry Fruits", "Health Drinks", "Seeds & Nuts", "Herbal Products", "Protein Foods"],
  },
  {
    id: "baby",
    label: "Baby & Kids Store",
    emoji: "🍼",
    description: "Baby care, clothing, feeding, and learning products",
    tags: ["Baby Clothing", "Diapers & Wipes", "Baby Food", "Feeding Accessories", "Baby Toys", "Baby Monitors"],
  },
  {
    id: "music",
    label: "Musical Instruments",
    emoji: "🎸",
    description: "Instruments, audio equipment, and accessories",
    tags: ["Guitars", "Keyboards", "Drums", "Microphones", "DJ Equipment", "Learning Accessories"],
  },
  {
    id: "garden",
    label: "Garden & Nursery",
    emoji: "🌱",
    description: "Plants, seeds, gardening tools, and outdoor supplies",
    tags: ["Indoor Plants", "Seeds", "Pots & Planters", "Fertilizers", "Garden Tools", "Outdoor Décor"],
  },
];

export const ecommerceBusinesses: BusinessCategory[] = [
  {
    id: "online_fashion",
    label: "Online Fashion Store",
    emoji: "👠",
    description: "Clothes, shoes, accessories sold online",
    tags: ["Women's Fashion", "Men's Fashion", "Kids' Fashion", "Ethnic Wear", "Western Wear", "Accessories"],
  },
  {
    id: "electronics_ec",
    label: "Consumer Electronics",
    emoji: "💻",
    description: "Tech products sold via marketplaces or own website",
    tags: ["Smartphones", "Laptops & PCs", "Audio & Earbuds", "Wearables", "Gaming", "Cameras"],
  },
  {
    id: "beauty_ec",
    label: "Beauty & Skincare",
    emoji: "💄",
    description: "Cosmetics, skincare, hair care, and personal grooming",
    tags: ["Skincare", "Makeup", "Hair Care", "Fragrances", "Men's Grooming", "Nail Care"],
  },
  {
    id: "online_grocery",
    label: "Online Grocery",
    emoji: "🥦",
    description: "Groceries, fresh produce, and daily essentials delivered",
    tags: ["Organic Produce", "Dairy & Eggs", "Ready to Eat", "Beverages", "Snacks", "Frozen Food"],
  },
  {
    id: "home_ec",
    label: "Home & Living",
    emoji: "🏠",
    description: "Home décor, kitchen appliances, and living products",
    tags: ["Kitchen Appliances", "Bedding & Linen", "Storage Solutions", "Lighting", "Bathroom", "Garden Decor"],
  },
  {
    id: "health_wellness",
    label: "Health & Wellness",
    emoji: "🏋️",
    description: "Supplements, fitness gear, and wellness products",
    tags: ["Whey Protein", "Vitamins & Minerals", "Gym Equipment", "Yoga Mats", "Resistance Bands", "Health Monitors"],
  },
  {
    id: "handmade",
    label: "Handmade & Crafts",
    emoji: "🎨",
    description: "Artisan products, handicrafts, and custom-made items",
    tags: ["Pottery", "Macramé", "Candles", "Custom Jewelry", "Paintings", "Handloom Fabric"],
  },
  {
    id: "online_pharmacy",
    label: "Online Pharmacy",
    emoji: "💊",
    description: "Medicines, OTC products, and healthcare delivered",
    tags: ["Prescription Drugs", "OTC Medicines", "Health Supplements", "Personal Care", "Baby Care", "Diagnostics"],
  },
  {
    id: "food_delivery",
    label: "Food Delivery & Cloud Kitchen",
    emoji: "🍔",
    description: "Restaurant food, cloud kitchen meals, and beverages",
    tags: ["Biryani & Rice", "Burgers & Wraps", "Pizza", "Beverages & Drinks", "Healthy Bowls", "Desserts"],
  },
  {
    id: "online_jewelry",
    label: "Online Jewelry Store",
    emoji: "💍",
    description: "Gold, diamond, silver, and fashion jewelry online",
    tags: ["Gold Jewelry", "Diamond Jewelry", "Silver", "Artificial Jewelry", "Wedding Collections", "Gifting"],
  },
  {
    id: "digital_products",
    label: "Digital Products & SaaS",
    emoji: "💾",
    description: "eBooks, courses, software, templates, and subscriptions",
    tags: ["eBooks", "Online Courses", "Templates", "Software Licenses", "Stock Photos", "Fonts & Design"],
  },
  {
    id: "books_ec",
    label: "Books & Education",
    emoji: "📚",
    description: "Books, stationery, and educational material online",
    tags: ["Fiction & Novels", "Competitive Exam Books", "Children's Books", "Stationery", "Art Supplies", "eBooks"],
  },
  {
    id: "sports_ec",
    label: "Sports & Outdoor Equipment",
    emoji: "🏅",
    description: "Sports gear, fitness equipment, and outdoor gear",
    tags: ["Cricket Equipment", "Cycling Gear", "Fitness Equipment", "Camping Gear", "Swimming", "Team Sports"],
  },
  {
    id: "pet_ec",
    label: "Online Pet Store",
    emoji: "🐶",
    description: "Pet food, accessories, grooming, and care products",
    tags: ["Dog Food", "Cat Food", "Pet Accessories", "Grooming Kits", "Treats & Chews", "Aquarium Products"],
  },
  {
    id: "subscription_box",
    label: "Subscription Box",
    emoji: "📦",
    description: "Curated monthly boxes — beauty, snacks, books, etc.",
    tags: ["Beauty Box", "Snack Box", "Book Box", "Kids' Box", "Fitness Box", "Coffee & Tea Box"],
  },
  {
    id: "print_demand",
    label: "Print on Demand",
    emoji: "🖨️",
    description: "Custom printed T-shirts, mugs, phone cases, and more",
    tags: ["Custom T-Shirts", "Hoodies", "Mugs", "Phone Cases", "Posters & Prints", "Custom Notebooks"],
  },
  {
    id: "auto_ec",
    label: "Online Auto Parts",
    emoji: "🚗",
    description: "Car and bike parts, accessories sold online",
    tags: ["Car Accessories", "Bike Parts", "Engine Oils", "Tyres & Wheels", "Car Care Products", "Tools"],
  },
  {
    id: "travel",
    label: "Travel Accessories",
    emoji: "✈️",
    description: "Luggage, travel kits, and accessories for travellers",
    tags: ["Luggage & Bags", "Travel Pillows", "Organizers", "Travel Adapters", "Passport Covers", "Toiletry Kits"],
  },
  {
    id: "office_ec",
    label: "Office Supplies",
    emoji: "🖊️",
    description: "Stationery, office furniture, and work-from-home gear",
    tags: ["Stationery", "Office Furniture", "Printers & Ink", "WFH Setup", "Planners & Diaries", "Filing & Storage"],
  },
  {
    id: "furniture_ec",
    label: "Online Furniture",
    emoji: "🛋️",
    description: "Furniture and home furnishings delivered at home",
    tags: ["Sofas & Couches", "Beds & Mattresses", "Study Tables", "Wardrobes", "Dining Sets", "Decor Accents"],
  },
];

export function getBusinessList(type: TopLevelType): BusinessCategory[] {
  return type === "retail" ? retailBusinesses : ecommerceBusinesses;
}
