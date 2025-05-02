
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface AnalyzeCodeRequest {
  projectId: string;
  files: Array<{
    path: string;
    content: string;
  }>;
  challengeInfo?: any;
}

interface AnalysisResult {
  success: boolean;
  feedback: string;
  suggestions: Array<{
    file: string;
    line?: number;
    suggestion: string;
    severity: 'info' | 'warning' | 'error';
  }>;
  overallScore?: number;
  error?: string;
}

serve(async (req) => {
  console.log("Analyze code function called");
  
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    console.log("Request data received");
    
    const { projectId, files, challengeInfo } = requestData as AnalyzeCodeRequest;

    if (!projectId || !files || files.length === 0) {
      console.error("Missing required parameters");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Project ID and files are required" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get the Gemini API key from environment variables
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      console.error("Gemini API key not configured");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Gemini API key not configured" 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Format files for the prompt
    const formattedFiles = files.map(file => {
      return `
File: ${file.path}
\`\`\`
${file.content}
\`\`\`
`;
    }).join("\n\n");
    
    // Format challenge info if available
    let challengePrompt = "";
    if (challengeInfo && challengeInfo.challenges) {
      challengePrompt = `
The project has the following challenges that the user should address:
${challengeInfo.challenges.map((c: any, i: number) => 
  `${i+1}. ${c.title} (${c.difficulty}): ${c.description}`
).join("\n")}
`;
    }

    // Call Gemini API for code analysis
    console.log("Calling Gemini API for code analysis");
    const geminiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert software engineer and educator providing feedback on a student's code for a learning platform.
            
The student is working on a project with ID: ${projectId}.
${challengePrompt}

Please analyze the following code files and provide constructive feedback:

${formattedFiles}

Provide your feedback in the following JSON format:
{
  "feedback": "Overall feedback on the code quality and approach",
  "suggestions": [
    {
      "file": "path/to/file.js",
      "line": 42,
      "suggestion": "Specific suggestion for improvement",
      "severity": "info | warning | error"
    }
  ],
  "overallScore": 85
}

The overall score should be between 0-100 based on:
- Code correctness and functionality (40%)
- Best practices and patterns (30%)
- Readability and maintainability (20%)
- Performance considerations (10%)

Your feedback should be educational, professional, and constructive. For each suggestion, provide clear guidance on how to improve the code.
`
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error(`Gemini API error (${geminiResponse.status}): ${errorText}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Gemini API error: ${geminiResponse.status}` 
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const geminiData = await geminiResponse.json();
    console.log("Gemini response received");
    
    if (!geminiData.candidates || geminiData.candidates.length === 0 || !geminiData.candidates[0].content) {
      console.error("Empty or invalid response from Gemini API");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Empty or invalid response from Gemini API" 
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Extract and parse JSON from Gemini response
    let analysisResult: AnalysisResult;
    try {
      const textContent = geminiData.candidates[0].content.parts[0].text;
      
      // Try to extract JSON from the response
      const jsonMatch = textContent.match(/```json\n([\s\S]*?)\n```/) || 
                      textContent.match(/{[\s\S]*"feedback"[\s\S]*}/);
      
      let jsonContent = textContent;
      if (jsonMatch) {
        jsonContent = jsonMatch[1] || jsonMatch[0];
      }
      
      analysisResult = JSON.parse(jsonContent.trim());
      console.log("Successfully parsed analysis data");
      
      // Ensure the result has the required structure
      if (!analysisResult.feedback || !analysisResult.suggestions) {
        throw new Error("Malformed analysis result");
      }
      
    } catch (jsonError) {
      console.error("Failed to parse JSON response:", jsonError);
      return new Response(JSON.stringify({ 
        success: false,
        error: "Failed to parse analysis data", 
        technicalDetails: `JSON parse error: ${jsonError.message}`
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Return the analysis result
    return new Response(JSON.stringify({
      success: true,
      ...analysisResult
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in analyze-code function:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
