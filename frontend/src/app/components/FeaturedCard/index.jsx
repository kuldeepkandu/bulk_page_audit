import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";


const FeaturedCard = ({ title, description, slug }) => {
    return (
        <div>
            <Link
                href={slug}
            >
                <div className="group border border-gray-200 hover:border-teal-400 rounded-lg p-6 hover:shadow-lg transition cursor-pointer h-full">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-teal-600">{title}</h2>
                    <p className="text-gray-500 mb-4">{description}</p>
                    <p

                        className="text-teal-600 text-sm font-semibold flex items-center gap-1"
                    >Read More
                        <span className="inline-block transform transition-transform duration-300 group-hover:translate-x-1 mt-1"><FaArrowRight /></span>
                    </p>
                </div>
            </Link>
        </div>
    )
}
export default FeaturedCard;