import { ConfirmClient } from "./confirm-client"

interface ConfirmPageProps {
  searchParams: Promise<{ token_hash?: string; type?: string }>
}

export default async function ConfirmPage({ searchParams }: ConfirmPageProps) {
  const params = await searchParams
  return <ConfirmClient token_hash={params.token_hash} type={params.type} />
}
