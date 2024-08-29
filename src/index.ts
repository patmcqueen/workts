/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
	AI: any;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

app.get('/', (c) => {
	return c.html(`
  <html>
    <head>
      <style>
        body {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          font-family: Arial, sans-serif;
        }
        h1 {
          font-size: 3rem;
          margin-bottom: 20px;
        }
        .logo {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 200px;
          height: auto;
        }
        #chatbox {
          width: 300px;
          height: 200px;
          border: 1px solid #ccc;
          overflow-y: scroll;
          margin-bottom: 10px;
          padding: 10px;
        }
        input[type="text"] {
          padding: 10px;
          font-size: 1rem;
          width: 300px;
        }
        #sendButton {
          padding: 10px;
          font-size: 1rem;
          cursor: pointer;
        }
        #sendButton:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
      </style>
    </head>
    <body>
      <img src="https://www.cloudflare.com/img/logo-cloudflare-dark.svg" alt="Cloudflare Logo" class="logo">
      <h1>Hello Cloudflare!</h1>
      <div id="chatbox"></div>
      <input type="text" id="userInput" placeholder="Would you like to play a game?">
      <button id="sendButton">Send</button>
      <script>
        const chatbox = document.getElementById('chatbox');
        const userInput = document.getElementById('userInput');
        const sendButton = document.getElementById('sendButton');

        sendButton.addEventListener('click', sendMessage);
        userInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') sendMessage();
        });

        function sendMessage() {
          const message = userInput.value.trim();
          if (message) {
            appendMessage('You: ' + message);
            sendButton.disabled = true;
            sendButton.textContent = 'Thinking...';
            fetch('/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message })
            })
            .then(response => response.text())
            .then(aiResponse => {
              appendMessage('AI: ' + aiResponse);
            })
            .catch(error => {
              console.error('Error:', error);
              appendMessage('AI: Sorry, there was an error processing your request.');
            })
            .finally(() => {
              sendButton.disabled = false;
              sendButton.textContent = 'Send';
            });
            userInput.value = '';
          }
        }

        function appendMessage(message) {
          const messageElement = document.createElement('div');
          messageElement.textContent = message;
          chatbox.appendChild(messageElement);
          chatbox.scrollTop = chatbox.scrollHeight;
        }
      </script>
    </body>
  </html>
`)
});

app.post('/chat', async (c) => {
  const { message } = await c.req.json();
  const AI = c.env.AI;

  try {
    const response = await AI.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [{ role: 'user', content: message }],
      stream: false,
    });

    return c.text(response.response);
  } catch (error) {
    console.error('AI Error:', error);
    return c.text('Sorry, I encountered an error while processing your request.', 500);
  }
});

export default app;