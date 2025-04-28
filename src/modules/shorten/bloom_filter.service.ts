import { Injectable } from "@nestjs/common";
import { BloomFilter } from "bloom-filters";

@Injectable()
export class BloomFilterService {
    private filter: BloomFilter = new BloomFilter(10, 4)
    constructor() {
        const m = 95850583; 
        const k = 6;
        this.filter = new BloomFilter(m, k);
    }

    add(value: string): void {
        this.filter.add(value);
    }

    mightContain(value: string): boolean {
        return this.filter.has(value);
    }

    getSize(): number {
        return this.filter.size;
    }
}