import type { APIRoute } from 'astro';
import { llmsFullTxt } from '@/site/llms';

export const GET: APIRoute = () => new Response(llmsFullTxt(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
