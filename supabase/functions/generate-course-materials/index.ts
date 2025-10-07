import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CourseData {
  id: string;
  title: string;
  subject: string;
  duration: string;
  level: string;
  environment: string;
  participant_type: string;
  tone: string;
  language: string;
}

interface GenerationStep {
  step_name: string;
  step_order: number;
  display_name: string;
  material_type: string;
  dependencies: string[];
  ai_prompt_template: string;
}

interface ValidationResult {
  level: 'PASS' | 'WARNING' | 'CRITICAL';
  errors: string[];
  warnings: string[];
  metadata?: {
    bloom_levels?: string[];
    merrill_principles?: string[];
    bloom_coverage_percent?: number;
    merrill_coverage_percent?: number;
    terminology_consistency?: number;
    [key: string]: any; // Allow additional properties
  };
}

interface CumulativeContext {
  terminology: string[];
  key_concepts: string[];
  bloom_levels_used: string[];
  learning_outcomes: string[];
  duration_constraints: {
    total_minutes: number;
    allocated_minutes: number;
    remaining_minutes: number;
  };
  forbidden_new_topics: boolean;
  materials_summary: {
    [key: string]: {
      content_preview: string;
      key_points: string[];
    };
  };
}

// Universal System Prompt - applies to ALL materials
const UNIVERSAL_SYSTEM_PROMPT = `You are an expert instructional designer with deep knowledge of Bloom's Taxonomy and Merrill's Principles of Instruction.

CRITICAL RULES (MUST FOLLOW):
1. ONLY use concepts, terminology, and topics already introduced in previous materials (if provided in context)
2. DO NOT introduce new topics not mentioned in the Agenda or Objectives
3. Maintain STRICT consistency with previous materials - use exact same terminology
4. ALL learning activities must align with specific Bloom's Taxonomy levels
5. ALL content must follow Merrill's 5 Principles: Activation, Demonstration, Application, Integration, Task-centered

BLOOM'S TAXONOMY LEVELS (use these exact terms):
- Remember: Recall facts, terms, concepts
- Understand: Explain ideas, summarize, interpret
- Apply: Use information in new situations, execute procedures
- Analyze: Draw connections, organize, differentiate
- Evaluate: Justify decisions, critique, assess
- Create: Design, construct, produce new work

MERRILL'S PRINCIPLES (must include ALL 5):
1. Activation: Connect to existing knowledge
2. Demonstration: Show examples and non-examples
3. Application: Let learners practice with guidance
4. Integration: Encourage learners to integrate new knowledge
5. Task-centered: Focus on real-world tasks

OUTPUT FORMAT:
- For structured materials (Agenda, Objectives, Exercises, Assessment, Resources): Output ONLY valid JSON
- For content materials (Slides, Trainer Notes, Manual): Output Markdown with JSON metadata at the end

VALIDATION REQUIREMENTS:
- Bloom coverage: Minimum 60% of levels used (at least 4 out of 6)
- Merrill coverage: ALL 5 principles must be present (100%)
- Consistency: 100% terminology match with previous materials
- No new topics allowed after Agenda is set`;

