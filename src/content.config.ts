import {defineCollection, z} from 'astro:content';
import { glob } from 'astro/loaders';


const projects = defineCollection({
    loader: glob({pattern: "**/*.md", base: "./src/content/projects"}),
    schema: z.object({
        title: z.string(),
        description: z.string(),
        slug: z.string(),
        sortOrder: z.number().optional(),
        learnings: z.array(z.string()).optional(),
        repos: z.array(z.object({
            label: z.string().optional(),
            url: z.string().url(),
        })).optional(),
    }) 
})

export const collections = { projects }
