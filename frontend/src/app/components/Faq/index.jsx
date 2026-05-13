"use client";
import { useState } from "react";
import { IoIosArrowUp } from "react-icons/io";



const Faq = ({question, answer, isOpen, onClick}) => {

    return (
        <div className="w-full">
            <div className="border w-full rounded-xl border-gray-200">
                <div className="flex justify-between items-center px-4 py-4 text-base bg-gray-100 rounded-md cursor-pointer"
                onClick={onClick}
                >
                    <div className="font-semibold text-gray-800">{question}</div>
                    <div className={`text-teal-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}><IoIosArrowUp size={20} /></div>
                </div>
                <div className={` transition-all duration-300 ease-in-out overflow-hidden text-gray-500 text-base font-normal ${isOpen ? 'max-h-96 opacity-100 px-4 py-3' : 'max-h-0 opacity-0 px-4 py-0'}`}><p>{answer}</p></div>
            </div>
        </div>
    )
}
export default Faq;