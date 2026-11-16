import {
  businessPresentationSchema,
  type BusinessPhoto,
  validatePostPresentation,
} from "@/lib/business-media";
const stories = [
  "We help households plan reliable power around the appliances they actually use. Start with a home assessment, then explore a system sized for your daily routine. Our small workshop also handles inverter servicing and battery care.",
  "From a corner shop to a family home, a good backup system starts with listening. We design practical solar setups, explain the equipment and leave room for future battery upgrades. Browse recent installation projects and ask about maintenance.",
  "A repair-first energy workshop for the systems you already own. Bring us your inverter questions, battery concerns and maintenance plans. We work through diagnostics carefully and explain the available options before any repair is agreed.",
  "Lunch should be something to look forward to. Our kitchen prepares colourful rice bowls, familiar favourites and small-event menus in considered portions. Speak to us about dietary needs, collection times and catering quantities before ordering.",
  "Slow mornings, warm ovens and a counter full of small comforts. We bake bread in small batches and prepare pastry boxes and celebration cakes to order. For a special occasion, tell us your date and preferred flavours so we can plan together.",
  "A little room to slow down and care for your hair. We offer natural styling, braids and care sessions by appointment, with time to talk through your routine. Bring your ideas and we will help you choose a practical style for everyday life.",
  "A fresh start for the rooms you live in. Our home-care team plans cleaning around your space, from move-in preparation to fabric and upholstery care. Share the room count and any delicate surfaces so the scope is clear before a visit.",
  "Everyday pieces with thoughtful details and room to move. Our atelier makes linen separates and offers careful alterations, from a better hem to a new fit. We take measurements by appointment and discuss fabric, finish and timing together.",
  "Small groups, patient explanations and space to ask another question. We support reading and maths after school, alongside creative weekend workshops. Families can talk to us about learning goals, session formats and the right starting point.",
  "Useful little tools for people making things. Explore compact lighting, phone stands and creator accessories for your workspace or small business. We can help compare sizes, mounting options and what is included before you choose a kit.",
];
const secondServices = [
  "Inverter care visit",
  "Battery upgrade planning",
  "Power-system design",
  "Small-event catering",
  "Celebration cake consultation",
  "Braiding appointment",
  "Upholstery care",
  "Clothing alterations",
  "After-school reading club",
  "Creator desk accessories",
];
const photoDescriptions = [
  [
    "Rooftop solar panels among palms",
    "Wall-mounted inverter and battery installation",
    "Solar panel maintenance close-up",
  ],
  [
    "Solar installation on a tropical building",
    "Compact backup power unit in the workshop",
    "Solar cells in warm sunlight",
    "Completed rooftop array",
    "Backup system installation detail",
    "Photovoltaic panels at sunset",
  ],
  [
    "Organised inverter diagnostic workshop",
    "Hands testing inverter electronics",
    "Solar panels on a bungalow",
  ],
  [
    "Jollof rice lunch bowl",
    "Preparing takeaway lunch bowls",
    "Warm open kitchen with herbs",
  ],
  [
    "Freshly baked artisan bread",
    "Assorted pastry box",
    "Bakery counter and bread shelves",
  ],
  [
    "Natural-hair studio interior",
    "Natural hair braiding detail",
    "Hair-care products and towels",
  ],
  [
    "Freshly cleaned sunlit living room",
    "Home-cleaning kit and cloths",
    "Careful upholstery cleaning",
  ],
  [
    "Linen clothing in the atelier",
    "Sewing a linen garment",
    "Textured fabrics and tailoring tools",
  ],
  [
    "Warm reading classroom",
    "Creative workshop materials",
    "Children’s reading nook",
    "Hands working on paper crafts",
    "Colourful classroom craft supplies",
    "Open books in a reading corner",
  ],
  [
    "Ring light and phone stand on a creator desk",
    "Compact creator accessories",
    "Lighting display in the shop",
  ],
];
export function fixturePresentation(
  slug: string,
  name: string,
  neighbourhood: string,
  title: string,
  price: number | null,
  index: number,
) {
  const photos: BusinessPhoto[] = photoDescriptions[index].map((alt, i) => ({
    src: `/demo-businesses/${slug}/photo-${i + 1}.webp`,
    alt,
  }));
  return businessPresentationSchema.parse({
    logo: `/demo-businesses/${slug}/logo.svg`,
    cover: photos[0],
    gallery: photos,
    about: stories[index],
    address: `${12 + index * 3} Garden Lane, ${neighbourhood}, Uyo, Akwa Ibom`,
    hours: [
      {
        days: "Monday–Friday",
        opens: index === 3 ? "10:00" : "08:30",
        closes: index === 3 ? "18:00" : "17:30",
      },
      {
        days: "Saturday",
        opens: "09:00",
        closes: index === 4 ? "16:00" : "14:00",
      },
    ],
    phone:
      index === 2 || index === 8 ? null : `+234 (demo) 80${index} XXX XXXX`,
    website: `https://${slug}.example`,
    email: `hello@${slug}.example`,
    socials: [{ label: "Instagram", url: `https://social.example/${slug}` }],
    services: [
      {
        title,
        description: stories[index].split(". ")[0] + ".",
        priceNaira: price,
        image: photos[1],
      },
      {
        title: secondServices[index],
        description:
          "Tell us what you have in mind and we will discuss the scope, timing and available options.",
        priceNaira: null,
        image: photos[2],
      },
    ],
  });
}
export function fixturePostPresentation(
  type: Parameters<typeof validatePostPresentation>[0],
  gallery: BusinessPhoto[],
  index: number,
) {
  const count =
    type === "event" || (type === "portfolio" && index === 1)
      ? 5
      : type === "update"
        ? 2
        : 1 + (index % 3);
  return validatePostPresentation(type, {
    media: gallery.slice(0, count),
    eventAt: type === "event" ? "2026-12-05T09:00:00Z" : null,
  });
}
