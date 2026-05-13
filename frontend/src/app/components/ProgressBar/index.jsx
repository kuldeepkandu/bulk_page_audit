const ProgressBar = ({progressPercentage}) => {
    return (
        <div className="w-full bg-gray-100 rounded-full overflow-hidden border-1">
            <div 
            className="h-4 bg-teal-400 font-medium text-white text-center p-0.5 leading-none flex items-center justify-center rounded-full transition-all text-xs"
            style={{width: `${progressPercentage}%`}}
            >
                {progressPercentage}%
            </div>
        </div>
    )
}
export default ProgressBar;