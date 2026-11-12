import { PostList } from "@/components/post-list";
import { posts } from "@/content/posts";
import { enter } from "@/lib/dom";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta("Writing", "Notes from Anastasia Zorenko on designing and building software.");

export default function Blog() {
  return (
    <main className="q" id="q-main">
      <header className="q-phead" {...enter(1)}>
        <h1>Writing</h1>
        <p className="q-plead">Notes on designing and building software that makes complex work feel calm.</p>
      </header>
      <section className="q-sec" {...enter(2)} aria-label="All posts">
        <PostList posts={posts} />
      </section>
    </main>
  );
}
