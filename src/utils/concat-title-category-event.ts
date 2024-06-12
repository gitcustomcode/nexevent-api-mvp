export function concatTitleAndCategoryEvent(
  title: string,
  category: string,
): string {
  return `${title}.${category}`;
}

/*

//alterar schema da tabela event no prisma para adicionar o campo concatenado do titulo e categoria

model Event {
  //...
  concatenatedTitleAndCategory: String
}


//criar metodo na criacao do evento para pegar o nome e a categoria e chamar esse metodo de concatenacao e setar no campo da tabela event

async createEvent(data: CreateEventInput): Promise<Event> {
  const event = await prisma.event.create({
    data: {
     ...data,
      concatenatedTitleAndCategory: concatTitleAndCategoryEvent(
        data.title,
        data.category,
      ),
    },
  });

  return event;
}

//criar metodo de consulta no campo concatenatedTitleAndCategory que contenha o que o usuario digitou, podendo ser tanto o titulo ou a category

const events = await prisma.event.findMany({
  where: {
      concatenatedTitleAndCategory: { contains: textSearch, mode: 'insensitive' }
    },

*/
