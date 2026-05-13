"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CiMobile3, CiDesktop } from "react-icons/ci";
import TubeLoader from "../../components/TubeLoader.jsx";
import ProgressBar from "../../components/ProgressBar/index.jsx";
import ActionButton from "../../components/ActionButton.jsx";
import { TbReload } from "react-icons/tb";
import { IoMdDownload } from "react-icons/io";

const ResultsPage = () => {
  const { batchId } = useParams();
  const [userId, setUserId] = useState();
  const [results, setResults] = useState([]);
  const [batchStatus, setBatchStatus] = useState("running");
  const [message, setMessage] = useState();
  const [showAccordion, setShowAccordion] = useState({});
  const [isAborting, setIsAborting] = useState(false);
  const [retryingScanIds, setRetryingScanIds] = useState({});
  const [isRetryingAllFailed, setIsRetryingAllFailed] = useState(false);
  const retryCancellationRef = useRef(false);

  const RETRY_DELAY_MS = 1500;

  const [summary, setSummary] = useState({
    totalUrls: 0,
    totalTasks: 0,
    processedTasks: 0,
    completedTasks: 0,
    runningTasks: 0,
    pendingTasks: 0,
    failedTasks: 0,
    abortedTasks: 0,
    progressPercentage: 0,
    allUrls: [],
    completedUrls: [],
    status: "",
  });

  const metricOrder = [
    "largest-contentful-paint",
    "cumulative-layout-shift",
    "interaction-to-next-paint",
    "first-contentful-paint",
    "total-blocking-time",
  ];

  // Helper functions
  const getScoreColor = (value) => {
    if (value == null) return "text-gray-500";
    if (value < 50)
      return "text-red-500 bg-red-100 border-1 rounded-full py-1 px-[5px] font-semibold";
    if (value < 90)
      return "text-orange-500 bg-orange-100 border-1 rounded-full py-1 px-[5px] font-semibold";
    return "text-green-500 bg-green-100 border-1 rounded-full py-1 px-[5px] font-semibold";
  };

  const renderScore = (value) =>
    value == null ? (
      <span className="text-gray-500">-</span>
    ) : (
      <span className={getScoreColor(value)}>{Number(value).toFixed(0)}</span>
    );

  const getCWVColor = (name, value) => {
    if (value == null || isNaN(value)) return "text-gray-500";

    const v = Number(value);
    const green = "text-green-600 font-semibold";
    const orange = "text-orange-500 font-semibold";
    const red = "text-red-500 font-semibold";

    switch (name) {
      case "largest-contentful-paint":
        return v <= 2500 ? green : v <= 4000 ? orange : red;
      case "interaction-to-next-paint":
        return v <= 200 ? green : v <= 500 ? orange : red;
      case "cumulative-layout-shift":
        return v <= 0.1 ? green : v <= 0.25 ? orange : red;
      case "first-contentful-paint":
        return v <= 1800 ? green : v <= 3000 ? orange : red;
      case "total-blocking-time":
        return v <= 200 ? green : v <= 600 ? orange : red;
      default:
        return "text-gray-500";
    }
  };

  // Abort scan
  const handleAbort = async () => {
    if (!batchId) return;
    setIsAborting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/v1/users/abortScan/${batchId}`,
        { method: "POST", credentials: "include" },
      );
      const data = await res.json();
      if (res.ok) {
        setBatchStatus("aborted");
        setMessage(data.message);
      } else {
        setMessage(data?.message || "Failed to abort batch");
        alert(data?.message || "Failed to abort batch");
      }
    } catch (err) {
      console.error("Abort error:", err);
      alert("Failed to abort batch");
    }
    setIsAborting(false);
  };

  const intervalRef = useRef();
  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startPolling = () => {
    stopPolling();
    intervalRef.current = setInterval(fetchResults, 5000);
  };

  const waitForRetryDelay = (delayMs) =>
    new Promise((resolve) => window.setTimeout(resolve, delayMs));

  const getScanStatusById = (scanGroups = [], scanId) => {
    for (const scanGroup of scanGroups) {
      for (const scanData of Object.values(scanGroup.scans || {})) {
        if (scanData?.scanId === scanId) {
          return scanData.status;
        }
      }
    }

    return null;
  };

  const fetchResults = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/v1/users/results/${batchId}`,
      );
      const data = await res.json();
      setUserId(data.userId);
      setResults(data.data || []);
      setBatchStatus(data.status);
      setMessage(data.message);

      setSummary({
        totalUrls: data.totalUrls || 0,
        totalTasks: data.totalTasks || 0,
        processedTasks: data.processedTasks || 0,
        completedTasks: data.completedTasks || 0,
        runningTasks: data.runningTasks || 0,
        pendingTasks: data.pendingTasks || 0,
        failedTasks: data.failedTasks || 0,
        abortedTasks: data.abortedTasks || 0,
        progressPercentage: data.progressPercentage || 0,
        allUrls: data.allUrls || [],
        completedUrls: data.completedUrls || [],
        status: data.status || "",
      });

      if (
        data.status === "completed" ||
        data.status === "aborted" ||
        data.status === "not_found"
      ) {
        stopPolling();
      }

      return data;
    } catch (error) {
      console.error("Fetch error:", error);
      return null;
    }
  };

  const retryScanUntilCompleted = async (scanId) => {
    setRetryingScanIds((prev) => ({ ...prev, [scanId]: true }));
    let retryCompleted = false;
    let latestErrorMessage = "";

    try {
      while (!retryCancellationRef.current) {
        let response;

        try {
          response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/v1/users/retryFailedScan`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ scanId }),
            },
          );
        } catch (requestError) {
          latestErrorMessage =
            requestError?.message || "Network error while retrying scan";
          await waitForRetryDelay(RETRY_DELAY_MS);
          continue;
        }

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          retryCompleted = true;
          console.log("Retry success: ", data);
          await fetchResults();
          break;
        }

        latestErrorMessage =
          data?.error || data?.message || "Retry failed. Retrying again...";

        const latestResults = await fetchResults();
        const latestStatus = getScanStatusById(latestResults?.data, scanId);

        if (latestStatus === "completed") {
          retryCompleted = true;
          break;
        }

        if (
          latestResults?.status === "aborted" ||
          latestResults?.status === "not_found" ||
          data?.message === "Scan not found !!"
        ) {
          break;
        }

        await waitForRetryDelay(RETRY_DELAY_MS);
      }
    } catch (error) {
      latestErrorMessage = error?.message || "Retry failed";
      console.log("Retry Failed: ", latestErrorMessage);
    } finally {
      if (!retryCancellationRef.current) {
        setRetryingScanIds((prev) => ({ ...prev, [scanId]: false }));
      }
    }

    return {
      retryCompleted,
      latestErrorMessage,
    };
  };

  const handleRetry = async (scanId) => {
    if (retryingScanIds[scanId]) return;

    const { retryCompleted, latestErrorMessage } =
      await retryScanUntilCompleted(scanId);

    if (!retryCompleted && latestErrorMessage && !retryCancellationRef.current) {
      alert(latestErrorMessage);
    }
  };

  useEffect(() => {
    retryCancellationRef.current = false;

    return () => {
      retryCancellationRef.current = true;
    };
  }, []);

  // Fetch results with polling
  useEffect(() => {
    if (!batchId) return;

    fetchResults();
    startPolling();

    return () => {
      stopPolling();
    };
  }, [batchId]);

  const handleDownloadCsv = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const payload = {
      userId: userId,
      batchId: batchId,
    };
    const res = await fetch(`${baseUrl}/api/v1/users/exportToCsv`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || "Failed to download CSV");
    }

    const disposition = res.headers.get("content-disposition");

    const fileName =
      disposition?.match(/filename="?([^"]+)"?/)?.[1] ||
      `batch_${payload.batchId}.csv`;

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    a.remove();
    window.URL.revokeObjectURL(url);

    console.log("CSV Download");
  };

  // Accordion toggle
  const handleOpenAccordion = (url) => {
    setShowAccordion((prev) => ({
      ...prev,
      [url]: !prev[url],
    }));
  };

  // Handle batch not found
  if (batchStatus === "not_found") {
    return (
      <div className="p-6 text-center text-red-600 font-semibold text-sm">
        {message || "Batch not found"}
      </div>
    );
  }

  const failedScans = results.flatMap((item) =>
    Object.entries(item.scans || {})
      .filter(([, scanData]) => scanData?.status === "failed")
      .map(([deviceType, scanData]) => ({
        scanId: scanData.scanId,
        url: item.url,
        deviceType,
      })),
  );

  const retryableFailedScans = failedScans.filter(
    (scan) => !retryingScanIds[scan.scanId],
  );

  const handleRetryAllFailed = async () => {
    if (isRetryingAllFailed || retryableFailedScans.length === 0) return;

    setIsRetryingAllFailed(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/v1/users/retryFailedScansBulk`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ batchId }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to start bulk retry");
      }

      setBatchStatus("running");
      setMessage(data?.message || "Bulk retry started");
      await fetchResults();
      startPolling();
    } catch (error) {
      if (!retryCancellationRef.current) {
        alert(error?.message || "Failed to start bulk retry");
      }
    } finally {
      if (!retryCancellationRef.current) {
        setIsRetryingAllFailed(false);
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-50 text-green-700 border-green-100";
      case "running":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "failed":
        return "bg-red-50 text-red-700 border-red-100";
      case "aborted":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusLabel = (status) => {
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-end items-center gap-3 mb-4">
        {failedScans.length > 0 && (
          <button
            onClick={handleRetryAllFailed}
            disabled={
              isRetryingAllFailed ||
              retryableFailedScans.length === 0 ||
              batchStatus === "running"
            }
            className={`px-4 py-2 rounded text-sm font-semibold border ${
              isRetryingAllFailed ||
              retryableFailedScans.length === 0 ||
              batchStatus === "running"
                ? "bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed"
                : "bg-white text-teal-600 border-teal-200 hover:bg-teal-50"
            }`}
          >
            {isRetryingAllFailed ? (
              <span className="inline-flex items-center gap-2">
                <TbReload className="animate-spin" />
                Retrying all failed scans...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <TbReload />
                Retry All Failed ({failedScans.length})
              </span>
            )}
          </button>
        )}

        {batchStatus === "running" && summary.progressPercentage < 100 ? (
          <button
            onClick={handleAbort}
            disabled={isAborting}
            className={`px-4 py-2 rounded text-white text-sm ${
              isAborting ? "bg-gray-400" : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {isAborting ? "Aborting..." : "Abort Scan"}
          </button>
        ) : (
          <div className="text-sm text-teal-400">
            <ActionButton
              text={"Export to CSV"}
              icon={IoMdDownload}
              onClick={handleDownloadCsv}
              className="cursor-pointer flex gap-1"
              title="Download CSV File"
            />
          </div>
        )}

        {batchStatus === "aborted" && (
          <p className="text-red-600 text-sm font-semibold">Scan Aborted</p>
        )}
      </div>

      {/* Progress bar + loader */}
      {batchStatus === "running" && summary.progressPercentage < 100 && (
        <div className="space-y-2">
          <div className="w-full bg-neutral-quaternary rounded-full overflow-hidden">
            <ProgressBar progressPercentage={summary.progressPercentage} />
          </div>
          <p className="text-sm text-gray-600">
            {summary.processedTasks} / {summary.totalTasks} tasks processed
            {summary.completedTasks > 0 && ` • ${summary.completedTasks} completed`}
            {summary.failedTasks > 0 && ` • ${summary.failedTasks} failed`}
            {summary.runningTasks > 0 && ` • ${summary.runningTasks} running`}
            {summary.pendingTasks > 0 && ` • ${summary.pendingTasks} pending`}
          </p>
          <div className="flex flex-col gap-2 mb-3 border rounded p-2 overflow-auto h-48">
            {results.map((item) => {
              const deviceStatuses = Object.values(item.scans || {});

              return (
                <div key={item.url} className="">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-700 text-sm break-all">
                    {item.url}:
                  </span>
                  {deviceStatuses.map((device) => (
                    <span
                      key={device.scanId}
                      className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border shadow-sm ${getStatusBadgeClass(device.status)}`}
                    >
                      {device.deviceType === "mobile" ? (
                        <CiMobile3 className="w-3 h-3" />
                      ) : (
                        <CiDesktop className="w-3 h-3" />
                      )}
                      <span className="text-xs">
                        {device.deviceType} • {getStatusLabel(device.status)}
                      </span>
                    </span>
                  ))}
                </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loader while results empty */}
      {batchStatus === "running" && results.length === 0 && (
        <div className="flex flex-col justify-center items-center">
          <TubeLoader />
          <div>Scanning in progress…</div>
        </div>
      )}

      {/* Scan results */}
      {results.map((item) => {
        const scans = item.scans || {};
        const deviceEntries = Object.entries(scans);
        const isSingleDevice = deviceEntries.length === 1;

        return (
          <div
            key={item.url}
            className="border border-gray-200 rounded-2xl p-4"
          >
            <div className="flex justify-between items-center">
              <Link
                href={item.url}
                target="_blank"
                className="hover:underline text-teal-600 text-sm md:text-base"
              >
                {item.url}
              </Link>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="min-w-200 lg:min-w-full text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-500">
                    <th className="px-4 py-3 text-left border-b">Device</th>
                    <th className="px-4 py-3 text-left border-b">Date</th>
                    <th className="px-4 py-3 text-left border-b">
                      Performance
                    </th>
                    <th className="px-4 py-3 text-left border-b">SEO</th>
                    <th className="px-4 py-3 text-left border-b">
                      Accessibility
                    </th>
                    <th className="px-4 py-3 text-left border-b">
                      Best Practices
                    </th>
                    <th className="px-4 py-3 text-left border-b">LCP</th>
                    <th className="px-4 py-3 text-left border-b">CLS</th>
                    <th className="px-4 py-3 text-left border-b">INP</th>
                    <th className="px-4 py-3 text-left border-b">FCP</th>
                    <th className="px-4 py-3 text-left border-b">TBT</th>
                  </tr>
                </thead>

                <tbody>
                  {deviceEntries.map(([deviceType, scanData]) =>
                    scanData.status === "failed" ? (
                      <tr key={scanData.scanId} className="bg-red-50">
                        <td className="px-4 py-3 border-b capitalize">
                          <span
                            className={`inline-flex items-center gap-1 text-xs md:text-sm px-2 py-1 rounded-full ${
                              deviceType === "mobile"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {deviceType === "mobile" ? (
                              <CiMobile3 />
                            ) : (
                              <CiDesktop />
                            )}
                            {deviceType}
                          </span>
                        </td>

                        <td className="px-4 py-3 border-b">
                          {scanData.createdAt
                            ? new Date(scanData.createdAt).toLocaleString(
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
                        <td colSpan={9} className="py-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetry(scanData.scanId);
                            }}
                            disabled={retryingScanIds[scanData.scanId]}
                            className={`px-6 py-2 font-semibold border border-gray-300 rounded-xl font-semibold text-red-500
                            ${retryingScanIds[scanData.scanId] ? "bg-gray-300 text-teal-600 cursor-not-allowed " : "cursor-pointer bg-white hover:bg-gray-100"}`}
                          >
                            {retryingScanIds[scanData.scanId] ? (
                              <div>
                                <TbReload className="inline-block animate-spin" />
                                <span>Processing...</span>
                              </div>
                            ) : (
                              <div className="text-center cursor-pointer hover:text-teal-600 transition">
                                <span>Scain Failed. Tap to retry.</span>
                                <TbReload
                                  className="inline-block ml-2"
                                  size={20}
                                />
                              </div>
                            )}
                          </button>
                        </td>
                      </tr>
                    ) : (
                      <tr
                        key={scanData.scanId}
                        className="cursor-pointer even:bg-gray-50 hover:bg-gray-100 text-center"
                        onClick={() => handleOpenAccordion(item.url)}
                      >
                        <td className="px-4 py-3 border-b capitalize">
                          <span
                            className={`inline-flex items-center gap-1 text-xs md:text-sm px-2 py-1 rounded-full ${
                              deviceType === "mobile"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {deviceType === "mobile" ? (
                              <CiMobile3 />
                            ) : (
                              <CiDesktop />
                            )}
                            {deviceType}
                          </span>
                        </td>

                        <td className="px-4 py-3 border-b">
                          {scanData.createdAt
                            ? new Date(scanData.createdAt).toLocaleString(
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

                        <td className="px-4 py-3 border-b">
                          {renderScore(scanData?.categories?.performance)}
                        </td>
                        <td className="px-4 py-3 border-b">
                          {renderScore(scanData?.categories?.seo)}
                        </td>
                        <td className="px-4 py-3 border-b">
                          {renderScore(scanData?.categories?.accessibility)}
                        </td>
                        <td className="px-4 py-3 border-b">
                          {renderScore(scanData?.categories?.bestPractices)}
                        </td>

                        {metricOrder.map((metricName) => {
                          const metric = scanData?.audits?.find(
                            (a) => a.name === metricName,
                          );
                          return (
                            <td key={metricName} className="px-4 py-3 border-b">
                              <span
                                className={getCWVColor(
                                  metricName,
                                  metric?.numericValue,
                                )}
                              >
                                {(metric?.displayValue ?? "-")
                                  .toString()
                                  .replace("~", "")}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

          </div>
        );
      })}
    </div>
  );
};

export default ResultsPage;
