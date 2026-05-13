"use client";

import Faq from "../components/Faq";
import FeaturedCard from "../components/FeaturedCard";
import TitleDescription from "../components/TitleDescription";
import InfoCard from "../components/InfoCard";
import ExploreMore from "../components/ExploreMore";
import { useState } from "react";

const FeaturedTools = [
  {
    title: "Bulk SEO Audit Tool",
    description: "Analyze multiple pages at once and identify SEO issues quickly.",
    slug: "/tools/bulk-seo-audit"
  },
  {
    title: "Keyword Research Tool",
    description: "Find high-performing keywords to optimize your content strategy.",
    slug: "/tools/keyword-research"
  },
  {
    title: "Backlink Checker Tool",
    description: "Track backlinks, monitor quality, and improve your website authority.",
    slug: "/tools/backlink-checker"
  },
  {
    title: "Mobile Optimization Tool",
    description: "Ensure your website is fast and fully optimized for mobile users.",
    slug: "/tools/mobile-optimization"
  },
  {
    title: "Page Speed Analyzer",
    description: "Test and improve your website loading speed and performance.",
    slug: "/tools/page-speed-analyzer"
  }
];


const InfoCards = [
  {
    title: "What is PageSpeed Insights Tool?",
    description: "PageSpeed Insights analyzes your web pages and provides actionable recommendations to improve loading speed and performance.",
    slug: "/tools/pagespeed-insights",
  },
  {
    title: "Why use an SEO Audit Tool?",
    description: "SEO audit tools help identify technical issues, optimize content, and improve search engine rankings for your website.",
    slug: "/tools/seo-audit",
  },
  {
    title: "How does a Keyword Research Tool help?",
    description: "Keyword research tools allow you to discover high-performing keywords, analyze competition, and plan content strategy effectively.",
    slug: "/tools/keyword-research",
  },
  {
    title: "What does a Backlink Checker Tool do?",
    description: "Backlink checker tools monitor your website’s backlinks, assess quality, and identify opportunities to improve domain authority.",
    slug: "/tools/backlink-checker",
  }
];


const Faqs = [
  {
    question: "What is the PageSpeed Insights tool?",
    answer: "PageSpeed Insights analyzes your web pages and provides recommendations to improve loading speed and overall performance."
  },
  {
    question: "How does an SEO Audit tool help?",
    answer: "SEO Audit tools check your website for technical issues, content optimization opportunities, and overall SEO health to improve rankings."
  },
  {
    question: "What is a Keyword Research tool used for?",
    answer: "Keyword Research tools help discover high-performing keywords, analyze competition, and plan effective content strategies for better SEO results."
  },
  {
    question: "How do I use a Backlink Checker tool?",
    answer: "Backlink Checker tools allow you to monitor your website’s backlinks, assess their quality, and identify opportunities to improve domain authority."
  },
  {
    question: "What does a Mobile Optimization tool do?",
    answer: "Mobile Optimization tools test your website’s mobile performance and provide suggestions to improve speed, responsiveness, and user experience on mobile devices."
  }
];


const ExploreMores = [
  {
    title: "Advanced SEO Tools",
    description: "Discover advanced SEO tools to analyze, optimize, and improve your website's search engine performance."
  },
  {
    title: "Website Performance Tools",
    description: "Explore a variety of tools designed to monitor, test, and enhance your website's speed and overall performance."
  },
  {
    title: "Backlink & Domain Tools",
    description: "Learn about tools that track backlinks, assess domain authority, and help you improve your website's online presence."
  },
  {
    title: "Mobile & Page Speed Tools",
    description: "Stay updated with tools that optimize mobile performance, page load times, and ensure your website performs well on all devices."
  }
];

const tools = () => {

    const [openIndexFaq, setOpenIndexFaq] = useState(null);

    const toggleFaq = (index) => {
        setOpenIndexFaq(openIndexFaq === index ? null : index);
    }

    return (
        <div className="w-full min-h-screen">
            <div className="w-full">
                <TitleDescription title="Free SEO Tools" description="Free online tools to analyze and improve your website's performance, SEO, and accessibility." />
            </div>
            <div className="px-4 mt-20">
                <div className="px-4">
                    <span className="md:text-2xl text-2xl font-semibold text-gray-800">Featured</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 mt-4">
                    {FeaturedTools.map((guide, index) => (
                        <FeaturedCard key={index} title={guide.title} description={guide.description} slug={guide.slug} />
                    ))}
                </div>

                <div className="px-4 mt-20">
                    <span className="md:text-2xl text-2xl font-semibold text-gray-800">All Free SEO Tools ({InfoCards.length})</span>
                    
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
export default tools;