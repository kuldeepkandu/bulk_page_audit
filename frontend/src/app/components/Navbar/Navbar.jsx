import DesktopNavbar from "./Desktop/DesktopNavbar";
import MobileNavbar from "../Navbar/Mobile/MobileNavbar";
const Navbar = () => {

    const Menus = [
        { name: "Home", href: "/" },
        { name: "Guides", href: "/guides" },
        { name: "Tools", href: "/tools" },
        { name: "Blog", href: "/blog" },
        { name: "Pricing", href: "/pricing" },
        { name: "History", href: "/history"},
    ]
    return (
        <div className="w-full">
            <DesktopNavbar menus={Menus} />
            <MobileNavbar menus={Menus} />
        </div>
    )
}
export default Navbar;