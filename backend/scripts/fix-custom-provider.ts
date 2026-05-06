import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.template.findMany();
  let fixed = 0;

  for (const template of templates) {
    const settings = JSON.parse(template.settings);
    if (settings.provider === 'custom') {
      settings.provider = 'openai';
      settings.model = 'gpt-4';
      await prisma.template.update({
        where: { id: template.id },
        data: { settings: JSON.stringify(settings) },
      });
      console.log(`Fixed template: ${template.id} (${template.name})`);
      fixed++;
    }
  }

  console.log(`Done. Fixed ${fixed} template(s).`);
}

main().finally(() => prisma.$disconnect());
