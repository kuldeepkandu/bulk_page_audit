const GuidePage = async ({ params }) => {
    const { slug } = await params;
    return (
        <div className="w-full min-h-screen">
            <div className="w-full">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Guide: {slug}</h1>
                <p className="text-gray-500 mb-6">This is the content for the guide with slug: {slug}.</p>
            </div>
        </div>
    ) 
}
export default GuidePage;