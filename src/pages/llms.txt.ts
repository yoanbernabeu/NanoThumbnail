import type { APIRoute } from 'astro';
import { llmsTxt } from '@/site/llms';

export const GET: APIRoute = () => new Response(llmsTxt(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
