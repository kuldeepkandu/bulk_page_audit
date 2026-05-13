const ExploreMore = ({title, description}) => {
    return (
        <div className="w-full mt-4">
            <div className="group border rounded-xl border-gray-200 p-6 hover:border-teal-600 transition cursor-pointer h-full">
                <h2 className="text-xl font-bold text-gray-800 group-hover:text-teal-600">{title}</h2>
                <p className="text-gray-600 mt-2 text-base">{description}</p>
            </div>
        </div>
    )
}
export default ExploreMore;