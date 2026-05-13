import BlogCard from "../components/BlogCard";

const BlogPosts = [
  {
    title: "What Is a Good SEO Score? Understanding Your Audit Results",
    description:
      "Confused by your SEO score? Learn what constitutes a good SEO score in Lighthouse, how to interpret different scoring ranges, and what actually matters for your rankings.",
    slug: "/blog/good-seo-score",
    date: "2026-02-04",
    readTime: "12 min",
    tags: ["SEO Score", "SEO", "Lighthouse"],
  },
  {
    title: "Improving Website Performance with Core Web Vitals",
    description:
      "Discover how to use Core Web Vitals to enhance your website’s user experience and SEO rankings effectively.",
    slug: "/blog/core-web-vitals-performance",
    date: "2026-01-28",
    readTime: "10 min",
    tags: ["Core Web Vitals", "Performance", "SEO"],
  },
  {
    title: "Step-by-Step Guide to SEO Audits",
    description:
      "A comprehensive walkthrough on conducting SEO audits to find and fix issues that could be hurting your site’s search engine ranking.",
    slug: "/blog/seo-audit-guide",
    date: "2026-01-15",
    readTime: "15 min",
    tags: ["SEO Audit", "SEO", "Optimization"],
  },
  {
    title: "How Lighthouse Can Help Optimize Your Website",
    description:
      "Learn how to use Google Lighthouse to analyze your website and improve performance, accessibility, and SEO.",
    slug: "/blog/lighthouse-optimization",
    date: "2026-01-10",
    readTime: "8 min",
    tags: ["Lighthouse", "Performance", "SEO"],
  },
];


const Blog = () => {
    return (
        <div className="w-full min-h-screen">
            <div className="w-full text-center flex flex-col items-center justify-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center">Blog</h1>
                <p className="text-gray-500 mb-6 text-center max-w-2xl">Insights on web performance, Lighthouse audits, Core Web Vitals, and SEO optimization.</p>
            </div>

            <div className="">
                {BlogPosts.map((post, index) => (
                    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6 md:px-20 lg:px-30 sm:px-10 mt-4" key={index}>
                    <BlogCard
                        key={index}
                        title={post.title}
                        description={post.description}
                        slug={post.slug}
                        date={post.date}
                        readTime={post.readTime}
                        tags={post.tags}
                    />
                    </div>
                ))}
            </div>

        </div>
    )
}
export default Blog;