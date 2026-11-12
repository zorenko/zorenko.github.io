import Link from "next/link";
import { enter } from "@/lib/dom";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="q" id="q-main">
      <header className="q-phead" {...enter(1)}>
        <h1>Page not found</h1>
        <p className="q-plead">This page doesn’t exist, or it moved. <Link href="/">Go to the home page</Link>.</p>
      </header>
    </main>
  );
}
