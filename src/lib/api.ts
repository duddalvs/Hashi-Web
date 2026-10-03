export class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: method === 'GET' ? {} : { 'Content-Type': 'application/json' },
      body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
      credentials: 'same-origin',
    });
  } catch {
    throw new RequestError('Sem conexão. Verifique sua rede e tente novamente.', 0);
  }
  const result = await response
    .json()
    .catch(() => ({ error: 'Resposta indisponível. Tente novamente.' }));
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/recovery') && path !== '/login')
      window.dispatchEvent(new Event('hashi:expired'));
    throw new RequestError(
      result.error ?? 'Não foi possível concluir a operação.',
      response.status,
    );
  }
  return result as T;
}
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Não foi possível concluir a operação.';

export async function downloadCrlv(vehicleId: number, documentId: string): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch(`/api/vehicles/${vehicleId}/crlv/${documentId}?download=1`, {
      credentials: 'same-origin',
    });
  } catch {
    throw new RequestError('Sem conexão. Tente baixar o CRLV novamente.', 0);
  }
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event('hashi:expired'));
    const result = await response.json().catch(() => null);
    throw new RequestError(result?.error ?? 'Não foi possível baixar o CRLV.', response.status);
  }
  if (!response.headers.get('content-type')?.startsWith('application/pdf'))
    throw new RequestError('O servidor não retornou um PDF. Tente novamente.', 502);
  return response.blob();
}
