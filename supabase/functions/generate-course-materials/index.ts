import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CourseData {
  id: string;
  subject: string;
  duration: string;
  level: string;
  environment: string;
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseId } = await req.json();

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

    // Get generation steps
    const { data: steps, error: stepsError } = await supabase
      .from('generation_steps')
      .select('*')
      .eq('is_active', true)
      .order('step_order');

    if (stepsError) throw stepsError;

    // Update pipeline status to running
    await supabase
      .from('generation_pipelines')
      .update({ 
        status: 'running',
        current_step: 1 
      })
      .eq('course_id', courseId);

    // Update course status
    await supabase
      .from('courses')
      .update({ status: 'generating' })
      .eq('id', courseId);

    console.log(`Starting generation for course: ${course.title}`);

    // Process each step
    const generatedContent: { [key: string]: string } = {};
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const progressPercent = Math.round(((i + 1) / steps.length) * 100);

      console.log(`Processing step ${step.step_order}: ${step.step_name}`);

      try {
        // Update pipeline progress
        await supabase
          .from('generation_pipelines')
          .update({ 
            current_step: step.step_order,
            progress_percent: progressPercent
          })
          .eq('course_id', courseId);

        // Update material status to generating
        await supabase
          .from('course_materials')
          .update({ status: 'generating' })
          .eq('course_id', courseId)
          .eq('material_type', step.material_type);

        // Build prompt with dependencies
        let prompt = step.ai_prompt_template;
        
        // Replace course variables
        prompt = prompt.replace(/{subject}/g, course.subject);
        prompt = prompt.replace(/{duration}/g, course.duration);
        prompt = prompt.replace(/{level}/g, course.level);
        prompt = prompt.replace(/{environment}/g, course.environment);
        prompt = prompt.replace(/{tone}/g, course.tone);
        prompt = prompt.replace(/{language}/g, course.language);

        // Replace dependency content
        for (const dependency of step.dependencies) {
          if (generatedContent[dependency]) {
            const placeholder = `{${dependency}_content}`;
            prompt = prompt.replace(new RegExp(placeholder, 'g'), generatedContent[dependency]);
          }
        }

        console.log(`Generating content with Gemini for: ${step.material_type}`);

        // Generate content with Gemini
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + geminiApiKey, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH", 
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
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

        const generatedText = data.candidates[0].content.parts[0].text;
        generatedContent[step.step_name] = generatedText;

        console.log(`Generated ${generatedText.length} characters for ${step.material_type}`);

        // Save the generated content
        await supabase
          .from('course_materials')
          .update({ 
            content: generatedText,
            status: 'completed' 
          })
          .eq('course_id', courseId)
          .eq('material_type', step.material_type);

        console.log(`Completed step ${step.step_order}: ${step.step_name}`);

      } catch (stepError) {
        console.error(`Error in step ${step.step_order}:`, stepError);
        
        // Mark material as failed
        await supabase
          .from('course_materials')
          .update({ 
            status: 'failed'
          })
          .eq('course_id', courseId)
          .eq('material_type', step.material_type);

        // Continue with next step instead of failing entire generation
        continue;
      }
    }

    // Update final status
    await supabase
      .from('generation_pipelines')
      .update({ 
        status: 'completed',
        progress_percent: 100 
      })
      .eq('course_id', courseId);

    await supabase
      .from('courses')
      .update({ status: 'completed' })
      .eq('id', courseId);

    console.log(`Course generation completed: ${course.title}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Course materials generated successfully' 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Generation error:', error);

    // Try to update pipeline status on error
    try {
      const { courseId } = await req.json().catch(() => ({}));
      if (courseId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('generation_pipelines')
          .update({ 
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error' 
          })
          .eq('course_id', courseId);

        await supabase
          .from('courses')
          .update({ status: 'failed' })
          .eq('id', courseId);
      }
    } catch (updateError) {
      console.error('Error updating status:', updateError);
    }

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