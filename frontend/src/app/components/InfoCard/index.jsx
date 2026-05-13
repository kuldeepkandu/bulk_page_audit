import Link from "next/link";

const InfoCard = ({ title, description, slug }) => {
    return (
        <div className="border border-gray-200 hover:border-teal-400 rounded-lg px-4 py-2 hover:shadow-lg transition cursor-pointer h-full">
            <Link href={slug} className="">
            <h2 className="text-xl font-semibold text-gray-800 mb-2 text-base">{title}</h2>
            <p className="text-gray-500 mb-4 text-base">{description}</p>
            </Link>
        </div>
    )
}
export default InfoCard;