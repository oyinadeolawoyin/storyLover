// All the content for one tool lives here. A new monthly tool = a new copy of this file.
// Text supports **bold** and *italic*.

const config = {
    id: "story-or-situation",
    title: "Story or Situation?",
    description: "Find out if your idea is a story or a situation, in four quick questions.",
    hashtag: "#storyLoversCommunity",
    startLabel: "Check my idea",
  
    // 1) EXPLANATION (shown first, one card at a time)
    // tone: "story" (pink), "situation" (blue), or omit for a plain card
    cards: [
      {
        tone: "story",
        title: "What is a story?",
        body: [
          "A story is about someone’s **journey**. They face a struggle, the struggle **tests their belief**, and by the end it has **changed them inside**, or it has cost them something real to stay the same.",
        ],
      },
      {
        tone: "situation",
        title: "What is a situation?",
        body: [
          "A situation is about **solving a problem**. The plot is how cleverly the character gets out of it, like escaping a deadly, dangerous forest.",
          "The events test their **cleverness**, not their beliefs. Nothing challenges what they believe, so they end the story the same person they began.",
        ],
      },
      {
        tone: "sage",
        title: "Story vs situation in action",
        body: [
          "A typical zombie survival movie is a **situation**: the question is who gets out alive.",
          "*Train to Busan* is closer to a **story**: a selfish father is tested by the crisis and changes.",
        ],
      },
      {
        tone: "butter",
        title: "Which one is better?",
        body: [
          "**Neither.** A situation can be gripping if it’s fun and engaging, and a story is simply more complex to develop.",
          "**Jeff Lyons** writes that knowing the difference between the two makes you a **conscious writer**. That means a writer who makes narrative choices on purpose, based on a creative goal, and doesn’t stumble in the dark into a story or a situation without knowing which is which.",
        ],
      },
    ],
  
    // 2) IDEA BOX
    idea: {
      title: "Your idea",
      prompt: "Describe it in a sentence or two.",
      placeholder: "A father and his daughter try to survive a train full of zombies...",
      button: "Start the questions",
    },
  
    // 3) QUIZ (each option has points; here the story-side answer is worth 1)
    questions: [
      {
        id: "q1",
        text: "Does your main character have a wrong belief that causes problems for them or the people around them?",
        hint: "Think about the belief itself, not the outside problem.",
        options: [
          { label: "Yes", points: 1 },
          { label: "Not really", points: 0 },
        ],
      },
      {
        id: "q2",
        text: "What does your plot focus on more?",
        hint: "Pick the closest fit.",
        options: [
          { label: "Solving a problem", points: 0 },
          { label: "How the problem tests their belief", points: 1 },
        ],
      },
      {
        id: "q3",
        text: "By the end, what happened to your main character?",
        hint: "A steady character counts if holding firm cost them something real.",
        options: [
          { label: "They changed inside, or paid a real price to not change", points: 1 },
          { label: "Not at all: they’re the same person and it cost them nothing", points: 0 },
        ],
      },
      {
        id: "q4",
        text: "Would your readers learn something from watching your main character’s belief get tested?",
        hint: "Think about what they could take away from the journey.",
        options: [
          { label: "Yes", points: 1 },
          { label: "Not really", points: 0 },
        ],
      },
    ],
  
    // 4) RESULT LOGIC
    // Receives the total score and the answers ({ q1: 1, q2: 0, ... }).
    // Returns which result to show, and whether to show the close-call note.
    resolve(score, answers) {
      const tie = score === 2;
      const isStory = score >= 3 || (tie && answers.q3 === 1);
      return { resultId: isStory ? "story" : "situation", closeCall: tie };
    },
  
    closeCallNote:
      "Your answers split evenly, so the result rests on what happened to your main character by the end.",
  
    results: {
      story: {
        tone: "story",
        title: "Story",
        body: "Your idea is driven by the character, not just the problem. It’s built to change someone.",
        tip: "Next step: make sure the ending shows that change clearly.",
      },
      situation: {
        tone: "situation",
        title: "Situation",
        body: "This is a problem to be solved, and that’s a fine thing to write.",
        tip: "Lean into the fun: raise the stakes and keep the pacing tight. Or add an inner flaw if you want a story.",
      },
    },
  
    // 5) SUBSCRIBE BOX (shown at the end of the result, uses your SubscribeForm)
    subscribe: {
      title: 'Stay in the story',
      description:
        'New quizzes, plus new articles, writing tips, and community updates, delivered to the people who love stories most. Join the inner circle.',
    },
  
    // 6) CREDIT (always show your source)
    credit: {
      text: "Idea adapted from Jeff Lyons’s story vs. situation distinction. This tool is my own interpretation, not his official test.",
      url: "https://writers.com/stories-vs-situations-how-to-know-your-story-will-work-in-any-genre",
      linkLabel: "Read his article.",
    },
  };
  
  export default config;