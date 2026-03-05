// ============================================================
// Drugs Service — RxNorm & OpenFDA Drug Search
// ============================================================

import { Injectable } from '@nestjs/common';

const RXNORM_BASE = 'https://rxnav.nlm.nih.gov/REST';
const OPENFDA_BASE = 'https://api.fda.gov/drug';

@Injectable()
export class DrugsService {
    async searchByName(query: string, limit = 10) {
        try {
            const url = `${RXNORM_BASE}/approximateTerm.json?term=${encodeURIComponent(query)}&maxEntries=${limit}`;
            const response = await fetch(url);
            const data = await response.json();

            const candidates = data?.approximateGroup?.candidate || [];
            return candidates.map((c: any) => ({
                rxcui: c.rxcui,
                name: c.name || query,
                score: c.score,
            }));
        } catch {
            return [];
        }
    }

    async lookupByNdc(ndcCode: string) {
        try {
            const url = `${OPENFDA_BASE}/ndc.json?search=product_ndc:"${ndcCode}"&limit=1`;
            const response = await fetch(url);
            const data = await response.json();

            const result = data?.results?.[0];
            if (!result) return null;

            return {
                name: result.brand_name || result.generic_name,
                genericName: result.generic_name,
                brandName: result.brand_name,
                dosageForm: result.dosage_form,
                strength: result.active_ingredients?.[0]?.strength,
                manufacturer: result.labeler_name,
                ndc: ndcCode,
            };
        } catch {
            return null;
        }
    }

    async getDrugDetails(rxcui: string) {
        try {
            const url = `${RXNORM_BASE}/rxcui/${rxcui}/properties.json`;
            const response = await fetch(url);
            const data = await response.json();
            const props = data?.properties;
            if (!props) return null;

            return {
                rxcui: props.rxcui,
                name: props.name,
                synonym: props.synonym,
                tty: props.tty,
            };
        } catch {
            return null;
        }
    }
}
