const PriceCard = ({ title, subtitle, price, features, cta, popular }) => {
  return (
    <div
      className={`relative rounded-2xl p-[1px]
      bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500
      transition-all duration-300 hover:-translate-y-1`}
    >
      <div className="bg-white rounded-2xl p-6 h-full shadow-lg hover:shadow-xl">
        {popular && (
          <span className="absolute -top-3 right-6 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Most Popular
          </span>
        )}

        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            {title}
          </h3>
          <p className="text-sm text-gray-500">
            {subtitle}
          </p>
        </div>

        <div className="mb-6">
          <span className="text-4xl font-bold text-gray-900">
            {price}
          </span>
          <span className="text-gray-500 text-sm ml-1">/month</span>
        </div>

        <ul className="mb-8 space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex gap-3 text-gray-600 text-sm">
              <span className="text-teal-600 font-bold">✓</span>
              {feature}
            </li>
          ))}
        </ul>

        <button className="w-full py-3 rounded-xl font-semibold text-white
          bg-gradient-to-r from-teal-500 to-emerald-500
          hover:from-teal-600 hover:to-emerald-600 transition-all">
          {cta}
        </button>
      </div>
    </div>
  );
};

export default PriceCard;
