"use client";

import { useState } from "react";
import { useResultsStore } from "../../store/resultsStore";
import Link from "next/link";
import { IoIosArrowForward } from "react-icons/io";
import { IoIosArrowDown } from "react-icons/io";
import Loader from "../components/Loader";
// import TubeLoader from "../components/TubeLoader.jsx";


const ResultsPage = () => {

    const [showAccordian, setShowAccordian] = useState({});

    const { results } = useResultsStore();

    if (!results.length) {
        return <div className="p-4">
            <Loader />
            {/* <TubeLoader /> */}
        </div>;
    }

    const getScoreColor = (value) => {
        if (value == null || value === "-")
            return "text-gray-500";
        if (value < 50)
            return "text-red-500 font-semibold";
        if (value < 90)
            return "text-orange-500 font-semibold";
        return "text-green-500 font-semibold"
    };

    const getCWVColor = (metric, value) => {
        if (value == null || value === "-") return "text-gray-500";

        const v = parseFloat(value);

        if (metric === "LCP") {
            if (v <= 2.5) return "text-green-600 font-semibold";
            if (v <= 4.0) return "text-orange-500 font-semibold";
            return "text-red-500 font-semibold";
        }

        if (metric === "INP") {
            if (v <= 200) return "text-green-600 font-semibold";
            if (v <= 500) return "text-orange-500 font-semibold";
            return "text-red-500 font-semibold";
        }

        if (metric === "CLS") {
            if (v <= 0.1) return "text-green-600 font-semibold";
            if (v <= 0.25) return "text-orange-500 font-semibold";
            return "text-red-500 font-semibold";
        }

        if (metric === "FCP") {
            if (v <= 1800) return "text-green-600 font-semibold";
            if (v <= 3000) return "text-orange-500 font-semibold";
            return "text-red-500 font-semibold";
        }

        if (metric === "TBT") {
            if (v <= 200) return "text-green-600 font-semibold";
            if (v <= 600) return "text-orange-500 font-semibold";
            return "text-red-500 font-semibold";
        }

        return "text-gray-500";

    }

    const handleOpenAccordian = (index) => {
        setShowAccordian(prev => ({
            ...prev,
            [index]: !prev[index],
        }));
    }

    return (
        <div className="p-6 space-y-6">
            {results.map((item, index) => {
                // const issues = getSignificantIssues(item.fullJson, 5);
                return (
                    <div key={item.url} className="border border-gray-200 rounded-2xl p-4">
                        <Link
                            href={item.url}
                            className="hover:underline text-teal-600"
                            target="_blank"
                        >
                            {item.url}
                        </Link>

                        <div className="overflow-x-auto mt-3">
                            <table className="min-w-200 md:min-w-full text-xs">
                                <thead>
                                    <tr className="bg-gray-100 text-gray-500 ">
                                        <th></th>
                                        <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">Date</th>
                                        <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">Device</th>
                                        <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">Perf</th>
                                        <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">SEO</th>
                                        <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">A11y</th>
                                        <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">BP</th>
                                        <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">LCP</th>
                                        <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">CLS</th>
                                        <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">INP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="even:bg-gray-50 hover:bg-gray-100"
                                        onClick={() => handleOpenAccordian(index)}
                                    >
                                        <td>
                                            <span

                                            >
                                                {showAccordian[index] ? (<IoIosArrowDown className="text-gray-500 text-sm" />) : (<IoIosArrowForward className="text-gray-500 text-sm" />)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 border-b border-gray-200"><span className="font-semibold text-gray-700">{item.date ?? "—"}</span></td>
                                        <td className={`px-4 py-3 border-b border-gray-200`}><span className={`rounded-lg py-1 px-4 ${item.device_type === "desktop" ? "bg-purple-100 text-purple-700" : item.device_type === "mobile" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{item.strategy}</span></td>
                                        <td className={`px-4 py-3 border-b border-gray-200`}><span className={`${getScoreColor(item.fullJson?.categories?.performance || null)}`}>{item.fullJson?.categories?.performance != null ? Math.round(item.fullJson.categories.performance) : "—"}</span></td>
                                        <td className="px-4 py-3 border-b border-gray-200"><span className={`${getScoreColor(item.fullJson.categories.seo || null)}`}>{item.fullJson?.categories?.seo != null ? Math.round(item.fullJson.categories.seo) : "—"}</span></td>
                                        <td className="px-4 py-3 border-b border-gray-200"><span className={`${getScoreColor(item.fullJson.categories.accessibility || null)}`}>{item.fullJson?.categories?.accessibility != null ? Math.round(item.fullJson.categories.accessibility) : "—"}</span></td>
                                        <td className="px-4 py-3 border-b border-gray-200"><span className={`${getScoreColor(item.fullJson.categories.bestPractices || null)}`}>{item.fullJson?.categories?.bestPractices != null ? Math.round(item.fullJson.categories.bestPractices) : "—"}</span></td>
                                        <td className="px-4 py-3 border-b border-gray-200"><span className={`${getCWVColor("LCP", item.fullJson?.audits?.largestContentfulPaint?.numericValue || null)}`}>{item.fullJson?.audits?.largestContentfulPaint?.displayValue ?? "—"}</span></td>
                                        <td className="px-4 py-3 border-b border-gray-200"><span className={`${getCWVColor("CLS", item.fullJson?.audits?.cumulativeLayoutShift?.numericValue || null)}`}>{item.fullJson?.audits?.cumulativeLayoutShift?.displayValue ?? "—"}</span></td>
                                        <td className="px-4 py-3 border-b border-gray-200"><span className={`${getCWVColor("INP", item.fullJson?.audits?.interactionToNextPaint?.numericValue || null)}`}>{item.fullJson?.audits?.interactionToNextPaint?.displayValue ?? "—"}</span></td>
                                    </tr>
                                </tbody>

                            </table>
                            
                        </div>
                        {showAccordian[index] &&
                                <div className="rounded-lg p-8 mt-6 border border-gray-100 animate-in fade-in duration-300 overflow-hidden">
                                    <div className="flex flex-col lg:flex-row gap-12">
                                        {/* Lighthouse Scores Section */}
                                        <div className="flex-1">
                                            <h3 className="text-sm font-semibold text-gray-700 mb-6 uppercase tracking-wide">Lighthouse Scores</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-4">
                                                <div className={`flex flex-col justify-center items-center px-6 py-6 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${getScoreColor(item.fullJson?.categories?.performance || null)}`}>
                                                    <div className="text-2xl font-bold">{item.fullJson?.categories?.performance != null ? Math.round(item.fullJson.categories.performance) : "—"}</div>
                                                    <div className="text-xs font-medium text-gray-600 mt-2">Performance</div>
                                                </div>
                                                <div className={`flex flex-col justify-center items-center px-6 py-6 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${getScoreColor(item.fullJson.categories.seo || null)}`}>
                                                    <div className="text-2xl font-bold">{item.fullJson?.categories?.seo != null ? Math.round(item.fullJson.categories.seo) : "—"}</div>
                                                    <div className="text-xs font-medium text-gray-600 mt-2">SEO</div>
                                                </div>
                                                <div className={`flex flex-col justify-center items-center px-6 py-6 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${getScoreColor(item.fullJson.categories.accessibility || null)}`}>
                                                    <div className="text-2xl font-bold">{item.fullJson?.categories?.accessibility != null ? Math.round(item.fullJson.categories.accessibility) : "—"}</div>
                                                    <div className="text-xs font-medium text-gray-600 mt-2">Accessibility</div>
                                                </div>
                                                <div className={`flex flex-col justify-center items-center px-6 py-6 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${getScoreColor(item.fullJson.categories.bestPractices || null)}`}>
                                                    <div className="text-2xl font-bold">{item.fullJson?.categories?.bestPractices != null ? Math.round(item.fullJson.categories.bestPractices) : "—"}</div>
                                                    <div className="text-xs font-medium text-gray-600 mt-2">Best Practices</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Core Web Vitals Section */}
                                        <div className="flex-1">
                                            <h3 className="text-sm font-semibold text-gray-700 mb-6 uppercase tracking-wide">Core Web Vitals & Metrics</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                <div className={`flex flex-col justify-center items-center px-6 py-6 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${getCWVColor("LCP", item.fullJson?.audits?.largestContentfulPaint?.numericValue / 1000 || null)}`}>
                                                    <div className="text-2xl font-bold">{item.fullJson?.audits?.largestContentfulPaint?.displayValue ?? "—"}</div>
                                                    <div className="text-xs font-medium text-gray-600 mt-2">LCP</div>
                                                </div>
                                                <div className={`flex flex-col justify-center items-center px-6 py-6 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${getCWVColor("FCP", item.fullJson?.audits?.firstContentfulPaint?.numericValue || null)}`}>
                                                    <div className="text-2xl font-bold">{item.fullJson?.audits?.firstContentfulPaint?.displayValue ?? "—"}</div>
                                                    <div className="text-xs font-medium text-gray-600 mt-2">FCP</div>
                                                </div>
                                                <div className={`flex flex-col justify-center items-center px-6 py-6 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${getCWVColor("TBT", item.fullJson?.audits?.totalBlockingTime?.numericValue || null)}`}>
                                                    <div className="text-2xl font-bold">{item.fullJson?.audits?.totalBlockingTime?.displayValue ?? "—"}</div>
                                                    <div className="text-xs font-medium text-gray-600 mt-2">TBT</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            }

                    </div>
                )
            })}
        </div>
    );
};

export default ResultsPage;