// Material-specific prompts
const PROMPTS = {
  objectives: `Generate comprehensive learning objectives in JSON format.

This is the FIRST material to be generated. Base it ONLY on course details, NOT on any agenda.

CONTEXT:
- Course: {title}
- Subject: {subject}
- Duration: {duration}
- Level: {level}
- Environment: {environment}
- Participants: {participants}
- Tone: {tone}

INSTRUCTION:
Define clear, measurable learning objectives that:
1. Set the thematic framework for the entire course
2. Are appropriate for {participants} in a {environment} environment
3. Cover different Bloom levels (at least 4 out of 6)
4. Can be realistically achieved in {duration}
5. Match the {level} difficulty level

OUTPUT JSON STRUCTURE:
{
  "objectives": {
    "course_overview": "Brief overview of what the course covers",
    "learning_outcomes": [
      {
        "outcome": "Clear, specific learning outcome",
        "bloom_level": "One of: Remember, Understand, Apply, Analyze, Evaluate, Create",
        "success_criteria": "How this will be measured"
      }
    ],
    "prerequisites": ["Any required prior knowledge"],
    "target_skills": ["Key skills participants will develop"],
    "pedagogical_metadata": {
      "bloom_levels": ["List all bloom levels used"],
      "bloom_coverage_percent": 60-100,
      "merrill_principles": ["All 5: Activation, Demonstration, Application, Integration, Task-centered"],
      "merrill_coverage_percent": 100,
      "terminology_consistency": 100,
      "participant_adaptation": "How content is adapted for {participants}"
    }
  }
}

CRITICAL: This defines the scope. Agenda and all subsequent materials must align with ONLY these objectives.`,

  agenda: `Generate a detailed course agenda in JSON format that STRICTLY FOLLOWS the Learning Objectives.

CUMULATIVE CONTEXT:
{cumulative_context}

PREVIOUS MATERIALS:
{previous_materials}

CRITICAL RULES:
- DO NOT introduce topics not in the Objectives
- Use EXACT terminology from Objectives
- Total duration MUST equal {duration}
- Adapt activities and pace for {participants}
- Environment: {environment}

OUTPUT JSON STRUCTURE:
{
  "agenda": {
    "sessions": [
      {
        "session_number": 1,
        "title": "Session title from objectives",
        "duration_minutes": 60,
        "topics": ["Topics ONLY from objectives"],
        "activities": ["Appropriate for {participants}"],
        "bloom_levels": ["Levels for this session"],
        "merrill_principle": "Primary principle for this session"
      }
    ],
    "breaks": [
      { "after_session": 2, "duration_minutes": 15, "type": "coffee break" }
    ],
    "total_duration_minutes": "Must match {duration}",
    "pedagogical_metadata": {
      "bloom_levels": ["All levels used across agenda"],
      "bloom_coverage_percent": 60-100,
      "merrill_principles": ["All 5 must be represented"],
      "merrill_coverage_percent": 100,
      "terminology_consistency": 100,
      "participant_engagement_strategies": "Strategies for {participants}"
    }
  }
}

VALIDATION:
- Bloom coverage >= 60%
- Merrill = 100% (all 5 principles across sessions)
- Total time matches {duration}
- All topics from objectives covered`,

  slides: `CUMULATIVE CONTEXT:
{cumulative_context}

COURSE INFORMATION:
- Subject: {subject}
- Duration: {duration}
- Level: {level}
- Tone: {tone}
- Participants: {participants}
- Environment: {environment}

OUTPUT REQUIREMENTS:
Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:

{
  "agenda": {
    "title": "Course Title",
    "total_duration_minutes": 480,
    "sessions": [
      {
        "session_number": 1,
        "title": "Session Title",
        "duration_minutes": 60,
        "bloom_levels": ["Remember", "Understand"],
        "merrill_principles": ["Activation", "Demonstration"],
        "topics": [
          {
            "title": "Topic Title",
            "duration_minutes": 30,
            "bloom_level": "Understand",
            "merrill_principle": "Demonstration",
            "description": "What will be covered"
          }
        ],
        "break_after": true,
        "break_duration_minutes": 15
      }
    ],
    "total_breaks_minutes": 60,
    "pedagogical_metadata": {
      "bloom_levels_distribution": {
        "Remember": 20,
        "Understand": 30,
        "Apply": 30,
        "Analyze": 15,
        "Evaluate": 5,
        "Create": 0
      },
      "merrill_principles_coverage": {
        "Activation": 15,
        "Demonstration": 25,
        "Application": 30,
        "Integration": 20,
        "Task-centered": 10
      },
      "bloom_coverage_percent": 83,
      "merrill_coverage_percent": 100
    }
  }
}

VALIDATION RULES:
- Total duration must match {duration}
- Each session must have at least 1 Bloom level and 1 Merrill principle
- Bloom coverage must be >= 60%
- Merrill coverage must be 100% (all 5 principles)
- All durations must sum correctly`,

  objectives: `Generate comprehensive learning objectives in JSON format.

CUMULATIVE CONTEXT:
{cumulative_context}

PREVIOUS MATERIALS:
{agenda_content}

COURSE INFORMATION:
- Subject: {subject}
- Duration: {duration}
- Level: {level}
- Tone: {tone}
- Language: {language}

CRITICAL: Use ONLY topics and terminology from the Agenda above. DO NOT introduce new topics.

OUTPUT REQUIREMENTS:
Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:

{
  "objectives": {
    "course_overview": "Brief description of the course",
    "learning_outcomes": [
      {
        "id": "LO1",
        "statement": "By the end of this course, participants will be able to...",
        "bloom_level": "Apply",
        "merrill_principle": "Application",
        "aligned_sessions": [1, 2],
        "assessment_method": "How this will be assessed",
        "success_criteria": "What success looks like"
      }
    ],
    "prerequisites": [
      "Required prior knowledge or skills"
    ],
    "pedagogical_metadata": {
      "bloom_levels_used": ["Remember", "Understand", "Apply", "Analyze"],
      "merrill_principles_used": ["Activation", "Demonstration", "Application", "Integration", "Task-centered"],
      "bloom_coverage_percent": 67,
      "merrill_coverage_percent": 100,
      "alignment_score": 95
    }
  }
}

VALIDATION RULES:
- Each objective must align with agenda sessions
- Must use terminology from Agenda (use exact terms)
- Bloom coverage must be >= 60%
- Merrill coverage must be 100%
- Each objective must have clear success criteria`,

  slides: `Generate presentation slides in Markdown format with pedagogical metadata.

CUMULATIVE CONTEXT:
{cumulative_context}

PREVIOUS MATERIALS:
AGENDA: {agenda_content}
OBJECTIVES: {objectives_content}

COURSE INFORMATION:
- Subject: {subject}
- Duration: {duration}
- Level: {level}
- Tone: {tone}
- Language: {language}

CRITICAL CONSTRAINTS:
- Use ONLY topics from Agenda
- Align with Learning Objectives
- Use exact terminology from previous materials
- DO NOT introduce new concepts

OUTPUT FORMAT:
Create slides in Markdown, then add JSON metadata at the end.

# Slide 1: [Title]

**Bloom Level:** [Remember/Understand/Apply/Analyze/Evaluate/Create]
**Merrill Principle:** [Activation/Demonstration/Application/Integration/Task-centered]

[Content here - bullet points, examples, etc.]

---

# Slide 2: [Title]

[Continue for all slides...]

---

## PEDAGOGICAL_METADATA
\`\`\`json
{
  "total_slides": 45,
  "slides_by_bloom": {
    "Remember": 8,
    "Understand": 12,
    "Apply": 15,
    "Analyze": 7,
    "Evaluate": 2,
    "Create": 1
  },
  "slides_by_merrill": {
    "Activation": 5,
    "Demonstration": 12,
    "Application": 15,
    "Integration": 8,
    "Task-centered": 5
  },
  "bloom_coverage_percent": 100,
  "merrill_coverage_percent": 100,
  "key_concepts": ["concept1", "concept2"],
  "terminology_consistency": 100
}
\`\`\`

VALIDATION RULES:
- Each slide must have explicit Bloom level and Merrill principle
- Bloom coverage >= 60%
- Merrill coverage = 100%
- 100% terminology match with Agenda/Objectives`,

  trainer_notes: `Generate comprehensive trainer notes in Markdown format with pedagogical guidance.

CUMULATIVE CONTEXT:
{cumulative_context}

PREVIOUS MATERIALS:
AGENDA: {agenda_content}
OBJECTIVES: {objectives_content}
SLIDES: {slides_content}

COURSE INFORMATION:
- Subject: {subject}
- Duration: {duration}
- Level: {level}
- Tone: {tone}
- Language: {language}

CRITICAL: Provide guidance for delivering content from Slides. DO NOT add new topics.

OUTPUT FORMAT:
Create trainer notes in Markdown, organized by session/slide, then add JSON metadata at the end.

# Session 1: [Title]

## Slide 1-3: [Topic]

**Bloom Focus:** [Level]
**Merrill Principle:** [Principle]
**Duration:** [X] minutes

### Trainer Instructions:
- [Specific guidance for delivery]
- [Common misconceptions to address]
- [Questions to ask learners]

### Differentiation Strategies:
- **For beginners:** [Adaptation]
- **For advanced:** [Extension]

### Assessment Check:
- [How to verify understanding]

---

[Continue for all sessions/slides...]

---

## PEDAGOGICAL_METADATA
\`\`\`json
{
  "total_teaching_points": 30,
  "bloom_alignment": 100,
  "merrill_alignment": 100,
  "differentiation_strategies": 15,
  "assessment_checkpoints": 8,
  "estimated_prep_time_hours": 3
}
\`\`\``,

  exercises: `Generate practical exercises in JSON format.

CUMULATIVE CONTEXT:
{cumulative_context}

PREVIOUS MATERIALS:
AGENDA: {agenda_content}
OBJECTIVES: {objectives_content}
SLIDES: {slides_content}

COURSE INFORMATION:
- Subject: {subject}
- Duration: {duration}
- Level: {level}
- Language: {language}

CRITICAL: Create exercises for concepts ALREADY introduced in Slides. NO new topics.

OUTPUT REQUIREMENTS:
Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:

{
  "exercises": [
    {
      "id": "EX1",
      "title": "Exercise Title",
      "type": "individual|group|pair|case_study|simulation|role_play",
      "duration_minutes": 20,
      "bloom_level": "Apply",
      "merrill_principle": "Application",
      "aligned_objectives": ["LO1", "LO2"],
      "aligned_session": 2,
      "description": "What participants will do",
      "instructions": [
        "Step-by-step instructions"
      ],
      "materials_needed": [
        "Required materials"
      ],
      "expected_outcomes": [
        "What participants should achieve"
      ],
      "success_criteria": [
        "How to evaluate success"
      ],
      "facilitator_notes": "Tips for running the exercise",
      "debriefing_questions": [
        "Questions to ask after exercise"
      ],
      "concepts_practiced": ["concept1", "concept2"]
    }
  ],
  "pedagogical_metadata": {
    "total_exercises": 8,
    "total_practice_time_minutes": 180,
    "bloom_levels_covered": ["Apply", "Analyze", "Evaluate"],
    "merrill_principles_covered": ["Application", "Integration", "Task-centered"],
    "bloom_coverage_percent": 75,
    "merrill_coverage_percent": 100,
    "concepts_coverage": 100
  }
}

VALIDATION RULES:
- Exercises must align with specific Learning Objectives
- Must use concepts from Slides only
- Duration must fit within Agenda time allocation
- Bloom coverage >= 60%, Merrill = 100%`,

  manual: `Generate a comprehensive participant manual in Markdown format.

CUMULATIVE CONTEXT:
{cumulative_context}

PREVIOUS MATERIALS:
AGENDA: {agenda_content}
OBJECTIVES: {objectives_content}
SLIDES: {slides_content}
EXERCISES: {exercises_content}

COURSE INFORMATION:
- Subject: {subject}
- Duration: {duration}
- Level: {level}
- Tone: {tone}
- Language: {language}

CRITICAL: Create a reference manual covering ALL content from previous materials. NO new topics.

OUTPUT FORMAT:
Create manual in Markdown with clear structure, then add JSON metadata at the end.

# Course Manual: [Title]

## Table of Contents
1. [Section 1]
2. [Section 2]
...

## Introduction
[Course overview, objectives, how to use this manual]

## Section 1: [Topic from Agenda]

**Learning Objectives:** LO1, LO2
**Bloom Level:** Understand, Apply
**Key Concepts:** concept1, concept2

### [Subsection]

[Detailed content with:
- Explanations
- Examples
- Diagrams (described in text)
- Key takeaways
- Self-check questions]

**Merrill's Principle - Activation:**
[How this connects to prior knowledge]

**Merrill's Principle - Demonstration:**
[Examples and non-examples]

**Merrill's Principle - Application:**
[Practice opportunities - reference exercises]

---

[Continue for all sections from Agenda...]

---

## Quick Reference Guide
[Summary of key concepts, formulas, checklists]

---

## PEDAGOGICAL_METADATA
\`\`\`json
{
  "total_pages_estimated": 50,
  "total_sections": 8,
  "bloom_coverage_percent": 100,
  "merrill_coverage_percent": 100,
  "self_check_questions": 25,
  "practical_examples": 30,
  "terminology_consistency": 100
}
\`\`\``,

  assessment: `Generate comprehensive assessment materials in JSON format.

CUMULATIVE CONTEXT:
{cumulative_context}

PREVIOUS MATERIALS:
AGENDA: {agenda_content}
OBJECTIVES: {objectives_content}
SLIDES: {slides_content}
EXERCISES: {exercises_content}
MANUAL: {manual_content}

COURSE INFORMATION:
- Subject: {subject}
- Level: {level}
- Language: {language}

CRITICAL: Assess ONLY content covered in previous materials. NO new topics.

OUTPUT REQUIREMENTS:
Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:

{
  "assessments": {
    "pre_assessment": {
      "title": "Pre-Course Knowledge Check",
      "duration_minutes": 15,
      "questions": [
        {
          "id": "PRE1",
          "type": "multiple_choice|true_false|short_answer|scenario",
          "question": "Question text",
          "options": ["A", "B", "C", "D"],
          "correct_answer": "B",
          "bloom_level": "Remember",
          "aligned_objective": "LO1",
          "explanation": "Why this is correct"
        }
      ]
    },
    "formative_assessments": [
      {
        "title": "Session 1 Check",
        "timing": "After Session 1",
        "duration_minutes": 10,
        "questions": [...]
      }
    ],
    "final_assessment": {
      "title": "Final Course Assessment",
      "duration_minutes": 45,
      "passing_score_percent": 70,
      "questions": [
        {
          "id": "FINAL1",
          "type": "scenario_based|case_study|practical_task",
          "question": "Complex scenario or task",
          "bloom_level": "Analyze|Evaluate|Create",
          "merrill_principle": "Integration",
          "aligned_objectives": ["LO3", "LO5"],
          "rubric": {
            "criteria": [
              {
                "criterion": "What to evaluate",
                "points": 10,
                "descriptors": {
                  "excellent": "Description",
                  "good": "Description",
                  "fair": "Description",
                  "poor": "Description"
                }
              }
            ]
          },
          "concepts_assessed": ["concept1", "concept2"]
        }
      ]
    },
    "pedagogical_metadata": {
      "total_assessment_items": 40,
      "bloom_distribution": {
        "Remember": 8,
        "Understand": 10,
        "Apply": 12,
        "Analyze": 6,
        "Evaluate": 3,
        "Create": 1
      },
      "merrill_coverage_percent": 100,
      "bloom_coverage_percent": 100,
      "objectives_coverage_percent": 100,
      "reliability_coefficient": 0.85
    }
  }
}

VALIDATION RULES:
- Each question must align with specific Learning Objective
- Must assess concepts from Manual/Slides only
- Higher Bloom levels (Analyze/Evaluate/Create) in final assessment
- Bloom coverage >= 60%, Merrill = 100%
- 100% Learning Objectives coverage`,

  resources: `Generate additional learning resources in JSON format.

CUMULATIVE CONTEXT:
{cumulative_context}

PREVIOUS MATERIALS:
AGENDA: {agenda_content}
OBJECTIVES: {objectives_content}
ALL MATERIALS SUMMARY: {materials_summary}

COURSE INFORMATION:
- Subject: {subject}
- Level: {level}
- Language: {language}

CRITICAL: Provide resources that SUPPLEMENT content already covered. NO new topics.

OUTPUT REQUIREMENTS:
Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:

{
  "resources": {
    "readings": [
      {
        "id": "READ1",
        "title": "Resource Title",
        "type": "article|book_chapter|case_study|whitepaper",
        "author": "Author Name",
        "description": "What this resource covers",
        "relevance": "How it relates to course content",
        "aligned_objectives": ["LO1", "LO2"],
        "bloom_level": "Understand",
        "estimated_time_minutes": 30,
        "difficulty": "beginner|intermediate|advanced",
        "url": "URL if available",
        "key_concepts": ["concept1", "concept2"]
      }
    ],
    "videos": [
      {
        "id": "VID1",
        "title": "Video Title",
        "duration_minutes": 15,
        "description": "What the video covers",
        "aligned_sessions": [1, 2],
        "merrill_principle": "Demonstration",
        "key_concepts": ["concept1"]
      }
    ],
    "tools_templates": [
      {
        "id": "TOOL1",
        "title": "Tool/Template Name",
        "type": "checklist|template|worksheet|calculator",
        "description": "What it helps with",
        "aligned_objectives": ["LO3"],
        "merrill_principle": "Application",
        "when_to_use": "During/after course"
      }
    ],
    "practice_exercises": [
      {
        "id": "PRAC1",
        "title": "Additional Practice",
        "difficulty": "beginner|intermediate|advanced",
        "bloom_level": "Apply",
        "estimated_time_minutes": 30,
        "concepts_practiced": ["concept1"]
      }
    ],
    "glossary": [
      {
        "term": "Term from course",
        "definition": "Clear definition",
        "example": "Usage example",
        "related_terms": ["term2"]
      }
    ],
    "pedagogical_metadata": {
      "total_resources": 25,
      "bloom_coverage_percent": 83,
      "merrill_coverage_percent": 100,
      "estimated_total_study_hours": 10,
      "concepts_coverage": 100,
      "objectives_coverage": 100
    }
  }
}

VALIDATION RULES:
- All resources must relate to course content
- Glossary must include ALL key terms from course
- Bloom coverage >= 60%, Merrill = 100%
- 100% concepts and objectives coverage`
};

