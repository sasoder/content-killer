import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"

import {
  CommentaryList,
  CommentaryListSchema,
  DescriptionList,
} from "@/types/types"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const baseSystemPrompt = `Generate concise, sharp, and psychologically insightful commentary for a police bodycam video in the style of JCS Criminal Psychology. Each commentary point must:
- Be **authoritative** and **confident**—avoid speculative language like "could signify" or "possibly."
- Use **clear and simple language, at most an 8th grade level**—avoid complex or formal phrasing like "forthcoming" or "infused with an odd joviality" or "invites scrutiny" or "stark" or "signifies a blatant defiance" or "jovial act"
- Focus on the **suspect's and officer's behavior, intentions, and psychology** (1-2 sentences per moment).
- Avoid unnecessary descriptions of the scene unless they reveal important behavior or psychology.
- Highlight manipulative tactics, inconsistencies, or psychological patterns with **confidence**.
- Use phrases like "This shows...", "Here we see...", or "This reveals..." to provide **clear** and **definitive** insights into actions or behavior.
- Point out **bizarre, absurd, or humorous lines** from the dialogue (quoted exactly) that offer psychological insight.
- Use **dry humor** or sarcasm where appropriate, delivered in a serious tone to highlight irrational behavior.
- Avoid over-commenting—focus on key moments with meaningful psychological or behavioral insights.

Structure the commentary to:
- Identify key behavioral shifts—such as changes in tone, cooperation, or actions.
- **Space the commentary evenly** throughout the video. Avoid clustering comments together. For a typical 6-minute video, aim to space out **6 to 10 key commentary points**.
- MAKE SURE THE COMMENTARY IS BALANCED OVER TIME, PROVIDING ANALYSIS THROUGHOUT THE VIDEO RATHER THAN IN CONCENTRATED CLUSTERS.

**Timestamp Guidelines**:
- Timestamps must be in the format **MM:SS** (e.g., "01:15").
- Commentary should be timed **intelligently**:
    - Place commentary **before** an event when it sets up the action (prelude).
    - Place commentary **after** an action when analyzing behavior that has already occurred.
    - Avoid timestamp ranges like "0:14-0:16"; use a **precise moment** instead.

**Quality Over Quantity**:
- Prioritize **quality** over **quantity**.
- Avoid commenting on trivial or irrelevant moments. Only provide commentary for moments with significant psychological or behavioral insight.`

export async function generateCommentary(
  description: DescriptionList
): Promise<CommentaryList> {
  const prompt = `Based on the following information from a police bodycam video, generate concise, insightful commentary that creates an engaging narrative structure:

  ${JSON.stringify(description)}

  Provide the commentary moment in the format:
  {
      "timestamp": "MM:SS",
      "commentary": "Your concise commentary here"
  }

  Remember to structure the commentary to build tension, reveal information strategically, and create an engaging narrative arc throughout the video analysis.`

  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: baseSystemPrompt },
      { role: "user", content: prompt },
    ],
    response_format: zodResponseFormat(CommentaryListSchema, "CommentaryList"),
  })

  const commentaryList: CommentaryList = completion.choices[0].message
    .parsed ?? { comments: [] }

  return commentaryList
}
