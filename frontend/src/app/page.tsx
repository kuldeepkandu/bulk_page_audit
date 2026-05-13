'use client'

import Image from "next/image";
import { FaPlus } from "react-icons/fa";
import { GrProjects } from "react-icons/gr";
import { FaHistory } from "react-icons/fa";
import { IoSettingsSharp } from "react-icons/io5";
import { MdCompare } from "react-icons/md";
import Button from "./components/Button";
import Sidebar from './components/Sidebar'
import ActionButton from './components/ActionButton'
import Newaudit from './components/Newaudit'
import { useState } from "react";


export default function Home() {

  const [showNewAudit, setShowNewAudit] = useState(false);

  const buttonItems = [
    {
      text: "View Projects",
      to: "/projects",
      icon: GrProjects,
    },

    {
      text: "Aduit History",
      to: "/history",
      icon: FaHistory,
    },
    {
      text: "Compare Audits",
      to: "/compare",
      icon: MdCompare,
    },
    {
      text: "Setting",
      to: "/setting",
      icon: IoSettingsSharp,
    },

  ]

  return (
    <div className=" flex min-h-screen relative">
      {/* <div className="w-65 flex items-center justify-center hidden md:flex">
        <Sidebar  />
      </div> */}
      <div className="">
      <Newaudit show={showNewAudit} onClose={() => setShowNewAudit(false)}/>
      </div>
      <div className="flex-col w-full px-10 mt-10">
        <p className="text-2xl font-semibold ">Welcome</p>
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div className="flex justify-start items-center">
              <ActionButton
                text="New Audit"
                icon={FaPlus}
                color="#249e93"
                onClick={() => {
                  console.log("New audit")
                  setShowNewAudit(true)
                }}
                className="primary font-semibold flex gap-2 py-2 px-10 border border-gray-300 rounded-xl w-full text-sm md:text-base"
              />
            </div>
            {buttonItems.map((item, idx) => (
              <div className="" key={idx}>
                <Button
                  to={item.to}
                  icon={item.icon}
                  text={item.text}
                  className="text-sm md:text-base font-semibold flex gap-2 py-2 px-5 md:px-10 border border-gray-300 rounded-xl w-full"
                // color={idx === 0 ? '#249e93' : ''}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
