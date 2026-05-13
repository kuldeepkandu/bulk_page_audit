

const ActionButton = ({
    icon: Icon,
    text,
    onClick,
    className='',
    color= "",
    title=""
}) => {
    return (
        <button
        onClick={onClick}
        title={title}
        style={color ? {backgroundColor: color} : {}}
         className={`btn ${className} ${color ? "text-white hover:opacity-90" : ""}`}
         >
            {Icon && <Icon className="text-lg mt-1" />}
            <h1>{text}</h1>
        </button>
    )
}
export default ActionButton