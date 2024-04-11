'use client'
import Image from 'next/image'
import Link from 'next/link'
// import { Button } from '../ui/button'
// import { signIn, signOut, useSession } from 'next-auth/react'
// import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
// import {
// 	DropdownMenu,
// 	DropdownMenuContent,
// 	DropdownMenuGroup,
// 	DropdownMenuItem,
// 	DropdownMenuLabel,
// 	DropdownMenuSeparator,
// 	DropdownMenuTrigger,
// } from '../ui/dropdown-menu'
// import { LayoutDashboard, LogOut, Wallet } from 'lucide-react'

export function Navbar() {
	// const { data: session } = useSession()

	// const userImage = session?.user?.image as string | undefined
	// const initalName = session?.user?.name
	// 	?.split(' ')
	// 	.map((n: string) => n[0])
	// 	.join('')

	return (
		<header className="container z-10 flex w-full items-center justify-between px-4">
			<Link href="/" className="flex items-center">
				<Image
					src="/budgets-map-logo.svg"
					alt="Budgets-map logo"
					width={40}
					height={40}
				/>
				<span className="ml-2 text-lg font-semibold text-primary">
					Budgets Map
				</span>
			</Link>
			<div className="flex justify-between space-x-2">
				{/* <ModeToggle /> */}
				{/* {session?.user?.image ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Avatar className="cursor-pointer">
								<AvatarImage src={userImage} alt="profile-image" />
								<AvatarFallback>{initalName}</AvatarFallback>
							</Avatar>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-56">
							<DropdownMenuLabel className="flex-col">
								<p>{session.user.name}</p>
								<p className="text-xs font-light capitalize text-gray-400"></p>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								<Link href="/dashboard/">
									<DropdownMenuItem className="cursor-pointer">
										<LayoutDashboard className="mr-2 h-4 w-4" />
										<span>Dashboard</span>
									</DropdownMenuItem>
								</Link>
								<Link href="/billing">
									<DropdownMenuItem className="cursor-pointer">
										<Wallet className="mr-2 h-4 w-4" />
										<span>Billing</span>
									</DropdownMenuItem>
								</Link>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={async () => {
									await signOut()
								}}
								className="cursor-pointer">
								<LogOut className="mr-2 h-4 w-4" />
								<span>Logout</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				) : (
					<Button
						onClick={async () => {
							await signIn('google', { callbackUrl: '/dashboard' })
						}}>
						Get Started
					</Button>
				)} */}
			</div>
		</header>
	)
}
