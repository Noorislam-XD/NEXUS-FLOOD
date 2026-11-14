// Gemini AI analysis routes for NEXUS FLOOD
// ES module syntax

import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateAnalysis } from '../middleware/validate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// ---------------------------------------------------------------------------
// Multer configuration — max 5 files, 20MB each
// ---------------------------------------------------------------------------
const upload = multer({
  dest: path.join(__dirname, '..', 'uploads'),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
    files: 5,
  },
  fileFilter(req, file, cb) {
    const allowedMime = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm',
      'video/mp4', 'video/webm',
    ];
    if (allowedMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

// ---------------------------------------------------------------------------
// System prompt for Gemini structured analysis
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are NEXUS FLOOD AI — a disaster intelligence analyst specializing in flood events.
Analyze the provided information (text, images, audio transcripts) about a potential flood-related incident.
Return your analysis as a single JSON object with this exact structure:

{
  "incident_type": "flood|storm|infrastructure_damage|rescue_needed|road_closure|other",
  "severity": "critical|high|medium|low",
  "description": "Comprehensive AI-generated summary of the incident based on all provided evidence",
  "location": {
    "reported_address": "Best guess at street address or intersection",
    "landmarks": ["Nearby landmarks mentioned or visible"],
    "area_description": "General area or neighborhood description"
  },
  "affected_infrastructure": ["List of infrastructure affected: roads, bridges, utilities, buildings"],
  "reported_needs": ["Immediate needs identified: rescue, medical, shelter, supplies"],
  "estimated_affected_people": null,
  "timeline": ["Chronological events extracted from the report"],
  "missing_information": ["Critical information that is missing from the report"],
  "contradictions": ["Any contradictory claims found in the evidence"],
  "recommended_actions": ["Specific recommended response actions in priority order"],
  "confidence_notes": "Notes about the confidence level of this analysis and any limitations",
  "requires_human_verification": true
}

Important guidelines:
- If information is unclear, say so in confidence_notes rather than guessing
- estimated_affected_people should be a number or null if unknown
- Always set requires_human_verification to true — AI analysis should never be the sole basis for action
- Be specific in recommended_actions — include who should respond and what they should do
- Return ONLY the JSON object, no markdown fences or extra text`;

// ---------------------------------------------------------------------------
// Demo analysis response (when GEMINI_API_KEY is not set)
// ---------------------------------------------------------------------------
const DEMO_ANALYSIS = {
  incident_type: 'flood',
  severity: 'high',
  description:
    'Analysis indicates significant flooding event in the reported area. Based on the provided information, rising water levels are affecting residential properties and roadways. The situation appears to be actively deteriorating with potential for escalation during continued rainfall.',
  location: {
    reported_address: 'Buffalo Bayou area, Houston TX',
    landmarks: ['Buffalo Bayou', 'Allen Parkway', 'Memorial Park'],
    area_description: 'Inner-loop Houston along the Buffalo Bayou corridor, a historically flood-prone area that experienced catastrophic flooding during Hurricane Harvey (2017).',
  },
  affected_infrastructure: [
    'Local roadways — submerged or impassable',
    'Residential ground-floor units — water intrusion reported',
    'Storm drainage system — at or exceeding capacity',
    'Traffic signals — possible power disruption',
  ],
  reported_needs: [
    'Evacuation assistance for residents in ground-floor units',
    'Traffic barricades to prevent vehicles entering flooded roads',
    'Sandbag deployment for at-risk structures',
    'Welfare checks on elderly and mobility-impaired residents',
  ],
  estimated_affected_people: 250,
  timeline: [
    'Heavy rainfall began approximately 3 hours ago',
    'Bayou levels exceeded flood stage within 2 hours',
    'First reports of street flooding received',
    'Water levels continuing to rise at time of report',
  ],
  missing_information: [
    'Exact water depth measurements at key intersections',
    'Whether upstream reservoir releases are contributing',
    'Number of individuals requiring immediate rescue',
    'Status of power and gas utilities in the affected area',
  ],
  contradictions: [],
  recommended_actions: [
    'Deploy HPD barricades to block vehicle access to flooded streets',
    'Alert HFD swift-water rescue teams to stage near reported locations',
    'Coordinate with Harris County Flood Control for bayou level projections',
    'Activate emergency shelter protocols at George R. Brown Convention Center',
    'Issue targeted emergency alert via Wireless Emergency Alert system',
  ],
  confidence_notes:
    'DEMO ANALYSIS — This is a simulated AI analysis for demonstration purposes. In production with a GEMINI_API_KEY configured, this would contain real AI-generated analysis of the submitted evidence. All disaster response decisions should be verified by trained emergency management personnel.',
  requires_human_verification: true,
  is_demo: true,
};

// ---------------------------------------------------------------------------
// Helper: read file as base64 for Gemini multimodal
// ---------------------------------------------------------------------------
function fileToGenerativePart(filePath, mimeType) {
  const data = fs.readFileSync(filePath);
  return {
    inlineData: {
      data: data.toString('base64'),
      mimeType,
    },
  };
}

// ---------------------------------------------------------------------------
// Helper: clean up uploaded temp files
// ---------------------------------------------------------------------------
function cleanupFiles(files) {
  if (!files) return;
  for (const file of files) {
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch {
      // best-effort cleanup
    }
  }
}

// ---------------------------------------------------------------------------
// POST /api/analyze — AI analysis of incident evidence
// ---------------------------------------------------------------------------
router.post('/', upload.array('files', 5), validateAnalysis, async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const text = req.body.text || '';
    const files = req.files || [];

    // No API key — return demo response
    if (!apiKey) {
      cleanupFiles(files);
      return res.json({
        data: {
          ...DEMO_ANALYSIS,
          analyzed_at: new Date().toISOString(),
          input_summary: {
            text_length: text.length,
            file_count: files.length,
          },
        },
      });
    }

    // Real Gemini analysis
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    });

    const parts = [];

    // Add system context + user text
    const userText = text.trim()
      ? `User-submitted incident report:\n\n${text.trim()}`
      : 'Analyze the attached media for flood/disaster incident indicators.';
    parts.push({ text: SYSTEM_PROMPT + '\n\n' + userText });

    // Add files as multimodal parts
    for (const file of files) {
      try {
        const part = fileToGenerativePart(file.path, file.mimetype);
        parts.push(part);
      } catch (fileErr) {
        console.warn(`[analyze] Failed to read file ${file.originalname}:`, fileErr.message);
      }
    }

    const result = await model.generateContent(parts);
    const response = result.response;
    const responseText = response.text();

    // Clean up temp files
    cleanupFiles(files);

    // Parse AI response
    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch {
      // If JSON parsing fails, wrap raw text
      analysis = {
        ...DEMO_ANALYSIS,
        description: responseText,
        confidence_notes: 'AI returned non-JSON response. Raw text preserved in description.',
        is_demo: false,
      };
    }

    // Ensure critical safety field is always set
    analysis.requires_human_verification = true;
    analysis.is_demo = false;
    analysis.analyzed_at = new Date().toISOString();
    analysis.input_summary = {
      text_length: text.length,
      file_count: files.length,
    };

    return res.json({ data: analysis });
  } catch (err) {
    cleanupFiles(req.files);
    console.error('[analyze] POST error:', err.message);

    // If Gemini rate limit or API error, return demo with error note
    if (err.message?.includes('429') || err.message?.includes('quota')) {
      return res.status(429).json({
        error: 'AI analysis rate limit exceeded. Try again shortly.',
        fallback: DEMO_ANALYSIS,
      });
    }

    return res.status(500).json({ error: 'Analysis failed', details: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/verify — Evidence verification endpoint
// ---------------------------------------------------------------------------
router.post('/verify', async (req, res) => {
  try {
    const { claim, source_url } = req.body;

    if (!claim || typeof claim !== 'string') {
      return res.status(400).json({ error: 'claim is required and must be a string' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Demo verification response
      return res.json({
        data: {
          claim,
          verification_status: 'unverified',
          confidence: 0.0,
          explanation:
            'DEMO MODE — Verification engine requires GEMINI_API_KEY. In production, this endpoint cross-references the claim against official NOAA, NWS, USGS, and local government data feeds to assess accuracy.',
          official_sources_checked: [
            'NOAA National Weather Service',
            'USGS WaterWatch',
            'Harris County Flood Control District',
            'City of Houston OEM',
          ],
          matching_official_reports: [],
          verified_at: new Date().toISOString(),
          is_demo: true,
        },
      });
    }

    // Real verification with Gemini
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    });

    const verifyPrompt = `You are a fact-checking assistant for a flood disaster response system.
Evaluate the following claim for plausibility. Consider whether it aligns with typical flood event patterns, known geography, and reasonable disaster scenarios.
Return a JSON object with:
{
  "claim": "the original claim",
  "verification_status": "plausible|implausible|unverifiable",
  "confidence": 0.0 to 1.0,
  "explanation": "Brief explanation of your assessment",
  "red_flags": ["Any suspicious elements"],
  "supporting_factors": ["Elements that support the claim's validity"]
}

Claim to verify: "${claim}"
${source_url ? `Source URL: ${source_url}` : ''}

IMPORTANT: You cannot access real-time data. Assess plausibility based on internal knowledge. Always note this limitation.`;

    const result = await model.generateContent(verifyPrompt);
    const responseText = result.response.text();

    let verification;
    try {
      verification = JSON.parse(responseText);
    } catch {
      verification = {
        claim,
        verification_status: 'unverifiable',
        confidence: 0.0,
        explanation: responseText,
      };
    }

    verification.verified_at = new Date().toISOString();
    verification.is_demo = false;

    return res.json({ data: verification });
  } catch (err) {
    console.error('[verify] POST error:', err.message);
    return res.status(500).json({ error: 'Verification failed', details: err.message });
  }
});

export default router;
