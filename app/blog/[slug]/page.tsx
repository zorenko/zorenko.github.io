import Link from "next/link";
import { notFound } from "next/navigation";
import { isStackVersion, posts } from "@/content/posts";
import { enter } from "@/lib/dom";
import { SHOW } from "@/lib/flags";
import { formatDate, pageMeta } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => posts.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  return post ? pageMeta(post.title, post.description ?? post.title) : {};
}

export default async function BlogPost({ params }: Props) {
  if (!SHOW.writing) notFound(); // switched off in lib/flags.ts
  const { slug } = await params;
  const k = posts.findIndex((p) => p.slug === slug);
  if (k < 0) notFound();
  const post = posts[k];
  const older = posts[k + 1];
  const { default: Body } = await import(`@/content/blog/${slug}.mdx`);
  const date = <time dateTime={post.date}>{formatDate(post.date)}</time>;

  return (
    <main className="q" id="q-main">
      <article>
        <header className="q-phead" {...enter(1)}>
          <h1>{post.title}</h1>
          {isStackVersion(post) ? <p>{date} · <Link href="/how-i-work/">How I work</Link></p> : date}
        </header>
        <div className="q-pbody" {...enter(2)}><Body /></div>
      </article>
      <nav className="q-pnav" {...enter(2)} aria-label="More posts">
        <Link href="/blog/">All posts</Link>
        {older ? <Link href={`/blog/${older.slug}/`}>Older: {older.title} →</Link> : <span />}
      </nav>
    </main>
  );
}
