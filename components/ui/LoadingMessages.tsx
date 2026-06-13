"use client";
import { useState, useEffect } from "react";

export function LoadingMessages({ messages }: { messages: string[] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % messages.length), 2200);
    return () => clearInterval(t);
  }, [messages.length]);
  return (
    <span className="transition-opacity duration-500">{messages[idx]}</span>
  );
}
