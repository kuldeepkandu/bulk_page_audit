import { RxCross2 } from "react-icons/rx";
import Button from "./Button";
import Divider from './Divider'

import { FaPlus } from "react-icons/fa";
import { GrProjects } from "react-icons/gr";
import { FaHistory } from "react-icons/fa";
import { FaCircleDollarToSlot } from "react-icons/fa6";
import { IoSettingsSharp } from "react-icons/io5";
import { LuLogOut } from "react-icons/lu";


const Sidebar = () => {

    const buttonItems = [
        {
            text: "Dashboard",
            to: "/",
            icon: FaPlus,
        },
        {
            text: "Projects",
            to: "/projects",
            icon: GrProjects,
        },

        {
            text: "History",
            to: "/history",
            icon: FaHistory,
        },
        {
            text: "Billing",
            to: "/setting",
            icon: FaCircleDollarToSlot,
        },
        {
            text: "Setting",
            to: "/setting",
            icon: IoSettingsSharp,
        },

    ]



    return (
        <div className="w-full h-full border-r border-gray-300 px-2">
            <div className="flex-col">
                <div className="mt-4 flex justify-between items-center gap-4">
                    <h1 className="font-bold text-lg">BulkSpeed</h1>
                    <div className="">
                        <RxCross2 size={20} strokeWidth={0.3} />
                    </div>
                </div>
                <Divider className="bg-slate-200 my-6" />

                <div className="mt-4 px-4 flex justify-start items-center ">
                    <p className="bg-[#e5fdf8] w-full px-2 py-1 font-semibold hover:bg-[#b9f7e9] rounded-lg">My projects</p>
                </div>
                <Divider className="bg-slate-200 my-6" />

                <div className="">
                    {buttonItems.map((item, idx) => (
                        <div className="" key={idx}>
                            <Button
                                to={item.to}
                                icon={item.icon}
                                text={item.text}
                                className="primary flex gap-2 px-4 py-2 w-full rounded-lg text-sm font-semibold text-gray-500 hover:text-black"
                                color={idx === 0 ? '#249e93' : ''}
                            />
                        </div>
                    ))}
                </div>
                <Divider className="bg-slate-200 my-6" />

                <div className="mt-4 flex justify-start items-center gap-2 px-4">
                    <div className="h-10 bg-gray-500 text-white w-10 text-center rounded-full border text-xl py-1">Kp</div>
                    <span className="text-lg">Kuldeep</span>
                </div>
                <div className="mt-4">
                    <Button
                        to={"/logout"}
                        icon={LuLogOut}
                        text={"Logout"}
                        className="flex gap-2 px-4 py-2 w-full rounded-lg text-lg font-semibold text-gray-500 hover:text-black"
                    />
                </div>
            </div>
        </div>
    )
}
export default Sidebar;