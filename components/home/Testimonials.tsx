"use client";
import { motion } from "framer-motion";

const testimonials = [
  {
    text: "The skill development program completely transformed my life. I now run my own tailoring business and support my family independently. Ashraya gave me wings.",
    name: "Priya Raghunathan",
    role: "Beneficiary, Women's Skill Program",
    initials: "PR",
    color: "bg-blue-600",
    stars: 5,
  },
  {
    text: "As a donor, I can see exactly where my money goes. The impact reports are transparent and the team is incredibly dedicated to real change on the ground.",
    name: "Arjun Krishnamurthy",
    role: "Monthly Donor, Bengaluru",
    initials: "AK",
    color: "bg-blue-600",
    stars: 5,
  },
  {
    text: "Volunteering with Ashraya has been the most meaningful experience of my career. The team is passionate and the communities welcome us with open arms.",
    name: "Sneha Mehta",
    role: "Volunteer, Education Program",
    initials: "SM",
    color: "bg-purple-600",
    stars: 5,
  },
  {
    text: "I sponsored the Rural Education Initiative and visited the schools last month. The change is real — kids are learning with tablets and trained teachers. Incredible.",
    name: "Rajesh Sharma",
    role: "Corporate Donor, Delhi",
    initials: "RS",
    color: "bg-amber-600",
    stars: 5,
  },
  {
    text: "Ashraya planted 200 trees in our village as part of the Green Drive. Our water table improved within a year. This is what real environmental work looks like.",
    name: "Lalitha Devi",
    role: "Community Member, Jharkhand",
    initials: "LD",
    color: "bg-teal-600",
    stars: 5,
  },
  {
    text: "The emergency relief during last year\'s floods was lightning-fast. Food kits, medicines, tarpaulins — they were there in 48 hours. Ashraya saved us.",
    name: "Mohammed Rafiq",
    role: "Flood Relief Beneficiary, Assam",
    initials: "MR",
    color: "bg-red-600",
    stars: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md mb-4">
            Testimonials
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Voices from the Field
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Real stories from donors, volunteers, and beneficiaries who are part of our journey.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-amber-400 text-sm mb-3 tracking-widest">
                {"★".repeat(t.stars)}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${t.color} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {t.initials}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
