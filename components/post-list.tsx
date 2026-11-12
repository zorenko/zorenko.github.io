import Link from "next/link";
import type { Post } from "@/content/posts";
import { cssVars } from "@/lib/dom";
import { formatDate } from "@/lib/site";

/** Posts, newest first, each fading in a beat after the one above */
export function PostList({ posts }: { posts: Post[] }) {
  return (
    <ul className="q-list q-posts" role="list">
      {posts.map((p, k) => (
        <li key={p.slug} style={cssVars({ "--k": k })}>
          <Link className="q-row q-post" href={`/blog/${p.slug}/`}>
            <span className="q-post__title">{p.title}</span>
            <time className="q-meta" dateTime={p.date}>{formatDate(p.date)}</time>
          </Link>
        </li>
      ))}
    </ul>
  );
}
