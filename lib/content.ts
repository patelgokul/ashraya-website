export type Vertical = {
  letter: string;
  slug: string;
  name: string;
  tagline: string;
  icon: string;
  intro: string;
  activities: { title: string; text: string }[];
};

export const VERTICALS: Vertical[] = [
  {
    letter: "A",
    slug: "aarogya",
    name: "Aarogya",
    tagline: "Health, wellness & yoga for all",
    icon: "🧘‍♀️",
    intro: "Through Aarogya, we aim to provide a healthy body and a healthy mind to everyone.",
    activities: [
      { title: "Medical camps", text: "Health camps and lifestyle-awareness sessions across schools, colleges, and corporate houses." },
      { title: "Lifestyle training sessions", text: "Monthly seminars that educate and inspire people toward a healthy lifestyle." },
      { title: "Yoga retreats", text: "Yoga, mantra, and meditation sessions that help children and youth discover themselves." },
    ],
  },
  {
    letter: "S",
    slug: "shiksha",
    name: "Shiksha",
    tagline: "Value-based education for every child",
    icon: "📚",
    intro: "Let talent not remain hidden due to lack of financial support. We help talented students with their academics.",
    activities: [
      { title: "Scholarships", text: "Support for school fees (50-50 model), stationery, and books." },
      { title: "Quality education and training", text: "Helping talented students get quality education and essential training for a brighter future." },
      { title: "Fun activities", text: "Art, craft, and games that foster creativity, social engagement, and holistic development." },
    ],
  },
  {
    letter: "H",
    slug: "harit-prakriti",
    name: "Harit Prakriti evam Pashu Seva",
    tagline: "Environmental protection & compassion for animals",
    icon: "🌱",
    intro: "In ancient Indian scriptures, even plants and animals are counted as \"Praja\". With this vision, we protect nature and care for animals.",
    activities: [
      { title: "Plantation drives", text: "Regular plantation drives near our centres in different cities." },
      { title: "Fodder for goshalas", text: "Fodder for cows at goshalas in need in Varanasi, Prayagraj, and Gorakhpur." },
      { title: "Food and shelter for strays", text: "Shelter, food, and medical care for stray animals." },
      { title: "Awareness campaigns", text: "Research-backed videos, presentations, and literature on animal rights and cruelty." },
    ],
  },
  {
    letter: "R",
    slug: "rajarishi",
    name: "Rajarishi",
    tagline: "Empowered youth, empowered nation",
    icon: "🌟",
    intro: "Leadership means having the right combination of ability and attitude. We help youth bring out the leader within.",
    activities: [
      { title: "College outreach programs", text: "Connecting with students at IIM Bangalore, IIT (BHU), IIT Guwahati, IIT Kharagpur, MNNIT, IIIT Prayagraj, IIT (ISM) Dhanbad, BITS Pilani, and more." },
      { title: "Mega youth festivals", text: "Annual festivals with inspirational lectures and workshops by eminent personalities." },
      { title: "Artha forum", text: "Student–corporate interactions that inspire entrepreneurship in young minds." },
    ],
  },
  {
    letter: "A",
    slug: "nari-shakti",
    name: "Aatm-nirbhar Nari Shakti",
    tagline: "Self-reliant & empowered women",
    icon: "👩",
    intro: "Women are empowered through skill-based education and awareness of their safety, hygiene, and rights.",
    activities: [
      { title: "Stitching and livelihood centres", text: "Training in tailoring and handicrafts that creates sustainable income and financial independence." },
      { title: "Menstrual health awareness", text: "Breaking taboos so every girl has the knowledge and resources she needs." },
    ],
  },
  {
    letter: "Y",
    slug: "nasha-mukti",
    name: "Yatra Nasha Mukti Ki",
    tagline: "Journey towards freedom from addiction",
    icon: "🚭",
    intro: "Instilling the right values in children at the right time is the strongest step toward keeping them away from addiction.",
    activities: [
      { title: "Value education", text: "Yearly value contests drawing on wisdom from Indian epics and literature." },
      { title: "De-addiction campaigns", text: "Youth festivals and de-addiction camps that encourage an addiction-free life." },
      { title: "National recognition", text: "Invited by the Government of India to take part in the Nasha Mukta Yuva for Viksit Bharat Abhiyaan." },
    ],
  },
  {
    letter: "A",
    slug: "anna-aashirvad-seva",
    name: "Anna Seva, Aashirvad Seva",
    tagline: "Feeding the hungry & caring for the elderly",
    icon: "🍲",
    intro: "Food is a basic necessity for every individual, and every elder deserves dignity, love, and respect.",
    activities: [
      { title: "Regular food distribution", text: "Free, fresh meals throughout the day at our centres in Varanasi and Prayagraj." },
      { title: "Emergency food relief", text: "Food support for daily wage workers and the urban poor." },
      { title: "Aashirvad Seva", text: "Care for the elderly so they live with dignity, love, and respect." },
    ],
  },
];

