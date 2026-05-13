import Link from "next/link";

const BlogCard = ({ title, description, slug, date, readTime, tags = [] }) => {
    return (
        <Link
            href={slug}
            className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer h-full"
        >
            <div className="p-4 flex flex-col h-full">
                <div className="flex gap-2 mb-2">
                    {tags.map((tag, i) => (
                        <span
                            key={i}
                            className="bg-teal-50 text-teal-700 text-xs font-semibold px-2 py-0.5 rounded-full"
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-teal-700 transition">{title}</h2>

                <p className="text-gray-600 text-base flex-grow">{description}</p>

                <div className="mt-4 text-gray-400 text-sm flex items-center gap-2">
                    <span>{date}</span>
                    <span aria-hidden="true">•</span>
                    <span>{readTime} read</span>
                </div>
            </div>
        </Link>
    );
};

export default BlogCard;
