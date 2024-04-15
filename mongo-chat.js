const OpenAI = require("openai");

const apiKey = "sk-<YOUR-API-KEY>";

const openai = new OpenAI({
  apiKey
});
 
input_data = [
  {
    collectionName: "users",
    data: [
      {
        name: "John Doe",
        age: 25,
        country: "India",
      },
      {
        name: "Jane Doe",
        age: 22,
        country: "USA",
      },
    ],
  },
  {
    collectionName: "books",
    data: [
      {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        year: 1925,
      },
      {
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        year: 1960,
      },
    ],
  },
  {
    collectionName: "orders",
    data: [
      {
        order_id: 1,
        user_id: 1,
        total: 100,
      },
      {
        order_id: 2,
        user_id: 2,
        total: 200,
      },
    ],
  },
];
 
/**
 * Create the chat
 */
async function startChat() {
  const assistant = await openai.beta.assistants.create({
    name: "Math Tutor",
    instructions: `You are a MongoDB expert
      with great expertise in writing MongoDB queries for any given data
      to produce an expected output. You have a premium account.`,
    tools: [{ type: "code_interpreter" }],
    model: "gpt-3.5-turbo-1106",
  });
 
  // Create thread
  const thread = await openai.beta.threads.create();
 
  await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: `Your task is to write a MongoDB Query,
      specifically an aggregation pipeline that would produce
      the expected output for the given input.
       
      You will always return a JSON response with the following fields.
       
      mongoDBQuery: Get me the total number of orders for each user.,
      and should contain the "db.collection.aggregate" prefix.
       
      queryExplanation: A detailed explanation for the query
      that was returned.
       
      Input data: ${JSON.stringify(this.input_data)}
      `,
  });
 
  let run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistant.id,
    instructions:
      "Please address the user as Jane Doe. The user has a premium account.",
  });
 
  // Poll the run every 2 seconds until it completes
  while (run.status !== "completed") {
    await new Promise((r) => setTimeout(r, 2000));
    run = await openai.beta.threads.runs.retrieve(thread.id, run.id);
  }
 
  if (run.status === "completed") {
    const messages = await openai.beta.threads.messages.list(run.thread_id);
    const response = messages.data.find(
      (message) => message.role === "assistant"
    ).content;
    console.log(response[0].text.value);
 
    // Extracting the JSON from the response
    const jsonText = response[0].text.value;
 
    // Parsing the JSON
    const extractedJSON = JSON.parse(
      jsonText.match(/\```json([\s\S]*)\```/)[1]
    );
 
    console.log(extractedJSON[0]);
 
    for (const message of messages.data.reverse()) {
      console.log(`${message.role} > ${message.content[0].text.value}`);
    }
    return new Response(JSON.stringify(messages));
  } else {
    console.log(run.status);
    new Response(JSON.stringify(run.status));
  }
}
 
  startChat();
 