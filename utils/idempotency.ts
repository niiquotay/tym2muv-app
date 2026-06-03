export async function generateIdempotencyKey(userId: string, listingId: string, amount: number): Promise<string> {
    const timestamp = Date.now();
    const data = `${userId}-${listingId}-${amount}-${timestamp}`;
    
    // Hash the data to create a consistent, unique key
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `ik_${hashHex.substring(0, 32)}`;
}