// Validation function
function validateAndParseJSON(content: string, materialType: string, cumulativeContext: CumulativeContext): ValidationResult {
  const result: ValidationResult = {
    level: 'PASS',
    errors: [],
    warnings: []
  };

  try {
    let jsonData: any;
    
    // Extract JSON from markdown if needed
    if (materialType === 'slides' || materialType === 'trainer_notes' || materialType === 'manual') {
      const jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (!jsonMatch) {
        result.errors.push('CRITICAL: No JSON metadata found in markdown content');
        result.level = 'CRITICAL';
        return result;
      }
      jsonData = JSON.parse(jsonMatch[1]);
      result.metadata = jsonData;
    } else {
      // Parse full JSON for structured materials
      jsonData = JSON.parse(content);
      result.metadata = jsonData.pedagogical_metadata || jsonData[materialType]?.pedagogical_metadata;
    }

    // Validate Bloom coverage
    const bloomCoverage = result.metadata?.bloom_coverage_percent || 0;
    if (bloomCoverage < 60) {
      result.errors.push(`WARNING: Bloom coverage is ${bloomCoverage}% (minimum 60% required)`);
      result.level = 'WARNING';
    } else if (bloomCoverage < 70) {
      result.warnings.push(`Bloom coverage is ${bloomCoverage}% - consider improving to 70%+`);
      if (result.level === 'PASS') result.level = 'WARNING';
    }

    // Validate Merrill coverage
    const merrillCoverage = result.metadata?.merrill_coverage_percent || 0;
    if (merrillCoverage < 100) {
      result.errors.push(`WARNING: Merrill coverage is ${merrillCoverage}% (must be 100% - all 5 principles required)`);
      result.level = 'WARNING';
    }

    // Validate terminology consistency (for materials after agenda)
    if (cumulativeContext.terminology.length > 0 && materialType !== 'agenda') {
      const terminologyMatch = result.metadata?.terminology_consistency || 100;
      if (terminologyMatch < 100) {
        result.warnings.push(`Terminology consistency is ${terminologyMatch}% - some terms may not match previous materials`);
        if (result.level === 'PASS') result.level = 'WARNING';
      }
    }

    // Material-specific validations
    if (materialType === 'objectives') {
      const objectivesData = jsonData.objectives || jsonData;
      if (!objectivesData.learning_outcomes || objectivesData.learning_outcomes.length === 0) {
        result.errors.push('CRITICAL: No learning outcomes defined');
        result.level = 'CRITICAL';
      }
    }

    if (materialType === 'exercises') {
      const exercisesData = jsonData.exercises || jsonData;
      if (!Array.isArray(exercisesData) || exercisesData.length === 0) {
        result.errors.push('WARNING: No exercises generated');
        result.level = 'WARNING';
      }
    }

    if (materialType === 'assessment') {
      const assessmentData = jsonData.assessments || jsonData;
      if (!assessmentData.final_assessment) {
        result.errors.push('CRITICAL: No final assessment defined');
        result.level = 'CRITICAL';
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
    result.errors.push(`CRITICAL: JSON parsing error - ${errorMessage}`);
    result.level = 'CRITICAL';
  }

  return result;
}

// Build cumulative context from previous materials
function buildCumulativeContext(generatedContent: { [key: string]: string }): CumulativeContext {
  const context: CumulativeContext = {
    terminology: [],
    key_concepts: [],
    bloom_levels_used: [],
    learning_outcomes: [],
    duration_constraints: {
      total_minutes: 0,
      allocated_minutes: 0,
      remaining_minutes: 0
    },
    forbidden_new_topics: false,
    materials_summary: {}
  };

  // Extract from agenda
  if (generatedContent['agenda']) {
    try {
      const agendaData = JSON.parse(generatedContent['agenda']);
      const agenda = agendaData.agenda || agendaData;
      
      context.duration_constraints.total_minutes = agenda.total_duration_minutes || 0;
      context.forbidden_new_topics = true; // After agenda, no new topics allowed
      
      // Extract topics/concepts from agenda
      if (agenda.sessions) {
        agenda.sessions.forEach((session: any) => {
          if (session.topics) {
            session.topics.forEach((topic: any) => {
              context.key_concepts.push(topic.title);
              context.terminology.push(topic.title);
            });
          }
          if (session.bloom_levels) {
            context.bloom_levels_used.push(...session.bloom_levels);
          }
        });
      }

      context.materials_summary['agenda'] = {
        content_preview: `${agenda.sessions?.length || 0} sessions, ${agenda.total_duration_minutes || 0} minutes total`,
        key_points: context.key_concepts.slice(0, 5)
      };
    } catch (error) {
      console.error('Error parsing agenda for context:', error);
    }
  }

  // Extract from objectives
  if (generatedContent['objectives']) {
    try {
      const objectivesData = JSON.parse(generatedContent['objectives']);
      const objectives = objectivesData.objectives || objectivesData;
      
      if (objectives.learning_outcomes) {
        objectives.learning_outcomes.forEach((outcome: any) => {
          context.learning_outcomes.push(outcome.statement);
          if (outcome.bloom_level) {
            context.bloom_levels_used.push(outcome.bloom_level);
          }
        });
      }

      context.materials_summary['objectives'] = {
        content_preview: `${objectives.learning_outcomes?.length || 0} learning outcomes`,
        key_points: context.learning_outcomes.slice(0, 3)
      };
    } catch (error) {
      console.error('Error parsing objectives for context:', error);
    }
  }

  // Extract from slides
  if (generatedContent['slides']) {
    try {
      const jsonMatch = generatedContent['slides'].match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        const metadata = JSON.parse(jsonMatch[1]);
        if (metadata.key_concepts) {
          context.key_concepts.push(...metadata.key_concepts);
          context.terminology.push(...metadata.key_concepts);
        }
      }
    } catch (error) {
      console.error('Error parsing slides metadata for context:', error);
    }
  }

  // Remove duplicates
  context.terminology = [...new Set(context.terminology)];
  context.key_concepts = [...new Set(context.key_concepts)];
  context.bloom_levels_used = [...new Set(context.bloom_levels_used)];

  return context;
}

// Translation function (simple placeholder - can be enhanced with translation API)
async function translateContent(content: string, targetLanguage: string, geminiApiKey: string): Promise<string> {
  // If target language is English, no translation needed
  if (targetLanguage.toLowerCase() === 'en' || targetLanguage.toLowerCase() === 'english') {
    return content;
  }

  try {
    const translationPrompt = `Translate the following educational content to ${targetLanguage}. Maintain all formatting, JSON structure, and markdown syntax. Only translate the actual text content, not technical terms, JSON keys, or markdown syntax.

Content to translate:
${content}`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + geminiApiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: translationPrompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
        }
      }),
    });

    if (!response.ok) {
      console.error('Translation failed, using original content');
      return content;
    }

    const data = await response.json();
    const translated = data.candidates[0]?.content?.parts[0]?.text;
    return translated || content;

  } catch (error) {
    console.error('Translation error:', error);
    return content; // Return original if translation fails
  }
}

