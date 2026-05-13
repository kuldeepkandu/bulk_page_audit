'use client';

import { useState } from "react";
// import TubeLoader from '../components/TubeLoader.jsx'

const PageSpeed = () => {

  const [formData, setFormData] = useState({
    urls: "",
    strategy: "mobile",
  });

  const [results, setResults] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setResults([]);
    setProcessing(true);

    const urlArray = formData.urls
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    if (urlArray.length === 0) {
      alert("Please enter at least one valid URL");
      setProcessing(false);
      return;
    }

    try {
      for (const url of urlArray) {
        setCurrentUrl(url);

        const response = await fetch(
          "http://localhost:5000/api/v1/users/pagespeed",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url,
              strategy: formData.strategy,
            }),
          }
        );

        const json = await response.json();

        setResults((prev) => [
          ...prev,
          {
            url,
            strategy: formData.strategy,
            score:
              json?.data?.lighthouseResult?.categories?.performance?.score * 100 || 0,
          },
        ]);
      }
    } catch (error) {
      console.error(error);
      alert("Error while processing PageSpeed");
    } finally {
      setProcessing(false);
      setCurrentUrl("");
    }
  };

  return (
    <div className="p-20 w-full flex justify-center min-h-screen bg-gray-200">
      {/* <TubeLoader /> */}
      <div className="w-full max-w-3xl">
        <p className="font-bold text-center mb-4">Page Speed</p>
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center mb-4 ">
            <div className="flex gap-4 gap-6 bg-gray-100 p-4 rounded-2xl w-fit">
              <label className={`flex items-center gap-2 px-4 ${formData.strategy === 'mobile' ? 'bg-white shadow' : 'bg-gray-100'} rounded-xl cursor-pointer`}>
                <input
                  type="radio"
                  name="strategy"
                  value="mobile"
                  checked={formData.strategy === "mobile"}
                  onChange={handleChange}
                  className="hidden peer"
                />
                <span className="text-xl">📱</span>
                <span className="text-gray-700 peer-checked:text-blue-600">Mobile</span>
              </label>

              <label className={`flex items-center gap-2 px-4 ${formData.strategy === 'desktop' ? 'bg-white shadow' : 'bg-gray-100'} rounded-xl  cursor-pointer`}>
                <input
                  type="radio"
                  name="strategy"
                  value="desktop"
                  checked={formData.strategy === "desktop"}
                  onChange={handleChange}
                  className="hidden peer"
                />
                <span className="text-xl">🖥️</span>
                <span className="text-gray-700 peer-checked:text-blue-600">Desktop</span>
              </label>
            </div>
          </div>
          <textarea
            name="urls"
            rows={5}
            placeholder="Enter one URL per line"
            className="border rounded-lg p-4 w-full mb-4"
            value={formData.urls}
            onChange={handleChange}
          />

          <button
            type="submit"
            disabled={processing}
            className="bg-gray-300 border rounded-lg p-2 disabled:opacity-50"
          >
            {processing ? "Testing..." : "Start Test"}
          </button>
        </form>

        {/* Progress */}
        {processing && (
          <p className="text-sm text-gray-600 mb-2">
            Processing: <strong>{currentUrl}</strong>
          </p>
        )}

        {/* Results */}
        <div className="mt-6 space-y-3">
          {results.map((item, index) => (
            <div
              key={index}
              className="p-4 border rounded-lg bg-white flex justify-between"
            >
              <span className="truncate w-2/3">{item.url}</span>
              <span className="font-bold">
                {item.score}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageSpeed;
