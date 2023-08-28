"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "~/components/ui/navigation-menu";
import Image from "next/image";
// import UserDropdown from "./UserDropdown";

const Header = () => {
  return (
    <nav className="sticky top-0 z-10 bg-trasnparent backdrop-filter backdrop-blur-lg border-b border-slate-900">
      <div className="h-14 flex items-center justify-between px-20">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem className="mr-2">
              <NavigationMenuLink href="/">
                <Image
                  src="/budgets-map-logo.svg"
                  alt="Budgets-map logo"
                  width={34}
                  height={34}
                />
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Dashboard
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      <div>
        {/* <UserDropdown /> */}
      </div>
    </nav>
  );
};

export default Header;