// Helper function to generate single material
async function generateSingleMaterial(supabase: any, course: any, material: any, geminiApiKey: string, generatedContent: { [key: string]: string }) {
  try {
    console.log(`Starting generation for ${material.material_type}...`);

    // Update material status
    await supabase
      .from('course_materials')
      .update({ status: 'generating' })
      .eq('id', material.id);

    // Update pipeline
    await supabase
      .from('generation_pipelines')
      .update({ 
        current_material_id: material.id,
        status: 'running',
        waiting_for_approval: false
      })
      .eq('course_id', course.id);

    // Build cumulative context
    const cumulativeContext = buildCumulativeContext(generatedContent);
    const contextString = JSON.stringify(cumulativeContext, null, 2);

    // Get prompt template
    const promptTemplate = PROMPTS[material.material_type as keyof typeof PROMPTS];
    if (!promptTemplate) {
      throw new Error(`No prompt template found for material type: ${material.material_type}`);
    }

    // Build prompt with course data and cumulative context
    const participantLabel = course.participant_type || 'participants';
    let prompt = promptTemplate
      .replace(/{cumulative_context}/g, contextString)
      .replace(/{title}/g, course.title)
      .replace(/{subject}/g, course.subject)
      .replace(/{duration}/g, course.duration)
      .replace(/{level}/g, course.level)
      .replace(/{environment}/g, course.environment)
      .replace(/{participants}/g, participantLabel)
      .replace(/{tone}/g, course.tone)
      .replace(/{language}/g, course.language);

    // Replace previous materials content
    for (const [key, content] of Object.entries(generatedContent)) {
      const placeholder = `{${key}_content}`;
      const preview = content.substring(0, 2000); // Limit context size
      prompt = prompt.replace(new RegExp(placeholder, 'g'), preview);
    }

    // Replace materials summary placeholder
    prompt = prompt.replace(/{materials_summary}/g, JSON.stringify(cumulativeContext.materials_summary, null, 2));

    console.log(`Calling Gemini API for ${material.material_type}...`);

    // Generate with Gemini using system prompt
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + geminiApiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ 
            text: `${UNIVERSAL_SYSTEM_PROMPT}\n\n${prompt}` 
          }] 
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', response.status, errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid Gemini response:', JSON.stringify(data, null, 2));
      throw new Error('Invalid response from Gemini API');
    }

    let generatedText = data.candidates[0].content.parts[0].text;

    console.log(`Generated ${generatedText.length} characters, validating...`);

    // Validate output
    const validation = validateAndParseJSON(generatedText, material.material_type, cumulativeContext);

    console.log(`Validation result: ${validation.level}`, {
      errors: validation.errors,
      warnings: validation.warnings
    });

    // Block at WARNING level as requested
    if (validation.level === 'WARNING' || validation.level === 'CRITICAL') {
      const errorMessage = `Generation blocked - ${validation.level}:\n${validation.errors.join('\n')}\n${validation.warnings.join('\n')}`;
      
      await supabase
        .from('course_materials')
        .update({ 
          status: 'failed',
          content: generatedText // Save for review
        })
        .eq('id', material.id);

      await supabase
        .from('generation_pipelines')
        .update({ 
          status: 'failed',
          error_message: errorMessage,
          waiting_for_approval: false
        })
        .eq('course_id', course.id);

      throw new Error(errorMessage);
    }

    // Translate if needed
    if (course.language && course.language.toLowerCase() !== 'en' && course.language.toLowerCase() !== 'english') {
      console.log(`Translating to ${course.language}...`);
      generatedText = await translateContent(generatedText, course.language, geminiApiKey);
    }

    // Save generated content
    await supabase
      .from('course_materials')
      .update({ 
        content: generatedText,
        status: 'completed',
        approval_status: 'pending'
      })
      .eq('id', material.id);

    // Update pipeline to waiting for approval
    await supabase
      .from('generation_pipelines')
      .update({ 
        waiting_for_approval: true,
        status: 'running'
      })
      .eq('course_id', course.id);

    console.log(`Generated ${material.material_type} successfully`);

    // Store in generatedContent for context
    generatedContent[material.material_type] = generatedText;

  } catch (error) {
    console.error(`Error generating ${material.material_type}:`, error);
    
    await supabase
      .from('course_materials')
      .update({ status: 'failed' })
      .eq('id', material.id);

      await supabase
        .from('generation_pipelines')
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('course_id', course.id);
      
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseId, continueGeneration, materialType } = await req.json();

    if (!courseId) {
      throw new Error('Course ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get course data
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError) throw courseError;

    // Get all generated materials for context
    const { data: existingMaterials } = await supabase
      .from('course_materials')
      .select('material_type, content')
      .eq('course_id', courseId)
      .eq('status', 'completed');

    const generatedContent: { [key: string]: string } = {};
    existingMaterials?.forEach(m => {
      if (m.content) {
        generatedContent[m.material_type] = m.content;
      }
    });

    // For step-by-step generation (default behavior now)
    if (continueGeneration !== false) {
      const { data: nextMaterial, error: materialError } = await supabase
        .from('course_materials')
        .select('*')
        .eq('course_id', courseId)
        .or('status.eq.pending,status.eq.rejected,approval_status.eq.rejected')
        .order('step_order')
        .limit(1)
        .single();

      if (materialError || !nextMaterial) {
        return new Response(
          JSON.stringify({ error: 'No materials to generate' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate single material
      await generateSingleMaterial(supabase, course, nextMaterial, geminiApiKey, generatedContent);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Generated ${nextMaterial.material_type}`,
          materialId: nextMaterial.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Bulk generation not recommended with new system, but keep for compatibility
    return new Response(
      JSON.stringify({ 
        error: 'Bulk generation not supported. Use step-by-step generation with continueGeneration=true' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Generation error:', error);

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
