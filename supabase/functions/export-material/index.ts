// Deno Edge Function: Export material content to DOCX or PPTX and upload to Supabase Storage
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "https://esm.sh/worktop/cors@^0.8.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Document, Packer, Paragraph } from "npm:docx@8.0.0";
import PptxGenJS from "npm:pptxgenjs@3.12.0";

type ExportRequest = {
  materialId: string;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BUCKET = "exports";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { materialId }: ExportRequest = await req.json();
    if (!materialId) {
      return new Response(JSON.stringify({ error: "Missing materialId" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { data: material, error } = await supabase
      .from("course_materials")
      .select("id, course_id, title, content, material_type")
      .eq("id", materialId)
      .maybeSingle();

    if (error || !material) {
      throw new Error("Material not found");
    }

    const isSlides = material.material_type === "slides";
    const ext = isSlides ? ".pptx" : ".docx";

    let bytes: Uint8Array;

    if (isSlides) {
      // Basic PPTX generation: split content into slides by headings
      const pptx = new PptxGenJS();
      pptx.title = material.title;
      const sections = (material.content || "").split(/\n#+\s+/).filter(Boolean);
      if (sections.length === 0) {
        // Fallback: single slide
        const slide = pptx.addSlide();
        slide.addText(material.title || "Slides", { x: 0.5, y: 0.5, fontSize: 28, bold: true });
        slide.addText((material.content || "No content").substring(0, 2000), { x: 0.5, y: 1.3, fontSize: 16 });
      } else {
        for (const sec of sections) {
          const slide = pptx.addSlide();
          const [firstLine, ...rest] = sec.split("\n");
          slide.addText(firstLine.trim(), { x: 0.5, y: 0.5, fontSize: 28, bold: true });
          const body = rest.join("\n").trim();
          if (body) {
            slide.addText(body.substring(0, 2000), { x: 0.5, y: 1.3, fontSize: 16 });
          }
        }
      }
      const arrayBuffer = await pptx.write("arraybuffer");
      bytes = new Uint8Array(arrayBuffer);
    } else {
      // DOCX generation from plain text content
      const paragraphs = (material.content || "")
        .split("\n")
        .map((line) => new Paragraph({ text: line }));
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [new Paragraph({ text: material.title || "Document", heading: "Title" }), ...paragraphs],
          },
        ],
      });
      bytes = await Packer.toUint8Array(doc);
    }

    // Ensure bucket exists
    try {
      await supabase.storage.createBucket(BUCKET, { public: true });
    } catch (_) {
      // ignore if exists
    }

    const filePath = `${material.course_id}/${material.id}${ext}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, bytes, {
      contentType: isSlides ? "application/vnd.openxmlformats-officedocument.presentationml.presentation" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      upsert: true,
    });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    const downloadUrl = publicUrlData.publicUrl;

    await supabase
      .from("course_materials")
      .update({ file_path: `${BUCKET}/${filePath}`, download_url: downloadUrl })
      .eq("id", material.id);

    return new Response(JSON.stringify({ download_url: downloadUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("export-material error", err);
    return new Response(JSON.stringify({ error: "Export failed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});