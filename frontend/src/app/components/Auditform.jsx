"use client";
import { useState } from "react";
import ActionButton from "./ActionButton";
import { FaLocationArrow } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import { CiMobile3 } from "react-icons/ci";
import { CiDesktop } from "react-icons/ci";
import { TbArrowMergeBoth } from "react-icons/tb";

const Auditform = ({ onSuccess }) => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    urls: "",
    strategy: "mobile",
  });

  const [processing, setProcessing] = useState(false);

  const [crawlHostUrl, setCrawlHostUrl] = useState("");
  const [crawling, setCrawling] = useState(false);
  const [crawlInfo, setCrawlInfo] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const urls = formData.urls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url && url.startsWith("http"));

    if (urls.length === 0) {
      alert("Please enter valid URLs (including with http/https).");
      return;
    }
    setProcessing(true);

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/v1/users/pagespeed`;
      console.log("Submitting to:", apiUrl);
      console.log("Request body:", { urls, strategy: formData.strategy });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          urls,
          strategy: formData.strategy,
        }),
      });

      console.log("Response status:", response.status);
      const raw = await response.text();
      let data = null;

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {
          message: raw?.startsWith("<!DOCTYPE")
            ? "Backend returned HTML instead of JSON. Please ensure backend is running on NEXT_PUBLIC_API_URL."
            : "Invalid response from server.",
        };
      }

      console.log("Response data:", data);

      if (!response.ok) {
        console.error("API error:", data);
        alert(`Error: ${data.message || "Failed to start PageSpeed scan."}`);
        return;
      }

      if (data && data.batchId) {
        if (onSuccess) onSuccess();
        setTimeout(() => {
          router.push(`/results/${data.batchId}`);
        }, 1000);
      } else {
        alert("Failed to start PageSpeed scan - no batchId returned.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(`An error occurred: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleCrawlSubmit = async (e) => {
    e.preventDefault();

    const hostUrl = crawlHostUrl.trim();
    if (!hostUrl || !hostUrl.startsWith("http")) {
      alert("Please enter a valid host URL (including http/https).");
      return;
    }

    setCrawling(true);
    setCrawlInfo(null);

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/v1/users/crawlUrls`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hostUrl }),
      });

      const raw = await response.text();
      let data = null;

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {
          message: raw?.startsWith("<!DOCTYPE")
            ? "Backend returned HTML instead of JSON. Please ensure backend is running on NEXT_PUBLIC_API_URL."
            : "Invalid response from server.",
        };
      }

      if (!response.ok) {
        alert(`Error: ${data.message || "Failed to crawl URLs."}`);
        return;
      }

      const filteredUrls = Array.isArray(data.filteredUrls)
        ? data.filteredUrls
        : [];

      setFormData((prev) => ({
        ...prev,
        urls: filteredUrls.join("\n"),
      }));

      setCrawlInfo({
        hostUrl: data.hostUrl,
        totalAll: data.totalAll || 0,
        totalFiltered: filteredUrls.length,
      });
    } catch (error) {
      console.error("Crawl error:", error);
      alert(`An error occurred: ${error.message}`);
    } finally {
      setCrawling(false);
    }
  };

  return (
    <div className="w-full">
      <div className="w-full">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center mb-2">
            <div className="flex gap-1.5 md:gap-2 bg-gray-100 p-1 rounded-xl w-fit">
              <label
                className={`flex items-center gap-1.5 px-3 py-1 ${formData.strategy === "mobile" ? "bg-white shadow" : "bg-gray-100"} rounded-lg cursor-pointer`}
              >
                <input
                  type="radio"
                  name="strategy"
                  value="mobile"
                  checked={formData.strategy === "mobile"}
                  onChange={handleChange}
                  className="hidden peer"
                />
                <span className="text-lg">
                  <CiMobile3 className="text-gray-700" />
                </span>
                <span className="text-sm text-gray-700 peer-checked:text-blue-600">
                  Mobile
                </span>
              </label>

              <label
                className={`flex items-center gap-1.5 px-3 py-1 ${formData.strategy === "desktop" ? "bg-white shadow" : "bg-gray-100"} rounded-lg  cursor-pointer`}
              >
                <input
                  type="radio"
                  name="strategy"
                  value="desktop"
                  checked={formData.strategy === "desktop"}
                  onChange={handleChange}
                  className="hidden peer"
                />
                <span className="text-lg">
                  <CiDesktop className="text-gray-700" />
                </span>
                <span className="text-sm text-gray-700 peer-checked:text-blue-600">
                  Desktop
                </span>
              </label>
              <label
                className={`flex items-center gap-1.5 px-3 py-1 ${formData.strategy === "both" ? "bg-white shadow" : "bg-gray-100"} rounded-lg  cursor-pointer`}
              >
                <input
                  type="radio"
                  name="strategy"
                  value="both"
                  checked={formData.strategy === "both"}
                  onChange={handleChange}
                  className="hidden peer"
                />
                <span className="text-lg">
                  <TbArrowMergeBoth className="text-gray-700" />
                </span>
                <span className="text-sm text-gray-700 peer-checked:text-blue-600">
                  Both
                </span>
              </label>
            </div>
          </div>
          <textarea
            name="urls"
            rows={3}
            placeholder="Enter one URL per line"
            className="w-full p-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-400 text-gray-700 min-h-[100px] md:min-h-[115px]"
            value={formData.urls}
            onChange={handleChange}
          />
          <div className="flex justify-end items-center mt-2">
            <ActionButton
              type="submit"
              text={"Start Audit"}
              disabled={processing}
              className="font-semibold w-full sm:w-auto flex gap-2 py-1.5 px-4 border border-gray-300 rounded-lg text-sm flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              color={"#249e93"}
              icon={FaLocationArrow}
            />
          </div>
        </form>

        {/* Progress */}
        {/* {processing && (
                    <p className="text-sm text-gray-600 mb-2">
                        Processing: <strong>{currentUrl}</strong>
                    </p>
                )} */}

        <form
          onSubmit={handleCrawlSubmit}
          className="mt-3 border border-gray-200 rounded-xl p-2.5"
        >
          <p className="font-semibold text-sm text-gray-800">
            Crawl Website URLs
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            Enter one host URL. Filtered URLs will be loaded into the audit form
            above.
          </p>
          <div className="mt-1.5 flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              placeholder="https://kuldeepkandu.github.io"
              value={crawlHostUrl}
              onChange={(e) => setCrawlHostUrl(e.target.value)}
              className="w-full p-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400 text-gray-700 text-sm"
            />
            {/* <button
                            type="submit"
                            disabled={crawling}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold disabled:opacity-60 whitespace-nowrap"
                        >
                            {crawling ? "Crawling..." : "Crawl URLs"}
                        </button> */}
            <ActionButton
              type="submit"
              text={crawling ? "Crawling..." : "Crawl URLs"}
              disabled={crawling}
              className={`font-semibold flex gap-2 py-1.5 px-4 border border-gray-300 rounded-lg text-sm flex items-center justify-center ${crawling ? "cursor-not-allowed pointer-events-none opacity-60" : "cursor-pointer"} whitespace-nowrap`}
              color={"#249e93"}
              icon={FaLocationArrow}
            />
          </div>

          {crawlInfo && (
            <p className="text-xs text-gray-700 mt-2">
              Crawled {crawlInfo.totalAll} links from {crawlInfo.hostUrl}.
              Loaded {crawlInfo.totalFiltered} filtered URLs into audit list.
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Auditform;
