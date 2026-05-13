import Link from 'next/link'

const Button = ({
    to,
    icon: Icon,
    text,
    className = "",
    color = '',
}) => {
    return (
        <div className={`flex justify-start items-center`} >
            <Link href={to} className={`btn ${!color ? 'bg-light text-black' : 'text-white'} hover:bg-[#ccfbf1]   ${className}`} style={color ? { backgroundColor: color } : {}}>
                {Icon && <Icon className="btn-icon font-light mt-1" />}
                <span>{text}</span>
            </Link>
        </div>
    )
}
export default Button;