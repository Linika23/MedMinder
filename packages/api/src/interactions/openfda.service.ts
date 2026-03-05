// ============================================================
// OpenFDA Drug Interaction Data Provider
// Queries the free OpenFDA Drug Label API for interaction data
// ============================================================

import { Injectable, Logger } from '@nestjs/common';

interface RawInteraction {
    drugA: string;
    drugB: string;
    description: string;
    severity: 'critical' | 'major' | 'moderate' | 'mild' | 'none';
    mechanism?: string;
    symptoms: string[];
    source: string;
}

@Injectable()
export class OpenFdaService {
    private readonly logger = new Logger(OpenFdaService.name);
    private readonly BASE_URL = 'https://api.fda.gov/drug';

    /**
     * Look up known interactions for a drug by name.
     * Uses the OpenFDA Drug Label API (drug_interactions field).
     */
    async getInteractionsForDrug(drugName: string): Promise<string[]> {
        try {
            const query = encodeURIComponent(`openfda.brand_name:"${drugName}" OR openfda.generic_name:"${drugName}"`);
            const url = `${this.BASE_URL}/label.json?search=${query}&limit=1`;

            const res = await fetch(url);
            if (!res.ok) return [];

            const data = await res.json();
            const label = data?.results?.[0];

            // drug_interactions is an array of strings in the label
            return label?.drug_interactions || [];
        } catch (error) {
            this.logger.warn(`OpenFDA lookup failed for ${drugName}: ${error}`);
            return [];
        }
    }

    /**
     * Check for pairwise interaction between two drugs.
     * Searches each drug's label for mention of the other drug.
     */
    async checkPairInteraction(drugA: string, drugB: string): Promise<RawInteraction | null> {
        const [interactionsA, interactionsB] = await Promise.all([
            this.getInteractionsForDrug(drugA),
            this.getInteractionsForDrug(drugB),
        ]);

        // Search drug A's interactions for mentions of drug B and vice versa
        const matchA = this.findMention(interactionsA, drugB);
        const matchB = this.findMention(interactionsB, drugA);

        const description = matchA || matchB;
        if (!description) return null;

        const severity = this.classifySeverity(description);

        return {
            drugA,
            drugB,
            description,
            severity,
            mechanism: this.extractMechanism(description),
            symptoms: this.extractSymptoms(description),
            source: 'OpenFDA',
        };
    }

    /**
     * Check all pairwise combinations from a list of drug names.
     */
    async checkAllPairs(drugNames: string[]): Promise<RawInteraction[]> {
        const interactions: RawInteraction[] = [];
        const pairs: [string, string][] = [];

        // Generate unique pairs
        for (let i = 0; i < drugNames.length; i++) {
            for (let j = i + 1; j < drugNames.length; j++) {
                pairs.push([drugNames[i], drugNames[j]]);
            }
        }

        // Check all pairs concurrently (with concurrency limit)
        const BATCH_SIZE = 5;
        for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
            const batch = pairs.slice(i, i + BATCH_SIZE);
            const results = await Promise.all(
                batch.map(([a, b]) => this.checkPairInteraction(a, b)),
            );
            for (const r of results) {
                if (r) interactions.push(r);
            }
        }

        return interactions;
    }

    /**
     * Look up adverse events for a drug via the OpenFDA Adverse Events API.
     */
    async getAdverseEvents(drugName: string, limit = 5) {
        try {
            const url = `${this.BASE_URL}/event.json?search=patient.drug.openfda.brand_name:"${encodeURIComponent(drugName)}"&count=patient.reaction.reactionmeddrapt.exact&limit=${limit}`;
            const res = await fetch(url);
            if (!res.ok) return [];

            const data = await res.json();
            return (data?.results || []).map((r: any) => ({
                reaction: r.term,
                count: r.count,
            }));
        } catch {
            return [];
        }
    }

    // --- Private helpers ---

    private findMention(interactionTexts: string[], drugName: string): string | null {
        const normalised = drugName.toLowerCase();
        for (const text of interactionTexts) {
            if (text.toLowerCase().includes(normalised)) {
                return text;
            }
        }
        return null;
    }

    private classifySeverity(text: string): RawInteraction['severity'] {
        const lower = text.toLowerCase();

        const criticalKeywords = ['contraindicated', 'fatal', 'life-threatening', 'do not use', 'must not', 'never'];
        const majorKeywords = ['serious', 'significant', 'avoid', 'dangerous', 'severe', 'should not be'];
        const moderateKeywords = ['caution', 'monitor', 'may increase', 'may decrease', 'may enhance', 'may reduce'];
        const mildKeywords = ['minor', 'unlikely', 'minimal', 'slight'];

        if (criticalKeywords.some((k) => lower.includes(k))) return 'critical';
        if (majorKeywords.some((k) => lower.includes(k))) return 'major';
        if (moderateKeywords.some((k) => lower.includes(k))) return 'moderate';
        if (mildKeywords.some((k) => lower.includes(k))) return 'mild';
        return 'moderate'; // default if uncertain
    }

    private extractMechanism(text: string): string | undefined {
        // Try to extract mechanism from phrases like "because...", "due to...", "by inhibiting..."
        const patterns = [
            /(?:because|due to|owing to|as a result of)\s+(.+?)(?:\.|$)/i,
            /(?:by\s+(?:inhibiting|blocking|enhancing|reducing|increasing))\s+(.+?)(?:\.|$)/i,
            /(?:mechanism[:\s]+)(.+?)(?:\.|$)/i,
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) return match[0].trim();
        }
        return undefined;
    }

    private extractSymptoms(text: string): string[] {
        const symptomKeywords = [
            'bleeding', 'hypotension', 'hyperkalemia', 'hypoglycemia', 'serotonin syndrome',
            'rhabdomyolysis', 'QT prolongation', 'arrhythmia', 'seizures', 'liver damage',
            'kidney damage', 'respiratory depression', 'drowsiness', 'dizziness', 'nausea',
            'vomiting', 'headache', 'rash', 'edema', 'bradycardia', 'tachycardia',
            'hypertension', 'renal impairment', 'hepatotoxicity', 'nephrotoxicity',
        ];

        const lower = text.toLowerCase();
        return symptomKeywords.filter((s) => lower.includes(s.toLowerCase()));
    }
}
