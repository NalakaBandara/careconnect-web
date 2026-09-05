"use client"
import { useState } from "react"
import Link from "next/link";

export default function MobileNav (){
    const [open, setOpen] = useState(false);
    return (
      <div>
        <button onClick={() => setOpen(!open)}>Menu</button>

        {open && (
          <div className="flex flex-col gap-2">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
          </div>
        )}
      </div>   
    );
}