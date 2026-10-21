// Fixed site content. Everything the Foundation edits day to day (events, blog, programs,
// board, alumni, yearly reports, contact details) lives in the admin dashboard instead: see lib/seed.ts.

export const site = {
  name: "Lake County Tech Campus Foundation",
  short: "LCTC Foundation",
  tagline: "Skills. Success. Future.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://lctc-dev.vercel.app",
};
// Email, phone, address and member schools are edited in Admin → Settings (see lib/seed.ts).

export const money = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

export const slides = [
  { src: "/assets/img/welding.jpg", caption: "Welding", alt: "A welding student in a helmet working at a bench as sparks fly", w: 1024, h: 683 },
  { src: "/assets/img/nursing.jpg", caption: "Health careers", alt: "Nursing and EMT students smiling during a simulation exercise", w: 1024, h: 738 },
  { src: "/assets/img/culinary.jpg", caption: "Culinary arts", alt: "A culinary student in chef whites piping icing in a teaching kitchen", w: 1024, h: 683 },
  { src: "/assets/img/construction.jpg", caption: "Construction", alt: "Three students in hard hats measuring a wooden frame", w: 1024, h: 683 },
  { src: "/assets/img/cosmetology.jpg", caption: "Cosmetology", alt: "Cosmetology students styling hair for guests", w: 1024, h: 683 },
];

export type GrantType = { id: string; name: string; icon: string; text: string };

export const grantTypes: GrantType[] = [
  { id: "scholarship", name: "Scholarship", icon: "🎓", text: "For graduating students heading to college, an apprenticeship or straight into the workforce." },
  { id: "tools", name: "Tools & equipment grant", icon: "🧰", text: "Starter kits, uniforms, protective gear and program supplies." },
  { id: "certification", name: "Certification fee grant", icon: "📜", text: "Exam and licensing fees for the industry certifications employers ask for." },
  { id: "fees", name: "Program fee assistance", icon: "🧾", text: "Help with Tech Campus course and lab fees." },
  { id: "emergency", name: "Emergency need", icon: "🤝", text: "Transportation, clothing or other urgent costs that could keep you from finishing." },
];

// Each type has its own preset amounts on the donate page; picking a type swaps the presets and
// selects its default. `name` is what gets saved on the donation record (Admin → Donations → Fund).
export type DonationType = { slug: string; name: string; icon: string; text: string; presets: number[]; default: number };

export const donationTypes: DonationType[] = [
  { slug: "general", name: "General donation", icon: "💙", text: "Goes wherever students need it most this year.", presets: [25, 50, 100, 250, 500, 1000], default: 50 },
  { slug: "scholarships", name: "Scholarships", icon: "🎓", text: "Helps graduates head to college, an apprenticeship or their first job.", presets: [250, 500, 1000, 2500, 5000, 10000], default: 500 },
  { slug: "tools", name: "Tools & Equipment", icon: "🧰", text: "Starter kits, uniforms and protective gear for students who need them.", presets: [25, 75, 150, 250, 500, 1000], default: 250 },
  { slug: "certifications", name: "Certifications", icon: "📜", text: "Exam and licensing fees for industry credentials.", presets: [50, 100, 150, 200, 400, 800], default: 100 },
  { slug: "grants", name: "Student grants", icon: "🤝", text: "Fees and emergency help that keep students in their program.", presets: [50, 100, 200, 300, 500, 750], default: 100 },
  { slug: "tribute", name: "In honor or memory", icon: "🕊️", text: "Give in someone's name. Tell us who in the note on your receipt email.", presets: [25, 50, 100, 250, 500, 1000], default: 100 },
];

// Older links and saved gifts used this name for the general fund.
export const legacyFunds: Record<string, string> = { "Where it's needed most": "general" };

export const findDonationType = (key: string | null) =>
  donationTypes.find(t => t.slug === key || t.name === key) ?? donationTypes.find(t => t.slug === legacyFunds[key ?? ""]);

export type GivingLevel = { name: string; amount: number; type: string; perks: string[]; featured?: boolean };

// Annual giving levels on /pricing. Each "Give" button opens the donate page with the type and amount preselected.
export const givingLevels: GivingLevel[] = [
  { name: "Supporter", amount: 100, type: "general", perks: ["Name in the yearly impact report", "Foundation newsletter"] },
  { name: "Builder", amount: 250, type: "tools", perks: ["Puts a starter tool kit in a student's hands", "Everything in Supporter"] },
  { name: "Champion", amount: 1000, type: "scholarships", perks: ["Funds one student scholarship", "Invitation to the awards night", "Everything in Builder"], featured: true },
  { name: "Leadership Circle", amount: 5000, type: "scholarships", perks: ["Name a scholarship for a year", "Meet the students you support", "Everything in Champion"] },
];

export const photoCredits = [
  { text: "Welding, culinary, cosmetology, nursing and EMT photos", by: "COD Newsroom (College of DuPage)", byUrl: "https://www.flickr.com/photos/41431665@N07", license: "CC BY 2.0" },
  { text: "Graduates", by: "breezy421", byUrl: "https://www.flickr.com/photos/60202180@N00/152285899", license: "CC BY 2.0" },
  { text: "Culinary event", by: "VIUDeepBay", byUrl: "https://www.flickr.com/photos/44080391@N07/5401734615", license: "CC BY 2.0" },
  { text: "Carpentry and auto", by: "USDA Forest Service, Pacific Northwest Region", byUrl: "https://www.flickr.com/photos/135886671@N08", license: "public domain" },
  { text: "Mentoring and laptops", by: "U.S. Army Cyber Command", byUrl: "https://www.flickr.com/photos/131622585@N06", license: "public domain" },
];
