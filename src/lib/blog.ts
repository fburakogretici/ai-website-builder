import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const postsDirectory = path.join(process.cwd(), 'content/blog');

export interface BlogPost {
    slug: string;
    title: string;
    description: string;
    date: string;
    author: string;
    image?: string;
    tags?: string[];
    content: string;
    readingTime: string;
}

export interface BlogPostMetadata {
    slug: string;
    title: string;
    description: string;
    date: string;
    author: string;
    image?: string;
    tags?: string[];
    readingTime: string;
}

export function getAllPosts(): BlogPostMetadata[] {
    // Create directory if it doesn't exist
    if (!fs.existsSync(postsDirectory)) {
        return [];
    }

    const fileNames = fs.readdirSync(postsDirectory);
    const allPostsData = fileNames
        .filter((fileName) => fileName.endsWith('.mdx'))
        .map((fileName) => {
            const slug = fileName.replace(/\.mdx$/, '');
            const fullPath = path.join(postsDirectory, fileName);
            const fileContents = fs.readFileSync(fullPath, 'utf8');
            const { data, content } = matter(fileContents);
            const stats = readingTime(content);

            return {
                slug,
                title: data.title,
                description: data.description,
                date: data.date,
                author: data.author || 'NoCodePage',
                image: data.image,
                tags: data.tags || [],
                readingTime: stats.text,
            };
        });

    // Sort posts by date
    return allPostsData.sort((a, b) => {
        if (a.date < b.date) {
            return 1;
        } else {
            return -1;
        }
    });
}

export function getPostBySlug(slug: string): BlogPost | null {
    try {
        const fullPath = path.join(postsDirectory, `${slug}.mdx`);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);
        const stats = readingTime(content);

        return {
            slug,
            title: data.title,
            description: data.description,
            date: data.date,
            author: data.author || 'NoCodePage',
            image: data.image,
            tags: data.tags || [],
            content,
            readingTime: stats.text,
        };
    } catch (error) {
        console.error(`Error reading post ${slug}:`, error);
        return null;
    }
}

export function getAllPostSlugs(): string[] {
    if (!fs.existsSync(postsDirectory)) {
        return [];
    }

    const fileNames = fs.readdirSync(postsDirectory);
    return fileNames
        .filter((fileName) => fileName.endsWith('.mdx'))
        .map((fileName) => fileName.replace(/\.mdx$/, ''));
}
