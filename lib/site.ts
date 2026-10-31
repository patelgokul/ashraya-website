const env = (value: string | undefined, fallback: string) => value?.trim() || fallback;

const phone = env(process.env.NEXT_PUBLIC_CONTACT_PHONE, "9174040648").replace(/\D/g, "").slice(-10);

export const SITE = {
  name:       env(process.env.NEXT_PUBLIC_ORG_NAME, "Ashraya"),
  legalName:  env(process.env.NEXT_PUBLIC_ORG_LEGAL_NAME, "Ashraya Vikas Association"),
  tagline:    "Care. Connect. Change.",
  motto:      "Social Uplifting and Empowering Centre to Create Impact",
  description:
    "Ashraya runs health, education, environment, youth, women empowerment, de-addiction, and food & elder-care initiatives across India.",
  url:        env(process.env.NEXT_PUBLIC_SITE_URL, "https://ashrayaconnect.org").replace(/\/$/, ""),
  logo:       "/icons/ashraya-logo.png",
  icon:       "/icons/ashraya-icon.png",
  contact: {
    email:        env(process.env.NEXT_PUBLIC_CONTACT_EMAIL, "office@ashrayavikas.in"),
    phone,
    phoneDisplay: `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`,
    phoneHref:    `tel:+91${phone}`,
    address:      env(process.env.NEXT_PUBLIC_CONTACT_ADDRESS, "Bengaluru, Karnataka, India"),
    hours:        env(process.env.NEXT_PUBLIC_CONTACT_HOURS, "Mon–Sat: 9 AM – 6 PM IST"),
  },
  social: {
    facebook:  env(process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK, "https://facebook.com/ashrayaconnect"),
    instagram: env(process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM, "https://instagram.com/ashrayaconnect"),
    twitter:   env(process.env.NEXT_PUBLIC_SOCIAL_TWITTER, "https://x.com/ashrayaconnect"),
    linkedin:  env(process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN, "https://linkedin.com/company/ashrayaconnect"),
    youtube:   env(process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE, "https://youtube.com/@ashrayaconnect"),
  },
  bank: {
    accountName: env(process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME, "Ashraya Vikas Association"),
    accountNo:   env(process.env.NEXT_PUBLIC_BANK_ACCOUNT_NO, "50200115627320"),
    ifsc:        env(process.env.NEXT_PUBLIC_BANK_IFSC, "HDFC0000983"),
    bankName:    env(process.env.NEXT_PUBLIC_BANK_NAME, "HDFC Bank"),
    branch:      env(process.env.NEXT_PUBLIC_BANK_BRANCH, "Vaddarapalya, Bengaluru"),
  },
};
