import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData } = await req.json();
    
    if (!imageData) {
      return new Response(
        JSON.stringify({ error: "Missing image data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Call Lovable AI to analyze if the QR code is physical or a screenshot
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert at detecting whether a QR code in an image is being displayed on a physical screen/paper or if it's a screenshot/photo being held up to the camera. Analyze the image for: 1) Screen glare, reflections, and viewing angles that indicate a real physical display 2) Depth and perspective cues 3) Lighting variations across the surface 4) Moiré patterns that appear when photographing screens 5) Edge characteristics that differentiate physical displays from printed screenshots. Respond ONLY with 'PHYSICAL' if it appears to be scanned from a real screen/paper, or 'SCREENSHOT' if it appears to be a photo/screenshot of a QR code."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this QR code image and determine if it's being scanned from a physical display/paper or if it's a screenshot/photo. Respond with only 'PHYSICAL' or 'SCREENSHOT'."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please contact administrator." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI verification failed");
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim().toUpperCase();
    
    console.log("AI verification result:", result);

    const isPhysical = result === "PHYSICAL";

    return new Response(
      JSON.stringify({ 
        isPhysical,
        confidence: isPhysical ? "high" : "low",
        message: isPhysical 
          ? "QR code verified as physical" 
          : "Possible screenshot detected - please scan from the actual display"
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in verify-physical-qr:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
