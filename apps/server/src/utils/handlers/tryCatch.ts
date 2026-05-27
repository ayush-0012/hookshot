export async function tryCatch(fn: Promise<any>) {
  try {
    const data = await fn;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
