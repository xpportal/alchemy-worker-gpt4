/*
 * Copyright 2023 SXP Digital, LLC
 *
 * This file is part of Alchemy Worker: https://github.com/xpportal/alchemy-worker.
 *
 * Alchemy Worker is free software: you can redistribute it and/or modify
 * it under the terms of the Mozilla Public License version 2.0 as
 * published by the Mozilla Foundation.
 *
 * Alchemy Worker is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * Mozilla Public License for more details.
 *
 * You should have received a copy of the Mozilla Public License
 * along with Alchemy Worker. If not, see <https://www.mozilla.org/en-US/MPL/2.0/>.
 *
 * Alternatively, the contents of this file may be used under the terms of the
 * GNU General Public License version 2.0 or (at your option) any later version,
 * in which case the provisions of the GNU General Public License version 2.0
 * or later shall apply instead of those above.
 *
 * If you wish to allow use of your version of this file only under the terms of
 * the GPL version 2.0, and not to allow others to use your version of this file
 * under the MPL, indicate your decision by deleting the provisions above and
 * replace them with the notice and other provisions required by the GPL version 2.0.
 * If you do not delete the provisions above, a recipient may use your version of
 * this file under either the MPL or the GPL version 2.0.
 */

async function handleRequest(request) {
	if (request.method === "OPTIONS") {
	  return handleOptions(request);
	} else {
	  return handleFetch(request);
	}
  }
  
  async function handleFetch(request) {
	// Extract the bearer token from the request headers
	const authorization = request.headers.get("Authorization");
	if (!authorization) {
	  return new Response("Unauthorized", { status: 401 });
	}
  
  const data = await request.json();
  console.log("data", data);
  const history = data.Input.messages ?? [];
  console.log("history", history);
  const lastUserMessage = history.length > 1 ? history[history.length - 2].split(": ")[1] : null;
  const lastAssistantMessage = history.length > 0 ? history[history.length - 1].split(": ")[1] : null;
  
	//let prompt = data.inputs.personality;
	let prompt = data.Input.personality;
	let finalPrompt = prompt
	  .replaceAll("#speaker", data.Input.Speaker)
	  .replaceAll("#input", data.Input.Input)
	  .replaceAll("#agent", data.Input.Agent)
	  .replaceAll("#conversation", data.Input.Conversation)
	  .replaceAll("undefined\n", "")
	  .replaceAll("undefined", "")
	  .slice(-5000);
  console.log("finalPrompt", finalPrompt);
	const token = authorization.split(" ")[1];
	console.log(data.Input);
  const messages = [
	{
	  "role": "system",
	  "content": data.Input.personality,
	},
	{
	  "content": "Hello, how are you?",
	  "role": "user",
	},
	{
	  "content": "I'm doing well! Excited to be with you here in the metaverse!",
	  "role": "assistant",
	},
  ];
  
  if (lastUserMessage) {
	messages.push({
	  "content": lastUserMessage,
	  "role": "user",
	});
  }
  
  if (lastAssistantMessage) {
	messages.push({
	  "content": lastAssistantMessage,
	  "role": "assistant",
	});
  }
  
  messages.push({
	"content": data.Input.Input,
	"role": "user",
  });
  
  const postData = {
	model: "gpt-4",
	messages,
	temperature: 0.7,
	max_tokens: 500,
	stop: "###",
  };

  // Make the request to the OpenAI API
  const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
	method: "POST",
	headers: {
	  "Content-Type": "application/json",
	  Authorization: `Bearer ${token}`,
	},
	body: JSON.stringify(postData),
  });
  
  // Process the response from the OpenAI API
  const gptData = await gptResponse.json();
  if (gptData.choices && gptData.choices.length > 0) {
	console.log(gptData.choices[0].text);
  } else {
	console.log("No completion found.", gptData);
  }
  
  // Return the results to the client
  const headers = {
	"Access-Control-Allow-Origin": "*",
	"Content-Type": "application/json",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  return new Response(JSON.stringify(gptData), { headers });
  }
  
  function handleOptions(request) {
	// Make sure the necessary headers are present
	// for this to be a valid pre-flight request
	const headers = {
	  "Access-Control-Allow-Origin": "*",
	  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	  "Access-Control-Allow-Headers": "Content-Type, Authorization",
	};
	return new Response(null, { headers });
  }
  
  addEventListener("fetch", (event) => {
	event.respondWith(handleRequest(event.request));
  });
  