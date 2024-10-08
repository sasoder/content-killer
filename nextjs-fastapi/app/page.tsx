import Link from "next/link";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { ModeToggle } from "@/components/mode-toggle";
export default function Home() {
  return (
    <main className="flex h-screen items-center justify-center">
      <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
        <Icons.bot className="h-16 w-16" />

        <div className="flex gap-2">
          <Link href="/generate" className={cn(buttonVariants({ size: "default" }))}>
            Generate Content
          </Link>
          <ModeToggle />
        </div>
      </div>
    </main>
  );
}