export type Project = {
  slug: string;
  title: string;
  tagline: string;
  category: string;
  description: string;
  coverImage: string;
  highlights: string[];
  metrics: { label: string; value: string }[];
};

export const PROJECTS: Project[] = [
  {
    slug: "ashraya-paryavaran-sewa",
    title: "Ashraya Paryavaran Sewa",
    tagline: "Clean air, clean water, thriving green commons",
    category: "Environment",
    description:
      "Paryavaran Sewa brings communities together to protect the environment and care for animals. We run plantation drives near our centres, support goshalas with fodder, and care for stray animals, so that the generations to come inherit clean air, clean water, and thriving green commons.",
    coverImage: "/projects/hariyali.jpg",
    highlights: [
      "Plantation drives near Ashraya centres",
      "Fodder support for goshalas in Varanasi, Prayagraj, and Gorakhpur",
      "Food, shelter, and medical care for stray animals",
      "Awareness campaigns on animal rights",
    ],
    metrics: [
      { label: "Plants by 2030", value: "1,00,000+" },
      { label: "New goshalas by 2030", value: "10+" },
    ],
  },
  {
    slug: "ashraya-shiksha-sarthi",
    title: "Ashraya Shiksha Sarthi",
    tagline: "Opening doors to learning, dignity, and opportunity",
    category: "Education",
    description:
      "Shiksha Sarthi makes sure talent never stays hidden because of a lack of money. We support students with scholarships, books, and stationery, run libraries and learning centres, and add value education, art, craft, and games for holistic growth.",
    coverImage: "/projects/shanti-vidya-setu.jpg",
    highlights: [
      "Scholarships for school fees (50-50 model)",
      "Books and stationery for students",
      "Libraries and Ashraya learning centres",
      "Value education, art, craft, and games",
    ],
    metrics: [
      { label: "Children benefited", value: "5,000+" },
      { label: "Centres and libraries", value: "30+" },
    ],
  },
  {
    slug: "ashraya-udyam",
    title: "Ashraya Udyam",
    tagline: "Work-ready skills, life-ready confidence",
    category: "Skills & Livelihood",
    description:
      "Udyam equips women and youth with skills that lead to work and self-reliance. Our stitching and livelihood centres train women in tailoring and handicrafts, and our youth programs connect students with mentors and industry.",
    coverImage: "/projects/skill-shakti.jpg",
    highlights: [
      "Stitching and livelihood centres for women",
      "Tailoring and handicraft training",
      "Student–corporate interactions through the Artha forum",
      "College outreach and youth leadership",
    ],
    metrics: [
      { label: "Youths reached", value: "1,000+" },
      { label: "New livelihood centres by 2030", value: "10+" },
    ],
  },
];

export const getProject = (slug: string) => PROJECTS.find((p) => p.slug === slug);

export const IMPACT_STATS = [
  { icon: "📍", value: "27",        label: "Locations" },
  { icon: "🏙️", value: "18",        label: "Cities" },
  { icon: "🗺️", value: "13",        label: "States & UTs" },
  { icon: "🏠", value: "30+",       label: "Projects, centres & kitchens" },
  { icon: "📚", value: "5,000+",    label: "Children benefited" },
  { icon: "🌟", value: "1,000+",    label: "Youths touched" },
  { icon: "🏥", value: "100+",      label: "Health camps" },
  { icon: "🙋", value: "500+",      label: "Volunteers" },
  { icon: "🍲", value: "1,00,000+", label: "Meals served" },
  { icon: "🎓", value: "25+",       label: "College outreach programs" },
];

export const HERO_STATS = [
  { value: "5,000+",    label: "Children Benefited" },
  { value: "1,00,000+", label: "Meals Served" },
  { value: "500+",      label: "Volunteers" },
  { value: "13",        label: "States & UTs" },
];

export type TeamMember = {
  name: string;
  role: string;
  bio?: string;
};

// Add or edit members here. The /team page reads this list.
export const TEAM: TeamMember[] = [];

export const VISION_2030 = {
  headline: "Educate, empower, and provide healthcare and livelihood support to 1 million beneficiaries by 2030.",
  goals: [
    "50+ new Ashraya Centres across India",
    "10+ new livelihood centres",
    "1,00,000+ plants planted",
    "10+ new goshalas",
    "5+ new community kitchens",
  ],
};
