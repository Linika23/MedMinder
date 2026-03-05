// ============================================================
// AI Summary Service — Claude API Integration
// Generates patient-friendly summaries of drug interactions
// ============================================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface InteractionInput {
    drugA: string;
    drugADosage?: string;
    drugB: string;
    drugBDosage?: string;
    severity: string;
    rawDescription: string;
    mechanism?: string;
    symptoms: string[];
    patientConditions?: string[];
    patientAge?: number;
}

interface AiSummaryResult {
    summary: string;
    recommendations: string[];
    simplifiedMechanism?: string;
    riskFactors: string[];
}

@Injectable()
export class AiSummaryService {
    private readonly logger = new Logger(AiSummaryService.name);
    private readonly apiKey: string;
    private readonly model = 'claude-sonnet-4-20250514';

    constructor(private readonly config: ConfigService) {
        this.apiKey = this.config.get<string>('ANTHROPIC_API_KEY') || '';
    }

    /**
     * Generate a patient-friendly AI summary for a drug interaction.
     * Falls back to a template-based summary if the API is unavailable.
     */
    async generateSummary(input: InteractionInput): Promise<AiSummaryResult> {
        // If no API key, use intelligent fallback
        if (!this.apiKey) {
            this.logger.warn('No Anthropic API key configured — using template summary');
            return this.generateFallbackSummary(input);
        }

        try {
            const prompt = this.buildPrompt(input);
            const response = await this.callClaudeApi(prompt);
            return this.parseResponse(response, input);
        } catch (error) {
            this.logger.error(`Claude API call failed: ${error}`);
            return this.generateFallbackSummary(input);
        }
    }

    /**
     * Batch-generate summaries for multiple interactions.
     */
    async generateBatchSummaries(inputs: InteractionInput[]): Promise<AiSummaryResult[]> {
        // Process sequentially to respect rate limits
        const results: AiSummaryResult[] = [];
        for (const input of inputs) {
            const result = await this.generateSummary(input);
            results.push(result);
            // Small delay between API calls to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 200));
        }
        return results;
    }

    private buildPrompt(input: InteractionInput): string {
        let context = '';
        if (input.patientAge) context += `Patient age: ${input.patientAge}. `;
        if (input.patientConditions?.length) context += `Conditions: ${input.patientConditions.join(', ')}. `;

        return `You are a clinical pharmacist assistant. Generate a patient-friendly summary of this drug interaction. Use plain, non-technical language suitable for elderly patients. Be factual and avoid alarming language.

INTERACTION:
- Drug A: ${input.drugA}${input.drugADosage ? ` (${input.drugADosage})` : ''}
- Drug B: ${input.drugB}${input.drugBDosage ? ` (${input.drugBDosage})` : ''}
- Severity: ${input.severity}
- Clinical description: ${input.rawDescription}
${input.mechanism ? `- Mechanism: ${input.mechanism}` : ''}
${input.symptoms.length ? `- Known symptoms: ${input.symptoms.join(', ')}` : ''}
${context ? `\nPATIENT CONTEXT: ${context}` : ''}

Respond in this exact JSON format:
{
  "summary": "2-3 sentence patient-friendly explanation of the interaction",
  "recommendations": ["actionable recommendation 1", "recommendation 2", "recommendation 3"],
  "simplifiedMechanism": "1 sentence plain-language explanation of why this happens",
  "riskFactors": ["risk factor that makes this interaction worse"]
}

IMPORTANT: Keep the summary at a 6th-grade reading level. Do not provide medical advice — frame recommendations as discussion topics with their doctor.`;
    }

    private async callClaudeApi(prompt: string): Promise<string> {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: 500,
                messages: [
                    { role: 'user', content: prompt },
                ],
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Claude API error ${response.status}: ${error}`);
        }

        const data = await response.json();
        return data.content?.[0]?.text || '';
    }

    private parseResponse(rawText: string, input: InteractionInput): AiSummaryResult {
        try {
            // Extract JSON from response (handle markdown code blocks)
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No JSON found in response');

            const parsed = JSON.parse(jsonMatch[0]);

            return {
                summary: parsed.summary || input.rawDescription,
                recommendations: parsed.recommendations || [],
                simplifiedMechanism: parsed.simplifiedMechanism,
                riskFactors: parsed.riskFactors || [],
            };
        } catch {
            this.logger.warn('Failed to parse Claude response, using fallback');
            return this.generateFallbackSummary(input);
        }
    }

    /**
     * Template-based fallback when Claude API is unavailable.
     * Provides useful information without AI.
     */
    private generateFallbackSummary(input: InteractionInput): AiSummaryResult {
        const severityText: Record<string, string> = {
            critical: 'a very serious interaction that requires immediate attention',
            major: 'a significant interaction that may need a medication change',
            moderate: 'a moderate interaction worth discussing with your doctor',
            mild: 'a minor interaction that is generally considered low-risk',
            none: 'no known interaction between these medications',
        };

        const summary = `${input.drugA} and ${input.drugB} have ${severityText[input.severity] || 'an interaction'}. ${input.rawDescription}`;

        const recommendations: string[] = [];
        if (input.severity === 'critical' || input.severity === 'major') {
            recommendations.push('Discuss this interaction with your doctor as soon as possible');
            recommendations.push('Do not stop any medication without medical advice');
        }
        if (input.severity === 'moderate') {
            recommendations.push('Mention this interaction at your next doctor visit');
            recommendations.push('Monitor for any new or unusual symptoms');
        }
        if (input.symptoms.length > 0) {
            recommendations.push(`Watch for these symptoms: ${input.symptoms.join(', ')}`);
        }
        recommendations.push('Keep a list of all your medications for your healthcare providers');

        return {
            summary,
            recommendations,
            simplifiedMechanism: input.mechanism,
            riskFactors: input.patientConditions || [],
        };
    }
}
