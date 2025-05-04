
import { supabase } from "@/integrations/supabase/client";

/**
 * Generates dynamic guidance for a specific app by analyzing its code and purpose
 * @param projectId The ID of the generated app project
 * @param appData The app data including files, structure and purpose
 * @returns Promise with guidance message
 */
export async function generateDynamicGuidance(
  projectId: string,
  appData: any
): Promise<string> {
  try {
    // Prepare relevant app data for analysis
    const relevantData = {
      projectName: appData.projectName,
      description: appData.description,
      fileCount: appData.files?.length || 0,
      challenges: appData.challenges || [],
      projectId
    };

    // Sample of code files to analyze (limit to avoid token issues)
    const codeSamples = appData.files
      ?.slice(0, 5) // Limit to first 5 files for analysis
      .map((file: any) => ({
        path: file.path,
        snippet: file.content.substring(0, 500) // First 500 chars
      }));

    // Call Gemini API through Supabase edge function
    const { data, error } = await supabase.functions.invoke('generate-guidance', {
      body: { 
        projectData: relevantData,
        codeSamples,
        promptType: 'first-step'
      }
    });

    if (error) {
      console.error("Error generating guidance:", error);
      // Fallback to a simple guidance message
      return `# Let's start working on ${relevantData.projectName}!

I've analyzed the generated application and found several areas we can improve. This app is focused on ${relevantData.description}.

Let's start by exploring the code structure to get familiar with the application architecture. Then we can tackle the challenges one by one.

When you're ready, let me know and we'll start implementing the missing features.`;
    }

    return data.guidance;
  } catch (error) {
    console.error("Error in generateDynamicGuidance:", error);
    // Return fallback guidance
    return `# Let's improve this application

I've generated a starting point for your app. Let's explore the code and implement the missing features together.

What part of the application would you like to work on first?`;
  }
}
