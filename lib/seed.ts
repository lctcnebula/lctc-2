// Starting data for every collection the admin dashboard manages.
// Anything marked `sample: true` is placeholder content: it shows a "Sample" tag on the
// public site until an admin edits or deletes it. All of it is original placeholder content.

import type { Application } from "./application";

export type Category = "health" | "safety" | "trades" | "tech" | "service";

export type Program = {
  id: string; slug: string; name: string; cat: Category; icon: string; image: string;
  length: string; summary: string; learn: string[]; outcome: string; sample?: boolean;
};

export type FoundationEvent = {
  id: string; slug: string; title: string; date: string; start: string; end: string; location: string;
  summary: string; body: string; image: string; capacity: number; rsvpOpen: boolean; published: boolean; sample?: boolean;
  /** People already going (RSVPs + guests). Filled in by the server for visitors who can't see the RSVP list. */
  taken?: number;
};

export type Rsvp = { id: string; eventId: string; name: string; email: string; guests: number; note: string; createdAt: string; sample?: boolean };

export type Post = {
  id: string; slug: string; title: string; date: string; author: string; eventId: string;
  excerpt: string; body: string; image: string; published: boolean; sample?: boolean;
};

export type Subscriber = { id: string; email: string; name: string; createdAt: string; sample?: boolean };

export type Freq = "once" | "monthly" | "yearly";
export const frequencies: Record<Freq, { label: string; adj: string; per: string; short: string }> = {
  once: { label: "One-time", adj: "one-time", per: "", short: "" },
  monthly: { label: "Monthly", adj: "monthly", per: " / month", short: "/mo" },
  yearly: { label: "Yearly", adj: "yearly", per: " / year", short: "/yr" },
};

export type Donation = {
  id: string; receipt: string; name: string; email: string; amount: number; freq: Freq;
  fund: string; tier?: string; card: string; createdAt: string; sample?: boolean;
  // Set when the donor gives in someone's name ("I am donating in memory of …"). keepInTouch: they asked for updates.
  dedication?: string; note?: string; keepInTouch?: boolean;
};

export type StoredApplication = Application & { status: string; sample?: boolean };

export type Message = { id: string; name: string; email: string; topic: string; message: string; status: string; createdAt: string; sample?: boolean };

// slug, company and the website/social links were added later, so members saved before then may not have them (see boardSlug).
export type BoardMember = {
  id: string; slug?: string; name: string; role: string; company?: string; bio: string; photo: string;
  website?: string; linkedin?: string; facebook?: string; instagram?: string; x?: string; order: number; sample?: boolean;
};

export type Alum = {
  id: string; name: string; email: string; program: string; year: string; now: string; story: string;
  photo: string; published: boolean; createdAt: string; sample?: boolean;
};

export type YearReport = {
  id: string; year: string; students: number; scholarships: number; granted: number; raised: number; donors: number;
  highlights: string[]; sample?: boolean;
};

export type Scholarship = { id: string; name: string; who: string; award: string; how: string; url: string };

export type Role = "superadmin" | "admin" | "accountant" | "user";
// `pass` only exists on the server; the browser never receives it.
export type User = { id: string; name: string; email: string; role: Role; pass?: string; createdAt: string };


export type Settings = { email: string; phone: string; address: string; schools: string[] };

export const categories: { id: Category; label: string }[] = [
  { id: "health", label: "Health" },
  { id: "safety", label: "Public safety" },
  { id: "trades", label: "Trades & transport" },
  { id: "tech", label: "Tech & media" },
  { id: "service", label: "Service & education" },
];

const at = (d: string) => new Date(d + "T10:00:00").toISOString();

