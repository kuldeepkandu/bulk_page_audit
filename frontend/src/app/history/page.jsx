"use client";
import React, { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { IoIosArrowForward, IoIosArrowDown } from "react-icons/io";
import { CiMobile3, CiDesktop } from "react-icons/ci";
import Pagination from "../components/Pagination";

const History = () => {
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [showAccordion, setShowAccordion] = useState({});

  const [paginations, setPaginations] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 10,
  });

  const [filters, setFilters] = useState({
    url: "",
    deviceType: "",
    startDate: "",
    endDate: "",
  });

  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPaginations((prev) => ({
        ...prev,
        currentPage: 1,
      }))
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    fetchHistory();
  }, [debouncedFilters, paginations.currentPage, paginations.limit,]);

  const fetchHistory = async () => {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      // const params = new URLSearchParams({ page, limit });
      const params = new URLSearchParams({
        page: paginations.currentPage,
        limit: paginations.limit,
      });

      Object.entries(debouncedFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await fetch(
        `${baseUrl}/api/v1/users/getAllScanHistory?${params}`,
      );

      const data = await res.json();

      if (data?.data?.length > 0) {
        setResults(data.data);
        console.log(data.message);
        console.log(data.pagination.total);
        setMessage("");
        console.log("results: ", data.data);
        setPaginations((prev) => ({
          ...prev,
          currentPage: data.pagination.page,
          totalPages: data.pagination.totalPages,
          totalCount: data.pagination.total,
          limit: data.pagination.limit,
        }));
        console.log("pagination: ", paginations);
      } else {
        setResults([]);
        setMessage(data?.message || "No results found.");
      }
    } catch (error) {
      console.error("History fetch error:", error);
      setResults([]);
      setMessage("Something went wrong.");
    }
  };

  const options = [
    { value: 10, label: '10' },
    { value: 20, label: '20' },
    { value: 50, label: '50' },
    { value: 100, label: '100' },
    { value: 200, label: '200' },
    { value: 500, label: '500' },
    { value: 1000, label: '1000' },
  ];

  // score color
  const getScoreColor = (value) => {
    if (value == null) return "text-gray-500";
    if (value < 50) return "text-red-500 bg-red-100 border-1 rounded-full py-1 px-[5px] font-semibold";
    if (value < 90) return "text-orange-500 bg-orange-100 border-1 rounded-full py-1 px-[5px] font-semibold";
    return "text-green-500 bg-green-100 border-1 rounded-full py-1 px-[5px] font-semibold";
  };

  const renderScore = (value) => {
    if (value == null) {
      return <span className="text-gray-500">-</span>;
    }
    return (
      <span className={getScoreColor(value)}>{Number(value).toFixed(0)}</span>
    );
  };

  // audits color
  const getCWVColor = (name, value) => {
    if (value == null || isNaN(value)) return "text-gray-500";

    const v = Number(value);
    const green = "text-green-600 font-semibold";
    const orange = "text-orange-500 font-semibold";
    const red = "text-red-500 font-semibold";

    if (name === "largest-contentful-paint") {
      if (v <= 2500) return green;
      if (v <= 4000) return orange;
      return red;
    }

    if (name === "interaction-to-next-paint") {
      if (v <= 200) return green;
      if (v <= 500) return orange;
      return red;
    }

    if (name === "cumulative-layout-shift") {
      if (v <= 0.1) return green;
      if (v <= 0.25) return orange;
      return red;
    }

    if (name === "first-contentful-paint") {
      if (v <= 1800) return green;
      if (v <= 3000) return orange;
      return red;
    }

    if (name === "total-blocking-time") {
      if (v <= 200) return green;
      if (v <= 600) return orange;
      return red;
    }

    return "text-gray-500";
  };

  // metrics
  const metricOrder = [
    "largest-contentful-paint",
    "cumulative-layout-shift",
    "interaction-to-next-paint",
    "first-contentful-paint",
    "total-blocking-time",
  ];

  const handleOpenAccordion = (scanId) => {
    setShowAccordion((prev) => ({
      ...prev,
      [scanId]: !prev[scanId],
    }));
  };

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (selectedOption, actionMeta) => {
    setFilters((prev) => ({
      ...prev,
      [actionMeta.name]: selectedOption ? selectedOption.value : "",
    }));
  };

  return (
    <div>
      <div className="grid gap-2 mb-4 grid-cols-2 md:grid-cols-4">
        <div className="">
          <input
            type="text"
            name="url"
            placeholder="Search URL"
            value={filters.url}
            onChange={handleChange}
            className="w-full border-1 px-3 py-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 text-gray-700 text-sm bg-gray-100"
          />
        </div>
        {/* <Select
                    name="deviceType"
                    value={option.find(opt => opt.value === filters.deviceType)}
                    onChange={handleSelectChange}
                    options={option}
                    isClearable={true}
                    styles={{
                        control: (provided) => ({
                            ...provided,
                            minHeight: "30px",
                            height: "30px",
                            fontSize:"15px"
                        }),
                    }}
                    className="w-full border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400 text-gray-700"
                /> */}
        <select
          name="deviceType"
          value={filters.deviceType}
          onChange={handleChange}
          className="w-full border-1 px-3 py-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 text-gray-700 text-sm cursor-pointer bg-gray-100"
        >
          <option value="">All Devices</option>
          <option value="mobile">Mobile</option>
          <option value="desktop">Desktop</option>
        </select>
        {/* <input
                type="date"
                name="date"
                value={filters.date}
                onChange={handleChange}
            /> */}
        <div className="">
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleChange}
            className="w-full border-1 px-3 py-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 text-gray-700 text-sm cursor-pointer bg-gray-100"
          />
        </div>

        <div className="">
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleChange}
            className="w-full border-1 px-3 py-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 text-gray-700 text-sm cursor-pointer bg-gray-100"
          />
        </div>
      </div>
      <div className="space-y-6">
        {results.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg font-medium">{message}</p>
          </div>
        ) : (
          results.map((item) => (
            <div
              key={item.url}
              className="border border-gray-200 rounded-2xl p-4"
            >
              <Link
                href={item.url}
                target="_blank"
                className="hover:underline text-teal-600 text-sm md:text-base"
              >
                {item.url}
              </Link>

              <div className="overflow-x-auto mt-3">
                <table className="min-w-200 lg:min-w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-gray-500">
                      {/* <th></th> */}
                      <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">
                        Device
                      </th>
                      <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">
                        Performance
                      </th>
                      <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">
                        SEO
                      </th>
                      <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">
                        Accessibility
                      </th>
                      <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">
                        Best Practices
                      </th>
                      <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">
                        LCP
                      </th>
                      <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">
                        CLS
                      </th>
                      <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">
                        INP
                      </th>
                      <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">
                        FCP
                      </th>
                      <th className="px-4 py-3 text-left font-semibold border-b border-gray-200">
                        TBT
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {Object.values(item.scans || {}).map((scan) => (
                      <Fragment key={scan.scanId}>
                        <tr
                          className=" even:bg-gray-50 hover:bg-gray-100 text-center"
                          onClick={() => handleOpenAccordion(scan.scanId)}
                        >
                          {/* <td>
                            {showAccordion[scan.scanId] ? (
                              <IoIosArrowDown />
                            ) : (
                              <IoIosArrowForward />
                            )}
                          </td> */}

                          <td className="px-4 py-3 border-b border-gray-200 capitalize">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${
                                scan.deviceType === "mobile"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-purple-100 text-purple-700"
                              }`}
                            >
                              {scan.deviceType === "mobile" ? (
                                <CiMobile3 />
                              ) : (
                                <CiDesktop />
                              )}
                              {scan.deviceType}
                            </span>
                          </td>

                          <td>
                            {scan.createdAt
                              ? new Date(scan.createdAt).toLocaleString(
                                  "en-IN",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "2-digit",
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  },
                                )
                              : "Date unknown"}
                          </td>

                          <td>{renderScore(scan?.categories?.performance)}</td>
                          <td>{renderScore(scan?.categories?.seo)}</td>
                          <td>
                            {renderScore(scan?.categories?.accessibility)}
                          </td>
                          <td>
                            {renderScore(scan?.categories?.bestPractices)}
                          </td>

                          {metricOrder.map((metricName) => {
                            const metric = scan?.audits?.find(
                              (a) => a.name === metricName,
                            );

                            if (!metric) {
                              return (
                                <td key={metricName} className="text-gray-500">
                                  -
                                </td>
                              );
                            }

                            return (
                              <td key={metricName}>
                                <span
                                  className={getCWVColor(
                                    metric.name,
                                    metric.numericValue,
                                  )}
                                >
                                  {metric.displayValue
                                    ?.toString()
                                    .replace("~", "") || "-"}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
      <Pagination
      currentPage={paginations.currentPage}
      totalPages={paginations.totalPages}
      limit={paginations.limit}
      onPageChange={(page) => {
        setPaginations((prev) => ({
          ...prev,
          currentPage: page,
        }))
      }}
      onLimitChange={(limit) => {
        setPaginations((prev) => ({
          ...prev,
          limit: limit,
          currentPage: 1,
        }))
      }}
      options={options}
      />
    </div>
  );
};

export default History;
