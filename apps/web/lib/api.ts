const API_URL =
  typeof window === "undefined"
    ? (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...fetchOptions } = options

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    },
  })

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Unauthorized")
    }
    const error = await res.json().catch(() => ({ detail: "Unknown error" }))
    throw new Error(error.detail ?? "Request failed")
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T
  }
  return res.json() as Promise<T>
}
