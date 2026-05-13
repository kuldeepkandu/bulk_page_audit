"use client";
import { RxCross2 } from "react-icons/rx";
import Divider from "./Divider";
import Auditform from "./Auditform";
import { useState, useEffect } from "react";

const Newaudit = ({ show = false, onClose = () => {} }) => {
  const [formKey, setFormKey] = useState(0);
  useEffect(() => {
    if (show) setFormKey((prev) => prev + 1);
  }, [show]);
  // if (!show) return null;

  return (
    <div className="min-hscreen">
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 z-40
      ${show ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      ></div>
      <div
        className={` fixed right-0 top-0 h-full md:w-1/2 w-full bg-white shadow-xl transition-transform duration-300 z-50 ${show ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className=" p-3 flex flex-col gap-2 overflow-hidden">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="font-bold text-lg md:text-xl">New Audit</span>
              <span className="text-gray-500 text-xs md:text-sm font-semibold mt-0.5">
                Enter URLs to audit
              </span>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer hover:bg-gray-100 p-1 rounded"
            >
              <RxCross2 size={20} strokeWidth={0.3} />
            </button>
          </div>
          <Divider className="my-1" />
          <div className="flex-1 min-h-0 flex flex-col overflow-y-auto pr-1">
            <div className="font-semibold text-sm">Device Type</div>
            <div className="mt-1 w-full">
              <Auditform key={formKey} onSuccess={onClose} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Newaudit;
