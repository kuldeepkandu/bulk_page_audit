import React from "react";
import PropTypes from "prop-types";

const Pagination = ({
  currentPage,
  totalPages,
  limit,
  onPageChange,
  onLimitChange,
  isLoading,
  options,
}) => {
  const getPaginationItems = (currentPage, totalPages) => {
    if (totalPages <= 0) return [];

    const pages = [];

    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "ellipsis", totalPages);
      return pages;
    }

    if (currentPage >= totalPages - 3) {
      pages.push(1, "ellipsis");
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    pages.push(
      1,
      "ellipsis",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "ellipsis",
      totalPages
    );

    return pages;
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white py-4 px-4 border-t">

      {/* Pagination Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-1">
        {/* Previous */}
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1 || isLoading}
          className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          &lt;
        </button>

        {/* Page Numbers */}
        {getPaginationItems(currentPage, totalPages).map((page, idx) =>
          page === "ellipsis" ? (
            <span
              key={`page-${idx}`}
              className="px-2 text-gray-500 select-none"
            >
              ...
            </span>
          ) : (
            <button
              key={`page-${idx}`}
              onClick={() => onPageChange(page)}
              disabled={currentPage === page || isLoading}
              className={`px-3 py-1 text-sm border rounded-md transition
                ${
                  currentPage === page
                    ? "bg-black text-white border-black"
                    : "hover:bg-gray-100"
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() =>
            onPageChange(Math.min(currentPage + 1, totalPages))
          }
          disabled={currentPage === totalPages || isLoading}
          className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          &gt;
        </button>
      </div>

      {/* Limit Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">
          Records per page:
        </span>

        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          disabled={isLoading}
          className="px-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-50"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  limit: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onLimitChange: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.number.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
};

Pagination.defaultProps = {
  isLoading: false,
};

export default Pagination;
