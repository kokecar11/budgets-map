'use client'

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle
} from '~/components/ui/navigation-menu'
import Image from 'next/image'

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-10 bg-transparent backdrop-filter backdrop-blur-lg border-b border-slate-900 shadow-lg">
      <div className="h-14 flex items-center justify-between px-4 md:px-24">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem className="mr-2">
              <NavigationMenuLink href="/" className="flex items-center justify-center">
                <Image
                  src="/budgets-map-logo.svg"
                  alt="Budgets-map logo"
                  width={34}
                  height={34}
                />
                <span className="ml-2 font-bold text-primary">Budgets Map</span>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink className={navigationMenuTriggerStyle()} href="/dashboard">
                Dashboard
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink className={navigationMenuTriggerStyle()} href="/budgets">
                Budgets
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink className={navigationMenuTriggerStyle()} href="/debts">
                Debts
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      <div>
        {/* <UserDropdown /> */}
      </div>
    </nav>
  )
}

export default Navbar
