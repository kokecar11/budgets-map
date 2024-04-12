'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '~/components/ui/input'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from '~/components/ui/form'
import { Button } from '~/components/ui/button'
import { env } from '~/env'

const formSchema = z.object({
	email: z.string().email({ message: 'Invalid email' }),
})

export default function SubscriptionForm() {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: '',
		},
	})

	function onSubmit(values: z.infer<typeof formSchema>) {
		window.location.href = `https://magic.beehiiv.com/v1/8432e1f7-e24c-4571-9a87-bd4188ef0949?email=${values.email}&redirect_to=${env.NEXTAUTH_URL}`
		form.reset()
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="my-2 flex w-full max-w-lg items-center space-x-2">
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem className="w-full">
							<FormControl>
								<Input
									className="w-full"
									placeholder="Enter your email"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button
					data-event="join_waitlist"
					data-type="attributes"
					className="w-48"
					variant={'secondary'}
					type="submit">
					Join the waitlist
				</Button>
			</form>
		</Form>
	)
}
{
	/* <Input
				className="w-full"
				type="email"
				placeholder="Enter your email"
				value={email}
				onChange={(e) => {
					setEmail(e.currentTarget.value)
				}}
			/>
			<Button asChild variant={'secondary'}>
				<Link
					className="w-48"
					href={`https://magic.beehiiv.com/v1/8432e1f7-e24c-4571-9a87-bd4188ef0949?email=${email}&redirect_to=http://localhost:3000`}>
					Join the waitlist
				</Link>
			</Button> */
}
