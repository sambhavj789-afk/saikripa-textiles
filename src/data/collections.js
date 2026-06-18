// Single source of truth for all fabric collections.
// Import this from App.jsx, Catalogue.jsx, and FabricDetail.jsx.

export const collections = [
  {
    slug: "superior-collection",
    title: "Superior Collection",
    gsm: "380 GSM",
    gsmValue: 380,
    blend: "65/35 PV",
    construction: "65/35 PV",
    images: [
      "/catalogue/cover.jpg",
      "/catalogue/superior1.jpg",
      "/catalogue/superior2.jpg",
    ],
    image: "/catalogue/cover.jpg",
    category: "2/18 Matty",
    moq: "150 meters",
    colors: "60+ shades",
    finish: "Lustrous finish",
    uses: "School & Corporate Uniforms and Hospital",
    description:
      "Our flagship suiting fabric engineered for durability and sharp drape. Ideal for school uniforms, corporate blazers, and hotel staff attire.",
    longDescription:
      "Superior Collection is Saikripa's flagship suiting fabric, refined over a decade for institutions that demand consistency. The 380 GSM weight gives a premium structured drape, while the 65/35 polyester-viscose blend balances durability with soft breathability. Anti-wrinkle finishing means uniforms look sharp through full work-day wear and repeated industrial washes.",
  },
  {
    slug: "gold-club",
    title: "Gold Club",
    gsm: "345 GSM",
    gsmValue: 345,
    blend: "65/35 PV",
    construction: "65/35 PV",
    images: ["/catalogue/cover.jpg", "/catalogue/goldclub.jpg"],
    image: "/catalogue/cover.jpg",
    category: "2/18 Matty",
    moq: "150 meters",
    colors: "30+ shades",
    finish: "Lustrous finish",
    uses: "School & Corporate Uniforms and Hospital",
    description:
      "Executive-grade fabric with a premium lustrous finish. Preferred by leading hotel chains and hospitality groups across India.",
    longDescription:
      "Gold Club delivers a refined lustrous finish that reads as premium under both daylight and indoor lighting — the exact look hotel front-desks, restaurants, and concierge teams require. The 345 GSM weight makes it lighter than Superior while keeping the body needed for structured uniforms.",
  },
  {
    slug: "aura-plus",
    title: "Aura Plus",
    gsm: "380 GSM",
    gsmValue: 380,
    blend: "Premium PV",
    construction: "Premium PV",
    images: ["/catalogue/cover.jpg", "/catalogue/auraplus.jpg"],
    image: "/catalogue/cover.jpg",
    category: "2/18 Matty",
    moq: "150 meters",
    colors: "50+ shades",
    finish: "Lustrous finish",
    uses: "School & Corporate Uniforms and Hospital",
    description:
      "Crafted with premium PV blend for a soft-touch feel without compromising on structural integrity. Perfect for premium institutional uniforms.",
    longDescription:
      "Aura Plus is for buyers who refuse to choose between comfort and structure. A premium polyester-viscose blend gives this fabric a soft-touch hand-feel while maintaining the body needed for blazers and full uniforms. The most popular choice for premium private schools and high-end corporate wear.",
  },
  {
    slug: "innova",
    title: "Innova",
    gsm: "330 GSM",
    gsmValue: 330,
    blend: "2/30×300 ROTO POLY",
    construction: "2/30×300 ROTO POLY",
    images: ["/catalogue/cover.jpg", "/catalogue/innova.jpg"],
    image: "/catalogue/cover.jpg",
    category: "Gaberdine",
    moq: "150 meters",
    colors: "16+ shades",
    finish: "Lustrous finish",
    uses: "School & Corporate Uniforms and Hospital",
    description:
      "Premium gaberdine-weave fabric with a refined drape. Built for high-wear corporate and hospitality environments.",
    longDescription:
      "Innova brings the classic gaberdine weave into the Saikripa catalogue. The diagonal twill structure gives the fabric a distinctive surface and excellent recovery from creasing — a favorite for high-wear corporate and hospitality environments where appearance matters every day.",
  },
  {
    slug: "milky-way",
    title: "Milky Way",
    gsm: "300 GSM",
    gsmValue: 300,
    blend: "2/30×2/30",
    construction: "2/30×2/30",
    images: ["/catalogue/cover.jpg", "/catalogue/milkyway.jpg"],
    image: "/catalogue/cover.jpg",
    category: "PV Trovin",
    moq: "150 meters",
    colors: "25+ shades",
    finish: "Lustrous finish",
    uses: "School & Corporate Uniforms and Hospital",
    description:
      "Lightweight breathable fabric designed for warm climates. Widely used for summer school uniforms and industrial workwear across Rajasthan.",
    longDescription:
      "Milky Way is engineered for Indian summers. At 300 GSM the fabric is light enough for hot-weather wear yet structured enough to hold uniform shape through a full work day. The breathable weave makes it the go-to choice for schools in Rajasthan, Gujarat, and Madhya Pradesh as well as industrial workwear for the food, pharma, and logistics sectors.",
  },
  {
    slug: "classic-p7200",
    title: "Classic P/7200",
    gsm: "270 GSM",
    gsmValue: 270,
    blend: "2/30×1/15",
    construction: "2/30×1/15",
    images: ["/catalogue/cover.jpg", "/catalogue/classic.jpg"],
    image: "/catalogue/cover.jpg",
    category: "PV Trovin",
    moq: "150 meters",
    colors: "14+ shades",
    finish: "Lustrous finish",
    uses: "School & Corporate Uniforms and Hospital",
    description:
      "Lightweight 270 GSM blend designed for everyday wear and warm climates. Smooth finish and reliable color retention.",
    longDescription:
      "Classic P/7200 is Saikripa's most lightweight institutional fabric at 270 GSM — designed for high-volume orders where comfort across long working days matters. The smooth weave takes dye cleanly and resists fade through commercial laundering.",
  },
];

export const categories = ["All", "Gaberdine", "2/18 Matty", "PV Trovin"];

export const getCollectionBySlug = (slug) =>
  collections.find((c) => c.slug === slug);