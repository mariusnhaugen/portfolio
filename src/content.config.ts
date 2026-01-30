import {defineCollection, z} from 'astro:content';
import {glob,file} from 'astro/loaders';


const projects = defineCollection({
    loader: glob({pattern: "**/*.md", base: "./src/content/projects"}),
    schema: z.object({
        title: z.string(),
        description: z.string(),
        slug: z.string(),
        sortOrder: z.number().optional(),
    }) 
})

export const collections = { projects }
