"use client";
import Link from "next/link";
import PillNav from "../../../../components/PillNav";
import Image from "next/image";
import { usePathname } from "next/navigation";
import path from "path";
import Newaudit from "../../Newaudit";
import { useState } from "react";
import ActionButton from "../../ActionButton";
import { FaPlus } from "react-icons/fa";

const DesktopNavbar = ({ menus = [] }) => {
  const pathname = usePathname();
  const isActive = (path) => pathname === path;

  const [showNewAudit, setShowNewAudit] = useState(false);

  // const logo = "/dummylogo.webp";
  const logo = "/digitas.png";

  return (
    <nav className="w-full hidden md:block py-4 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/">
            <Image
              src={logo}
              alt="Company Logo"
              width={100}
              height={100}
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="text-sm text-gray-500">
          <ul>
            <li className="inline-block mx-4 hover:text-teal-600 cursor-pointer">
              {menus.length > 0 ? (
                menus.map((menu, index) => (
                  <Link
                    key={index}
                    href={menu.href}
                    className={`px-3 py-1 ${isActive(menu.href) ? "text-teal-600 font-semibold" : "text-gray-500"}`}
                  >
                    {menu.name}
                  </Link>
                ))
              ) : (
                <Link href="/">Home</Link>
              )}
            </li>
            {/* <li className="inline-block mx-4 hover:text-teal-600 cursor-pointer">
                            <Link href="/tools">Tools</Link>
                        </li>
                        <li className="inline-block mx-4 hover:text-teal-600 cursor-pointer">
                            <Link href="/blog">Blog</Link>
                        </li>
                        <li className="inline-block mx-4 hover:text-teal-600 cursor-pointer">
                            <Link href="/pricing">Pricing</Link>
                        </li> */}
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <Newaudit
            show={showNewAudit}
            onClose={() => setShowNewAudit(false)}
          />

          <div className="">
            <ActionButton
              text="New Audit"
              icon={FaPlus}
              color="#249e93"
              onClick={() => {
                console.log("New audit");
                setShowNewAudit(true);
              }}
              className="font-semibold flex gap-2 py-2 px-4 border border-gray-300 rounded-xl w-full text-sm md:text-base"
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DesktopNavbar;
