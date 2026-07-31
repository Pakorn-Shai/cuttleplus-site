import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg(process.env.DATABASE_URL ?? "");
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create categories with subcategories
  const categories = [
    {
      name: "Technology",
      slug: "technology",
      subcategories: [
        { name: "Web Development", slug: "web-development" },
        { name: "Mobile Development", slug: "mobile-development" },
        { name: "AI & Machine Learning", slug: "ai-machine-learning" },
        { name: "DevOps", slug: "devops" },
      ],
    },
    {
      name: "Business",
      slug: "business",
      subcategories: [
        { name: "Startups", slug: "startups" },
        { name: "Marketing", slug: "marketing" },
        { name: "Finance", slug: "finance" },
      ],
    },
    {
      name: "Design",
      slug: "design",
      subcategories: [
        { name: "UI/UX", slug: "ui-ux" },
        { name: "Graphic Design", slug: "graphic-design" },
        { name: "Web Design", slug: "web-design" },
      ],
    },
    {
      name: "Tutorial",
      slug: "tutorial",
      subcategories: [
        { name: "Beginner", slug: "beginner" },
        { name: "Intermediate", slug: "intermediate" },
        { name: "Advanced", slug: "advanced" },
      ],
    },
  ];

  for (const category of categories) {
    const { subcategories, ...categoryData } = category;
    
    // Find or create the category
    const existingCategory = await prisma.category.findUnique({
      where: { slug: categoryData.slug },
    });

    if (existingCategory) {
      // Update: connect or create subcategories
      for (const sub of subcategories) {
        await prisma.subcategory.upsert({
          where: {
            categoryId_slug: {
              categoryId: existingCategory.id,
              slug: sub.slug,
            },
          },
          create: {
            name: sub.name,
            slug: sub.slug,
            categoryId: existingCategory.id,
          },
          update: {},
        });
      }
    } else {
      // Create category with subcategories
      await prisma.category.create({
        data: {
          ...categoryData,
          subcategories: {
            create: subcategories,
          },
        },
      });
    }
  }

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
