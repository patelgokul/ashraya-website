import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from Ashraya programs, events, and community work across India.",
};

const categories = ["All", "Education", "Environment", "Skills & Livelihood", "Community"];

// const placeholderImages = [
//   // { label: "Women's Training Batch 5",  category: "Women Empowerment", emoji: "👩‍💼" },
//   { label: "School Smart Classroom",      category: "Education",          emoji: "📱" },
//   // { label: "Tree Plantation Drive 2024",  category: "Environment",        emoji: "🌳" },
//   // { label: "Flood Relief Camp — Assam",   category: "Emergency Relief",   emoji: "🆘" },
//   // { label: "Youth Leadership Workshop",   category: "Events",             emoji: "⭐" },
//   // { label: "Graduation Ceremony 2024",    category: "Women Empowerment",  emoji: "🎓" },
//   { label: "Village Health Camp",         category: "Events",             emoji: "🏥" },
//   { label: "Digital Literacy Class",      category: "Education",          emoji: "💻" },
//   // { label: "Community Garden Project",    category: "Environment",        emoji: "🌱" },
//   // { label: "Annual Volunteer Summit",     category: "Events",             emoji: "🤝" },
//   { label: "Rural School Visit",          category: "Education",          emoji: "📚" },
//   // { label: "Relief Kit Distribution",     category: "Emergency Relief",   emoji: "📦" },
// ];

const placeholderImages = [
  { label: "Ashraya Shiksha Sarthi — Learning Centre", category: "Education",           emoji: "📚", image: "/projects/shanti-vidya-setu.jpg" },
  { label: "Ashraya Paryavaran Sewa — Plantation",     category: "Environment",         emoji: "🌳", image: "/projects/hariyali.jpg" },
  { label: "Ashraya Udyam — Skill Centre",             category: "Skills & Livelihood", emoji: "🧵", image: "/projects/skill-shakti.jpg" },
  { label: "Ashraya — Community Outreach",             category: "Community",           emoji: "🤝", image: "/projects/pragati-path.jpg" },
];

const COLORS = [
  "from-blue-100 to-blue-200",
  "from-blue-100 to-blue-200",
  "from-purple-100 to-purple-200",
  "from-amber-100 to-amber-200",
  "from-pink-100 to-pink-200",
  "from-teal-100 to-teal-200",
];

export default function GalleryPage() {
  return (
    <div>
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 py-16 px-4 text-center">
        <h1 className="font-display text-4xl font-bold text-white mb-3">Photo Gallery</h1>
        <p className="text-gray-300 max-w-xl mx-auto">Glimpses of our work across communities in India.</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button key={cat} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${cat === "All" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {placeholderImages.map((img, i) => (
            // <div key={img.label} className={`bg-gradient-to-br ${COLORS[i % COLORS.length]} rounded-2xl aspect-square flex flex-col items-center justify-center p-4 cursor-pointer hover:scale-105 transition-transform group`}>
            //   <div className="text-4xl mb-3">{img.emoji}</div>
            //   <div className="text-xs font-semibold text-gray-700 text-center leading-snug">{img.label}</div>
            //   <div className="text-xs text-gray-500 mt-1">{img.category}</div>
            // </div>
          
            <div key={img.label} className="relative rounded-2xl aspect-square overflow-hidden cursor-pointer hover:scale-105 transition-transform group">
  {img.image ? (
    <>
      <img
        src={img.image}
        alt={img.label}
        className="w-full h-full object-cover"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/20 transition-all" />
      {/* Label at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-slate-900/80 to-transparent">
        <div className="text-white text-xs font-semibold leading-snug">{img.label}</div>
        <div className="text-gray-300 text-xs mt-0.5">{img.category}</div>
      </div>
    </>
  ) : (
    <>
      <div className={`w-full h-full bg-gradient-to-br ${COLORS[i % COLORS.length]} flex flex-col items-center justify-center p-4`}>
        <div className="text-4xl mb-3">{img.emoji}</div>
        <div className="text-xs font-semibold text-gray-700 text-center leading-snug">{img.label}</div>
        <div className="text-xs text-gray-500 mt-1">{img.category}</div>
      </div>
    </>
  )}
</div>

          ))}
        </div>
        {/* <p className="text-center text-gray-400 text-sm mt-8">
          Full photo gallery with real images coming soon. Upload via the Admin panel.
        </p> */}
      </div>
    </div>
  );
}
