"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { FaBars, FaTimes } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

const MobileNavbar = ({ menus = [] }) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path) => pathname === path;

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isOpen]);

  return (
    <>
      {/* Top Navbar */}
      <nav className="w-full md:hidden bg-white shadow-sm relative z-50">
        <div className="w-full px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <Image
              src="/digitas.png"
              alt="Company Logo"
              width={120}
              height={40}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>

          <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-2xl text-gray-700"
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      </nav>

      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 z-40 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-full sm:w-72 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <Image
            src="/digitas.png"
            alt="Company Logo"
            width={100}
            height={40}
            className="h-8 w-auto object-contain"
          />

          <button
            onClick={() => setIsOpen(false)}
            className="text-xl text-gray-600 flex sm:hidden"
          >
            <FaTimes />
          </button>
        </div>

        {/* Menu Items */}
        <ul className="flex flex-col p-6 gap-6 w-full justify-center items-center sm:items-start">
          {menus.map((menu, index) => (
            <li key={index}>
              <Link
                href={menu.href}
                onClick={() => setIsOpen(false)}
                className={`block text-sm font-medium transition-colors ${
                  isActive(menu.href)
                    ? "text-[#249e93]"
                    : "text-gray-700 hover:text-[#249e93]"
                }`}
              >
                {menu.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default MobileNavbar;
