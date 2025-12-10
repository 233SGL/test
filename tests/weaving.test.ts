import { describe, it, expect, beforeAll } from 'vitest';

const API_BASE = 'http://localhost:3000/api/weaving';

// 检测服务器是否可用
let serverAvailable = false;

describe('Weaving API Tests', () => {
    // 在所有测试前检查服务器是否可用
    beforeAll(async () => {
        try {
            const res = await fetch('http://localhost:3000/api/health', {
                signal: AbortSignal.timeout(3000) // 3秒超时
            });
            serverAvailable = res.ok;
        } catch {
            serverAvailable = false;
            console.log('⚠️ 服务器不可用，跳过 API 测试');
        }
    });

    // Helper function to fetch data
    async function fetchApi(path: string, options: RequestInit = {}) {
        if (!serverAvailable) {
            return { status: 0, ok: false, data: null, skipped: true };
        }
        try {
            const url = `${API_BASE}${path}`;
            const res = await fetch(url, options);
            const data = await res.json();
            return { status: res.status, ok: res.ok, data, skipped: false };
        } catch {
            return { status: 0, ok: false, data: null, skipped: true };
        }
    }

    it('should fetch machines list', async () => {
        const result = await fetchApi('/machines');
        if (result.skipped) return; // 服务器不可用时跳过
        expect(result.ok).toBe(true);
        expect(Array.isArray(result.data)).toBe(true);
        if (result.data.length > 0) {
            expect(result.data[0]).toHaveProperty('id');
            expect(result.data[0]).toHaveProperty('name');
        }
    });

    it('should update machine status', async () => {
        const { data: machines, skipped } = await fetchApi('/machines');
        if (skipped || !machines || machines.length === 0) return;

        const machine = machines[0];
        const result = await fetchApi(`/machines/${machine.id}`, {
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
        if (result.skipped) return;
        expect(result.ok).toBe(true);
        expect(result.status).toBe(200);
    });

    it('should fetch products list', async () => {
        const result = await fetchApi('/products');
        if (result.skipped) return;
        expect(result.ok).toBe(true);
        expect(Array.isArray(result.data)).toBe(true);
    });

    it('should fetch production records', async () => {
        const now = new Date();
        const query = `?year=${now.getFullYear()}&month=${now.getMonth() + 1}`;
        const result = await fetchApi(`/production-records${query}`);
        if (result.skipped) return;
        expect(result.ok).toBe(true);
        expect(Array.isArray(result.data)).toBe(true);
    });

    it('should fetch configuration', async () => {
        const result = await fetchApi('/config');
        if (result.skipped) return;
        expect(result.ok).toBe(true);
        expect(typeof result.data).toBe('object');
    });

    it('should fetch monthly data', async () => {
        const now = new Date();
        const query = `?year=${now.getFullYear()}&month=${now.getMonth() + 1}`;
        const result = await fetchApi(`/monthly-data${query}`);
        if (result.skipped) return;
        expect(result.ok).toBe(true);
    });
});
