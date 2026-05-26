import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://quantumdecisions.ai";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/premium`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/auth/signin`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/auth/signup`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.7 },
  ];
}
