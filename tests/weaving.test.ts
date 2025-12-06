import { describe, it, expect, beforeAll } from 'vitest';

const API_BASE = 'http://localhost:3000/api/weaving';

describe('Weaving API Tests', () => {
    // Helper function to fetch data
    async function fetchApi(path: string, options: RequestInit = {}) {
        const url = `${API_BASE}${path}`;
        const res = await fetch(url, options);
        const data = await res.json();
        return { status: res.status, ok: res.ok, data };
    }

    it('should fetch machines list', async () => {
        const { ok, data } = await fetchApi('/machines');
        expect(ok).toBe(true);
        expect(Array.isArray(data)).toBe(true);
        if (data.length > 0) {
            expect(data[0]).toHaveProperty('id');
            expect(data[0]).toHaveProperty('name');
        }
    });

    it('should update machine status', async () => {
        // First get a machine
        const { data: machines } = await fetchApi('/machines');
        if (machines.length > 0) {
            const machine = machines[0];
            const { ok, status } = await fetchApi(`/machines/${machine.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: machine.name,
                    speedType: machine.speedType,
                    width: machine.width,
                    targetOutput: machine.targetOutput,
                    status: machine.status
                })
            });
            expect(ok).toBe(true);
            expect(status).toBe(200);
        }
    });

    it('should fetch products list', async () => {
        const { ok, data } = await fetchApi('/products');
        expect(ok).toBe(true);
        expect(Array.isArray(data)).toBe(true);
    });

    it('should fetch production records', async () => {
        const now = new Date();
        const query = `?year=${now.getFullYear()}&month=${now.getMonth() + 1}`;
        const { ok, data } = await fetchApi(`/production-records${query}`);
        expect(ok).toBe(true);
        expect(Array.isArray(data)).toBe(true);
    });

    it('should fetch configuration', async () => {
        const { ok, data } = await fetchApi('/config');
        expect(ok).toBe(true);
        // Config might be empty object if not set, but request should succeed
        expect(typeof data).toBe('object');
    });

    it('should fetch monthly data', async () => {
        const now = new Date();
        const query = `?year=${now.getFullYear()}&month=${now.getMonth() + 1}`;
        const { ok } = await fetchApi(`/monthly-data${query}`);
        // It might return null but status should be 200
        expect(ok).toBe(true);
    });
});