export const seed = {
  settings: {
    email: "info@lctcfoundation.org",
    phone: "847-543-6040",
    address: "19525 W Washington St, Grayslake, IL 60030",
    schools: [], // Added by the Foundation in Admin → Settings
  } as Settings,

  // 18 programs. Names follow the Foundation's program list; descriptions are placeholders until edited in Admin → Programs.
  programs: [
    { id: "p6", slug: "automotive", name: "Automotive Service Technology", cat: "trades", icon: "🔧", image: "/assets/img/auto.jpg", length: "Two years",
      summary: "Diagnosing and repairing real vehicles in a working shop, on the computer diagnostic systems dealerships use.",
      learn: ["Shop and lift safety", "Brakes, steering and suspension", "Engine and electrical diagnosis", "Customer service and write-ups"],
      outcome: "Graduates move into dealership and independent shop roles.", sample: true },
    { id: "p7", slug: "collision-repair", name: "Automotive Collision Repair", cat: "trades", icon: "🚗", image: "/assets/img/auto.jpg", length: "Two years",
      summary: "Frame straightening, panel repair and refinishing, from first estimate to a restored vehicle.",
      learn: ["Damage analysis and estimates", "Frame and structural repair", "Panel replacement and welding", "Surface prep and refinishing"],
      outcome: "Students head into body shops, dealerships and industry certification programs.", sample: true },
    { id: "p1", slug: "welding", name: "Welding & Fabrication", cat: "trades", icon: "🔥", image: "/assets/img/welding.jpg", length: "Two years",
      summary: "Students learn to cut, join and fabricate metal safely on multi-process machines, from first bead to finished project.",
      learn: ["Shop safety and protective gear", "Common welding and cutting processes", "Reading drawings and symbols", "Building a finished project"],
      outcome: "Graduates head into apprenticeships, fabrication shops and further training.", sample: true },
    { id: "p8", slug: "industrial-technology", name: "Industrial Technology & Manufacturing", cat: "trades", icon: "⚙️", image: "/assets/img/sparks.jpg", length: "Two years",
      summary: "Machining, automation and the precision manufacturing skills behind the region's plants.",
      learn: ["Measurement and blueprint reading", "Machining and CNC basics", "Automation and controls", "Quality and lean production"],
      outcome: "A path into advanced manufacturing jobs and technical college.", sample: true },
    { id: "p4", slug: "construction", name: "Construction Skills & Management", cat: "trades", icon: "🔨", image: "/assets/img/construction.jpg", length: "Two years",
      summary: "Framing, measuring and building as a crew, with OSHA safety first on every job.",
      learn: ["Tool and site safety (OSHA)", "Measuring and layout", "Framing and finish work", "Planning and managing a crew"],
      outcome: "A direct path into union apprenticeships and building trades.", sample: true },
    { id: "p9", slug: "cybersecurity", name: "Cybersecurity", cat: "tech", icon: "🛡️", image: "/assets/img/laptops.jpg", length: "Two years",
      summary: "Defending networks in live lab environments, from firewalls to ethical hacking competitions.",
      learn: ["Networking fundamentals", "Firewalls and threat containment", "Ethical hacking in a safe lab", "Industry certification prep"],
      outcome: "Students continue into IT degrees, certifications and entry-level security roles.", sample: true },
    { id: "p10", slug: "game-programming", name: "Game Programming & Virtualization", cat: "tech", icon: "🎮", image: "/assets/img/laptops.jpg", length: "Two years",
      summary: "Coding games and virtual worlds on developer workstations, and building a portfolio to show for it.",
      learn: ["Programming fundamentals", "Game engines and 3D", "Virtual and augmented reality", "Building a portfolio"],
      outcome: "Graduates go on to computer science programs and creative tech careers.", sample: true },
    { id: "p11", slug: "multimedia", name: "Multimedia & Digital Design", cat: "tech", icon: "🎬", image: "/assets/img/mentoring.jpg", length: "Two years",
      summary: "Video, audio, photography and graphic design for real clients and student showcases.",
      learn: ["Design principles and software", "Video and audio production", "Photography and editing", "Client projects and portfolios"],
      outcome: "A start toward design school, media production and marketing roles.", sample: true },
    { id: "p2", slug: "nursing-assistant", name: "Certified Nurse Assistant", cat: "health", icon: "🩺", image: "/assets/img/nursing.jpg", length: "One year",
      summary: "Hands-on patient care training in a simulation lab, preparing students for the state CNA exam.",
      learn: ["Basic patient care", "Vital signs and safety", "Working on a care team", "Preparing for the state certification exam"],
      outcome: "Many students continue into nursing and other health programs.", sample: true },
    { id: "p12", slug: "medical-assisting", name: "Medical Assisting", cat: "health", icon: "💉", image: "/assets/img/nurse-sim.jpg", length: "Two years",
      summary: "Clinical and front-office skills, including phlebotomy, on hospital-grade training models.",
      learn: ["Phlebotomy and specimen handling", "Clinical procedures and sterile technique", "Medical terminology", "Front-office and patient records"],
      outcome: "Students move into clinics, hospitals and allied health programs.", sample: true },
    { id: "p13", slug: "dental-assisting", name: "Dental Assisting", cat: "health", icon: "🦷", image: "/assets/img/nurse-sim.jpg", length: "Two years",
      summary: "Chairside skills, infection control and radiography in a working dental lab.",
      learn: ["Infection control", "Chairside assisting", "Dental radiography basics", "Patient communication"],
      outcome: "A start toward dental assisting, hygiene and other health careers.", sample: true },
    { id: "p14", slug: "ems", name: "Emergency Medical Services", cat: "safety", icon: "🚑", image: "/assets/img/nursing.jpg", length: "One year",
      summary: "First responder and EMT training on pediatric trauma simulators and real scenarios.",
      learn: ["Patient assessment", "Trauma and medical emergencies", "CPR and first aid", "Preparing for licensing exams"],
      outcome: "A pathway into public safety, paramedic programs and fire service.", sample: true },
    { id: "p15", slug: "fire-science", name: "Firefighting & Fire Science", cat: "safety", icon: "🚒", image: "/assets/img/sparks.jpg", length: "Two years",
      summary: "Fire behavior, rescue and teamwork, trained alongside working firefighters.",
      learn: ["Fire behavior and safety", "Equipment and hose operations", "Search and rescue basics", "Physical and team readiness"],
      outcome: "Students head toward fire academies and public safety careers.", sample: true },
    { id: "p16", slug: "law-enforcement", name: "Criminal Justice & Law Enforcement", cat: "safety", icon: "🚓", image: "/assets/img/mentoring.jpg", length: "Two years",
      summary: "How policing, courts and corrections work, with hands-on scenarios and guest officers.",
      learn: ["The justice system", "Patrol and scenario training", "Report writing", "Ethics and communication"],
      outcome: "A start toward law enforcement, corrections and criminal justice degrees.", sample: true },
    { id: "p17", slug: "early-education", name: "Early Education & Teaching", cat: "service", icon: "🧸", image: "/assets/img/graduates.jpg", length: "Two years",
      summary: "Running real classroom activities in an on-campus preschool lab.",
      learn: ["Child development", "Lesson planning", "Classroom management", "Preparing for state credentials"],
      outcome: "Graduates continue into education degrees and early childhood careers.", sample: true },
    { id: "p3", slug: "culinary-arts", name: "Culinary Arts", cat: "service", icon: "🍳", image: "/assets/img/culinary.jpg", length: "Two years",
      summary: "Cooking, baking and running a kitchen, with real service for real guests.",
      learn: ["Knife skills and kitchen safety", "Baking and pastry", "Menu planning and costing", "Catering and front-of-house service"],
      outcome: "Students leave ready for restaurant work, catering or culinary school.", sample: true },
    { id: "p5", slug: "cosmetology", name: "Cosmetology", cat: "service", icon: "✂️", image: "/assets/img/cosmetology.jpg", length: "Two years",
      summary: "Hair, skin and nail services in a working student salon.",
      learn: ["Sanitation and client safety", "Cutting, color and styling", "Nail and skin care", "Client service"],
      outcome: "Students build toward the hours needed for a state license.", sample: true },
    { id: "p18", slug: "nail-technology", name: "Nail Technology & Esthetics", cat: "service", icon: "💅", image: "/assets/img/nails.jpg", length: "One year",
      summary: "Nail and skin care services for real clients in the student salon.",
      learn: ["Sanitation and safety", "Manicures and pedicures", "Nail enhancements", "Skin care basics"],
      outcome: "Students work toward state licensing and salon careers.", sample: true },
  ] as Program[],

  events: [
    { id: "e-mtm-oct", slug: "meet-the-mission-october-2026", title: "Meet the Mission", date: "2026-10-22", start: "9:30 AM", end: "11:00 AM", location: "Lake County Tech Campus, 19525 W Washington St, Grayslake, IL 60030",
      summary: "Discover how the Foundation serves our students and community. Donuts and coffee available.",
      body: "Join us for a morning at Tech Campus.\n\n## What to expect\n- Campus tours\n- A brief presentation on the Foundation's mission\n- Q&A with Foundation board members\n- Networking\n\nDonuts and coffee are available.",
      image: "/assets/img/welder-shop.jpg", capacity: 0, rsvpOpen: true, published: true },
    { id: "e-mtm-nov", slug: "meet-the-mission-november-2026", title: "Meet the Mission", date: "2026-11-12", start: "5:00 PM", end: "", location: "Lake County Tech Campus, 19525 W Washington St, Grayslake, IL 60030",
      summary: "An evening Meet the Mission meeting for business and community leaders ahead of the February 2027 CTE Month campaign.",
      body: "Between now and January 2027 the Foundation is hosting a series of Meet the Mission meetings to connect directly with business and community leaders as we prepare for our inaugural funding campaign during National CTE Month in February 2027.\n\n## What to expect\n- How the Foundation supports students across its four pillars\n- Student highlights\n- Q&A with Foundation board members",
      image: "/assets/img/mentoring.jpg", capacity: 0, rsvpOpen: true, published: true },
    { id: "e1", slug: "fall-golf-outing-2026", title: "Fall Golf Outing", date: "2026-09-19", start: "8:00 AM", end: "2:00 PM", location: "To be announced",
      summary: "A morning on the course raising money for student tool kits.",
      body: "Join Foundation friends for nine holes, lunch and a raffle. Every foursome sponsors starter tool kits for first-year students.",
      image: "/assets/img/auto.jpg", capacity: 72, rsvpOpen: false, published: true, sample: true },
    { id: "e2", slug: "donor-reception-2026", title: "Fall Donor Reception", date: "2026-11-05", start: "5:30 PM", end: "7:30 PM", location: "To be announced",
      summary: "An evening with students, instructors and the donors who back them.",
      body: "Meet the students your gifts support, see their work up close and hear what comes next for them. Light food is prepared and served by culinary students.",
      image: "/assets/img/catering.jpg", capacity: 120, rsvpOpen: true, published: true, sample: true },
    { id: "e3", slug: "tools-for-tomorrow-drive", title: "Tools for Tomorrow Drive", date: "2026-11-21", start: "9:00 AM", end: "1:00 PM", location: "To be announced",
      summary: "Drop off new or gently used tools for students who need them.",
      body: "Bring hand tools, safety gear or equipment in good working order. Volunteers sort everything into kits for students starting their programs.",
      image: "/assets/img/welder-shop.jpg", capacity: 0, rsvpOpen: true, published: true, sample: true },
    { id: "e4", slug: "scholarship-awards-night-2027", title: "Scholarship Awards Night", date: "2027-05-13", start: "6:00 PM", end: "8:00 PM", location: "To be announced",
      summary: "Celebrating the year's scholarship and grant recipients with their families.",
      body: "Recipients, families, donors and instructors come together to celebrate a year of hard work.",
      image: "/assets/img/graduates.jpg", capacity: 200, rsvpOpen: true, published: true, sample: true },
    { id: "e5", slug: "back-to-school-supply-drive-2026", title: "Back-to-School Supply Drive", date: "2026-08-15", start: "9:00 AM", end: "12:00 PM", location: "Lake County Tech Campus, 19525 W Washington St, Grayslake, IL 60030",
      summary: "Collecting uniforms, safety glasses and program supplies before the school year starts.",
      body: "Bring new supplies or give online. Volunteers sort everything into kits for first-year students.\n\n## Most needed\n- Safety glasses and gloves\n- Scrubs and chef coats\n- Basic hand tools",
      image: "/assets/img/welder-shop.jpg", capacity: 0, rsvpOpen: true, published: true, sample: true },
    { id: "e6", slug: "foundation-launch-celebration", title: "Foundation Launch Celebration", date: "2026-09-03", start: "5:30 PM", end: "7:30 PM", location: "Lake County Tech Campus, 19525 W Washington St, Grayslake, IL 60030",
      summary: "Celebrating the launch of the Lake County Tech Campus Foundation with students, staff and partners.",
      body: "An evening to mark the Foundation's first year, with student demonstrations across programs.",
      image: "/assets/img/graduates.jpg", capacity: 150, rsvpOpen: true, published: true, sample: true },
    { id: "e7", slug: "industry-partner-breakfast", title: "Industry Partner Breakfast", date: "2026-10-08", start: "7:30 AM", end: "9:00 AM", location: "Lake County Tech Campus, 19525 W Washington St, Grayslake, IL 60030",
      summary: "Business leaders meet program instructors over breakfast cooked by culinary students.",
      body: "Hear what employers need, see what students are learning, and find ways to partner.",
      image: "/assets/img/catering.jpg", capacity: 60, rsvpOpen: true, published: true, sample: true },
    { id: "e8", slug: "holiday-bake-sale", title: "Culinary Holiday Bake Sale", date: "2026-12-10", start: "3:00 PM", end: "6:00 PM", location: "Lake County Tech Campus, 19525 W Washington St, Grayslake, IL 60030",
      summary: "Pies, cookies and breads baked by culinary students. Proceeds go to student scholarships.",
      body: "Pre-orders open the week before. Everything is made by Culinary Arts students in the teaching kitchen.",
      image: "/assets/img/culinary.jpg", capacity: 0, rsvpOpen: true, published: true, sample: true },
    { id: "e9", slug: "salon-day-for-a-cause", title: "Salon Day for a Cause", date: "2026-12-17", start: "10:00 AM", end: "2:00 PM", location: "Lake County Tech Campus, 19525 W Washington St, Grayslake, IL 60030",
      summary: "Haircuts, styles and manicures from cosmetology and nail students, by donation.",
      body: "Book a time slot when you RSVP. Every donation goes to state board exam fees for students.",
      image: "/assets/img/salon.jpg", capacity: 80, rsvpOpen: true, published: true, sample: true },
    { id: "e10", slug: "cte-month-kickoff-2027", title: "CTE Month Kickoff", date: "2027-02-02", start: "5:00 PM", end: "7:00 PM", location: "Lake County Tech Campus, 19525 W Washington St, Grayslake, IL 60030",
      summary: "The start of the Foundation's inaugural CTE Month campaign.",
      body: "Students from every program show their work as we launch our February 2027 giving campaign.\n\n## What to expect\n- Live demonstrations\n- The giving tiers explained\n- Light food from culinary students",
      image: "/assets/img/sparks.jpg", capacity: 200, rsvpOpen: true, published: true, sample: true },
    { id: "e11", slug: "career-expo-2027", title: "Career Expo", date: "2027-02-18", start: "9:00 AM", end: "1:00 PM", location: "Lake County Tech Campus, 19525 W Washington St, Grayslake, IL 60030",
      summary: "Students meet employers, colleges and apprenticeship programs. Registration fees seed scholarships.",
      body: "Employers and schools set up tables across campus. 100% of registration fees go into the scholarship fund.",
      image: "/assets/img/mentoring.jpg", capacity: 400, rsvpOpen: true, published: true, sample: true },
    { id: "e12", slug: "skillsusa-send-off", title: "SkillsUSA Send-Off", date: "2027-03-04", start: "4:00 PM", end: "5:30 PM", location: "Lake County Tech Campus, 19525 W Washington St, Grayslake, IL 60030",
      summary: "Cheer on the students heading to state SkillsUSA competitions.",
      body: "Meet the competitors and help cover their entry and travel with a gift.",
      image: "/assets/img/welding.jpg", capacity: 0, rsvpOpen: true, published: true, sample: true },
    { id: "e14", slug: "cybersecurity-capture-the-flag", title: "Cybersecurity Capture the Flag", date: "2027-03-20", start: "9:00 AM", end: "3:00 PM", location: "Lake County Tech Campus, 19525 W Washington St, Grayslake, IL 60030",
      summary: "Student teams compete in a live ethical hacking challenge. Spectators welcome.",
      body: "Watch teams defend and attack practice networks in a safe lab environment.",
      image: "/assets/img/laptops.jpg", capacity: 50, rsvpOpen: true, published: true, sample: true },
    { id: "e15", slug: "spring-open-house-2027", title: "Spring Open House", date: "2027-04-08", start: "5:00 PM", end: "7:30 PM", location: "Lake County Tech Campus, 19525 W Washington St, Grayslake, IL 60030",
      summary: "Tour every program, meet instructors and see what next year's students will learn.",
      body: "Families, donors and partners are welcome. Each program runs hands-on stations.",
      image: "/assets/img/construction.jpg", capacity: 0, rsvpOpen: true, published: true, sample: true },
    { id: "e16", slug: "earth-day-garden-build", title: "Earth Day Garden Build", date: "2027-04-22", start: "9:00 AM", end: "12:00 PM", location: "Lake County Tech Campus, 19525 W Washington St, Grayslake, IL 60030",
      summary: "Construction students build raised garden beds for the preschool lab.",
      body: "Volunteers welcome. Bring gloves; tools and lumber are provided.",
      image: "/assets/img/construction.jpg", capacity: 40, rsvpOpen: true, published: true, sample: true },
    { id: "e18", slug: "senior-signing-day-2027", title: "Senior Signing Day", date: "2027-05-20", start: "3:30 PM", end: "5:00 PM", location: "Lake County Tech Campus, 19525 W Washington St, Grayslake, IL 60030",
      summary: "Seniors sign on with employers, apprenticeships and colleges.",
      body: "Celebrate students committing to their next step, with families and employers in the room.",
      image: "/assets/img/graduates.jpg", capacity: 250, rsvpOpen: true, published: true, sample: true },
    { id: "e19", slug: "summer-welding-camp-2027", title: "Summer Welding Camp", date: "2027-06-14", start: "9:00 AM", end: "3:00 PM", location: "Lake County Tech Campus, 19525 W Washington St, Grayslake, IL 60030",
      summary: "A week-long camp introducing middle schoolers to welding safely.",
      body: "Run by Tech Campus instructors and advanced students. Scholarships available.",
      image: "/assets/img/welder-shop.jpg", capacity: 24, rsvpOpen: true, published: true, sample: true },
    { id: "e20", slug: "golf-outing-2027", title: "Fall Golf Outing", date: "2027-09-18", start: "8:00 AM", end: "2:00 PM", location: "To be announced",
      summary: "A morning on the course raising money for student tool kits.",
      body: "Nine holes, lunch and a raffle. Every foursome sponsors starter tool kits.",
      image: "/assets/img/auto.jpg", capacity: 72, rsvpOpen: true, published: true, sample: true },
  ] as FoundationEvent[],

  rsvps: [
    { id: "r1", eventId: "e2", name: "Sample Guest", email: "guest@example.com", guests: 2, note: "", createdAt: at("2026-10-10"), sample: true },
  ] as Rsvp[],

  posts: [
    { id: "b1", slug: "golf-outing-recap-2026", title: "Golf Outing recap: tool kits on the way", date: "2026-09-24", author: "Foundation staff", eventId: "e1",
      excerpt: "A sample recap post. Replace it with the real story from your event.",
      body: "This is a sample blog post linked to the Fall Golf Outing event. Admins can write a post like this after any event from the dashboard.\n\n## What happened\nDescribe the day, who came and what was raised.\n\n## What it means for students\nTell readers how the money will be used.",
      image: "/assets/img/auto.jpg", published: true, sample: true },
    { id: "b9", slug: "golf-outing-photos-and-thanks", title: "Golf Outing: photos and thank-yous", date: "2026-09-22", author: "Foundation staff", eventId: "e1",
      excerpt: "A sample thank-you post for sponsors, golfers and volunteers. Swap in real photos from the day.",
      body: "This is a sample post linked to the Fall Golf Outing. Use a post like this to thank everyone who came out.\n\n## Thank you, sponsors\nList the hole sponsors and foursomes who made the day possible.\n\n## Thank you, volunteers\nName the people who ran check-in, the raffle and lunch.\n\n## See you next year\nShare the date for next year's outing once it is set.",
      image: "/assets/img/sparks.jpg", published: true, sample: true },
    { id: "b2", slug: "save-the-date-fall-donor-reception", title: "Save the date: Fall Donor Reception", date: "2026-10-14", author: "Foundation staff", eventId: "e2",
      excerpt: "Meet the students your gifts support, with food made and served by our culinary students.",
      body: "Our Fall Donor Reception is coming up, and we would love to see you there.\n\n## What to expect\n- Short talks from students and instructors\n- Student work on display from several programs\n- Light food prepared and served by culinary students\n\n## How to come\nRSVP from the event page so we can plan food and seating. Guests are welcome.",
      image: "/assets/img/catering.jpg", published: true, sample: true },
    { id: "b3", slug: "what-goes-in-a-starter-tool-kit", title: "What goes in a starter tool kit?", date: "2026-10-06", author: "Foundation staff", eventId: "e3",
      excerpt: "A look at the basic kit a first-year student needs, and how donated tools fill the gaps.",
      body: "Many programs ask students to bring their own basic tools. For some families that cost is the hardest part of getting started.\n\n## A typical kit\n- Safety glasses, gloves and hearing protection\n- A tape measure, square and utility knife\n- Program-specific hand tools chosen by instructors\n\n## How you can help\nBring new or gently used tools to the Tools for Tomorrow Drive, or give to the Tools & Equipment fund online.",
      image: "/assets/img/welder-shop.jpg", published: true, sample: true },
    { id: "b4", slug: "how-scholarships-are-chosen", title: "How our scholarships are chosen", date: "2026-09-30", author: "Foundation staff", eventId: "",
      excerpt: "A plain-language walk through the application, review and award process.",
      body: "Every year students apply for Foundation scholarships and grants. Here is how the process works.\n\n## Applying\nStudents fill out one online form. It asks about their program, their goals and what the money would cover.\n\n## Review\nA volunteer committee reads each application. Names are kept private from donors.\n\n## Awards\nRecipients are notified in the spring and celebrated at Scholarship Awards Night.",
      image: "/assets/img/graduates.jpg", published: true, sample: true },
    { id: "b5", slug: "a-day-in-the-simulation-lab", title: "A day in the simulation lab", date: "2026-09-12", author: "Foundation staff", eventId: "",
      excerpt: "Health careers students practice patient care long before they meet a real patient.",
      body: "This is a sample feature story. Replace it with a real student profile.\n\n## Practice first\nStudents rehearse taking vital signs, moving patients safely and working as a team, all in a lab built to feel like a real care setting.\n\n## Where donations help\nGifts to the Foundation help cover uniforms, exam fees and lab supplies.",
      image: "/assets/img/nurse-sim.jpg", published: true, sample: true },
    { id: "b6", slug: "alumni-spotlight-from-shop-to-apprenticeship", title: "Alumni spotlight: from the shop to an apprenticeship", date: "2026-08-28", author: "Foundation staff", eventId: "",
      excerpt: "A sample alumni story about turning a high school program into a career.",
      body: "This is a sample alumni spotlight. Swap in a real story from the Alumni page once graduates share theirs.\n\n## Getting started\nDescribe how the student found their program and what kept them going.\n\n## Where they are now\nShare their current job, apprenticeship or school, and what they would tell new students.",
      image: "/assets/img/welding.jpg", published: true, sample: true },
    { id: "b7", slug: "five-ways-to-support-students-this-year", title: "Five ways to support students this year", date: "2026-08-15", author: "Foundation staff", eventId: "",
      excerpt: "Giving money is one way. Here are four more.",
      body: "There are many ways to back career and technical students.\n\n## Ways to help\n- Give once or monthly to the fund you care about most\n- Donate tools or equipment at our drives\n- Volunteer at events\n- Mentor a student in your field\n- Tell a friend or employer about the Foundation",
      image: "/assets/img/mentoring.jpg", published: true, sample: true },
    { id: "b8", slug: "welcome-to-the-foundation-blog", title: "Welcome to the Foundation blog", date: "2026-08-01", author: "Foundation staff", eventId: "",
      excerpt: "News, event recaps and student stories, all in one place.",
      body: "Welcome to our new blog. This is where we will share what is happening at the Foundation.\n\n## What you will find here\n- Recaps after every Foundation event\n- Student and alumni stories\n- Updates on scholarships and yearly results\n\nSubscribe from the Events page to hear about new events first.",
      image: "/assets/img/laptops.jpg", published: true, sample: true },
  ] as Post[],

  subscribers: [
    { id: "s1", email: "subscriber@example.com", name: "", createdAt: at("2026-10-01"), sample: true },
  ] as Subscriber[],

  donations: [
    { id: "d1", receipt: "LCTC-SAMPLE1", name: "Sample Donor", email: "donor@example.com", amount: 100, freq: "once", fund: "Student Scholarships", card: "Visa ending 4242", createdAt: at("2026-10-02"), sample: true },
    { id: "d2", receipt: "LCTC-SAMPLE2", name: "Sample Monthly Donor", email: "monthly@example.com", amount: 25, freq: "monthly", fund: "Programmatic Innovation", card: "Mastercard ending 4444", createdAt: at("2026-10-08"), sample: true },
  ] as Donation[],

  applications: [] as StoredApplication[],

  messages: [
    { id: "m1", name: "Sample Visitor", email: "visitor@example.com", topic: "Volunteering", message: "This is a sample message so you can see how contact form submissions appear.", status: "New", createdAt: at("2026-10-12"), sample: true },
  ] as Message[],

  // From the Foundation's board photo (2026). Staff first, then volunteer board members A–Z.
  board: [
    { id: "bm-kapala", slug: "sebastian-kapala", name: "Dr. Sebastian Kapala", role: "LCTC Executive Director", bio: "Executive Director of Lake County Tech Campus.", company: "", linkedin: "", photo: "/assets/board/kapala.jpg", order: 1 },
    { id: "bm-hughes", slug: "joanne-hughes", name: "Joanne Hughes", role: "Chief Financial Officer / CSBO", bio: "Business manager and chief school business official for Lake County Tech Campus.", company: "", linkedin: "", photo: "/assets/board/hughes.jpg", order: 2 },
    { id: "bm-del-rio", slug: "elizabeth-del-rio", name: "Elizabeth Del Rio", role: "Foundation & Stakeholder Relations Officer", bio: "Oversees the Foundation and leads coordination with partners, stakeholders and community organizations.", company: "", linkedin: "", photo: "/assets/board/del-rio.jpg", order: 3 },
    { id: "bm-dickson", slug: "sue-dickson", name: "Sue Dickson", role: "Board Member", bio: "", company: "", linkedin: "", photo: "/assets/board/dickson.jpg", order: 4 },
    { id: "bm-doll", slug: "don-doll", name: "Don Doll", role: "Board Member", bio: "", company: "", linkedin: "", photo: "/assets/board/doll.jpg", order: 5 },
    { id: "bm-golwitzer", slug: "bettina-golwitzer", name: "Bettina Golwitzer", role: "Board Member", bio: "", company: "", linkedin: "", photo: "/assets/board/golwitzer.jpg", order: 6 },
    { id: "bm-harris", slug: "james-dean-harris", name: "James Dean Harris", role: "Board Member", bio: "", company: "", linkedin: "", photo: "/assets/board/harris.jpg", order: 7 },
    { id: "bm-kischer", slug: "leslie-kischer", name: "Leslie Kischer", role: "Board Member", bio: "", company: "", linkedin: "", photo: "/assets/board/kischer.jpg", order: 8 },
    { id: "bm-kleber", slug: "norm-kleber", name: "Norm Kleber", role: "Board Member", bio: "", company: "", linkedin: "", photo: "/assets/board/kleber.jpg", order: 9 },
    { id: "bm-maksimovic", slug: "dalibor-maksimovic", name: "Dalibor Maksimovic", role: "Board Member", bio: "", company: "", linkedin: "", photo: "/assets/board/maksimovic.jpg", order: 10 },
    { id: "bm-neal", slug: "tamika-neal", name: "Tamika Neal", role: "Board Member", bio: "", company: "", linkedin: "", photo: "/assets/board/neal.jpg", order: 11 },
    { id: "bm-obrien", slug: "john-obrien", name: "John O'Brien", role: "Board Member", bio: "", company: "", linkedin: "", photo: "/assets/board/obrien.jpg", order: 12 },
    { id: "bm-taques", slug: "carlos-taques", name: "Carlos Taques", role: "Board Member", bio: "", company: "", linkedin: "", photo: "/assets/board/taques.jpg", order: 13 },
    { id: "bm-torossy", slug: "vincent-torossy", name: "Vincent Torossy", role: "Board Member", bio: "", company: "", linkedin: "", photo: "/assets/board/torossy.jpg", order: 14 },
  ] as BoardMember[],

  alumni: [
    { id: "a1", name: "Sample Alum", email: "", program: "Welding", year: "2022", now: "Apprentice welder",
      story: "A sample alumni story. Approve real submissions from the dashboard and remove this one.", photo: "", published: true, createdAt: at("2026-09-01"), sample: true },
  ] as Alum[],

  reports: [
    { id: "y1", year: "2024–25", students: 90, scholarships: 30, granted: 42000, raised: 61000, donors: 150,
      highlights: ["Sample figures for layout only. Replace them in Admin → Yearly reports."], sample: true },
    { id: "y2", year: "2025–26", students: 120, scholarships: 45, granted: 60000, raised: 85000, donors: 210,
      highlights: ["Sample figures for layout only. Replace them in Admin → Yearly reports.", "Add one line per highlight of the year."], sample: true },
  ] as YearReport[],

  scholarships: [] as Scholarship[],



  // Demo accounts, one per access level. Every password is "demo1234" (stored as sha256 of "email:password", see lib/auth.ts).
  users: [
    { id: "u1", name: "Demo Super Admin", email: "superadmin@lctc.demo", role: "superadmin", pass: "fb8fc2271323717e40b956ef6bcbe4e2e1bc8b1b07757687cbb03cd14dac90e8", createdAt: at("2026-10-01") },
    { id: "u2", name: "Demo Admin", email: "admin@lctc.demo", role: "admin", pass: "6eaeb4adf28d5a21f820b760dff8687c339d880c64faef90caa0061b4bbc34b1", createdAt: at("2026-10-01") },
    { id: "u3", name: "Demo Accountant", email: "accountant@lctc.demo", role: "accountant", pass: "9ea7ac2a7ac686d6a37e1a12aa3066323af27c92c1c73f9f4dfdad83daef2857", createdAt: at("2026-10-01") },
    { id: "u4", name: "Demo Member", email: "member@lctc.demo", role: "user", pass: "64cdc28ed5c7d79d23191a7b0b091d1df4aa1bd154f9ffa588ad214e5d23141c", createdAt: at("2026-10-01") },
  ] as User[],
};

export type DB = typeof seed;
export type CollectionKey = Exclude<keyof DB, "settings">;
