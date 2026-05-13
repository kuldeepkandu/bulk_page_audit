const TitleDescription = ({ title, description }) => {
    return (
        <div className="mb-6 px-4 py-3">
            <h1 className="md:text-4xl text-2xl font-bold text-gray-800">{title}</h1>
            <p className="text-gray-500 mt-4 md:text-xl text-base md:w-2xl w-full">{description}</p>
        </div>
    )
}
export default TitleDescription;