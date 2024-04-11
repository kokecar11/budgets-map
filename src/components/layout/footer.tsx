import Link from 'next/link'
import Image from 'next/image'
import { FeHeart, FeGithub, FeInstagram, FeTwitter } from '../icons'

export function Footer() {
	return (
		<footer className="border-t-4 border-secondary text-center text-white">
			<div className="container mx-auto flex items-center justify-between space-x-6 p-4">
				<div className="flex items-center justify-center space-x-6">
					<Link
						href="/"
						className={
							'flex place-items-center space-x-2 text-lg font-bold text-white'
						}>
						<Image
							className="rounded-md"
							src="/images/logo.png"
							width={40}
							height={40}
							alt="Logo T-Record"
						/>
						<span>Budgets Map</span>
					</Link>
				</div>
				<div className="flex space-x-6">
					<p className="flex font-semibold text-white">
						Made with
						<FeHeart className="mx-1 text-2xl text-rose-600" /> by{' '}
						<Link
							href="https://twitter.com/Kokecar11"
							className="pl-1 underline"
							target="_blank">
							Koke
						</Link>
					</p>
					<Link
						href="https://github.com/kokecar11"
						className="icon hover:animate-jump hover:animate-once hover:animate-duration-1000 hover:animate-delay-300"
						target="_blank">
						<FeGithub className="text-2xl" />
					</Link>
					<Link
						href="https://twitter.com/Kokecar11"
						className="icon hover:animate-shake hover:animate-once hover:animate-duration-1000 hover:animate-delay-300"
						target="_blank">
						<FeTwitter className="text-2xl" />
					</Link>
					<Link
						href="https://www.instagram.com/koke_car11/"
						className="icon hover:animate-wiggle hover:animate-once hover:animate-duration-1000 hover:animate-delay-300"
						target="_blank">
						<FeInstagram className="text-2xl" />
					</Link>
				</div>
			</div>
		</footer>
	)
}
