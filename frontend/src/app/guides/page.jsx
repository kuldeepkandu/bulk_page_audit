"use client";

import Faq from "../components/Faq";
import FeaturedCard from "../components/FeaturedCard";
import TitleDescription from "../components/TitleDescription";
import InfoCard from "../components/InfoCard";
import ExploreMore from "../components/ExploreMore";
import { useState } from "react";

const FeaturedGuides = [
    {
        title: "Optimizing Page Speed",
        description: "Learn how to improve your website's loading speed and performance.",
        slug: "/guides/optimizing-page-speed"
    },
    {   title: "SEO Best Practices",
        description: "Discover the latest SEO strategies to boost your search engine rankings.",
        slug: "/guides/seo-best-practices"
    },
    {
        title: "Mobile Optimization",
        description: "Ensure your website performs well on mobile devices with these optimization tips.",
        slug: "/guides/mobile-optimization"
    }
];

const InfoCards = [
    {
        title: "What is PageSpeed Insights?",
        description: "PageSpeed Insights is a tool that analyzes the content of a web page and provides suggestions to make that page faster.",
        slug: "/guides/what-is-pagespeed-insights",
    },
    {
        title: "Why is website performance important?",
        description: "Website performance is crucial for user experience, search engine rankings, and overall business success. A fast-loading website can reduce bounce rates and increase conversions.",
        slug: "/guides/why-is-website-performance-important"
    },
    {
        title: "How can I improve my website's SEO?",
        description: "Improving your website's SEO involves optimizing your content, using relevant keywords, improving site structure, and ensuring mobile-friendliness, among other strategies.",
        slug: "/guides/how-can-i-improve-my-website-s-seo"
    },
    {
        title: "What are some common performance optimization techniques?",
        description: "Common performance optimization techniques include minimizing HTTP requests, optimizing images, leveraging browser caching, and using a content delivery network (CDN).",
        slug: "/guides/what-are-some-common-performance-optimization-techniques"
    }
]

const Faqs = [
    {
        question: "What is website performance optimization?",
        answer: "Website performance optimization involves improving the speed and efficiency of a website to enhance user experience and search engine rankings."
    },
    {
        question: "How can I improve my website's SEO?",
        answer: "Improving your website's SEO involves optimizing your content, using relevant keywords, improving site structure, and ensuring mobile-friendliness, among other strategies."
    },
    {
        question: "What are some common performance optimization techniques?",
        answer: "Common performance optimization techniques include minimizing HTTP requests, optimizing images, leveraging browser caching, and using a content delivery network (CDN)."
    },
    {
        question: "How do I use PageSpeed Insights?",
        answer: "To use PageSpeed Insights, simply enter the URL of the web page you want to analyze, and the tool will provide a performance score along with suggestions for improvement."
    }
]

const ExploreMores = [
    {
        title: "Advanced SEO Strategies",
        description: "Explore advanced techniques to further enhance your website's SEO and stay ahead of the competition."
    },
    {
        title: "Performance Optimization Tools",
        description: "Discover a variety of tools that can help you analyze and optimize your website's performance."
    },
    {
        title: "Case Studies",
        description: "Read case studies of successful website optimizations and learn from real-world examples."
    },
    {
        title: "Web Performance Trends",
        description: "Stay updated with the latest trends and developments in web performance optimization."
    }
]

const guides = () => {

    const [openIndexFaq, setOpenIndexFaq] = useState(null);

    const toggleFaq = (index) => {
        setOpenIndexFaq(openIndexFaq === index ? null : index);
    }

    return (
        <div className="w-full min-h-screen">
            <div className="w-full">
                <TitleDescription title="SEO & Performance Guides" description="Comprehensive guides for optimizing your website's performance, SEO, and user experience." />
            </div>
            <div className="px-4 mt-20">
                <div className="px-4">
                    <span className="md:text-2xl text-2xl font-semibold text-gray-800">Featured</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 mt-4">
                    {FeaturedGuides.map((guide, index) => (
                        <FeaturedCard key={index} title={guide.title} description={guide.description} slug={guide.slug} />
                    ))}
                </div>

                <div className="px-4 mt-20">
                    <span className="md:text-2xl text-2xl font-semibold text-gray-800">All SEO & Performance Guides ({InfoCards.length})</span>
                    
                    {InfoCards.map((card, index) => (
                        <div className="mt-4" key={index}>
                            <InfoCard title={card.title} description={card.description} slug={card.slug} />
                        </div>
                    ))}
                </div>
            </div>
            <div className="px-4 mt-20">
                <div className="px-4 mb-4">
                    <span className="md:text-2xl text-2xl font-semibold text-gray-800">Frequently Asked Questions</span>
                </div>
                {Faqs.map((faq, index) => (
                    <div className="mt-4" key={index}>
                        <Faq 
                        question={faq.question} 
                        answer={faq.answer} 
                        isOpen={openIndexFaq === index}
                        onClick={() => toggleFaq(index)}
                        />
                    </div>
                ))}
            </div>

            <div className="px-4 mt-20">
                <div className="px-4 mb-4">
                    <span className="md:text-2xl text-2xl font-semibold text-gray-800">Explore More</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ExploreMores.map((item, index) => (
                        <ExploreMore key={index} title={item.title} description={item.description} />
                    ))}
                </div>
            </div>
        </div>
    )
}
export default guides;