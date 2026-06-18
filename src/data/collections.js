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
    uses: "School, Corporate, Hospital & Police Uniforms",
    description:
      "Our flagship 380 GSM suiting fabric with a lustrous finish and sharp, structured drape. Trusted for school and corporate uniforms, hospital staff wear, and police and security attire.",
    longDescription:
      "Superior Collection is Saikripa's flagship suiting fabric, refined over a decade for institutions that demand consistency. The 380 GSM weight gives a premium structured drape, while the 65/35 polyester-viscose blend balances durability with soft breathability. Its lustrous finish keeps school, corporate, hospital, and police uniforms looking crisp through full work-day wear and repeated industrial washes.",
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
    uses: "School, Corporate, Hospital & Police Uniforms",
    description:
      "Executive-grade 345 GSM fabric with a premium lustrous finish. A refined choice for corporate and school uniforms, hospital staff dress, and police and uniformed services.",
    longDescription:
      "Gold Club delivers a refined lustrous finish that reads as premium under both daylight and indoor lighting. The 345 GSM weight makes it lighter than Superior while keeping the body needed for structured uniforms — equally at home across corporate offices, schools, hospitals, and police and security forces.",
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
    uses: "School, Corporate, Hospital & Police Uniforms",
    description:
      "Crafted with a premium PV blend for a soft-touch feel and a lustrous finish, without compromising structural integrity. Built for school and corporate uniforms, hospital wear, and police and institutional dress.",
    longDescription:
      "Aura Plus is for buyers who refuse to choose between comfort and structure. A premium polyester-viscose blend gives this 380 GSM fabric a soft-touch hand-feel and lustrous finish while maintaining the body needed for blazers and full uniforms — a popular choice across schools, corporate teams, hospitals, and police and uniformed services.",
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
    uses: "School, Corporate, Hospital & Police Uniforms",
    description:
      "Premium 330 GSM gaberdine-weave fabric with a lustrous finish and excellent crease recovery. Ideal for corporate, school, hospital, and police uniforms.",
    longDescription:
      "Innova brings the classic gaberdine weave into the Saikripa catalogue. The diagonal twill structure gives the fabric a distinctive surface and excellent recovery from creasing — a dependable choice for high-wear school, corporate, hospital, and police uniforms where appearance matters every day.",
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
    uses: "School, Corporate, Hospital & Police Uniforms",
    description:
      "Lightweight 300 GSM fabric with a lustrous finish, designed for warm climates. Widely used for school, corporate, hospital, and police summer uniforms.",
    longDescription:
      "Milky Way is engineered for Indian summers. At 300 GSM the fabric is light enough for hot-weather wear yet structured enough to hold uniform shape through a full work day. It's a go-to for schools, corporate teams, hospitals, and police and security forces across Rajasthan, Gujarat, and Madhya Pradesh.",
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
    uses: "School, Corporate, Hospital & Police Uniforms",
    description:
      "Lightweight 270 GSM blend with a lustrous finish and reliable colour retention — built for everyday school, corporate, hospital, and police uniforms.",
    longDescription:
      "Classic P/7200 is Saikripa's most lightweight institutional fabric at 270 GSM — designed for high-volume orders where comfort across long working days matters. The fabric takes dye cleanly and resists fade through commercial laundering, making it ideal for school, corporate, hospital, and police uniforms.",
  },
];

export const categories = ["All", "Gaberdine", "2/18 Matty", "PV Trovin"];

export const getCollectionBySlug = (slug) =>
  collections.find((c) => c.slug === slug);