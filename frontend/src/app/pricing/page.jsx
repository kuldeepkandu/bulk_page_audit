import PriceCard from "../components/priceCard";

const price = [
    {
        title: "Starter",
        subtitle: "Perfect for individuals",
        price: "$0",
        features: [
            "Up to 5 projects",
            "Basic analytics",
            "Email support"
        ],
        cta: "Get Started"
    },
    {
        title: "Professional",
        subtitle: "Ideal for growing teams",
        price: "$29",
        features: [
            "Up to 20 projects",
            "Advanced analytics",
            "Priority support",
            "Custom domains"
        ],
        cta: "Upgrade Now"
    },
    {
        title: "Enterprise",
        subtitle: "For large organizations",
        price: "$99",
        features: [
            "Unlimited projects",
            "Premium analytics",
            "24/7 dedicated support",
            "Custom domains",
            "API access"
        ],
        cta: "Contact Sales"
    }
]

const pricing = () => {
    return (
        <div className="w-full min-h-screen">
            <div className="w-full text-center flex flex-col items-center justify-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center">Simple, Transparent Pricing</h1>
                <p className="text-gray-500 mb-6 text-xl text-center max-w-2xl">Start free, upgrade when you need more power. No hidden fees.</p>
            </div>
            <div className="max-w-7xl mx-auto px-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {price.map((plan, index) => (
                        <PriceCard
                            key={index}
                            title={plan.title}
                            subtitle={plan.subtitle}
                            price={plan.price}
                            features={plan.features}
                            cta={plan.cta}
                            popular={plan.title === "Professional"}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
export default pricing;