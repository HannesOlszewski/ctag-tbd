import { Link, useLocation } from "react-router";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

interface NavbarProps {
  title: string;
}

export default function Navbar({ title }: NavbarProps) {
  const location = useLocation();

  return (
    <div className="flex justify-between">
      <NavigationMenu>
        <NavigationMenuList>
          {location.pathname !== "/" && (
            <NavigationMenuItem>
              <Link to="/">
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  &lsaquo; Back
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          )}
        </NavigationMenuList>
      </NavigationMenu>
      <div>{title.toUpperCase()}</div>
      <div>&nbsp;</div>
    </div>
  );
}
